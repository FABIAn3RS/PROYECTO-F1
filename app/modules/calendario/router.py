import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.calendario import crud, schemas

router = APIRouter(prefix="/grandes-premios", tags=["Calendario"])


# HU-08: listado del calendario — SIEMPRE libre, sin autenticación ni pase
@router.get("", response_model=list[schemas.GranPremioListItem])
def listar_calendario(
    temporada: int | None = Query(default=None, description="Filtrar por temporada, ej. 2026"),
    db: Session = Depends(get_db),
):
    return crud.listar_grandes_premios(db, temporada=temporada)


# HU-09/HU-10: detalle público de un GP.
@router.get("/{gp_id}", response_model=schemas.GranPremioDetalle)
def obtener_detalle_gp(
    gp_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    gp = crud.obtener_gran_premio(db, gp_id)
    if not gp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gran Premio no encontrado",
        )
    return gp

