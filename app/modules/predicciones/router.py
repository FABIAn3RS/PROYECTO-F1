import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.exceptions import NoEncontrado, SolicitudInvalida
from app.modules.calendario.crud import obtener_gran_premio
from app.modules.predicciones import crud, motor, schemas

router = APIRouter(prefix="/predicciones", tags=["Predicciones"])


# Predicción algorítmica (no ML) del resultado de un GP, a partir de datos reales:
# clasificación de pilotos/escuderías, historial en el circuito y forma reciente.
# Disponible públicamente como contenido informativo.
@router.get("/{gp_id}", response_model=schemas.PrediccionGPOut)
def obtener_prediccion_gp(
    gp_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    gp = obtener_gran_premio(db, gp_id)
    if not gp:
        raise NoEncontrado("Gran Premio no encontrado")

    pilotos = crud.listar_pilotos_temporada(db, gp.temporada)
    if not pilotos:
        raise SolicitudInvalida("No hay pilotos registrados para la temporada de este Gran Premio.")

    historial_circuito = crud.promedio_puntos_por_circuito(db, gp.circuito, gp.id)
    forma_reciente = crud.forma_reciente(db, gp.temporada)

    return motor.generar_prediccion(gp.id, gp.temporada, pilotos, historial_circuito, forma_reciente)
