/**
 * Controlador de estadísticas.
 * Maneja consultas de estadísticas y reportes del negocio.
 */

import * as estadisticasService from '../services/estadisticasService.js';

/**
 * Obtener estadísticas generales
 * GET /api/estadisticas/generales
 */
export const obtenerEstadisticasGenerales = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const estadisticas = await estadisticasService.obtenerEstadisticasGenerales({ desde, hasta });

    res.status(200).json({ success: true, data: estadisticas });
  } catch (error) {
    console.error('Error al obtener estadísticas generales:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Obtener estadísticas por barbero
 * GET /api/estadisticas/barbero/:barberoId
 */
export const obtenerEstadisticasPorBarbero = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const estadisticas = await estadisticasService.obtenerEstadisticasPorBarbero(
      req.params.barberoId,
      { desde, hasta }
    );

    res.status(200).json({ success: true, data: estadisticas });
  } catch (error) {
    console.error('Error al obtener estadísticas por barbero:', error);
    const statusCode = error.message.includes('no encontrado') ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};


/**
 * Obtener estadísticas para el panel admin
 * GET /api/estadisticas/admin
 */
export const obtenerEstadisticasAdmin = async (req, res) => {
  try {
    const { mes, anio } = req.query;

    const filtros = {};
    if (mes) filtros.mes = parseInt(mes);
    if (anio) filtros.anio = parseInt(anio);

    const estadisticas = await estadisticasService.obtenerEstadisticasAdmin(filtros);

    res.status(200).json({ success: true, data: estadisticas });
  } catch (error) {
    console.error('Error al obtener estadísticas del admin:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Obtener estadísticas del barbero autenticado
 * GET /api/estadisticas/mis-estadisticas
 */
export const obtenerEstadisticasBarbero = async (req, res) => {
  try {
    const usuario = req.usuario;
    const { mes, anio, periodo } = req.query;

    if (usuario.rol !== 'barbero') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a estas estadísticas',
      });
    }

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

    res.status(200).json({ success: true, data: estadisticas });
  } catch (error) {
    console.error('Error al obtener estadísticas del barbero:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  obtenerEstadisticasGenerales,
  obtenerEstadisticasPorBarbero,
  obtenerEstadisticasAdmin,
  obtenerEstadisticasBarbero,
};
