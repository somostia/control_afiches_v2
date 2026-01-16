#!/bin/bash

# Script de configuración inicial para CloudPanel
# Ejecutar UNA VEZ después de clonar el repositorio

echo "⚙️ Configuración inicial del proyecto..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    echo "📝 Creando archivo .env..."
    cp .env.example .env
    echo "⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales"
    echo "   nano .env"
else
    echo "✅ Archivo .env ya existe"
fi

# Crear directorios necesarios
echo "📁 Creando directorios..."
mkdir -p backend/uploads
mkdir -p logs

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd backend
npm install --production
cd ..

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
npm install

# Verificar PostgreSQL
echo "🔍 Verificando conexión a PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL está instalado"
else
    echo "❌ PostgreSQL no encontrado. Instálalo antes de continuar."
fi

# Crear base de datos (requiere credenciales)
read -p "¿Deseas crear la base de datos ahora? (y/n): " crear_db
if [ "$crear_db" = "y" ]; then
    read -p "Usuario de PostgreSQL: " db_user
    read -p "Nombre de la base de datos: " db_name
    
    echo "Creando base de datos..."
    psql -U "$db_user" -c "CREATE DATABASE $db_name;" 2>/dev/null || echo "⚠️  Base de datos ya existe o error de permisos"
    
    echo "Ejecutando schema..."
    psql -U "$db_user" -d "$db_name" -f schema.sql
    
    echo "Migrando usuarios iniciales..."
    cd backend
    node migrar-usuarios.js
    node actualizar-sucursales-chile.js
    cd ..
fi

# Hacer ejecutables los scripts
chmod +x deploy.sh

echo ""
echo "✅ Configuración inicial completada"
echo ""
echo "📋 Próximos pasos:"
echo "1. Edita el archivo .env con tus credenciales"
echo "2. Ejecuta: npm run build"
echo "3. Inicia con PM2: pm2 start ecosystem.config.js"
echo "4. Guarda configuración: pm2 save"
echo ""
