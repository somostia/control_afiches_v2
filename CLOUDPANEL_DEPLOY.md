# Instrucciones de Despliegue en CloudPanel

## Requisitos Previos
- Servidor con CloudPanel instalado
- Node.js 18+ instalado
- PostgreSQL 14+ instalado
- Dominio o subdominio configurado

## Paso 1: Crear Sitio Node.js en CloudPanel

1. Accede a CloudPanel
2. Ve a **Sites** → **Add Site**
3. Selecciona **Node.js**
4. Configura:
   - **Domain Name**: tu-dominio.com
   - **Node.js Version**: 18 o superior
   - **App Port**: 3002 (backend)
   - **Site User**: Crear nuevo usuario

## Paso 2: Configurar Base de Datos

1. En CloudPanel, ve a **Databases** → **Add Database**
2. Crea base de datos:
   - **Database Name**: sistema_afiches
   - **Database User**: afiches_user
   - **Password**: (guarda la contraseña)

3. Ejecuta el schema:
```bash
psql -U afiches_user -d sistema_afiches -f schema.sql
```

## Paso 3: Subir Código

Opción A - Git (Recomendado):
```bash
cd /home/[site-user]/htdocs/[tu-dominio.com]
git clone https://github.com/somostia/control_afiches_v2.git .
cd backend
npm install --production
```

Opción B - FTP/SFTP:
- Sube todo el proyecto al directorio del sitio
- Conecta por SSH y ejecuta `npm install` en la carpeta backend

## Paso 4: Configurar Variables de Entorno

Crea archivo `.env` en la raíz del proyecto:
```bash
nano .env
```

Contenido:
```env
DB_USER=afiches_user
DB_HOST=localhost
DB_NAME=sistema_afiches
DB_PASSWORD=tu_password_aqui
DB_PORT=5432

PORT=3002
NODE_ENV=production

FRONTEND_URL=https://tu-dominio.com
DEFAULT_DISENADOR_ID=1
```

## Paso 5: Configurar PM2 (Administrador de Procesos)

CloudPanel usa PM2. Crea archivo `ecosystem.config.js` en la raíz:
```bash
nano ecosystem.config.js
```

## Paso 6: Iniciar Aplicación

```bash
cd backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Paso 7: Configurar Build del Frontend

```bash
npm install
npm run build
```

El build se generará en `build/` y será servido por el backend.

## Paso 8: Configurar SSL

1. En CloudPanel → Tu sitio → SSL/TLS
2. Selecciona **Let's Encrypt**
3. Activa certificado SSL

## Paso 9: Migrar Datos Iniciales

```bash
cd backend
node migrar-usuarios.js
node actualizar-sucursales-chile.js
```

## Verificación

1. Backend: https://tu-dominio.com
2. Revisa logs: `pm2 logs`
3. Estado: `pm2 status`

## Comandos Útiles

```bash
# Ver logs
pm2 logs afiches-backend

# Reiniciar
pm2 restart afiches-backend

# Detener
pm2 stop afiches-backend

# Ver estado
pm2 status

# Recargar sin downtime
pm2 reload afiches-backend
```

## Troubleshooting

### Error de conexión a base de datos
```bash
# Verifica conexión
psql -U afiches_user -d sistema_afiches -h localhost

# Revisa logs de PostgreSQL
tail -f /var/log/postgresql/postgresql-14-main.log
```

### Puerto en uso
```bash
# Encuentra proceso usando el puerto
lsof -i :3002
# Mata el proceso si es necesario
kill -9 [PID]
```

### Permisos de archivos
```bash
# Ajusta permisos de uploads
chmod 755 backend/uploads
chown -R [site-user]:[site-user] backend/uploads
```

## Actualizar Aplicación

```bash
cd /home/[site-user]/htdocs/[tu-dominio.com]
git pull origin main
cd backend
npm install --production
pm2 reload afiches-backend
```

## Backup Automático

Crea script en `/home/[site-user]/backup.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U afiches_user sistema_afiches > /home/[site-user]/backups/db_$DATE.sql
find /home/[site-user]/backups/ -name "db_*.sql" -mtime +7 -delete
```

Agrega a crontab:
```bash
0 2 * * * /home/[site-user]/backup.sh
```

## Monitoreo

CloudPanel incluye monitoreo básico. Para más detalle:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Soporte

- Logs del backend: `pm2 logs afiches-backend`
- Logs de PostgreSQL: `/var/log/postgresql/`
- Logs de Nginx: `/var/log/nginx/`
