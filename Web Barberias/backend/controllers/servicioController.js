/**
 * Controlador de servicios.
 * Maneja CRUD de servicios de la barbería.
 */

import * as servicioService from '../services/servicioService.js';

/**
 * Obtener todos los servicios
 * GET /api/servicios
 */
export const obtenerServicios = async (req, res) => {
  try {
    const { activo } = req.query;

    const filtros = {};
    if (activo !== undefined) {
      filtros.activo = activo === 'true';
    }

    const servicios = await servicioService.obtenerTodos(filtros);

    res.status(200).json({
      success: true,
      cantidad: servicios.length,
      data: servicios,
    });
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Obtener un servicio por ID
 * GET /api/servicios/:id
 */
export const obtenerServicioPorId = async (req, res) => {
  try {
    const servicio = await servicioService.obtenerPorId(req.params.id);

    res.status(200).json({ success: true, data: servicio });
  } catch (error) {
    console.error('Error al obtener servicio:', error);
    const statusCode = error.message.includes('no encontrado') ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

/**
 * Crear un nuevo servicio
 * POST /api/servicios
 */
export const crearServicio = async (req, res) => {
  try {
    const nuevoServicio = await servicioService.crear(req.body);

    res.status(201).json({
      success: true,
      message: 'Servicio creado exitosamente',
      data: nuevoServicio,
    });
  } catch (error) {
    console.error('Error al crear servicio:', error);
    const statusCode = error.message.includes('ya existe') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

/**
 * Actualizar un servicio
 * PUT /api/servicios/:id
 */
export const actualizarServicio = async (req, res) => {
  try {
    const servicioActualizado = await servicioService.actualizar(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Servicio actualizado exitosamente',
      data: servicioActualizado,
    });
  } catch (error) {
    console.error('Error al actualizar servicio:', error);

    let statusCode = 500;
    if (error.message.includes('no encontrado')) statusCode = 404;
    if (error.message.includes('ya existe')) statusCode = 400;

    res.status(statusCode).json({ success: false, message: error.message });
  }
};

/**
 * Eliminar (desactivar) un servicio
 * DELETE /api/servicios/:id
 */
export const eliminarServicio = async (req, res) => {
  try {
    const servicio = await servicioService.eliminar(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Servicio desactivado exitosamente',
      data: servicio,
    });
  } catch (error) {
    console.error('Error al eliminar servicio:', error);
    const statusCode = error.message.includes('no encontrado') ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

export default {
  obtenerServicios,
  obtenerServicioPorId,
  crearServicio,
  actualizarServicio,
  eliminarServicio,
};
