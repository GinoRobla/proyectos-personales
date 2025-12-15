/**
 * ============================================================================
 * VALIDADORES
 * ============================================================================
 *
 * Funciones de validación para formularios.
 * Centralizar estas validaciones mejora la consistencia y facilita testing.
 */

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} - true si es válido
 */
export const validarEmail = (email) => {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Valida formato de URL
 * @param {string} url - URL a validar
 * @returns {boolean} - true si es válida
 */
export const validarURL = (url) => {
  if (!url || url.trim() === '') return true; // URLs vacías son válidas (campo opcional)

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Valida formato de teléfono argentino
 * @param {string} telefono - Teléfono a validar
 * @returns {boolean} - true si es válido
 */
export const validarTelefono = (telefono) => {
  if (!telefono) return false;

  // Quitar espacios, guiones y paréntesis
  const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');

  // Validar formato argentino: +54 9 área código (sin 0) + número
  // Ejemplos válidos: +5492914643232, 542914643232, 2914643232
  const regex = /^(\+?54)?9?\d{8,10}$/;
  return regex.test(telefonoLimpio);
};

/**
 * Valida que una hora sea válida (HH:mm)
 * @param {string} hora - Hora a validar
 * @returns {boolean} - true si es válida
 */
export const validarHora = (hora) => {
  if (!hora) return false;
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(hora);
};

/**
 * Valida que horaFin sea mayor que horaInicio
 * @param {string} horaInicio - Hora de inicio (HH:mm)
 * @param {string} horaFin - Hora de fin (HH:mm)
 * @returns {boolean} - true si horaFin > horaInicio
 */
export const validarRangoHoras = (horaInicio, horaFin) => {
  if (!validarHora(horaInicio) || !validarHora(horaFin)) return false;
  return horaFin > horaInicio;
};

/**
 * Valida que fechaFin sea mayor o igual que fechaInicio
 * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
 * @param {string} fechaFin - Fecha de fin (YYYY-MM-DD)
 * @returns {boolean} - true si fechaFin >= fechaInicio
 */
export const validarRangoFechas = (fechaInicio, fechaFin) => {
  if (!fechaInicio || !fechaFin) return false;
  return new Date(fechaFin) >= new Date(fechaInicio);
};

/**
 * Valida longitud máxima de un string
 * @param {string} texto - Texto a validar
 * @param {number} maxLength - Longitud máxima permitida
 * @returns {boolean} - true si cumple
 */
export const validarLongitud = (texto, maxLength) => {
  if (!texto) return true; // Vacío es válido
  return texto.length <= maxLength;
};
