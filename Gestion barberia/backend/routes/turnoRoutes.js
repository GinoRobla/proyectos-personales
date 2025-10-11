import express from 'express';
import {
  obtenerTurnos,
  obtenerTurnoPorId,
  crearTurno,
  actualizarTurno,
  cancelarTurno,
  obtenerHorariosDisponibles,
  obtenerMisTurnos,
} from '../controllers/turnoController.js';
import { paginacion } from '../middlewares/paginacionMiddleware.js';
import { autenticar } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * Rutas de Turnos
 * Prefijo: /api/turnos
 */

// GET /api/turnos/horarios-disponibles - Obtener horarios disponibles
router.get('/horarios-disponibles', obtenerHorariosDisponibles);

// GET /api/turnos/mis-turnos - Obtener mis turnos (requiere autenticación)
router.get('/mis-turnos', autenticar, paginacion, obtenerMisTurnos);

// GET /api/turnos - Obtener todos los turnos (con paginación)
router.get('/', paginacion, obtenerTurnos);

// GET /api/turnos/:id - Obtener un turno por ID
router.get('/:id', obtenerTurnoPorId);

// POST /api/turnos - Crear un nuevo turno
router.post('/', crearTurno);

// PUT /api/turnos/:id - Actualizar un turno
router.put('/:id', actualizarTurno);

// PATCH /api/turnos/:id/cancelar - Cancelar un turno
router.patch('/:id/cancelar', cancelarTurno);

export default router;
