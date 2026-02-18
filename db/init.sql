-- ============================================
-- Sistema de Gestión de Campañas Publicitarias
-- Base de Datos: sistema_afiches
-- ============================================

-- Eliminar tablas si existen (para recrear)
DROP TABLE IF EXISTS tareas_implementacion CASCADE;
DROP TABLE IF EXISTS campanas CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS sucursales CASCADE;

-- Tabla de Sucursales
CREATE TABLE sucursales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    direccion VARCHAR(200),
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL, -- 'disenador', 'dibujante', 'implementador', 'supervisor', 'admin'
    email VARCHAR(100) UNIQUE NOT NULL,
    sucursal_asignada VARCHAR(100), -- Para implementadores: sucursal que atienden (NULL para otros roles)
    sucursal_id INT REFERENCES sucursales(id),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Campañas
CREATE TABLE campanas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    disenador_id INT REFERENCES usuarios(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Maestra de Tareas (Aquí vive el Semáforo)
CREATE TABLE tareas_implementacion (
    id SERIAL PRIMARY KEY,
    campana_id INT REFERENCES campanas(id) ON DELETE CASCADE,
    sucursal_nombre VARCHAR(100) NOT NULL,
    tipo_afiche VARCHAR(50),
    cantidad INT DEFAULT 1,
    
    -- Control de Diseño (Semáforo)
    estado_diseno VARCHAR(20) DEFAULT 'pendiente', -- pendiente, amarillo, aprobado
    url_diseno_referencia TEXT,
    url_diseno_archivo TEXT,
    vobo_diseno_ok BOOLEAN DEFAULT FALSE,
    
    -- Control de Logística
    estado_logistica VARCHAR(20) DEFAULT 'en_bodega', -- en_bodega, en_transito, recibido, instalado
    url_foto_paquete TEXT,
    
    -- Control de Implementación
    vobo_impl_ok BOOLEAN DEFAULT FALSE,
    foto_evidencia_url TEXT,
    gps_coords VARCHAR(100),
    fecha_instalacion TIMESTAMP,
    
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

CREATE INDEX idx_campanas_disenador ON campanas(disenador_id);
CREATE INDEX idx_tareas_campana ON tareas_implementacion(campana_id);
CREATE INDEX idx_tareas_estado_diseno ON tareas_implementacion(estado_diseno);
CREATE INDEX idx_tareas_estado_logistica ON tareas_implementacion(estado_logistica);
CREATE INDEX idx_usuarios_sucursal ON usuarios(sucursal_asignada);

-- ============================================
-- COMENTARIOS EN TABLAS
-- ============================================

COMMENT ON TABLE sucursales IS 'Catálogo de sucursales/locales donde se implementan los afiches';

COMMENT ON TABLE usuarios IS 'Usuarios del sistema con diferentes roles';
COMMENT ON TABLE campanas IS 'Campañas publicitarias creadas por diseñadores';
COMMENT ON TABLE tareas_implementacion IS 'Tareas de implementación con sistema de semáforo (rojo/amarillo/verde)';

COMMENT ON COLUMN tareas_implementacion.estado_diseno IS 'Estados: pendiente (rojo), amarillo (en revisión), aprobado (verde)';
COMMENT ON COLUMN tareas_implementacion.estado_logistica IS 'Estados: en_bodega, en_transito, recibido, instalado';

-- ============================================
-- DATOS DE PRUEBA: SUCURSALES
-- ============================================

INSERT INTO sucursales (id, nombre, direccion, activo, fecha_registro) VALUES
    (1, 'San Fernando', NULL, TRUE, '2026-02-04 22:17:25'),
    (2, 'Rengo', NULL, TRUE, '2026-02-04 22:17:25'),
    (3, 'Las Cabras', NULL, TRUE, '2026-02-04 22:17:25'),
    (4, 'Coltauco', NULL, TRUE, '2026-02-04 22:17:25'),
    (5, 'Requinoa', NULL, TRUE, '2026-02-04 22:17:25'),
    (6, 'Chepica', NULL, TRUE, '2026-02-04 22:17:25'),
    (7, 'Peralillo', NULL, TRUE, '2026-02-04 22:17:25'),
    (8, 'Pichilemu', NULL, TRUE, '2026-02-04 22:17:25'),
    (9, 'Hualane', NULL, TRUE, '2026-02-04 22:17:25'),
    (10, 'Quinta de Tilcoco', NULL, TRUE, '2026-02-04 22:17:25'),
    (11, 'Nancagua', NULL, TRUE, '2026-02-04 22:17:25'),
    (12, 'Chanco', NULL, TRUE, '2026-02-04 22:17:25'),
    (13, 'Villa Alegre', NULL, TRUE, '2026-02-04 22:17:25'),
    (14, 'Colbun', NULL, TRUE, '2026-02-04 22:17:25'),
    (15, 'Teno', NULL, TRUE, '2026-02-04 22:17:25'),
    (16, 'Yerbas Buenas', NULL, TRUE, '2026-02-04 22:17:25'),
    (17, 'Longavi', NULL, TRUE, '2026-02-04 22:17:25'),
    (18, 'Maule', NULL, TRUE, '2026-02-04 22:17:25');

SELECT setval('sucursales_id_seq', 18, true);

-- ============================================
-- DATOS DE USUARIOS DE PRUEBA
-- ============================================

INSERT INTO usuarios (id, nombre, usuario, password, rol, email, sucursal_asignada, sucursal_id, fecha_registro) VALUES
    (2, 'Administrador Sistema', 'admin', '$2b$10$h3W.vM7r4sgDpCRa5OPu7OkN8SPHF31Cq/PBM6DEOjTqyj/ss4isi', 'admin', 'admin@sistema.com', NULL, NULL, '2026-02-04 21:57:47'),
    (3, 'Rodrigo Bustamante', 'disenador', '$2b$10$yc7JQLhkThWIZJ5aJRnSTuEVavCZY0hoT13cDyplQRVJpNii30jBS', 'disenador', 'disenador@sistema.com', NULL, NULL, '2026-02-04 21:57:47'),
    (4, 'Luis Ignacio Carreño', 'dibujante', '$2b$10$Viu.x2fnY3vfaUIIUAML7Omc.rIcKEgV2Az8o21ZnaKNY5D8Skpj.', 'dibujante', 'dibujante@sistema.com', NULL, NULL, '2026-02-04 21:57:47'),
    (5, 'Victor Corona', 'supervisor', '$2b$10$idw6Qd.r4E7Ws/XH1qE5juylYo.JoKNcRC1f.gV34nnn9NM7TJ35W', 'supervisor', 'supervisor@sistema.com', NULL, NULL, '2026-02-04 21:57:47'),
    (6, 'Implementador San Fernando', 'impl_sf', '$2b$10$AFyzm48Kv.mqol2i3EJFi./ndpjR0Sky4uXsOwzT9xQ3f3LtEU/K.', 'implementador', 'sf@sistema.com', NULL, NULL, '2026-02-04 21:57:47'),
    (7, 'Implementador Rengo', 'impl_rengo', '$2b$10$PXIV7Oyoc1Eb36U5KK7i8eXTR8wgx8UV5.OJIgfXHCpHJX.wM25C2', 'implementador', 'rengo@sistema.com', NULL, NULL, '2026-02-04 21:57:47'),
    (8, 'Implementador Las Cabras', 'impl_cabras', '$2b$10$hwDw07PMpA2L4Ut4r8PHMuDCoZ8NUmfa6lN.4SByXb6b0KQdCSChG', 'implementador', 'cabras@sistema.com', NULL, NULL, '2026-02-04 21:57:47'),
    (9, 'Implementador Coltauco', 'impl_coltauco', '$2b$10$0qgzJpZqvHhpqxUut5GWp.g5nSVFQcBalxC0783.RhoQ8nhkxrLR2', 'implementador', 'coltauco@sistema.com', NULL, NULL, '2026-02-04 21:57:47'),
    (10, 'Implementador Requinoa', 'impl_requinoa', '$2b$10$0lhoOeaN01aReK9E3Trd2eLYYho8jkJrvFNfAl4V.hKg1GxZAlF1y', 'implementador', 'requinoa@sistema.com', NULL, NULL, '2026-02-04 21:57:47'),
    (11, 'Implementador Chépica', 'impl_chepica', '$2b$10$B2LWeQujQOjJHLNV2RMXW.31Fp1B/bozDGxhdQU1thIIlDsn0w.SK', 'implementador', 'chepica@sistema.com', NULL, NULL, '2026-02-04 21:57:47'),
    (12, 'Implementador Peralillo', 'impl_peralillo', '$2b$10$Gr3GRV8cMUuTFhKjW6761.IzPJ9m77XKe6gN871zoIBja56QHBIFS', 'implementador', 'peralillo@sistema.com', NULL, NULL, '2026-02-04 21:57:47'),
    (13, 'Implementador Pichilemu', 'impl_pich', '$2b$10$c8dAaFgOAkFc5Ihfuieyt.KQbvfY5/SH5Svm2L6V3UoVOGdTpmnFm', 'implementador', 'pich@sistema.com', NULL, NULL, '2026-02-04 21:57:47'),
    (14, 'Implementador Hualañé', 'impl_hualane', '$2b$10$BMvRtcsdLhqmI8DXVUSYYuTIV6FlgEarlxSh.8BOReRpHn3l8Z0Oe', 'implementador', 'hualane@sistema.com', NULL, NULL, '2026-02-04 21:57:47'),
    (15, 'Implementador Quinta de Tilcoco', 'impl_tilcoco', '$2b$10$.ufozsfiw3NuEpzmav8BUuYOSUYFBzwNSjqZHVuEI3c.P6ug1YxBS', 'implementador', 'tilcoco@sistema.com', NULL, NULL, '2026-02-04 21:57:47'),
    (16, 'Implementador Nancagua', 'impl_nancagua', '$2b$10$uE65rXJ7GJlDl9TLAKIru.u7KWfu9zH4cBweVstuXJHLmrLJbgIj.', 'implementador', 'nancagua@sistema.com', NULL, NULL, '2026-02-04 21:57:47'),
    (17, 'Implementador Chanco', 'impl_chanco', '$2b$10$o/ct7.eqy.y/jUHaVq8LjOWc/bxhrJBRI.SS8Nc6cvPUdJJuH6ODi', 'implementador', 'chanco@sistema.com', NULL, NULL, '2026-02-04 21:57:47'),
    (18, 'Implementador Villa Alegre', 'impl_valegre', '$2b$10$vGGfn3OA5l8SFW9PzjT.SuzuPkYHAqYT0KovK3j2fMBR1VGS23mk2', 'implementador', 'valegre@sistema.com', NULL, NULL, '2026-02-04 21:57:47'),
    (19, 'Implementador Colbún', 'impl_colbun', '$2b$10$sp2MuEcufrQZk2Rku/ET1uKOTXcN8l0FL9a.IRx03x89A6VIcUw8C', 'implementador', 'colbun@sistema.com', NULL, NULL, '2026-02-04 21:57:47'),
    (20, 'Implementador Teno', 'impl_teno', '$2b$10$LLXJJmsCJr34em3ZSjpX0uBwUuGpUhiykJrunQEkuFjJfnlvsztZm', 'implementador', 'teno@sistema.com', NULL, NULL, '2026-02-04 21:57:47'),
    (21, 'Implementador Yerbas Buenas', 'impl_ybuenas', '$2b$10$J7rSdWXl0kcWn9OWqpscL.0VxV4Mxg/rg0TmGHooAAh9XjkreCiL6', 'implementador', 'ybuenas@sistema.com', NULL, NULL, '2026-02-04 21:57:47'),
    (22, 'Implementador Longaví', 'impl_longavi', '$2b$10$mKOuCz9lmPu.zX29UKNyxu4XwxouomAcBK657LYreUpaGo/7Ag6aG', 'implementador', 'longavi@sistema.com', NULL, NULL, '2026-02-04 21:57:47'),
    (23, 'Implementador Maule', 'impl_maule', '$2b$10$0OUm0szhRYhuTDomWvYGGOtXyY4AtPpzZOAhZ0gt4Prj7FR/6WW8.', 'implementador', 'maule@sistema.com', NULL, NULL, '2026-02-04 21:57:47');

SELECT setval('usuarios_id_seq', 23, true);

-- Credenciales en texto plano (para pruebas locales):
-- admin / admin
-- disenador / disenador
-- dibujante / dibujante
-- supervisor / supervisor
-- impl_sf / impl_sf
-- impl_rengo / impl_rengo
-- impl_cabras / impl_cabras
-- impl_coltauco / impl_coltauco
-- impl_requinoa / impl_requinoa
-- impl_chepica / impl_chepica
-- impl_peralillo / impl_peralillo
-- impl_pich / impl_pich
-- impl_hualane / impl_hualane
-- impl_tilcoco / impl_tilcoco
-- impl_nancagua / impl_nancagua
-- impl_chanco / impl_chanco
-- impl_valegre / impl_valegre
-- impl_colbun / impl_colbun
-- impl_teno / impl_teno
-- impl_ybuenas / impl_ybuenas
-- impl_longavi / impl_longavi
-- impl_maule / impl_maule
