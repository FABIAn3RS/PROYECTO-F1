import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import get_current_user
from app.modules.auth.models import Usuario
from app.modules.usuarios import crud, schemas
from app.modules.pronosticos.models import Pronostico
from app.modules.pronosticos.schemas import PronosticoOut
from app.modules.resultados.models import ResultadoOficial, ResultadoPosicion

router = APIRouter(prefix="/users", tags=["Usuarios/Perfil"])


@router.get("/me", response_model=schemas.UsuarioPerfilOut)
def obtener_perfil(usuario: Usuario = Depends(get_current_user)):
    return usuario


@router.put("/me", response_model=schemas.UsuarioPerfilOut)
def actualizar_perfil(
    datos: schemas.UsuarioUpdate,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud.actualizar_usuario(db, usuario, datos)


@router.get("/me/pronosticos", response_model=list[PronosticoOut])
def obtener_mis_pronosticos(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # EP-07: Historial de pronósticos (HU-23)
    return db.query(Pronostico).filter(Pronostico.usuario_id == usuario.id).all()


@router.get("/me/estadisticas", response_model=schemas.EstadisticasOut)
def obtener_mis_estadisticas(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # EP-07: Estadísticas de aciertos (HU-25 / HU-26)
    pronosticos = db.query(Pronostico).filter(Pronostico.usuario_id == usuario.id).all()

    totales = len(pronosticos)
    confirmados = sum(1 for p in pronosticos if p.confirmado)
    puntos = sum(p.puntos_obtenidos for p in pronosticos)

    aciertos_pole = 0
    aciertos_vr = 0
    aciertos_podio = 0

    for p in pronosticos:
        if not p.confirmado:
            continue
        # Buscar el resultado oficial para este GP
        resultado = db.query(ResultadoOficial).filter(ResultadoOficial.gran_premio_id == p.gran_premio_id).first()
        if not resultado:
            continue

        # Obtener posiciones del resultado oficial
        posiciones = db.query(ResultadoPosicion).filter(ResultadoPosicion.resultado_id == resultado.id).all()
        pos_dict = {pos.posicion: pos.piloto_id for pos in posiciones}
        pole_pilot_id = next((pos.piloto_id for pos in posiciones if pos.es_pole), None)
        vr_pilot_id = next((pos.piloto_id for pos in posiciones if pos.es_vuelta_rapida), None)

        # Validar pole
        if p.piloto_pole_id and p.piloto_pole_id == pole_pilot_id:
            aciertos_pole += 1

        # Validar vuelta rapida
        if p.piloto_vuelta_rapida_id and p.piloto_vuelta_rapida_id == vr_pilot_id:
            aciertos_vr += 1

        # Validar podio (si coinciden piloto y posicion)
        if p.piloto_p1_id and pos_dict.get(1) == p.piloto_p1_id:
            aciertos_podio += 1
        if p.piloto_p2_id and pos_dict.get(2) == p.piloto_p2_id:
            aciertos_podio += 1
        if p.piloto_p3_id and pos_dict.get(3) == p.piloto_p3_id:
            aciertos_podio += 1

    return schemas.EstadisticasOut(
        pronosticos_totales=totales,
        pronosticos_confirmados=confirmados,
        puntos_totales=puntos,
        aciertos_pole=aciertos_pole,
        aciertos_vuelta_rapida=aciertos_vr,
        aciertos_podio=aciertos_podio
    )
