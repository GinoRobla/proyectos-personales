/**
 * Controlador de autenticación.
 * Maneja registro, login, perfil y cambio de contraseña.
 */

import * as servicioAutenticacion from '../services/authService.js';
import * as perfilService from '../services/perfilService.js';

/**
 * Registra un nuevo usuario en el sistema
 * POST /api/auth/registro
 * Body: { nombre, email, password, telefono, rol }
 */
export const registrarUsuario = async (req, res) => {
  try {
    const resultado = await servicioAutenticacion.registrar(req.body);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: resultado,
    });
  } catch (error) {
    console.error('Error en registro:', error);

    // Determinar código de estado según el error
    let codigoEstado = 500;
    if (error.message.includes('ya está registrado') || error.message.includes('Faltan campos')) {
      codigoEstado = 400;
    }

    res.status(codigoEstado).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Inicia sesión con email y contraseña
 * POST /api/auth/login
 * Body: { email, password }
 */
export const iniciarSesion = async (req, res) => {
  try {
    const { email, password } = req.body;
    const resultado = await servicioAutenticacion.login(email, password);

    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: resultado,
    });
  } catch (error) {
    console.error('Error en login:', error);

    // Determinar código de estado según el error
    let codigoEstado = 500;
    if (error.message.includes('Credenciales')) codigoEstado = 401;
    if (error.message.includes('desactivado')) codigoEstado = 403;
    if (error.message.includes('obligatorios')) codigoEstado = 400;

    res.status(codigoEstado).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtiene el perfil del usuario autenticado
 * GET /api/auth/perfil
 * Headers: Authorization: Bearer <token>
 */
export const obtenerPerfilUsuario = async (req, res) => {
  try {
    const usuario = await perfilService.obtenerPerfil(req.usuario._id);

    res.status(200).json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Actualiza el perfil del usuario autenticado
 * PUT /api/auth/perfil
 * Body: { nombre?, email?, telefono? }
 */
export const actualizarPerfilUsuario = async (req, res) => {
  try {
    const usuarioActualizado = await servicioAutenticacion.actualizarPerfil(
      req.usuario._id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: usuarioActualizado,
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);

    const codigoEstado = error.message.includes('no encontrado') ? 404 : 500;

    res.status(codigoEstado).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Cambia la contraseña del usuario autenticado
 * PUT /api/auth/cambiar-password
 * Body: { passwordActual, passwordNuevo }
 */
export const cambiarContrasena = async (req, res) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;
    const resultado = await servicioAutenticacion.cambiarPassword(
      req.usuario._id,
      passwordActual,
      passwordNuevo
    );

    res.status(200).json({
      success: true,
      message: resultado.message,
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);

    let codigoEstado = 500;
    if (error.message.includes('incorrecta') || error.message.includes('obligatorias')) {
      codigoEstado = 400;
    }

    res.status(codigoEstado).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Verifica si el token JWT es válido
 * GET /api/auth/verificar
 * Headers: Authorization: Bearer <token>
 * Nota: Si llega aquí, el token ya fue validado por el middleware
 */
export const verificarTokenJWT = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Token válido',
      data: {
        usuario: req.usuario,
      },
    });
  } catch (error) {
    console.error('Error al verificar token:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
