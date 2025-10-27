// Importa la instancia de 'api' (axios)
import api from './api';

/**
 * Este objeto contiene todas las funciones para
 * "hablar" con los endpoints de /barberos en el backend.
 */
export const barberoService = {

  // Obtiene la lista de barberos (opcionalmente filtra por activos)
  obtenerBarberos: async (soloActivos) => {
    // 1. Prepara los parámetros de la URL (ej: /barberos?activo=true)
    const params = {};
    if (soloActivos !== undefined) {
      params.activo = soloActivos;
    }

    // 2. Llama a: GET /barberos, pasando los parámetros
    const respuesta = await api.get('/barberos', { params });
    return respuesta.data;
  },

  // Busca barberos libres en una fecha y hora específicas
  obtenerBarberosDisponibles: async (fecha, hora) => {
    // 1. Prepara los parámetros (ej: /barberos/disponibles?fecha=...&hora=...)
    const params = {};
    if (fecha) params.fecha = fecha;
    if (hora) params.hora = hora;

    // 2. Llama a: GET /barberos/disponibles
    const respuesta = await api.get('/barberos/disponibles', { params });
    return respuesta.data;
  },

  // Obtiene la información de un solo barbero por su ID
  obtenerBarberoPorId: async (idBarbero) => {
    // Llama a: GET /barberos/ID_DEL_BARBERO
    const respuesta = await api.get(`/barberos/${idBarbero}`);
    return respuesta.data;
  },

  // Crea un nuevo barbero (solo Admin)
  crearBarbero: async (datosBarbero) => {
    // Llama a: POST /barberos
    const respuesta = await api.post('/barberos', datosBarbero);
    return respuesta.data;
  },

  // Actualiza un barbero existente (solo Admin)
  actualizarBarbero: async (idBarbero, datosActualizados) => {
    // Llama a: PUT /barberos/ID_DEL_BARBERO
    const respuesta = await api.put(`/barberos/${idBarbero}`, datosActualizados);
    return respuesta.data;
  },

  // Elimina (desactiva) un barbero (solo Admin)
  eliminarBarbero: async (idBarbero) => {
    // Llama a: DELETE /barberos/ID_DEL_BARBERO
    const respuesta = await api.delete(`/barberos/${idBarbero}`);
    return respuesta.data;
  },
};

export default barberoService;