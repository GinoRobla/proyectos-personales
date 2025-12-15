/**
 * Controlador de Pagos.
 * Maneja las peticiones HTTP relacionadas con señas y pagos.
 */

import * as pagoService from '../services/pagoService.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import Turno from '../models/Turno.js';

/**
 * Obtener lista de pagos con filtros opcionales
 * GET /api/pagos?estado=&fechaDesde=&fechaHasta=
 */
export const listarPagos = asyncHandler(async (req, res) => {
  const { estado, fechaDesde, fechaHasta } = req.query;

  // Construir filtros
  const filtros = {};

  if (estado) {
    filtros.estado = estado;
  }

  if (fechaDesde || fechaHasta) {
    filtros.createdAt = {};
    if (fechaDesde) {
      filtros.createdAt.$gte = new Date(fechaDesde);
    }
    if (fechaHasta) {
      // Agregar 1 día para incluir todo el día hasta
      const fechaHastaFin = new Date(fechaHasta);
      fechaHastaFin.setDate(fechaHastaFin.getDate() + 1);
      filtros.createdAt.$lt = fechaHastaFin;
    }
  }

  const pagos = await pagoService.obtenerPagos(filtros);

  res.status(200).json({
    success: true,
    data: pagos,
  });
});

/**
 * Crear un nuevo pago/seña para un turno
 * POST /api/pagos
 */
export const crearPago = asyncHandler(async (req, res) => {
  const { turnoId } = req.body;

  if (!turnoId) {
    return res.status(400).json({
      success: false,
      message: 'El ID del turno es obligatorio',
    });
  }

  // Obtener el turno con sus datos relacionados
  const turno = await Turno.findById(turnoId)
    .populate('cliente')
    .populate('servicio');

  if (!turno) {
    return res.status(404).json({
      success: false,
      message: 'Turno no encontrado',
    });
  }

  // Verificar que el turno no tenga ya un pago asociado
  if (turno.pago) {
    return res.status(400).json({
      success: false,
      message: 'Este turno ya tiene un pago asociado',
    });
  }

  // Crear preferencia de pago
  const resultado = await pagoService.crearPreferenciaPago(
    turno,
    turno.cliente,
    turno.servicio
  );

  // Actualizar el turno con el pago creado
  turno.pago = resultado.pago._id;
  turno.estadoPago = 'pendiente';
  await turno.save();

  res.status(201).json({
    success: true,
    message: 'Pago creado exitosamente',
    data: {
      pagoId: resultado.pago._id,
      urlPago: resultado.urlPago,
      monto: resultado.pago.monto,
      porcentajeSena: resultado.pago.porcentajeSena,
    },
  });
});

/**
 * Webhook de MercadoPago para notificaciones de pago
 * POST /api/pagos/webhook
 */
export const webhookMercadoPago = async (req, res) => {
  try {
    console.log('[WEBHOOK CONTROLLER] Recibiendo notificación...');

    await pagoService.procesarWebhook(req.body);

    // MercadoPago espera un status 200 o 201
    res.status(200).send('OK');
  } catch (error) {
    console.error('[WEBHOOK CONTROLLER] Error:', error);
    // Aunque haya error, devolvemos 200 para que MP no reintente
    res.status(200).send('OK');
  }
};

/**
 * Obtener información de un pago
 * GET /api/pagos/:id
 */
export const obtenerPago = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const pago = await pagoService.obtenerPagoPorId(id);

  res.status(200).json({
    success: true,
    data: pago,
  });
});

/**
 * Obtener pago asociado a un turno
 * GET /api/pagos/turno/:turnoId
 */
export const obtenerPagoPorTurno = asyncHandler(async (req, res) => {
  const { turnoId } = req.params;

  const pago = await pagoService.obtenerPagoPorTurno(turnoId);

  if (!pago) {
    return res.status(404).json({
      success: false,
      message: 'No se encontró pago para este turno',
    });
  }

  res.status(200).json({
    success: true,
    data: pago,
  });
});

/**
 * Aplicar seña al total (cuando el cliente asiste)
 * POST /api/pagos/:id/aplicar
 */
export const aplicarSena = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Buscar el pago para obtener el turnoId
  const pago = await pagoService.obtenerPagoPorId(id);

  const resultado = await pagoService.aplicarSenaAlTotal(pago.turno._id);

  res.status(200).json({
    success: true,
    message: resultado.mensaje,
    data: resultado,
  });
});

/**
 * Retener seña (cuando el cliente no asiste)
 * POST /api/pagos/:id/retener
 */
export const retenerSena = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Buscar el pago para obtener el turnoId
  const pago = await pagoService.obtenerPagoPorId(id);

  const resultado = await pagoService.retenerSena(pago.turno._id);

  res.status(200).json({
    success: true,
    message: resultado.mensaje,
    data: resultado,
  });
});

/**
 * Devolver seña (por cancelación con anticipación)
 * POST /api/pagos/:id/devolver
 */
export const devolverSena = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;

  // Buscar el pago para obtener el turnoId
  const pago = await pagoService.obtenerPagoPorId(id);

  const resultado = await pagoService.devolverSena(pago.turno._id, motivo);

  res.status(200).json({
    success: true,
    message: resultado.mensaje,
    data: resultado,
  });
});

export default {
  listarPagos,
  crearPago,
  webhookMercadoPago,
  obtenerPago,
  obtenerPagoPorTurno,
  aplicarSena,
  retenerSena,
  devolverSena,
};
