from sqlalchemy import Column, Integer, Boolean, ForeignKey, DateTime, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class ResultadoOficial(Base):
    __tablename__ = "resultados_oficiales"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    gran_premio_id = Column(
        UUID(as_uuid=True),
        ForeignKey("grandes_premios.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )
    registrado_en = Column(DateTime, server_default=func.now())

    gran_premio = relationship("GranPremio")
    posiciones = relationship("ResultadoPosicion", back_populates="resultado", cascade="all, delete-orphan")


class ResultadoPosicion(Base):
    __tablename__ = "resultado_posiciones"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    resultado_id = Column(UUID(as_uuid=True), ForeignKey("resultados_oficiales.id", ondelete="CASCADE"), nullable=False)
    piloto_id = Column(UUID(as_uuid=True), ForeignKey("pilotos.id", ondelete="RESTRICT"), nullable=False)

    posicion = Column(Integer, nullable=False)
    es_pole = Column(Boolean, nullable=False, default=False)
    es_vuelta_rapida = Column(Boolean, nullable=False, default=False)
    puntos_obtenidos = Column(Integer, nullable=False, default=0)

    resultado = relationship("ResultadoOficial", back_populates="posiciones")
    piloto = relationship("Piloto")
