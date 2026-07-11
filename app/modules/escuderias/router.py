import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.escuderias import crud, schemas
from app.core.exceptions import NoEncontrado

router = APIRouter(prefix="/escuderias", tags=["Escuderías"])


@router.get("", response_model=list[schemas.EscuderiaOut])
def listar_todas(
    temporada: int | None = Query(default=None, description="Filtrar por temporada"),
    db: Session = Depends(get_db)
):
    return crud.listar_escuderias(db, temporada=temporada)


@router.get("/clasificacion", response_model=list[schemas.EscuderiaOut])
def obtener_clasificacion(
    temporada: int = Query(..., description="Temporada para clasificación de constructores"),
    db: Session = Depends(get_db)
):
    # HU-14: clasificación de constructores
    return crud.listar_clasificacion_escuderias(db, temporada=temporada)


@router.get("/{escuderia_id}", response_model=schemas.EscuderiaOut)
def obtener_detalle(escuderia_id: uuid.UUID, db: Session = Depends(get_db)):
    db_escuderia = crud.obtener_escuderia(db, escuderia_id)
    if not db_escuderia:
        raise NoEncontrado("Escudería no encontrada")
    return db_escuderia
