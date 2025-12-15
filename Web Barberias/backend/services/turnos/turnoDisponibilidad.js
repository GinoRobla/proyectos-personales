/**
 * turnoDisponibilidad - disponibilidad
 * Módulo extraído de turnoService.js para mejor organización
 */

import Turno from '../../models/Turno.js';
import Barbero from '../../models/Barbero.js';
import { calcularSlotsDisponibles } from '../disponibilidadService.js';
import { obtenerConfiguracion } from '../configuracionService.js';
import { _crearRangoFechaDia, _verificarConflicto } from './turnoHelpers.js';

/**
 * -------------------------------------------------------------------
 * SERVICIOS EXPORTADOS
 * -------------------------------------------------------------------
 */

/**
 * Obtener días disponibles para reservar turnos
 * Filtra los días bloqueados permanentemente según la configuración
 */
export const obtenerDiasDisponibles = async () => {
  try {
    // Obtener configuración para saber qué días están bloqueados permanentemente
    const config = await obtenerConfiguracion();
    const diasBloqueados = config.diasBloqueadosPermanente;

    const dias = [];
    const hoy = new Date();
    let fecha = new Date(hoy);

    // Asegurarse de que 'hoy' comience a las 00:00 para evitar problemas de zona horaria
    fecha.setHours(0, 0, 0, 0);

    while (dias.length < 14) {
      const diaSemana = fecha.getDay(); // 0 = Domingo, 6 = Sábado

      // Solo agregar si NO está en la lista de días bloqueados permanentemente
      if (!diasBloqueados.includes(diaSemana)) {
        dias.push(new Date(fecha));
      }

      fecha.setDate(fecha.getDate() + 1);
    }
    return dias;
  } catch (error) {
    throw new Error(`Error al obtener días disponibles: ${error.message}`);
  }
};


export const obtenerHorariosDisponibles = async (fecha, barberoId = null) => {
  try {
    if (!fecha) {
      throw new Error('La fecha es requerida');
    }

    // Usar el nuevo servicio de disponibilidad que considera:
    // - Horarios generales configurados
    // - Horarios específicos por barbero
    // - Bloqueos activos
    // - Días bloqueados permanentemente
    // - Turnos ya reservados
    // - Duración configurable de turnos
    const resultado = await calcularSlotsDisponibles(fecha, barberoId);

    // Si no está disponible, retornar array vacío
    if (!resultado.disponible) {
      console.log(`[DEBUG obtenerHorariosDisponibles] No disponible: ${resultado.motivo}`);
      return [];
    }

    // Filtrar horarios pasados si la fecha es hoy
    const ahora = new Date();
    const [anio, mes, dia] = fecha.split('-').map(Number);

    // Comparar fechas en hora local (no UTC)
    const fechaSeleccionada = new Date(anio, mes - 1, dia);
    fechaSeleccionada.setHours(0, 0, 0, 0);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const esMismoDia = fechaSeleccionada.getTime() === hoy.getTime();

    let slotsDisponibles = resultado.slots;

    if (esMismoDia) {
      const horaActual = ahora.getHours();
      const minutoActual = ahora.getMinutes();

      console.log(`[DEBUG] Es hoy! Hora actual: ${horaActual}:${minutoActual}`);

      slotsDisponibles = slotsDisponibles.filter(hora => {
        const [horaNum, minutoNum] = hora.split(':').map(Number);

        // Crear fecha del horario del turno en hora local
        const fechaHoraTurno = new Date(anio, mes - 1, dia, horaNum, minutoNum, 0, 0);

        // Calcular minutos de anticipación
        const minutosDeAnticipacion = Math.floor((fechaHoraTurno - ahora) / 60000);

        console.log(`[DEBUG] Horario ${hora}: minutos de anticipación = ${minutosDeAnticipacion}`);

        // Primero filtrar horarios pasados
        if (minutosDeAnticipacion <= 0) {
          console.log(`[DEBUG] Horario ${hora} filtrado: ya pasó (${minutosDeAnticipacion} min)`);
          return false;
        }

        // SIEMPRE requiere 25 minutos de anticipación mínima
        if (minutosDeAnticipacion < 25) {
          console.log(`[DEBUG] Horario ${hora} filtrado: solo ${minutosDeAnticipacion} min de anticipación (requiere mínimo 25 min)`);
          return false;
        }

        return true;
      });

      console.log(`[DEBUG] Horarios después de filtrar: ${slotsDisponibles.length}`);
    }

    console.log(`[DEBUG obtenerHorariosDisponibles] Slots disponibles finales: ${slotsDisponibles.length}`);
    return slotsDisponibles;
  } catch (error) {
    throw new Error(`Error al obtener horarios disponibles: ${error.message}`);
  }
};


export const obtenerDisponibilidadParaTurnos = async (idsTurnos) => {
  try {
    if (!idsTurnos || idsTurnos.length === 0) {
      return {};
    }

    // 0. Obtener configuración para duración de turnos
    const config = await obtenerConfiguracion();
    const duracionTurno = config.duracionTurnoMinutos;

    // 1. Obtener los turnos a verificar (con cliente)
    const turnosAVerificar = await Turno.find({ _id: { $in: idsTurnos } })
      .populate('servicio', 'nombre')
      .populate('cliente', 'nombre apellido');

    if (turnosAVerificar.length === 0) {
      return {};
    }

    // 2. Obtener todos los barberos activos
    const barberosActivos = await Barbero.find({ activo: true }, '_id nombre');

    // 3. Obtener todas las fechas únicas de los turnos a verificar
    const fechasUnicas = [...new Set(turnosAVerificar.map(t => t.fecha.toISOString().split('T')[0]))];

    // 4. Obtener TODOS los turnos (con barbero) en esas fechas para verificar conflictos
    const turnosOcupados = await Turno.find({
      fecha: { $in: fechasUnicas.map(f => _crearRangoFechaDia(f)) },
      barbero: { $exists: true },
      estado: 'reservado'
    });

    // 5. Procesar la disponibilidad
    const disponibilidadFinal = {};

    for (const turno of turnosAVerificar) {
      const turnoIdStr = turno._id.toString();
      const fechaTurnoStr = turno.fecha.toISOString().split('T')[0];
      disponibilidadFinal[turnoIdStr] = [];

      for (const barbero of barberosActivos) {
        const barberoIdStr = barbero._id.toString();

        // Filtrar los turnos ocupados solo para este barbero y esta fecha
        const turnosDelBarberoEnFecha = turnosOcupados.filter(t =>
          t.barbero.toString() === barberoIdStr &&
          t.fecha.toISOString().split('T')[0] === fechaTurnoStr
        );

        // Verificar conflicto
        const tieneConflicto = _verificarConflicto(turno, turnosDelBarberoEnFecha, duracionTurno);

        disponibilidadFinal[turnoIdStr].push({
          _id: barbero._id,
          nombre: barbero.nombre,
          isDisponible: !tieneConflicto
        });
      }
    }

    return disponibilidadFinal;

  } catch (error) {
    console.error("Error en obtenerDisponibilidadParaTurnos:", error);
    throw new Error(`Error al verificar disponibilidad: ${error.message}`);
  }
};

/**
 * CANCELAR TURNOS PENDIENTES EXPIRADOS
 * Busca turnos con estado 'pendiente' cuya fechaExpiracion ya pasó y los cancela automáticamente
 */

export default {
  obtenerDiasDisponibles,
  obtenerHorariosDisponibles,
  obtenerDisponibilidadParaTurnos,
};
