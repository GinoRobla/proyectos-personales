import express from 'express';
import {
  obtenerEstadisticasGenerales,
  obtenerEstadisticasPorBarbero,
  obtenerComparativaBarberos,
  obtenerTurnosPorPeriodo,
  obtenerEstadisticasAdmin,
  obtenerEstadisticasBarbero,
} from '../controllers/estadisticasController.js';
import { autenticar } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * Rutas de Estadísticas
 * Prefijo: /api/estadisticas
 */

// GET /api/estadisticas/admin - Estadísticas específicas del panel admin
router.get('/admin', obtenerEstadisticasAdmin);

// GET /api/estadisticas/mis-estadisticas - Estadísticas del barbero autenticado
router.get('/mis-estadisticas', autenticar, obtenerEstadisticasBarbero);

// GET /api/estadisticas/generales - Obtener estadísticas generales
router.get('/generales', obtenerEstadisticasGenerales);

// GET /api/estadisticas/comparativa-barberos - Comparativa entre barberos
router.get('/comparativa-barberos', obtenerComparativaBarberos);

// GET /api/estadisticas/turnos-por-periodo - Turnos por día/semana/mes
router.get('/turnos-por-periodo', obtenerTurnosPorPeriodo);

// GET /api/estadisticas/barbero/:barberoId - Estadísticas por barbero
router.get('/barbero/:barberoId', obtenerEstadisticasPorBarbero);

export default router;
