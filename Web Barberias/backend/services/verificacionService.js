/**
 * Servicio de verificación de teléfono
 * Genera códigos y envía por WhatsApp
 */

import CodigoVerificacion from '../models/CodigoVerificacion.js';
import Usuario from '../models/Usuario.js';
import Cliente from '../models/Cliente.js';
import Barbero from '../models/Barbero.js';
import { _enviarWhatsApp } from './whatsappService.js';
import { validarTelefonoArgentino } from '../utils/phoneValidator.js';

/**
 * Generar código aleatorio de 6 dígitos
 */
const generarCodigoAleatorio = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Enviar código de verificación por WhatsApp
 */
export const enviarCodigoVerificacion = async (telefono, usuarioId = null) => {
  try {
    // 1. Validar formato de teléfono
    const resultadoValidacion = validarTelefonoArgentino(telefono);
    if (!resultadoValidacion.valido) {
      throw new Error(resultadoValidacion.error);
    }

    // 2. Verificar si ya hay un código activo reciente (menos de 1 minuto)
    const hace1Minuto = new Date(Date.now() - 60000);
    const codigoReciente = await CodigoVerificacion.findOne({
      telefono,
      createdAt: { $gte: hace1Minuto },
    });

    if (codigoReciente) {
      throw new Error('Ya enviamos un código hace menos de 1 minuto. Por favor, esperá antes de solicitar otro.');
    }

    // 3. Invalidar códigos anteriores no verificados de este teléfono
    await CodigoVerificacion.updateMany(
      { telefono, verificado: false },
      { $set: { expiraEn: new Date() } } // Los marca como expirados
    );

    // 4. Generar nuevo código
    const codigo = generarCodigoAleatorio();

    // 5. Crear registro en BD (expira en 10 minutos)
    const expiraEn = new Date(Date.now() + 10 * 60000);
    const nuevoCodigoVerificacion = new CodigoVerificacion({
      telefono,
      codigo,
      usuario: usuarioId,
      expiraEn,
    });
    await nuevoCodigoVerificacion.save();

    // 6. Enviar código por WhatsApp
    const mensaje = `🔐 *Código de verificación*\n\n` +
      `Tu código es: *${codigo}*\n\n` +
      `Este código expira en 10 minutos.\n\n` +
      `Si no solicitaste este código, ignorá este mensaje.`;

    const enviado = await _enviarWhatsApp(telefono, mensaje);

    if (!enviado) {
      throw new Error('No se pudo enviar el código de verificación. Verificá que el número sea correcto.');
    }

    console.log(`✅ [VERIFICACIÓN] Código enviado a ${telefono}`);

    return {
      success: true,
      message: 'Código de verificación enviado exitosamente',
      expiraEn,
    };
  } catch (error) {
    console.error('[VERIFICACIÓN] Error al enviar código:', error);
    throw error;
  }
};

/**
 * Verificar código ingresado por el usuario
 */
export const verificarCodigo = async (telefono, codigoIngresado, usuarioId = null) => {
  try {
    // 1. Buscar código activo (no expirado, no verificado)
    const ahora = new Date();
    const codigoVerificacion = await CodigoVerificacion.findOne({
      telefono,
      verificado: false,
      expiraEn: { $gt: ahora },
    }).sort({ createdAt: -1 }); // El más reciente

    if (!codigoVerificacion) {
      throw new Error('No hay un código de verificación válido. Solicitá uno nuevo.');
    }

    // 2. Verificar si excedió intentos
    if (codigoVerificacion.excedioIntentos()) {
      throw new Error('Excediste el número máximo de intentos. Solicitá un nuevo código.');
    }

    // 3. Verificar si el código es correcto
    if (codigoVerificacion.codigo !== codigoIngresado) {
      // Incrementar intentos
      codigoVerificacion.intentos += 1;
      await codigoVerificacion.save();

      const intentosRestantes = 3 - codigoVerificacion.intentos;
      throw new Error(`Código incorrecto. Te quedan ${intentosRestantes} ${intentosRestantes === 1 ? 'intento' : 'intentos'}.`);
    }

    // 4. Código correcto - marcar como verificado
    codigoVerificacion.verificado = true;
    await codigoVerificacion.save();

    // 5. Marcar el teléfono como verificado en Usuario/Cliente/Barbero
    if (usuarioId) {
      const usuario = await Usuario.findById(usuarioId);
      if (usuario) {
        usuario.telefono = telefono; // Actualizar teléfono verificado
        usuario.telefonoVerificado = true;
        await usuario.save();

        // También actualizar en Cliente o Barbero si existe
        if (usuario.rol === 'cliente') {
          await Cliente.updateOne(
            { usuario: usuarioId },
            { $set: { telefono: telefono, telefonoVerificado: true } }
          );
        } else if (usuario.rol === 'barbero') {
          await Barbero.updateOne(
            { usuario: usuarioId },
            { $set: { telefono: telefono, telefonoVerificado: true } }
          );
        }
      }
    }

    console.log(`✅ [VERIFICACIÓN] Teléfono ${telefono} verificado exitosamente`);

    return {
      success: true,
      message: 'Teléfono verificado exitosamente',
    };
  } catch (error) {
    console.error('[VERIFICACIÓN] Error al verificar código:', error);
    throw error;
  }
};

