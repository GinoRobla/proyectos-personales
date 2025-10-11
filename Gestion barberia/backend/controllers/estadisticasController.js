import * as estadisticasService from '../services/estadisticasService.js';

/**
 * Controlador de Estadísticas
 * Maneja las peticiones HTTP y delega la lógica de negocio al servicio
 */

/**
 * Obtener estadísticas generales del negocio
 */
export const obtenerEstadisticasGenerales = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    const filtros = { desde, hasta };

    const estadisticas = await estadisticasService.obtenerEstadisticasGenerales(filtros);

    res.status(200).json({
      success: true,
      data: estadisticas,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas generales:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtener estadísticas por barbero
 */
export const obtenerEstadisticasPorBarbero = async (req, res) => {
  try {
    const { barberoId } = req.params;
    const { desde, hasta } = req.query;

    const filtros = { desde, hasta };

    const estadisticas = await estadisticasService.obtenerEstadisticasPorBarbero(
      barberoId,
      filtros
    );

    res.status(200).json({
      success: true,
      data: estadisticas,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas por barbero:', error);

    const statusCode = error.message.includes('no encontrado') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtener comparativa entre todos los barberos
 */
export const obtenerComparativaBarberos = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    const filtros = { desde, hasta };

    const comparativa = await estadisticasService.obtenerComparativaBarberos(filtros);

    res.status(200).json({
      success: true,
      data: comparativa,
    });
  } catch (error) {
    console.error('Error al obtener comparativa de barberos:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtener estadísticas de turnos por día/semana/mes
 */
export const obtenerTurnosPorPeriodo = async (req, res) => {
  try {
    const { desde, hasta, periodo } = req.query;

    const filtros = { desde, hasta, periodo };

    const turnosPorPeriodo = await estadisticasService.obtenerTurnosPorPeriodo(filtros);

    res.status(200).json({
      success: true,
      data: turnosPorPeriodo,
    });
  } catch (error) {
    console.error('Error al obtener turnos por período:', error);

    const statusCode = error.message.includes('requeridas') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtener estadísticas específicas para el panel del admin
 */
export const obtenerEstadisticasAdmin = async (req, res) => {
  try {
    const { mes, anio } = req.query;

    const filtros = {};
    if (mes) filtros.mes = parseInt(mes);
    if (anio) filtros.anio = parseInt(anio);

    const estadisticas = await estadisticasService.obtenerEstadisticasAdmin(filtros);

    res.status(200).json({
      success: true,
      data: estadisticas,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del admin:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * OBTENER ESTADÍSTICAS DEL BARBERO AUTENTICADO
 *
 * Obtiene estadísticas personales para el panel del barbero autenticado.
 * Requiere que el usuario esté autenticado como barbero.
 */
export const obtenerEstadisticasBarbero = async (req, res) => {
  try {
    const usuario = req.usuario; // Del middleware autenticar
    const { mes, anio, periodo } = req.query;

    // Verificar que el usuario sea barbero
    if (usuario.rol !== 'barbero') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a estas estadísticas',
      });
    }

    // Buscar el barbero asociado al usuario
    const Barbero = (await import('../models/Barbero.js')).default;
    const barbero = await Barbero.findOne({ email: usuario.email });

    if (!barbero) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el perfil de barbero asociado',
      });
    }

    const filtros = {};
    if (mes) filtros.mes = parseInt(mes);
    if (anio) filtros.anio = parseInt(anio);
    if (periodo) filtros.periodo = periodo;

    const estadisticas = await estadisticasService.obtenerEstadisticasBarbero(barbero._id, filtros);

    res.status(200).json({
      success: true,
      data: estadisticas,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del barbero:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export default {
  obtenerEstadisticasGenerales,
  obtenerEstadisticasPorBarbero,
  obtenerComparativaBarberos,
  obtenerTurnosPorPeriodo,
  obtenerEstadisticasAdmin,
  obtenerEstadisticasBarbero,
};
