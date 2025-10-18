import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Servicio de WhatsApp
 * Maneja el envío de mensajes por WhatsApp usando Twilio
 */

// Configurar el cliente de Twilio
const cliente = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * Normalizar número de teléfono al formato internacional
 * Convierte números argentinos al formato +54 9 XXXX XXXXXX
 *
 * @param {string} telefono - Número de teléfono (puede ser "02914643232", "2914643232", etc.)
 * @returns {string} - Número en formato internacional (ej: "+5492914643232")
 */
const normalizarTelefono = (telefono) => {
  if (!telefono) return null;

  // Eliminar espacios, guiones y paréntesis
  let numero = telefono.replace(/[\s\-\(\)]/g, '');

  // Si empieza con +54, ya está en formato internacional
  if (numero.startsWith('+54')) {
    // Asegurarse que tenga el 9 después del código de país
    if (numero.startsWith('+549')) {
      return numero;
    } else {
      // Agregar el 9 después del +54
      return '+549' + numero.substring(3);
    }
  }

  // Si empieza con 54 (sin +)
  if (numero.startsWith('54')) {
    if (numero.startsWith('549')) {
      return '+' + numero;
    } else {
      return '+549' + numero.substring(2);
    }
  }

  // Si empieza con 0 (formato local argentino: 02914643232)
  if (numero.startsWith('0')) {
    // Eliminar el 0 inicial
    numero = numero.substring(1);
    return '+549' + numero;
  }

  // Si es un número sin prefijo (2914643232)
  // Asumir que es argentino y agregar +549
  return '+549' + numero;
};

/**
 * Verificar la configuración del servicio de Twilio
 */
export const verificarConfiguracion = async () => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log('⚠️  Twilio no configurado. Los mensajes de WhatsApp no se enviarán.');
      return false;
    }

    // Verificar que las credenciales sean válidas
    await cliente.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    console.log('✅ Servicio de WhatsApp (Twilio) listo para enviar mensajes');
    return true;
  } catch (error) {
    console.error('❌ Error al verificar configuración de Twilio:', error.message);
    return false;
  }
};

/**
 * Enviar mensaje de confirmación al cliente por WhatsApp
 */
export const enviarConfirmacionWhatsApp = async (turno, cliente, barbero, servicio) => {
  try {
    if (!process.env.TWILIO_WHATSAPP_FROM) {
      console.log('ℹ️ WhatsApp no configurado, saltando envío de confirmación');
      return false;
    }

    if (!cliente.telefono) {
      console.log(`ℹ️ Cliente ${cliente.nombre} no tiene teléfono registrado`);
      return false;
    }

    const telefonoNormalizado = normalizarTelefono(cliente.telefono);

    const fecha = new Date(turno.fecha).toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const mensaje = `🎉 *¡Tu turno ha sido confirmado!*\n\n` +
      `📅 *Fecha:* ${fecha}\n` +
      `🕐 *Hora:* ${turno.hora}\n` +
      `✂️ *Servicio:* ${servicio.nombre}\n` +
      `👨‍🦰 *Barbero:* ${barbero ? `${barbero.nombre} ${barbero.apellido}` : 'Por asignar'}\n` +
      `💰 *Precio:* $${turno.precio}\n\n` +
      `⏰ Te enviaremos un recordatorio 30 minutos antes.\n\n` +
      `📍 ${process.env.BUSINESS_NAME}\n` +
      `¡Gracias por tu preferencia!`;

    await cliente.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${telefonoNormalizado}`,
      body: mensaje,
    });

    console.log(`📱 WhatsApp de confirmación enviado a ${telefonoNormalizado}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar WhatsApp de confirmación:', error.message);
    return false;
  }
};

/**
 * Enviar notificación al barbero por WhatsApp
 */
