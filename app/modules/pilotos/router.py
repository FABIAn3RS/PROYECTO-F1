import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.pilotos import crud, schemas
from app.core.exceptions import NoEncontrado

router = APIRouter(prefix="/pilotos", tags=["Pilotos"])


@router.get("", response_model=list[schemas.PilotoOut])
def listar_todos(
    temporada: int | None = Query(default=None, description="Filtrar por temporada"),
    db: Session = Depends(get_db)
):
    return crud.listar_pilotos(db, temporada=temporada)


@router.get("/clasificacion", response_model=list[schemas.PilotoOut])
def obtener_clasificacion(
    temporada: int = Query(..., description="Temporada para clasificación de pilotos"),
    db: Session = Depends(get_db)
):
    # HU-13: clasificación de pilotos
    return crud.listar_clasificacion_pilotos(db, temporada=temporada)


@router.get("/{piloto_id}", response_model=schemas.PilotoOut)
def obtener_detalle(piloto_id: uuid.UUID, db: Session = Depends(get_db)):
    db_piloto = crud.obtener_piloto(db, piloto_id)
    if not db_piloto:
        raise NoEncontrado("Piloto no encontrado")
    return db_piloto
