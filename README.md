# Sistema de Gestión de Afiches

Sistema completo para gestionar campañas de afiches publicitarios, desde el diseño hasta la implementación física en sucursales.

## 🎯 Características

- **Panel de Supervisor**: Vista general de todas las tareas con indicadores de estado en tiempo real
- **Vista de Diseñador**: Creación de campañas con selector de sucursales, revisión y aprobación de diseños e implementaciones
- **Vista de Dibujante**: Carga de diseños, preparación de paquetes y confirmación de despachos
- **Vista de Implementador**: Recepción de paquetes y registro de instalaciones con foto y GPS
  - **Implementadores por Sucursal**: Cada implementador ve únicamente las tareas de su local asignado
- **Catálogo de Sucursales**: Base de datos centralizada con todas las sucursales disponibles
- **Sistema de Autenticación**: Control de acceso basado en roles con sesiones persistentes
- **Relación Sucursal-Implementador**: Garantiza que cada local tenga su implementador asignado

## 🛠️ Tecnologías

### Frontend
- React 18
- Axios para consumo de API
- CSS personalizado con diseño responsive

### Backend
- Node.js con Express
- PostgreSQL como base de datos
- Multer para carga de archivos
- CORS habilitado

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- PostgreSQL (v12 o superior)
- Git

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/somostia/control_afiches.git
cd control_afiches
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto basado en `.env.example`:

```env
# Base de datos PostgreSQL
DB_USER=tu_usuario
DB_HOST=localhost
DB_NAME=sistema_afiches
DB_PASSWORD=tu_password
DB_PORT=5432

# Puerto del servidor
PORT=3002
```

### 3. Crear la base de datos

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE sistema_afiches;
\q
```

Ejecutar el schema:

```bash
psql -U postgres -d sistema_afiches -f schema.sql
```

### 4. Instalar dependencias

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd ..
npm install
```

### 5. Iniciar el proyecto

#### Terminal 1 - Backend
```bash
cd backend
node server.js
```
El servidor estará disponible en `http://localhost:3002`

#### Terminal 2 - Frontend
```bash
npm start
```
La aplicación estará disponible en `http://localhost:3000`

## Comandos rápidos

Backend (en carpeta `backend`):
- `npm run start` inicia en modo normal.
- `npm run dev` inicia con recarga (nodemon).
- `npm run help` muestra comandos, variables y endpoints clave.

Frontend (en raíz del proyecto):
- `npm start` arranca desarrollo (usa `REACT_APP_API_URL`).
- `npm run build` genera el bundle de producción.

## Variables de entorno clave

