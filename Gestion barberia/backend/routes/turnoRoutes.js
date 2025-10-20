/**
 * Rutas de turnos.
 * Maneja CRUD de reservas, consulta de disponibilidad y cancelaciones.
 */

import express from 'express';
import {
  obtenerTurnos,
  obtenerTurnoPorId,
  crearTurno,
  actualizarTurno,
  cancelarTurno,
  obtenerHorariosDisponibles,
  obtenerDiasDisponibles,
  obtenerMisTurnos,
} from '../controllers/turnoController.js';
import { paginacion } from '../middlewares/paginacionMiddleware.js';
import { autenticar } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/horarios-disponibles', obtenerHorariosDisponibles);
router.get('/dias-disponibles', obtenerDiasDisponibles);
router.get('/mis-turnos', autenticar, paginacion, obtenerMisTurnos);
router.get('/', paginacion, obtenerTurnos);
router.get('/:id', obtenerTurnoPorId);
router.post('/', crearTurno);
router.put('/:id', actualizarTurno);
router.patch('/:id/cancelar', cancelarTurno);
router.get('/disponibilidad-barberos', [proteger, admin], obtenerDisponibilidadBarberos);

export default router;
