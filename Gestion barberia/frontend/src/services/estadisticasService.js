// Importa la instancia de 'api' (axios)
import api from './api';

/**
 * Este objeto contiene todas las funciones para
 * "hablar" con los endpoints de /estadisticas en el backend.
 *
 * NOTA: Los 'try...catch' se han quitado. Los errores (ej: 404, 500)
 * son manejados por el componente que llama a estas funciones.
 * El error 401 (token vencido) ya lo maneja 'api.js'.
 */
export const estadisticasService = {

  // Obtiene las estadísticas generales del negocio
  obtenerGenerales: async () => {
    // Llama a: GET /estadisticas/generales
    const respuesta = await api.get('/estadisticas/generales');
    return respuesta.data;
  },

  // Obtiene las estadísticas de un barbero específico
  obtenerPorBarbero: async (idBarbero) => {
    // Llama a: GET /estadisticas/barbero/ID_DEL_BARBERO
    const respuesta = await api.get(`/estadisticas/barbero/${idBarbero}`);
    return respuesta.data;
  },

  // Obtiene estadísticas filtradas por un rango de fechas
  obtenerPorRango: async (fechaInicio, fechaFin) => {
    // Llama a: GET /estadisticas/rango
    // Axios añade 'fechaInicio' y 'fechaFin' como parámetros query
    // (ej: ?fechaInicio=...&fechaFin=...)
    const respuesta = await api.get('/estadisticas/rango', {
      params: { fechaInicio, fechaFin },
    });
    return respuesta.data;
  },

  // Obtiene las estadísticas para el panel de Admin (opcionalmente por mes/año)
  obtenerAdmin: async (mes, anio) => {
    // Llama a: GET /estadisticas/admin
    // Axios ignora 'mes' o 'anio' si son undefined
    const respuesta = await api.get('/estadisticas/admin', {
      params: { mes, anio },
    });
    return respuesta.data;
  },

  // Obtiene las estadísticas del panel del Barbero (logueado)
  obtenerMisEstadisticas: async (mes, anio, periodo) => {
    // Llama a: GET /estadisticas/mis-estadisticas
    const respuesta = await api.get('/estadisticas/mis-estadisticas', {
      params: { mes, anio, periodo },
    });
    return respuesta.data;
  },
};