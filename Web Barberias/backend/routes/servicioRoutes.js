/**
 * Rutas de servicios.
 * Maneja CRUD de servicios ofrecidos por la barbería.
 */

import express from 'express';
import {
  obtenerServicios,
  obtenerServicioPorId,
  crearServicio,
  actualizarServicio,
  eliminarServicio,
} from '../controllers/servicioController.js';

const router = express.Router();

router.get('/', obtenerServicios);
router.get('/:id', obtenerServicioPorId);
router.post('/', crearServicio);
router.put('/:id', actualizarServicio);
router.delete('/:id', eliminarServicio);

export default router;
