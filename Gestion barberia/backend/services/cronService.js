import cron from 'node-cron';
import Turno from '../models/Turno.js';
import Cliente from '../models/Cliente.js';
import Barbero from '../models/Barbero.js';
import Servicio from '../models/Servicio.js';
import {
  enviarRecordatorioCliente,
  enviarRecordatorioBarbero,
} from './emailService.js';
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
    // Buscamos turnos que estén entre 30 y 35 minutos en el futuro
    const tiempoMinimo = new Date(ahora.getTime() + anticipacionMinutos * 60000);
    const tiempoMaximo = new Date(ahora.getTime() + (anticipacionMinutos + 5) * 60000);

    // Buscar turnos pendientes o confirmados que necesitan recordatorio
    const turnos = await Turno.find({
      recordatorioEnviado: false,
      estado: { $in: ['pendiente', 'confirmado'] },
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
          `📧 Enviando recordatorios para turno de ${turno.cliente.nombre} ${turno.cliente.apellido} - ${turno.hora}`
        );

        // Enviar recordatorios (no bloquear si falla uno)
        const [clienteEnviado, barberoEnviado] = await Promise.allSettled([
          enviarRecordatorioCliente(turno, turno.cliente, turno.barbero, turno.servicio),
          enviarRecordatorioBarbero(turno, turno.cliente, turno.barbero, turno.servicio),
        ]);

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

    // Buscar turnos confirmados cuya fecha + hora + duración ya pasó
    const turnos = await Turno.find({
      estado: 'confirmado',
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
      const duracionServicio = turno.servicio?.duracion || 30;

      // Construir la fecha y hora de finalización del turno
      const [horas, minutos] = turno.hora.split(':');
      const fechaHoraInicio = new Date(turno.fecha);
      fechaHoraInicio.setHours(parseInt(horas), parseInt(minutos), 0, 0);

      // Calcular la hora de finalización (inicio + duración)
      const fechaHoraFin = new Date(fechaHoraInicio.getTime() + duracionServicio * 60000);

      // Si ya pasó la hora de finalización, marcar como completado y pagado
      if (ahora >= fechaHoraFin) {
        turno.estado = 'completado';
        turno.pagado = true; // Marcar automáticamente como pagado
        await turno.save();
        turnosCompletados++;

        console.log(
          `✅ Turno completado y pagado automáticamente: ${turno._id} - Cliente: ${turno.cliente} - Fecha: ${turno.fecha.toISOString().split('T')[0]} ${turno.hora}`
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
