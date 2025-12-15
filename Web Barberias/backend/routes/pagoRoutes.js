/**
 * Rutas de Pagos.
 * Define los endpoints para gestión de señas y pagos.
 */

import express from 'express';
import * as pagoController from '../controllers/pagoController.js';
import { autenticar, autorizar } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/pagos
 * Obtener lista de pagos con filtros opcionales
 * Requiere autenticación de admin
 */
router.get('/', autenticar, autorizar('admin'), pagoController.listarPagos);

/**
 * POST /api/pagos
 * Crear un nuevo pago/seña para un turno
 * Requiere autenticación
 */
router.post('/', autenticar, pagoController.crearPago);

/**
 * POST /api/pagos/webhook
 * Webhook de MercadoPago (no requiere autenticación)
 * MercadoPago enviará notificaciones aquí
 */
router.post('/webhook', pagoController.webhookMercadoPago);

/**
 * GET /api/pagos/:id
 * Obtener información de un pago
 * Requiere autenticación
 */
router.get('/:id', autenticar, pagoController.obtenerPago);

/**
 * GET /api/pagos/turno/:turnoId
 * Obtener pago asociado a un turno
 * Requiere autenticación
 */
router.get('/turno/:turnoId', autenticar, pagoController.obtenerPagoPorTurno);

/**
 * POST /api/pagos/:id/aplicar
 * Aplicar seña al total (cuando cliente asiste)
 * Requiere autenticación de admin/barbero
 */
router.post('/:id/aplicar', autenticar, autorizar('admin', 'barbero'), pagoController.aplicarSena);

/**
 * POST /api/pagos/:id/retener
 * Retener seña (cuando cliente no asiste)
 * Requiere autenticación de admin/barbero
 */
router.post('/:id/retener', autenticar, autorizar('admin', 'barbero'), pagoController.retenerSena);

/**
 * POST /api/pagos/:id/devolver
 * Devolver seña (cancelación con anticipación)
 * Requiere autenticación de admin
 */
router.post('/:id/devolver', autenticar, autorizar('admin'), pagoController.devolverSena);

export default router;
