#!/bin/bash

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# 1. Iniciar aplicación
start_afiches() {
    echo -e "${CYAN}🐳 Iniciando aplicación con Docker...${NC}"
    
    if [ ! -f .env ]; then
        cp .env.docker .env
        echo -e "${GREEN}✅ Archivo .env creado desde .env.docker${NC}"
    fi
    
    docker-compose up -d --build
    
    echo -e "\n${GREEN}✅ Aplicación iniciada!${NC}"
    echo -e "\n${YELLOW}📍 Servicios disponibles:${NC}"
    echo -e "  - Frontend:  http://localhost"
    echo -e "  - Backend:   http://localhost:3002"
    echo -e "  - Database:  localhost:5432"
    echo -e "\n${GRAY}📝 Ver logs: logs_afiches${NC}"
    echo -e "${GRAY}🛑 Detener:  stop_afiches${NC}"
}

# 2. Detener aplicación
stop_afiches() {
    echo -e "${YELLOW}🛑 Deteniendo aplicación...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Aplicación detenida${NC}"
}

# 3. Ver logs en tiempo real
logs_afiches() {
    docker-compose logs -f
}

# 4. Reiniciar aplicación
restart_afiches() {
    echo -e "${CYAN}🔄 Reiniciando aplicación...${NC}"
    docker-compose restart
    echo -e "${GREEN}✅ Aplicación reiniciada${NC}"
}

# 5. Limpiar todo (contenedores, volúmenes, imágenes)
clean_afiches() {
    echo -e "${RED}🗑️  Limpiando Docker (contenedores, volúmenes, imágenes)...${NC}"
    read -p "¿Estás seguro? Esto eliminará todos los datos (S/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        docker-compose down -v --rmi all
        echo -e "${GREEN}✅ Limpieza completa${NC}"
    else
        echo -e "${YELLOW}Operación cancelada${NC}"
    fi
}

# 6. Reconstruir sin cache
rebuild_afiches() {
    echo -e "${CYAN}🔨 Reconstruyendo sin cache...${NC}"
    docker-compose build --no-cache
    docker-compose up -d
    echo -e "${GREEN}✅ Reconstrucción completada${NC}"
}

# 7. Estado de los servicios
status_afiches() {
    docker-compose ps
}

# 8. Acceder al contenedor del backend
enter_backend() {
    echo -e "${CYAN}Accediendo al contenedor backend...${NC}"
    docker exec -it afiches_backend sh
}

# 9. Acceder a la base de datos
enter_db() {
    echo -e "${CYAN}Accediendo a PostgreSQL...${NC}"
    docker exec -it afiches_db psql -U postgres -d sistema_afiches
}

# Mostrar ayuda
show_help() {
    echo -e "\n${CYAN}===================================${NC}"
    echo -e "${CYAN}  Comandos Disponibles${NC}"
    echo -e "${CYAN}===================================${NC}\n"
    echo -e "${GREEN}start_afiches${NC}      - Iniciar aplicación"
    echo -e "${YELLOW}stop_afiches${NC}       - Detener aplicación"
    echo -e "${CYAN}restart_afiches${NC}    - Reiniciar aplicación"
    echo -e "logs_afiches       - Ver logs en tiempo real"
    echo -e "status_afiches     - Ver estado de servicios"
    echo -e "rebuild_afiches    - Reconstruir sin cache"
    echo -e "${RED}clean_afiches${NC}      - Limpiar todo (¡cuidado!)"
    echo -e "${GRAY}enter_backend${NC}      - Acceder al contenedor backend"
    echo -e "${GRAY}enter_db${NC}           - Acceder a PostgreSQL"
    echo -e "\n${GRAY}💡 Uso: source docker-commands.sh, luego ejecuta los comandos${NC}\n"
}

# Mostrar ayuda al cargar
show_help
