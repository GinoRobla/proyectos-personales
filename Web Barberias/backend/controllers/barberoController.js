/**
 * Controlador de barberos.
 * Maneja CRUD de barberos y consulta de disponibilidad.
 */

import * as barberoService from '../services/barberoService.js';

/**
 * Obtener todos los barberos
 * GET /api/barberos
 */
export const obtenerBarberos = async (req, res) => {
  try {
    const { activo } = req.query;

    const filtros = {};
    if (activo !== undefined) {
      filtros.activo = activo === 'true';
    }

    const barberos = await barberoService.obtenerTodos(filtros);

    res.status(200).json({
      success: true,
      cantidad: barberos.length,
      data: barberos,
    });
  } catch (error) {
    console.error('Error al obtener barberos:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Obtener un barbero por ID
 * GET /api/barberos/:id
 */
export const obtenerBarberoPorId = async (req, res) => {
  try {
    const barbero = await barberoService.obtenerPorId(req.params.id);

    res.status(200).json({ success: true, data: barbero });
  } catch (error) {
    console.error('Error al obtener barbero:', error);
    const statusCode = error.message.includes('no encontrado') ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

/**
 * Crear un nuevo barbero
 * POST /api/barberos
 */
export const crearBarbero = async (req, res) => {
  try {
    const nuevoBarbero = await barberoService.crear(req.body);

    res.status(201).json({
      success: true,
      message: 'Barbero creado exitosamente',
      data: nuevoBarbero,
    });
  } catch (error) {
    console.error('Error al crear barbero:', error);
    const statusCode = error.message.includes('ya existe') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

/**
 * Actualizar un barbero
 * PUT /api/barberos/:id
 */
export const actualizarBarbero = async (req, res) => {
  try {
    const barberoActualizado = await barberoService.actualizar(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Barbero actualizado exitosamente',
      data: barberoActualizado,
    });
  } catch (error) {
    console.error('Error al actualizar barbero:', error);

    let statusCode = 500;
    if (error.message.includes('no encontrado')) statusCode = 404;
    if (error.message.includes('ya existe')) statusCode = 400;

    res.status(statusCode).json({ success: false, message: error.message });
  }
};

/**
 * Eliminar (desactivar) un barbero
 * DELETE /api/barberos/:id
 */
export const eliminarBarbero = async (req, res) => {
  try {
    const barbero = await barberoService.eliminar(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Barbero desactivado exitosamente',
      data: barbero,
    });
  } catch (error) {
    console.error('Error al eliminar barbero:', error);
    const statusCode = error.message.includes('no encontrado') ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

/**
 * Obtener horarios disponibles de un barbero
 * GET /api/barberos/:id/horarios-disponibles
 */
export const obtenerHorariosDisponibles = async (req, res) => {
  try {
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: 'La fecha es requerida',
      });
    }

    const barbero = await barberoService.obtenerPorId(req.params.id);
    const turnoService = await import('../services/turnoService.js');
    const horariosDisponibles = await turnoService.obtenerHorariosDisponibles(fecha, req.params.id);

    res.status(200).json({
      success: true,
      data: {
        barbero: barbero.nombreCompleto,
        fecha,
        horariosDisponibles,
      },
    });
  } catch (error) {
    console.error('Error al obtener horarios disponibles:', error);
    const statusCode = error.message.includes('no encontrado') ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

/**
 * Obtener barberos disponibles para fecha y hora específica
 * GET /api/barberos/disponibles
 */
export const obtenerBarberosDisponibles = async (req, res) => {
  try {
    const { fecha, hora } = req.query;
    const barberosDisponibles = await barberoService.obtenerDisponibles(fecha, hora);

    res.status(200).json({
      success: true,
      cantidad: barberosDisponibles.length,
      data: barberosDisponibles,
    });
  } catch (error) {
    console.error('Error al obtener barberos disponibles:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  obtenerBarberos,
  obtenerBarberoPorId,
  crearBarbero,
  actualizarBarbero,
  eliminarBarbero,
  obtenerHorariosDisponibles,
  obtenerBarberosDisponibles,
};
