import * as servicioService from '../services/servicioService.js';

/**
 * Controlador de Servicios
 * Maneja las peticiones HTTP y delega la lógica de negocio al servicio
 */

/**
 * Obtener todos los servicios
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtener un servicio por ID
 */
export const obtenerServicioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const servicio = await servicioService.obtenerPorId(id);

    res.status(200).json({
      success: true,
      data: servicio,
    });
  } catch (error) {
    console.error('Error al obtener servicio:', error);

    const statusCode = error.message.includes('no encontrado') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Crear un nuevo servicio
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

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Actualizar un servicio
 */
export const actualizarServicio = async (req, res) => {
  try {
    const { id } = req.params;

    const servicioActualizado = await servicioService.actualizar(id, req.body);

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

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Eliminar (desactivar) un servicio
 */
export const eliminarServicio = async (req, res) => {
  try {
    const { id } = req.params;

    const servicio = await servicioService.eliminar(id);

    res.status(200).json({
      success: true,
      message: 'Servicio desactivado exitosamente',
      data: servicio,
    });
  } catch (error) {
    console.error('Error al eliminar servicio:', error);

    const statusCode = error.message.includes('no encontrado') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

export default {
  obtenerServicios,
  obtenerServicioPorId,
  crearServicio,
  actualizarServicio,
  eliminarServicio,
};
