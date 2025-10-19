// Importa la instancia de 'api' (axios) que configuramos en el paso anterior
import api from './api';

/**
 * Este objeto contiene todas las funciones para
 * "hablar" con los endpoints de /auth en el backend.
 */
export const authService = {
  
  // Envía datos para crear una nueva cuenta de usuario
  registro: async (datosUsuario) => {
    // Llama a: POST /auth/registro
    const respuesta = await api.post('/auth/registro', datosUsuario);
    // Devuelve los datos de la respuesta (ej: { token, usuario })
    return respuesta.data;
  },

  // Envía email y password para iniciar sesión
  login: async (correoElectronico, contrasena) => {
    // Llama a: POST /auth/login
    const respuesta = await api.post('/auth/login', {
      email: correoElectronico,
      password: contrasena,
    });
    // Devuelve { token, usuario }
    return respuesta.data;
  },

  // Verifica si el token (enviado automáticamente por el interceptor) sigue siendo válido
  verificarToken: async () => {
    // Llama a: GET /auth/verificar
    const respuesta = await api.get('/auth/verificar');
    // Devuelve los datos del usuario si el token es válido
    return respuesta.data;
  },

  // Obtiene los datos del perfil del usuario logueado
  obtenerPerfil: async () => {
    // Llama a: GET /auth/perfil
    const respuesta = await api.get('/auth/perfil');
    // Devuelve los datos del perfil
    return respuesta.data;
  },

  // Actualiza el perfil del usuario logueado (nombre, apellido, tel)
  actualizarPerfil: async (datosActualizados) => {
    // Llama a: PUT /auth/perfil
    const respuesta = await api.put('/auth/perfil', datosActualizados);
    // Devuelve el perfil actualizado
    return respuesta.data;
  },

  // Envía la contraseña actual y la nueva para cambiarla
  cambiarPassword: async (contrasenaActual, contrasenaNueva) => {
    // Llama a: PUT /auth/cambiar-password
    const respuesta = await api.put('/auth/cambiar-password', {
      passwordActual: contrasenaActual,
      passwordNuevo: contrasenaNueva,
    });
    // Devuelve un mensaje de éxito
    return respuesta.data;
  },
};