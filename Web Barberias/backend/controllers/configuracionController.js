/**
 * Controlador de configuración del negocio.
 * Gestiona las configuraciones generales de la barbería.
 */

import * as configuracionService from '../services/configuracionService.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

/**
 * Obtener la configuración actual
 * GET /api/configuracion
 */
export const obtenerConfiguracion = asyncHandler(async (req, res) => {
  const config = await configuracionService.obtenerConfiguracion();

  res.status(200).json({
    success: true,
    data: config,
  });
});

/**
 * Actualizar la configuración
 * PUT /api/configuracion
 */
export const actualizarConfiguracion = asyncHandler(async (req, res) => {
  const config = await configuracionService.actualizarConfiguracion(req.body);

  res.status(200).json({
    success: true,
    message: 'Configuración actualizada exitosamente',
    data: config,
  });
});

/**
 * Agregar día a bloqueados permanentes
 * POST /api/configuracion/bloquear-dia
 */
export const agregarDiaBloqueado = asyncHandler(async (req, res) => {
  const { diaSemana } = req.body;

  if (diaSemana === undefined) {
    return res.status(400).json({
      success: false,
      message: 'El día de la semana es requerido',
    });
  }

  const config = await configuracionService.agregarDiaBloqueado(Number(diaSemana));

  res.status(200).json({
    success: true,
    message: 'Día bloqueado permanentemente',
    data: config,
  });
});

/**
 * Quitar día de bloqueados permanentes
 * DELETE /api/configuracion/bloquear-dia/:diaSemana
 */
export const quitarDiaBloqueado = asyncHandler(async (req, res) => {
  const { diaSemana } = req.params;

  const config = await configuracionService.quitarDiaBloqueado(Number(diaSemana));

  res.status(200).json({
    success: true,
    message: 'Día desbloqueado',
    data: config,
  });
});

export default {
  obtenerConfiguracion,
  actualizarConfiguracion,
  agregarDiaBloqueado,
  quitarDiaBloqueado,
};
