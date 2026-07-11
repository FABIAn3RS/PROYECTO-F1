import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from app.modules.escuderias.schemas import EscuderiaOut


class PilotoBase(BaseModel):
    nombre: str = Field(..., max_length=100)
    nacionalidad: str | None = Field(None, max_length=80)
    numero: int | None = None
    escuderia_id: uuid.UUID | None = None
    temporada: int


class PilotoCreate(PilotoBase):
    pass


class PilotoUpdate(BaseModel):
    nombre: str | None = Field(None, max_length=100)
    nacionalidad: str | None = Field(None, max_length=80)
    numero: int | None = None
    escuderia_id: uuid.UUID | None = None
    puntos_temporada: int | None = None
    temporada: int | None = None


class PilotoOut(PilotoBase):
    id: uuid.UUID
    puntos_temporada: int
    created_at: datetime
    updated_at: datetime
    escuderia: EscuderiaOut | None = None

    class Config:
        from_attributes = True
