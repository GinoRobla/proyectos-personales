import express from 'express';
import {
  obtenerMiPerfil,
  actualizarMiPerfil,
  cambiarMiPassword,
} from '../controllers/perfilController.js';
import { autenticar } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * Rutas de Perfil
 * Prefijo: /api/perfil
 * Todas las rutas requieren autenticación
 */

// Aplicar middleware de autenticación a todas las rutas
router.use(autenticar);

// GET /api/perfil - Obtener perfil del usuario autenticado
router.get('/', obtenerMiPerfil);

// PUT /api/perfil - Actualizar perfil del usuario autenticado
router.put('/', actualizarMiPerfil);

// PUT /api/perfil/password - Cambiar contraseña del usuario autenticado
router.put('/password', cambiarMiPassword);

export default router;
