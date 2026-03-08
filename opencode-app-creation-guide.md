# OpenCode: Crear Aplicaciones JavaScript desde Cero
## Guía Completa de Desarrollo con Stack Probado

> **Propósito**: Crear aplicaciones React + Node.js + PostgreSQL desde cero usando OpenCode
> **Experiencia**: Basado en desarrollo real de sistema de control de afiches
> **Stack**: React + Vite + Node.js + Express + PostgreSQL + JWT + bcrypt + Multer + Docker

---

## 📋 Índice

1. [Configuración Inicial del Proyecto](#configuración-inicial-del-proyecto)
2. [Estructura Base de la Aplicación](#estructura-base-de-la-aplicación)
3. [Desarrollo del Backend](#desarrollo-del-backend)
4. [Desarrollo del Frontend](#desarrollo-del-frontend)
5. [Base de Datos y Modelos](#base-de-datos-y-modelos)
6. [Sistema de Autenticación](#sistema-de-autenticación)
7. [Upload de Archivos](#upload-de-archivos)
8. [Dockerización](#dockerización)
9. [Testing y Debugging](#testing-y-debugging)
10. [Preparación para Despliegue](#preparación-para-despliegue)

---

## 🎯 Prompt Inicial para OpenCode

### Contexto para Nueva Aplicación
```markdown
Necesito crear una aplicación JavaScript completa desde cero usando OpenCode.

STACK DESEADO:
- Frontend: React + Vite + TailwindCSS
- Backend: Node.js + Express + JWT
- Base de datos: PostgreSQL
- Upload: Multer para archivos
- Autenticación: JWT + bcrypt
- Deploy: Docker + VPS Hostinger + CloudPanel

APLICACIÓN: [Describe tu idea de aplicación]

FUNCIONALIDADES BASE:
- Sistema de usuarios con roles
- Autenticación JWT
- Upload de archivos/imágenes
- CRUD básico
- Dashboard/panel de control
- API REST

REFERENCIAS:
- Tengo experiencia exitosa con este stack
- Aplicación de referencia: Sistema de control de afiches en producción
- Stack completamente probado en VPS con usuarios activos

Por favor, ayúdame a crear la estructura inicial del proyecto y comenzar el desarrollo paso a paso.
```

---

## 🏗️ Configuración Inicial del Proyecto

### 1. Estructura de Directorios Base
```
mi-aplicacion/
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   ├── utils/
│   │   └── styles/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
├── backend/                  # Node.js + Express
│   ├── routes/
│   ├── middleware/
│   ├── models/
│   ├── uploads/
│   ├── utils/
│   ├── package.json
│   ├── server.js
│   ├── db.js
│   └── Dockerfile
├── database/                 # PostgreSQL setup
│   └── init/
│       ├── init.sql
│       └── seed.sql
├── docker-compose.yml        # Orquestación
├── .env                     # Variables de entorno
├── .gitignore
└── README.md
```

### 2. Comandos Iniciales OpenCode
```bash
# Crear estructura base
mkdir mi-aplicacion && cd mi-aplicacion
mkdir -p frontend/src/{components,pages,context,services,utils,styles}
mkdir -p frontend/public
mkdir -p backend/{routes,middleware,models,uploads,utils}
mkdir -p database/init

# Crear archivos base
touch frontend/package.json frontend/vite.config.js frontend/tailwind.config.js
touch backend/package.json backend/server.js backend/db.js
touch docker-compose.yml .env .gitignore README.md
```

---

## 🎨 Desarrollo del Frontend

### 1. Setup React + Vite + TailwindCSS
```json
// frontend/package.json
{
  "name": "mi-aplicacion-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "axios": "^1.3.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.27",
    "@types/react-dom": "^18.0.10",
    "@vitejs/plugin-react": "^3.1.0",
    "vite": "^4.1.0",
    "autoprefixer": "^10.4.13",
    "postcss": "^8.4.21",
    "tailwindcss": "^3.2.6"
  }
}
```

### 2. Configuración Vite
```javascript
// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
```

### 3. Estructura de Componentes Base
```jsx
// frontend/src/App.jsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
```

### 4. Context de Autenticación
```jsx
// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/authService'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      authService.verifyToken()
        .then(userData => setUser(userData))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const response = await authService.login(email, password)
    setUser(response.user)
    localStorage.setItem('token', response.token)
    return response
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('token')
  }

  const value = {
    user,
    login,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
```

### 5. Servicio de API
```javascript
// frontend/src/services/api.js
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

---

## ⚙️ Desarrollo del Backend

### 1. Setup Node.js + Express
```json
// backend/package.json
{
  "name": "mi-aplicacion-backend",
  "version": "1.0.0",
  "description": "Backend para mi aplicación",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^6.0.1",
    "dotenv": "^16.0.3",
    "pg": "^8.8.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "multer": "^1.4.5-lts.1",
    "express-rate-limit": "^6.7.0",
    "express-validator": "^6.14.3"
  },
  "devDependencies": {
    "nodemon": "^2.0.20"
  }
}
```

### 2. Servidor Principal
```javascript
// backend/server.js
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const path = require('path')

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const uploadRoutes = require('./routes/uploads')

const app = express()
const PORT = process.env.PORT || 3002

// Middleware de seguridad
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))
app.use(cors())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 requests por ventana
})
app.use(limiter)

// Middleware de parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/uploads', uploadRoutes)

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error)
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado'
  })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
})
```

### 3. Configuración de Base de Datos
```javascript
// backend/db.js
const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mi_aplicacion',
  user: process.env.DB_USER || 'usuario',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// Test de conexión
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err.stack)
  } else {
    console.log('✅ Conectado a la base de datos PostgreSQL')
    release()
  }
})

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
}
```

### 4. Middleware de Autenticación
```javascript
// backend/middleware/auth.js
const jwt = require('jsonwebtoken')
const db = require('../db')

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Verificar que el usuario existe
    const result = await db.query(
      'SELECT id, email, rol, nombre FROM usuarios WHERE id = $1',
      [decoded.userId]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      })
    }

    req.user = result.rows[0]
    next()
  } catch (error) {
    console.error('Error en middleware de auth:', error)
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    })
  }
}

