#!/bin/bash

# Script de despliegue para CloudPanel
# Ejecutar después de hacer git pull

echo "🚀 Iniciando despliegue..."

# Ir al directorio del proyecto
cd "$(dirname "$0")"

# Actualizar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd backend
npm install --production

# Volver a la raíz
cd ..

# Build del frontend
echo "🏗️ Construyendo frontend..."
npm install
npm run build

# Reiniciar servicio con PM2
echo "🔄 Reiniciando aplicación..."
pm2 reload ecosystem.config.js

# Mostrar estado
echo "✅ Despliegue completado"
pm2 status

echo "📊 Ver logs: pm2 logs afiches-backend"
