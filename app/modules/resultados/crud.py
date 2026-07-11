import uuid
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.modules.resultados import models
from app.modules.auth.models import Usuario
from app.modules.pronosticos.models import Pronostico


def obtener_resultado_gp(db: Session, gp_id: uuid.UUID) -> models.ResultadoOficial | None:
    return db.query(models.ResultadoOficial).filter(models.ResultadoOficial.gran_premio_id == gp_id).first()


def obtener_ranking_global(db: Session) -> list[dict]:
    # EP-07: Ranking global de usuarios (HU-24)
    ranking_data = (
        db.query(
            Usuario.nombre,
            func.coalesce(func.sum(Pronostico.puntos_obtenidos), 0).label("puntos_totales")
        )
        .outerjoin(Pronostico, (Pronostico.usuario_id == Usuario.id) & (Pronostico.confirmado == True))
        .group_by(Usuario.id, Usuario.nombre)
        .order_by(func.coalesce(func.sum(Pronostico.puntos_obtenidos), 0).desc(), Usuario.nombre.asc())
        .all()
    )

    ranking_list = []
    for idx, row in enumerate(ranking_data, start=1):
        ranking_list.append({
            "nombre": row.nombre,
            "puntos_totales": int(row.puntos_totales),
            "posicion_ranking": idx
        })
    return ranking_list
