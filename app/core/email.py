import json
import logging
import urllib.request
import urllib.error
from app import config

logger = logging.getLogger("app.email")


def send_verification_email(to_email: str, code: str) -> bool:
    """
    Sends a verification code email using the Resend API.
    If RESEND_API_KEY is 'mock' or not configured, it logs the email to stdout/console.
    """
    subject = "Código de verificación - F1 Pronósticos"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #e10600; text-align: center;">F1 Pronósticos Deportivos</h2>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
        <p>Hola,</p>
        <p>Gracias por registrarte en nuestra plataforma de pronósticos de Fórmula 1. Para completar tu registro y verificar tu dirección de correo electrónico, por favor ingresa el siguiente código de 6 dígitos en la aplicación:</p>
        <div style="background-color: #f7f7f7; padding: 15px; border-radius: 6px; text-align: center; margin: 25px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333333;">{code}</span>
        </div>
        <p style="font-size: 13px; color: #666666;">Este código expirará en 15 minutos. Si no solicitaste este registro, puedes ignorar este correo de forma segura.</p>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #999999; text-align: center;">F1 Pronósticos &copy; 2026. Todos los derechos reservados.</p>
    </div>
    """

    if not config.RESEND_API_KEY or config.RESEND_API_KEY == "mock":
        # Print clearly to logs/stdout so developer can grab it easily
        print("\n" + "=" * 60)
        print(f" MOCK EMAIL SENT TO: {to_email}")
        print(f" SUBJECT: {subject}")
        print(f" VERIFICATION CODE: {code}")
        print("=" * 60 + "\n")
        logger.info(f"[MOCK EMAIL] Sent code {code} to {to_email}")
        return True

    # Call Resend REST API
    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {config.RESEND_API_KEY}",
        "Content-Type": "application/json",
        "User-Agent": "F1PronosticosBackend/1.0"  # <-- ESTA LÍNEA SOLUCIONA EL ERROR 1010
    }
    payload = {
        "from": f"F1 Pronósticos <{config.RESEND_FROM_EMAIL}>",
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode("utf-8")
            logger.info(f"Resend email sent successfully: {res_body}")
            return True
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        logger.error(f"HTTP Error sending email via Resend: {e.code} - {err_body}")
        return False
    except Exception as e:
        logger.error(f"Error sending email via Resend: {str(e)}")
        return False


def send_password_reset_email(to_email: str, token: str) -> bool:
    """
    Sends a password reset link using the Resend API.
    If RESEND_API_KEY is 'mock' or not configured, it logs the reset link to stdout/console.
    """
    reset_url = f"{config.FRONTEND_URL}/restablecer-password?token={token}"
    subject = "Recuperación de cuenta - F1 Pronósticos"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #e10600; text-align: center;">F1 Pronósticos Deportivos</h2>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
        <p>Hola,</p>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <p style="text-align: center; margin: 25px 0;">
            <a href="{reset_url}" style="display: inline-block; background-color: #e10600; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">
                Restablecer contraseña
            </a>
        </p>
        <p style="font-size: 13px; color: #666666;">Este enlace expirará en 30 minutos. Si no solicitaste recuperar tu cuenta, puedes ignorar este correo de forma segura.</p>
        <p style="font-size: 12px; color: #888888; word-break: break-all;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br />{reset_url}</p>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #999999; text-align: center;">F1 Pronósticos &copy; 2026. Todos los derechos reservados.</p>
    </div>
    """

    if not config.RESEND_API_KEY or config.RESEND_API_KEY == "mock":
        print("\n" + "=" * 60)
        print(f" MOCK EMAIL SENT TO: {to_email}")
        print(f" SUBJECT: {subject}")
        print(f" RESET URL: {reset_url}")
        print("=" * 60 + "\n")
        logger.info(f"[MOCK EMAIL] Sent password reset link to {to_email}")
        return True

    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {config.RESEND_API_KEY}",
        "Content-Type": "application/json",
        "User-Agent": "F1PronosticosBackend/1.0",
    }
    payload = {
        "from": f"F1 Pronósticos <{config.RESEND_FROM_EMAIL}>",
        "to": [to_email],
        "subject": subject,
        "html": html_content,
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode("utf-8")
            logger.info(f"Resend password reset email sent successfully: {res_body}")
            return True
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        logger.error(f"HTTP Error sending password reset email via Resend: {e.code} - {err_body}")
        return False
    except Exception as e:
        logger.error(f"Error sending password reset email via Resend: {str(e)}")
        return False
