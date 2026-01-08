# 📱 Guía de Optimización Móvil - Sistema de Afiches

## ✅ Mejoras Implementadas

### 1. **Estilos Responsive**
- ✅ Media queries para móviles, tablets y desktop
- ✅ Botones touch-friendly (mínimo 44x44px)
- ✅ Inputs con tamaño 16px (evita zoom en iOS)
- ✅ Padding reducido en pantallas pequeñas
- ✅ Flex items en columna para móvil

### 2. **Captura de Fotos**
- ✅ Atributo `capture="environment"` para abrir cámara trasera
- ✅ Accept `image/*` para todo tipo de imágenes
- ✅ Optimizado para subir fotos directamente desde el celular

### 3. **Meta Tags Móviles**
- ✅ viewport-fit=cover para dispositivos con notch
- ✅ mobile-web-app-capable para PWA
- ✅ apple-mobile-web-app-capable para iOS
- ✅ theme-color para barra de navegación

### 4. **Archivos CSS**
- ✅ `index.css` - Estilos base + media queries
- ✅ `mobile.css` - Utilidades mobile-friendly

## 📦 Para Deployment en Hosting

### Frontend (React)

**Opción 1: Netlify**
```bash
# 1. Build del proyecto
npm run build

# 2. Instalar Netlify CLI
npm install -g netlify-cli

# 3. Deploy
netlify deploy --prod --dir=build
```

**Opción 2: Vercel**
```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Deploy
vercel --prod
```

**Opción 3: Railway/Render (con server estático)**
```bash
# Crear archivo serve.json en la raíz:
{
  "public": "build",
  "rewrites": [
    { "source": "/**", "destination": "/index.html" }
  ]
}
```

### Backend (Node.js + PostgreSQL)

**Opción 1: Railway**
1. Crear cuenta en railway.app
2. New Project → Deploy from GitHub
3. Agregar PostgreSQL addon
4. Variables de entorno automáticas

**Opción 2: Render**
1. Crear cuenta en render.com
2. New Web Service → GitHub repo
3. New PostgreSQL database
4. Conectar variables de entorno

**Opción 3: Heroku**
```bash
# 1. Instalar Heroku CLI
# 2. Login
heroku login

# 3. Crear app
heroku create nombre-backend

# 4. Agregar PostgreSQL
heroku addons:create heroku-postgresql:mini

# 5. Deploy
git push heroku main
```

### Variables de Entorno

**Frontend (.env.production)**
```env
REACT_APP_API_URL=https://tu-backend.railway.app
```

**Backend (.env en el hosting)**
```env
# PostgreSQL (se configuran automáticamente en Railway/Render)
DB_USER=postgres
DB_HOST=containers-us-west-xxx.railway.app
DB_NAME=railway
DB_PASSWORD=xxxxx
DB_PORT=5432

# Server
PORT=3002
NODE_ENV=production

# CORS
FRONTEND_URL=https://tu-frontend.netlify.app
```

## 🗄️ Almacenamiento de Archivos

Las imágenes actualmente se guardan en `backend/uploads/`. Para producción, usa:

**Opción 1: Cloudinary (Gratis hasta 25GB)**
```bash
npm install cloudinary multer-storage-cloudinary
```

**Opción 2: AWS S3**
```bash
npm install aws-sdk multer-s3
```

**Opción 3: Railway Volumes** (para persistencia en Railway)
```bash
# En railway.toml
[deploy]
volumes = ["/app/uploads"]
```

## 📲 Testing en Móvil (Local)

### Android
```bash
# 1. Conectar por USB
# 2. Habilitar USB debugging
# 3. Chrome → chrome://inspect
# 4. Abrir: http://192.168.1.X:3000
```

### iOS
```bash
# 1. Conectar iPhone por USB
# 2. Safari → Develop → iPhone
# 3. Abrir: http://192.168.1.X:3000
```

### Obtener IP local:
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

## 🚀 Checklist para Producción

- [ ] Ejecutar `npm run build` sin errores
- [ ] Actualizar variables de entorno con URLs de producción
- [ ] Configurar PostgreSQL en la nube
- [ ] Configurar almacenamiento de archivos (Cloudinary/S3)
- [ ] Actualizar CORS en backend con URL del frontend
- [ ] Ejecutar migración de base de datos en producción
- [ ] Probar subida de fotos desde móvil
- [ ] Probar en Chrome DevTools modo móvil
- [ ] Probar en dispositivo real (Android/iOS)
- [ ] Configurar HTTPS (automático en Netlify/Vercel/Railway)

## 🎨 Características Mobile-Friendly

✅ **Touch-friendly**: Botones de 48x48px mínimo
✅ **Cámara directa**: `capture="environment"` 
✅ **Sin zoom**: Inputs de 16px
✅ **Responsive**: Media queries completas
✅ **Safe area**: Soporte para notch/isla dinámica
✅ **PWA ready**: Meta tags configurados
✅ **Imágenes responsive**: max-width 100%
✅ **Modales full-screen**: En móviles

## 🔧 Comandos Útiles

```bash
# Desarrollo local
npm start

# Build para producción
npm run build

# Limpiar base de datos
cd backend && node limpiar-db.js

# Ejecutar migración
cd backend && node run-migration.js

# Ver en red local
npm start # luego abrir http://[TU-IP]:3000 en el celular
```

## 📝 Notas Importantes

1. **iOS**: El atributo `capture` puede no funcionar en Safari, usa `accept="image/*"` como fallback
2. **Compresión**: Considera agregar compresión de imágenes antes de subir
3. **Offline**: Para PWA completo, agrega Service Worker
4. **Notificaciones**: Usa Push API para alertas en móvil
5. **Geolocalización**: Ya incluida en implementador_vista.jsx (comentada)

## 🐛 Troubleshooting Móvil

**Problema: Fotos muy grandes**
```javascript
// Agregar compresión con browser-image-compression
npm install browser-image-compression
```

**Problema: No abre la cámara**
- Verificar permisos en navegador
- Usar HTTPS (obligatorio para `getUserMedia`)
- En desarrollo local: usar tunnel (ngrok)

**Problema: Zoom al hacer click en inputs**
- Asegúrate que font-size sea >= 16px
- Está configurado en mobile.css

## 📚 Recursos

- [React Deployment](https://create-react-app.dev/docs/deployment/)
- [Railway Docs](https://docs.railway.app/)
- [Netlify Docs](https://docs.netlify.com/)
- [Cloudinary Setup](https://cloudinary.com/documentation/node_integration)
