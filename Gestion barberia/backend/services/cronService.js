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
