import nodemailer from 'nodemailer';

/**
 * Servicio de Email usando Nodemailer
 * Configurado para Gmail (puedes cambiar a SendGrid, Mailgun, etc.)
 */

// Configurar transporter (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // App Password, no la contraseña normal
  }
});

// Verificar configuración al iniciar
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error en configuración de email:', error.message);
    console.log('⚠️  Asegúrate de configurar EMAIL_USER y EMAIL_PASS en .env');
  } else {
    console.log('✅ Servicio de email listo para enviar mensajes');
  }
});

/**
 * Enviar email de recuperación de contraseña
 */
export const enviarEmailRecuperacion = async (email, nombre, token) => {
  const urlRecuperacion = `${process.env.FRONTEND_URL}/resetear-contrasena?token=${token}`;

  const mailOptions = {
    from: `"${process.env.NOMBRE_NEGOCIO || 'Barbería GR'}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Recuperación de contraseña',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #333; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${process.env.NOMBRE_NEGOCIO || 'Barbería GR'}</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre},</h2>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
            <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
            <center>
              <a href="${urlRecuperacion}" class="button">Restablecer Contraseña</a>
            </center>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #007bff;">${urlRecuperacion}</p>

            <div class="warning">
              ⚠️ <strong>Importante:</strong> Este enlace expira en 1 hora por seguridad.
            </div>

            <p><strong>¿No solicitaste este cambio?</strong></p>
            <p>Si no fuiste tú, ignora este email. Tu contraseña permanecerá segura.</p>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no respondas.</p>
            <p>&copy; ${new Date().getFullYear()} ${process.env.NOMBRE_NEGOCIO || 'Barbería GR'}. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de recuperación enviado:', info.messageId);
    return { exito: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    throw new Error('No se pudo enviar el email de recuperación');
  }
};

/**
 * Enviar email de confirmación de cambio de contraseña
 */
export const enviarEmailConfirmacionCambio = async (email, nombre) => {
  const mailOptions = {
    from: `"${process.env.NOMBRE_NEGOCIO || 'Barbería GR'}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Contraseña actualizada exitosamente',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .success { background: #d4edda; border-left: 4px solid #28a745; padding: 10px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Contraseña Actualizada</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre},</h2>
            <div class="success">
              Tu contraseña ha sido cambiada exitosamente.
            </div>
            <p>Si no realizaste este cambio, contacta inmediatamente con soporte.</p>
            <p>Gracias por usar ${process.env.NOMBRE_NEGOCIO || 'Barbería GR'}.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${process.env.NOMBRE_NEGOCIO || 'Barbería GR'}</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email de confirmación enviado');
  } catch (error) {
    console.error('❌ Error al enviar email de confirmación:', error);
    // No lanzar error aquí, es solo notificación
  }
};

/**
 * Enviar email de confirmación de pago aprobado
 */
