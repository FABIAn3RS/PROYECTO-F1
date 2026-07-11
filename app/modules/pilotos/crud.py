import uuid
from sqlalchemy.orm import Session
from app.modules.pilotos import models, schemas


def obtener_piloto(db: Session, piloto_id: uuid.UUID) -> models.Piloto | None:
    return db.query(models.Piloto).filter(models.Piloto.id == piloto_id).first()


def listar_pilotos(db: Session, temporada: int | None = None) -> list[models.Piloto]:
    query = db.query(models.Piloto)
    if temporada is not None:
        query = query.filter(models.Piloto.temporada == temporada)
    return query.all()


def listar_clasificacion_pilotos(db: Session, temporada: int) -> list[models.Piloto]:
    return (
        db.query(models.Piloto)
        .filter(models.Piloto.temporada == temporada)
        .order_by(models.Piloto.puntos_temporada.desc())
        .all()
    )


def crear_piloto(db: Session, datos: schemas.PilotoCreate) -> models.Piloto:
    db_piloto = models.Piloto(
        nombre=datos.nombre,
        nacionalidad=datos.nacionalidad,
        numero=datos.numero,
        escuderia_id=datos.escuderia_id,
        temporada=datos.temporada,
        puntos_temporada=0,
    )
    db.add(db_piloto)
    db.commit()
    db.refresh(db_piloto)
    return db_piloto


def actualizar_piloto(db: Session, db_piloto: models.Piloto, datos: schemas.PilotoUpdate) -> models.Piloto:
    update_data = datos.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_piloto, key, value)
    db.commit()
    db.refresh(db_piloto)
    return db_piloto


def eliminar_piloto(db: Session, db_piloto: models.Piloto) -> None:
    db.delete(db_piloto)
    db.commit()
