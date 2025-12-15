/**
 * Utilidad para manejar errores de forma consistente en los controladores.
 * Determina el código HTTP apropiado según el mensaje de error.
 */

/**
 * Determina el código de estado HTTP basado en el mensaje de error
 * @param {Error} error - El objeto de error
 * @returns {number} - El código HTTP apropiado
 */
export const determinarCodigoHTTP = (error) => {
  const mensaje = error.message || '';

  // Errores 400 - Bad Request (errores de validación del cliente)
  if (
    mensaje.includes('ya está en uso') ||
    mensaje.includes('ya existe') ||
    mensaje.includes('Faltan campos obligatorios') ||
    mensaje.includes('es obligatorio') ||
    mensaje.includes('requerido') ||
    mensaje.includes('inválido') ||
    mensaje.includes('formato') ||
    mensaje.includes('debe tener') ||
    mensaje.includes('no puede exceder') ||
    mensaje.includes('mínimo') ||
    mensaje.includes('máximo')
  ) {
    return 400;
  }

  // Errores 401 - Unauthorized
  if (
    mensaje.includes('no autorizado') ||
    mensaje.includes('credenciales inválidas') ||
    mensaje.includes('token') ||
    mensaje.includes('sesión expirada')
  ) {
    return 401;
  }

  // Errores 403 - Forbidden
  if (
    mensaje.includes('no tiene permisos') ||
    mensaje.includes('acceso denegado') ||
    mensaje.includes('permiso denegado')
  ) {
    return 403;
  }

  // Errores 404 - Not Found
  if (
    mensaje.includes('no encontrado') ||
    mensaje.includes('no existe')
  ) {
    return 404;
  }

  // Errores 409 - Conflict
  if (
    mensaje.includes('conflicto') ||
    mensaje.includes('duplicado')
  ) {
    return 409;
  }

  // Por defecto 500 - Internal Server Error
  return 500;
};

/**
 * Envía una respuesta de error consistente
 * @param {Object} res - Objeto response de Express
 * @param {Error} error - El objeto de error
 * @param {string} mensajePorDefecto - Mensaje por defecto si error.message está vacío
 */
export const enviarError = (res, error, mensajePorDefecto = 'Error en el servidor') => {
  const statusCode = determinarCodigoHTTP(error);
  const mensaje = error.message || mensajePorDefecto;

  console.error(`[ERROR ${statusCode}]:`, mensaje);

  res.status(statusCode).json({
    success: false,
    message: mensaje,
  });
};

export default {
  determinarCodigoHTTP,
  enviarError,
};
