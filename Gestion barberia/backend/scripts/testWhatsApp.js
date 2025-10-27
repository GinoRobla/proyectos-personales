/**
 * Script de prueba para verificar envío de WhatsApp
 * Ejecutar: node scripts/testWhatsApp.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Turno from '../models/Turno.js';
import Cliente from '../models/Cliente.js';
import Barbero from '../models/Barbero.js';
import Servicio from '../models/Servicio.js';
import { enviarCancelacionBarberoWhatsApp } from '../services/whatsappService.js';

dotenv.config();

const probarEnvioWhatsApp = async () => {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Buscar un turno cancelado reciente con barbero
    console.log('🔍 Buscando turno cancelado con barbero...');
    const turno = await Turno.findOne({
      estado: 'cancelado',
      barbero: { $ne: null }
    })
      .populate('cliente')
      .populate('barbero')
      .populate('servicio')
      .sort({ updatedAt: -1 }); // El más reciente

    if (!turno) {
      console.log('❌ No se encontró ningún turno cancelado con barbero asignado');
      console.log('\n💡 Sugerencia: Cancela un turno desde la aplicación y vuelve a ejecutar este script\n');
      return;
    }

    console.log('✅ Turno encontrado:');
    console.log('  - ID:', turno._id);
    console.log('  - Cliente:', turno.cliente?.nombre, turno.cliente?.apellido);
    console.log('  - Barbero:', turno.barbero?.nombre, turno.barbero?.apellido);
    console.log('  - Teléfono barbero:', turno.barbero?.telefono);
    console.log('  - Servicio:', turno.servicio?.nombre);
    console.log('  - Fecha:', turno.fecha);
    console.log('  - Hora:', turno.hora);
    console.log('  - Estado:', turno.estado);
    console.log('');

    // Verificar configuración de Twilio
    console.log('�� Configuración de Twilio:');
    console.log('  - ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Configurado' : '❌ No configurado');
    console.log('  - AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Configurado' : '❌ No configurado');
    console.log('  - WHATSAPP_FROM:', process.env.TWILIO_WHATSAPP_FROM || '❌ No configurado');
    console.log('');

    if (!turno.barbero?.telefono) {
      console.log('❌ El barbero no tiene teléfono configurado');
      return;
    }

    // Intentar enviar el WhatsApp
    console.log('📱 Intentando enviar WhatsApp...\n');
    const resultado = await enviarCancelacionBarberoWhatsApp(
      turno,
      turno.cliente,
      turno.barbero,
      turno.servicio
    );

    if (resultado) {
      console.log('\n✅ WhatsApp enviado exitosamente!');
      console.log(`📱 Debería llegar a: ${turno.barbero.telefono}`);
    } else {
      console.log('\n❌ No se pudo enviar el WhatsApp');
      console.log('Revisa los logs anteriores para más detalles');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
};

// Ejecutar la prueba
probarEnvioWhatsApp();
