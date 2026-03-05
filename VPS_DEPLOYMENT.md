# 🚀 Deployment en VPS - Sistema de Afiches

## 📋 Problemas Resueltos

Se han corregido los siguientes problemas que causaban que la aplicación siguiera conectada a localhost:

### ✅ Cambios Realizados

1. **backend/server.js:179** - URL dinámica para uploads
   - Antes: `http://localhost:${PORT}/uploads/...`
   - Ahora: Usa `BACKEND_URL` o construye dinámicamente

2. **src/config.js** - API fallback mejorado
   - Antes: `http://localhost:3002`
   - Ahora: `/api` (usa proxy de nginx)

3. **nginx.conf** - Configuración para cualquier dominio
   - Añadido proxy para `/api` y `/uploads`
   - server_name cambiado de `localhost` a `_`

4. **Nuevas variables de entorno** en `.env.vps`

## 🛠️ Instrucciones de Deployment

### Paso 1: Configurar Variables de Entorno

1. Copia `.env.vps` a `.env`:
```bash
cp .env.vps .env
```

2. Edita `.env` con tus valores:
```bash
# Reemplaza estos valores con tu información
FRONTEND_URL=http://tu-dominio.com        # o http://tu-ip-vps
REACT_APP_API_URL=http://tu-dominio.com/api
BACKEND_URL=http://backend:3002
DB_PASSWORD=TuPasswordSegura123!
PGADMIN_EMAIL=admin@tudominio.com
PGADMIN_PASSWORD=AdminPassword123!
```

### Paso 2: Deployment en VPS

#### Opción A: Con dominio
```bash
# En tu VPS, clona el repositorio
git clone <tu-repo>
cd afiches_frontend

# Configura las variables de entorno
cp .env.vps .env
nano .env  # Edita con tu dominio

# Construye y ejecuta
docker-compose up -d --build
```

#### Opción B: Solo con IP
```bash
# Configura con la IP de tu VPS
FRONTEND_URL=http://123.45.67.89
REACT_APP_API_URL=http://123.45.67.89/api

docker-compose up -d --build
```

### Paso 3: Verificación

1. **Frontend**: http://tu-dominio.com (o IP)
2. **API Health**: http://tu-dominio.com/api/health
3. **pgAdmin**: http://tu-dominio.com:5050

## 🔧 Configuración de Nginx Reverse Proxy

La nueva configuración de nginx incluye:

- **`/api/*`** → Proxy al backend (puerto 3002)
- **`/uploads/*`** → Proxy al backend para archivos
- **`/*`** → Servir React SPA

## ⚠️ Importante para HTTPS

Si vas a usar HTTPS (recomendado para producción):

1. Actualiza las URLs a `https://`
2. Considera usar un reverse proxy adicional (como Traefik o certificados Let's Encrypt)

## 🐳 Comandos Docker Útiles

```bash
# Ver logs
docker-compose logs -f

# Reconstruir solo el frontend
docker-compose up -d --build frontend

# Reconstruir todo
docker-compose up -d --build

# Parar servicios
docker-compose down

# Ver contenedores corriendo
docker-compose ps
```

## 📊 Puertos Expuestos

- **Frontend**: 80 (configurable con `FRONTEND_PORT`)
- **Backend**: 3002
- **PostgreSQL**: 5432
- **pgAdmin**: 5050

## 🔍 Troubleshooting

### Problema: CORS Error
**Solución**: Verifica que `FRONTEND_URL` en `.env` coincida con la URL desde donde accedes

### Problema: API no funciona
**Solución**: Verifica que `REACT_APP_API_URL` termine en `/api`

### Problema: Imágenes no cargan
**Solución**: Las imágenes ahora usan rutas relativas via nginx proxy

## 🎯 Arquitectura Final

```
Internet → Nginx (puerto 80) → {
    /api/* → Backend (puerto 3002)
    /uploads/* → Backend (puerto 3002)  
    /* → React SPA
}
```

Esta configuración elimina todas las referencias hardcodeadas a localhost y permite deployment flexible en cualquier VPS o dominio.