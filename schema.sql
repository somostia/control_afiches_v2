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
    url_diseno_archivo TEXT,
    vobo_diseno_ok BOOLEAN DEFAULT FALSE,
    
    -- Control de Logística
    estado_logistica VARCHAR(20) DEFAULT 'en_bodega', -- en_bodega, en_transito, recibido, instalado
    
    -- Control de Implementación
    vobo_impl_ok BOOLEAN DEFAULT FALSE,
    foto_evidencia_url TEXT,
    gps_coords VARCHAR(100),
    fecha_instalacion TIMESTAMP,
    
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Insertar sucursales disponibles
INSERT INTO sucursales (nombre, direccion) VALUES 
    ('Mall Plaza', 'Av. Libertador Bernardo O''Higgins 1234'),
    ('Costanera Center', 'Av. Andrés Bello 2425'),
    ('Portal La Dehesa', 'Av. La Dehesa 1445'),
    ('Parque Arauco', 'Av. Kennedy 5413'),
    ('Alto Las Condes', 'Av. Kennedy 9001');

-- Insertar usuarios de prueba
INSERT INTO usuarios (nombre, usuario, password, rol, email, sucursal_asignada) VALUES 
    ('Administrador Sistema', 'admin', 'admin', 'admin', 'admin@sistema.com', NULL),
    ('Juan Diseñador', 'disenador', 'disenador', 'disenador', 'disenador@sistema.com', NULL),
    ('María Dibujante', 'dibujante', 'dibujante', 'dibujante', 'dibujante@sistema.com', NULL),
    ('Ana Supervisor', 'supervisor', 'supervisor', 'supervisor', 'supervisor@sistema.com', NULL),
    -- Implementadores por sucursal
    ('Carlos Implementador Mall Plaza', 'impl_plaza', 'impl_plaza', 'implementador', 'carlos@sistema.com', 'Mall Plaza'),
    ('Pedro Implementador Costanera', 'impl_costanera', 'impl_costanera', 'implementador', 'pedro@sistema.com', 'Costanera Center'),
    ('Laura Implementadora Portal La Dehesa', 'impl_dehesa', 'impl_dehesa', 'implementador', 'laura@sistema.com', 'Portal La Dehesa'),
    ('Diego Implementador Parque Arauco', 'impl_arauco', 'impl_arauco', 'implementador', 'diego@sistema.com', 'Parque Arauco'),
    ('Sofia Implementadora Alto Las Condes', 'impl_altocondes', 'impl_altocondes', 'implementador', 'sofia@sistema.com', 'Alto Las Condes');

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
