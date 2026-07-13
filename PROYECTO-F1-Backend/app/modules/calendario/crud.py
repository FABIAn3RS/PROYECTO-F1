import uuid
from sqlalchemy.orm import Session

from app.modules.calendario import models


def listar_grandes_premios(db: Session, temporada: int | None = None) -> list[models.GranPremio]:
    query = db.query(models.GranPremio)
    if temporada is not None:
        query = query.filter(models.GranPremio.temporada == temporada)
    return query.order_by(models.GranPremio.ronda.asc()).all()


def obtener_gran_premio(db: Session, gp_id: uuid.UUID) -> models.GranPremio | None:
    return db.query(models.GranPremio).filter(models.GranPremio.id == gp_id).first()


def obtener_proximo_gran_premio(db: Session) -> models.GranPremio | None:
    """
    Usado por el módulo `acceso` para asignar el pronóstico gratis: el próximo GP
    cuyo plazo de pronósticos todavía sigue abierto. El plazo cierra cuando arranca
    la carrera (fecha_carrera), no en fecha_inicio del fin de semana — debe coincidir
    con `validar_plazo_gp` en el router de pronósticos para no asignar un GP en el
    que el usuario ya no podría pronosticar.
    """
    from datetime import datetime

    return (
        db.query(models.GranPremio)
        .filter(models.GranPremio.fecha_carrera >= datetime.now())
        .order_by(models.GranPremio.fecha_carrera.asc())
        .first()
    )
