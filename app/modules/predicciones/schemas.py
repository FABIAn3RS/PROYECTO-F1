import uuid
from datetime import datetime
from enum import Enum
from pydantic import BaseModel


class NivelConfianza(str, Enum):
    BAJO = "bajo"
    MEDIO = "medio"
    ALTO = "alto"


class PilotoProbabilidad(BaseModel):
    piloto_id: uuid.UUID
    nombre: str
    escuderia: str | None = None
    puntaje: float
    probabilidad: float


class PrediccionGPOut(BaseModel):
    gran_premio_id: uuid.UUID
    temporada: int
    generado_en: datetime
    ganador_probable: PilotoProbabilidad
    podio_probable: list[PilotoProbabilidad]
    probabilidades: list[PilotoProbabilidad]
    nivel_confianza: NivelConfianza
    observaciones: list[str]
