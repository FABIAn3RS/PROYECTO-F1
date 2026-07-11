import uuid
from sqlalchemy.orm import Session, joinedload

from app.modules.pilotos.models import Piloto
from app.modules.calendario.models import GranPremio
from app.modules.resultados.models import ResultadoOficial, ResultadoPosicion


def listar_pilotos_temporada(db: Session, temporada: int) -> list[Piloto]:
    return (
        db.query(Piloto)
        .options(joinedload(Piloto.escuderia))
        .filter(Piloto.temporada == temporada)
        .all()
    )


def promedio_puntos_por_circuito(db: Session, circuito: str, gp_id_actual: uuid.UUID) -> dict[uuid.UUID, float]:
    """Promedio de puntos que obtuvo cada piloto en ediciones anteriores del mismo circuito."""
    filas = (
        db.query(ResultadoPosicion.piloto_id, ResultadoPosicion.puntos_obtenidos)
        .join(ResultadoOficial, ResultadoOficial.id == ResultadoPosicion.resultado_id)
        .join(GranPremio, GranPremio.id == ResultadoOficial.gran_premio_id)
        .filter(GranPremio.circuito == circuito, GranPremio.id != gp_id_actual)
        .all()
    )
    return _promediar(filas)


def forma_reciente(db: Session, temporada: int, n_carreras: int = 3) -> dict[uuid.UUID, float]:
    """Promedio de puntos obtenidos por piloto en las últimas N carreras con resultado registrado."""
    ultimos_gp_ids = [
        fila[0]
        for fila in (
            db.query(GranPremio.id)
            .join(ResultadoOficial, ResultadoOficial.gran_premio_id == GranPremio.id)
            .filter(GranPremio.temporada == temporada)
            .order_by(GranPremio.fecha_carrera.desc())
            .limit(n_carreras)
            .all()
        )
    ]
    if not ultimos_gp_ids:
        return {}

    filas = (
        db.query(ResultadoPosicion.piloto_id, ResultadoPosicion.puntos_obtenidos)
        .join(ResultadoOficial, ResultadoOficial.id == ResultadoPosicion.resultado_id)
        .filter(ResultadoOficial.gran_premio_id.in_(ultimos_gp_ids))
        .all()
    )
    return _promediar(filas)


def _promediar(filas: list[tuple[uuid.UUID, int]]) -> dict[uuid.UUID, float]:
    acumulado: dict[uuid.UUID, list[int]] = {}
    for piloto_id, puntos in filas:
        acumulado.setdefault(piloto_id, []).append(puntos)
    return {piloto_id: sum(valores) / len(valores) for piloto_id, valores in acumulado.items()}
