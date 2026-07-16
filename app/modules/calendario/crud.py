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
    Usado por el módulo `acceso` para asignar la carrera gratis:
    el próximo GP a correrse, tomando el de fecha_carrera más cercana
    que todavía no ha ocurrido y no ha sido finalizado.
    """
    from datetime import datetime

    return (
        db.query(models.GranPremio)
        .filter(models.GranPremio.fecha_carrera >= datetime.now())
        .filter(models.GranPremio.finalizado == False)
        .order_by(models.GranPremio.fecha_carrera.asc())
        .first()
    )
