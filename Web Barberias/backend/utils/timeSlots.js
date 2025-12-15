/**
 * ============================================================================
 * UTILIDADES PARA GENERACIÓN DE SLOTS DE TIEMPO
 * ============================================================================
 *
 * Funciones para generar y manipular slots de tiempo para turnos.
 */

/**
 * Genera slots de tiempo entre una hora de inicio y fin
 * @param {string} horaInicio - Hora de inicio en formato HH:mm (ej: "09:00")
 * @param {string} horaFin - Hora de fin en formato HH:mm (ej: "18:00")
 * @param {number} duracionMinutos - Duración de cada slot en minutos (ej: 45)
 * @returns {string[]} - Array de strings con los horarios (ej: ["09:00", "09:45", "10:30", ...])
 */
export const generarSlots = (horaInicio, horaFin, duracionMinutos) => {
  const slots = [];
  let [horaActual, minutoActual] = horaInicio.split(':').map(Number);

  while (true) {
    const horaFormateada = `${String(horaActual).padStart(2, '0')}:${String(minutoActual).padStart(2, '0')}`;

    if (horaFormateada >= horaFin) break;

    slots.push(horaFormateada);

    // Avanzar según la duración
    minutoActual += duracionMinutos;
    if (minutoActual >= 60) {
      horaActual += Math.floor(minutoActual / 60);
      minutoActual = minutoActual % 60;
    }
  }

  return slots;
};

/**
 * Verifica si una hora específica está dentro de un rango
 * @param {string} hora - Hora a verificar (HH:mm)
 * @param {string} horaInicio - Hora de inicio del rango (HH:mm)
 * @param {string} horaFin - Hora de fin del rango (HH:mm)
 * @returns {boolean} - true si la hora está en el rango
 */
export const estaEnRango = (hora, horaInicio, horaFin) => {
  return hora >= horaInicio && hora < horaFin;
};

/**
 * Convierte una hora en formato HH:mm a minutos desde medianoche
 * @param {string} hora - Hora en formato HH:mm
 * @returns {number} - Minutos desde medianoche
 */
export const horaAMinutos = (hora) => {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
};

/**
 * Convierte minutos desde medianoche a formato HH:mm
 * @param {number} minutos - Minutos desde medianoche
 * @returns {string} - Hora en formato HH:mm
 */
export const minutosAHora = (minutos) => {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

export default {
  generarSlots,
  estaEnRango,
  horaAMinutos,
  minutosAHora,
};
