import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Middleware de Autenticación
 * Verifica que el usuario esté autenticado con un token JWT válido
 */

/**
 * Verificar si el usuario está autenticado
 */
export const autenticar = async (req, res, next) => {
  try {
    // Obtener token del header
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación',
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuario
    const usuario = await Usuario.findById(decoded.id).select('-password');

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    if (!usuario.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario desactivado',
      });
    }

    // Agregar usuario al request
    req.usuario = usuario;

    next();
  } catch (error) {
    console.error('Error en autenticación:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al verificar autenticación',
    });
  }
};

/**
 * Verificar si el usuario tiene uno de los roles permitidos
 */
export const autorizar = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción',
        rolRequerido: rolesPermitidos,
        tuRol: req.usuario.rol,
      });
    }

    next();
  };
};

/**
 * Verificar si es el mismo usuario o es admin
 */
export const autorizarUsuarioOAdmin = (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado',
    });
  }

  const esElMismoUsuario = req.params.id === req.usuario._id.toString();
  const esAdmin = req.usuario.rol === 'admin';

  if (!esElMismoUsuario && !esAdmin) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para realizar esta acción',
    });
  }

  next();
};

export default {
  autenticar,
  autorizar,
  autorizarUsuarioOAdmin,
};
