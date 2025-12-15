import cron from 'node-cron';
import Turno from '../models/Turno.js';
import Usuario from '../models/Usuario.js';
import DisponibilidadGeneral from '../models/DisponibilidadGeneral.js';
import { enviarRecordatorioClienteWhatsApp, enviarReporteDiarioAdminWhatsApp, enviarRecordatorioPagoPendiente } from './whatsappService.js';
import { obtenerEstadisticasDiarias } from './estadisticasService.js';
import { obtenerConfiguracion } from './configuracionService.js';
import { cancelarTurnosPendientesExpirados } from './turnos/turnoCancelacion.js';
import dotenv from 'dotenv';

dotenv.config();

// Envía recordatorios de WhatsApp para turnos próximos.
const verificarTurnosProximos = async () => {
  try {
    const ahora = new Date();
    const anticipacionMinutos = parseInt(process.env.ANTICIPACION_RECORDATORIO_MINUTOS) || 30;
    const intervaloCron = 5; // Optimizado a 5 minutos para mayor precisión

    // Ventana normal: 30-35 minutos antes del turno
    const tiempoMinimo = new Date(ahora.getTime() + anticipacionMinutos * 60000);
    const tiempoMaximo = new Date(ahora.getTime() + (anticipacionMinutos + intervaloCron) * 60000);

    // Para turnos reservados con poca anticipación: enviar inmediatamente si faltan menos de 30 min
    const tiempoMinimoInmediato = ahora;
    const tiempoMaximoInmediato = new Date(ahora.getTime() + anticipacionMinutos * 60000);

    // OPTIMIZACIÓN: Solo buscar turnos de hoy y mañana (no toda la colección)
    const hoy = new Date();
    hoy.setUTCHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setUTCDate(manana.getUTCDate() + 2); // Hasta el día siguiente completo

    const turnos = await Turno.find({
      recordatorioEnviado: false,
      estado: 'reservado',
      fecha: {
        $gte: hoy,
        $lt: manana  // NUEVO: Solo hoy y mañana
      },
    })
    .populate('cliente barbero servicio')
    .lean(); // OPTIMIZACIÓN: usar lean() para obtener objetos planos (más rápido)

    if (!turnos.length) return;

    let recordatoriosEnviados = 0;

    for (const turno of turnos) {
      const [horas, minutos] = turno.hora.split(':');

      // [FIX] Construir la fecha+hora del turno correctamente en timezone de Argentina
      // turno.fecha está en UTC (ej: 2025-12-15T00:00:00.000Z representa el 14/12 en ARG)
      // turno.hora está en hora local de Argentina (ej: "22:30")
      const fechaTurnoUTC = new Date(turno.fecha);
      const año = fechaTurnoUTC.getUTCFullYear();
      const mes = fechaTurnoUTC.getUTCMonth();
      const dia = fechaTurnoUTC.getUTCDate();

      // IMPORTANTE: Crear fecha en UTC y luego ajustar a hora local Argentina (UTC-3)
      // Primero creamos la fecha base en UTC a las 00:00
      const fechaTurno = new Date(Date.UTC(año, mes, dia, 0, 0, 0, 0));
      // Luego le sumamos las horas y minutos del turno (que están en hora local)
      // Como Argentina es UTC-3, debemos sumar 3 horas para convertir hora local a UTC
      fechaTurno.setUTCHours(parseInt(horas) + 3, parseInt(minutos), 0, 0);

      // Calcular minutos hasta el turno
      const minutosHastaTurno = Math.floor((fechaTurno - ahora) / 60000);

      // Condición 1: Ventana normal (30-35 min antes)
      const dentroVentanaNormal = fechaTurno >= tiempoMinimo && fechaTurno <= tiempoMaximo;

      // Condición 2: Turno reservado con poca anticipación (menos de 30 min y no ha pasado)
      const reservadoConPocaAnticipacion =
        fechaTurno >= tiempoMinimoInmediato &&
        fechaTurno < tiempoMaximoInmediato;

      if (dentroVentanaNormal || reservadoConPocaAnticipacion) {
        try {
          await enviarRecordatorioClienteWhatsApp(turno, turno.cliente, turno.barbero, turno.servicio);

          // OPTIMIZACIÓN: Actualizar directamente en BD sin cargar el documento completo
          await Turno.updateOne(
            { _id: turno._id },
            { $set: { recordatorioEnviado: true } }
          );
          recordatoriosEnviados++;

          const tipoRecordatorio = dentroVentanaNormal ? '30 min antes' : 'inmediato';
          console.log(`✅ Recordatorio ${tipoRecordatorio} enviado para turno ${turno._id} (${turno.hora}, faltan ${minutosHastaTurno} min)`);
        } catch (error) {
          console.error(`❌ Error al enviar recordatorio para el turno ${turno._id}:`, error.message);
        }
      }
    }

    if (recordatoriosEnviados > 0) {
      console.log(`✅ Total de recordatorios enviados: ${recordatoriosEnviados}`);
    }
  } catch (error) {
    console.error('❌ Error al verificar turnos próximos:', error.message);
  }
};

