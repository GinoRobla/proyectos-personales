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
    if (error.message.includes('ya tiene un turno') || error.message.includes('Faltan campos') || error.message.includes('TELEFONO_NO_VERIFICADO') || error.message.includes('Debes verificar') || error.message.includes('teléfono')) {
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
 * Cancelar turno de forma pública (sin autenticación)
 * POST /api/turnos/cancelar-publico/:id
 * Solo permite cancelar turnos pendientes
 */
export const cancelarTurnoPublico = async (req, res) => {
  try {
    const { id, token } = req.params;

    // Verificar que el turno existe
    const turno = await turnoService.obtenerPorId(id);

    // Validar token ANTES de verificar estado
    if (!turno || turno.tokenCancelacion !== token) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Link inválido</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #1a1a1a; padding: 1rem; }
            .container { background: #2d2d2d; padding: 3rem 2rem; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); text-align: center; max-width: 480px; width: 100%; border: 1px solid #404040; }
            .icon-circle { width: 80px; height: 80px; margin: 0 auto 1.5rem; background: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
            .icon-circle svg { width: 40px; height: 40px; stroke: white; stroke-width: 3; fill: none; }
            h1 { color: #ef4444; margin: 1rem 0; font-size: 1.75rem; font-weight: 600; }
            p { color: #a1a1a1; line-height: 1.7; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon-circle">
              <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
            <h1>⚠️ Link de cancelación inválido</h1>
            <p>Este link no es válido o ha expirado. Verifica que hayas copiado el link completo.</p>
          </div>
        </body>
        </html>
      `);
    }

    if (!turno) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Turno no encontrado</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #1a1a1a; padding: 1rem; }
            .container { background: #2d2d2d; padding: 3rem 2rem; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); text-align: center; max-width: 480px; width: 100%; border: 1px solid #404040; }
            .icon-circle { width: 80px; height: 80px; margin: 0 auto 1.5rem; background: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
            .icon-circle svg { width: 40px; height: 40px; stroke: white; stroke-width: 3; fill: none; }
            h1 { color: #ffffff; margin: 0 0 1rem 0; font-size: 1.75rem; font-weight: 600; letter-spacing: -0.5px; }
            p { color: #a1a1a1; line-height: 1.7; font-size: 1rem; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon-circle">
              <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
            <h1>Turno no encontrado</h1>
            <p>El turno que intentás cancelar no existe o ya fue cancelado previamente.</p>
          </div>
        </body>
        </html>
      `);
    }

    if (turno.estado !== 'pendiente') {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>No se puede cancelar</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #1a1a1a; padding: 1rem; }
            .container { background: #2d2d2d; padding: 3rem 2rem; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); text-align: center; max-width: 480px; width: 100%; border: 1px solid #404040; }
            .icon-circle { width: 80px; height: 80px; margin: 0 auto 1.5rem; background: #64748b; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
            .icon-circle svg { width: 40px; height: 40px; stroke: white; stroke-width: 2.5; fill: white; }
            h1 { color: #ffffff; margin: 0 0 1rem 0; font-size: 1.75rem; font-weight: 600; letter-spacing: -0.5px; }
            p { color: #a1a1a1; line-height: 1.7; font-size: 1rem; }
            .status { background: #3d3d3d; padding: 0.75rem 1.25rem; border-radius: 8px; margin-top: 1.5rem; font-weight: 500; color: #e5e5e5; border: 1px solid #505050; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon-circle">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="white" stroke-width="2"></circle><line x1="8" y1="12" x2="16" y2="12" stroke="white" stroke-width="2"></line></svg>
            </div>
            <h1>No se puede cancelar</h1>
            <p>Este turno ya no puede ser cancelado.</p>
            <div class="status">Estado actual: ${turno.estado === 'reservado' ? 'Reservado (pagado)' : turno.estado === 'completado' ? 'Completado' : turno.estado === 'cancelado' ? 'Ya cancelado' : turno.estado}</div>
            <p style="margin-top: 1.5rem; font-size: 0.9rem;">Solo los turnos pendientes de pago pueden ser cancelados desde este enlace.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Cancelar el turno
    const turnoCancelado = await turnoService.cancelar(id);

    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Turno cancelado</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #1a1a1a; padding: 1rem; }
          .container { background: #2d2d2d; padding: 3rem 2rem; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); text-align: center; max-width: 480px; width: 100%; border: 1px solid #404040; }
          .icon-circle { width: 80px; height: 80px; margin: 0 auto 1.5rem; background: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
          .icon-circle svg { width: 40px; height: 40px; stroke: white; stroke-width: 3; fill: none; }
          h1 { color: #22c55e; margin: 0 0 1rem 0; font-size: 1.75rem; font-weight: 600; letter-spacing: -0.5px; }
          p { color: #a1a1a1; line-height: 1.7; font-size: 1rem; }
          .info-box { background: #3d3d3d; padding: 1.25rem; border-radius: 12px; margin-top: 1.5rem; border: 1px solid #505050; }
          .info-row { display: flex; justify-content: space-between; margin: 0.75rem 0; font-size: 0.95rem; }
          .info-row:first-child { margin-top: 0; }
          .info-row:last-child { margin-bottom: 0; }
          .label { color: #8a8a8a; }
          .value { color: #e5e5e5; font-weight: 500; }
          .footer-text { margin-top: 1.5rem; font-size: 0.9rem; color: #737373; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon-circle">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h1>Turno cancelado exitosamente</h1>
          <p>Tu turno ha sido cancelado. No se realizará ningún cargo.</p>
          <div class="info-box">
            <div class="info-row">
              <span class="label">Fecha</span>
              <span class="value">${new Date(turnoCancelado.turno.fecha).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}</span>
            </div>
            <div class="info-row">
              <span class="label">Hora</span>
              <span class="value">${turnoCancelado.turno.hora}</span>
            </div>
            <div class="info-row">
              <span class="label">Servicio</span>
              <span class="value">${turnoCancelado.turno.servicio.nombre}</span>
            </div>
          </div>
          <p class="footer-text">Podés reservar un nuevo turno cuando quieras. Te esperamos.</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error al cancelar turno público:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #1a1a1a; padding: 1rem; }
          .container { background: #2d2d2d; padding: 3rem 2rem; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); text-align: center; max-width: 480px; width: 100%; border: 1px solid #404040; }
          .icon-circle { width: 80px; height: 80px; margin: 0 auto 1.5rem; background: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
          .icon-circle svg { width: 40px; height: 40px; stroke: white; stroke-width: 3; fill: none; }
          h1 { color: #ffffff; margin: 0 0 1rem 0; font-size: 1.75rem; font-weight: 600; letter-spacing: -0.5px; }
          p { color: #a1a1a1; line-height: 1.7; font-size: 1rem; }
          .error-detail { margin-top: 1.5rem; font-size: 0.85rem; color: #737373; background: #3d3d3d; padding: 0.75rem; border-radius: 8px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon-circle">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h1>Error al cancelar</h1>
          <p>Ocurrió un error al procesar tu solicitud. Por favor, intentá nuevamente más tarde o contactanos.</p>
          <div class="error-detail">${error.message}</div>
        </div>
      </body>
      </html>
    `);
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

export const obtenerDiasDisponibles = async (req, res) => {
    try {
        const dias = await turnoService.obtenerDiasDisponibles();
        res.status(200).json({ success: true, data: dias });
    } catch (error) {
        console.error('Error al obtener días disponibles:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ELIMINADO: obtenerDisponibilidadBarberos - Ya no se usa porque los barberos se asignan automáticamente

export default {
  obtenerTurnos,
  obtenerMisTurnos,
  obtenerTurnoPorId,
  crearTurno,
  actualizarTurno,
  cancelarTurno,
  obtenerHorariosDisponibles,
  obtenerDiasDisponibles,
};
