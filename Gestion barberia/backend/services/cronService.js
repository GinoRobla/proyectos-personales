import cron from 'node-cron';
import Turno from '../models/Turno.js';
import { enviarRecordatorioClienteWhatsApp } from './whatsappService.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Servicio de Cron Jobs
 * Ejecuta tareas programadas automáticamente
 */

/**
 * Verificar turnos próximos y enviar recordatorios
 * Se ejecuta cada 5 minutos
 */
const verificarTurnosProximos = async () => {
  try {
    console.log('🔍 Verificando turnos próximos...');

    const ahora = new Date();
    const anticipacionMinutos = parseInt(process.env.ANTICIPACION_RECORDATORIO_MINUTOS) || 30;

    // Calcular la ventana de tiempo para los recordatorios
    // Buscamos turnos que estén entre ahora y los próximos 5 minutos + anticipación
    // Por ejemplo: Si son las 11:05 y anticipación es 30 min, buscamos turnos entre 11:35 y 11:40
    const tiempoMinimo = new Date(ahora.getTime() + anticipacionMinutos * 60000);
    const tiempoMaximo = new Date(ahora.getTime() + (anticipacionMinutos + 5) * 60000);

    // Buscar turnos reservados que necesitan recordatorio
    const turnos = await Turno.find({
      recordatorioEnviado: false,
      estado: 'reservado',
      fecha: {
        $gte: new Date(ahora.setHours(0, 0, 0, 0)), // Desde hoy
        $lte: new Date(ahora.setHours(23, 59, 59, 999)), // Hasta hoy
      },
    })
      .populate('cliente')
      .populate('barbero')
      .populate('servicio');

    if (turnos.length === 0) {
      console.log('ℹ️ No hay turnos pendientes de recordatorio');
      return;
    }

    // Filtrar turnos que están en la ventana de tiempo
    for (const turno of turnos) {
      const [horas, minutos] = turno.hora.split(':');
      const fechaTurno = new Date(turno.fecha);
      fechaTurno.setHours(parseInt(horas), parseInt(minutos), 0, 0);

      // Verificar si el turno está en la ventana de tiempo
      if (fechaTurno >= tiempoMinimo && fechaTurno <= tiempoMaximo) {
        console.log(
          `📱 Enviando recordatorio por WhatsApp para turno de ${turno.cliente.nombre} ${turno.cliente.apellido} - ${turno.hora}`
        );

        // Enviar SOLO recordatorio al CLIENTE por WHATSAPP
        try {
          await enviarRecordatorioClienteWhatsApp(turno, turno.cliente, turno.barbero, turno.servicio);
          console.log(`✅ Recordatorio WhatsApp enviado al cliente`);
        } catch (error) {
          console.error(`❌ Error al enviar recordatorio WhatsApp:`, error.message);
        }

        // Marcar el turno como recordatorio enviado
        turno.recordatorioEnviado = true;
        await turno.save();

        console.log(`✅ Recordatorios enviados para turno ${turno._id}`);
      }
    }
  } catch (error) {
    console.error('❌ Error al verificar turnos próximos:', error.message);
  }
};

/**
 * Completar automáticamente turnos finalizados
 * Se ejecuta cada 10 minutos
 */
const completarTurnosFinalizados = async () => {
  try {
    console.log('🔍 Verificando turnos finalizados...');

    const ahora = new Date();

    // Buscar turnos reservados cuya fecha + hora + duración ya pasó
    const turnos = await Turno.find({
      estado: 'reservado',
      fecha: {
        $lte: ahora, // Fecha menor o igual a hoy
      },
    }).populate('servicio');

    if (turnos.length === 0) {
      console.log('ℹ️ No hay turnos para completar automáticamente');
      return;
    }

    let turnosCompletados = 0;

    for (const turno of turnos) {
      // Obtener la duración del servicio (en minutos)
      const duracionServicio = turno.servicio?.duracion || 45;

      // Construir la fecha y hora de inicio del turno en hora local
      const [horas, minutos] = turno.hora.split(':');

      // Obtener la fecha en formato local (YYYY-MM-DD)
      const fechaString = turno.fecha.toISOString().split('T')[0];
      const [anio, mes, dia] = fechaString.split('-').map(Number);

      // Crear fecha y hora en hora local de Argentina (UTC-3)
      const fechaHoraInicio = new Date(anio, mes - 1, dia, parseInt(horas), parseInt(minutos), 0, 0);

      // Calcular la hora de finalización (inicio + duración del servicio)
      const fechaHoraFin = new Date(fechaHoraInicio.getTime() + duracionServicio * 60000);

      // Si ya pasó la hora de finalización, marcar como completado
      if (ahora >= fechaHoraFin) {
        turno.estado = 'completado';
        await turno.save();
        turnosCompletados++;

        console.log(
          `✅ Turno completado automáticamente: ${turno._id} - ${fechaString} ${turno.hora} (fin: ${fechaHoraFin.toLocaleTimeString('es-AR')})`
        );
      }
    }

    if (turnosCompletados > 0) {
      console.log(`✅ Total de turnos completados automáticamente: ${turnosCompletados}`);
    }
  } catch (error) {
    console.error('❌ Error al completar turnos finalizados:', error.message);
  }
};

/**
 * Inicializar todos los cron jobs
 */
export const iniciarCronJobs = () => {
  console.log('⏰ Iniciando cron jobs...');

  // Ejecutar cada 5 minutos: '*/5 * * * *'
  cron.schedule('*/5 * * * *', () => {
    console.log('⏰ Ejecutando verificación de turnos próximos...');
    verificarTurnosProximos();
  });

  // Ejecutar cada 10 minutos: '*/10 * * * *'
  cron.schedule('*/10 * * * *', () => {
    console.log('⏰ Ejecutando completado automático de turnos...');
    completarTurnosFinalizados();
  });

  console.log('✅ Cron jobs iniciados correctamente');
  console.log('   - Verificación de turnos próximos: cada 5 minutos');
  console.log('   - Completado automático de turnos: cada 10 minutos');

  // Ejecutar inmediatamente al iniciar (opcional)
  verificarTurnosProximos();
  completarTurnosFinalizados();
};

export default {
  iniciarCronJobs,
  verificarTurnosProximos,
  completarTurnosFinalizados,
};
