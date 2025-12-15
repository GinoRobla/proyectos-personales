/**
 * turnoCancelacion - cancelacion
 * Módulo extraído de turnoService.js para mejor organización
 */

import Turno from '../../models/Turno.js';
import { enviarCancelacionBarberoWhatsApp } from '../whatsappService.js';
import { devolverSena } from '../pagoService.js';

/**
 * -------------------------------------------------------------------
 * SERVICIOS EXPORTADOS
 * -------------------------------------------------------------------
 */

/**
 * Cancela un turno existente
 * Si el turno tiene seña aprobada, intenta devolverla automáticamente
 * @param {string} turnoId - ID del turno a cancelar
 */
export const cancelar = async (turnoId) => {
  try {
    console.log(`[CANCELAR TURNO] Iniciando cancelación del turno: ${turnoId}`);

    // 1. Buscar el turno con todos sus datos relacionados
    const turno = await Turno.findById(turnoId)
      .populate('cliente')
      .populate('barbero')
      .populate('servicio')
      .populate('pago');

    if (!turno) {
      throw new Error('Turno no encontrado');
    }

    console.log(`[CANCELAR TURNO] Turno encontrado:`, {
      id: turno._id,
      cliente: `${turno.cliente?.nombre} ${turno.cliente?.apellido}`,
      barbero: `${turno.barbero?.nombre} ${turno.barbero?.apellido}`,
      telefonoBarbero: turno.barbero?.telefono,
      servicio: turno.servicio?.nombre,
      estadoAnterior: turno.estado,
      requiereSena: turno.requiereSena,
      estadoPago: turno.estadoPago,
      tienePago: !!turno.pago
    });

    // 2. Cambiar estado y guardar
    turno.estado = 'cancelado';
    await turno.save();
    console.log(`[CANCELAR TURNO] Estado cambiado a 'cancelado'`);

    // 3. Si el turno requiere seña y tiene pago aprobado, intentar devolución automática
    let resultadoDevolucion = null;
    if (turno.requiereSena && turno.pago && turno.estadoPago === 'aprobado') {
      console.log(`[CANCELAR TURNO] El turno tiene seña aprobada, verificando si se puede devolver...`);

      try {
        resultadoDevolucion = await devolverSena(
          turnoId,
          'Cancelación de turno por el cliente'
        );

        console.log(`✅ [CANCELAR TURNO] Devolución procesada:`, resultadoDevolucion);
      } catch (errorDevolucion) {
        console.error(`⚠️ [CANCELAR TURNO] No se pudo procesar la devolución automática:`, errorDevolucion.message);
        // No lanzamos el error para que la cancelación se complete
        // El mensaje de error se incluirá en la respuesta
        resultadoDevolucion = {
          devuelto: false,
          mensaje: errorDevolucion.message,
          error: true
        };
      }
    } else if (turno.requiereSena && turno.estadoPago !== 'aprobado') {
      console.log(`ℹ️ [CANCELAR TURNO] El turno requiere seña pero el pago no está aprobado (estado: ${turno.estadoPago})`);
    }

    // 4. Enviar notificación al barbero (si tiene barbero asignado)
    if (turno.barbero) {
      console.log(`[CANCELAR TURNO] Barbero asignado detectado, enviando WhatsApp...`);
      try {
        const resultado = await enviarCancelacionBarberoWhatsApp(turno, turno.cliente, turno.barbero, turno.servicio);
        if (resultado) {
          console.log(`✅ [CANCELAR TURNO] WhatsApp enviado exitosamente al barbero: ${turno.barbero.nombre} ${turno.barbero.apellido} (${turno.barbero.telefono})`);
        } else {
          console.log(`⚠️ [CANCELAR TURNO] WhatsApp no se envió (verificar configuración Twilio o teléfono)`);
        }
      } catch (error) {
        console.error(`❌ [CANCELAR TURNO] Error al enviar WhatsApp:`, error.message);
        // No lanzamos el error aquí para que la cancelación se complete aunque falle el WhatsApp
      }
    } else {
      console.log(`ℹ️ [CANCELAR TURNO] No hay barbero asignado, no se envía WhatsApp`);
    }

    // 5. Devolver el turno actualizado con información de la devolución
    console.log(`[CANCELAR TURNO] Cancelación completada exitosamente`);
    return {
      turno,
      devolucion: resultadoDevolucion
    };
  } catch (error) {
    console.error(`❌ [CANCELAR TURNO] Error en el proceso:`, error.message);
    throw new Error(`Error al cancelar turno: ${error.message}`);
  }
};

/**
 * VALIDAR DISPONIBILIDAD
 * Verifica si un slot (fecha, hora, barbero) está libre.
 */

export const cancelarTurnosPendientesExpirados = async () => {
  try {
    const ahora = new Date();

    // Buscar turnos pendientes expirados (con cliente, barbero, servicio para WhatsApp)
    const turnosExpirados = await Turno.find({
      estado: 'pendiente',
      fechaExpiracion: { $lte: ahora, $ne: null }
    })
    .populate('cliente')
    .populate('barbero')
    .populate('servicio');

    if (turnosExpirados.length === 0) {
      console.log('[EXPIRACIÓN] No hay turnos pendientes expirados');
      return { cancelados: 0 };
    }

    console.log(`[EXPIRACIÓN] Encontrados ${turnosExpirados.length} turnos pendientes expirados`);

    // Cancelar cada turno expirado
    const resultados = await Promise.all(
      turnosExpirados.map(async (turno) => {
        try {
          // Cambiar estado a cancelado
          turno.estado = 'cancelado';
          await turno.save();
          console.log(`[EXPIRACIÓN] ✅ Turno ${turno._id} cancelado por expiración`);

          // Enviar notificación al barbero (si está asignado)
          if (turno.barbero) {
            try {
              await enviarCancelacionBarberoWhatsApp(turno, turno.cliente, turno.barbero, turno.servicio);
              console.log(`[EXPIRACIÓN] 📱 WhatsApp enviado al barbero: ${turno.barbero.nombre} ${turno.barbero.apellido}`);
            } catch (errorWhatsApp) {
              console.error(`[EXPIRACIÓN] ⚠️ Error al enviar WhatsApp al barbero:`, errorWhatsApp.message);
              // No falla la cancelación si falla el WhatsApp
            }
          }

          return { success: true, turnoId: turno._id };
        } catch (error) {
          console.error(`[EXPIRACIÓN] ❌ Error al cancelar turno ${turno._id}:`, error.message);
          return { success: false, turnoId: turno._id, error: error.message };
        }
      })
    );

    const exitosos = resultados.filter(r => r.success).length;
    console.log(`[EXPIRACIÓN] Cancelados ${exitosos} de ${turnosExpirados.length} turnos`);

    return {
      cancelados: exitosos,
      total: turnosExpirados.length,
      resultados
    };
  } catch (error) {
    console.error('[EXPIRACIÓN] Error al cancelar turnos expirados:', error);
    throw new Error(`Error al cancelar turnos expirados: ${error.message}`);
  }
};

export default {
  cancelar,
  cancelarTurnosPendientesExpirados,
};