export const enviarNotificacionBarberoWhatsApp = async (turno, clienteData, barbero, servicio) => {
  try {
    if (!process.env.TWILIO_WHATSAPP_FROM) {
      console.log('ℹ️ WhatsApp no configurado, saltando notificación a barbero');
      return false;
    }

    if (!barbero) {
      console.log('ℹ️ No hay barbero asignado, no se envía notificación');
      return false;
    }

    if (!barbero.telefono) {
      console.log(`ℹ️ Barbero ${barbero.nombre} no tiene teléfono registrado`);
      return false;
    }

    const telefonoNormalizado = normalizarTelefono(barbero.telefono);

    const fecha = new Date(turno.fecha).toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const mensaje = `📅 *Nuevo turno asignado*\n\n` +
      `👤 *Cliente:* ${clienteData.nombre} ${clienteData.apellido}\n` +
      `📞 *Teléfono:* ${clienteData.telefono}\n` +
      `✂️ *Servicio:* ${servicio.nombre} (${servicio.duracion} min)\n` +
      `📅 *Fecha:* ${fecha}\n` +
      `🕐 *Hora:* ${turno.hora}\n` +
      `💰 *Precio:* $${turno.precio}\n` +
      (turno.notasCliente ? `📝 *Notas:* ${turno.notasCliente}\n` : '') +
      `\n⏰ Te enviaremos un recordatorio 30 minutos antes.`;

    await cliente.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${telefonoNormalizado}`,
      body: mensaje,
    });

    console.log(`📱 WhatsApp de notificación enviado al barbero ${telefonoNormalizado}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar WhatsApp al barbero:', error.message);
    return false;
  }
};

/**
 * Enviar recordatorio 30 minutos antes del turno (al cliente) por WhatsApp
 */
export const enviarRecordatorioClienteWhatsApp = async (turno, clienteData, barbero, servicio) => {
  try {
    if (!process.env.TWILIO_WHATSAPP_FROM) {
      console.log('ℹ️ WhatsApp no configurado, saltando recordatorio a cliente');
      return false;
    }

    if (!clienteData.telefono) {
      console.log(`ℹ️ Cliente ${clienteData.nombre} no tiene teléfono registrado`);
      return false;
    }

    const telefonoNormalizado = normalizarTelefono(clienteData.telefono);

    const fecha = new Date(turno.fecha).toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const mensaje = `⏰ *¡Tu turno es en 30 minutos!*\n\n` +
      `Hola ${clienteData.nombre}, te recordamos tu turno:\n\n` +
      `✂️ *Servicio:* ${servicio.nombre}\n` +
      `👨‍🦰 *Barbero:* ${barbero ? `${barbero.nombre} ${barbero.apellido}` : 'Por asignar'}\n` +
      `📅 *Fecha:* ${fecha}\n` +
      `🕐 *Hora:* ${turno.hora}\n\n` +
      `📍 Te esperamos en ${process.env.BUSINESS_NAME}\n` +
      `¡Gracias por tu preferencia!`;

    await cliente.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${telefonoNormalizado}`,
      body: mensaje,
    });

    console.log(`📱 WhatsApp recordatorio enviado al cliente ${telefonoNormalizado}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar recordatorio WhatsApp al cliente:', error.message);
    return false;
  }
};

/**
 * Enviar recordatorio 30 minutos antes del turno (al barbero) por WhatsApp
 */
export const enviarRecordatorioBarberoWhatsApp = async (turno, clienteData, barbero, servicio) => {
  try {
    if (!process.env.TWILIO_WHATSAPP_FROM) {
      console.log('ℹ️ WhatsApp no configurado, saltando recordatorio a barbero');
      return false;
    }

    if (!barbero) {
      console.log('ℹ️ No hay barbero asignado, no se envía recordatorio');
      return false;
    }

    if (!barbero.telefono) {
      console.log(`ℹ️ Barbero ${barbero.nombre} no tiene teléfono registrado`);
      return false;
    }

    const telefonoNormalizado = normalizarTelefono(barbero.telefono);

    const fecha = new Date(turno.fecha).toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const mensaje = `⏰ *Tienes un turno en 30 minutos*\n\n` +
      `Hola ${barbero.nombre}, recordatorio de tu próximo turno:\n\n` +
      `👤 *Cliente:* ${clienteData.nombre} ${clienteData.apellido}\n` +
      `📞 *Teléfono:* ${clienteData.telefono}\n` +
      `✂️ *Servicio:* ${servicio.nombre} (${servicio.duracion} min)\n` +
      `📅 *Fecha:* ${fecha}\n` +
      `🕐 *Hora:* ${turno.hora}\n` +
      (turno.notasCliente ? `📝 *Notas del cliente:* ${turno.notasCliente}\n` : '') +
      `\n¡Prepárate para atender al cliente!`;

    await cliente.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${telefonoNormalizado}`,
      body: mensaje,
    });

    console.log(`📱 WhatsApp recordatorio enviado al barbero ${telefonoNormalizado}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar recordatorio WhatsApp al barbero:', error.message);
    return false;
  }
};

export default {
  verificarConfiguracion,
  enviarConfirmacionWhatsApp,
  enviarNotificacionBarberoWhatsApp,
  enviarRecordatorioClienteWhatsApp,
  enviarRecordatorioBarberoWhatsApp,
};