/**
 * Verificar si un teléfono ya está verificado
 * Acepta el teléfono en cualquier formato y busca en todos los formatos posibles
 */
export const esTelefonoVerificado = async (telefono) => {
  try {
    // Normalizar el teléfono ingresado
    const resultadoValidacion = validarTelefonoArgentino(telefono);
    if (!resultadoValidacion.valido) {
      return false;
    }

    const telefonoNormalizado = resultadoValidacion.numeroNormalizado;

    // Generar formato local: "+5492914643232" -> "02914643232"
    let telefonoLocal = telefono;
    if (telefonoNormalizado.startsWith('+549')) {
      telefonoLocal = '0' + telefonoNormalizado.substring(4); // Quita +549 y agrega 0
    }

    // Buscar en Usuario por teléfono (en todos los formatos)
    const usuario = await Usuario.findOne({
      $or: [
        { telefono: telefono, telefonoVerificado: true },
        { telefono: telefonoNormalizado, telefonoVerificado: true },
        { telefono: telefonoLocal, telefonoVerificado: true }
      ]
    });
    if (usuario) return true;

    // Buscar en Cliente por teléfono (en todos los formatos)
    const cliente = await Cliente.findOne({
      $or: [
        { telefono: telefono, telefonoVerificado: true },
        { telefono: telefonoNormalizado, telefonoVerificado: true },
        { telefono: telefonoLocal, telefonoVerificado: true }
      ]
    });
    if (cliente) return true;

    // Buscar en Barbero por teléfono (en todos los formatos)
    const barbero = await Barbero.findOne({
      $or: [
        { telefono: telefono, telefonoVerificado: true },
        { telefono: telefonoNormalizado, telefonoVerificado: true },
        { telefono: telefonoLocal, telefonoVerificado: true }
      ]
    });
    if (barbero) return true;

    return false;
  } catch (error) {
    console.error('[VERIFICACIÓN] Error al verificar estado:', error);
    return false;
  }
};

/**
 * Verificar si el usuario autenticado tiene el teléfono verificado
 */
export const esUsuarioVerificado = async (usuarioId) => {
  try {
    // Buscar el usuario
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) return false;

    // Si es cliente, buscar en Cliente
    if (usuario.rol === 'cliente') {
      const cliente = await Cliente.findOne({ usuario: usuarioId });
      if (cliente && cliente.telefonoVerificado) return true;
    }

    // Si es barbero, buscar en Barbero
    if (usuario.rol === 'barbero') {
      const barbero = await Barbero.findOne({ usuario: usuarioId });
      if (barbero && barbero.telefonoVerificado) return true;
    }

    // Verificar directamente en Usuario
    return usuario.telefonoVerificado === true;
  } catch (error) {
    console.error('[VERIFICACIÓN] Error al verificar usuario:', error);
    return false;
  }
};

export default {
  enviarCodigoVerificacion,
  verificarCodigo,
  esTelefonoVerificado,
  esUsuarioVerificado,
};
