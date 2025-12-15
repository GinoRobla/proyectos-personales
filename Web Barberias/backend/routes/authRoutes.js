/**
 * Rutas de autenticación.
 * Maneja registro, login, verificación de token y gestión de perfil.
 */

import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
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

// Rutas de Google OAuth
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
);

router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google-auth-failed`
  }),
  (req, res) => {
    try {
      // Generar JWT token para el usuario autenticado
      const token = jwt.sign(
        {
          usuarioId: req.user._id,
          email: req.user.email,
          rol: req.user.rol
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Redirigir al frontend con el token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/google/success?token=${token}`);
    } catch (error) {
      console.error('❌ Error al generar token JWT:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=token-generation-failed`);
    }
  }
);

// Rutas protegidas (requieren autenticación)
router.get('/verificar', autenticar, verificarTokenJWT);
router.get('/perfil', autenticar, obtenerPerfilUsuario);
router.put('/perfil', autenticar, actualizarPerfilUsuario);
router.put('/cambiar-password', autenticar, cambiarContrasena);

export default router;
