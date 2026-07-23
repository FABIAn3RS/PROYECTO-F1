import pytest
import uuid
from datetime import datetime
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import status

from app.main import app
from app.modules.pilotos import models, schemas, crud

client = TestClient(app)

@pytest.fixture
def mock_db():
    db = MagicMock()
    return db

# ----------------------------------------------------
# 1. Tests de CRUD (Lógica directa)
# ----------------------------------------------------

def test_obtener_piloto_crud(mock_db):
    piloto_id = uuid.uuid4()
    mock_piloto = models.Piloto(id=piloto_id, nombre="Lewis Hamilton")
    mock_db.query().filter().first.return_value = mock_piloto

    res = crud.obtener_piloto(mock_db, piloto_id)
    assert res == mock_piloto
    assert res.nombre == "Lewis Hamilton"

def test_listar_pilotos_crud(mock_db):
    mock_pilotos = [
        models.Piloto(id=uuid.uuid4(), nombre="Max Verstappen", temporada=2024),
        models.Piloto(id=uuid.uuid4(), nombre="Lando Norris", temporada=2024)
    ]
    mock_db.query().all.return_value = mock_pilotos
    
    res = crud.listar_pilotos(mock_db)
    assert len(res) == 2
    assert res[0].nombre == "Max Verstappen"

def test_listar_pilotos_con_temporada_crud(mock_db):
    mock_db.query().filter().all.return_value = []
    res = crud.listar_pilotos(mock_db, temporada=2024)
    assert len(res) == 0

def test_listar_clasificacion_pilotos_crud(mock_db):
    mock_db.query().filter().order_by().all.return_value = []
    res = crud.listar_clasificacion_pilotos(mock_db, temporada=2024)
    assert len(res) == 0

def test_crear_piloto_crud(mock_db):
    escuderia_id = uuid.uuid4()
    datos = schemas.PilotoCreate(
        nombre="Oscar Piastri",
        nacionalidad="Australiano",
        numero=81,
        escuderia_id=escuderia_id,
        temporada=2024
    )
    res = crud.crear_piloto(mock_db, datos)
    assert res.nombre == "Oscar Piastri"
    assert res.puntos_temporada == 0
    assert mock_db.add.called
    assert mock_db.commit.called

def test_actualizar_piloto_crud(mock_db):
    piloto = models.Piloto(nombre="Oscar Piastri", puntos_temporada=0)
    datos = schemas.PilotoUpdate(puntos_temporada=25)
    res = crud.actualizar_piloto(mock_db, piloto, datos)
    assert res.puntos_temporada == 25
    assert mock_db.commit.called

def test_eliminar_piloto_crud(mock_db):
    piloto = models.Piloto(nombre="Oscar Piastri")
    crud.eliminar_piloto(mock_db, piloto)
    assert mock_db.delete.called
    assert mock_db.commit.called

# ----------------------------------------------------
# 2. Tests de API/Router (Llamadas endpoints)
# ----------------------------------------------------

@patch("app.modules.pilotos.router.crud")
def test_api_listar_todos(mock_crud, mock_db):
    piloto_id = uuid.uuid4()
    mock_crud.listar_pilotos.return_value = [
        models.Piloto(
            id=piloto_id,
            nombre="Charles Leclerc",
            nacionalidad="Monegasco",
            numero=16,
            temporada=2024,
            puntos_temporada=150,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    ]
    
    from app.database import get_db
    app.dependency_overrides[get_db] = lambda: mock_db
    
    try:
        response = client.get("/pilotos?temporada=2024")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["nombre"] == "Charles Leclerc"
    finally:
        app.dependency_overrides.clear()

@patch("app.modules.pilotos.router.crud")
def test_api_obtener_clasificacion(mock_crud, mock_db):
    mock_crud.listar_clasificacion_pilotos.return_value = []
    
    from app.database import get_db
    app.dependency_overrides[get_db] = lambda: mock_db
    
    try:
        response = client.get("/pilotos/clasificacion?temporada=2024")
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []
    finally:
        app.dependency_overrides.clear()

@patch("app.modules.pilotos.router.crud")
def test_api_obtener_detalle_exito(mock_crud, mock_db):
    piloto_id = uuid.uuid4()
    mock_crud.obtener_piloto.return_value = models.Piloto(
        id=piloto_id,
        nombre="Charles Leclerc",
        nacionalidad="Monegasco",
        numero=16,
        temporada=2024,
        puntos_temporada=150,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    from app.database import get_db
    app.dependency_overrides[get_db] = lambda: mock_db
    
    try:
        response = client.get(f"/pilotos/{piloto_id}")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["nombre"] == "Charles Leclerc"
    finally:
        app.dependency_overrides.clear()

@patch("app.modules.pilotos.router.crud")
def test_api_obtener_detalle_no_encontrado(mock_crud, mock_db):
    piloto_id = uuid.uuid4()
    mock_crud.obtener_piloto.return_value = None
    
    from app.database import get_db
    app.dependency_overrides[get_db] = lambda: mock_db
    
    try:
        response = client.get(f"/pilotos/{piloto_id}")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "Piloto no encontrado" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()
