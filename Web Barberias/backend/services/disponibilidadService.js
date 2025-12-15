/**
 * Servicio de disponibilidad.
 * Gestiona horarios generales, por barbero y bloqueos.
 */

import DisponibilidadGeneral from '../models/DisponibilidadGeneral.js';
import DisponibilidadBarbero from '../models/DisponibilidadBarbero.js';
import Bloqueo from '../models/Bloqueo.js';
import Barbero from '../models/Barbero.js';
import Turno from '../models/Turno.js';
import { obtenerConfiguracion } from './configuracionService.js';
import { generarSlots } from '../utils/timeSlots.js';

/**
 * DISPONIBILIDAD GENERAL
 */

/**
 * Crear o actualizar horario general para un día de la semana
 */
export const crearOActualizarDisponibilidadGeneral = async (datos) => {
  const { diaSemana, horaInicio, horaFin, activo = true } = datos;

  if (diaSemana === undefined || !horaInicio || !horaFin) {
    throw new Error('Faltan campos obligatorios: diaSemana, horaInicio, horaFin');
  }

  // Buscar si ya existe un registro activo para este día
  const existente = await DisponibilidadGeneral.findOne({ diaSemana, activo: true });

  if (existente) {
    // Actualizar el existente
    existente.horaInicio = horaInicio;
    existente.horaFin = horaFin;
    existente.activo = activo;
    return await existente.save();
  }

  // Crear nuevo registro
  const nuevo = new DisponibilidadGeneral({ diaSemana, horaInicio, horaFin, activo });
  return await nuevo.save();
};

/**
 * Obtener todos los horarios generales
 */
export const obtenerDisponibilidadGeneral = async () => {
  return await DisponibilidadGeneral.find({ activo: true }).sort({ diaSemana: 1 });
};

/**
 * Eliminar horario general de un día
 */
export const eliminarDisponibilidadGeneral = async (diaSemana) => {
  const horario = await DisponibilidadGeneral.findOne({ diaSemana, activo: true });

  if (!horario) {
    throw new Error(`No se encontró horario general para el día ${diaSemana}`);
  }

  horario.activo = false;
  return await horario.save();
};

/**
 * DISPONIBILIDAD POR BARBERO
 */

/**
 * Crear o actualizar horario de un barbero para un día específico
 */
export const crearOActualizarDisponibilidadBarbero = async (datos) => {
  const { barberoId, diaSemana, horaInicio, horaFin, activo = true } = datos;

  if (!barberoId || diaSemana === undefined || !horaInicio || !horaFin) {
    throw new Error('Faltan campos obligatorios: barberoId, diaSemana, horaInicio, horaFin');
  }

  // Verificar que el barbero existe
  const barbero = await Barbero.findById(barberoId);
  if (!barbero) {
    throw new Error('Barbero no encontrado');
  }

  // Buscar si ya existe un registro activo
  const existente = await DisponibilidadBarbero.findOne({
    barbero: barberoId,
    diaSemana,
    activo: true,
  });

  if (existente) {
    existente.horaInicio = horaInicio;
    existente.horaFin = horaFin;
    existente.activo = activo;
    return await existente.save();
  }

  // Crear nuevo registro
  const nuevo = new DisponibilidadBarbero({
    barbero: barberoId,
    diaSemana,
    horaInicio,
    horaFin,
    activo,
  });
  return await nuevo.save();
};

/**
 * Obtener horarios de un barbero específico
 */
export const obtenerDisponibilidadBarbero = async (barberoId) => {
  if (!barberoId) {
    throw new Error('El ID del barbero es requerido');
  }

  const barbero = await Barbero.findById(barberoId);
  if (!barbero) {
    throw new Error('Barbero no encontrado');
  }

  return await DisponibilidadBarbero.find({ barbero: barberoId, activo: true })
    .populate('barbero', 'nombre apellido email')
    .sort({ diaSemana: 1 });
};

/**
 * Eliminar horario de un barbero para un día específico
 */
export const eliminarDisponibilidadBarbero = async (barberoId, diaSemana) => {
  const horario = await DisponibilidadBarbero.findOne({
    barbero: barberoId,
    diaSemana,
    activo: true,
  });

  if (!horario) {
    throw new Error(`No se encontró horario para el barbero en el día ${diaSemana}`);
  }

  horario.activo = false;
  return await horario.save();
};

/**
 * BLOQUEOS
 */

/**
 * Crear un nuevo bloqueo
 */
