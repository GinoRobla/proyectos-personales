import * as perfilService from '../services/perfilService.js';

/**
 * Controlador de Perfil
 * Maneja las peticiones HTTP y delega la lógica de negocio al servicio
 */

/**
 * Obtener perfil del usuario autenticado
 */
export const obtenerMiPerfil = async (req, res) => {
  try {
    const perfil = await perfilService.obtenerPerfil(req.usuario.id);

    res.status(200).json({
      success: true,
      data: perfil,
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);

    const statusCode = error.message.includes('no encontrado') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Actualizar perfil del usuario autenticado
 */
export const actualizarMiPerfil = async (req, res) => {
  try {
    const perfil = await perfilService.actualizarPerfil(req.usuario.id, req.body);

    res.status(200).json({
      success: true,
      data: perfil,
      message: 'Perfil actualizado correctamente',
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);

    const statusCode = error.message.includes('no encontrado')
      ? 404
      : error.message.includes('en uso')
      ? 400
      : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Cambiar contraseña del usuario autenticado
 */
export const cambiarMiPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;

    if (!passwordActual || !passwordNuevo) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere la contraseña actual y la nueva contraseña',
      });
    }

    if (passwordNuevo.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres',
      });
    }

    const resultado = await perfilService.cambiarPassword(
      req.usuario.id,
      passwordActual,
      passwordNuevo
    );

    res.status(200).json({
      success: true,
      message: resultado.message,
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);

    const statusCode = error.message.includes('incorrecta') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

export default {
  obtenerMiPerfil,
  actualizarMiPerfil,
  cambiarMiPassword,
};
