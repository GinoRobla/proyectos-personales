import express from 'express';
import {
  obtenerServicios,
  obtenerServicioPorId,
  crearServicio,
  actualizarServicio,
  eliminarServicio,
} from '../controllers/servicioController.js';

const router = express.Router();

/**
 * Rutas de Servicios
 * Prefijo: /api/servicios
 */

// GET /api/servicios - Obtener todos los servicios
router.get('/', obtenerServicios);

// GET /api/servicios/:id - Obtener un servicio por ID
router.get('/:id', obtenerServicioPorId);

// POST /api/servicios - Crear un nuevo servicio
router.post('/', crearServicio);

// PUT /api/servicios/:id - Actualizar un servicio
router.put('/:id', actualizarServicio);

// DELETE /api/servicios/:id - Eliminar (desactivar) un servicio
router.delete('/:id', eliminarServicio);

export default router;