// Envía recordatorios de pago pendiente a clientes que no han completado el pago
// NUEVA LÓGICA: Recordatorio a los 5 minutos de crear el turno (solo si el turno es al menos 20 min en el futuro)
const verificarPagosPendientes = async () => {
  try {
    console.log('[RECORDATORIO PAGO] Verificando turnos pendientes...');
    const ahora = new Date();

    // Buscar turnos pendientes creados hace ~5 minutos (ventana de 3-7 min para el cron de 5 min)
    const hace7Min = new Date(ahora.getTime() - 7 * 60000);
    const hace3Min = new Date(ahora.getTime() - 3 * 60000);

    console.log(`[RECORDATORIO PAGO] Ventana de búsqueda: ${hace7Min.toLocaleString('es-AR')} a ${hace3Min.toLocaleString('es-AR')}`);

    const turnosPendientes = await Turno.find({
      estado: 'pendiente',
      requiereSena: true,
      recordatorioPagoEnviado: { $ne: true },
      createdAt: {
        $gte: hace7Min,
        $lte: hace3Min
      }
    })
    .populate('cliente barbero servicio pago')
    .lean();

    console.log(`[RECORDATORIO PAGO] Encontrados ${turnosPendientes.length} turnos pendientes en la ventana`);

    if (!turnosPendientes.length) return;

    let recordatoriosEnviados = 0;

    for (const turno of turnosPendientes) {
      try {
        console.log(`[RECORDATORIO PAGO] Procesando turno ${turno._id}:`, {
          createdAt: new Date(turno.createdAt).toLocaleString('es-AR'),
          hora: turno.hora,
          fecha: new Date(turno.fecha).toLocaleDateString('es-AR'),
        });

        // [FIX] Verificar que el turno sea al menos 20 minutos en el futuro
        const fechaTurnoUTC = new Date(turno.fecha);
        const año = fechaTurnoUTC.getUTCFullYear();
        const mes = fechaTurnoUTC.getUTCMonth();
        const dia = fechaTurnoUTC.getUTCDate();
        const [hora, minuto] = turno.hora.split(':').map(Number);

        // Crear fecha en UTC y ajustar a hora local Argentina (UTC-3)
        const fechaHoraTurno = new Date(Date.UTC(año, mes, dia, 0, 0, 0, 0));
        fechaHoraTurno.setUTCHours(hora + 3, minuto, 0, 0);

        const minutosHastaTurno = Math.floor((fechaHoraTurno - ahora) / 60000);

        console.log(`[RECORDATORIO PAGO] Minutos hasta el turno: ${minutosHastaTurno}`);

        // Enviar recordatorio solo si el turno no está en el pasado
        if (minutosHastaTurno < 0) {
          console.log(`⚠️  [RECORDATORIO PAGO] Turno ${turno._id} ya pasó (${minutosHastaTurno} min). No se envía recordatorio.`);
          // Marcar como enviado para no volver a intentar
          await Turno.updateOne(
            { _id: turno._id },
            { $set: { recordatorioPagoEnviado: true } }
          );
          continue;
        }

        await enviarRecordatorioPagoPendiente(turno, turno.cliente, turno.barbero, turno.servicio);

        // Marcar como enviado
        await Turno.updateOne(
          { _id: turno._id },
          { $set: { recordatorioPagoEnviado: true } }
        );

        recordatoriosEnviados++;
        console.log(`✅ [RECORDATORIO PAGO] Recordatorio enviado para turno ${turno._id} (turno en ${minutosHastaTurno} min)`);
      } catch (error) {
        console.error(`❌ [RECORDATORIO PAGO] Error al enviar recordatorio para turno ${turno._id}:`, error.message);
      }
    }

    if (recordatoriosEnviados > 0) {
      console.log(`✅ [RECORDATORIO PAGO] Total de recordatorios enviados: ${recordatoriosEnviados}`);
    }
  } catch (error) {
    console.error('❌ [RECORDATORIO PAGO] Error al verificar pagos pendientes:', error.message);
  }
};

