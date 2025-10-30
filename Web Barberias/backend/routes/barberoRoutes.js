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

const router = express.Router();

router.get('/disponibles', obtenerBarberosDisponibles);
router.get('/', obtenerBarberos);
router.get('/:id', obtenerBarberoPorId);
router.post('/', crearBarbero);
router.put('/:id', actualizarBarbero);
router.delete('/:id', eliminarBarbero);
router.get('/:id/horarios-disponibles', obtenerHorariosDisponibles);

export default router;
