// Importa la instancia de 'api' (axios)
import api from './api';

/**
 * Servicio para gestión de disponibilidad
 * Incluye horarios generales, por barbero, bloqueos y slots disponibles
 */
export const disponibilidadService = {

  // ========== DISPONIBILIDAD GENERAL ==========

  // Obtiene todos los horarios generales de la barbería
  obtenerDisponibilidadGeneral: async () => {
    const respuesta = await api.get('/disponibilidad/general');
    return respuesta.data;
  },

  // Crea o actualiza un horario general para un día de la semana
  crearOActualizarDisponibilidadGeneral: async (datos) => {
    const respuesta = await api.post('/disponibilidad/general', datos);
    return respuesta.data;
  },

  // Elimina el horario general de un día específico
  eliminarDisponibilidadGeneral: async (diaSemana) => {
    const respuesta = await api.delete(`/disponibilidad/general/${diaSemana}`);
    return respuesta.data;
  },

  // ========== DISPONIBILIDAD POR BARBERO ==========

  // Obtiene los horarios de un barbero específico
  obtenerDisponibilidadBarbero: async (barberoId) => {
    const respuesta = await api.get(`/disponibilidad/barbero/${barberoId}`);
    return respuesta.data;
  },

  // Crea o actualiza el horario de un barbero para un día
  crearOActualizarDisponibilidadBarbero: async (datos) => {
    const respuesta = await api.post('/disponibilidad/barbero', datos);
    return respuesta.data;
  },

  // Elimina el horario de un barbero para un día específico
  eliminarDisponibilidadBarbero: async (barberoId, diaSemana) => {
    const respuesta = await api.delete(`/disponibilidad/barbero/${barberoId}/${diaSemana}`);
    return respuesta.data;
  },

  // ========== BLOQUEOS ==========

  // Obtiene todos los bloqueos activos con filtros opcionales
  obtenerBloqueos: async (parametros = {}) => {
    const respuesta = await api.get('/disponibilidad/bloqueos', { params: parametros });
    return respuesta.data;
  },

  // Crea un nuevo bloqueo (vacaciones, feriado, etc.)
  crearBloqueo: async (datos) => {
    const respuesta = await api.post('/disponibilidad/bloqueo', datos);
    return respuesta.data;
  },

  // Actualiza un bloqueo existente
  actualizarBloqueo: async (bloqueoId, datos) => {
    const respuesta = await api.put(`/disponibilidad/bloqueo/${bloqueoId}`, datos);
    return respuesta.data;
  },

  // Elimina (desactiva) un bloqueo
  eliminarBloqueo: async (bloqueoId) => {
    const respuesta = await api.delete(`/disponibilidad/bloqueo/${bloqueoId}`);
    return respuesta.data;
  },

  // ========== CÁLCULO DE SLOTS DISPONIBLES ==========

  // Calcula los slots disponibles para una fecha específica
  obtenerSlotsDisponibles: async (parametros = {}) => {
    const respuesta = await api.get('/disponibilidad/slots-disponibles', { params: parametros });
    return respuesta.data;
  },
};

export default disponibilidadService;