export const enviarEmailPagoAprobado = async (email, nombre, turno, pago) => {
  const mailOptions = {
    from: `"${process.env.NOMBRE_NEGOCIO || 'Barbería GR'}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '✅ Pago de seña confirmado',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
          .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; }
          .detalles { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .detalle-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detalle-item:last-child { border-bottom: none; }
          .label { font-weight: bold; color: #666; }
          .valor { color: #333; }
          .monto { font-size: 1.3em; color: #28a745; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Pago Confirmado</h1>
          </div>
          <div class="content">
            <h2>¡Hola ${nombre}!</h2>
            <div class="success">
              ✓ Tu pago de seña ha sido procesado exitosamente.
            </div>
            <p>Tu turno está confirmado. Aquí están los detalles:</p>

            <div class="detalles">
              <h3 style="margin-top: 0;">Detalles del Turno</h3>
              <div class="detalle-item">
                <span class="label">Servicio:</span>
                <span class="valor">${turno.servicio?.nombre || 'N/A'}</span>
              </div>
              <div class="detalle-item">
                <span class="label">Fecha:</span>
                <span class="valor">${new Date(turno.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
              <div class="detalle-item">
                <span class="label">Hora:</span>
                <span class="valor">${turno.hora}</span>
              </div>
              <div class="detalle-item">
                <span class="label">Barbero:</span>
                <span class="valor">${turno.barbero ? `${turno.barbero.nombre} ${turno.barbero.apellido}` : 'Por asignar'}</span>
              </div>
            </div>

            <div class="detalles">
              <h3 style="margin-top: 0;">Detalles del Pago</h3>
              <div class="detalle-item">
                <span class="label">Seña abonada:</span>
                <span class="valor monto">$${pago.monto}</span>
              </div>
              <div class="detalle-item">
                <span class="label">Restante a abonar en el local:</span>
                <span class="valor">$${pago.montoTotal - pago.monto}</span>
              </div>
              <div class="detalle-item">
                <span class="label">Total del servicio:</span>
                <span class="valor">$${pago.montoTotal}</span>
              </div>
            </div>

            <p><strong>Recuerda:</strong> Debes abonar el monto restante al finalizar tu servicio.</p>
            <p>¡Nos vemos pronto!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${process.env.NOMBRE_NEGOCIO || 'Barbería GR'}</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email de pago aprobado enviado a:', email);
  } catch (error) {
    console.error('❌ Error al enviar email de pago aprobado:', error);
    // No lanzar error, es solo notificación
  }
};

/**
 * Enviar email de pago rechazado
 */
export const enviarEmailPagoRechazado = async (email, nombre, turno) => {
  const mailOptions = {
    from: `"${process.env.NOMBRE_NEGOCIO || 'Barbería GR'}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '❌ Pago de seña rechazado',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
          .error { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 15px 0; }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #28a745;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Pago Rechazado</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre},</h2>
            <div class="error">
              Tu pago de seña no pudo ser procesado.
            </div>
            <p>Lamentablemente, tu turno para el día ${new Date(turno.fecha).toLocaleDateString('es-AR')} a las ${turno.hora} no está confirmado debido a que el pago fue rechazado.</p>

            <p><strong>¿Qué puedes hacer?</strong></p>
            <ul>
              <li>Puedes intentar realizar el pago nuevamente desde la sección "Mis Turnos"</li>
              <li>Verifica que tu método de pago tenga fondos suficientes</li>
              <li>Contacta con tu banco si el problema persiste</li>
            </ul>

            <center>
              <a href="${process.env.FRONTEND_URL}/cliente/turnos" class="button">Ir a Mis Turnos</a>
            </center>

            <p>Si necesitas ayuda, no dudes en contactarnos.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${process.env.NOMBRE_NEGOCIO || 'Barbería GR'}</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email de pago rechazado enviado a:', email);
  } catch (error) {
    console.error('❌ Error al enviar email de pago rechazado:', error);
  }
};

/**
 * Enviar email de pago pendiente
 */
export const enviarEmailPagoPendiente = async (email, nombre, turno, urlPago) => {
  const mailOptions = {
    from: `"${process.env.NOMBRE_NEGOCIO || 'Barbería GR'}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '⏳ Pago de seña pendiente',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ffc107; color: #333; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #28a745;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏳ Pago Pendiente</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre},</h2>
            <div class="warning">
              Tu pago de seña está en proceso de verificación.
            </div>
            <p>Tu turno para el día ${new Date(turno.fecha).toLocaleDateString('es-AR')} a las ${turno.hora} está reservado temporalmente.</p>

            <p>El pago puede tardar unos minutos en procesarse. Te notificaremos cuando se confirme.</p>

            ${urlPago ? `
              <p>Si deseas completar el pago nuevamente, puedes hacerlo desde aquí:</p>
              <center>
                <a href="${urlPago}" class="button">Completar Pago</a>
              </center>
            ` : ''}

            <p>También puedes acceder desde la sección "Mis Turnos".</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${process.env.NOMBRE_NEGOCIO || 'Barbería GR'}</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email de pago pendiente enviado a:', email);
  } catch (error) {
    console.error('❌ Error al enviar email de pago pendiente:', error);
  }
};

export default {
  enviarEmailRecuperacion,
  enviarEmailConfirmacionCambio,
  enviarEmailPagoAprobado,
  enviarEmailPagoRechazado,
  enviarEmailPagoPendiente
};