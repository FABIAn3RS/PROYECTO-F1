-- =========================================
-- EXTENSIONES
-- =========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- EP-01: roles y usuarios
-- =========================================
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(30) NOT NULL UNIQUE,
    descripcion VARCHAR(150),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE usuarios (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre          VARCHAR(100) NOT NULL,
    correo          VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    rol_id          INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    correo_verificado BOOLEAN NOT NULL DEFAULT FALSE,
    telefono        VARCHAR(30),
    telefono_verificado BOOLEAN NOT NULL DEFAULT FALSE,
    kyc_estado      VARCHAR(20) NOT NULL DEFAULT 'pendiente',

    -- EP-02: preferencias de perfil (las FK a pilotos/escuderias se agregan más abajo con ALTER,
    -- porque esas tablas todavía no existen en este punto del script)
    piloto_favorito_id     UUID,
    escuderia_favorita_id  UUID,

    -- EP-07: carrera gratis asignada la primera vez que el usuario abre el detalle de un GP
    gp_gratis_id    UUID,

    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usuarios_correo ON usuarios(correo);
CREATE INDEX idx_usuarios_rol ON usuarios(rol_id);

CREATE TABLE password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token       VARCHAR(255) NOT NULL UNIQUE,
    expira_en   TIMESTAMP NOT NULL,
    usado       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE codigos_verificacion (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    codigo      VARCHAR(6) NOT NULL,
    expira_en   TIMESTAMP NOT NULL,
    usado       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reset_token ON password_reset_tokens(token);
CREATE INDEX idx_codigos_verificacion_usuario ON codigos_verificacion(usuario_id);

-- =========================================
-- EP-03: Calendario de Grandes Premios
-- =========================================
CREATE TABLE grandes_premios (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre          VARCHAR(150) NOT NULL,          -- ej. "Gran Premio de Mónaco"
    pais            VARCHAR(100) NOT NULL,
    circuito        VARCHAR(150) NOT NULL,
    temporada       INTEGER NOT NULL,                -- ej. 2026
    ronda           INTEGER NOT NULL,                -- número de carrera en la temporada, para ordenar
    fecha_inicio    TIMESTAMP NOT NULL,               -- inicio del fin de semana (prácticas)
    fecha_carrera   TIMESTAMP NOT NULL,               -- fecha/hora de la carrera

    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (temporada, ronda)
);

CREATE INDEX idx_gp_temporada ON grandes_premios(temporada);
CREATE INDEX idx_gp_fecha_carrera ON grandes_premios(fecha_carrera);

-- El estado (próximo / en curso / finalizado) de HU-10 NO se guarda como columna:
-- se calcula comparando fecha_inicio / fecha_carrera contra NOW() en el backend.

-- =========================================
-- EP-04: Escuderías y Pilotos
-- =========================================
CREATE TABLE escuderias (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre              VARCHAR(100) NOT NULL,
    nacionalidad        VARCHAR(80),
    color               VARCHAR(7),                   -- código hex, ej. '#FF1801'
    puntos_temporada    INTEGER NOT NULL DEFAULT 0,    -- HU-14: clasificación de constructores
    temporada           INTEGER NOT NULL,

    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (nombre, temporada)
);

CREATE INDEX idx_escuderias_temporada ON escuderias(temporada);

CREATE TABLE pilotos (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre              VARCHAR(100) NOT NULL,
    nacionalidad        VARCHAR(80),
    numero              INTEGER,
    escuderia_id        UUID REFERENCES escuderias(id) ON DELETE SET NULL,
    puntos_temporada    INTEGER NOT NULL DEFAULT 0,    -- HU-13: clasificación de pilotos
    temporada           INTEGER NOT NULL,

    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pilotos_escuderia ON pilotos(escuderia_id);
CREATE INDEX idx_pilotos_temporada ON pilotos(temporada);

-- Ahora que ya existen pilotos y escuderias, se agregan las FK pendientes en usuarios
ALTER TABLE usuarios
    ADD CONSTRAINT fk_usuarios_piloto_favorito
        FOREIGN KEY (piloto_favorito_id) REFERENCES pilotos(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_usuarios_escuderia_favorita
        FOREIGN KEY (escuderia_favorita_id) REFERENCES escuderias(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_usuarios_gp_gratis
        FOREIGN KEY (gp_gratis_id) REFERENCES grandes_premios(id) ON DELETE SET NULL;

-- =========================================
-- EP-05: Resultados oficiales
-- =========================================
CREATE TABLE resultados_oficiales (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gran_premio_id  UUID NOT NULL UNIQUE REFERENCES grandes_premios(id) ON DELETE CASCADE,
    registrado_en   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE resultado_posiciones (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resultado_id        UUID NOT NULL REFERENCES resultados_oficiales(id) ON DELETE CASCADE,
    piloto_id           UUID NOT NULL REFERENCES pilotos(id) ON DELETE RESTRICT,

    posicion            INTEGER NOT NULL,               -- 1 = ganador, 1-3 = podio
    es_pole             BOOLEAN NOT NULL DEFAULT FALSE,
    es_vuelta_rapida    BOOLEAN NOT NULL DEFAULT FALSE,
    puntos_obtenidos    INTEGER NOT NULL DEFAULT 0,

    UNIQUE (resultado_id, posicion),
    UNIQUE (resultado_id, piloto_id)
);

CREATE INDEX idx_resultado_posiciones_resultado ON resultado_posiciones(resultado_id);
CREATE INDEX idx_resultado_posiciones_piloto ON resultado_posiciones(piloto_id);

-- =========================================
-- EP-07: Pase de Temporada
-- =========================================
CREATE TABLE pases_temporada (
    id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id                      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    estado                          VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    -- valores esperados: 'pendiente', 'activo', 'fallido', 'expirado'

    monto                           NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
    moneda                          VARCHAR(3) NOT NULL DEFAULT 'usd',

    stripe_checkout_session_id      VARCHAR(255) UNIQUE,
    stripe_payment_intent_id        VARCHAR(255) UNIQUE,

    fecha_pago                      TIMESTAMP,
    fecha_expiracion                TIMESTAMP,          -- fecha_pago + 1 año exacto, sin prorrateo

    created_at                      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pases_usuario ON pases_temporada(usuario_id);
CREATE INDEX idx_pases_estado ON pases_temporada(estado);

-- =========================================
-- EP-05: Pronósticos de carreras
-- =========================================
CREATE TABLE pronosticos (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id              UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    gran_premio_id          UUID NOT NULL REFERENCES grandes_premios(id) ON DELETE CASCADE,
    
    piloto_p1_id            UUID REFERENCES pilotos(id) ON DELETE SET NULL,
    piloto_p2_id            UUID REFERENCES pilotos(id) ON DELETE SET NULL,
    piloto_p3_id            UUID REFERENCES pilotos(id) ON DELETE SET NULL,
    piloto_pole_id          UUID REFERENCES pilotos(id) ON DELETE SET NULL,
    piloto_vuelta_rapida_id UUID REFERENCES pilotos(id) ON DELETE SET NULL,
    
    confirmado              BOOLEAN NOT NULL DEFAULT FALSE,
    puntos_obtenidos        INTEGER NOT NULL DEFAULT 0,
    
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE (usuario_id, gran_premio_id)
);

CREATE INDEX idx_pronosticos_usuario ON pronosticos(usuario_id);
CREATE INDEX idx_pronosticos_gp ON pronosticos(gran_premio_id);

-- =========================================
-- TRIGGER GENÉRICO: actualizar updated_at automáticamente
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
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_grandes_premios_updated_at
BEFORE UPDATE ON grandes_premios
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_escuderias_updated_at
BEFORE UPDATE ON escuderias
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_pilotos_updated_at
BEFORE UPDATE ON pilotos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_pases_temporada_updated_at
BEFORE UPDATE ON pases_temporada
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_pronosticos_updated_at
BEFORE UPDATE ON pronosticos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

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
INSERT INTO usuarios (nombre, correo, password_hash, rol_id, correo_verificado)
VALUES (
    'Admin',
    'admin@pronosticos.com',
    '$2b$10$rjT2nVyKPOG/BF985IyfHuG5z9fJZMw0DCfTRcM8eXTja.wtEqT3a',
    (SELECT id FROM roles WHERE nombre = 'administrador'),
    TRUE
);
