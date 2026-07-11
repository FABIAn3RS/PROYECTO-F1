import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class EscuderiaBase(BaseModel):
    nombre: str = Field(..., max_length=100)
    nacionalidad: str | None = Field(None, max_length=80)
    color: str | None = Field(None, max_length=7)
    temporada: int


class EscuderiaCreate(EscuderiaBase):
    pass


class EscuderiaUpdate(BaseModel):
    nombre: str | None = Field(None, max_length=100)
    nacionalidad: str | None = Field(None, max_length=80)
    color: str | None = Field(None, max_length=7)
    puntos_temporada: int | None = None
    temporada: int | None = None


class EscuderiaOut(EscuderiaBase):
    id: uuid.UUID
    puntos_temporada: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