module.exports = authMiddleware
```

---

## 🔐 Sistema de Autenticación

### 1. Rutas de Autenticación
```javascript
// backend/routes/auth.js
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const db = require('../db')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

// Registro de usuario
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('nombre').notEmpty().trim(),
  body('rol').isIn(['admin', 'usuario', 'supervisor'])
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      })
    }

    const { email, password, nombre, rol = 'usuario' } = req.body

    // Verificar si el usuario ya existe
    const existingUser = await db.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    )

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      })
    }

    // Hash de la contraseña
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Crear usuario
    const result = await db.query(`
      INSERT INTO usuarios (email, password, nombre, rol, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, email, nombre, rol, created_at
    `, [email, hashedPassword, nombre, rol])

    const user = result.rows[0]

    // Generar JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol
      },
      token
    })
  } catch (error) {
    console.error('Error en registro:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos',
        errors: errors.array()
      })
    }

    const { email, password } = req.body

    // Buscar usuario
    const result = await db.query(
      'SELECT id, email, password, nombre, rol FROM usuarios WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      })
    }

    const user = result.rows[0]

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      })
    }

    // Generar JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      message: 'Login exitoso',
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol
      },
      token
    })
  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// Verificar token
router.get('/verify', authMiddleware, (req, res) => {
  res.json({
    success: true,
    user: req.user
  })
})

module.exports = router
```

---

## 📁 Upload de Archivos

### 1. Configuración Multer
```javascript
// backend/routes/uploads.js
const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads')
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    // Generar nombre único
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

// Filtros de archivo
const fileFilter = (req, file, cb) => {
  // Tipos de archivo permitidos
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false)
  }
}

// Configuración de multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
})

// Upload de archivo único
router.post('/single', authMiddleware, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      })
    }

    const fileUrl = `/uploads/${req.file.filename}`
    
    res.json({
      success: true,
      message: 'Archivo subido exitosamente',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl
      }
    })
  } catch (error) {
    console.error('Error en upload:', error)
    res.status(500).json({
      success: false,
      message: 'Error al subir el archivo'
    })
  }
})

// Upload múltiple
router.post('/multiple', authMiddleware, upload.array('files', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron archivos'
      })
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/${file.filename}`
    }))

    res.json({
      success: true,
      message: 'Archivos subidos exitosamente',
      files
    })
  } catch (error) {
    console.error('Error en upload múltiple:', error)
    res.status(500).json({
      success: false,
      message: 'Error al subir los archivos'
    })
  }
})

// Error handler para multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Máximo 10MB'
      })
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Demasiados archivos o campo de archivo inesperado'
      })
    }
  }

  if (error.message.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({
      success: false,
      message: error.message
    })
  }

  next(error)
})

module.exports = router
```

---

