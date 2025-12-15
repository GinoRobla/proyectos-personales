/**
 * turnoValidacion - validacion
 * Módulo extraído de turnoService.js para mejor organización
 */

import Turno from '../../models/Turno.js';
import { _crearRangoFechaDia } from './turnoService.js';

/**
 * -------------------------------------------------------------------
 * FUNCIÓN HELPER (USO INTERNO)
 * -------------------------------------------------------------------
 */

/**
 * Valida si un horario está disponible para un turno
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {string} hora - Hora del turno
 * @param {string} barberoId - ID del barbero (opcional)
 */
export const validarDisponibilidad = async (fecha, hora, barberoId = null) => {
  try {
    // 1. [FIX] Busca turnos ocupados usando el rango UTC del día
    const rangoDia = _crearRangoFechaDia(fecha);
    
    const query = {
      fecha: rangoDia,
      hora,
      estado: 'reservado',
    };

    if (barberoId) {
      query.barbero = barberoId;
    }

    // 2. Busca si existe un turno
    const turnoYaExiste = await Turno.findOne(query);

    // 3. Devuelve true si NO existe (está disponible)
    return !turnoYaExiste;
  } catch (error) {
    throw new Error(`Error al validar disponibilidad: ${error.message}`);
  }
};


export default {
  validarDisponibilidad,
};
