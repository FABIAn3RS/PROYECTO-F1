import uuid
from datetime import datetime
from pydantic import BaseModel
from app.modules.pilotos.schemas import PilotoOut


class ResultadoPosicionBase(BaseModel):
    piloto_id: uuid.UUID
    posicion: int
    es_pole: bool
    es_vuelta_rapida: bool
    puntos_obtenidos: int


class ResultadoPosicionCreate(ResultadoPosicionBase):
    pass


class ResultadoPosicionOut(ResultadoPosicionBase):
    id: uuid.UUID
    piloto: PilotoOut | None = None

    class Config:
        from_attributes = True


class ResultadoOficialOut(BaseModel):
    id: uuid.UUID
    gran_premio_id: uuid.UUID
    registrado_en: datetime
    posiciones: list[ResultadoPosicionOut]

    class Config:
        from_attributes = True


class UsuarioRankingOut(BaseModel):
    nombre: str
    puntos_totales: int
    posicion_ranking: int