// Marca como "completado" los turnos que ya finalizaron.
const completarTurnosFinalizados = async () => {
  try {
    const ahora = new Date();

    // OPTIMIZACIÓN: Solo buscar turnos de los últimos 3 días (no todo el histórico)
    const hace3Dias = new Date();
    hace3Dias.setDate(hace3Dias.getDate() - 3);
    hace3Dias.setHours(0, 0, 0, 0);

    const finDelDia = new Date();
    finDelDia.setHours(23, 59, 59, 999);

    const turnos = await Turno.find({
      estado: 'reservado',
      fecha: {
        $gte: hace3Dias,  // NUEVO: Solo últimos 3 días
        $lte: finDelDia
      },
    })
    .populate('servicio')
    .lean(); // OPTIMIZACIÓN: objetos planos

    if (!turnos.length) return;

    let turnosCompletados = 0;

    const promesas = turnos.map(async (turno) => {
      const duracion = turno.servicio?.duracion || 45;
      const [horas, minutos] = turno.hora.split(':');

      // [FIX] Construir la fecha+hora del turno correctamente en timezone de Argentina
      // turno.fecha está en UTC (ej: 2025-12-15T00:00:00.000Z representa el 14/12 en ARG)
      // turno.hora está en hora local de Argentina (ej: "22:30")
      const fechaTurnoUTC = new Date(turno.fecha);

      // Obtener el año, mes, día en UTC
      const año = fechaTurnoUTC.getUTCFullYear();
      const mes = fechaTurnoUTC.getUTCMonth();
      const dia = fechaTurnoUTC.getUTCDate();

      // IMPORTANTE: Crear fecha en UTC y luego ajustar a hora local Argentina (UTC-3)
      // Primero creamos la fecha base en UTC a las 00:00
      const fechaTurno = new Date(Date.UTC(año, mes, dia, 0, 0, 0, 0));
      // Luego le sumamos las horas y minutos del turno (que están en hora local)
      // Como Argentina es UTC-3, debemos sumar 3 horas para convertir hora local a UTC
      fechaTurno.setUTCHours(parseInt(horas) + 3, parseInt(minutos), 0, 0);

      // Calcular la fecha+hora de finalización del turno
      const fechaFin = new Date(fechaTurno.getTime() + duracion * 60000);

      // DEBUG: Logs detallados
      console.log(`[DEBUG completar] Turno ${turno._id}:`);
      console.log(`  - Hora turno: ${turno.hora}`);
      console.log(`  - turno.fecha (DB UTC): ${turno.fecha.toISOString()}`);
      console.log(`  - Fecha extraída (año/mes/dia): ${año}-${mes + 1}-${dia}`);
      console.log(`  - fechaTurno (local ${horas}:${minutos}): ${fechaTurno.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })} (${fechaTurno.toISOString()})`);
      console.log(`  - fechaFin (+ ${duracion}min): ${fechaFin.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })} (${fechaFin.toISOString()})`);
      console.log(`  - ahora: ${ahora.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })} (${ahora.toISOString()})`);
      console.log(`  - ahora >= fechaFin: ${ahora >= fechaFin}`);

      // Solo marcar como completado si ya pasó la hora de finalización
      if (ahora >= fechaFin) {
        // OPTIMIZACIÓN: Actualizar directamente en BD sin cargar el documento completo
        await Turno.updateOne(
          { _id: turno._id },
          { $set: { estado: 'completado' } }
        );
        turnosCompletados++;
        console.log(`✅ Turno ${turno._id} completado (${turno.hora} + ${duracion}min)`);
      } else {
        console.log(`⏳ Turno ${turno._id} aún no termina (falta ${Math.floor((fechaFin - ahora) / 60000)} min)`);
      }
    });

    await Promise.all(promesas);

    if (turnosCompletados > 0) {
      console.log(`✅ Total de turnos completados: ${turnosCompletados}`);
    }
  } catch (error) {
    console.error('❌ Error al completar turnos:', error.message);
  }
};

// Envía reporte diario al admin después del último turno
const enviarReporteDiario = async () => {
  try {
    // 1. Obtener el admin (buscar el primer usuario con rol 'admin')
    const admin = await Usuario.findOne({ rol: 'admin', activo: true });

    if (!admin || !admin.telefono) {
      console.log('ℹ️ No hay admin con teléfono configurado, no se envía reporte');
      return;
    }

    // 2. Obtener estadísticas del día
    const estadisticas = await obtenerEstadisticasDiarias();

    // 3. Construir el enlace a las estadísticas del admin
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const enlaceEstadisticas = `${frontendUrl}/admin/estadisticas`;

    // 4. Enviar el reporte por WhatsApp
    await enviarReporteDiarioAdminWhatsApp(admin.telefono, estadisticas, enlaceEstadisticas);

    console.log(`✅ Reporte diario enviado al admin: ${admin.nombre} ${admin.apellido}`);
  } catch (error) {
    console.error('❌ Error al enviar reporte diario:', error.message);
  }
};

/**
 * Calcula el horario para enviar el reporte diario basándose en el último turno del día + duración
 * Retorna un objeto con los cron schedules para cada día de la semana
 */
