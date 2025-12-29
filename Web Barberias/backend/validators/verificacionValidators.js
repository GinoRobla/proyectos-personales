import { body } from 'express-validator';

/**
 * Validador para enviar código de verificación
 */
export const validarEnviarCodigo = [
  body('telefono')
    .notEmpty()
    .withMessage('El teléfono es obligatorio')
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('Formato de teléfono inválido (debe contener entre 10 y 15 dígitos)')
];

/**
 * Validador para verificar código
 */
export const validarVerificarCodigo = [
  body('telefono')
    .notEmpty()
    .withMessage('El teléfono es obligatorio'),

  body('codigo')
    .notEmpty()
    .withMessage('El código es obligatorio')
    .isLength({ min: 6, max: 6 })
    .withMessage('El código debe tener 6 dígitos')
    .isNumeric()
    .withMessage('El código solo debe contener números')
];
