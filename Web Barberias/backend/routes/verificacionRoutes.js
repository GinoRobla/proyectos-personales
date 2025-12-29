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
import { validarEnviarCodigo, validarVerificarCodigo } from '../validators/verificacionValidators.js';
import { validar } from '../middlewares/validationMiddleware.js';
import { limiterSMS } from '../config/rateLimiter.js';

const router = express.Router();

// Rutas públicas (para usuarios no autenticados que están registrándose)
router.post('/enviar-codigo', limiterSMS, validarEnviarCodigo, validar, enviarCodigo);
router.post('/verificar-codigo', validarVerificarCodigo, validar, verificarCodigo);
router.get('/estado/:telefono', obtenerEstadoVerificacion);
router.get('/estado-usuario', autenticar, obtenerEstadoUsuario);

// Rutas protegidas (para usuarios autenticados que quieren verificar/actualizar su teléfono)
router.post('/enviar-codigo-autenticado', autenticar, limiterSMS, validarEnviarCodigo, validar, enviarCodigo);
router.post('/verificar-codigo-autenticado', autenticar, validarVerificarCodigo, validar, verificarCodigo);

export default router;
