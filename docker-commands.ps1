# ==========================================
# Scripts de Inicio Rápido con Docker
# ==========================================

# WINDOWS (PowerShell)
# -------------------

# 1. Iniciar la aplicación completa (primera vez)
function Start-AfichesDocker {
    Write-Host "🐳 Iniciando aplicación con Docker..." -ForegroundColor Cyan
    
    # Copiar archivo de entorno si no existe
    if (-not (Test-Path .env)) {
        Copy-Item .env.docker .env
        Write-Host "✅ Archivo .env creado desde .env.docker" -ForegroundColor Green
    }
    
    # Construir e iniciar contenedores
    docker-compose up -d --build
    
    Write-Host ""
    Write-Host "✅ Aplicación iniciada!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Servicios disponibles:" -ForegroundColor Yellow
    Write-Host "  - Frontend:  http://localhost" -ForegroundColor White
    Write-Host "  - Backend:   http://localhost:3002" -ForegroundColor White
    Write-Host "  - Database:  localhost:5432" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Ver logs: docker-compose logs -f" -ForegroundColor Gray
    Write-Host "🛑 Detener:  docker-compose down" -ForegroundColor Gray
}

# 2. Detener la aplicación
function Stop-AfichesDocker {
    Write-Host "🛑 Deteniendo aplicación..." -ForegroundColor Yellow
    docker-compose down
    Write-Host "✅ Aplicación detenida" -ForegroundColor Green
}

# 3. Ver logs en tiempo real
function Get-AfichesLogs {
    docker-compose logs -f
}

# 4. Reiniciar la aplicación
function Restart-AfichesDocker {
    Write-Host "🔄 Reiniciando aplicación..." -ForegroundColor Cyan
    docker-compose restart
    Write-Host "✅ Aplicación reiniciada" -ForegroundColor Green
}

# 5. Limpiar todo (contenedores, volúmenes, imágenes)
function Remove-AfichesDocker {
    Write-Host "🗑️  Limpiando Docker (contenedores, volúmenes, imágenes)..." -ForegroundColor Red
    docker-compose down -v --rmi all
    Write-Host "✅ Limpieza completa" -ForegroundColor Green
}

# 6. Reconstruir sin cache
function Rebuild-AfichesDocker {
    Write-Host "🔨 Reconstruyendo sin cache..." -ForegroundColor Cyan
    docker-compose build --no-cache
    docker-compose up -d
    Write-Host "✅ Reconstrucción completada" -ForegroundColor Green
}

# 7. Estado de los servicios
function Get-AfichesStatus {
    docker-compose ps
}

# 8. Acceder al contenedor del backend
function Enter-BackendContainer {
    docker exec -it afiches_backend sh
}

# 9. Acceder a la base de datos
function Enter-Database {
    docker exec -it afiches_db psql -U postgres -d sistema_afiches
}

# Mostrar ayuda
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Comandos Disponibles" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Start-AfichesDocker     " -NoNewline -ForegroundColor Green
Write-Host "- Iniciar aplicación"
Write-Host "Stop-AfichesDocker      " -NoNewline -ForegroundColor Yellow
Write-Host "- Detener aplicación"
Write-Host "Restart-AfichesDocker   " -NoNewline -ForegroundColor Cyan
Write-Host "- Reiniciar aplicación"
Write-Host "Get-AfichesLogs         " -NoNewline -ForegroundColor White
Write-Host "- Ver logs en tiempo real"
Write-Host "Get-AfichesStatus       " -NoNewline -ForegroundColor Blue
Write-Host "- Ver estado de servicios"
Write-Host "Rebuild-AfichesDocker   " -NoNewline -ForegroundColor Magenta
Write-Host "- Reconstruir sin cache"
Write-Host "Remove-AfichesDocker    " -NoNewline -ForegroundColor Red
Write-Host "- Limpiar todo (¡cuidado!)"
Write-Host "Enter-BackendContainer  " -NoNewline -ForegroundColor Gray
Write-Host "- Acceder al contenedor backend"
Write-Host "Enter-Database          " -NoNewline -ForegroundColor Gray
Write-Host "- Acceder a PostgreSQL"
Write-Host ""
Write-Host "💡 Uso: Copia y pega el comando en PowerShell" -ForegroundColor Gray
Write-Host ""

# LINUX/MAC (Bash)
# ----------------
<#
# Guarda este contenido en docker-commands.sh y ejecuta: source docker-commands.sh

#!/bin/bash

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Iniciar aplicación
start_afiches() {
    echo -e "${CYAN}🐳 Iniciando aplicación con Docker...${NC}"
    
    if [ ! -f .env ]; then
        cp .env.docker .env
        echo -e "${GREEN}✅ Archivo .env creado${NC}"
    fi
    
    docker-compose up -d --build
    
    echo -e "\n${GREEN}✅ Aplicación iniciada!${NC}"
    echo -e "\n${YELLOW}📍 Servicios disponibles:${NC}"
    echo -e "  - Frontend:  http://localhost"
    echo -e "  - Backend:   http://localhost:3002"
    echo -e "  - Database:  localhost:5432"
}

# 2. Detener aplicación
stop_afiches() {
    echo -e "${YELLOW}🛑 Deteniendo aplicación...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Aplicación detenida${NC}"
}

# 3. Ver logs
logs_afiches() {
    docker-compose logs -f
}

# 4. Reiniciar aplicación
restart_afiches() {
    echo -e "${CYAN}🔄 Reiniciando aplicación...${NC}"
    docker-compose restart
    echo -e "${GREEN}✅ Aplicación reiniciada${NC}"
}

# 5. Limpiar todo
clean_afiches() {
    echo -e "${RED}🗑️  Limpiando Docker...${NC}"
    docker-compose down -v --rmi all
    echo -e "${GREEN}✅ Limpieza completa${NC}"
}

# Mostrar ayuda
echo -e "${CYAN}Comandos disponibles:${NC}"
echo "  start_afiches   - Iniciar aplicación"
echo "  stop_afiches    - Detener aplicación"
echo "  restart_afiches - Reiniciar aplicación"
echo "  logs_afiches    - Ver logs"
echo "  clean_afiches   - Limpiar todo"
#>
