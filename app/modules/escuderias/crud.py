import uuid
from sqlalchemy.orm import Session
from app.modules.escuderias import models, schemas


def obtener_escuderia(db: Session, escuderia_id: uuid.UUID) -> models.Escuderia | None:
    return db.query(models.Escuderia).filter(models.Escuderia.id == escuderia_id).first()


def listar_escuderias(db: Session, temporada: int | None = None) -> list[models.Escuderia]:
    query = db.query(models.Escuderia)
    if temporada is not None:
        query = query.filter(models.Escuderia.temporada == temporada)
    return query.all()


def listar_clasificacion_escuderias(db: Session, temporada: int) -> list[models.Escuderia]:
    return (
        db.query(models.Escuderia)
        .filter(models.Escuderia.temporada == temporada)
        .order_by(models.Escuderia.puntos_temporada.desc())
        .all()
    )


def crear_escuderia(db: Session, datos: schemas.EscuderiaCreate) -> models.Escuderia:
    db_escuderia = models.Escuderia(
        nombre=datos.nombre,
        nacionalidad=datos.nacionalidad,
        color=datos.color,
        temporada=datos.temporada,
        puntos_temporada=0,
    )
    db.add(db_escuderia)
    db.commit()
    db.refresh(db_escuderia)
    return db_escuderia


def actualizar_escuderia(db: Session, db_escuderia: models.Escuderia, datos: schemas.EscuderiaUpdate) -> models.Escuderia:
    update_data = datos.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_escuderia, key, value)
    db.commit()
    db.refresh(db_escuderia)
    return db_escuderia


def eliminar_escuderia(db: Session, db_escuderia: models.Escuderia) -> None:
    db.delete(db_escuderia)
    db.commit()
