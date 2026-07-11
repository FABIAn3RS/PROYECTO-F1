import uuid
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, computed_field


class EstadoGP(str, Enum):
    PROXIMO = "proximo"
    EN_CURSO = "en_curso"
    FINALIZADO = "finalizado"


class GranPremioBase(BaseModel):
    id: uuid.UUID
    nombre: str
    pais: str
    circuito: str
    temporada: int
    ronda: int
    fecha_inicio: datetime
    fecha_carrera: datetime

    class Config:
        from_attributes = True

    @computed_field
    @property
    def estado(self) -> EstadoGP:
        # HU-10: se calcula al vuelo, no se guarda en BD
        ahora = datetime.now(self.fecha_inicio.tzinfo)
        if ahora < self.fecha_inicio:
            return EstadoGP.PROXIMO
        if self.fecha_inicio <= ahora <= self.fecha_carrera:
            return EstadoGP.EN_CURSO
        return EstadoGP.FINALIZADO


class GranPremioListItem(GranPremioBase):
    """HU-08: lo que se muestra en la lista del calendario (siempre libre)."""
    pass


class GranPremioDetalle(GranPremioBase):
    """HU-09: detalle completo de un GP (protegido por verificar_acceso)."""
    pass
