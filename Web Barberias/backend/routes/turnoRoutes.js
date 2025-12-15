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
  cancelarTurnoPublico,
  obtenerHorariosDisponibles,
  obtenerDiasDisponibles,
  obtenerMisTurnos,
} from '../controllers/turnoController.js';
import { paginacion } from '../middlewares/paginacionMiddleware.js';
import { autenticar, autorizar } from '../middlewares/authMiddleware.js';
import { validar } from '../middlewares/validationMiddleware.js';
import {
  validarCrearTurno,
  validarActualizarTurno,
  validarCancelarTurno,
  validarObtenerTurnoPorId,
  validarListarTurnos,
  validarHorariosDisponibles,
} from '../validators/turnoValidators.js';

const router = express.Router();

// Rutas públicas (consulta de disponibilidad)
router.get('/horarios-disponibles', validarHorariosDisponibles, validar, obtenerHorariosDisponibles);
router.get('/dias-disponibles', obtenerDiasDisponibles);
router.get('/cancelar-publico/:id', cancelarTurnoPublico);

// Rutas protegidas (requieren autenticación)
router.get('/mis-turnos', autenticar, paginacion, obtenerMisTurnos);
router.post('/', autenticar, validarCrearTurno, validar, crearTurno);
router.patch('/:id/cancelar', autenticar, validarCancelarTurno, validar, cancelarTurno);

// Rutas administrativas (admin y barbero pueden ver todos los turnos)
router.get('/', autenticar, autorizar('admin', 'barbero'), validarListarTurnos, validar, paginacion, obtenerTurnos);
router.get('/:id', autenticar, autorizar('admin', 'barbero'), validarObtenerTurnoPorId, validar, obtenerTurnoPorId);
router.put('/:id', autenticar, autorizar('admin', 'barbero'), validarActualizarTurno, validar, actualizarTurno);

export default router;
