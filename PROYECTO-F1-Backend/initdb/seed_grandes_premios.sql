-- =========================================
-- SEED GENERAL DE PRUEBA: Todas las tablas
-- =========================================

-- Limpiar tablas para evitar duplicados / conflictos de FKs
TRUNCATE TABLE pronosticos CASCADE;
TRUNCATE TABLE pases_temporada CASCADE;
TRUNCATE TABLE resultado_posiciones CASCADE;
TRUNCATE TABLE resultados_oficiales CASCADE;
TRUNCATE TABLE password_reset_tokens CASCADE;
TRUNCATE TABLE pilotos CASCADE;
TRUNCATE TABLE escuderias CASCADE;
TRUNCATE TABLE grandes_premios CASCADE;
TRUNCATE TABLE usuarios CASCADE;

-- =========================================
-- 1. Usuarios (incluye Admin y Usuarios de prueba)
-- =========================================
INSERT INTO usuarios (id, nombre, correo, password_hash, rol_id, activo, correo_verificado, created_at, updated_at)
VALUES 
    -- Administrador
    (
        '99999999-9999-9999-9999-999999999999',
        'Admin',
        'admin@pronosticos.com',
        '$2b$12$6S4lxkDQ3JvdWIHB3PGjrODVjVKAt/Nb4iQoeZYIdmMfE/bz2LQSq', -- password123
        (SELECT id FROM roles WHERE nombre = 'administrador'),
        TRUE,
        TRUE,
        NOW() - INTERVAL '30 days', 
        NOW() - INTERVAL '30 days'
    ),
    -- Usuario estándar 1
    (
        'a1111111-1111-1111-1111-111111111111',
        'Juan Pérez',
        'juan.perez@example.com',
        '$2b$12$6S4lxkDQ3JvdWIHB3PGjrODVjVKAt/Nb4iQoeZYIdmMfE/bz2LQSq', -- password123
        (SELECT id FROM roles WHERE nombre = 'usuario'),
        TRUE,
        TRUE,
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '15 days'
    ),
    -- Usuario estándar 2
    (
        'a2222222-2222-2222-2222-222222222222',
        'María López',
        'maria.lopez@example.com',
        '$2b$12$6S4lxkDQ3JvdWIHB3PGjrODVjVKAt/Nb4iQoeZYIdmMfE/bz2LQSq', -- password123
        (SELECT id FROM roles WHERE nombre = 'usuario'),
        TRUE,
        TRUE,
        NOW() - INTERVAL '10 days',
        NOW() - INTERVAL '10 days'
    );

-- =========================================
-- 2. Grandes Premios
-- =========================================
INSERT INTO grandes_premios (id, nombre, pais, circuito, temporada, ronda, fecha_inicio, fecha_carrera, created_at, updated_at)
VALUES
    -- 1. Ya finalizado
    (
        'b1111111-1111-1111-1111-111111111111',
        'Gran Premio de España',
        'España',
        'Circuit de Barcelona-Catalunya',
        2026,
        1,
        NOW() - INTERVAL '10 days',
        NOW() - INTERVAL '8 days',
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '15 days'
    ),

    -- 2. En curso (fin de semana de carrera ahora mismo)
    (
        'b2222222-2222-2222-2222-222222222222',
        'Gran Premio de Gran Bretaña',
        'Reino Unido',
        'Silverstone Circuit',
        2026,
        2,
        NOW() - INTERVAL '1 day',
        NOW() + INTERVAL '1 day',
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '15 days'
    ),

    -- 3. Próximo (dentro de unas semanas) -> candidato a ser el gp_gratis_id de un usuario nuevo
    (
        'b3333333-3333-3333-3333-333333333333',
        'Gran Premio de Hungría',
        'Hungría',
        'Hungaroring',
        2026,
        3,
        NOW() + INTERVAL '18 days',
        NOW() + INTERVAL '20 days',
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '15 days'
    ),

    -- 4. Más adelante en la temporada
    (
        'b4444444-4444-4444-4444-444444444444',
        'Gran Premio de Bélgica',
        'Bélgica',
        'Circuit de Spa-Francorchamps',
        2026,
        4,
        NOW() + INTERVAL '32 days',
        NOW() + INTERVAL '34 days',
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '15 days'
    );

-- =========================================
-- 3. Escuderías
-- =========================================
INSERT INTO escuderias (id, nombre, nacionalidad, color, puntos_temporada, temporada, created_at, updated_at)
VALUES
    (
        'c1111111-1111-1111-1111-111111111111',
        'Red Bull Racing',
        'Austria',
        '#3671C6',
        35,
        2026,
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '15 days'
    ),
    (
        'c2222222-2222-2222-2222-222222222222',
        'Ferrari',
        'Italia',
        '#E80020',
        28,
        2026,
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '15 days'
    ),
    (
        'c3333333-3333-3333-3333-333333333333',
        'Mercedes',
        'Reino Unido',
        '#27F4D2',
        15,
        2026,
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '15 days'
    );

