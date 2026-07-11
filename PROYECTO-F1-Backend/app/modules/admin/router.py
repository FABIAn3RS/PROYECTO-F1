import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import get_current_admin
from app.core.exceptions import NoEncontrado, SolicitudInvalida
from app.modules.auth.models import Usuario
from app.modules.calendario.models import GranPremio
from app.modules.escuderias.models import Escuderia
from app.modules.pilotos.models import Piloto
from app.modules.resultados.models import ResultadoOficial, ResultadoPosicion
from app.modules.pronosticos.models import Pronostico
from app.modules.admin import schemas
from app.modules.admin.thesportsdb_sync import sincronizar_temporada

# Import schema definitions from each module to reuse for return values
from app.modules.calendario import schemas as cal_schemas
from app.modules.escuderias import schemas as esc_schemas
from app.modules.pilotos import schemas as pil_schemas

router = APIRouter(prefix="/admin", tags=["Administración (Protegido)"])


@router.post("/sincronizaciones/thesportsdb")
def sincronizar_datos_thesportsdb(
    temporada: int,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin),
):
    """Importa manualmente datos de F1 sin modificar el contenido ya administrado."""
    try:
        resumen = sincronizar_temporada(db, temporada)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="No se pudo sincronizar con TheSportsDB. Inténtalo nuevamente.",
        ) from exc
    return {"detail": "Sincronización completada.", **resumen}


# ==========================================
# GESTIÓN DE GRANDES PREMIOS
# ==========================================

@router.post("/grandes-premios", response_model=cal_schemas.GranPremioBase, status_code=status.HTTP_201_CREATED)
def crear_gp(
    datos: schemas.GranPremioCreate,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin)
):
    # Validar ronda única por temporada
    existente = db.query(GranPremio).filter(
        GranPremio.temporada == datos.temporada,
        GranPremio.ronda == datos.ronda
    ).first()
    if existente:
        raise SolicitudInvalida(f"La ronda {datos.ronda} ya está registrada para la temporada {datos.temporada}.")

    db_gp = GranPremio(
        nombre=datos.nombre,
        pais=datos.pais,
        circuito=datos.circuito,
        temporada=datos.temporada,
        ronda=datos.ronda,
        fecha_inicio=datos.fecha_inicio,
        fecha_carrera=datos.fecha_carrera
    )
    db.add(db_gp)
    db.commit()
    db.refresh(db_gp)
    return db_gp


@router.put("/grandes-premios/{gp_id}", response_model=cal_schemas.GranPremioBase)
def actualizar_gp(
    gp_id: uuid.UUID,
    datos: schemas.GranPremioUpdate,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin)
):
    gp = db.query(GranPremio).filter(GranPremio.id == gp_id).first()
    if not gp:
        raise NoEncontrado("Gran Premio no encontrado")

    update_data = datos.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(gp, key, value)

    db.commit()
    db.refresh(gp)
    return gp


@router.delete("/grandes-premios/{gp_id}", status_code=status.HTTP_200_OK)
def eliminar_gp(
    gp_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin)
):
    gp = db.query(GranPremio).filter(GranPremio.id == gp_id).first()
    if not gp:
        raise NoEncontrado("Gran Premio no encontrado")

    db.delete(gp)
    db.commit()
    return {"detail": "Gran Premio eliminado correctamente"}


# ==========================================
# GESTIÓN DE ESCUDERÍAS
# ==========================================

@router.post("/escuderias", response_model=esc_schemas.EscuderiaOut, status_code=status.HTTP_201_CREATED)
def crear_escuderia(
    datos: esc_schemas.EscuderiaCreate,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin)
):
    # Validar nombre único por temporada
    existente = db.query(Escuderia).filter(
        Escuderia.nombre == datos.nombre,
        Escuderia.temporada == datos.temporada
    ).first()
    if existente:
        raise SolicitudInvalida(f"La escudería '{datos.nombre}' ya está registrada para la temporada {datos.temporada}.")

    db_escuderia = Escuderia(
        nombre=datos.nombre,
        nacionalidad=datos.nacionalidad,
        color=datos.color,
        temporada=datos.temporada,
        puntos_temporada=0
    )
    db.add(db_escuderia)
    db.commit()
    db.refresh(db_escuderia)
    return db_escuderia


@router.put("/escuderias/{escuderia_id}", response_model=esc_schemas.EscuderiaOut)
def actualizar_escuderia(
    escuderia_id: uuid.UUID,
    datos: esc_schemas.EscuderiaUpdate,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin)
):
    escuderia = db.query(Escuderia).filter(Escuderia.id == escuderia_id).first()
    if not escuderia:
        raise NoEncontrado("Escudería no encontrada")

    update_data = datos.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(escuderia, key, value)

    db.commit()
    db.refresh(escuderia)
    return escuderia


@router.delete("/escuderias/{escuderia_id}", status_code=status.HTTP_200_OK)
def eliminar_escuderia(
    escuderia_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin)
):
    escuderia = db.query(Escuderia).filter(Escuderia.id == escuderia_id).first()
    if not escuderia:
        raise NoEncontrado("Escudería no encontrada")

    db.delete(escuderia)
    db.commit()
    return {"detail": "Escudería eliminada correctamente"}


# ==========================================
# GESTIÓN DE PILOTOS
# ==========================================

