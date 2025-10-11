import * as turnoService from '../services/turnoService.js';
import { generarRespuestaPaginada } from '../middlewares/paginacionMiddleware.js';

/**
 * Controlador de Turnos
 * Maneja las peticiones HTTP y delega la lógica de negocio al servicio
 */

/**
 * Obtener todos los turnos con filtros opcionales y paginación
 */
export const obtenerTurnos = async (req, res) => {
  try {
    const { estado, barberoId, fecha, desde, hasta } = req.query;

    const filtros = { estado, barberoId, fecha, desde, hasta };
    const paginacion = req.paginacion || { skip: 0, limite: 10 };

    const { turnos, total } = await turnoService.obtenerTodos(filtros, paginacion);

    const respuesta = generarRespuestaPaginada(
      turnos,
      total,
      paginacion.pagina || 1,
      paginacion.limite
    );

    res.status(200).json({
      success: true,
      ...respuesta,
    });
  } catch (error) {
    console.error('Error al obtener turnos:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtener un turno por ID
 */
export const obtenerTurnoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const turno = await turnoService.obtenerPorId(id);

    res.status(200).json({
      success: true,
      data: turno,
    });
  } catch (error) {
    console.error('Error al obtener turno:', error);

    const statusCode = error.message.includes('no encontrado') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Crear una nueva reserva (turno)
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
    if (error.message.includes('ya tiene un turno') || error.message.includes('Faltan campos'))
      statusCode = 400;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Actualizar un turno
 */
export const actualizarTurno = async (req, res) => {
  try {
    const { id } = req.params;

    const turnoActualizado = await turnoService.actualizar(id, req.body);

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

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Cancelar un turno
 */
export const cancelarTurno = async (req, res) => {
  try {
    const { id } = req.params;

    const turno = await turnoService.cancelar(id);

    res.status(200).json({
      success: true,
      message: 'Turno cancelado exitosamente',
      data: turno,
    });
  } catch (error) {
    console.error('Error al cancelar turno:', error);

    const statusCode = error.message.includes('no encontrado') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtener mis turnos (cliente o barbero autenticado)
 */
export const obtenerMisTurnos = async (req, res) => {
  try {
    const usuario = req.usuario; // Del middleware autenticar
    const { estado, fecha } = req.query;
    const paginacion = req.paginacion || { skip: 0, limite: 10 };

    let filtros = { estado, fecha };

    // Si es cliente, filtrar por cliente
    if (usuario.rol === 'cliente') {
      // Buscar el cliente asociado al usuario
      const Cliente = (await import('../models/Cliente.js')).default;
      const cliente = await Cliente.findOne({ email: usuario.email });

      if (cliente) {
        filtros.clienteId = cliente._id;
      } else {
        // Si no hay cliente asociado, retornar array vacío
        // (el usuario aún no ha creado ningún turno)
        return res.status(200).json({
          success: true,
          datos: [],
          paginacion: {
            total: 0,
            totalPaginas: 0,
            paginaActual: paginacion.pagina || 1,
            limite: paginacion.limite,
          },
        });
      }
    }

    // Si es barbero, filtrar por barbero
    if (usuario.rol === 'barbero') {
      // Buscar el barbero asociado al usuario
      const Barbero = (await import('../models/Barbero.js')).default;
      const barbero = await Barbero.findOne({ email: usuario.email });

      if (barbero) {
        filtros.barberoId = barbero._id;
      } else {
        // Si no hay barbero asociado, retornar array vacío
        return res.status(200).json({
          success: true,
          datos: [],
          paginacion: {
            total: 0,
            totalPaginas: 0,
            paginaActual: paginacion.pagina || 1,
            limite: paginacion.limite,
          },
        });
      }
    }

    const { turnos, total } = await turnoService.obtenerTodos(filtros, paginacion);

    const respuesta = generarRespuestaPaginada(
      turnos,
      total,
      paginacion.pagina || 1,
      paginacion.limite
    );

    res.status(200).json({
      success: true,
      ...respuesta,
    });
  } catch (error) {
    console.error('Error al obtener mis turnos:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtener horarios disponibles para una fecha
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
