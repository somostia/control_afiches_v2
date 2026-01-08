const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

const app = express();
const PORT = process.env.PORT || 3002;

// Crear carpeta de uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
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

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

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
        console.log('📤 Archivo subido:', req.file.filename);
        console.log('🔗 URL generada:', fileUrl);

        res.json({
            mensaje: 'Archivo subido exitosamente',
            url: fileUrl,
            nombreArchivo: req.file.originalname
        });
    } catch (err) {
        console.error('❌ Error al subir archivo:', err);
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
app.get('/dashboard', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT 
                t.*,
                c.nombre as nombre_campana
            FROM tareas_implementacion t
            LEFT JOIN campanas c ON t.campana_id = c.id
            ORDER BY t.id DESC
        `);
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

    console.log('📦 Preparar despacho - ID:', id);
    console.log('📦 URL foto paquete:', url_foto_paquete);

    try {
        const result = await pool.query(
            "UPDATE tareas_implementacion SET url_foto_paquete = $1, estado_logistica = 'en_preparacion' WHERE id = $2 RETURNING *",
            [url_foto_paquete, id]
        );

        console.log('✅ Resultado:', result.rows[0]);
        res.json({ mensaje: "Paquete confirmado. Listo para despacho.", data: result.rows[0] });
    } catch (err) {
        console.error('❌ Error en preparar-despacho:', err);
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
    console.log(`
╔═══════════════════════════════════════╗
║   🎨 Sistema de Afiches - Backend    ║
║   Puerto: ${PORT}                         ║
║   Base de datos: PostgreSQL          ║
╚═══════════════════════════════════════╝
    `);
});