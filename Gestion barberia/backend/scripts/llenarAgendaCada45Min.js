/**
 * ============================================================================
 * SCRIPT: LLENAR AGENDA CADA 45 MINUTOS
 * ============================================================================
 *
 * Este script llena la agenda del lunes 13/10/2025 con turnos cada 45 minutos.
 * Horario: 9:00 - 18:00
 *
 * USO:
 * node backend/scripts/llenarAgendaCada45Min.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Usuario from '../models/Usuario.js';
import Cliente from '../models/Cliente.js';
import Barbero from '../models/Barbero.js';
import Servicio from '../models/Servicio.js';
import Turno from '../models/Turno.js';

dotenv.config();

const llenarAgenda = async () => {
  try {
    console.log('');
    console.log('='.repeat(60));
    console.log('📅 LLENANDO AGENDA - TURNOS CADA 45 MINUTOS');
    console.log('='.repeat(60));
    console.log('');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const usuarioCliente = await Usuario.findOne({ email: 'cliente@barberia.com' });
    let cliente = await Cliente.findOne({ email: 'cliente@barberia.com' });
    const barbero = await Barbero.findOne({ nombre: 'Carlos', apellido: 'Martínez' });
    const servicios = await Servicio.find({ activo: true });

    console.log('📋 Servicios disponibles:');
    servicios.forEach(s => console.log(`   - ${s.nombre}: ${s.duracion} min`));
    console.log('');

    // Eliminar turnos existentes del lunes 13
    const fecha = new Date('2025-10-13');
    await Turno.deleteMany({ barbero: barbero._id, fecha: fecha });
    console.log('✅ Turnos anteriores eliminados\n');

    console.log('📋 Creando turnos cada 45 minutos...\n');

    const turnosCreados = [];

    // Turnos cada 45 minutos de 9:00 a 18:00
    const horas = [
      '09:00', '09:45', '10:30', '11:15', '12:00', '12:45',
      '13:30', '14:15', '15:00', '15:45', '16:30', '17:15'
    ];

    for (const hora of horas) {
      const servicioAleatorio = servicios[Math.floor(Math.random() * servicios.length)];

      const turno = await Turno.create({
        cliente: cliente._id,
        barbero: barbero._id,
        servicio: servicioAleatorio._id,
        fecha: fecha,
        hora: hora,
        estado: 'confirmado',
        precio: servicioAleatorio.precioBase,
        metodoPago: 'pendiente',
        pagado: false,
        notasCliente: '',
        notasBarbero: '',
      });

      turnosCreados.push(turno);
      console.log(`✅ ${hora} - ${servicioAleatorio.nombre}`);
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ AGENDA LLENADA CORRECTAMENTE');
    console.log('='.repeat(60));
    console.log('');
    console.log('📊 RESUMEN:');
    console.log(`   Turnos creados: ${turnosCreados.length}`);
    console.log(`   Horario: 9:00 - 18:00 (cada 45 minutos)`);
    console.log('');
    console.log('='.repeat(60));
    console.log('');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

llenarAgenda();
