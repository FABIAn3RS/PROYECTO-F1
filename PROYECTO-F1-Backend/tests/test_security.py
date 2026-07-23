import pytest
from unittest.mock import MagicMock, patch
from datetime import timedelta
from jose import jwt
from fastapi import HTTPException

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_admin,
    token_blacklist
)
from app.config import SECRET_KEY, ALGORITHM
from app.modules.auth import models

def test_hash_and_verify_password():
    password = "MySuperSecretPassword123"
    hashed = hash_password(password)
    
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False
    # Bcrypt should return False on invalid hashes without raising exceptions
    assert verify_password(password, "invalid_hash") is False

def test_create_access_token():
    data = {"sub": "12345"}
    token = create_access_token(data, expires_delta=timedelta(minutes=15))
    
    decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert decoded["sub"] == "12345"
    assert "exp" in decoded

def test_get_current_user_success():
    # Setup mocks
    db_mock = MagicMock()
    user_mock = models.Usuario(id="12345", correo="test@example.com", activo=True)
    db_mock.query().filter().first.return_value = user_mock
    
    token = create_access_token({"sub": "12345"})
    
    user = get_current_user(token=token, db=db_mock)
    assert user == user_mock
    assert user.correo == "test@example.com"

def test_get_current_user_blacklisted():
    db_mock = MagicMock()
    token = create_access_token({"sub": "12345"})
    token_blacklist.add(token)
    
    try:
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(token=token, db=db_mock)
        assert exc_info.value.status_code == 401
    finally:
        token_blacklist.remove(token)

def test_get_current_user_invalid_token():
    db_mock = MagicMock()
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(token="invalid_token_string", db=db_mock)
    assert exc_info.value.status_code == 401

def test_get_current_user_not_found_or_inactive():
    db_mock = MagicMock()
    db_mock.query().filter().first.return_value = None  # User not found in DB
    
    token = create_access_token({"sub": "12345"})
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(token=token, db=db_mock)
    assert exc_info.value.status_code == 401

def test_get_current_admin_success():
    role_mock = MagicMock()
    role_mock.nombre = "administrador"
    
    user_mock = MagicMock()
    user_mock.rol = role_mock
    
    admin = get_current_admin(usuario=user_mock)
    assert admin == user_mock

def test_get_current_admin_forbidden():
    role_mock = MagicMock()
    role_mock.nombre = "usuario"
    
    user_mock = MagicMock()
    user_mock.rol = role_mock
    
    with pytest.raises(HTTPException) as exc_info:
        get_current_admin(usuario=user_mock)
    assert exc_info.value.status_code == 403
