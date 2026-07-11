import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from app.modules.resultados.schemas import ResultadoPosicionCreate


class GranPremioCreate(BaseModel):
    nombre: str = Field(..., max_length=150)
    pais: str = Field(..., max_length=100)
    circuito: str = Field(..., max_length=150)
    temporada: int
    ronda: int
    fecha_inicio: datetime
    fecha_carrera: datetime


class GranPremioUpdate(BaseModel):
    nombre: str | None = Field(None, max_length=150)
    pais: str | None = Field(None, max_length=100)
    circuito: str | None = Field(None, max_length=150)
    temporada: int | None = None
    ronda: int | None = None
    fecha_inicio: datetime | None = None
    fecha_carrera: datetime | None = None


class ResultadoOficialCreate(BaseModel):
    posiciones: list[ResultadoPosicionCreate]
