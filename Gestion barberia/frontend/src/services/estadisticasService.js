/**
 * ============================================================================
 * SERVICIO: ESTADÍSTICAS Y REPORTES
 * ============================================================================
 *
 * Maneja todas las operaciones relacionadas con estadísticas y reportes
 * de la barbería.
 *
 * RESPONSABILIDADES:
 * - Obtener estadísticas generales del negocio
 * - Obtener estadísticas por barbero
 * - Obtener estadísticas por rango de fechas
 * - Obtener estadísticas para el panel de administración
 *
 * ENDPOINTS UTILIZADOS:
 * - GET /estadisticas/generales - Estadísticas generales
 * - GET /estadisticas/barbero/:id - Estadísticas de un barbero
 * - GET /estadisticas/rango - Estadísticas por rango de fechas
 * - GET /estadisticas/admin - Estadísticas del panel admin
 */

import api from './api';

// ============================================================================
// DEFINICIÓN DEL SERVICIO
// ============================================================================

const estadisticasService = {
  // ==========================================================================
  // OBTENER ESTADÍSTICAS GENERALES
  // ==========================================================================
  /**
   * OBTENER ESTADÍSTICAS GENERALES
   *
   * Obtiene las estadísticas generales del negocio:
   * - Total de turnos
   * - Ingresos totales
   * - Turnos por estado
   * - Servicios más solicitados
   *
   * @returns {Promise<Object>} Estadísticas generales
   */
  obtenerGenerales: async () => {
    try {
      const respuesta = await api.get('/estadisticas/generales');
      return respuesta.data;
    } catch (error) {
      console.error('Error al obtener estadísticas generales:', error);
      throw error;
    }
  },

  // ==========================================================================
  // OBTENER ESTADÍSTICAS POR BARBERO
  // ==========================================================================
  /**
   * OBTENER ESTADÍSTICAS POR BARBERO
   *
   * Obtiene las estadísticas de rendimiento de un barbero específico:
   * - Total de turnos atendidos
   * - Ingresos generados
   * - Servicios realizados
   * - Calificación promedio (si existe)
   *
   * @param {string} idBarbero - ID del barbero
   * @returns {Promise<Object>} Estadísticas del barbero
   */
  obtenerPorBarbero: async (idBarbero) => {
    try {
      const respuesta = await api.get(`/estadisticas/barbero/${idBarbero}`);
      return respuesta.data;
    } catch (error) {
      console.error('Error al obtener estadísticas del barbero:', error);
      throw error;
    }
  },

  // ==========================================================================
  // OBTENER ESTADÍSTICAS POR RANGO DE FECHAS
  // ==========================================================================
  /**
   * OBTENER ESTADÍSTICAS POR RANGO
   *
   * Obtiene estadísticas filtradas por un rango de fechas específico.
   * Útil para reportes mensuales, trimestrales, etc.
   *
   * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
   * @param {string} fechaFin - Fecha de fin (YYYY-MM-DD)
   * @returns {Promise<Object>} Estadísticas del período
   */
  obtenerPorRango: async (fechaInicio, fechaFin) => {
    try {
      const respuesta = await api.get('/estadisticas/rango', {
        params: { fechaInicio, fechaFin },
      });
      return respuesta.data;
    } catch (error) {
      console.error('Error al obtener estadísticas por rango:', error);
      throw error;
    }
  },

  // ==========================================================================
  // OBTENER ESTADÍSTICAS PARA PANEL ADMIN
  // ==========================================================================
  /**
   * OBTENER ESTADÍSTICAS ADMIN
   *
   * Obtiene estadísticas completas para el panel de administración.
   * Incluye información detallada de turnos, ingresos, barberos, etc.
   *
   * @param {number} mes - Mes a consultar (1-12) - opcional
   * @param {number} anio - Año a consultar - opcional
   * @returns {Promise<Object>} Estadísticas del panel admin
   */
  obtenerAdmin: async (mes, anio) => {
    try {
      // Preparar parámetros opcionales
      const parametros = {};

      if (mes) {
        parametros.mes = mes;
      }

      if (anio) {
        parametros.anio = anio;
      }

      const respuesta = await api.get('/estadisticas/admin', {
        params: parametros,
      });
      return respuesta.data;
    } catch (error) {
      console.error('Error al obtener estadísticas del admin:', error);
      throw error;
    }
  },

  // ==========================================================================
  // OBTENER ESTADÍSTICAS DEL BARBERO AUTENTICADO
  // ==========================================================================
  /**
   * OBTENER MIS ESTADÍSTICAS (BARBERO)
   *
   * Obtiene las estadísticas personales del barbero autenticado:
   * - Ingresos generados (semana/mes)
   * - Turnos completados
   * - Evolución de ingresos (por día o por semana)
   * - Objetivo mensual cumplido (%)
   *
   * @param {number} mes - Mes a consultar (1-12) - opcional
   * @param {number} anio - Año a consultar - opcional
   * @param {string} periodo - 'semana' o 'mes' - opcional
   * @returns {Promise<Object>} Estadísticas del barbero
   */
  obtenerMisEstadisticas: async (mes, anio, periodo) => {
    try {
      // Preparar parámetros opcionales
      const parametros = {};

      if (mes) {
        parametros.mes = mes;
      }

      if (anio) {
        parametros.anio = anio;
      }

      if (periodo) {
        parametros.periodo = periodo;
      }

      const respuesta = await api.get('/estadisticas/mis-estadisticas', {
        params: parametros,
      });
      return respuesta.data;
    } catch (error) {
      console.error('Error al obtener mis estadísticas:', error);
      throw error;
    }
  },
};

// ============================================================================
// EXPORTACIÓN
// ============================================================================

export default estadisticasService;
