import cron from 'node-cron';
import Turno from '../models/Turno.js';
import Usuario from '../models/Usuario.js';
import { enviarRecordatorioClienteWhatsApp, enviarReporteDiarioAdminWhatsApp } from './whatsappService.js';
import { obtenerEstadisticasDiarias } from './estadisticasService.js';
import dotenv from 'dotenv';

dotenv.config();

// Envía recordatorios de WhatsApp para turnos próximos.
const verificarTurnosProximos = async () => {
  try {
    const ahora = new Date();
    const anticipacionMinutos = parseInt(process.env.ANTICIPACION_RECORDATORIO_MINUTOS) || 30;
    const intervaloCron = 5;

    // Ventana normal: 30-35 minutos antes del turno
    const tiempoMinimo = new Date(ahora.getTime() + anticipacionMinutos * 60000);
    const tiempoMaximo = new Date(ahora.getTime() + (anticipacionMinutos + intervaloCron) * 60000);

    // Para turnos reservados con poca anticipación: enviar inmediatamente si faltan menos de 30 min
    const tiempoMinimoInmediato = ahora;
    const tiempoMaximoInmediato = new Date(ahora.getTime() + anticipacionMinutos * 60000);

    const turnos = await Turno.find({
      recordatorioEnviado: false,
      estado: 'reservado',
      fecha: { $gte: new Date().setHours(0, 0, 0, 0) },
    }).populate('cliente barbero servicio');

    if (!turnos.length) return;

    let recordatoriosEnviados = 0;

    for (const turno of turnos) {
      const [horas, minutos] = turno.hora.split(':');

      // Construir la fecha+hora del turno usando UTC para evitar problemas de zona horaria
      const fechaTurnoUTC = new Date(turno.fecha);
      const año = fechaTurnoUTC.getUTCFullYear();
      const mes = fechaTurnoUTC.getUTCMonth();
      const dia = fechaTurnoUTC.getUTCDate();

      // Crear fecha con la hora del turno en hora LOCAL
      const fechaTurno = new Date(año, mes, dia, parseInt(horas), parseInt(minutos), 0, 0);

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
          turno.recordatorioEnviado = true;
          await turno.save();
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

// Marca como "completado" los turnos que ya finalizaron.
const completarTurnosFinalizados = async () => {
  try {
    const ahora = new Date();

    // Buscar turnos reservados de hoy o anteriores
    // No podemos filtrar por hora aquí porque la fecha está en UTC 00:00
    const finDelDia = new Date();
    finDelDia.setHours(23, 59, 59, 999);

    const turnos = await Turno.find({
      estado: 'reservado',
      fecha: { $lte: finDelDia },
    }).populate('servicio');

    if (!turnos.length) return;

    let turnosCompletados = 0;

    const promesas = turnos.map(async (turno) => {
      const duracion = turno.servicio?.duracion || 45;
      const [horas, minutos] = turno.hora.split(':');

      // Construir la fecha+hora del turno usando UTC para evitar problemas de zona horaria
      // turno.fecha está en UTC 00:00:00, necesitamos agregarle la hora local del turno
      const fechaTurnoUTC = new Date(turno.fecha);

      // Obtener el año, mes, día en UTC
      const año = fechaTurnoUTC.getUTCFullYear();
      const mes = fechaTurnoUTC.getUTCMonth();
      const dia = fechaTurnoUTC.getUTCDate();

      // Crear fecha con la hora del turno en hora LOCAL (no UTC)
      // Esto respeta la zona horaria de Argentina
      const fechaTurno = new Date(año, mes, dia, parseInt(horas), parseInt(minutos), 0, 0);

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
        turno.estado = 'completado';
        turnosCompletados++;
        console.log(`✅ Turno ${turno._id} completado (${turno.hora} + ${duracion}min)`);
        return turno.save();
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

// Inicializa y programa las tareas automáticas.
export const iniciarCronJobs = () => {
  console.log('⏰ Iniciando cron jobs...');

  // Recordatorios 30 min antes (cada 5 minutos)
  cron.schedule('*/5 * * * *', verificarTurnosProximos);

  // Completar turnos finalizados (cada 10 minutos)
  cron.schedule('*/10 * * * *', completarTurnosFinalizados);

  // Reporte diario al admin (después del último turno)
  // Lun-Vie: 20:30 (último turno es 19:15 + 45min = 20:00)
  // Sábado: 18:30 (último turno es 17:00 + 60min = 18:00, con margen)
  cron.schedule('30 20 * * 1-5', enviarReporteDiario); // Lunes a Viernes a las 20:30
  cron.schedule('30 18 * * 6', enviarReporteDiario);   // Sábados a las 18:30

  console.log('✅ Cron jobs iniciados:');
  console.log('  - Recordatorios cada 5 minutos');
  console.log('  - Completar turnos cada 10 minutos');
  console.log('  - Reporte diario: Lun-Vie 20:30, Sáb 18:30');
};

export default {
  iniciarCronJobs,
  verificarTurnosProximos,
  completarTurnosFinalizados,
  enviarReporteDiario,
};
