# OpenCode Quick Start: JS Applications + VPS Hostinger + CloudPanel
## Template de Referencia para Nuevas Sesiones

> **Propósito**: Guía rápida para iniciar nuevas sesiones de OpenCode con el stack completo probado
> **Stack**: React + Node.js + PostgreSQL + Docker + CloudPanel + Hostinger VPS
> **Basado en**: Despliegue exitoso de aplicación de control de afiches (Diciembre 2024)

---

## 🎯 Contexto para OpenCode

### ¿Qué hemos logrado anteriormente?
- ✅ **Despliegue completo** de aplicación React + Node.js + PostgreSQL desde localhost a VPS
- ✅ **Integración CloudPanel** con configuración nginx personalizada para routing `/api/` y `/uploads/`
- ✅ **Docker Compose** con orquestación completa (frontend, backend, postgres, pgadmin)
- ✅ **SSL/HTTPS** configuración automática vía CloudPanel
- ✅ **Autenticación JWT** + bcrypt, sistema de roles (supervisor, diseñador, dibujante, implementadores)
- ✅ **Resolución de bugs críticos**: Problemas de autenticación PostgreSQL resueltos
- ✅ **Aplicación en producción**: Usuarios activos accediendo desde múltiples IPs

### Stack Tecnológico Probado
```
Frontend: React + Vite
Backend: Node.js + Express
Base de datos: PostgreSQL 15
Orquestación: Docker + Docker Compose
VPS: Ubuntu 22.04 LTS en Hostinger
Panel: CloudPanel 2.x
Proxy: Nginx (gestionado por CloudPanel)
SSL: Let's Encrypt (auto-renovación)
Autenticación: JWT + bcrypt
Upload de archivos: Multer + nginx proxy
```

---

## 🏗️ Arquitectura de Referencia

### Estructura de Contenedores
```yaml
services:
  frontend:          # React app en puerto 8090
  backend:           # Node.js API en puerto 3002
  postgres:          # PostgreSQL en puerto 5432
  pgadmin:           # Admin DB en puerto 5050
```

### Configuración de Red
```
[CloudPanel Nginx] → [Docker Network]
    ↓                     ↓
[SSL + Domain]      [app-network]
    ↓                     ↓
[Proxy Rules]       [Container Communication]
    ↓                     ↓
/ → frontend:8090
/api/ → backend:3002/api/
/uploads/ → backend:3002/uploads/
```

---

## 📁 Estructura de Proyecto Base

```
proyecto/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── backend/
│   ├── routes/
│   ├── uploads/
│   ├── package.json
│   ├── server.js
│   ├── db.js
│   └── Dockerfile
├── database/
│   └── init/
│       └── init.sql
├── docker-compose.yml
├── .env
├── .gitignore
└── README.md
```

---

## 🚀 Comandos de Despliegue Probados

### 1. Preparación VPS Hostinger
```bash
# Conexión inicial
ssh root@your-vps-ip

# Actualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Configurar firewall
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 8080/tcp
ufw --force enable
```

### 2. Instalación CloudPanel
```bash
# Instalar CloudPanel
curl -sS https://installer.cloudpanel.io/ce/v2/install.sh -o install.sh
sudo bash install.sh

# Acceder a: https://your-vps-ip:8080
# Crear cuenta admin y configurar dominio
```

### 3. Configuración de Aplicación
```bash
# Ir al directorio del dominio
cd /home/cloudpanel/htdocs/your-domain.com/

# Subir archivos de aplicación
# (git clone o upload manual)

# Crear variables de entorno
cat > .env << 'EOF'
NODE_ENV=production
DB_HOST=postgres
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_secure_password_32_chars
JWT_SECRET=your_jwt_secret_64_chars
PGADMIN_DEFAULT_EMAIL=admin@your-domain.com
PGADMIN_DEFAULT_PASSWORD=your_pgadmin_password_24_chars
EOF
```

### 4. Despliegue con Docker
```bash
# Crear red Docker
docker network create app-network

# Construir y ejecutar
docker-compose build --no-cache
docker-compose up -d

# Verificar servicios
docker ps
docker-compose logs
```

---

## 🔧 Archivos de Configuración Base

### docker-compose.yml
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: frontend
    ports:
      - "8090:80"
    networks:
      - app-network
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: backend
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./backend/uploads:/app/uploads
    networks:
      - app-network
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15
    container_name: postgres
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network
    restart: unless-stopped

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: pgadmin
    environment:
      - PGADMIN_DEFAULT_EMAIL=${PGADMIN_DEFAULT_EMAIL}
      - PGLADMIN_DEFAULT_PASSWORD=${PGADMIN_DEFAULT_PASSWORD}
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    networks:
      - app-network
    depends_on:
      - postgres
    restart: unless-stopped

networks:
  app-network:
    external: true

volumes:
  postgres_data:
    driver: local
  pgadmin_data:
    driver: local
```

### Frontend Dockerfile
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Backend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 3002
CMD ["node", "server.js"]
```

---

## 🔐 Configuración de Seguridad

### Variables de Entorno Seguras
```bash
# Generar passwords seguros
DB_PASSWORD=$(openssl rand -base64 24)
JWT_SECRET=$(openssl rand -base64 48)
PGADMIN_PASSWORD=$(openssl rand -base64 18)

echo "DB_PASSWORD: $DB_PASSWORD"
echo "JWT_SECRET: $JWT_SECRET"
echo "PGADMIN_PASSWORD: $PGADMIN_PASSWORD"
```

