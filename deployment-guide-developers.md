# Docker Deployment Guide - Developers

## Guía Completa de Despliegue en VPS con Cloud Panel para Desarrolladores

### 📋 Índice
1. [Información General](#información-general)
2. [Configuración de Entorno](#configuración-de-entorno)
3. [Migración de Localhost a VPS](#migración-de-localhost-a-vps)
4. [Integración con Cloud Panel](#integración-con-cloud-panel)
5. [Configuración de Base de Datos](#configuración-de-base-de-datos)
6. [Implementación de Seguridad](#implementación-de-seguridad)
7. [Debugging y Troubleshooting](#debugging-y-troubleshooting)
8. [Comandos de Verificación](#comandos-de-verificación)

---

## Información General

**Objetivo:** Migrar aplicación full-stack (React + Node.js + PostgreSQL) de desarrollo local a producción en VPS con Cloud Panel.

**Stack Tecnológico:**
- Frontend: React + Nginx
- Backend: Node.js + Express
- Base de Datos: PostgreSQL 15
- Container: Docker + Docker Compose
- Proxy: Cloud Panel + Nginx
- SSL: Cloud Panel automático

**Niveles de Control:**
- 🔴 **Root/Admin**: Comandos que requieren privilegios de administrador
- 🟡 **Docker**: Comandos que operan containers
- 🟢 **App**: Comandos específicos de la aplicación

---

## Configuración de Entorno

### 1. Preparación del Código

**🟢 Eliminar Referencias Localhost** (Nivel App)

```bash
# Buscar todas las referencias a localhost
grep -r "localhost" src/ backend/ --include="*.js" --include="*.jsx" --include="*.ts"

# Buscar URLs hardcodeadas
grep -r "http://.*:" src/ backend/ --include="*.js" --include="*.jsx"
```

**Propósito:** Identificar URLs hardcodeadas que impiden funcionamiento en producción.
**Criticidad:** Alta - Sin esto la app no funciona fuera de desarrollo.

**🟢 Configurar Variables de Entorno** (Nivel App)

```bash
# Crear archivo .env para producción
cat > .env << 'EOF'
# Database Configuration
DB_USER=postgres
DB_HOST=postgres
DB_NAME=your_database_name
DB_PASSWORD=your_secure_password
DB_PORT=5432

# Server Configuration
PORT=3002
NODE_ENV=production

# Security Configuration  
JWT_SECRET=your_jwt_secret_64_chars

# Frontend Configuration
FRONTEND_URL=https://your-domain.com
FRONTEND_PORT=8090

# pgAdmin
PGADMIN_EMAIL=admin@yourdomain.com
PGADMIN_PASSWORD=your_admin_password
EOF
```

**Propósito:** Separar configuración de código para diferentes entornos.
**Criticidad:** Alta - Necesario para producción segura.

### 2. Configuración de Backend

**🟢 Actualizar Configuración de Base de Datos** (Nivel App)

```javascript
// backend/db.js - Configuración correcta
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

module.exports = pool;
```

**Propósito:** Configurar conexión a BD usando variables de entorno.
**Criticidad:** Alta - Sin esto no hay conexión a base de datos.

**🟢 Configurar URLs Dinámicas** (Nivel App)

```javascript
// backend/server.js - URLs dinámicas para uploads
app.post('/upload-design', upload.single('file'), (req, res) => {
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    // En lugar de: http://localhost:3002/uploads/...
});
```

**Propósito:** Generar URLs que funcionen en cualquier dominio.
**Criticidad:** Media - Afecta funcionalidad de uploads.

**🟢 Configurar Frontend API URLs** (Nivel App)

```javascript
// src/config.js - Configuración relativa
const config = {
    API_BASE_URL: '/api', // En lugar de http://localhost:3002
};
```

**Propósito:** Usar proxy reverso en lugar de CORS.
**Criticidad:** Alta - Necesario para que frontend encuentre backend.

### 3. Docker Configuration

**🟡 Docker Compose para Producción** (Nivel Docker)

```yaml
# docker-compose.yml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: app_backend
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      DB_HOST: postgres
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      FRONTEND_URL: ${FRONTEND_URL}
    ports:
      - "3002:3002"
    volumes:
      - ./backend/uploads:/app/uploads
      - ./logs:/app/logs
    depends_on:
      - postgres
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3002/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: app_frontend
    restart: unless-stopped
    ports:
      - "8090:80"
    depends_on:
      - backend
    networks:
      - app-network

  postgres:
    image: postgres:15
    container_name: app_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
```

**Propósito:** Orquestar todos los servicios con configuración de producción.
**Criticidad:** Alta - Base de todo el despliegue.

---

## Migración de Localhost a VPS

### 1. Preparación del Servidor

**🔴 Instalar Dependencies** (Nivel Root)

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt install docker-compose-plugin

# Agregar usuario a grupo docker
sudo usermod -aG docker $USER
```

**Propósito:** Preparar entorno de ejecución en el servidor.
**Criticidad:** Alta - Prerequisitos para funcionamiento.

### 2. Despliegue de Aplicación

**🟡 Build y Deployment** (Nivel Docker)

```bash
# Construir y ejecutar containers
docker-compose build --no-cache
docker-compose up -d

# Verificar estado
docker-compose ps
docker-compose logs --tail=50
```

**Propósito:** Construir y ejecutar aplicación en contenedores.
**Criticidad:** Alta - Paso principal del despliegue.

**🟢 Verificar Funcionamiento** (Nivel App)

```bash
# Test de conectividad interna
docker-compose exec backend curl http://localhost:3002/api/health

# Test de base de datos
docker-compose exec postgres psql -U postgres -c "SELECT version();"

# Ver logs de aplicación
docker-compose logs backend
```

**Propósito:** Verificar que todos los componentes funcionen correctamente.
**Criticidad:** Alta - Validación del despliegue.

---

## Integración con Cloud Panel

### 1. Configuración de Proxy Reverso

**🔴 Configurar Nginx en Cloud Panel** (Nivel Root)

```bash
# Editar configuración del sitio
nano /etc/nginx/sites-enabled/your-domain.conf
```

```nginx
# Agregar configuración de proxy
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    # Proxy para API del backend
    location /api/ {
        proxy_pass http://127.0.0.1:3002/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }

    # Proxy para uploads
    location /uploads/ {
        proxy_pass http://127.0.0.1:3002/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy por defecto al frontend
    location @reverse_proxy {
        proxy_pass http://127.0.0.1:8090;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri @reverse_proxy;
    }
}
```

**Propósito:** Configurar proxy reverso para routing de requests.
**Criticidad:** Alta - Sin esto no hay acceso externo a la aplicación.

**🔴 Recargar Nginx** (Nivel Root)

```bash
# Verificar configuración
nginx -t

# Recargar si es válida
systemctl reload nginx
```

**Propósito:** Aplicar cambios de configuración.
**Criticidad:** Alta - Necesario para activar configuración.

### 2. Verificación de Routing

**🟢 Test de Endpoints** (Nivel App)

```bash
# Test de API health
curl -s https://your-domain.com/api/health

# Test de frontend
curl -s -o /dev/null -w "%{http_code}" https://your-domain.com/

# Test de uploads
curl -s -o /dev/null -w "%{http_code}" https://your-domain.com/uploads/
```

**Propósito:** Verificar que el proxy funcione correctamente.
**Criticidad:** Alta - Validación del routing.

---

## Configuración de Base de Datos

### 1. Configuración Inicial

**🟡 Setup de PostgreSQL** (Nivel Docker)

```bash
# Acceder al container de PostgreSQL
docker-compose exec postgres psql -U postgres

# Crear base de datos si no existe
CREATE DATABASE your_app_db;

# Crear usuario específico (opcional)
CREATE USER app_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE your_app_db TO app_user;
```

**Propósito:** Configurar base de datos y permisos.
**Criticidad:** Alta - Sin BD no hay aplicación.

### 2. Migración de Datos

**🟡 Import de Schema y Datos** (Nivel Docker)

```bash
# Importar schema
docker-compose exec postgres psql -U postgres -d your_app_db < schema.sql

# Importar datos iniciales
docker-compose exec postgres psql -U postgres -d your_app_db < initial_data.sql

# Verificar tablas
docker-compose exec postgres psql -U postgres -d your_app_db -c "\dt"
```

**Propósito:** Cargar estructura y datos iniciales.
**Criticidad:** Alta - Necesario para funcionalidad.

### 3. Verificación de Conexión

**🟢 Test de Conexión desde Backend** (Nivel App)

```bash
# Test de conexión manual
docker-compose exec backend node -e "
const pool = require('./db');
pool.query('SELECT NOW()').then(r => console.log('✅ DB Connected:', r.rows)).catch(e => console.log('❌ DB Error:', e.message));
"
```

**Propósito:** Verificar que backend puede conectar a la base de datos.
**Criticidad:** Alta - Fundamental para operación.

---

## Implementación de Seguridad

### 1. Generación de Contraseñas Seguras

**🔴 Crear Contraseñas Fuertes** (Nivel Root)

```bash
# Generar contraseña para base de datos (32 chars)
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# Generar JWT secret (64 chars)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

# Generar contraseña para pgAdmin (24 chars)
PGADMIN_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-24)

echo "DB_PASSWORD: $DB_PASSWORD"
echo "JWT_SECRET: $JWT_SECRET"
echo "PGADMIN_PASSWORD: $PGADMIN_PASSWORD"
```

**Propósito:** Generar credenciales seguras para producción.
**Criticidad:** Alta - Seguridad fundamental.

### 2. Actualización de Contraseñas

**🟡 Cambiar Contraseña de PostgreSQL** (Nivel Docker)

```bash
# Cambiar contraseña del usuario postgres
docker-compose exec postgres psql -U postgres -c "
ALTER USER postgres PASSWORD 'new_secure_password';
"

# Verificar cambio
docker-compose exec backend node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'postgres',
  user: 'postgres',
  password: 'new_secure_password',
  database: 'your_db'
});
pool.query('SELECT NOW()').then(() => console.log('✅ Password updated')).catch(e => console.log('❌ Error:', e.message));
"
```

**Propósito:** Sincronizar contraseñas entre configuración y base de datos.
**Criticidad:** Alta - Sin esto hay error de autenticación.

### 3. Configuración de JWT

**🟢 Configurar JWT en Backend** (Nivel App)

```javascript
// backend/auth.js - Configuración JWT
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id,
            usuario: user.usuario,
            rol: user.rol 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};
```

**Propósito:** Implementar autenticación segura con tokens.
**Criticidad:** Media - Mejora seguridad de sesiones.

---

## Debugging y Troubleshooting

### 1. Problemas Comunes de Conexión

**🟡 Error: "Container Not Found"** (Nivel Docker)

```bash
# Verificar que containers estén corriendo
docker-compose ps

# Si no están corriendo, verificar logs
docker-compose logs

# Recrear containers si es necesario
docker-compose down
docker-compose up -d --build
```

**Propósito:** Resolver problemas de containers no disponibles.
**Síntoma:** Error de conexión entre servicios.

**🟢 Error: "Cannot connect to database"** (Nivel App)

```bash
# Verificar variables de entorno
docker-compose exec backend printenv | grep DB_

# Test directo de conexión
docker-compose exec backend node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
pool.query('SELECT 1').then(() => console.log('✅ Connected')).catch(e => console.log('❌', e.message));
"

# Verificar que PostgreSQL esté corriendo
docker-compose exec postgres pg_isready
```

**Propósito:** Diagnosticar problemas de conexión a base de datos.
**Síntoma:** Error 500 en requests que usan BD.

### 2. Problemas de Proxy/Routing

**🔴 Error: "502 Bad Gateway"** (Nivel Root)

```bash
# Verificar configuración nginx
nginx -t

# Ver logs de nginx
tail -f /var/log/nginx/error.log

# Verificar que backend esté escuchando
netstat -tlnp | grep 3002

# Test directo al container
curl http://127.0.0.1:3002/api/health
```

**Propósito:** Diagnosticar problemas de proxy reverso.
**Síntoma:** Nginx no puede conectar al backend.

**🔴 Error: "404 Not Found" en APIs** (Nivel Root)

```bash
# Verificar configuración de location blocks
grep -A 10 "location /api" /etc/nginx/sites-enabled/*

# Test de routing específico
curl -v https://your-domain.com/api/health

# Verificar headers de proxy
curl -H "Host: your-domain.com" http://127.0.0.1/api/health
```

**Propósito:** Resolver problemas de routing de URLs.
**Síntoma:** URLs de API no funcionan.

### 3. Problemas de Autenticación

**🟢 Error: "Invalid credentials"** (Nivel App)

```bash
# Verificar usuarios en base de datos
docker-compose exec postgres psql -U postgres -d your_db -c "
SELECT id, usuario, rol FROM usuarios ORDER BY id;
"

# Test de hash de contraseñas
docker-compose exec backend node -e "
const bcrypt = require('bcrypt');
bcrypt.compare('test_password', 'hash_from_db', (err, result) => {
  console.log('Password match:', result);
});
"
```

**Propósito:** Diagnosticar problemas de login.
**Síntoma:** Usuarios no pueden hacer login.

---

## Comandos de Verificación

### 1. Verificación de Estado General

**🟡 Health Check Completo** (Nivel Docker)

```bash
# Estado de containers
docker-compose ps

# Uso de recursos
docker stats --no-stream

# Logs recientes de todos los servicios
docker-compose logs --tail=20

# Test de conectividad interna
docker-compose exec backend curl -s http://localhost:3002/api/health
docker-compose exec postgres pg_isready
```

**Propósito:** Verificación rápida del estado general del sistema.
**Frecuencia:** Diaria o después de cambios.

### 2. Monitoreo de Performance

**🟡 Métricas de Containers** (Nivel Docker)

```bash
# Uso de CPU y memoria
docker-compose exec backend top -bn1 | head -20

# Espacio en disco
docker system df
docker volume ls

# Conexiones de red activas
docker-compose exec backend netstat -tlnp

# Logs con timestamps
docker-compose logs --timestamps --tail=50 backend
```

**Propósito:** Monitorear rendimiento y uso de recursos.
**Frecuencia:** Semanal o cuando hay problemas de performance.

### 3. Verificación de Seguridad

**🔴 Audit de Configuración** (Nivel Root)

```bash
# Verificar permisos de archivos
ls -la .env docker-compose.yml

# Verificar configuración SSL
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Verificar configuración nginx
nginx -T | grep -E "ssl_|proxy_pass"

# Test de headers de seguridad
curl -I https://your-domain.com/
```

**Propósito:** Verificar configuración de seguridad.
**Frecuencia:** Después de cambios de configuración.

### 4. Backup y Recuperación

**🟡 Comandos de Backup** (Nivel Docker)

```bash
# Backup de base de datos
docker-compose exec postgres pg_dump -U postgres your_db > backup_$(date +%Y%m%d).sql

# Backup de uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads/

# Backup de configuración
cp .env docker-compose.yml /path/to/backup/
```

**Propósito:** Crear respaldos de datos críticos.
**Frecuencia:** Diaria para BD, semanal para archivos.

---

## Referencias Rápidas

### Variables de Entorno Críticas
- `DB_PASSWORD`: Contraseña de PostgreSQL
- `JWT_SECRET`: Secret para tokens JWT
- `NODE_ENV`: Entorno de ejecución (production)
- `FRONTEND_URL`: URL del dominio para CORS

### Puertos Utilizados
- `8090`: Frontend (nginx)
- `3002`: Backend (Node.js)
- `5432`: PostgreSQL
- `5050`: pgAdmin (opcional)

### Archivos de Configuración Críticos
- `.env`: Variables de entorno
- `docker-compose.yml`: Orquestación de containers
- `backend/db.js`: Configuración de base de datos
- `/etc/nginx/sites-enabled/*.conf`: Configuración proxy

### Comandos de Emergencia

```bash
# Reiniciar toda la aplicación
docker-compose restart

# Rebuild completo
docker-compose down && docker-compose up -d --build

# Ver todos los logs
docker-compose logs

# Acceso de emergencia a base de datos
docker-compose exec postgres psql -U postgres
```

---

**Documento generado para:** Desarrolladores  
**Versión:** 1.0  
**Última actualización:** Marzo 2026
