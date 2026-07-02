-- =========================================
-- EXTENSIONES
-- =========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- TABLA: roles
-- =========================================
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(30) NOT NULL UNIQUE,   -- 'usuario', 'administrador'
    descripcion VARCHAR(150),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================================
-- TABLA: usuarios
-- =========================================
CREATE TABLE usuarios (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre          VARCHAR(100) NOT NULL,
    correo          VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    rol_id          INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usuarios_correo ON usuarios(correo);
CREATE INDEX idx_usuarios_rol ON usuarios(rol_id);

-- =========================================
-- TABLA: password_reset_tokens (HU-03)
-- =========================================
CREATE TABLE password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token       VARCHAR(255) NOT NULL UNIQUE,
    expira_en   TIMESTAMP NOT NULL,
    usado       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reset_token ON password_reset_tokens(token);

-- =========================================
-- TRIGGER: actualizar updated_at automáticamente
-- =========================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================
-- SEED: roles base
-- =========================================
INSERT INTO roles (nombre, descripcion) VALUES
('usuario', 'Usuario estándar de la plataforma'),
('administrador', 'Gestiona el sistema: GPs, pilotos, escuderías y resultados');

-- =========================================
-- SEED: usuario admin de prueba
-- (password_hash de ejemplo, reemplázalo por un hash real bcrypt)
-- =========================================
INSERT INTO usuarios (nombre, correo, password_hash, rol_id)
VALUES (
    'Admin',
    'admin@pronosticos.com',
    '$2b$10$reemplazaEsteHashPorUnoReal',
    (SELECT id FROM roles WHERE nombre = 'administrador')
);