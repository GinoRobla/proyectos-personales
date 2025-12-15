/**
 * Servicio de verificación de teléfono - Frontend
 */

import apiClient from './api';

/**
 * Enviar código de verificación
 */
export const enviarCodigoVerificacion = async (telefono) => {
  const response = await apiClient.post('/verificacion/enviar-codigo', { telefono });
  return response.data;
};

/**
 * Verificar código ingresado
 */
export const verificarCodigo = async (telefono, codigo) => {
  const response = await apiClient.post('/verificacion/verificar-codigo', { telefono, codigo });
  return response.data;
};

/**
 * Obtener estado de verificación de un teléfono
 */
export const obtenerEstadoVerificacion = async (telefono) => {
  const response = await apiClient.get(`/verificacion/estado/${telefono}`);
  return response.data;
};

/**
 * Enviar código autenticado (para usuarios logueados)
 */
export const enviarCodigoAutenticado = async (telefono) => {
  const response = await apiClient.post('/verificacion/enviar-codigo-autenticado', { telefono });
  return response.data;
};

/**
 * Verificar código autenticado (para usuarios logueados)
 */
export const verificarCodigoAutenticado = async (telefono, codigo) => {
  const response = await apiClient.post('/verificacion/verificar-codigo-autenticado', { telefono, codigo });
  return response.data;
};


/**
 * Obtener estado de verificación del usuario autenticado
 */
export const obtenerEstadoUsuario = async () => {
  const response = await apiClient.get('/verificacion/estado-usuario');
  return response.data;
};

export default {
  enviarCodigoVerificacion,
  verificarCodigo,
  obtenerEstadoVerificacion,
  obtenerEstadoUsuario,
  enviarCodigoAutenticado,
  verificarCodigoAutenticado,
};
