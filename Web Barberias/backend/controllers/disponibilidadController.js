/**
 * Controlador de disponibilidad.
 * Gestiona horarios generales, por barbero, bloqueos y cálculo de slots disponibles.
 */

import * as disponibilidadService from '../services/disponibilidadService.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

/**
 * DISPONIBILIDAD GENERAL
 */

/**
 * Crear o actualizar horario general
 * POST /api/disponibilidad/general
 */
export const crearOActualizarDisponibilidadGeneral = asyncHandler(async (req, res) => {
  const horario = await disponibilidadService.crearOActualizarDisponibilidadGeneral(req.body);

  res.status(200).json({
    success: true,
    message: 'Horario general guardado exitosamente',
    data: horario,
  });
});

/**
 * Obtener todos los horarios generales
 * GET /api/disponibilidad/general
 */
export const obtenerDisponibilidadGeneral = asyncHandler(async (req, res) => {
  const horarios = await disponibilidadService.obtenerDisponibilidadGeneral();

  res.status(200).json({
    success: true,
    data: horarios,
  });
});

/**
 * Eliminar horario general de un día
 * DELETE /api/disponibilidad/general/:diaSemana
 */
export const eliminarDisponibilidadGeneral = asyncHandler(async (req, res) => {
  const { diaSemana } = req.params;
  const horario = await disponibilidadService.eliminarDisponibilidadGeneral(Number(diaSemana));

  res.status(200).json({
    success: true,
    message: 'Horario general eliminado exitosamente',
    data: horario,
  });
});

/**
 * DISPONIBILIDAD POR BARBERO
 */

/**
 * Crear o actualizar horario de barbero
 * POST /api/disponibilidad/barbero
 */
export const crearOActualizarDisponibilidadBarbero = asyncHandler(async (req, res) => {
  const horario = await disponibilidadService.crearOActualizarDisponibilidadBarbero(req.body);

  res.status(200).json({
    success: true,
    message: 'Horario del barbero guardado exitosamente',
    data: horario,
  });
});

/**
 * Obtener horarios de un barbero específico
 * GET /api/disponibilidad/barbero/:barberoId
 */
export const obtenerDisponibilidadBarbero = asyncHandler(async (req, res) => {
  const { barberoId } = req.params;
  const horarios = await disponibilidadService.obtenerDisponibilidadBarbero(barberoId);

  res.status(200).json({
    success: true,
    data: horarios,
  });
});

/**
 * Eliminar horario de un barbero
 * DELETE /api/disponibilidad/barbero/:barberoId/:diaSemana
 */
export const eliminarDisponibilidadBarbero = asyncHandler(async (req, res) => {
  const { barberoId, diaSemana } = req.params;
  const horario = await disponibilidadService.eliminarDisponibilidadBarbero(
    barberoId,
    Number(diaSemana)
  );

  res.status(200).json({
    success: true,
    message: 'Horario del barbero eliminado exitosamente',
    data: horario,
  });
});

/**
 * BLOQUEOS
 */

/**
 * Crear un nuevo bloqueo
 * POST /api/disponibilidad/bloqueo
 */
export const crearBloqueo = asyncHandler(async (req, res) => {
  const bloqueo = await disponibilidadService.crearBloqueo(req.body);

  res.status(201).json({
    success: true,
    message: 'Bloqueo creado exitosamente',
    data: bloqueo,
  });
});

/**
 * Obtener todos los bloqueos activos con filtros
 * GET /api/disponibilidad/bloqueos
 */
export const obtenerBloqueos = asyncHandler(async (req, res) => {
  const { barberoId, fechaDesde, fechaHasta } = req.query;
  const bloqueos = await disponibilidadService.obtenerBloqueos({
    barberoId,
    fechaDesde,
    fechaHasta,
  });

  // Formatear los bloqueos para incluir el nombre del barbero
  const bloqueosFormateados = bloqueos.map((bloqueo) => ({
    _id: bloqueo._id,
    barbero: bloqueo.barbero?._id || null,
    barberoNombre: bloqueo.barbero
      ? `${bloqueo.barbero.nombre} ${bloqueo.barbero.apellido}`
      : 'Bloqueo General',
    fechaInicio: bloqueo.fechaInicio,
    fechaFin: bloqueo.fechaFin,
    horaInicio: bloqueo.horaInicio,
    horaFin: bloqueo.horaFin,
    tipo: bloqueo.tipo,
    motivo: bloqueo.motivo,
    activo: bloqueo.activo,
  }));

  res.status(200).json({
    success: true,
    data: bloqueosFormateados,
  });
});

/**
 * Actualizar un bloqueo existente
 * PUT /api/disponibilidad/bloqueo/:id
 */
export const actualizarBloqueo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const bloqueo = await disponibilidadService.actualizarBloqueo(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Bloqueo actualizado exitosamente',
    data: bloqueo,
  });
});

/**
 * Eliminar (desactivar) un bloqueo
 * DELETE /api/disponibilidad/bloqueo/:id
 */
export const eliminarBloqueo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const bloqueo = await disponibilidadService.eliminarBloqueo(id);

  res.status(200).json({
    success: true,
    message: 'Bloqueo eliminado exitosamente',
    data: bloqueo,
  });
});

/**
 * CÁLCULO DE SLOTS DISPONIBLES
 */

/**
 * Obtener slots disponibles para una fecha
 * GET /api/disponibilidad/slots-disponibles
 */
export const obtenerSlotsDisponibles = asyncHandler(async (req, res) => {
  const { fecha, barberoId } = req.query;

  if (!fecha) {
    return res.status(400).json({
      success: false,
      message: 'La fecha es requerida',
    });
  }

  const slots = await disponibilidadService.calcularSlotsDisponibles(fecha, barberoId);

  res.status(200).json({
    success: true,
    data: slots,
  });
});

export default {
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
};
