import { body, param } from 'express-validator';

/**
 * Validador para crear un barbero
 */
export const validarCrearBarbero = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo puede contener letras'),

  body('apellido')
    .trim()
    .notEmpty().withMessage('El apellido es requerido')
    .isLength({ min: 2, max: 50 }).withMessage('El apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El apellido solo puede contener letras'),

  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('El email no es válido')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('El email es demasiado largo'),

  body('telefono')
    .trim()
    .notEmpty().withMessage('El teléfono es requerido')
    .isLength({ min: 10, max: 20 }).withMessage('El teléfono debe tener entre 10 y 20 caracteres'),

  body('objetivoMensual')
    .optional()
    .isInt({ min: 0, max: 100000 }).withMessage('El objetivo mensual debe ser un número positivo'),

  body('foto')
    .optional()
    .trim()
    .isURL().withMessage('La foto debe ser una URL válida')
];

/**
 * Validador para actualizar un barbero
 */
export const validarActualizarBarbero = [
  param('id')
    .isMongoId().withMessage('ID de barbero inválido'),

  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo puede contener letras'),

  body('apellido')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('El apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El apellido solo puede contener letras'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('El email no es válido')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('El email es demasiado largo'),

  body('telefono')
    .optional()
    .trim()
    .isLength({ min: 10, max: 20 }).withMessage('El teléfono debe tener entre 10 y 20 caracteres'),

  body('objetivoMensual')
    .optional()
    .isInt({ min: 0, max: 100000 }).withMessage('El objetivo mensual debe ser un número positivo'),

  body('foto')
    .optional()
    .trim()
    .isURL().withMessage('La foto debe ser una URL válida'),

  body('activo')
    .optional()
    .isBoolean().withMessage('El campo activo debe ser verdadero o falso')
];

/**
 * Validador para obtener o eliminar un barbero por ID
 */
export const validarBarberoPorId = [
  param('id')
    .isMongoId().withMessage('ID de barbero inválido')
];