@router.post("/pilotos", response_model=pil_schemas.PilotoOut, status_code=status.HTTP_201_CREATED)
def crear_piloto(
    datos: pil_schemas.PilotoCreate,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin)
):
    db_piloto = Piloto(
        nombre=datos.nombre,
        nacionalidad=datos.nacionalidad,
        numero=datos.numero,
        escuderia_id=datos.escuderia_id,
        temporada=datos.temporada,
        puntos_temporada=0
    )
    db.add(db_piloto)
    db.commit()
    db.refresh(db_piloto)
    return db_piloto


@router.put("/pilotos/{piloto_id}", response_model=pil_schemas.PilotoOut)
def actualizar_piloto(
    piloto_id: uuid.UUID,
    datos: pil_schemas.PilotoUpdate,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin)
):
    piloto = db.query(Piloto).filter(Piloto.id == piloto_id).first()
    if not piloto:
        raise NoEncontrado("Piloto no encontrado")

    update_data = datos.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(piloto, key, value)

    db.commit()
    db.refresh(piloto)
    return piloto


@router.delete("/pilotos/{piloto_id}", status_code=status.HTTP_200_OK)
def eliminar_piloto(
    piloto_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin)
):
    piloto = db.query(Piloto).filter(Piloto.id == piloto_id).first()
    if not piloto:
        raise NoEncontrado("Piloto no encontrado")

    db.delete(piloto)
    db.commit()
    return {"detail": "Piloto eliminado correctamente"}


# ==========================================
# REGISTRO DE RESULTADOS OFICIALES
# ==========================================

@router.post("/grandes-premios/{gp_id}/resultados", status_code=status.HTTP_201_CREATED)
def registrar_resultados_oficiales(
    gp_id: uuid.UUID,
    datos: schemas.ResultadoOficialCreate,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin)
):
    # 1. Validar existencia del GP
    gp = db.query(GranPremio).filter(GranPremio.id == gp_id).first()
    if not gp:
        raise NoEncontrado("Gran Premio no encontrado")

    # 2. Validar que no se hayan registrado resultados previamente
    resultado_existente = db.query(ResultadoOficial).filter(ResultadoOficial.gran_premio_id == gp_id).first()
    if resultado_existente:
        raise SolicitudInvalida("Los resultados oficiales para este Gran Premio ya están registrados.")

    # 3. Crear el resultado oficial
    db_resultado = ResultadoOficial(gran_premio_id=gp_id)
    db.add(db_resultado)
    db.commit()
    db.refresh(db_resultado)

    # 4. Guardar las posiciones y actualizar puntos de pilotos y escuderías
    posiciones_mapeadas = {}
    pole_pilot_id = None
    vr_pilot_id = None

    for pos in datos.posiciones:
        db_pos = ResultadoPosicion(
            resultado_id=db_resultado.id,
            piloto_id=pos.piloto_id,
            posicion=pos.posicion,
            es_pole=pos.es_pole,
            es_vuelta_rapida=pos.es_vuelta_rapida,
            puntos_obtenidos=pos.puntos_obtenidos
        )
        db.add(db_pos)

        # Mapear valores para calificar los pronósticos de los usuarios
        posiciones_mapeadas[pos.posicion] = pos.piloto_id
        if pos.es_pole:
            pole_pilot_id = pos.piloto_id
        if pos.es_vuelta_rapida:
            vr_pilot_id = pos.piloto_id

        # Sumar puntos al piloto en la clasificación de la temporada
        piloto = db.query(Piloto).filter(Piloto.id == pos.piloto_id).first()
        if piloto:
            piloto.puntos_temporada += pos.puntos_obtenidos
            # Sumar puntos a la escudería del piloto
            if piloto.escuderia_id:
                escuderia = db.query(Escuderia).filter(Escuderia.id == piloto.escuderia_id).first()
                if escuderia:
                    escuderia.puntos_temporada += pos.puntos_obtenidos

    db.commit()

    # 5. Calificar pronósticos de los usuarios
    pronosticos = db.query(Pronostico).filter(
        Pronostico.gran_premio_id == gp_id,
        Pronostico.confirmado == True
    ).all()

    for p in pronosticos:
        puntos_usuario = 0

        # +10 puntos por acertar el ganador (P1)
        if p.piloto_p1_id and posiciones_mapeadas.get(1) == p.piloto_p1_id:
            puntos_usuario += 10

        # +5 puntos por acertar el segundo lugar (P2)
        if p.piloto_p2_id and posiciones_mapeadas.get(2) == p.piloto_p2_id:
            puntos_usuario += 5

        # +5 puntos por acertar el tercer lugar (P3)
        if p.piloto_p3_id and posiciones_mapeadas.get(3) == p.piloto_p3_id:
            puntos_usuario += 5

        # +5 puntos por acertar la Pole Position
        if p.piloto_pole_id and p.piloto_pole_id == pole_pilot_id:
            puntos_usuario += 5

        # +5 puntos por acertar la Vuelta Rápida
        if p.piloto_vuelta_rapida_id and p.piloto_vuelta_rapida_id == vr_pilot_id:
            puntos_usuario += 5

        p.puntos_obtenidos = puntos_usuario

    db.commit()

    return {"detail": "Resultados oficiales registrados y pronósticos evaluados con éxito."}
