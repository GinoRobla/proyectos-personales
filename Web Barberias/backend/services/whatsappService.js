import twilio from 'twilio';
import dotenv from 'dotenv';

// Carga las variables de entorno (ej: .env)
dotenv.config();

// Configura el cliente de Twilio solo si las credenciales son válidas
let cliente = null;

// Verificar si las credenciales de Twilio están configuradas correctamente
const twilioConfigured =
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_ACCOUNT_SID.startsWith('AC'); // Validación básica

if (twilioConfigured) {
  try {
    cliente = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  } catch (error) {
    console.warn('⚠️  No se pudo inicializar Twilio:', error.message);
    console.warn('⚠️  Los mensajes de WhatsApp no se enviarán.');
  }
} else {
  console.log('ℹ️  Twilio/WhatsApp no configurado. Para habilitar notificaciones, configura las credenciales en .env');
}

/**
 * -------------------------------------------------------------------
 * FUNCIONES HELPER (USO INTERNO)
 * -------------------------------------------------------------------
 */

/**
 * (Helper) Normaliza un teléfono al formato internacional +549...
 * Arregla números que empiezan con 0, sin +54, o sin el 9.
 */
const normalizarTelefono = (telefono) => {
  // 1. Validar que exista el teléfono
  if (!telefono) return null;

  // 2. Limpiar el número (quitar espacios, guiones, etc.)
  let num = telefono.replace(/[\s\-\(\)]/g, '');

  // 3. Casos de prefijos (Argentina)
  if (num.startsWith('+549')) return num; // Formato ya correcto
  if (num.startsWith('+54')) return '+549' + num.substring(3); // Falta el 9 (ej: +54291...)
  if (num.startsWith('549')) return '+' + num; // Falta el + (ej: 549291...)
  if (num.startsWith('54')) return '+549' + num.substring(2); // Falta + y 9 (ej: 54291...)
  if (num.startsWith('0')) return '+549' + num.substring(1); // Prefijo local 0 (ej: 0291...)

  // 4. Asumir número local sin prefijos (ej: 291...)
  return '+549' + num;
};

/**
 * (Helper) Función central para enviar mensajes de WhatsApp.
 * Maneja la validación, normalización y el bloque try/catch.
 */
