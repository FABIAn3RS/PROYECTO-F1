import uuid
from sqlalchemy.orm import Session
from app.modules.pronosticos import models, schemas


def obtener_pronostico(db: Session, pronostico_id: uuid.UUID) -> models.Pronostico | None:
    return db.query(models.Pronostico).filter(models.Pronostico.id == pronostico_id).first()


def obtener_pronostico_usuario_gp(db: Session, usuario_id: uuid.UUID, gp_id: uuid.UUID) -> models.Pronostico | None:
    return (
        db.query(models.Pronostico)
        .filter(models.Pronostico.usuario_id == usuario_id, models.Pronostico.gran_premio_id == gp_id)
        .first()
    )


def crear_pronostico(db: Session, usuario_id: uuid.UUID, datos: schemas.PronosticoCreate) -> models.Pronostico:
    db_pronostico = models.Pronostico(
        usuario_id=usuario_id,
        gran_premio_id=datos.gran_premio_id,
        piloto_p1_id=datos.piloto_p1_id,
        piloto_p2_id=datos.piloto_p2_id,
        piloto_p3_id=datos.piloto_p3_id,
        piloto_pole_id=datos.piloto_pole_id,
        piloto_vuelta_rapida_id=datos.piloto_vuelta_rapida_id,
        confirmado=False,
        puntos_obtenidos=0,
    )
    db.add(db_pronostico)
    db.commit()
    db.refresh(db_pronostico)
    return db_pronostico


def actualizar_pronostico(
    db: Session,
    db_pronostico: models.Pronostico,
    datos: schemas.PronosticoUpdate
) -> models.Pronostico:
    update_data = datos.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_pronostico, key, value)
    db.commit()
    db.refresh(db_pronostico)
    return db_pronostico


def confirmar_pronostico(db: Session, db_pronostico: models.Pronostico) -> models.Pronostico:
    db_pronostico.confirmado = True
    db.commit()
    db.refresh(db_pronostico)
    return db_pronostico
