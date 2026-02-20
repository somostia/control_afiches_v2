#!/usr/bin/env node
const pkg = require('../package.json');

const lines = [
    `\n${pkg.name} v${pkg.version}`,
    'Uso:',
    '  npm run start       # inicia el backend en modo normal',
    '  npm run dev         # inicia con recarga (nodemon)',
    '  npm run help        # muestra esta ayuda',
    '',
    'Variables clave (.env en backend raíz):',
    '  PORT=3002                     # puerto de escucha',
    '  DB_HOST=postgres              # host de Postgres',
    '  DB_PORT=5432                  # puerto de Postgres',
    '  DB_NAME=sistema_afiches       # base de datos',
    '  DB_USER=postgres              # usuario',
    '  DB_PASSWORD=***               # contraseña',
    '  FRONTEND_URL=https://...      # origen permitido para CORS',
    '',
    'Endpoints principales:',
    '  GET  /api/health              # estado del servicio',
    '  POST /login                   # autenticación',
    '  GET  /dashboard               # tareas resumidas',
    '  POST /campanas                # crear campaña',
    '  POST /upload-diseno           # subir archivo de diseño',
    '  PUT  /tareas/vobo-diseno/:id  # aprobar/rechazar diseño',
    '  PUT  /tareas/vobo-implementacion/:id  # aprobar implementación',
    '',
    'Ejemplos:',
    '  curl -i http://localhost:3002/api/health',
    '  curl -X POST http://localhost:3002/login -H "Content-Type: application/json" \\\n       -d "{\"usuario\":\"demo\",\"password\":\"demo\"}"',
    '',
    'Soporte:',
    '  Revisa README.md para comandos completos y configuración.'
];

console.log(lines.join('\n'));
