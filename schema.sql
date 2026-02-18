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
