import cron from 'node-cron';
import Turno from '../models/Turno.js';
import { enviarRecordatorioClienteWhatsApp } from './whatsappService.js';
import dotenv from 'dotenv';

dotenv.config();

// Envía recordatorios de WhatsApp para turnos próximos.
const verificarTurnosProximos = async () => {
  try {
    const ahora = new Date();
    const anticipacionMinutos = parseInt(process.env.ANTICIPACION_RECORDATORIO_MINUTOS) || 30;
    const intervaloCron = 5;

    const tiempoMinimo = new Date(ahora.getTime() + anticipacionMinutos * 60000);
    const tiempoMaximo = new Date(ahora.getTime() + (anticipacionMinutos + intervaloCron) * 60000);

    const turnos = await Turno.find({
      recordatorioEnviado: false,
      estado: 'reservado',
      fecha: { $gte: new Date().setHours(0, 0, 0, 0) },
    }).populate('cliente barbero servicio');

    if (!turnos.length) return;

    for (const turno of turnos) {
      const [horas, minutos] = turno.hora.split(':');
      const fechaTurno = new Date(turno.fecha);
      fechaTurno.setHours(parseInt(horas), parseInt(minutos));

      if (fechaTurno >= tiempoMinimo && fechaTurno <= tiempoMaximo) {
        try {
          await enviarRecordatorioClienteWhatsApp(turno, turno.cliente, turno.barbero, turno.servicio);
          turno.recordatorioEnviado = true;
          await turno.save();
          console.log(`✅ Recordatorio enviado para el turno ${turno._id}`);
        } catch (error) {
          console.error(`❌ Error al enviar recordatorio para el turno ${turno._id}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error al verificar turnos próximos:', error.message);
  }
};

// Marca como "completado" los turnos que ya finalizaron.
const completarTurnosFinalizados = async () => {
  try {
    const ahora = new Date();
    const turnos = await Turno.find({
      estado: 'reservado',
      fecha: { $lte: ahora },
    }).populate('servicio');

    if (!turnos.length) return;

    const promesas = turnos.map(async (turno) => {
      const duracion = turno.servicio?.duracion || 45;
      const [horas, minutos] = turno.hora.split(':');
      const fechaTurno = new Date(turno.fecha);
      fechaTurno.setHours(parseInt(horas), parseInt(minutos));
      
      const fechaFin = new Date(fechaTurno.getTime() + duracion * 60000);

      if (ahora >= fechaFin) {
        turno.estado = 'completado';
        return turno.save();
      }
    });

    await Promise.all(promesas);
  } catch (error) {
    console.error('❌ Error al completar turnos:', error.message);
  }
};

// Inicializa y programa las tareas automáticas.
export const iniciarCronJobs = () => {
  console.log('⏰ Iniciando cron jobs...');
  cron.schedule('*/5 * * * *', verificarTurnosProximos);
  cron.schedule('*/10 * * * *', completarTurnosFinalizados);
  console.log('✅ Cron jobs iniciados.');
};

export default {
  iniciarCronJobs,
  verificarTurnosProximos,
  completarTurnosFinalizados,
};
