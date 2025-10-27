/**
 * ============================================================================
 * UTILS: MANEJO DE FECHAS
 * ============================================================================
 *
 * Funciones centralizadas para formatear y manipular fechas en toda la aplicación.
 *
 */

/**
 * Formatea una fecha a un formato largo y legible.
 * @param {string | Date} fecha - La fecha a formatear.
 * @returns {string} - Fecha formateada (ej: "viernes, 17 de octubre de 2025").
 */
export const formatearFechaLarga = (fecha) => {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC', // Asegura consistencia independientemente del navegador
  };
  return new Date(fecha).toLocaleDateString('es-AR', options);
};

/**
 * Formatea una fecha a un formato corto.
 * @param {string | Date} fecha - La fecha a formatear.
 * @returns {string} - Fecha formateada (ej: "17/10/2025").
 */
export const formatearFechaCorta = (fecha) => {
  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  };
  return new Date(fecha).toLocaleDateString('es-AR', options);
};

/**
 * Formatea una hora (string HH:mm) para mostrarla sin segundos.
 * @param {string} hora - La hora a formatear (ej: "09:45").
 * @returns {string} - Hora formateada (ej: "09:45 hs").
 */
export const formatearHora = (hora) => {
  if (!hora || typeof hora !== 'string' || !hora.includes(':')) {
    return '';
  }
  return `${hora.substring(0, 5)} hs`;
};

/**
 * Obtiene la fecha en formato YYYY-MM-DD usando zona horaria local del navegador.
 * @param {Date} [date=new Date()] - La fecha a convertir.
 * @returns {string} - Fecha en formato YYYY-MM-DD.
 */
export const obtenerFechaLocalISO = (date = new Date()) => {
  // Usar zona horaria local del navegador
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};