-- =========================================
-- 4. Pilotos
-- =========================================
INSERT INTO pilotos (id, nombre, nacionalidad, numero, escuderia_id, puntos_temporada, temporada, created_at, updated_at)
VALUES
    (
        'd1111111-1111-1111-1111-111111111111',
        'Max Verstappen',
        'Países Bajos',
        1,
        'c1111111-1111-1111-1111-111111111111',
        25,
        2026,
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '15 days'
    ),
    (
        'd2222222-2222-2222-2222-222222222222',
        'Charles Leclerc',
        'Mónaco',
        16,
        'c2222222-2222-2222-2222-222222222222',
        18,
        2026,
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '15 days'
    ),
    (
        'd3333333-3333-3333-3333-333333333333',
        'Lewis Hamilton',
        'Reino Unido',
        44,
        'c2222222-2222-2222-2222-222222222222',
        10,
        2026,
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '15 days'
    ),
    (
        'd4444444-4444-4444-4444-444444444444',
        'Lando Norris',
        'Reino Unido',
        4,
        'c1111111-1111-1111-1111-111111111111',
        10,
        2026,
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '15 days'
    );

-- =========================================
-- 5. Actualizar favoritos del Usuario
-- =========================================
UPDATE usuarios
SET piloto_favorito_id = 'd1111111-1111-1111-1111-111111111111',
    escuderia_favorita_id = 'c2222222-2222-2222-2222-222222222222',
    gp_gratis_id = 'b3333333-3333-3333-3333-333333333333'
WHERE id = 'a1111111-1111-1111-1111-111111111111';

-- =========================================
-- 6. Password Reset Tokens
-- =========================================
INSERT INTO password_reset_tokens (id, usuario_id, token, expira_en, usado, created_at)
VALUES
    (
        '91111111-1111-1111-1111-111111111111',
        'a1111111-1111-1111-1111-111111111111',
        'token_de_prueba_123_abc',
        NOW() + INTERVAL '1 hour',
        FALSE,
        NOW()
    );

-- =========================================
-- 7. Resultados Oficiales (para el GP 1 de España que ya finalizó)
-- =========================================
INSERT INTO resultados_oficiales (id, gran_premio_id, registrado_en)
VALUES
    (
        'e1111111-1111-1111-1111-111111111111',
        'b1111111-1111-1111-1111-111111111111',
        NOW() - INTERVAL '7 days'
    );

-- =========================================
-- 8. Resultado Posiciones
-- =========================================
INSERT INTO resultado_posiciones (id, resultado_id, piloto_id, posicion, es_pole, es_vuelta_rapida, puntos_obtenidos)
VALUES
    -- P1: Verstappen
    (
        uuid_generate_v4(),
        'e1111111-1111-1111-1111-111111111111',
        'd1111111-1111-1111-1111-111111111111',
        1,
        TRUE,
        TRUE,
        26
    ),
    -- P2: Leclerc
    (
        uuid_generate_v4(),
        'e1111111-1111-1111-1111-111111111111',
        'd2222222-2222-2222-2222-222222222222',
        2,
        FALSE,
        FALSE,
        18
    ),
    -- P3: Hamilton
    (
        uuid_generate_v4(),
        'e1111111-1111-1111-1111-111111111111',
        'd3333333-3333-3333-3333-333333333333',
        3,
        FALSE,
        FALSE,
        15
    );

-- =========================================
-- 9. Pases de Temporada
-- =========================================
INSERT INTO pases_temporada (id, usuario_id, estado, monto, moneda, stripe_checkout_session_id, stripe_payment_intent_id, fecha_pago, fecha_expiracion, created_at, updated_at)
VALUES
    (
        'f1111111-1111-1111-1111-111111111111',
        'a1111111-1111-1111-1111-111111111111',
        'activo',
        20.00,
        'usd',
        'cs_test_123',
        'pi_test_123',
        NOW() - INTERVAL '10 days',
        NOW() - INTERVAL '10 days' + INTERVAL '1 year',
        NOW() - INTERVAL '10 days',
        NOW() - INTERVAL '10 days'
    );

-- =========================================
-- 10. Pronósticos (Predicción de Juan Pérez para el GP 2 en curso)
-- =========================================
INSERT INTO pronosticos (id, usuario_id, gran_premio_id, piloto_p1_id, piloto_p2_id, piloto_p3_id, piloto_pole_id, piloto_vuelta_rapida_id, confirmado, puntos_obtenidos, created_at, updated_at)
VALUES
    (
        '01111111-1111-1111-1111-111111111111',
        'a1111111-1111-1111-1111-111111111111',
        'b2222222-2222-2222-2222-222222222222',
        'd1111111-1111-1111-1111-111111111111', -- P1: Verstappen
        'd2222222-2222-2222-2222-222222222222', -- P2: Leclerc
        'd3333333-3333-3333-3333-333333333333', -- P3: Hamilton
        'd1111111-1111-1111-1111-111111111111', -- Pole: Verstappen
        'd2222222-2222-2222-2222-222222222222', -- VR: Leclerc
        TRUE,
        0,
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days'
    );