export const crearBloqueo = async (datos) => {
  const { barberoId, fechaInicio, fechaFin, horaInicio, horaFin, tipo, motivo } = datos;

  if (!fechaInicio || !fechaFin || !tipo || !motivo) {
    throw new Error('Faltan campos obligatorios: fechaInicio, fechaFin, tipo, motivo');
  }

  // Validar que fechaFin sea mayor o igual a fechaInicio
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  if (fin < inicio) {
    throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio');
  }

  // Si es el mismo día y tipo es DIA_COMPLETO, validar que sea válido
  if (inicio.toDateString() === fin.toDateString() && tipo === 'DIA_COMPLETO') {
    // Esto está permitido, bloquea ese día completo
  }

  // Si es el mismo día y tipo es RANGO_HORAS, debe tener horas
  if (inicio.toDateString() === fin.toDateString() && tipo === 'RANGO_HORAS') {
    if (!horaInicio || !horaFin) {
      throw new Error('Para bloqueos de rango de horas, debes especificar hora de inicio y fin');
    }
    if (horaInicio >= horaFin) {
      throw new Error('La hora de fin debe ser posterior a la hora de inicio');
    }
  }

  // Si se proporciona barberoId, verificar que existe
  if (barberoId) {
    const barbero = await Barbero.findById(barberoId);
    if (!barbero) {
      throw new Error('Barbero no encontrado');
    }
  }

  const nuevoBloqueo = new Bloqueo({
    barbero: barberoId || null,
    fechaInicio,
    fechaFin,
    horaInicio: tipo === 'RANGO_HORAS' ? horaInicio : null,
    horaFin: tipo === 'RANGO_HORAS' ? horaFin : null,
    tipo,
    motivo,
    activo: true,
  });

  return await nuevoBloqueo.save();
};

/**
 * Obtener todos los bloqueos activos
 */
export const obtenerBloqueos = async (filtros = {}) => {
  const { barberoId, fechaDesde, fechaHasta } = filtros;

  const query = { activo: true };

  if (barberoId) {
    query.barbero = barberoId;
  }

  if (fechaDesde || fechaHasta) {
    query.fechaInicio = {};
    if (fechaDesde) query.fechaInicio.$gte = new Date(fechaDesde);
    if (fechaHasta) query.fechaInicio.$lte = new Date(fechaHasta);
  }

  return await Bloqueo.find(query)
    .populate('barbero', 'nombre apellido email')
    .sort({ fechaInicio: 1 });
};

/**
 * Actualizar un bloqueo existente
 */
export const actualizarBloqueo = async (bloqueoId, datos) => {
  const { barberoId, fechaInicio, fechaFin, horaInicio, horaFin, tipo, motivo } = datos;

  const bloqueo = await Bloqueo.findById(bloqueoId);

  if (!bloqueo) {
    throw new Error('Bloqueo no encontrado');
  }

  // Validar fechas
  if (fechaInicio && fechaFin) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (fin < inicio) {
      throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio');
    }

    // Si es el mismo día y tipo es RANGO_HORAS, debe tener horas
    if (inicio.toDateString() === fin.toDateString() && tipo === 'RANGO_HORAS') {
      if (!horaInicio || !horaFin) {
        throw new Error('Para bloqueos de rango de horas, debes especificar hora de inicio y fin');
      }
      if (horaInicio >= horaFin) {
        throw new Error('La hora de fin debe ser posterior a la hora de inicio');
      }
    }
  }

  // Si se proporciona barberoId, verificar que existe
  if (barberoId !== undefined) {
    if (barberoId) {
      const barbero = await Barbero.findById(barberoId);
      if (!barbero) {
        throw new Error('Barbero no encontrado');
      }
      bloqueo.barbero = barberoId;
    } else {
      bloqueo.barbero = null;
    }
  }

  // Actualizar campos
  if (fechaInicio) bloqueo.fechaInicio = fechaInicio;
  if (fechaFin) bloqueo.fechaFin = fechaFin;
  if (tipo) bloqueo.tipo = tipo;
  if (motivo) bloqueo.motivo = motivo;

  if (tipo === 'RANGO_HORAS') {
    bloqueo.horaInicio = horaInicio;
    bloqueo.horaFin = horaFin;
  } else {
    bloqueo.horaInicio = null;
    bloqueo.horaFin = null;
  }

  return await bloqueo.save();
};

/**
 * Eliminar (desactivar) un bloqueo
 */
export const eliminarBloqueo = async (bloqueoId) => {
  const bloqueo = await Bloqueo.findById(bloqueoId);

  if (!bloqueo) {
    throw new Error('Bloqueo no encontrado');
  }

  bloqueo.activo = false;
  return await bloqueo.save();
};

/**
 * CÁLCULO DE SLOTS DISPONIBLES
 * Esta función calculará los slots disponibles considerando:
 * 1. Disponibilidad general
 * 2. Disponibilidad por barbero
 * 3. Bloqueos activos
 * 4. Turnos ya reservados
 */