## 🗄️ Base de Datos y Modelos

### 1. Script de Inicialización
```sql
-- database/init/init.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'usuario',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de sesiones (opcional, para invalidar tokens)
CREATE TABLE sesiones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de archivos subidos
CREATE TABLE archivos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    nombre_original VARCHAR(255) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta VARCHAR(500) NOT NULL,
    tipo_mime VARCHAR(100) NOT NULL,
    tamaño INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_sesiones_usuario_id ON sesiones(usuario_id);
CREATE INDEX idx_sesiones_expires_at ON sesiones(expires_at);
CREATE INDEX idx_archivos_usuario_id ON archivos(usuario_id);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en usuarios
CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Limpiar sesiones expiradas (función para cron job)
CREATE OR REPLACE FUNCTION limpiar_sesiones_expiradas()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sesiones WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ language 'plpgsql';
```

### 2. Datos de Prueba
```sql
-- database/init/seed.sql
-- Usuario administrador por defecto
INSERT INTO usuarios (email, password, nombre, rol) 
VALUES (
    'admin@miapp.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewE3.dxsROj2a.lW', -- password: admin123
    'Administrador',
    'admin'
);

-- Usuario de prueba
INSERT INTO usuarios (email, password, nombre, rol) 
VALUES (
    'usuario@miapp.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewE3.dxsROj2a.lW', -- password: admin123
    'Usuario de Prueba',
    'usuario'
);
```

---

## 🐳 Dockerización

### 1. Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: frontend
    ports:
      - "8090:80"
    networks:
      - app-network
    restart: unless-stopped
    depends_on:
      - backend

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
      postgres:
        condition: service_healthy
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
      - ./database/init:/docker-entrypoint-initdb.d
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 30s
      timeout: 10s
      retries: 3

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: pgadmin
    environment:
      - PGLADMIN_DEFAULT_EMAIL=${PGLADMIN_DEFAULT_EMAIL}
      - PGLADMIN_DEFAULT_PASSWORD=${PGLADMIN_DEFAULT_PASSWORD}
    ports:
      - "5050:80"
    volumes:
      - pgladmin_data:/var/lib/pgladmin
    networks:
      - app-network
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
  pgladmin_data:
    driver: local
```

### 2. Dockerfile Frontend
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build

# Imagen de producción con nginx
FROM nginx:alpine

# Copiar build
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración nginx personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 80

# Comando por defecto
CMD ["nginx", "-g", "daemon off;"]
```

### 3. Dockerfile Backend
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

# Crear directorio de trabajo
WORKDIR /app

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente
COPY . .

# Crear directorio uploads
RUN mkdir -p uploads && chown -R nodejs:nodejs /app

# Cambiar a usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Comando por defecto
CMD ["node", "server.js"]
```

---

## ⚡ Testing y Debugging

### 1. Scripts de Testing
```bash
# Crear scripts de testing
cat > test-api.sh << 'EOF'
#!/bin/bash

API_BASE="http://localhost:3002/api"

echo "🧪 Testing API Endpoints"
echo "========================"

# Health check
echo "1. Health Check:"
curl -s "$API_BASE/../health" | jq

# Registro de usuario
echo -e "\n2. Registro de usuario:"
curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "nombre": "Usuario de Prueba",
    "rol": "usuario"
  }' | jq

# Login
echo -e "\n3. Login:"
TOKEN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }' | jq -r '.token')

echo "Token obtenido: $TOKEN"

# Verificar token
echo -e "\n4. Verificar token:"
curl -s -X GET "$API_BASE/auth/verify" \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n✅ Testing completado"
EOF

chmod +x test-api.sh
```

### 2. Debugging Local
```bash
# Comandos de debugging
echo "=== Debugging Commands ==="

# Ver logs de contenedores
echo "docker-compose logs frontend"
echo "docker-compose logs backend"
echo "docker-compose logs postgres"

# Acceder a contenedores
echo "docker exec -it backend bash"
echo "docker exec -it postgres psql -U \$DB_USER -d \$DB_NAME"

# Verificar red
echo "docker network inspect app-network"

# Estado de servicios
echo "docker-compose ps"
echo "curl http://localhost:3002/health"
echo "curl http://localhost:8090"
```

---

## 🚀 Preparación para Despliegue

### 1. Variables de Entorno Producción
```bash
# .env (producción)
NODE_ENV=production
DB_HOST=postgres
DB_PORT=5432
DB_NAME=mi_aplicacion_prod
DB_USER=app_user
DB_PASSWORD=SecurePassword32CharsHere123456789
JWT_SECRET=SuperSecureJWTSecret64CharsForProductionUse123456789012345
PGLADMIN_DEFAULT_EMAIL=admin@mi-dominio.com
PGLADMIN_DEFAULT_PASSWORD=AdminPassword24Chars1234
```

### 2. Scripts de Despliegue
```bash
# deploy.sh
#!/bin/bash

