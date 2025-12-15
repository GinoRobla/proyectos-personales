/**
 * Clases de Error personalizadas
 * Proporciona errores tipados con códigos HTTP apropiados
 */

/**
 * Error base personalizado
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error 400 - Bad Request
 * Para validaciones fallidas o datos inválidos
 */
export class ValidationError extends AppError {
  constructor(message = 'Datos de entrada inválidos') {
    super(message, 400);
  }
}

/**
 * Error 401 - Unauthorized
 * Para problemas de autenticación
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado. Token inválido o expirado') {
    super(message, 401);
  }
}

/**
 * Error 403 - Forbidden
 * Para problemas de permisos/autorización
 */
export class ForbiddenError extends AppError {
  constructor(message = 'No tienes permisos para realizar esta acción') {
    super(message, 403);
  }
}

/**
 * Error 404 - Not Found
 * Para recursos no encontrados
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado`, 404);
    this.resource = resource;
  }
}

/**
 * Error 409 - Conflict
 * Para conflictos de estado (ej: email ya existe)
 */
export class ConflictError extends AppError {
  constructor(message = 'El recurso ya existe o hay un conflicto') {
    super(message, 409);
  }
}

/**
 * Error 500 - Internal Server Error
 * Para errores inesperados del servidor
 */
export class InternalError extends AppError {
  constructor(message = 'Error interno del servidor') {
    super(message, 500);
  }
}

/**
 * Determina si un error es operacional (esperado) o un bug
 * @param {Error} error
 * @returns {boolean}
 */
export const isOperationalError = (error) => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

export default {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalError,
  isOperationalError,
};
