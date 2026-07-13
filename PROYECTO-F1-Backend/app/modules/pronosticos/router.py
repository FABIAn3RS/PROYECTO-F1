import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import get_current_user
from app.core.exceptions import NoEncontrado, SolicitudInvalida, SinPermisos
from app.modules.auth.models import Usuario
from app.modules.calendario.models import GranPremio
from app.modules.acceso.dependencies import verificar_pase_pronosticos
from app.modules.pronosticos import crud, schemas, models

router = APIRouter(prefix="/pronosticos", tags=["Pronósticos"])


def validar_plazo_gp(gp: GranPremio):
    """Verifica que el fin de semana del GP no haya comenzado."""
    if datetime.now() >= gp.fecha_inicio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El plazo para realizar o modificar pronósticos para este Gran Premio ha finalizado."
        )


def validar_unicidad_podio(p1: uuid.UUID | None, p2: uuid.UUID | None, p3: uuid.UUID | None):
    """Verifica que no se repitan pilotos en las tres primeras posiciones."""
    pilotos = [p for p in [p1, p2, p3] if p is not None]
    if len(pilotos) != len(set(pilotos)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes seleccionar el mismo piloto para múltiples posiciones del podio."
        )


@router.post("", response_model=schemas.PronosticoOut, status_code=status.HTTP_201_CREATED)
def crear_mi_pronostico(
    datos: schemas.PronosticoCreate,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Obtener GP y verificar plazo
    gp = db.query(GranPremio).filter(GranPremio.id == datos.gran_premio_id).first()
    if not gp:
        raise NoEncontrado("Gran Premio no encontrado")
    verificar_pase_pronosticos(datos.gran_premio_id, usuario, db)
    validar_plazo_gp(gp)

    # 2. Validar unicidad de podio
    validar_unicidad_podio(datos.piloto_p1_id, datos.piloto_p2_id, datos.piloto_p3_id)

    # 3. Verificar si ya existe un pronóstico
    existente = crud.obtener_pronostico_usuario_gp(db, usuario.id, datos.gran_premio_id)
    if existente:
        raise SolicitudInvalida("Ya has creado un pronóstico para este Gran Premio. Usa PUT para editarlo.")

    return crud.crear_pronostico(db, usuario.id, datos)


@router.get("/gp/{gp_id}", response_model=schemas.PronosticoOut)
def obtener_pronostico_de_gp(
    gp_id: uuid.UUID,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pronostico = crud.obtener_pronostico_usuario_gp(db, usuario.id, gp_id)
    if not pronostico:
        raise NoEncontrado("No tienes ningún pronóstico creado para este Gran Premio.")
    return pronostico


@router.put("/{pronostico_id}", response_model=schemas.PronosticoOut)
def modificar_mi_pronostico(
    pronostico_id: uuid.UUID,
    datos: schemas.PronosticoUpdate,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pronostico = crud.obtener_pronostico(db, pronostico_id)
    if not pronostico:
        raise NoEncontrado("Pronóstico no encontrado")

    if pronostico.usuario_id != usuario.id:
        raise SinPermisos("No tienes permisos para modificar este pronóstico.")

    if pronostico.confirmado:
        raise SolicitudInvalida("No se puede modificar un pronóstico que ya ha sido confirmado.")

    verificar_pase_pronosticos(pronostico.gran_premio_id, usuario, db)

    # Obtener GP y verificar plazo
    gp = db.query(GranPremio).filter(GranPremio.id == pronostico.gran_premio_id).first()
    validar_plazo_gp(gp)

    # Validar unicidad del podio
    p1 = datos.piloto_p1_id if datos.piloto_p1_id is not None else pronostico.piloto_p1_id
    p2 = datos.piloto_p2_id if datos.piloto_p2_id is not None else pronostico.piloto_p2_id
    p3 = datos.piloto_p3_id if datos.piloto_p3_id is not None else pronostico.piloto_p3_id
    validar_unicidad_podio(p1, p2, p3)

    return crud.actualizar_pronostico(db, pronostico, datos)


@router.post("/{pronostico_id}/confirmar", response_model=schemas.PronosticoOut)
def confirmar_mi_pronostico(
    pronostico_id: uuid.UUID,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pronostico = crud.obtener_pronostico(db, pronostico_id)
    if not pronostico:
        raise NoEncontrado("Pronóstico no encontrado")

    if pronostico.usuario_id != usuario.id:
        raise SinPermisos("No tienes permisos para confirmar este pronóstico.")

    if pronostico.confirmado:
        return pronostico

    verificar_pase_pronosticos(pronostico.gran_premio_id, usuario, db)

    # Obtener GP y verificar plazo
    gp = db.query(GranPremio).filter(GranPremio.id == pronostico.gran_premio_id).first()
    validar_plazo_gp(gp)

    # Validar que todos los campos requeridos estén llenos antes de confirmar
    if not all([pronostico.piloto_p1_id, pronostico.piloto_p2_id, pronostico.piloto_p3_id,
                pronostico.piloto_pole_id, pronostico.piloto_vuelta_rapida_id]):
        raise SolicitudInvalida("Debes completar todas las predicciones del pronóstico antes de confirmarlo.")

    return crud.confirmar_pronostico(db, pronostico)