echo "🚀 Iniciando despliegue..."

# Detener servicios existentes
echo "Deteniendo servicios..."
docker-compose down --remove-orphans

# Limpiar recursos Docker
echo "Limpiando recursos..."
docker system prune -f

# Crear red si no existe
docker network create app-network 2>/dev/null || true

# Construir imágenes
echo "Construyendo imágenes..."
docker-compose build --no-cache

# Iniciar servicios
echo "Iniciando servicios..."
docker-compose up -d

# Esperar a que los servicios estén listos
echo "Esperando servicios..."
sleep 30

# Verificar estado
echo "Verificando estado..."
docker-compose ps

# Test básico
echo "Testing básico..."
curl -f http://localhost:3002/health && echo "✅ Backend OK"
curl -f http://localhost:8090 && echo "✅ Frontend OK"

echo "🎉 Despliegue completado"
```

---

## 📚 Checklist de Desarrollo

### ✅ Backend Completado
- [ ] Servidor Express configurado
- [ ] Conexión PostgreSQL establecida
- [ ] Sistema de autenticación JWT + bcrypt
- [ ] Middleware de seguridad (helmet, cors, rate limiting)
- [ ] Upload de archivos con Multer
- [ ] Validación de datos con express-validator
- [ ] Manejo de errores centralizado
- [ ] Health check endpoint
- [ ] Logs estructurados

### ✅ Frontend Completado
- [ ] App React con Vite configurada
- [ ] TailwindCSS para estilos
- [ ] React Router para navegación
- [ ] Context API para estado global
- [ ] Servicios API con axios
- [ ] Interceptors para autenticación
- [ ] Componentes de UI básicos
- [ ] Formularios con validación
- [ ] Upload de archivos

### ✅ Base de Datos
- [ ] Esquema PostgreSQL creado
- [ ] Tablas con relaciones definidas
- [ ] Índices para performance
- [ ] Triggers para auditoría
- [ ] Datos de prueba (seed)
- [ ] Funciones de limpieza

### ✅ DevOps
- [ ] Docker Compose configurado
- [ ] Dockerfiles optimizados
- [ ] Variables de entorno seguras
- [ ] Red Docker configurada
- [ ] Volumes para persistencia
- [ ] Health checks implementados

### ✅ Testing
- [ ] Scripts de testing API
- [ ] Comandos de debugging
- [ ] Verificación de endpoints
- [ ] Test de autenticación
- [ ] Test de uploads

### ✅ Preparación Deploy
- [ ] Variables de producción
- [ ] Scripts de despliegue
- [ ] Configuración nginx preparada
- [ ] SSL considerado
- [ ] Monitoring básico

---

## 🎯 Próximos Pasos con OpenCode

Una vez completada la aplicación base, puedes usar los otros archivos de referencia:

1. **`opencode-quick-start-template.md`** - Para desplegar en VPS + CloudPanel
2. **`deployment-guide-developers.md`** - Guía completa de despliegue
3. **`deployment-guide-sysadmins.md`** - Guía de administración de sistemas

### Prompt para Despliegue
```markdown
He completado el desarrollo de mi aplicación usando la guía de creación desde cero.

APLICACIÓN LISTA:
- ✅ Frontend React + Vite + TailwindCSS
- ✅ Backend Node.js + Express + JWT
- ✅ Base de datos PostgreSQL
- ✅ Upload de archivos con Multer
- ✅ Docker Compose configurado
- ✅ Testing básico completado

NECESITO:
- Desplegar en VPS Hostinger con CloudPanel
- Configurar SSL automático
- Configurar proxy nginx para /api/ y /uploads/
- Variables de entorno de producción seguras

REFERENCIA:
[Pegar contenido de opencode-quick-start-template.md]

Por favor, ayúdame con el proceso de despliegue paso a paso.
```

---

**Versión**: 1.0 - Guía de Desarrollo desde Cero  
**Última actualización**: Diciembre 2024  
**Basado en**: Aplicación real de control de afiches en producción

*Esta guía te permite crear aplicaciones completas desde cero usando OpenCode con un stack completamente probado y en producción.*