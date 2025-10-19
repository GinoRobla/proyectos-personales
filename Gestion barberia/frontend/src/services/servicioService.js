// Importa la instancia de 'api' (axios)
import api from './api';

/**
 * Este objeto contiene todas las funciones para
 * "hablar" con los endpoints de /servicios en el backend.
 */
export const servicioService = {

  // Obtiene la lista de servicios (por defecto, solo los activos)
  obtenerServicios: async (soloActivos = true) => {
    // Llama a: GET /servicios?activo=true (o false)
    const respuesta = await api.get('/servicios', {
      params: { activo: soloActivos },
    });
    return respuesta.data;
  },

  // Obtiene la información de un solo servicio por su ID
  obtenerServicioPorId: async (idServicio) => {
    // Llama a: GET /servicios/ID_DEL_SERVICIO
    const respuesta = await api.get(`/servicios/${idServicio}`);
    return respuesta.data;
  },

  // Crea un nuevo servicio (solo Admin)
  crearServicio: async (datosServicio) => {
    // Llama a: POST /servicios
    const respuesta = await api.post('/servicios', datosServicio);
    return respuesta.data;
  },

  // Actualiza un servicio existente (solo Admin)
  actualizarServicio: async (idServicio, datosActualizados) => {
    // Llama a: PUT /servicios/ID_DEL_SERVICIO
    const respuesta = await api.put(`/servicios/${idServicio}`, datosActualizados);
    return respuesta.data;
  },

  // Elimina (desactiva) un servicio (solo Admin)
  eliminarServicio: async (idServicio) => {
    // Llama a: DELETE /servicios/ID_DEL_SERVICIO
    const respuesta = await api.delete(`/servicios/${idServicio}`);
    return respuesta.data;
  },
};