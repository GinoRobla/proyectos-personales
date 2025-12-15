/**
 * Rutas de disponibilidad.
 * Maneja horarios generales, por barbero, bloqueos y cálculo de slots disponibles.
 */

import express from 'express';
import {
  crearOActualizarDisponibilidadGeneral,
  obtenerDisponibilidadGeneral,
  eliminarDisponibilidadGeneral,
  crearOActualizarDisponibilidadBarbero,
  obtenerDisponibilidadBarbero,
  eliminarDisponibilidadBarbero,
  crearBloqueo,
  actualizarBloqueo,
  obtenerBloqueos,
  eliminarBloqueo,
  obtenerSlotsDisponibles,
} from '../controllers/disponibilidadController.js';
import { autenticar, autorizar } from '../middlewares/authMiddleware.js';

const router = express.Router();

// RUTAS PÚBLICAS
router.get('/slots-disponibles', obtenerSlotsDisponibles);

// DISPONIBILIDAD GENERAL (Solo Admin)
router.post('/general', autenticar, autorizar('admin'), crearOActualizarDisponibilidadGeneral);
router.get('/general', obtenerDisponibilidadGeneral);
router.delete('/general/:diaSemana', autenticar, autorizar('admin'), eliminarDisponibilidadGeneral);

// DISPONIBILIDAD POR BARBERO (Admin puede gestionar todos, Barbero solo el suyo)
router.post('/barbero', autenticar, autorizar('admin', 'barbero'), crearOActualizarDisponibilidadBarbero);
router.get('/barbero/:barberoId', obtenerDisponibilidadBarbero);
router.delete(
  '/barbero/:barberoId/:diaSemana',
  autenticar,
  autorizar('admin', 'barbero'),
  eliminarDisponibilidadBarbero
);

// BLOQUEOS (Solo Admin)
router.post('/bloqueo', autenticar, autorizar('admin'), crearBloqueo);
router.put('/bloqueo/:id', autenticar, autorizar('admin'), actualizarBloqueo);
router.get('/bloqueos', obtenerBloqueos);
router.delete('/bloqueo/:id', autenticar, autorizar('admin'), eliminarBloqueo);

export default router;
