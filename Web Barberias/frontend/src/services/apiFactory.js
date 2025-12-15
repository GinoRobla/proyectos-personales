/**
 * API Factory
 * Factory para crear servicios REST con métodos CRUD estándar
 * Elimina código duplicado entre servicios
 */

import api from './api';

/**
 * Crea un servicio REST con operaciones CRUD estándar
 * @param {string} endpoint - Endpoint base (ej: 'servicios', 'barberos')
 * @returns {Object} Objeto con métodos CRUD
 */
export const createRestService = (endpoint) => {
  return {
    /**
     * Obtener todos los recursos
     * @param {Object} params - Query params opcionales
     * @returns {Promise<Object>} Response con data
     */
    getAll: async (params = {}) => {
      const response = await api.get(`/${endpoint}`, { params });
      return response.data;
    },

    /**
     * Obtener un recurso por ID
     * @param {string} id - ID del recurso
     * @returns {Promise<Object>} Response con data
     */
    getById: async (id) => {
      const response = await api.get(`/${endpoint}/${id}`);
      return response.data;
    },

    /**
     * Crear un nuevo recurso
     * @param {Object} data - Datos del recurso
     * @returns {Promise<Object>} Response con data creada
     */
    create: async (data) => {
      const response = await api.post(`/${endpoint}`, data);
      return response.data;
    },

    /**
     * Actualizar un recurso existente
     * @param {string} id - ID del recurso
     * @param {Object} data - Datos actualizados
     * @returns {Promise<Object>} Response con data actualizada
     */
    update: async (id, data) => {
      const response = await api.put(`/${endpoint}/${id}`, data);
      return response.data;
    },

    /**
     * Eliminar un recurso
     * @param {string} id - ID del recurso
     * @returns {Promise<Object>} Response de confirmación
     */
    delete: async (id) => {
      const response = await api.delete(`/${endpoint}/${id}`);
      return response.data;
    },
  };
};

/**
 * Extiende un servicio REST con métodos adicionales
 * @param {string} endpoint - Endpoint base
 * @param {Object} customMethods - Métodos personalizados adicionales
 * @returns {Object} Servicio con métodos CRUD + custom
 */
export const createExtendedService = (endpoint, customMethods = {}) => {
  const baseService = createRestService(endpoint);
  return {
    ...baseService,
    ...customMethods,
  };
};

export default {
  createRestService,
  createExtendedService,
};
