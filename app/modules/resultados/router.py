import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.exceptions import NoEncontrado
from app.modules.resultados import crud, schemas

router = APIRouter(tags=["Resultados y Ranking"])


# EP-06: Resultados de un GP
@router.get("/grandes-premios/{gp_id}/resultados", response_model=schemas.ResultadoOficialOut)
def obtener_resultados_gp(
    gp_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    resultado = crud.obtener_resultado_gp(db, gp_id)
    if not resultado:
        raise NoEncontrado("Los resultados oficiales para este Gran Premio aún no han sido registrados.")
    return resultado


# EP-07: Ranking Global (HU-24)
@router.get("/ranking", response_model=list[schemas.UsuarioRankingOut])
def obtener_ranking(
    db: Session = Depends(get_db),
):
    return crud.obtener_ranking_global(db)
