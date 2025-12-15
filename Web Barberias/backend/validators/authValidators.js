import { body } from 'express-validator';

/**
 * Validador para el registro de usuarios
 */
export const validarRegistro = [
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

  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener mínimo 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),

  body('telefono')
    .trim()
    .notEmpty().withMessage('El teléfono es requerido')
    .isLength({ min: 10, max: 20 }).withMessage('El teléfono debe tener entre 10 y 20 caracteres')
];

/**
 * Validador para el login
 */
export const validarLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('El email no es válido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isString().withMessage('La contraseña debe ser texto')
];

/**
 * Validador para actualizar perfil
 */
export const validarActualizarPerfil = [
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

  body('telefono')
    .optional()
    .trim()
    .isLength({ min: 10, max: 20 }).withMessage('El teléfono debe tener entre 10 y 20 caracteres'),

  body('passwordActual')
    .optional()
    .isString().withMessage('La contraseña actual debe ser texto'),

  body('passwordNueva')
    .optional()
    .isLength({ min: 8 }).withMessage('La contraseña nueva debe tener mínimo 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número')
];
