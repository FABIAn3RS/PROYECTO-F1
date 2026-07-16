from sqlalchemy import Column, String, Integer, Boolean, DateTime, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class GranPremio(Base):
    __tablename__ = "grandes_premios"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    nombre = Column(String(150), nullable=False)
    pais = Column(String(100), nullable=False)
    circuito = Column(String(150), nullable=False)
    temporada = Column(Integer, nullable=False)
    ronda = Column(Integer, nullable=False)
    fecha_inicio = Column(DateTime, nullable=False)
    fecha_carrera = Column(DateTime, nullable=False)
    finalizado = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
