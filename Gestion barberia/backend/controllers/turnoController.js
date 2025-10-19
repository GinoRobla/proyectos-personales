/**
 * Controlador de turnos.
 * Maneja reservas, cancelaciones y consulta de disponibilidad.
 */

import * as turnoService from '../services/turnoService.js';
import { generarRespuestaPaginada } from '../middlewares/paginacionMiddleware.js';

/**
 * Obtener todos los turnos con filtros y paginación
 * GET /api/turnos
 */
export const obtenerTurnos = async (req, res) => {
  try {
    const { estado, barberoId, fecha, desde, hasta } = req.query;
    const paginacion = req.paginacion || { skip: 0, limite: 10 };

    const { turnos, total } = await turnoService.obtenerTodos(
      { estado, barberoId, fecha, desde, hasta },
      paginacion
    );

    const respuesta = generarRespuestaPaginada(turnos, total, paginacion.pagina || 1, paginacion.limite);

    res.status(200).json({ success: true, ...respuesta });
  } catch (error) {
    console.error('Error al obtener turnos:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Obtener un turno por ID
 * GET /api/turnos/:id
 */
export const obtenerTurnoPorId = async (req, res) => {
  try {
    const turno = await turnoService.obtenerPorId(req.params.id);

    res.status(200).json({ success: true, data: turno });
  } catch (error) {
    console.error('Error al obtener turno:', error);
    const statusCode = error.message.includes('no encontrado') ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

/**
 * Crear un nuevo turno
 * POST /api/turnos
 */
export const crearTurno = async (req, res) => {
  try {
    const nuevoTurno = await turnoService.crear(req.body);

    res.status(201).json({
      success: true,
      message: 'Turno creado exitosamente',
      data: nuevoTurno,
    });
  } catch (error) {
    console.error('Error al crear turno:', error);

    let statusCode = 500;
    if (error.message.includes('no encontrado')) statusCode = 404;
    if (error.message.includes('ya tiene un turno') || error.message.includes('Faltan campos')) {
      statusCode = 400;
    }

    res.status(statusCode).json({ success: false, message: error.message });
  }
};

/**
 * Actualizar un turno
 * PUT /api/turnos/:id
 */
export const actualizarTurno = async (req, res) => {
  try {
    const turnoActualizado = await turnoService.actualizar(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Turno actualizado exitosamente',
      data: turnoActualizado,
    });
  } catch (error) {
    console.error('Error al actualizar turno:', error);

    let statusCode = 500;
    if (error.message.includes('no encontrado')) statusCode = 404;
    if (error.message.includes('ya existe')) statusCode = 400;

    res.status(statusCode).json({ success: false, message: error.message });
  }
};

/**
 * Cancelar un turno
 * PATCH /api/turnos/:id/cancelar
 */
export const cancelarTurno = async (req, res) => {
  try {
    const turno = await turnoService.cancelar(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Turno cancelado exitosamente',
      data: turno,
    });
  } catch (error) {
    console.error('Error al cancelar turno:', error);
    const statusCode = error.message.includes('no encontrado') ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

/**
 * Obtener turnos del usuario autenticado (cliente o barbero)
 * GET /api/turnos/mis-turnos
 */
export const obtenerMisTurnos = async (req, res) => {
  try {
    const usuario = req.usuario;
    const { estado, fecha } = req.query;
    const paginacion = req.paginacion || { skip: 0, limite: 10 };

    let filtros = { estado, fecha };

    // Filtrar por cliente
    if (usuario.rol === 'cliente') {
      const Cliente = (await import('../models/Cliente.js')).default;
      const cliente = await Cliente.findOne({ email: usuario.email });

      if (!cliente) {
        return res.status(200).json({
          success: true,
          datos: [],
          paginacion: { total: 0, totalPaginas: 0, paginaActual: paginacion.pagina || 1, limite: paginacion.limite },
        });
      }

      filtros.clienteId = cliente._id;
    }

    // Filtrar por barbero
    if (usuario.rol === 'barbero') {
      const Barbero = (await import('../models/Barbero.js')).default;
      const barbero = await Barbero.findOne({ email: usuario.email });

      if (!barbero) {
        return res.status(200).json({
          success: true,
          datos: [],
          paginacion: { total: 0, totalPaginas: 0, paginaActual: paginacion.pagina || 1, limite: paginacion.limite },
        });
      }

      filtros.barberoId = barbero._id;
    }

    const { turnos, total } = await turnoService.obtenerTodos(filtros, paginacion);
    const respuesta = generarRespuestaPaginada(turnos, total, paginacion.pagina || 1, paginacion.limite);

    res.status(200).json({ success: true, ...respuesta });
  } catch (error) {
    console.error('Error al obtener mis turnos:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Obtener horarios disponibles para una fecha
 * GET /api/turnos/horarios-disponibles
 */
export const obtenerHorariosDisponibles = async (req, res) => {
  try {
    const { fecha, barberoId } = req.query;

    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: 'La fecha es requerida',
      });
    }

    const horariosDisponibles = await turnoService.obtenerHorariosDisponibles(fecha, barberoId);

    res.status(200).json({
      success: true,
      data: {
        fecha,
        barberoId: barberoId || 'todos',
        horariosDisponibles,
      },
    });
  } catch (error) {
    console.error('Error al obtener horarios disponibles:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  obtenerTurnos,
  obtenerMisTurnos,
  obtenerTurnoPorId,
  crearTurno,
  actualizarTurno,
  cancelarTurno,
  obtenerHorariosDisponibles,
};
