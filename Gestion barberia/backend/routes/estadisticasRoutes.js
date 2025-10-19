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
import { autenticar } from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET /api/estadisticas/admin - Estadísticas del panel admin
router.get('/admin', obtenerEstadisticasAdmin);

// GET /api/estadisticas/mis-estadisticas - Estadísticas del barbero autenticado
router.get('/mis-estadisticas', autenticar, obtenerEstadisticasBarbero);

// GET /api/estadisticas/generales - Estadísticas generales del negocio
router.get('/generales', obtenerEstadisticasGenerales);

// GET /api/estadisticas/barbero/:barberoId - Estadísticas de un barbero específico
router.get('/barbero/:barberoId', obtenerEstadisticasPorBarbero);

export default router;
