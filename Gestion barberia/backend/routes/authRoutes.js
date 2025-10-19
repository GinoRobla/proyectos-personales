/**
 * Rutas de autenticación.
 * Maneja registro, login, verificación de token y gestión de perfil.
 */

import express from 'express';
import {
  registrarUsuario,
  iniciarSesion,
  obtenerPerfilUsuario,
  actualizarPerfilUsuario,
  cambiarContrasena,
  verificarTokenJWT,
} from '../controllers/authController.js';
import { autenticar } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rutas públicas
router.post('/registro', registrarUsuario);
router.post('/login', iniciarSesion);

// Rutas protegidas (requieren autenticación)
router.get('/verificar', autenticar, verificarTokenJWT);
router.get('/perfil', autenticar, obtenerPerfilUsuario);
router.put('/perfil', autenticar, actualizarPerfilUsuario);
router.put('/cambiar-password', autenticar, cambiarContrasena);

export default router;
