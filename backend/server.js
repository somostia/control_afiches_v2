const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const winston = require('winston');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = require('./db');
const {
    validateCampana,
    validateDiseno,
    validateVoBo,
    validateLogistica,
    validateImplementacion,
    validateVoBoImplementacion
} = require('./validators');

// Configurar Winston Logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'afiches-backend' },
    transports: [
        new winston.transports.File({ filename: path.join(__dirname, '..', 'logs', 'error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(__dirname, '..', 'logs', 'combined.log') })
    ]
});

// En desarrollo, también logear a consola
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

const app = express();
const PORT = process.env.PORT || 3002;

// Crear carpeta de uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Crear carpeta de logs si no existe
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'diseno-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf|ai|psd/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf' || file.mimetype === 'application/postscript';

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen (JPG, PNG) o diseño (PDF, AI, PSD)'));
        }
    }
});

// Rate Limiter para Login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // límite de 5 intentos
    message: 'Demasiados intentos de login. Por favor, intente nuevamente en 15 minutos.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3003',
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Ruta de login
app.post('/login', loginLimiter, async (req, res) => {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
        logger.warn('Intento de login sin credenciales');
        return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    try {
        const resultado = await pool.query(
            'SELECT id, nombre, usuario, rol, sucursal_asignada, password FROM usuarios WHERE usuario = $1',
            [usuario]
        );

        if (resultado.rows.length === 0) {
            logger.warn(`Intento de login fallido para usuario: ${usuario}`);
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        const user = resultado.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            logger.warn(`Contraseña incorrecta para usuario: ${usuario}`);
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        // No enviar password al cliente
        delete user.password;

        logger.info(`Login exitoso para usuario: ${usuario}`);
        res.json({
            success: true,
            usuario: user
        });
    } catch (err) {
        logger.error('Error en login:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Ruta raíz - Health check
app.get('/', (req, res) => {
    res.json({
        mensaje: 'API Sistema de Afiches',
        version: '1.0.0',
        estado: 'activo',
        endpoints: {
            campanas: 'POST /campanas',
            dashboard: 'GET /dashboard',
            upload: 'POST /upload-diseno',
            dibujo: 'PUT /tareas/dibujo/:id',
            vobo: 'PUT /tareas/vobo-diseno/:id',
            preparar_despacho: 'PUT /tareas/preparar-despacho/:id',
            despacho: 'PUT /tareas/despacho/:id',
            recibir: 'PUT /tareas/recibir/:id',
            implementacion: 'PUT /tareas/implementacion/:id',
            vobo_impl: 'PUT /tareas/vobo-implementacion/:id'
        }
    });
});

// Ruta para subir archivo de diseño
app.post('/upload-diseno', upload.single('archivo'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió ningún archivo' });
        }

        const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
        logger.info(`Archivo subido: ${req.file.filename}`);
        logger.debug(`URL generada: ${fileUrl}`);

        res.json({
            mensaje: 'Archivo subido exitosamente',
            url: fileUrl,
            nombreArchivo: req.file.originalname
        });
    } catch (err) {
        logger.error('Error al subir archivo:', err);
        res.status(500).json({ error: err.message });
    }
});

// 1. Ruta para que el DISEÑADOR cree una campaña y sus tareas iniciales
app.post('/campanas', validateCampana, async (req, res) => {
    const { nombre, disenador_id, tareas, url_diseno_referencia } = req.body;
    try {
        // Creamos la campaña
        const nuevaCampana = await pool.query(
            "INSERT INTO campanas (nombre, disenador_id) VALUES ($1, $2) RETURNING id",
            [nombre, disenador_id || 1]
        );

        const campanaId = nuevaCampana.rows[0].id;

        // Insertamos los locales y afiches (tareas) vinculados a esa campaña
        for (let tarea of tareas) {
            await pool.query(
                "INSERT INTO tareas_implementacion (campana_id, sucursal_nombre, tipo_afiche, cantidad, url_diseno_referencia) VALUES ($1, $2, $3, $4, $5)",
                [campanaId, tarea.local, tarea.tipo, tarea.cantidad, url_diseno_referencia || null]
            );
        }

        res.json({ mensaje: "Campaña y tareas creadas con éxito", id: campanaId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Ruta para que el SUPERVISOR vea todos los semáforos
// También usada por IMPLEMENTADORES con filtro por sucursal
app.get('/dashboard', async (req, res) => {
    try {
        const { sucursal } = req.query; // Parámetro opcional para filtrar por sucursal

        let query = `
            SELECT 
                t.*,
                c.nombre as nombre_campana
            FROM tareas_implementacion t
            LEFT JOIN campanas c ON t.campana_id = c.id
        `;

        let params = [];

        // Si viene sucursal en el query, filtrar por ella
        if (sucursal) {
            query += ` WHERE t.sucursal_nombre = $1`;
            params.push(sucursal);
        }

        query += ` ORDER BY t.id DESC`;

        const resultado = await pool.query(query, params);
        res.json(resultado.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Ruta para obtener todas las sucursales disponibles
app.get('/sucursales', async (req, res) => {
    try {
        const resultado = await pool.query(
            'SELECT id, nombre, direccion FROM sucursales WHERE activo = TRUE ORDER BY nombre'
        );
        res.json(resultado.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para que el DIBUJANTE suba el diseño
app.put('/tareas/dibujo/:id', validateDiseno, async (req, res) => {
    const { id } = req.params;
    const { url_diseno } = req.body;
    try {
        await pool.query(
            "UPDATE tareas_implementacion SET url_diseno_archivo = $1, estado_diseno = 'amarillo' WHERE id = $2",
            [url_diseno, id]
        );
        res.json({ mensaje: "Diseño cargado. Semáforo actualizado a Amarillo." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para que el DISEÑADOR dé el VoBo de Diseño
app.put('/tareas/vobo-diseno/:id', validateVoBo, async (req, res) => {
    const { id } = req.params;
    const { aprobado } = req.body; // true o false
    try {
        const estado = aprobado ? 'aprobado' : 'pendiente';
        await pool.query(
            "UPDATE tareas_implementacion SET vobo_diseno_ok = $1, estado_diseno = $2 WHERE id = $3",
            [aprobado, estado, id]
        );
        res.json({ mensaje: aprobado ? "Diseño Aprobado (Verde)" : "Diseño Rechazado (Vuelve a Rojo)" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Ruta para actualizar estado de logística física
app.put('/tareas/despacho/:id', validateLogistica, async (req, res) => {
    const { id } = req.params;
    const { estado_logistica } = req.body; // 'en_preparacion', 'en_transito'
    try {
        await pool.query(
            "UPDATE tareas_implementacion SET estado_logistica = $1 WHERE id = $2",
            [estado_logistica, id]
        );
        res.json({ mensaje: `Estado actualizado: ${estado_logistica}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para que el DIBUJANTE confirme paquete listo para despacho
app.put('/tareas/preparar-despacho/:id', async (req, res) => {
    const { id } = req.params;
    const { url_foto_paquete } = req.body;

    logger.debug(`Preparar despacho - ID: ${id}`);
    logger.debug(`URL foto paquete: ${url_foto_paquete}`);

    try {
        const result = await pool.query(
            "UPDATE tareas_implementacion SET url_foto_paquete = $1, estado_logistica = 'en_preparacion' WHERE id = $2 RETURNING *",
            [url_foto_paquete, id]
        );

        logger.info(`Paquete preparado para tarea ID: ${id}`);
        res.json({ mensaje: "Paquete confirmado. Listo para despacho.", data: result.rows[0] });
    } catch (err) {
        logger.error('Error en preparar-despacho:', err);
        res.status(500).json({ error: err.message });
    }
});

// Implementador recibe paquete
app.put('/tareas/recibir/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(
            "UPDATE tareas_implementacion SET estado_logistica = 'recibido' WHERE id = $1",
            [id]
        );
        res.json({ mensaje: "Paquete recibido" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para que el IMPLEMENTADOR marque recepción e instalación
app.put('/tareas/implementacion/:id', validateImplementacion, async (req, res) => {
    const { id } = req.params;
    const { foto_url, gps } = req.body;
    try {
        await pool.query(
            `UPDATE tareas_implementacion 
             SET foto_evidencia_url = $1, 
                 gps_coords = $2, 
                 estado_logistica = 'instalado',
                 fecha_instalacion = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [foto_url, gps || null, id]
        );
        res.json({ mensaje: "Implementación registrada con éxito" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para que el DISEÑADOR dé el VoBo de Implementación
app.put('/tareas/vobo-implementacion/:id', validateVoBoImplementacion, async (req, res) => {
    const { id } = req.params;
    const { aprobado } = req.body; // true o false
    try {
        // Si se aprueba, marcar como instalado. Si se rechaza, volver a recibido
        const nuevoEstado = aprobado ? 'instalado' : 'recibido';
        await pool.query(
            "UPDATE tareas_implementacion SET vobo_impl_ok = $1, estado_logistica = $2 WHERE id = $3",
            [aprobado, nuevoEstado, id]
        );
        res.json({ mensaje: aprobado ? "Implementación Aprobada ✅" : "Implementación Rechazada ❌" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    logger.info('═══════════════════════════════════════');
    logger.info('🎨 Sistema de Afiches - Backend');
    logger.info(`Puerto: ${PORT}`);
    logger.info('Base de datos: PostgreSQL');
    logger.info(`Modo: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`CORS habilitado para: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    logger.info('═══════════════════════════════════════');
});