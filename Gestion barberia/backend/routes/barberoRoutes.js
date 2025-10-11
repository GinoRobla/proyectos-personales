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

/**
 * Rutas de Barberos
 * Prefijo: /api/barberos
 */

// GET /api/barberos/disponibles - Obtener barberos disponibles para fecha y hora
router.get('/disponibles', obtenerBarberosDisponibles);

// GET /api/barberos - Obtener todos los barberos
router.get('/', obtenerBarberos);

// GET /api/barberos/:id - Obtener un barbero por ID
router.get('/:id', obtenerBarberoPorId);

// POST /api/barberos - Crear un nuevo barbero
router.post('/', crearBarbero);

// PUT /api/barberos/:id - Actualizar un barbero
router.put('/:id', actualizarBarbero);

// DELETE /api/barberos/:id - Eliminar (desactivar) un barbero
router.delete('/:id', eliminarBarbero);

// GET /api/barberos/:id/horarios-disponibles - Obtener horarios disponibles de un barbero
router.get('/:id/horarios-disponibles', obtenerHorariosDisponibles);

export default router;