export const calcularSlotsDisponibles = async (fecha, barberoId = null) => {
  // Parsear la fecha en UTC para evitar problemas de zona horaria
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const fechaObj = new Date(Date.UTC(anio, mes - 1, dia));
  const diaSemana = fechaObj.getUTCDay();

  // 0. Obtener configuración del negocio
  const config = await obtenerConfiguracion();

  // Verificar si el día está bloqueado permanentemente
  if (config.diasBloqueadosPermanente.includes(diaSemana)) {
    return {
      fecha,
      diaSemana,
      disponible: false,
      motivo: 'Este día está bloqueado permanentemente',
      slots: [],
    };
  }

  // 1. Obtener disponibilidad general del día
  const disponibilidadGeneral = await DisponibilidadGeneral.findOne({
    diaSemana,
    activo: true,
  });

  if (!disponibilidadGeneral) {
    return {
      fecha,
      diaSemana,
      disponible: false,
      motivo: 'La barbería no tiene horario configurado para este día',
      slots: [],
    };
  }

  // 2. Si se especifica barbero, verificar su disponibilidad
  let horaInicio = disponibilidadGeneral.horaInicio;
  let horaFin = disponibilidadGeneral.horaFin;

  if (barberoId) {
    const disponibilidadBarbero = await DisponibilidadBarbero.findOne({
      barbero: barberoId,
      diaSemana,
      activo: true,
    });

    if (disponibilidadBarbero) {
      // La disponibilidad del barbero tiene prioridad
      horaInicio = disponibilidadBarbero.horaInicio;
      horaFin = disponibilidadBarbero.horaFin;
    }
  }

  // 3. Verificar bloqueos activos para esta fecha
  const bloqueos = await Bloqueo.find({
    activo: true,
    fechaInicio: { $lte: fechaObj },
    fechaFin: { $gte: fechaObj },
    $or: [{ barbero: null }, barberoId ? { barbero: barberoId } : {}],
  });

  // 4. Generar slots usando la duración configurable
  const duracionTurno = config.duracionTurnoMinutos;
  const slots = generarSlots(horaInicio, horaFin, duracionTurno);

  // 5. Filtrar slots bloqueados
  let slotsDisponibles = slots.filter((slot) => {
    // Verificar si el slot está bloqueado
    for (const bloqueo of bloqueos) {
      if (bloqueo.tipo === 'DIA_COMPLETO') {
        return false; // Todo el día está bloqueado
      }

      if (bloqueo.tipo === 'RANGO_HORAS') {
        if (slot >= bloqueo.horaInicio && slot < bloqueo.horaFin) {
          return false; // Este slot está en el rango bloqueado
        }
      }
    }
    return true;
  });

  // 6. Filtrar slots ocupados con turnos reservados
  // Usar los mismos valores ya parseados (anio, mes, dia) para crear el rango UTC
  const fechaInicioDia = new Date(Date.UTC(anio, mes - 1, dia, 0, 0, 0, 0));
  const fechaFinDia = new Date(Date.UTC(anio, mes - 1, dia, 23, 59, 59, 999));

  // Buscar turnos reservados y pendientes (que no estén expirados)
  const ahora = new Date();
  const turnosReservados = await Turno.find({
    fecha: { $gte: fechaInicioDia, $lte: fechaFinDia },
    estado: { $in: ['pendiente', 'reservado'] }, // Incluir turnos pendientes de pago
    $or: [
      { fechaExpiracion: null }, // Turnos sin expiración (reservados pagos)
      { fechaExpiracion: { $gt: ahora } } // Turnos pendientes que NO han expirado
    ],
    ...(barberoId && { barbero: barberoId }), // Si hay barbero, filtrar por él
  });

  // Crear lista de horas ocupadas
  const horasOcupadas = turnosReservados.map(t => t.hora);

  // Filtrar slots que ya están ocupados
  slotsDisponibles = slotsDisponibles.filter(slot => !horasOcupadas.includes(slot));

  return {
    fecha,
    diaSemana,
    diaNombre: disponibilidadGeneral.diaNombre,
    disponible: slotsDisponibles.length > 0,
    horaInicio,
    horaFin,
    duracionTurno,
    slots: slotsDisponibles,
    bloqueosActivos: bloqueos.map((b) => ({
      tipo: b.tipo,
      motivo: b.motivo,
      horaInicio: b.horaInicio,
      horaFin: b.horaFin,
    })),
  };
};

// Nota: generarSlots ahora se importa desde utils/timeSlots.js

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
  calcularSlotsDisponibles,
};
