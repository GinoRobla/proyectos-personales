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
import { autenticar, autorizar } from '../middlewares/authMiddleware.js';
import { validar } from '../middlewares/validationMiddleware.js';
import {
  validarCrearServicio,
  validarActualizarServicio,
  validarServicioPorId,
} from '../validators/servicioValidators.js';

const router = express.Router();

// Rutas públicas (cualquiera puede consultar servicios)
router.get('/', obtenerServicios);
router.get('/:id', validarServicioPorId, validar, obtenerServicioPorId);

// Rutas de administración (solo admin puede crear/editar/eliminar servicios)
router.post('/', autenticar, autorizar('admin'), validarCrearServicio, validar, crearServicio);
router.put('/:id', autenticar, autorizar('admin'), validarActualizarServicio, validar, actualizarServicio);
router.delete('/:id', autenticar, autorizar('admin'), validarServicioPorId, validar, eliminarServicio);

export default router;
