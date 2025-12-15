/**
 * Middleware asyncHandler
 * Wrapper para funciones async de controladores que elimina la necesidad de try-catch
 *
 * Uso:
 * export const metodo = asyncHandler(async (req, res) => {
 *   const resultado = await service.metodo();
 *   res.json({ success: true, data: resultado });
 * });
 */

import { enviarError } from '../utils/errorHandler.js';

/**
 * Envuelve funciones async de controladores y captura errores automáticamente
 * @param {Function} fn - Función async del controlador
 * @returns {Function} - Función wrapped con manejo de errores
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Delegar al error handler centralizado
      enviarError(res, error);
    });
  };
};

export default asyncHandler;
