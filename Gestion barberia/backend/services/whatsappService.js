import twilio from 'twilio';
import dotenv from 'dotenv';

// Carga las variables de entorno (ej: .env)
dotenv.config();

// Configura el cliente de Twilio con tus credenciales
const cliente = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

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
const _enviarWhatsApp = async (telefonoDestino, mensaje) => {
  // 1. Verifica si el número de Twilio está configurado
  if (!process.env.TWILIO_WHATSAPP_FROM) {
    console.log('ℹ️ WhatsApp no configurado, saltando envío.');
    return false;
  }

  // 2. Verifica si el destinatario tiene un teléfono
  if (!telefonoDestino) {
    console.log('ℹ️ No hay teléfono de destino, saltando envío.');
    return false;
  }

  // 3. Normaliza el número de teléfono
  const telefonoNormalizado = normalizarTelefono(telefonoDestino);
  if (!telefonoNormalizado) {
    console.log(`ℹ️ Número de teléfono inválido (${telefonoDestino}), saltando envío.`);
    return false;
  }
  
  try {
    // 4. Intenta enviar el mensaje
    await cliente.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`, // Número de Twilio
      to: `whatsapp:${telefonoNormalizado}`, // Número del destinatario
      body: mensaje,
    });

    console.log(`📱 WhatsApp enviado a ${telefonoNormalizado}`);
    return true;
  } catch (error) {
    // 5. Maneja errores de envío
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
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log('⚠️  Twilio no configurado. Los mensajes de WhatsApp no se enviarán.');
      return false;
    }
    // Intenta "buscar" la cuenta para validar las credenciales
    await cliente.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    console.log('✅ Servicio de WhatsApp (Twilio) listo para enviar mensajes');
    return true;
  } catch (error) {
    console.error('❌ Error al verificar configuración de Twilio:', error.message);
    return false;
  }
};

/**
 * Enviar mensaje de confirmación al CLIENTE
 */
export const enviarConfirmacionWhatsApp = async (turno, cliente, barbero, servicio) => {
  // 1. Formatear la fecha (con zona horaria de Argentina)
  const fecha = new Date(turno.fecha).toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires', // Asegura la fecha correcta
  });

  // 2. Construir el mensaje
  const mensaje = `🎉 *¡Tu turno ha sido confirmado!*\n\n` +
    `📅 *Fecha:* ${fecha}\n` +
    `🕐 *Hora:* ${turno.hora}\n` +
    `✂️ *Servicio:* ${servicio.nombre}\n` +
    `👨‍🦰 *Barbero:* ${barbero ? `${barbero.nombre} ${barbero.apellido}` : 'Por asignar'}\n` +
    `💰 *Precio:* $${turno.precio}\n\n` +
    `⏰ Te enviaremos un recordatorio 30 minutos antes.\n\n` +
    `📍 ${process.env.BUSINESS_NAME}\n` +
    `¡Gracias por tu preferencia!`;

  // 3. Enviar usando el helper (pasamos el teléfono del cliente)
  return await _enviarWhatsApp(cliente?.telefono, mensaje);
};

/**
 * Enviar notificación de nuevo turno al BARBERO
 */
export const enviarNotificacionBarberoWhatsApp = async (turno, clienteData, barbero, servicio) => {
  // 1. Validar si hay barbero asignado
  if (!barbero) {
    console.log('ℹ️ No hay barbero asignado, no se envía notificación');
    return false;
  }
  
  // 2. Formatear la fecha
  const fecha = new Date(turno.fecha).toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  });

  // 3. Construir el mensaje
  const mensaje = `📅 *Nuevo turno asignado*\n\n` +
    `👤 *Cliente:* ${clienteData.nombre} ${clienteData.apellido}\n` +
    `📞 *Teléfono:* ${clienteData.telefono}\n` +
    `✂️ *Servicio:* ${servicio.nombre} (${servicio.duracion} min)\n` +
    `📅 *Fecha:* ${fecha}\n` +
    `🕐 *Hora:* ${turno.hora}\n` +
    (turno.notasCliente ? `📝 *Notas:* ${turno.notasCliente}\n` : '') +
    `\n⏰ Te enviaremos un recordatorio 30 minutos antes.`;

  // 4. Enviar usando el helper (pasamos el teléfono del barbero)
  return await _enviarWhatsApp(barbero?.telefono, mensaje);
};

/**
 * Enviar recordatorio 30 minutos antes al CLIENTE
 */
export const enviarRecordatorioClienteWhatsApp = async (turno, clienteData, barbero, servicio) => {
  // 1. Formatear la fecha
  const fecha = new Date(turno.fecha).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Argentina/Buenos_Aires',
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
 * Enviar recordatorio 30 minutos antes al BARBERO
 */
export const enviarRecordatorioBarberoWhatsApp = async (turno, clienteData, barbero, servicio) => {
  // 1. Validar si hay barbero asignado
  if (!barbero) {
    console.log('ℹ️ No hay barbero asignado, no se envía recordatorio');
    return false;
  }

  // 2. Formatear la fecha
  const fecha = new Date(turno.fecha).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Argentina/Buenos_Aires',
  });

  // 3. Construir el mensaje
  const mensaje = `⏰ *Tienes un turno en 30 minutos*\n\n` +
    `Hola ${barbero.nombre}, recordatorio de tu próximo turno:\n\n` +
    `👤 *Cliente:* ${clienteData.nombre} ${clienteData.apellido}\n` +
    `📞 *Teléfono:* ${clienteData.telefono}\n` +
    `✂️ *Servicio:* ${servicio.nombre} (${servicio.duracion} min)\n` +
    `📅 *Fecha:* ${fecha}\n` +
    `🕐 *Hora:* ${turno.hora}\n` +
    (turno.notasCliente ? `📝 *Notas del cliente:* ${turno.notasCliente}\n` : '') +
    `\n¡Prepárate para atender al cliente!`;

  // 4. Enviar usando el helper
  return await _enviarWhatsApp(barbero?.telefono, mensaje);
};