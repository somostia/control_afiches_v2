# Checklist de Deploy a CloudPanel

## Pre-Deploy (Local)
- [x] Seguridad implementada (bcrypt, rate limiting, CORS, helmet, winston)
- [x] Script migrate-passwords.js creado
- [x] Tests locales completados (login funciona)
- [x] Git commit y push completado
- [ ] Build de React probado: `npm run build`

## CloudPanel - Configuración Inicial

### 1. Crear Sitio Node.js
- Panel CloudPanel → Sites → Add Site
- Tipo: Node.js
- Dominio: tu-dominio.com
- Node Version: 18.x o superior
- Document Root: /htdocs

### 2. Configurar Base de Datos
```bash
# En CloudPanel → Databases → Add Database
Database Name: sistema_afiches
Database User: afiches_user
Password: [generar password seguro]
```

### 3. Conectar por SSH
```bash
ssh username@tu-servidor
cd /home/username/htdocs/tu-dominio.com
```

### 4. Clonar Repositorio
```bash
git clone https://github.com/somostia/control_afiches_v2.git .
```

### 5. Ejecutar Setup
```bash
chmod +x setup.sh
./setup.sh
```

El script te pedirá:
- DB_USER
- DB_HOST (localhost)
- DB_NAME
- DB_PASSWORD
- DB_PORT (5432)

### 6. Importar Schema y Datos
```bash
psql -U afiches_user -d sistema_afiches -f backend/db/schema.sql
```

### 7. Migrar Contraseñas a bcrypt
```bash
cd backend
node migrate-passwords.js
# Escribir "SI" cuando pregunte
```

### 8. Build Frontend
```bash
npm run build
```

### 9. Configurar Variables de Producción
```bash
nano .env
```

Contenido (usar .env.production como referencia):
```env
DB_USER=afiches_user
DB_HOST=localhost
DB_NAME=sistema_afiches
DB_PASSWORD=tu_password_real
DB_PORT=5432

PORT=3002
NODE_ENV=production

FRONTEND_URL=https://tu-dominio.com
DEFAULT_DISENADOR_ID=1
```

### 10. Iniciar con PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 11. Configurar SSL (Let's Encrypt)
```bash
# En CloudPanel → SSL/TLS → Let's Encrypt
# O manual:
sudo certbot --nginx -d tu-dominio.com
```

### 12. Configurar Reverse Proxy en CloudPanel
```
Backend: http://localhost:3002
Frontend: Servir desde build/ (React)
```

## Post-Deploy - Verificación

- [ ] Acceder a https://tu-dominio.com
- [ ] Login con admin/admin funciona
- [ ] Verificar logs: `pm2 logs afiches-backend`
- [ ] Probar creación de campaña
- [ ] Verificar subida de archivos
- [ ] Probar con 18 implementadores

## Mantenimiento

### Ver Logs
```bash
pm2 logs afiches-backend
# O archivos:
tail -f logs/error.log
tail -f logs/combined.log
```

### Actualizar Aplicación
```bash
./deploy.sh
```

### Reiniciar Servidor
```bash
pm2 restart afiches-backend
```

### Backup Base de Datos
```bash
pg_dump -U afiches_user sistema_afiches > backup_$(date +%Y%m%d).sql
```

## Troubleshooting

### Backend no inicia
```bash
pm2 logs afiches-backend
# Verificar .env y permisos
```

### Error de CORS
- Verificar FRONTEND_URL en .env
- Debe ser https://tu-dominio.com (sin barra final)

### Error de base de datos
```bash
# Verificar conexión
psql -U afiches_user -d sistema_afiches
```

### Archivos no se suben
```bash
# Verificar permisos
chmod 755 backend/uploads
```

## URLs Importantes

- GitHub: https://github.com/somostia/control_afiches_v2
- Documentación completa: CLOUDPANEL_DEPLOY.md
- PM2 Docs: https://pm2.keymetrics.io/

## Contacto Soporte

- Verificar logs primero
- Documentar error exacto
- Incluir output de: `pm2 logs` y `cat logs/error.log`
