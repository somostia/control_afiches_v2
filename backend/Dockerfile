# Dockerfile para el Backend (Node.js/Express)
FROM node:18-alpine

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache python3 make g++

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (sin dev). Usamos npm install porque no hay package-lock.
RUN npm install --omit=dev

# Copiar el código de la aplicación
COPY . .

# Crear directorio para uploads si no existe
RUN mkdir -p uploads

# Exponer el puerto
EXPOSE 3002

# Configurar variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3002

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