Backend (.env en raíz del proyecto):
- `PORT` puerto del backend (ej. 3002).
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` configuración de Postgres.
- `FRONTEND_URL` origen permitido para CORS.

Frontend (.env en raíz del proyecto):
- `REACT_APP_API_URL` URL base del backend que consumirá el bundle.
- `FRONTEND_PORT` puerto expuesto del contenedor frontend (si usas docker-compose).

## �📁 Estructura del Proyecto

```
control_afiches/
├── backend/
│   ├── db.js                 # Configuración de PostgreSQL
│   ├── server.js             # Servidor Express con autenticación
│   ├── validators.js         # Validadores de datos
│   ├── migrar-usuarios.js    # Migración inicial de autenticación
│   ├── migrar-implementadores.js  # Migración para implementadores por sucursal
│   ├── limpiar-db.js         # Script para limpiar base de datos
│   └── uploads/              # Carpeta de archivos subidos
├── src/
│   ├── components/
│   │   ├── login.jsx         # Pantalla de inicio de sesión
│   │   ├── administrador_vista.jsx
│   │   ├── supervisor_vista.jsx
│   │   ├── diseñador_vista.jsx
│   │   ├── dibujante_vista.jsx
│   │   └── implementador_vista.jsx  # Con filtrado por sucursal
│   ├── App.js                # Componente principal con autenticación
│   ├── config.js             # Configuración de API
│   ├── index.js              # Punto de entrada React
│   └── index.css             # Estilos globales
├── public/
│   └── index.html
├── schema.sql                # Schema de la base de datos con sucursales
├── .env.example              # Ejemplo de variables de entorno
├── .gitignore
└── package.json
```

## 🔄 Flujo de Trabajo

1. **Diseñador** crea una campaña con los locales y tipos de afiches requeridos
2. **Dibujante** recibe la tarea y sube el diseño para aprobación
3. **Diseñador** revisa y aprueba/rechaza el diseño
4. **Dibujante** prepara el paquete físico y sube foto de confirmación
5. **Dibujante** confirma el despacho del paquete
6. **Implementador** (del local específico) recibe el paquete en su sucursal
7. **Implementador** instala el afiche y sube foto con GPS
8. **Diseñador** revisa y aprueba la implementación final
9. **Supervisor** monitorea todo el proceso en tiempo real

> **Nota**: Los implementadores solo ven las tareas de su sucursal asignada, lo que permite tener múltiples implementadores trabajando simultáneamente en diferentes locales.

## 🎨 Características de la UI

- Diseño responsive que se adapta a móviles y escritorio
- Botones de navegación optimizados para pantallas pequeñas (< 750px)
- Modales para visualización de imágenes en la misma ventana
- Indicadores de estado visual con colores (rojo, amarillo, verde)
- Vista de "siguiente paso pendiente" en el dashboard del supervisor

## 📊 Base de Datos

### Tablas principales

- **campanas**: Información de campañas creadas
- **tareas_implementacion**: Tareas individuales por sucursal
- Estados de diseño: `pendiente`, `amarillo`, `aprobado`
- Estados de logística: `en_bodega`, `en_preparacion`, `en_transito`, `recibido`

## 🔧 Scripts Útiles

```bash
# Limpiar base de datos de prueba
cd backend
node limpiar-db.js

# Ejecutar migración de implementadores por sucursal
node migrar-implementadores.js
```

## 🔄 Migraciones

Si ya tienes una base de datos existente, ejecuta las migraciones en este orden:

```bash
cd backend

# 1. Crear tabla de sucursales y catálogo inicial
node migrar-sucursales.js

# 2. Crear implementadores vinculados a sucursales
node migrar-implementadores.js

# 3. Verificar que todo esté correcto
node verificar-relaciones.js
```

### Migración de Sucursales
Este script:
- Crea la tabla `sucursales` con id, nombre, dirección, activo
- Inserta 5 sucursales iniciales
- Crea índice para optimizar búsquedas

### Migración de Implementadores
Este script:
- Agrega la columna `sucursal_asignada` a la tabla usuarios
- Elimina todos los implementadores anteriores
- Crea 5 implementadores específicos, uno por sucursal
- Muestra un resumen con credenciales

### Verificación de Relaciones
Este script muestra:
- Lista de implementadores y sus sucursales asignadas
- Lista de sucursales disponibles
- Relación completa entre sucursales e implementadores

## 📝 API Endpoints

### Autenticación
- `POST /login` - Autenticar usuario (retorna: id, nombre, usuario, rol, sucursal_asignada)

### Sucursales
- `GET /sucursales` - Obtener catálogo de sucursales disponibles (usado por formulario de diseñador)

### Campañas
- `POST /campanas` - Crear nueva campaña

### Dashboard
- `GET /dashboard` - Obtener todas las tareas
- `GET /dashboard?sucursal=NombreSucursal` - Filtrar tareas por sucursal (para implementadores)

### Diseño
- `POST /upload-diseno` - Subir archivo de diseño
- `PUT /tareas/dibujo/:id` - Actualizar diseño de tarea
- `PUT /tareas/vobo-diseno/:id` - Aprobar/rechazar diseño

### Logística
- `PUT /tareas/preparar-despacho/:id` - Confirmar paquete listo
- `PUT /tareas/despacho/:id` - Actualizar estado de despacho

### Implementación
- `PUT /tareas/implementacion/:id` - Subir foto de instalación
- `PUT /tareas/vobo-implementacion/:id` - Aprobar implementación

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y está bajo desarrollo.

## 👥 Autores

- **Equipo Somostia** - *Desarrollo inicial*

## 📞 Soporte

Para reportar bugs o solicitar features, crea un issue en el repositorio de GitHub.