export const _enviarWhatsApp = async (telefonoDestino, mensaje) => {
  // 1. Verifica si el cliente de Twilio está inicializado
  if (!cliente) {
    console.log('ℹ️ Cliente de Twilio no inicializado, saltando envío.');
    return false;
  }

  // 2. Verifica si el número de Twilio está configurado
  if (!process.env.TWILIO_WHATSAPP_FROM) {
    console.log('ℹ️ WhatsApp no configurado, saltando envío.');
    return false;
  }

  // 3. Verifica si el destinatario tiene un teléfono
  if (!telefonoDestino) {
    console.log('ℹ️ No hay teléfono de destino, saltando envío.');
    return false;
  }

  // 4. Normaliza el número de teléfono
  const telefonoNormalizado = normalizarTelefono(telefonoDestino);
  if (!telefonoNormalizado) {
    console.log(`ℹ️ Número de teléfono inválido (${telefonoDestino}), saltando envío.`);
    return false;
  }

  try {
    // 5. Intenta enviar el mensaje
    await cliente.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`, // Número de Twilio
      to: `whatsapp:${telefonoNormalizado}`, // Número del destinatario
      body: mensaje,
    });

    console.log(`📱 WhatsApp enviado a ${telefonoNormalizado}`);
    return true;
  } catch (error) {
    // 6. Maneja errores de envío
    console.error(`❌ Error al enviar WhatsApp a ${telefonoNormalizado}:`, error.message);
    return false;
  }
};

/**
 * -------------------------------------------------------------------
 * SERVICIOS EXPORTADOS
 * -------------------------------------------------------------------
 */

/**
 * Verifica si las credenciales de Twilio son válidas al iniciar.
 */
export const verificarConfiguracion = async () => {
  try {
    if (!cliente) {
      return false;
    }

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return false;
    }

    // Intenta "buscar" la cuenta para validar las credenciales
    await cliente.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    console.log('✅ Servicio de WhatsApp (Twilio) listo para enviar mensajes');
    return true;
  } catch (error) {
    console.warn('⚠️  Error al verificar configuración de Twilio:', error.message);
    console.warn('⚠️  Los mensajes de WhatsApp no se enviarán.');
    return false;
  }
};

/**
 * Enviar recordatorio 30 minutos antes al CLIENTE
 */
export const enviarRecordatorioClienteWhatsApp = async (turno, clienteData, barbero, servicio) => {
  // 1. Formatear la fecha (usar UTC para evitar problema de timezone)
  const fecha = new Date(turno.fecha).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });

  // 2. Construir el mensaje
  const mensaje = `⏰ *¡Tu turno es en 30 minutos!*\n\n` +
    `Hola ${clienteData.nombre}, te recordamos tu turno:\n\n` +
    `✂️ *Servicio:* ${servicio.nombre}\n` +
    `👨‍🦰 *Barbero:* ${barbero ? `${barbero.nombre} ${barbero.apellido}` : 'Por asignar'}\n` +
    `📅 *Fecha:* ${fecha}\n` +
    `🕐 *Hora:* ${turno.hora}\n\n` +
    `📍 Te esperamos en ${process.env.BUSINESS_NAME}\n` +
    `¡Gracias por tu preferencia!`;

  // 3. Enviar usando el helper
  return await _enviarWhatsApp(clienteData?.telefono, mensaje);
};

/**
 * Enviar notificación de cancelación al BARBERO
 */
export const enviarCancelacionBarberoWhatsApp = async (turno, clienteData, barbero, servicio) => {
  // 1. Validar si hay barbero asignado
  if (!barbero) {
    console.log('ℹ️ No hay barbero asignado, no se envía notificación de cancelación');
    return false;
  }

  // 2. Formatear la fecha (usar UTC para evitar problema de timezone)
  const fecha = new Date(turno.fecha).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });

  // 3. Construir el mensaje
  const mensaje = `❌ *Turno cancelado*\n\n` +
    `Hola ${barbero.nombre}, te informamos que se canceló el siguiente turno:\n\n` +
    `👤 *Cliente:* ${clienteData.nombre} ${clienteData.apellido}\n` +
    `📞 *Teléfono:* ${clienteData.telefono}\n` +
    `✂️ *Servicio:* ${servicio.nombre}\n` +
    `📅 *Fecha:* ${fecha}\n` +
    `🕐 *Hora:* ${turno.hora}\n\n` +
    `Este horario ahora está disponible para nuevas reservas.`;

  // 4. Enviar usando el helper
  return await _enviarWhatsApp(barbero?.telefono, mensaje);
};

/**
 * Enviar reporte diario al ADMIN
 */
export const enviarReporteDiarioAdminWhatsApp = async (adminTelefono, estadisticas, enlaceEstadisticas) => {
  // 1. Validar que haya teléfono de admin
  if (!adminTelefono) {
    console.log('ℹ️ No hay teléfono de admin configurado, no se envía reporte');
    return false;
  }

  // 2. Formatear la fecha de hoy
  const fecha = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  });

  // 3. Construir mensaje con las estadísticas
  let mensaje = `📊 *Reporte Diario - ${fecha}*\n\n`;

  mensaje += `📈 *Resumen General:*\n`;
  mensaje += `✅ Turnos completados: ${estadisticas.turnosCompletados}\n`;
  mensaje += `❌ Turnos cancelados: ${estadisticas.turnosCancelados}\n`;
  mensaje += `💰 Total generado: $${estadisticas.totalGenerado}\n\n`;

  mensaje += `👨‍🦰 *Por Barbero:*\n`;
  estadisticas.porBarbero.forEach((barbero) => {
    mensaje += `• ${barbero.nombre}: $${barbero.generado} (${barbero.turnos} turnos)\n`;
  });

  mensaje += `\n🔗 Ver estadísticas detalladas:\n${enlaceEstadisticas}`;

  // 4. Enviar usando el helper
  return await _enviarWhatsApp(adminTelefono, mensaje);
};

/**
 * Enviar recordatorio de pago pendiente al CLIENTE
 * Se envía cuando el turno está pendiente y faltan pocos minutos para que expire
 */
export const enviarRecordatorioPagoPendiente = async (turno, clienteData, barbero, servicio) => {
  // 1. Calcular minutos restantes hasta la expiración
  const ahora = new Date();
  const minutosRestantes = Math.floor((new Date(turno.fechaExpiracion) - ahora) / 60000);

  // 2. Formatear la fecha del turno (usar UTC para evitar problema de timezone)
  const fecha = new Date(turno.fecha).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });

  // 3. Crear link de cancelación con token de seguridad (endpoint público del backend)
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  const urlCancelar = `${backendUrl}/api/turnos/cancelar-publico/${turno._id}/${turno.tokenCancelacion}`;

  // 4. Construir el mensaje
  const mensaje = `⚠️ *¡Pago pendiente!*\n\n` +
    `Hola ${clienteData.nombre}, tu turno está reservado pero aún no completaste el pago de la seña.\n\n` +
    `📋 *Detalles del turno:*\n` +
    `✂️ Servicio: ${servicio.nombre}\n` +
    `👨‍🦰 Barbero: ${barbero ? `${barbero.nombre} ${barbero.apellido}` : 'Por asignar'}\n` +
    `📅 Fecha: ${fecha}\n` +
    `🕐 Hora: ${turno.hora}\n` +
    `💰 Seña: $${turno.pago?.monto || 0}\n\n` +
    `⏰ *Tiempo restante: ${minutosRestantes} minutos*\n\n` +
    `Si no completás el pago en ${minutosRestantes} minutos, el turno se cancelará automáticamente.\n\n` +
    `🔗 *Completá tu pago:*\n${turno.pago?.urlPago || 'Contactanos para obtener el link'}\n\n` +
    `❌ *¿No podés asistir? Cancelá tu turno:*\n` +
    `${urlCancelar}\n\n` +
    `¡Gracias por tu comprensión! 💈`;

  // 5. Enviar usando el helper
  return await _enviarWhatsApp(clienteData?.telefono, mensaje);
};