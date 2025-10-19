// Importa la instancia de 'api' (axios)
import api from './api';

/**
 * Este objeto contiene todas las funciones para
 * "hablar" con los endpoints de /turnos en el backend.
 */
export const turnoService = {
  
  // Obtiene todos los turnos con filtros (Admin)
  obtenerTodos: async (parametros = {}) => {
    // Llama a: GET /turnos (con params: ?pagina=1&estado=...)
    const respuesta = await api.get('/turnos', { params: parametros });
    return respuesta.data;
  },

  // Obtiene los turnos del usuario logueado (cliente o barbero)
  obtenerMisTurnos: async (parametros = {}) => {
    // Llama a: GET /turnos/mis-turnos
    const respuesta = await api.get('/turnos/mis-turnos', { params: parametros });
    return respuesta.data;
  },

  // Obtiene un turno específico por su ID
  obtenerTurnoPorId: async (idTurno) => {
    // Llama a: GET /turnos/ID_DEL_TURNO
    const respuesta = await api.get(`/turnos/${idTurno}`);
    return respuesta.data;
  },

  // Crea una nueva reserva
  crearTurno: async (datosTurno) => {
    // Llama a: POST /turnos
    const respuesta = await api.post('/turnos', datosTurno);
    return respuesta.data;
  },

  // Actualiza un turno completo (fecha, hora, barbero, etc.)
  actualizarTurno: async (idTurno, datosActualizados) => {
    // Llama a: PUT /turnos/ID_DEL_TURNO
    const respuesta = await api.put(`/turnos/${idTurno}`, datosActualizados);
    return respuesta.data;
  },

  // Actualiza *solo* el estado de un turno (ej: 'completado')
  actualizarEstado: async (idTurno, nuevoEstado) => {
    // Llama a: PATCH /turnos/ID_DEL_TURNO/estado
    const respuesta = await api.patch(`/turnos/${idTurno}/estado`, {
      estado: nuevoEstado,
    });
    return respuesta.data;
  },

  // Marca un turno como 'cancelado'
  cancelarTurno: async (idTurno) => {
    // Llama a: PATCH /turnos/ID_DEL_TURNO/cancelar
    const respuesta = await api.patch(`/turnos/${idTurno}/cancelar`);
    return respuesta.data;
  },

  // Consulta los horarios disponibles para una fecha y servicio
  obtenerHorariosDisponibles: async (parametros = {}) => {
    // Llama a: GET /turnos/horarios-disponibles
    const respuesta = await api.get('/turnos/horarios-disponibles', {
      params: parametros,
    });
    return respuesta.data;
  },
};