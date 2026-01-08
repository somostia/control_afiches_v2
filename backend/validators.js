const { body, param, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Error de validación',
            detalles: errors.array()
        });
    }
    next();
};

// Validaciones para crear campaña
const validateCampana = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre de la campaña es requerido')
        .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),

    body('disenador_id')
        .optional()
        .isInt({ min: 1 }).withMessage('El ID del diseñador debe ser un número positivo'),

    body('tareas')
        .isArray({ min: 1 }).withMessage('Debe incluir al menos una tarea'),

    body('tareas.*.local')
        .trim()
        .notEmpty().withMessage('El nombre del local es requerido'),

    body('tareas.*.tipo')
        .trim()
        .notEmpty().withMessage('El tipo de afiche es requerido'),

    body('tareas.*.cantidad')
        .isInt({ min: 1 }).withMessage('La cantidad debe ser un número positivo'),

    handleValidationErrors
];

// Validaciones para subir diseño
const validateDiseno = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID de tarea inválido'),

    body('url_diseno')
        .trim()
        .notEmpty().withMessage('La URL del diseño es requerida')
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
        .isBoolean().withMessage('El campo aprobado debe ser true o false'),

    handleValidationErrors
];

// Validaciones para actualizar logística
const validateLogistica = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID de tarea inválido'),

    body('estado_logistica')
        .isIn(['en_bodega', 'en_preparacion', 'en_transito', 'recibido', 'instalado'])
        .withMessage('Estado de logística inválido'),

    handleValidationErrors
];

// Validaciones para implementación
const validateImplementacion = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID de tarea inválido'),

    body('foto_url')
        .trim()
        .notEmpty().withMessage('La URL de la foto es requerida')
        .custom((value) => {
            // Aceptar URLs válidas (http o https)
            if (value.startsWith('http://') || value.startsWith('https://')) {
                return true;
            }
            throw new Error('La URL debe comenzar con http:// o https://');
        }),

    body('gps')
        .trim()
        .notEmpty().withMessage('Las coordenadas GPS son requeridas')
        .matches(/^-?\d+\.?\d*, ?-?\d+\.?\d*$/).withMessage('Formato de GPS inválido (debe ser: lat, lng)'),

    handleValidationErrors
];

// Validaciones para VoBo de implementación
const validateVoBoImplementacion = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID de tarea inválido'),

    body('aprobado')
        .isBoolean().withMessage('El campo aprobado debe ser true o false'),

    handleValidationErrors
];

module.exports = {
    validateCampana,
    validateDiseno,
    validateVoBo,
    validateLogistica,
    validateImplementacion,
    validateVoBoImplementacion
};
