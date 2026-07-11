from datetime import datetime
import json
from urllib.parse import urlencode
from urllib.request import urlopen

from sqlalchemy.orm import Session

from app.config import THESPORTSDB_API_KEY, THESPORTSDB_BASE_URL
from app.modules.calendario.models import GranPremio
from app.modules.escuderias.models import Escuderia
from app.modules.pilotos.models import Piloto

F1_LEAGUE_ID = "4370"


def _obtener(ruta: str, **params) -> dict:
    url = f"{THESPORTSDB_BASE_URL.rstrip('/')}/{THESPORTSDB_API_KEY}{ruta}?{urlencode(params)}"
    with urlopen(url, timeout=30) as respuesta:
        return json.loads(respuesta.read().decode("utf-8"))


def _fecha(evento: dict) -> datetime:
    hora = (evento.get("strTime") or "00:00:00").replace("Z", "")
    return datetime.fromisoformat(f"{evento['dateEvent']}T{hora}")


def sincronizar_temporada(db: Session, temporada: int) -> dict[str, int]:
    resumen = {"grandes_premios": 0, "escuderias": 0, "pilotos": 0}
    eventos = _obtener("/eventsseason.php", id=F1_LEAGUE_ID, s=temporada).get("events") or []
    for evento in eventos:
        nombre = (evento.get("strEvent") or "").lower()
        if "grand prix" not in nombre or any(x in nombre for x in ("practice", "qualifying", "sprint")):
            continue
        ronda = evento.get("intRound")
        if not ronda or not evento.get("dateEvent") or db.query(GranPremio).filter_by(temporada=temporada, ronda=int(ronda)).first():
            continue
        fecha = _fecha(evento)
        db.add(GranPremio(nombre=evento["strEvent"], pais=evento.get("strCountry") or "No especificado", circuito=evento.get("strVenue") or "No especificado", temporada=temporada, ronda=int(ronda), fecha_inicio=fecha, fecha_carrera=fecha))
        resumen["grandes_premios"] += 1

    equipos = _obtener("/search_all_teams.php", l="Formula_1").get("teams") or []
    for equipo in equipos:
        if equipo.get("idLeague") != F1_LEAGUE_ID and equipo.get("strLeague") != "Formula 1":
            continue
        nombre = equipo.get("strTeam")
        if not nombre:
            continue
        escuderia = db.query(Escuderia).filter_by(nombre=nombre, temporada=temporada).first()
        if not escuderia:
            color = equipo.get("strColour1")
            escuderia = Escuderia(nombre=nombre, nacionalidad=equipo.get("strCountry"), color=f"#{color}" if color and len(color) == 6 else None, temporada=temporada, puntos_temporada=0)
            db.add(escuderia)
            db.flush()
            resumen["escuderias"] += 1
        jugadores = _obtener("/lookup_all_players.php", id=equipo["idTeam"]).get("player") or []
        for jugador in jugadores:
            if jugador.get("strSport") != "Motorsport" or not jugador.get("strPlayer") or db.query(Piloto).filter_by(nombre=jugador["strPlayer"], temporada=temporada).first():
                continue
            numero = jugador.get("strNumber")
            db.add(Piloto(nombre=jugador["strPlayer"], nacionalidad=jugador.get("strNationality"), numero=int(numero) if numero and numero.isdigit() else None, escuderia_id=escuderia.id, temporada=temporada, puntos_temporada=0))
            resumen["pilotos"] += 1
    db.commit()
    return resumen
