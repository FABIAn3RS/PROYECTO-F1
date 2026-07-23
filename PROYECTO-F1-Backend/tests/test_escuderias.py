import pytest
import uuid
from datetime import datetime
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import status

from app.main import app
from app.modules.escuderias import models, schemas, crud

client = TestClient(app)

@pytest.fixture
def mock_db():
    db = MagicMock()
    return db

# ----------------------------------------------------
# 1. Tests de CRUD (Lógica directa)
# ----------------------------------------------------

def test_obtener_escuderia_crud(mock_db):
    escuderia_id = uuid.uuid4()
    mock_escuderia = models.Escuderia(id=escuderia_id, nombre="Scuderia Ferrari")
    mock_db.query().filter().first.return_value = mock_escuderia

    res = crud.obtener_escuderia(mock_db, escuderia_id)
    assert res == mock_escuderia
    assert res.nombre == "Scuderia Ferrari"

def test_listar_escuderias_crud(mock_db):
    mock_escuderias = [
        models.Escuderia(id=uuid.uuid4(), nombre="Red Bull Racing", temporada=2024),
        models.Escuderia(id=uuid.uuid4(), nombre="Mercedes AMG", temporada=2024)
    ]
    mock_db.query().all.return_value = mock_escuderias
    
    res = crud.listar_escuderias(mock_db)
    assert len(res) == 2
    assert res[0].nombre == "Red Bull Racing"

def test_listar_escuderias_con_temporada_crud(mock_db):
    mock_db.query().filter().all.return_value = []
    res = crud.listar_escuderias(mock_db, temporada=2024)
    assert len(res) == 0

def test_listar_clasificacion_escuderias_crud(mock_db):
    mock_db.query().filter().order_by().all.return_value = []
    res = crud.listar_clasificacion_escuderias(mock_db, temporada=2024)
    assert len(res) == 0

def test_crear_escuderia_crud(mock_db):
    datos = schemas.EscuderiaCreate(
        nombre="McLaren",
        nacionalidad="Británica",
        color="#FF8000",
        temporada=2024
    )
    res = crud.crear_escuderia(mock_db, datos)
    assert res.nombre == "McLaren"
    assert res.puntos_temporada == 0
    assert mock_db.add.called
    assert mock_db.commit.called

def test_actualizar_escuderia_crud(mock_db):
    escuderia = models.Escuderia(nombre="McLaren", puntos_temporada=0)
    datos = schemas.EscuderiaUpdate(puntos_temporada=43)
    res = crud.actualizar_escuderia(mock_db, escuderia, datos)
    assert res.puntos_temporada == 43
    assert mock_db.commit.called

def test_eliminar_escuderia_crud(mock_db):
    escuderia = models.Escuderia(nombre="McLaren")
    crud.eliminar_escuderia(mock_db, escuderia)
    assert mock_db.delete.called
    assert mock_db.commit.called

# ----------------------------------------------------
# 2. Tests de API/Router (Llamadas endpoints)
# ----------------------------------------------------

@patch("app.modules.escuderias.router.crud")
def test_api_listar_todas(mock_crud, mock_db):
    escuderia_id = uuid.uuid4()
    mock_crud.listar_escuderias.return_value = [
        models.Escuderia(
            id=escuderia_id,
            nombre="Ferrari",
            nacionalidad="Italiana",
            color="#FF0000",
            temporada=2024,
            puntos_temporada=250,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    ]
    
    from app.database import get_db
    app.dependency_overrides[get_db] = lambda: mock_db
    
    try:
        response = client.get("/escuderias?temporada=2024")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["nombre"] == "Ferrari"
    finally:
        app.dependency_overrides.clear()

@patch("app.modules.escuderias.router.crud")
def test_api_obtener_clasificacion_escuderias(mock_crud, mock_db):
    mock_crud.listar_clasificacion_escuderias.return_value = []
    
    from app.database import get_db
    app.dependency_overrides[get_db] = lambda: mock_db
    
    try:
        response = client.get("/escuderias/clasificacion?temporada=2024")
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []
    finally:
        app.dependency_overrides.clear()

@patch("app.modules.escuderias.router.crud")
def test_api_obtener_detalle_escuderia_exito(mock_crud, mock_db):
    escuderia_id = uuid.uuid4()
    mock_crud.obtener_escuderia.return_value = models.Escuderia(
        id=escuderia_id,
        nombre="Ferrari",
        nacionalidad="Italiana",
        color="#FF0000",
        temporada=2024,
        puntos_temporada=250,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    from app.database import get_db
    app.dependency_overrides[get_db] = lambda: mock_db
    
    try:
        response = client.get(f"/escuderias/{escuderia_id}")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["nombre"] == "Ferrari"
    finally:
        app.dependency_overrides.clear()

@patch("app.modules.escuderias.router.crud")
def test_api_obtener_detalle_escuderia_no_encontrada(mock_crud, mock_db):
    escuderia_id = uuid.uuid4()
    mock_crud.obtener_escuderia.return_value = None
    
    from app.database import get_db
    app.dependency_overrides[get_db] = lambda: mock_db
    
    try:
        response = client.get(f"/escuderias/{escuderia_id}")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "Escudería no encontrada" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()
