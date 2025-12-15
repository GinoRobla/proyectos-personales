import { body, param, query } from 'express-validator';

/**
 * Validador para crear un turno
 */
export const validarCrearTurno = [
  body('clienteData.nombre')
    .trim()
    .notEmpty().withMessage('El nombre del cliente es requerido')
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo puede contener letras'),

  body('clienteData.apellido')
    .trim()
    .notEmpty().withMessage('El apellido del cliente es requerido')
    .isLength({ min: 2, max: 50 }).withMessage('El apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El apellido solo puede contener letras'),

  body('clienteData.email')
    .trim()
    .notEmpty().withMessage('El email del cliente es requerido')
    .isEmail().withMessage('El email no es válido')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('El email es demasiado largo'),

  body('clienteData.telefono')
    .trim()
    .notEmpty().withMessage('El teléfono del cliente es requerido')
    .isLength({ min: 10, max: 20 }).withMessage('El teléfono debe tener entre 10 y 20 caracteres'),

  body('servicioId')
    .notEmpty().withMessage('El servicio es requerido')
    .isMongoId().withMessage('ID de servicio inválido'),

  body('barberoId')
    .optional()
    .isMongoId().withMessage('ID de barbero inválido'),

  body('fecha')
    .notEmpty().withMessage('La fecha es requerida')
    .isISO8601().withMessage('La fecha no es válida')
    .custom((value) => {
      // Parsear ambas fechas en la misma zona horaria local
      const [anio, mes, dia] = value.split('T')[0].split('-').map(Number);
      const fechaSeleccionada = new Date(anio, mes - 1, dia);

      const ahora = new Date();
      const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

      if (fechaSeleccionada < hoy) {
        throw new Error('La fecha no puede ser en el pasado');
      }
      return true;
    }),

  body('hora')
    .notEmpty().withMessage('La hora es requerida')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('La hora debe tener formato HH:MM (ej: 14:30)'),

  body('precio')
    .notEmpty().withMessage('El precio es requerido')
    .isFloat({ min: 0, max: 1000000 }).withMessage('El precio debe ser un número positivo válido')
];

/**
 * Validador para actualizar un turno
 */
export const validarActualizarTurno = [
  param('id')
    .isMongoId().withMessage('ID de turno inválido'),

  body('barberoId')
    .optional()
    .isMongoId().withMessage('ID de barbero inválido'),

  body('fecha')
    .optional()
    .isISO8601().withMessage('La fecha no es válida')
    .custom((value) => {
      // Parsear ambas fechas en la misma zona horaria local
      const [anio, mes, dia] = value.split('T')[0].split('-').map(Number);
      const fechaSeleccionada = new Date(anio, mes - 1, dia);

      const ahora = new Date();
      const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

      if (fechaSeleccionada < hoy) {
        throw new Error('La fecha no puede ser en el pasado');
      }
      return true;
    }),

  body('hora')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('La hora debe tener formato HH:MM (ej: 14:30)'),

  body('estado')
    .optional()
    .isIn(['reservado', 'completado', 'cancelado']).withMessage('Estado inválido')
];

/**
 * Validador para cancelar un turno
 */
export const validarCancelarTurno = [
  param('id')
    .isMongoId().withMessage('ID de turno inválido')
];

/**
 * Validador para obtener un turno por ID
 */
export const validarObtenerTurnoPorId = [
  param('id')
    .isMongoId().withMessage('ID de turno inválido')
];

/**
 * Validador para listar turnos con filtros
 */
export const validarListarTurnos = [
  query('estado')
    .optional()
    .isIn(['reservado', 'completado', 'cancelado']).withMessage('Estado inválido'),

  query('barberoId')
    .optional()
    .isMongoId().withMessage('ID de barbero inválido'),

  query('fecha')
    .optional()
    .isISO8601().withMessage('Fecha inválida'),

  query('desde')
    .optional()
    .isISO8601().withMessage('Fecha desde inválida'),

  query('hasta')
    .optional()
    .isISO8601().withMessage('Fecha hasta inválida')
    .custom((hasta, { req }) => {
      if (req.query.desde && hasta < req.query.desde) {
        throw new Error('La fecha hasta debe ser posterior a la fecha desde');
      }
      return true;
    }),

  query('pagina')
    .optional()
    .isInt({ min: 1 }).withMessage('La página debe ser un número entero mayor a 0'),

  query('limite')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100')
];

/**
 * Validador para obtener horarios disponibles
 */
export const validarHorariosDisponibles = [
  query('servicioId')
    .notEmpty().withMessage('El servicio es requerido')
    .isMongoId().withMessage('ID de servicio inválido'),

  query('fecha')
    .notEmpty().withMessage('La fecha es requerida')
    .isISO8601().withMessage('Fecha inválida')
    .custom((value) => {
      // Parsear ambas fechas en la misma zona horaria local
      const [anio, mes, dia] = value.split('-').map(Number);
      const fechaSeleccionada = new Date(anio, mes - 1, dia);

      const ahora = new Date();
      const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

      if (fechaSeleccionada < hoy) {
        throw new Error('La fecha no puede ser en el pasado');
      }
      return true;
    }),

  query('barberoId')
    .optional()
    .isMongoId().withMessage('ID de barbero inválido')
];
