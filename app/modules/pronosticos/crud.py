import uuid
from collections import Counter

from sqlalchemy.orm import Session

from app.modules.pilotos.models import Piloto
from app.modules.pronosticos import models, schemas

CATEGORIAS_POPULARES = [
    ("p1", "piloto_p1_id", "1.º puesto"),
    ("p2", "piloto_p2_id", "2.º puesto"),
    ("p3", "piloto_p3_id", "3.º puesto"),
    ("pole", "piloto_pole_id", "Pole position"),
    ("vuelta_rapida", "piloto_vuelta_rapida_id", "Vuelta rápida"),
]


def obtener_pronostico(db: Session, pronostico_id: uuid.UUID) -> models.Pronostico | None:
    return db.query(models.Pronostico).filter(models.Pronostico.id == pronostico_id).first()


def obtener_pronostico_usuario_gp(db: Session, usuario_id: uuid.UUID, gp_id: uuid.UUID) -> models.Pronostico | None:
    return (
        db.query(models.Pronostico)
        .filter(models.Pronostico.usuario_id == usuario_id, models.Pronostico.gran_premio_id == gp_id)
        .first()
    )


def crear_pronostico(db: Session, usuario_id: uuid.UUID, datos: schemas.PronosticoCreate) -> models.Pronostico:
    db_pronostico = models.Pronostico(
        usuario_id=usuario_id,
        gran_premio_id=datos.gran_premio_id,
        piloto_p1_id=datos.piloto_p1_id,
        piloto_p2_id=datos.piloto_p2_id,
        piloto_p3_id=datos.piloto_p3_id,
        piloto_pole_id=datos.piloto_pole_id,
        piloto_vuelta_rapida_id=datos.piloto_vuelta_rapida_id,
        confirmado=False,
        puntos_obtenidos=0,
    )
    db.add(db_pronostico)
    db.commit()
    db.refresh(db_pronostico)
    return db_pronostico


def actualizar_pronostico(
    db: Session,
    db_pronostico: models.Pronostico,
    datos: schemas.PronosticoUpdate
) -> models.Pronostico:
    update_data = datos.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_pronostico, key, value)
    db.commit()
    db.refresh(db_pronostico)
    return db_pronostico


def confirmar_pronostico(db: Session, db_pronostico: models.Pronostico) -> models.Pronostico:
    db_pronostico.confirmado = True
    db.commit()
    db.refresh(db_pronostico)
    return db_pronostico


def obtener_pronosticos_populares(db: Session, gp_id: uuid.UUID) -> schemas.PronosticosPopularesOut:
    pronosticos = (
        db.query(models.Pronostico)
        .filter(
            models.Pronostico.gran_premio_id == gp_id,
            models.Pronostico.confirmado == True,
        )
        .all()
    )
    total = len(pronosticos)
    categorias: list[schemas.CategoriaPopularOut] = []

    for clave, campo, etiqueta in CATEGORIAS_POPULARES:
        conteo = Counter(
            getattr(pronostico, campo)
            for pronostico in pronosticos
            if getattr(pronostico, campo) is not None
        )
        opciones: list[schemas.OpcionPopularOut] = []
        for piloto_id, votos in conteo.most_common(3):
            piloto = db.query(Piloto).filter(Piloto.id == piloto_id).first()
            opciones.append(
                schemas.OpcionPopularOut(
                    piloto_id=piloto_id,
                    piloto_nombre=piloto.nombre if piloto else "Desconocido",
                    votos=votos,
                    porcentaje=round((votos / total) * 100, 1) if total else 0,
                )
            )
        categorias.append(
            schemas.CategoriaPopularOut(categoria=clave, etiqueta=etiqueta, opciones=opciones)
        )

    return schemas.PronosticosPopularesOut(
        gran_premio_id=gp_id,
        total_confirmados=total,
        categorias=categorias,
    )


def calcular_aciertos(db: Session, p: models.Pronostico) -> int:
    if not p.confirmado:
        return 0

    from app.modules.resultados.models import ResultadoOficial, ResultadoPosicion

    resultado = db.query(ResultadoOficial).filter(ResultadoOficial.gran_premio_id == p.gran_premio_id).first()
    if not resultado:
        return 0

    posiciones = db.query(ResultadoPosicion).filter(ResultadoPosicion.resultado_id == resultado.id).all()
    pos_dict = {pos.posicion: pos.piloto_id for pos in posiciones}
    pole_pilot_id = next((pos.piloto_id for pos in posiciones if pos.es_pole), None)
    vr_pilot_id = next((pos.piloto_id for pos in posiciones if pos.es_vuelta_rapida), None)

    aciertos = 0
    if p.piloto_p1_id and pos_dict.get(1) == p.piloto_p1_id:
        aciertos += 1
    if p.piloto_p2_id and pos_dict.get(2) == p.piloto_p2_id:
        aciertos += 1
    if p.piloto_p3_id and pos_dict.get(3) == p.piloto_p3_id:
        aciertos += 1
    if p.piloto_pole_id and p.piloto_pole_id == pole_pilot_id:
        aciertos += 1
    if p.piloto_vuelta_rapida_id and p.piloto_vuelta_rapida_id == vr_pilot_id:
        aciertos += 1

    return aciertos


def enriquecer_pronostico(db: Session, p: models.Pronostico) -> schemas.PronosticoOut:
    aciertos = calcular_aciertos(db, p)
    out = schemas.PronosticoOut.model_validate(p)
    out.aciertos = aciertos
    out.gran_premio_nombre = p.gran_premio.nombre if p.gran_premio else None
    out.gran_premio_finalizado = p.gran_premio.finalizado if p.gran_premio else False
    return out
