/**
 * Controlador de verificación de teléfono
 */

import * as verificacionService from '../services/verificacionService.js';

/**
 * Enviar código de verificación
 * POST /api/verificacion/enviar-codigo
 */
export const enviarCodigo = async (req, res) => {
  try {
    const { telefono } = req.body;
    const usuarioId = req.usuario?._id || null; // Opcional si está autenticado

    if (!telefono) {
      return res.status(400).json({
        success: false,
        message: 'El teléfono es requerido',
      });
    }

    const resultado = await verificacionService.enviarCodigoVerificacion(telefono, usuarioId);

    res.status(200).json(resultado);
  } catch (error) {
    console.error('Error al enviar código de verificación:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Verificar código ingresado
 * POST /api/verificacion/verificar-codigo
 */
export const verificarCodigo = async (req, res) => {
  try {
    const { telefono, codigo } = req.body;
    const usuarioId = req.usuario?._id || null; // Opcional si está autenticado

    if (!telefono || !codigo) {
      return res.status(400).json({
        success: false,
        message: 'El teléfono y código son requeridos',
      });
    }

    const resultado = await verificacionService.verificarCodigo(telefono, codigo, usuarioId);

    res.status(200).json(resultado);
  } catch (error) {
    console.error('Error al verificar código:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Verificar estado de verificación de un teléfono
 * GET /api/verificacion/estado/:telefono
 */
export const obtenerEstadoVerificacion = async (req, res) => {
  try {
    const { telefono } = req.params;

    if (!telefono) {
      return res.status(400).json({
        success: false,
        message: 'El teléfono es requerido',
      });
    }

    const verificado = await verificacionService.esTelefonoVerificado(telefono);

    res.status(200).json({
      success: true,
      verificado,
    });
  } catch (error) {
    console.error('Error al obtener estado de verificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar estado del teléfono',
    });
  }
};


/**
 * Verificar estado de verificación del usuario autenticado
 * GET /api/verificacion/estado-usuario
 */
export const obtenerEstadoUsuario = async (req, res) => {
  try {
    const usuarioId = req.usuario?._id;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
    }

    const verificado = await verificacionService.esUsuarioVerificado(usuarioId);

    res.status(200).json({
      success: true,
      verificado,
    });
  } catch (error) {
    console.error('Error al obtener estado de verificación de usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar estado del usuario',
    });
  }
};

export default {
  enviarCodigo,
  verificarCodigo,
  obtenerEstadoVerificacion,
  obtenerEstadoUsuario,
};
