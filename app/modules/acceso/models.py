from sqlalchemy import Column, String, Integer, Numeric, ForeignKey, DateTime, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class PaseTemporada(Base):
    __tablename__ = "pases_temporada"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    estado = Column(String(20), nullable=False, default="pendiente")
    # valores esperados: 'pendiente', 'activo', 'fallido', 'expirado'

    monto = Column(Numeric(10, 2), nullable=False, default=20.00)
    moneda = Column(String(3), nullable=False, default="usd")

    stripe_checkout_session_id = Column(String(255), unique=True, nullable=True)
    stripe_payment_intent_id = Column(String(255), unique=True, nullable=True)

    fecha_pago = Column(DateTime, nullable=True)
    fecha_expiracion = Column(DateTime, nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    usuario = relationship("Usuario", foreign_keys=[usuario_id])
