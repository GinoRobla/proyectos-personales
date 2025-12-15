import { body, param } from 'express-validator';

/**
 * Validador para crear un servicio
 */
export const validarCrearServicio = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre del servicio es requerido')
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),

  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La descripción no puede superar los 500 caracteres'),

  body('precioBase')
    .notEmpty().withMessage('El precio es requerido')
    .isFloat({ min: 0, max: 1000000 }).withMessage('El precio debe ser un número positivo válido')
];

/**
 * Validador para actualizar un servicio
 */
export const validarActualizarServicio = [
  param('id')
    .isMongoId().withMessage('ID de servicio inválido'),

  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),

  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La descripción no puede superar los 500 caracteres'),

  body('precioBase')
    .optional()
    .isFloat({ min: 0, max: 1000000 }).withMessage('El precio debe ser un número positivo válido'),

  body('activo')
    .optional()
    .isBoolean().withMessage('El campo activo debe ser verdadero o falso')
];

/**
 * Validador para obtener o eliminar un servicio por ID
 */
export const validarServicioPorId = [
  param('id')
    .isMongoId().withMessage('ID de servicio inválido')
];
