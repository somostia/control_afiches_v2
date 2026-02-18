# 🐳 Docker - Sistema de Gestión de Afiches

## Configuración Completa con Docker

Este proyecto ahora incluye configuración completa de Docker con:
- **PostgreSQL** para la base de datos
- **Node.js/Express** para el backend
- **React/Nginx** para el frontend

---

## 📋 Prerequisitos

1. **Docker Desktop** instalado:
   - Windows: [Descargar Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Mac: [Descargar Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Linux: `sudo apt install docker.io docker-compose`

2. **Verificar instalación**:
   ```bash
   docker --version
   docker-compose --version
   ```

---

## 🚀 Inicio Rápido

### Opción 1: Usando Scripts (Recomendado)

#### Windows (PowerShell):
```powershell
# Cargar comandos
. .\docker-commands.ps1

# Iniciar aplicación
Start-AfichesDocker

# Ver logs
Get-AfichesLogs

# Detener aplicación
Stop-AfichesDocker
```

#### Linux/Mac (Bash):
```bash
# Cargar comandos
source docker-commands.sh

# Iniciar aplicación
start_afiches

# Ver logs
logs_afiches

# Detener aplicación
stop_afiches
```

### Opción 2: Comandos Docker Directos

```bash
# 1. Crear archivo .env (primera vez)
cp .env.docker .env

# 2. Iniciar todos los servicios
docker-compose up -d --build

# 3. Ver logs
docker-compose logs -f

# 4. Detener servicios
docker-compose down
```

---

## 🌐 Acceso a los Servicios

Una vez iniciado, accede a:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3002
- **Base de Datos**: localhost:5432
  - Usuario: `postgres`
  - Contraseña: `postgres123`
  - Base de datos: `sistema_afiches`

---

## 📂 Estructura de Docker

```
afiches_frontend/
├── Dockerfile                 # Frontend (React + Nginx)
├── nginx.conf                 # Configuración de Nginx
├── docker-compose.yml         # Orquestación de servicios
├── .dockerignore             # Archivos a ignorar
├── .env.docker               # Variables de entorno
├── docker-commands.ps1        # Scripts para Windows
├── docker-commands.sh         # Scripts para Linux/Mac
└── backend/
    ├── Dockerfile            # Backend (Node.js/Express)
    └── .dockerignore        # Archivos a ignorar
```

---

## 🛠️ Comandos Útiles

### Gestión de Servicios

```bash
# Ver estado de los servicios
docker-compose ps

# Reiniciar servicios
docker-compose restart

# Reiniciar un servicio específico
docker-compose restart backend

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Acceso a Contenedores

```bash
# Acceder al contenedor del backend
docker exec -it afiches_backend sh

# Acceder a la base de datos
docker exec -it afiches_db psql -U postgres -d sistema_afiches

# Ejecutar comandos SQL
docker exec -it afiches_db psql -U postgres -d sistema_afiches -c "SELECT * FROM usuarios;"
```

### Limpieza

```bash
# Detener y eliminar contenedores
docker-compose down

# Eliminar también los volúmenes (¡Cuidado! Borra la DB)
docker-compose down -v

# Eliminar todo (contenedores, volúmenes, imágenes)
docker-compose down -v --rmi all

# Limpiar sistema Docker completo
docker system prune -a --volumes
```

### Reconstruir

```bash
# Reconstruir sin cache
docker-compose build --no-cache

# Reconstruir e iniciar
docker-compose up -d --build
```

---

## ⚙️ Configuración Avanzada

### Variables de Entorno

Edita el archivo `.env` para personalizar:

```bash
# Base de datos
DB_PASSWORD=tu_password_seguro

# Puerto del frontend
FRONTEND_PORT=80

# Entorno
NODE_ENV=production
```

### Cambiar Puertos

Edita `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Cambia 8080 por el puerto que desees
  
  backend:
    ports:
      - "3002:3002"  # Puerto del backend
  
  db:
    ports:
      - "5432:5432"  # Puerto de PostgreSQL
```

### Persistencia de Datos

Los datos de PostgreSQL se guardan en un volumen Docker llamado `postgres_data`. 

```bash
# Ver volúmenes
docker volume ls

# Inspeccionar volumen
docker volume inspect afiches_frontend_postgres_data

# Hacer backup de la base de datos
docker exec afiches_db pg_dump -U postgres sistema_afiches > backup.sql

# Restaurar backup
docker exec -i afiches_db psql -U postgres sistema_afiches < backup.sql
```

---

## 🐛 Troubleshooting

### Puerto ya en uso

```bash
# Windows
netstat -ano | findstr :80
netstat -ano | findstr :3002

# Linux/Mac
lsof -i :80
lsof -i :3002

# Cambiar puerto en docker-compose.yml
```

### Contenedor no inicia

```bash
# Ver logs detallados
docker-compose logs [servicio]

# Ver todos los logs
docker-compose logs

# Verificar salud de servicios
docker-compose ps
```

### Base de datos no conecta

```bash
# Verificar que DB esté corriendo
docker-compose ps db

# Ver logs de DB
docker-compose logs db

# Reiniciar DB
docker-compose restart db
```

### Cambios no se reflejan

```bash
# Reconstruir sin cache
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 📊 Monitoreo

### Ver recursos utilizados

```bash
# Estadísticas en tiempo real
docker stats

# Espacio utilizado
docker system df
```

### Health Checks

Los servicios incluyen health checks automáticos:

```bash
# Backend
curl http://localhost:3002/api/health

# Frontend
curl http://localhost/health
```

---

## 🚀 Producción

### Consideraciones para Producción

1. **Cambiar contraseñas**: Usa contraseñas seguras en `.env`
2. **HTTPS**: Configura certificados SSL/TLS
3. **Reverse Proxy**: Usa Nginx/Traefik como reverse proxy
4. **Backups**: Automatiza backups de la base de datos
5. **Monitoreo**: Implementa logs y métricas (ELK, Prometheus)
6. **Recursos**: Limita recursos de CPU/memoria en docker-compose.yml

### Ejemplo con límites de recursos

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

---

## 📚 Recursos Adicionales

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Node.js Docker Image](https://hub.docker.com/_/node)
- [Nginx Docker Image](https://hub.docker.com/_/nginx)

---

## ✅ Checklist de Instalación

- [ ] Docker Desktop instalado y corriendo
- [ ] Archivo `.env` creado desde `.env.docker`
- [ ] Ejecutar `docker-compose up -d --build`
- [ ] Verificar servicios: `docker-compose ps`
- [ ] Acceder a http://localhost
- [ ] Verificar backend: http://localhost:3002/api/health
- [ ] Verificar conexión a DB

---

## 💡 Tips

- Usa `docker-compose logs -f` para debugging en tiempo real
- Los archivos de uploads persisten en `./backend/uploads`
- Los logs de la aplicación persisten en `./logs`
- El esquema SQL se ejecuta automáticamente en la primera inicialización
- Usa `docker-compose restart [servicio]` para cambios de configuración

---

¡Docker configurado exitosamente! 🎉
