import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Servicio de Emails
 * Maneja el envío de correos electrónicos usando Nodemailer
 */

// Configurar el transporter de Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Verificar la configuración del transporter
 */
export const verificarConfiguracion = async () => {
  try {
    await transporter.verify();
    console.log('✅ Servidor de email listo para enviar mensajes');
    return true;
  } catch (error) {
    console.error('❌ Error al verificar configuración de email:', error.message);
    return false;
  }
};

/**
 * Enviar email de confirmación al cliente
 */
export const enviarConfirmacionCliente = async (turno, cliente, barbero, servicio) => {
  try {
    const fecha = new Date(turno.fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const mailOptions = {
      from: `"${process.env.BUSINESS_NAME}" <${process.env.EMAIL_USER}>`,
      to: cliente.email,
      subject: `✅ Confirmación de tu turno en ${process.env.BUSINESS_NAME}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">¡Tu turno ha sido confirmado!</h2>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #34495e; margin-top: 0;">Detalles de tu turno:</h3>

            <p><strong>Cliente:</strong> ${cliente.nombre} ${cliente.apellido}</p>
            <p><strong>Servicio:</strong> ${servicio.nombre}</p>
            <p><strong>Barbero:</strong> ${barbero ? `${barbero.nombre} ${barbero.apellido}` : 'Por asignar'}</p>
            <p><strong>Fecha:</strong> ${fecha}</p>
            <p><strong>Hora:</strong> ${turno.hora}</p>
            <p><strong>Precio:</strong> $${turno.precio}</p>
            ${turno.notasCliente ? `<p><strong>Notas:</strong> ${turno.notasCliente}</p>` : ''}
          </div>

          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⏰ Recordatorio:</strong> Te enviaremos un recordatorio 30 minutos antes de tu turno.</p>
          </div>

          <p style="color: #7f8c8d; font-size: 14px;">
            Si necesitas cancelar o modificar tu turno, por favor contáctanos con anticipación.
          </p>

          <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">

          <p style="color: #95a5a6; font-size: 12px; text-align: center;">
            ${process.env.BUSINESS_NAME}<br>
            Este es un email automático, por favor no responder.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✉️ Email de confirmación enviado a ${cliente.email}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar email de confirmación al cliente:', error.message);
    return false;
  }
};

/**
 * Enviar notificación al barbero asignado
 */
export const enviarNotificacionBarbero = async (turno, cliente, barbero, servicio) => {
  try {
    if (!barbero) {
      console.log('ℹ️ No hay barbero asignado, no se envía notificación');
      return false;
    }

    const fecha = new Date(turno.fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const mailOptions = {
      from: `"${process.env.BUSINESS_NAME}" <${process.env.EMAIL_USER}>`,
      to: barbero.email,
      subject: `📅 Nuevo turno asignado - ${fecha} ${turno.hora}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Tienes un nuevo turno asignado</h2>

          <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2e7d32; margin-top: 0;">Detalles del turno:</h3>

            <p><strong>Cliente:</strong> ${cliente.nombre} ${cliente.apellido}</p>
            <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
            <p><strong>Email:</strong> ${cliente.email}</p>
            <p><strong>Servicio:</strong> ${servicio.nombre} (${servicio.duracion} min)</p>
            <p><strong>Fecha:</strong> ${fecha}</p>
            <p><strong>Hora:</strong> ${turno.hora}</p>
            <p><strong>Precio:</strong> $${turno.precio}</p>
            ${turno.notasCliente ? `<p><strong>Notas del cliente:</strong> ${turno.notasCliente}</p>` : ''}
          </div>

          <p style="color: #7f8c8d; font-size: 14px;">
            Te enviaremos un recordatorio 30 minutos antes del turno.
          </p>

          <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">

          <p style="color: #95a5a6; font-size: 12px; text-align: center;">
            ${process.env.BUSINESS_NAME}<br>
            Este es un email automático, por favor no responder.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✉️ Notificación enviada al barbero ${barbero.email}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar notificación al barbero:', error.message);
    return false;
  }
};

/**
 * Enviar notificación al administrador
 */
export const enviarNotificacionAdmin = async (turno, cliente, barbero, servicio) => {
  try {
    const fecha = new Date(turno.fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const mailOptions = {
      from: `"${process.env.BUSINESS_NAME}" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `🔔 Nueva reserva - ${cliente.nombre} ${cliente.apellido}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Nueva reserva registrada</h2>

          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1565c0; margin-top: 0;">Detalles de la reserva:</h3>

            <p><strong>Cliente:</strong> ${cliente.nombre} ${cliente.apellido}</p>
            <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
            <p><strong>Email:</strong> ${cliente.email}</p>
            <p><strong>Servicio:</strong> ${servicio.nombre}</p>
            <p><strong>Barbero:</strong> ${barbero ? `${barbero.nombre} ${barbero.apellido}` : 'Por asignar'}</p>
            <p><strong>Fecha:</strong> ${fecha}</p>
            <p><strong>Hora:</strong> ${turno.hora}</p>
            <p><strong>Precio:</strong> $${turno.precio}</p>
            <p><strong>Estado:</strong> ${turno.estado}</p>
            ${turno.notasCliente ? `<p><strong>Notas:</strong> ${turno.notasCliente}</p>` : ''}
          </div>

          <p style="color: #7f8c8d; font-size: 14px;">
            Puedes gestionar esta reserva desde el panel de administración.
          </p>

          <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">

          <p style="color: #95a5a6; font-size: 12px; text-align: center;">
            ${process.env.BUSINESS_NAME} - Panel de Administración<br>
            Este es un email automático, por favor no responder.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✉️ Notificación enviada al administrador ${process.env.ADMIN_EMAIL}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar notificación al administrador:', error.message);
    return false;
  }
};

/**
 * Enviar recordatorio 30 minutos antes del turno (al cliente)
 */
export const enviarRecordatorioCliente = async (turno, cliente, barbero, servicio) => {
  try {
    const fecha = new Date(turno.fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const mailOptions = {
      from: `"${process.env.BUSINESS_NAME}" <${process.env.EMAIL_USER}>`,
      to: cliente.email,
      subject: `⏰ Recordatorio: Tu turno es en 30 minutos`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e67e22;">⏰ ¡Tu turno es pronto!</h2>

          <p style="font-size: 16px;">Hola ${cliente.nombre}, este es un recordatorio de tu turno:</p>

          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin-top: 0;">Tu turno es en 30 minutos:</h3>

            <p><strong>Servicio:</strong> ${servicio.nombre}</p>
            <p><strong>Barbero:</strong> ${barbero ? `${barbero.nombre} ${barbero.apellido}` : 'Por asignar'}</p>
            <p><strong>Fecha:</strong> ${fecha}</p>
            <p><strong>Hora:</strong> ${turno.hora}</p>
          </div>

          <p style="font-size: 14px; color: #7f8c8d;">
            Te esperamos en ${process.env.BUSINESS_NAME}. ¡Gracias por tu preferencia!
          </p>

          <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">

          <p style="color: #95a5a6; font-size: 12px; text-align: center;">
            ${process.env.BUSINESS_NAME}<br>
            Este es un email automático, por favor no responder.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✉️ Recordatorio enviado al cliente ${cliente.email}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar recordatorio al cliente:', error.message);
    return false;
  }
};

/**
 * Enviar recordatorio 30 minutos antes del turno (al barbero)
 */
export const enviarRecordatorioBarbero = async (turno, cliente, barbero, servicio) => {
  try {
    if (!barbero) {
      console.log('ℹ️ No hay barbero asignado, no se envía recordatorio');
      return false;
    }

    const fecha = new Date(turno.fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const mailOptions = {
      from: `"${process.env.BUSINESS_NAME}" <${process.env.EMAIL_USER}>`,
      to: barbero.email,
      subject: `⏰ Recordatorio: Turno en 30 minutos`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e67e22;">⏰ Tienes un turno pronto</h2>

          <p style="font-size: 16px;">Hola ${barbero.nombre}, recordatorio de tu próximo turno:</p>

          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin-top: 0;">Turno en 30 minutos:</h3>

            <p><strong>Cliente:</strong> ${cliente.nombre} ${cliente.apellido}</p>
            <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
            <p><strong>Servicio:</strong> ${servicio.nombre} (${servicio.duracion} min)</p>
            <p><strong>Fecha:</strong> ${fecha}</p>
            <p><strong>Hora:</strong> ${turno.hora}</p>
            ${turno.notasCliente ? `<p><strong>Notas del cliente:</strong> ${turno.notasCliente}</p>` : ''}
          </div>

          <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">

          <p style="color: #95a5a6; font-size: 12px; text-align: center;">
            ${process.env.BUSINESS_NAME}<br>
            Este es un email automático, por favor no responder.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✉️ Recordatorio enviado al barbero ${barbero.email}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar recordatorio al barbero:', error.message);
    return false;
  }
};

export default {
  verificarConfiguracion,
  enviarConfirmacionCliente,
  enviarNotificacionBarbero,
  enviarNotificacionAdmin,
  enviarRecordatorioCliente,
  enviarRecordatorioBarbero,
};