### CloudPanel Nginx Config
```nginx
# Configuración automática en CloudPanel para:
# /etc/nginx/sites-enabled/your-domain.com.conf

location /api/ {
    proxy_pass http://localhost:3002/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /uploads/ {
    proxy_pass http://localhost:3002/uploads/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## 🔍 Troubleshooting Común

### Problemas de Conexión Base de Datos
```bash
# Error: Contraseña incorrecta PostgreSQL
# Solución: Sincronizar contraseñas en .env y base de datos

# Verificar contraseña en contenedor
docker exec postgres psql -U your_user -d your_database -c "\du"

# Cambiar contraseña si es necesario
docker exec postgres psql -U your_user -d your_database -c "ALTER USER your_user PASSWORD 'new_password';"
```

### Problemas de Routing
```bash
# Error: API calls returning 404
# Solución: Verificar configuración nginx en CloudPanel

# Verificar proxy configuration
curl -I https://your-domain.com/api/health
curl -I https://your-domain.com/uploads/test.jpg
```

### Problemas de Contenedores
```bash
# Ver logs de contenedores
docker-compose logs frontend
docker-compose logs backend
docker-compose logs postgres

# Reiniciar servicios
docker-compose restart
docker-compose down && docker-compose up -d
```

---

## 🛠️ Comandos de Desarrollo

### Testing Local
```bash
# Desarrollo local
npm install
npm run dev          # Frontend
npm run start        # Backend

# Base de datos local
docker run --name postgres-dev -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15
```

### Build de Producción
```bash
# Frontend
npm run build

# Backend
npm install --only=production

# Docker build
docker-compose build --no-cache
```

### Monitoreo
```bash
# Estado de contenedores
docker ps

# Uso de recursos
docker stats

# Logs en tiempo real
docker-compose logs -f
```

---

## 📊 Métricas de Éxito

### Aplicación Funcional
- ✅ Frontend accesible via HTTPS
- ✅ API respondiendo correctamente
- ✅ Base de datos conectada
- ✅ Uploads funcionando
- ✅ Autenticación JWT operativa

### Indicadores de Performance
```bash
# Test de respuesta
curl -w "@curl-format.txt" -s -o /dev/null https://your-domain.com

# Conexión de base de datos
docker exec postgres pg_isready -U your_user -d your_database

# Estado de contenedores
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

---

## 🎯 Checklist de Despliegue

### Pre-despliegue
- [ ] VPS Hostinger configurado con Ubuntu 22.04
- [ ] Docker y Docker Compose instalados
- [ ] CloudPanel instalado y configurado
- [ ] Dominio apuntando al VPS
- [ ] Firewall configurado (puertos 22, 80, 443, 8080)

### Despliegue
- [ ] Código subido al VPS
- [ ] Variables de entorno configuradas (.env)
- [ ] Red Docker creada (app-network)
- [ ] Contenedores construidos y ejecutándose
- [ ] Nginx configurado en CloudPanel para proxy

### Post-despliegue
- [ ] SSL certificado instalado y funcionando
- [ ] API endpoints respondiendo correctamente
- [ ] Base de datos conectada y funcional
- [ ] Uploads de archivos funcionando
- [ ] Sistema de autenticación operativo

---

## 🔗 Referencias y Documentación

### Archivos de Referencia Completa
- `deployment-guide-developers.md` - Guía completa para desarrolladores (64 páginas)
- `deployment-guide-sysadmins.md` - Guía completa para administradores de sistema
- `opencode-1.md` - Log completo del proceso de despliegue con troubleshooting real

### Recursos Externos
- [Docker Documentation](https://docs.docker.com/)
- [CloudPanel Documentation](https://www.cloudpanel.io/docs/)
- [Hostinger VPS Guides](https://support.hostinger.com/en/collections/2343481-vps)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 💡 Consejos para Nuevas Sesiones OpenCode

### Contexto Inicial
```markdown
Necesito ayuda para desplegar una aplicación JavaScript (React + Node.js + PostgreSQL) 
en un VPS de Hostinger usando CloudPanel. 

Tengo experiencia previa exitosa con este stack completo:
- Frontend React en contenedor Docker (puerto 8090)
- Backend Node.js con Express (puerto 3002) 
- PostgreSQL 15 (puerto 5432)
- CloudPanel con proxy nginx para /api/ y /uploads/
- SSL automático con Let's Encrypt
- Autenticación JWT + bcrypt

Referencia: [Pegar este archivo completo]
```

### Información del Proyecto
- **VPS**: Hostinger con Ubuntu 22.04
- **Panel**: CloudPanel 2.x ya instalado
- **Dominio**: [tu-dominio.com] apuntando al VPS
- **Aplicación**: [Descripción breve de tu app]

### Objetivos
- [ ] Configurar Docker Compose para todos los servicios
- [ ] Integrar con CloudPanel para proxy nginx
- [ ] Configurar SSL automático
- [ ] Implementar autenticación segura
- [ ] Testing completo en producción

---

**Versión**: 1.0 - Template para OpenCode Sessions  
**Basado en**: Despliegue exitoso Diciembre 2024  
**Última actualización**: Diciembre 2024

*Este template está basado en un despliegue real y exitoso. Todos los procedimientos han sido testados en producción con usuarios activos.*