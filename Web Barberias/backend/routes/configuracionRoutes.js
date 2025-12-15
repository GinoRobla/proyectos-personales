/**
 * Rutas de configuración del negocio.
 * Maneja las configuraciones generales de la barbería.
 */

import express from 'express';
import {
  obtenerConfiguracion,
  actualizarConfiguracion,
  agregarDiaBloqueado,
  quitarDiaBloqueado,
} from '../controllers/configuracionController.js';
import { autenticar, autorizar } from '../middlewares/authMiddleware.js';

const router = express.Router();

// RUTAS PÚBLICAS
router.get('/', obtenerConfiguracion);

// RUTAS PROTEGIDAS (Solo Admin)
router.put('/', autenticar, autorizar('admin'), actualizarConfiguracion);
router.post('/bloquear-dia', autenticar, autorizar('admin'), agregarDiaBloqueado);
router.delete('/bloquear-dia/:diaSemana', autenticar, autorizar('admin'), quitarDiaBloqueado);

export default router;
