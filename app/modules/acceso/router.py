from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config import FRONTEND_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
from app.core.security import get_current_user
from app.database import get_db
from app.modules.acceso import crud, models, schemas
from app.modules.auth.models import Usuario

try:
    import stripe
except ImportError:
    stripe = None

router = APIRouter(prefix="/acceso", tags=["Acceso/Pase"])


def obtener_stripe():
    if not stripe or not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe sandbox no esta configurado. Define STRIPE_SECRET_KEY con una clave sk_test_.",
        )
    stripe.api_key = STRIPE_SECRET_KEY
    return stripe


@router.post("/checkout", response_model=schemas.CheckoutSessionOut)
def crear_checkout_session(
    _: schemas.CheckoutSessionCreate,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not usuario.telefono_verificado:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="telefono_no_verificado")
    if usuario.kyc_estado != "aprobado":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="kyc_no_aprobado")
    if crud.obtener_pase_activo(db, usuario.id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya posees un pase de temporada activo.")

    cliente_stripe = obtener_stripe()
    base_url = FRONTEND_URL.rstrip("/")
    try:
        session = cliente_stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": "Pase de Temporada F1",
                        "description": "Acceso ilimitado a los pronosticos por un ano",
                    },
                    "unit_amount": 2000,
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"{base_url}/perfil?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{base_url}/perfil?checkout_cancelado=1",
            client_reference_id=str(usuario.id),
            metadata={"usuario_id": str(usuario.id), "producto": "pase_temporada"},
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="No se pudo iniciar Stripe Checkout.") from exc

    crud.crear_pase_pendiente(db, usuario.id, session.id)
    return schemas.CheckoutSessionOut(session_id=session.id, checkout_url=session.url)


@router.post("/checkout/{session_id}/confirmar", response_model=schemas.PaseTemporadaBase)
def confirmar_checkout(
    session_id: str,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pase = crud.obtener_pase_por_session_usuario(db, session_id, usuario.id)
    if not pase:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesion de pago no encontrada.")
    if pase.estado == "activo":
        return pase

    cliente_stripe = obtener_stripe()
    try:
        session = cliente_stripe.checkout.Session.retrieve(session_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="No se pudo verificar el pago en Stripe.") from exc

    if session.get("client_reference_id") != str(usuario.id) or session.get("payment_status") != "paid":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El pago aun no ha sido confirmado por Stripe.")

    pago = crud.activar_pase_por_session(db, session_id, str(session.get("payment_intent") or ""))
    if not pago:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pase de temporada no encontrado.")
    return pago


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    cliente_stripe = obtener_stripe()
    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="STRIPE_WEBHOOK_SECRET no configurado.")

    try:
        event = cliente_stripe.Webhook.construct_event(
            await request.body(), request.headers.get("stripe-signature"), STRIPE_WEBHOOK_SECRET
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Webhook de Stripe invalido.") from exc

    session = event["data"]["object"]
    if event["type"] == "checkout.session.completed" and session.get("payment_status") == "paid":
        crud.activar_pase_por_session(db, session["id"], str(session.get("payment_intent") or ""))
    elif event["type"] == "checkout.session.expired":
        crud.fallar_pase_por_session(db, session["id"])
    return {"status": "success"}


@router.get("/pase", response_model=schemas.PaseTemporadaBase | None)
def consultar_pase(usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    pase = crud.obtener_pase_activo(db, usuario.id)
    if not pase:
        pase = (
            db.query(models.PaseTemporada)
            .filter(models.PaseTemporada.usuario_id == usuario.id)
            .order_by(models.PaseTemporada.created_at.desc())
            .first()
        )
    return pase
