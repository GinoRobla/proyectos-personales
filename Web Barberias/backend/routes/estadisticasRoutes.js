/**
 * Rutas de estadísticas.
 * Endpoints para consultar métricas del negocio.
 */

import express from 'express';
import {
  obtenerEstadisticasGenerales,
  obtenerEstadisticasPorBarbero,
  obtenerEstadisticasAdmin,
  obtenerEstadisticasBarbero,
} from '../controllers/estadisticasController.js';
import { autenticar, autorizar } from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET /api/estadisticas/admin - Estadísticas del panel admin (solo admin)
router.get('/admin', autenticar, autorizar('admin'), obtenerEstadisticasAdmin);

// GET /api/estadisticas/mis-estadisticas - Estadísticas del barbero autenticado
router.get('/mis-estadisticas', autenticar, autorizar('barbero'), obtenerEstadisticasBarbero);

// GET /api/estadisticas/generales - Estadísticas generales del negocio (solo admin)
router.get('/generales', autenticar, autorizar('admin'), obtenerEstadisticasGenerales);

// GET /api/estadisticas/barbero/:barberoId - Estadísticas de un barbero específico (solo admin)
router.get('/barbero/:barberoId', autenticar, autorizar('admin'), obtenerEstadisticasPorBarbero);

export default router;
