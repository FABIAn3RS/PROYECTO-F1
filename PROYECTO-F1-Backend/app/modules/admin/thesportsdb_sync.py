"""Importación manual de datos públicos de F1 desde TheSportsDB."""

from datetime import datetime
from urllib.parse import urlencode
from urllib.request import urlopen
import json

from sqlalchemy.orm import Session

from app.config import THESPORTSDB_API_KEY, THESPORTSDB_BASE_URL
from app.modules.calendario.models import GranPremio
from app.modules.escuderias.models import Escuderia
from app.modules.pilotos.models import Piloto

F1_LEAGUE_ID = "4370"


def _obtener(ruta: str, **params) -> dict:
    query = urlencode(params)
    url = f"{THESPORTSDB_BASE_URL.rstrip('/')}/{THESPORTSDB_API_KEY}{ruta}?{query}"
    with urlopen(url, timeout=30) as respuesta:
        return json.loads(respuesta.read().decode("utf-8"))


def _es_gran_premio(evento: dict) -> bool:
    nombre = (evento.get("strEvent") or "").lower()
    return (
        "grand prix" in nombre
        and "practice" not in nombre
        and "qualifying" not in nombre
        and "sprint" not in nombre
    )


def _fecha(evento: dict) -> datetime:
    fecha = evento["dateEvent"]
    hora = (evento.get("strTime") or "00:00:00").replace("Z", "")
    return datetime.fromisoformat(f"{fecha}T{hora}")


def sincronizar_temporada(db: Session, temporada: int) -> dict[str, int]:
    """Crea exclusivamente registros nuevos; no pisa ajustes del administrador."""
    resumen = {"grandes_premios": 0, "escuderias": 0, "pilotos": 0}

    eventos = _obtener("/eventsseason.php", id=F1_LEAGUE_ID, s=temporada).get("events") or []
    for evento in filter(_es_gran_premio, eventos):
        ronda = evento.get("intRound")
        if not ronda or not evento.get("dateEvent"):
            continue
        if db.query(GranPremio).filter_by(temporada=temporada, ronda=int(ronda)).first():
            continue
        fecha_carrera = _fecha(evento)
        db.add(GranPremio(
            nombre=evento["strEvent"],
            pais=evento.get("strCountry") or "No especificado",
            circuito=evento.get("strVenue") or "No especificado",
            temporada=temporada,
            ronda=int(ronda),
            fecha_inicio=fecha_carrera,
            fecha_carrera=fecha_carrera,
        ))
        resumen["grandes_premios"] += 1

    equipos = _obtener("/search_all_teams.php", l="Formula_1").get("teams") or []
    equipos_f1 = [e for e in equipos if e.get("idLeague") == F1_LEAGUE_ID or e.get("strLeague") == "Formula 1"]
    for equipo in equipos_f1:
        nombre = equipo.get("strTeam")
        if not nombre:
            continue
        escuderia = db.query(Escuderia).filter_by(nombre=nombre, temporada=temporada).first()
        if not escuderia:
            color = equipo.get("strColour1")
            color = f"#{color}" if color and len(color) == 6 else None
            escuderia = Escuderia(
                nombre=nombre,
                nacionalidad=equipo.get("strCountry"),
                color=color,
                temporada=temporada,
                puntos_temporada=0,
            )
            db.add(escuderia)
            db.flush()
            resumen["escuderias"] += 1

        jugadores = _obtener("/lookup_all_players.php", id=equipo["idTeam"]).get("player") or []
        for jugador in jugadores:
            if jugador.get("strSport") != "Motorsport" or not jugador.get("strPlayer"):
                continue
            if db.query(Piloto).filter_by(nombre=jugador["strPlayer"], temporada=temporada).first():
                continue
            numero = jugador.get("strNumber")
            db.add(Piloto(
                nombre=jugador["strPlayer"],
                nacionalidad=jugador.get("strNationality"),
                numero=int(numero) if numero and numero.isdigit() else None,
                escuderia_id=escuderia.id,
                temporada=temporada,
                puntos_temporada=0,
            ))
            resumen["pilotos"] += 1

    db.commit()
    return resumen
