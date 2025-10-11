/**
 * ============================================================================
 * RUTAS: AUTENTICACIÓN
 * ============================================================================
 *
 * Define todos los endpoints HTTP relacionados con autenticación y gestión
 * de sesiones de usuario.
 *
 * ENDPOINTS DISPONIBLES:
 *
 * PÚBLICOS (sin autenticación):
 * - POST   /api/auth/registro              - Registrar nuevo usuario en el sistema
 * - POST   /api/auth/login                 - Iniciar sesión con email y contraseña
 * - GET    /api/auth/google                - Iniciar autenticación con Google OAuth
 * - GET    /api/auth/google/callback       - Callback de Google después de autenticar
 *
 * PROTEGIDOS (requieren autenticación):
 * - GET    /api/auth/verificar              - Verificar si el token JWT es válido
 * - GET    /api/auth/perfil                 - Obtener datos del perfil del usuario autenticado
 * - PUT    /api/auth/perfil                 - Actualizar datos del perfil del usuario autenticado
 * - PUT    /api/auth/cambiar-password       - Cambiar la contraseña del usuario autenticado
 *
 * MIDDLEWARES APLICADOS:
 * - autenticar: Verifica que el usuario tenga un token JWT válido
 * - passport.authenticate: Maneja la autenticación con Google OAuth
 */

import express from 'express';
import passport from 'passport';
import {
  registrarUsuario,
  iniciarSesion,
  obtenerPerfilUsuario,
  actualizarPerfilUsuario,
  cambiarContrasena,
  verificarTokenJWT,
  callbackAutenticacionGoogle,
} from '../controllers/authController.js';
import { autenticar } from '../middlewares/authMiddleware.js';

// Crear el enrutador de Express
// QUÉ ES UN ROUTER:
// Es un mini-objeto de Express que permite agrupar rutas relacionadas
const enrutador = express.Router();

// ============================================================================
// RUTAS PÚBLICAS (sin autenticación requerida)
// ============================================================================

// ENDPOINT: Registrar nuevo usuario
// Permite que cualquier persona cree una cuenta en el sistema
// Recibe: nombre, email, contraseña, teléfono
// Retorna: Usuario creado y token de autenticación
enrutador.post('/registro', registrarUsuario);

// ENDPOINT: Iniciar sesión
// Permite a usuarios registrados acceder a su cuenta
// Recibe: email y contraseña
// Retorna: Datos del usuario y token JWT para futuras peticiones
enrutador.post('/login', iniciarSesion);

// ENDPOINT: Iniciar autenticación con Google
// Redirige al usuario a la página de login de Google
// Usa OAuth 2.0 para permitir login sin crear contraseña
// Solicita permisos para: perfil básico y email
enrutador.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// ENDPOINT: Callback de Google OAuth
// Google redirige aquí después de que el usuario autoriza la aplicación
// Procesa la información de Google y crea/actualiza el usuario
// Retorna: Token JWT para autenticar futuras peticiones
enrutador.get('/google/callback', passport.authenticate('google', { session: false }), callbackAutenticacionGoogle);

// ============================================================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================================================

// ENDPOINT: Verificar token JWT
// Comprueba si el token del usuario sigue siendo válido
// Útil para verificar sesión antes de acceder a rutas protegidas
// Retorna: Información básica del usuario si el token es válido
enrutador.get('/verificar', autenticar, verificarTokenJWT);

// ENDPOINT: Obtener perfil del usuario autenticado
// Devuelve toda la información del perfil del usuario actual
// El middleware 'autenticar' extrae el ID del usuario del token JWT
// Retorna: Nombre, email, teléfono, rol, foto de perfil, etc.
enrutador.get('/perfil', autenticar, obtenerPerfilUsuario);

// ENDPOINT: Actualizar perfil del usuario autenticado
// Permite al usuario modificar sus datos personales
// No permite cambiar email (identificador único) ni rol (seguridad)
// Retorna: Perfil actualizado del usuario
enrutador.put('/perfil', autenticar, actualizarPerfilUsuario);

// ENDPOINT: Cambiar contraseña
// Permite al usuario cambiar su contraseña actual
// Requiere la contraseña actual para mayor seguridad
// Recibe: passwordActual, passwordNuevo
// Retorna: Mensaje de confirmación
enrutador.put('/cambiar-password', autenticar, cambiarContrasena);

// ============================================================================
// EXPORTAR ENRUTADOR
// ============================================================================
export default enrutador;
