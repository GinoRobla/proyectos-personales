/**
 * Middleware de autenticación.
 * Verifica tokens JWT y permisos de usuario.
 */

import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Verifica que el usuario esté autenticado con un token JWT válido
 */
export const autenticar = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

    req.usuario = usuario;
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expirado' });
    }

    res.status(500).json({ success: false, message: 'Error al verificar autenticación' });
  }
};

/**
 * Verifica que el usuario tenga uno de los roles permitidos
 * @param {...string} rolesPermitidos - Roles que pueden acceder
 */
export const autorizar = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
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
 * Verifica que sea el mismo usuario o un admin
 */
export const autorizarUsuarioOAdmin = (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
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