const calcularHorarioReporteDiario = async () => {
  try {
    const config = await obtenerConfiguracion();
    const duracionTurno = config.duracionTurnoMinutos || 45;
    const margenSeguridad = 30; // 30 minutos adicionales de margen

    // Obtener todas las disponibilidades configuradas
    const disponibilidades = await DisponibilidadGeneral.find({ activo: true });

    const horariosReporte = {};

    for (const disp of disponibilidades) {
      // Parsear horaFin (ej: "20:00")
      const [hora, minuto] = disp.horaFin.split(':').map(Number);

      // Crear objeto Date para calcular hora + duración + margen
      const fechaBase = new Date();
      fechaBase.setHours(hora, minuto, 0, 0);

      // Agregar duración del turno + margen de seguridad
      const horaReporte = new Date(fechaBase.getTime() + (duracionTurno + margenSeguridad) * 60000);

      const horaFinal = horaReporte.getHours();
      const minutoFinal = horaReporte.getMinutes();

      horariosReporte[disp.diaSemana] = {
        hora: horaFinal,
        minuto: minutoFinal,
        cronExpression: `${minutoFinal} ${horaFinal} * * ${disp.diaSemana}`
      };
    }

    return horariosReporte;
  } catch (error) {
    console.error('❌ Error al calcular horario de reporte diario:', error.message);
    // Retornar horarios por defecto en caso de error
    return {
      1: { hora: 20, minuto: 30, cronExpression: '30 20 * * 1' }, // Lunes
      2: { hora: 20, minuto: 30, cronExpression: '30 20 * * 2' }, // Martes
      3: { hora: 20, minuto: 30, cronExpression: '30 20 * * 3' }, // Miércoles
      4: { hora: 20, minuto: 30, cronExpression: '30 20 * * 4' }, // Jueves
      5: { hora: 20, minuto: 30, cronExpression: '30 20 * * 5' }, // Viernes
      6: { hora: 18, minuto: 30, cronExpression: '30 18 * * 6' }, // Sábado
    };
  }
};

/**
 * CRON JOB CONSOLIDADO - Se ejecuta cada 5 minutos
 * Agrupa todas las tareas periódicas en un solo job para mejor eficiencia
 */
const ejecutarTareasConsolidadas = async () => {
  console.log('⏰ [CRON] Ejecutando tareas consolidadas...');

  try {
    // 1. Verificar turnos próximos y enviar recordatorios
    await verificarTurnosProximos();

    // 2. Verificar pagos pendientes próximos a expirar
    await verificarPagosPendientes();

    // 3. Completar turnos que ya finalizaron
    await completarTurnosFinalizados();

    // 4. Limpiar turnos pendientes expirados (sin pago después de 15 min)
    const resultado = await cancelarTurnosPendientesExpirados();
    if (resultado.cancelados > 0) {
      console.log(`✅ [CRON] ${resultado.cancelados} turnos expirados cancelados`);
    }

    console.log('✅ [CRON] Tareas consolidadas completadas');
  } catch (error) {
    console.error('❌ [CRON] Error en tareas consolidadas:', error.message);
  }
};

// Inicializa y programa las tareas automáticas.
export const iniciarCronJobs = async () => {
  console.log('⏰ Iniciando cron jobs consolidados y optimizados...');

  // CRON CONSOLIDADO: Cada 5 minutos (optimizado para mayor precisión)
  // Incluye: recordatorios, pagos pendientes, completar turnos, limpiar expirados
  cron.schedule('*/5 * * * *', ejecutarTareasConsolidadas);
  console.log('✅ Cron job consolidado programado (cada 5 minutos - optimizado)');
  console.log('   → Recordatorios WhatsApp (30-35 min antes del turno)');
  console.log('   → Recordatorios de pago pendiente (5 min después de reservar)');
  console.log('   → Completar turnos finalizados (últimos 3 días)');
  console.log('   → Cancelar turnos pendientes expirados (15 min sin pago)');

  // REPORTE DIARIO AL ADMIN: Dinámico según horario de cierre
  const horariosReporte = await calcularHorarioReporteDiario();

  console.log('\n📊 Programando reportes diarios al admin:');
  const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  for (const [dia, config] of Object.entries(horariosReporte)) {
    cron.schedule(config.cronExpression, enviarReporteDiario);
    console.log(`   → ${nombresDias[dia]}: ${String(config.hora).padStart(2, '0')}:${String(config.minuto).padStart(2, '0')}`);
  }

  console.log('\n✅ Todos los cron jobs iniciados correctamente\n');
};

export default {
  iniciarCronJobs,
  verificarTurnosProximos,
  completarTurnosFinalizados,
  enviarReporteDiario,
  ejecutarTareasConsolidadas,
};
