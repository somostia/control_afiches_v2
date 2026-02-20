const { body, param, validationResult } = require('express-validator');

// Valores de ejemplo para responder mensajes claros
const exampleValues = {
    usuario: 'jane.doe',
    password: 'TuPassword123',
    nombre: 'Campaña Otoño 2025',
    tareas: '[{ "local": "Sucursal Centro", "tipo": "Afiche vitrina", "cantidad": 10 }]',
    'tareas.*.local': 'Sucursal Centro',
    'tareas.*.tipo': 'Afiche vitrina',
    'tareas.*.cantidad': 5,
    url_diseno: 'https://tu-cdn.com/afiche.pdf',
    aprobado: 'true',
    estado_logistica: 'en_transito',
    foto_url: 'https://tu-cdn.com/evidencia.jpg',
    gps: '-33.4489, -70.6693',
    archivo: 'diseño.pdf (<=10MB)'
};

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const detalles = errors.array().map((err) => ({
            campo: err.param,
            mensaje: err.msg,
            ejemplo: exampleValues[err.param] || exampleValues[err.location] || null
        }));

        console.error('❌ Errores de validación:', detalles);
        return res.status(400).json({
            error: 'Error de validación',
            detalles
        });
    }
    next();
};

// Validaciones para login
const validateLogin = [
    body('usuario')
        .trim()
        .notEmpty().withMessage('El usuario es requerido')
        .isLength({ min: 3, max: 50 }).withMessage('El usuario debe tener entre 3 y 50 caracteres'),

    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),

    handleValidationErrors
];

// Validaciones para crear campaña
const validateCampana = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre de la campaña es requerido (ej: Campaña Otoño 2025)')
        .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),

    body('disenador_id')
        .optional()
        .isInt({ min: 1 }).withMessage('El ID del diseñador debe ser un número positivo'),

    body('tareas')
        .isArray({ min: 1 }).withMessage('Debe incluir al menos una tarea (ej: [{ local, tipo, cantidad }])'),

    body('tareas.*.local')
        .trim()
        .notEmpty().withMessage('El nombre del local es requerido (ej: Sucursal Centro)'),

    body('tareas.*.tipo')
        .trim()
        .notEmpty().withMessage('El tipo de afiche es requerido (ej: Afiche vitrina)'),

    body('tareas.*.cantidad')
        .isInt({ min: 1 }).withMessage('La cantidad debe ser un número positivo (ej: 5)'),

    handleValidationErrors
];

// Validaciones para subir diseño
const validateDiseno = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID de tarea inválido'),

    body('url_diseno')
        .trim()
        .notEmpty().withMessage('La URL del diseño es requerida (ej: https://tu-cdn.com/archivo.pdf)')
        .custom((value) => {
            // Aceptar URLs válidas o rutas del servidor
            if (value.startsWith('http://') || value.startsWith('https://')) {
                return true;
            }
            throw new Error('La URL debe comenzar con http:// o https://');
        }),

    handleValidationErrors
];

// Validaciones para VoBo de diseño
const validateVoBo = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID de tarea inválido'),

    body('aprobado')
        .isBoolean().withMessage('El campo aprobado debe ser true o false (ej: true)'),

    handleValidationErrors
];

// Validaciones para actualizar logística
const validateLogistica = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID de tarea inválido'),

    body('estado_logistica')
        .isIn(['en_bodega', 'en_preparacion', 'en_transito', 'recibido', 'instalado'])
        .withMessage('Estado de logística inválido (usa: en_bodega|en_preparacion|en_transito|recibido|instalado)'),

    handleValidationErrors
];

// Validaciones para implementación
const validateImplementacion = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID de tarea inválido'),

    body('foto_url')
        .trim()
        .notEmpty().withMessage('La URL de la foto es requerida (ej: https://tu-cdn.com/evidencia.jpg)')
        .custom((value) => {
            // Aceptar URLs válidas (http o https)
            if (value.startsWith('http://') || value.startsWith('https://')) {
                return true;
            }
            throw new Error('La URL debe comenzar con http:// o https://');
        }),

    body('gps')
        .trim()
        .notEmpty().withMessage('Las coordenadas GPS son requeridas (ej: -33.4489, -70.6693)')
        .matches(/^-?\d+\.?\d*, ?-?\d+\.?\d*$/).withMessage('Formato de GPS inválido (usa: lat, lng)'),

    handleValidationErrors
];

// Validaciones para VoBo de implementación
const validateVoBoImplementacion = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID de tarea inválido'),

    body('aprobado')
        .isBoolean().withMessage('El campo aprobado debe ser true o false (ej: true)'),

    handleValidationErrors
];

// Validaciones para subida de archivos (diseños/fotos)
const validateUploadArchivo = [
    body('archivo').custom((value, { req }) => {
        if (!req.file) {
            throw new Error("Adjunta un archivo en el campo 'archivo' (ej: diseño.pdf)");
        }

        const allowedExt = ['.jpg', '.jpeg', '.png', '.pdf', '.ai', '.psd'];
        const ext = req.file.originalname ? req.file.originalname.toLowerCase() : '';
        const hasValidExt = allowedExt.some((allowed) => ext.endsWith(allowed));

        if (!hasValidExt) {
            throw new Error('Formato no soportado. Usa JPG, PNG, PDF, AI o PSD');
        }

        if (req.file.size > 10 * 1024 * 1024) {
            throw new Error('El archivo supera 10MB. Ajusta tamaño o compresión');
        }

        return true;
    }),

    handleValidationErrors
];

module.exports = {
    validateLogin,
    validateCampana,
    validateDiseno,
    validateVoBo,
    validateLogistica,
    validateImplementacion,
    validateVoBoImplementacion,
    validateUploadArchivo
};
