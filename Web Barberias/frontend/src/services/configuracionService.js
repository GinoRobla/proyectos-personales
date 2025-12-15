// Importa la instancia de 'api' (axios)
import api from './api';

/**
 * Servicio para gestión de configuración del negocio
 */
export const configuracionService = {

  // Obtiene la configuración actual del negocio
  obtenerConfiguracion: async () => {
    const respuesta = await api.get('/configuracion');
    return respuesta.data;
  },

  // Actualiza la configuración del negocio
  actualizarConfiguracion: async (datos) => {
    const respuesta = await api.put('/configuracion', datos);
    return respuesta.data;
  },

  // Agrega un día a la lista de bloqueados permanentemente
  agregarDiaBloqueado: async (diaSemana) => {
    const respuesta = await api.post('/configuracion/bloquear-dia', { diaSemana });
    return respuesta.data;
  },

  // Quita un día de la lista de bloqueados permanentemente
  quitarDiaBloqueado: async (diaSemana) => {
    const respuesta = await api.delete(`/configuracion/bloquear-dia/${diaSemana}`);
    return respuesta.data;
  },
};

export default configuracionService;
