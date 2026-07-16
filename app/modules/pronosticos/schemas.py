import uuid
from datetime import datetime
from pydantic import BaseModel


class PronosticoBase(BaseModel):
    gran_premio_id: uuid.UUID
    piloto_p1_id: uuid.UUID | None = None
    piloto_p2_id: uuid.UUID | None = None
    piloto_p3_id: uuid.UUID | None = None
    piloto_pole_id: uuid.UUID | None = None
    piloto_vuelta_rapida_id: uuid.UUID | None = None


class PronosticoCreate(PronosticoBase):
    pass


class PronosticoUpdate(BaseModel):
    piloto_p1_id: uuid.UUID | None = None
    piloto_p2_id: uuid.UUID | None = None
    piloto_p3_id: uuid.UUID | None = None
    piloto_pole_id: uuid.UUID | None = None
    piloto_vuelta_rapida_id: uuid.UUID | None = None


class PronosticoOut(PronosticoBase):
    id: uuid.UUID
    usuario_id: uuid.UUID
    confirmado: bool
    puntos_obtenidos: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OpcionPopularOut(BaseModel):
    piloto_id: uuid.UUID
    piloto_nombre: str
    votos: int
    porcentaje: float


class CategoriaPopularOut(BaseModel):
    categoria: str
    etiqueta: str
    opciones: list[OpcionPopularOut]


class PronosticosPopularesOut(BaseModel):
    gran_premio_id: uuid.UUID
    total_confirmados: int
    categorias: list[CategoriaPopularOut]
