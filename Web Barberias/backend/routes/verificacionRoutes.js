/**
 * Rutas de verificación de teléfono
 */

import express from 'express';
import {
  enviarCodigo,
  verificarCodigo,
  obtenerEstadoVerificacion,
  obtenerEstadoUsuario,
} from '../controllers/verificacionController.js';
import { autenticar } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rutas públicas (para usuarios no autenticados que están registrándose)
router.post('/enviar-codigo', enviarCodigo);
router.post('/verificar-codigo', verificarCodigo);
router.get('/estado/:telefono', obtenerEstadoVerificacion);
router.get('/estado-usuario', autenticar, obtenerEstadoUsuario);

// Rutas protegidas (para usuarios autenticados que quieren verificar/actualizar su teléfono)
router.post('/enviar-codigo-autenticado', autenticar, enviarCodigo);
router.post('/verificar-codigo-autenticado', autenticar, verificarCodigo);

export default router;
