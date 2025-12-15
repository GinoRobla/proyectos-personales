/**
 * Rutas de barberos.
 * Maneja CRUD y consulta de disponibilidad de barberos.
 */

import express from 'express';
import {
  obtenerBarberos,
  obtenerBarberoPorId,
  crearBarbero,
  actualizarBarbero,
  eliminarBarbero,
  obtenerHorariosDisponibles,
  obtenerBarberosDisponibles,
} from '../controllers/barberoController.js';
import { autenticar, autorizar } from '../middlewares/authMiddleware.js';
import { validar } from '../middlewares/validationMiddleware.js';
import {
  validarCrearBarbero,
  validarActualizarBarbero,
  validarBarberoPorId,
} from '../validators/barberoValidators.js';

const router = express.Router();

// Rutas públicas (cualquiera puede consultar barberos)
router.get('/disponibles', obtenerBarberosDisponibles);
router.get('/', obtenerBarberos);
router.get('/:id', validarBarberoPorId, validar, obtenerBarberoPorId);
router.get('/:id/horarios-disponibles', validarBarberoPorId, validar, obtenerHorariosDisponibles);

// Rutas de administración (solo admin puede crear/editar/eliminar barberos)
router.post('/', autenticar, autorizar('admin'), validarCrearBarbero, validar, crearBarbero);
router.put('/:id', autenticar, autorizar('admin'), validarActualizarBarbero, validar, actualizarBarbero);
router.delete('/:id', autenticar, autorizar('admin'), validarBarberoPorId, validar, eliminarBarbero);

export default router;
