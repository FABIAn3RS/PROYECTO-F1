from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Pronostico(Base):
    __tablename__ = "pronosticos"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    gran_premio_id = Column(UUID(as_uuid=True), ForeignKey("grandes_premios.id", ondelete="CASCADE"), nullable=False)

    # Pilotos elegidos
    piloto_p1_id = Column(UUID(as_uuid=True), ForeignKey("pilotos.id", ondelete="SET NULL"), nullable=True)
    piloto_p2_id = Column(UUID(as_uuid=True), ForeignKey("pilotos.id", ondelete="SET NULL"), nullable=True)
    piloto_p3_id = Column(UUID(as_uuid=True), ForeignKey("pilotos.id", ondelete="SET NULL"), nullable=True)
    piloto_pole_id = Column(UUID(as_uuid=True), ForeignKey("pilotos.id", ondelete="SET NULL"), nullable=True)
    piloto_vuelta_rapida_id = Column(UUID(as_uuid=True), ForeignKey("pilotos.id", ondelete="SET NULL"), nullable=True)

    confirmado = Column(Boolean, nullable=False, default=False)
    puntos_obtenidos = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    usuario = relationship("Usuario", foreign_keys=[usuario_id])
    gran_premio = relationship("GranPremio", foreign_keys=[gran_premio_id])
    
    piloto_p1 = relationship("Piloto", foreign_keys=[piloto_p1_id])
    piloto_p2 = relationship("Piloto", foreign_keys=[piloto_p2_id])
    piloto_p3 = relationship("Piloto", foreign_keys=[piloto_p3_id])
    piloto_pole = relationship("Piloto", foreign_keys=[piloto_pole_id])
    piloto_vuelta_rapida = relationship("Piloto", foreign_keys=[piloto_vuelta_rapida_id])
