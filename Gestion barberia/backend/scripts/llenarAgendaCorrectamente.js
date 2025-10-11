/**
 * ============================================================================
 * SCRIPT: LLENAR AGENDA CORRECTAMENTE
 * ============================================================================
 *
 * Este script llena la agenda del lunes 13/10/2025 respetando las duraciones
 * de los servicios. Cada turno comienza cuando termina el anterior.
 *
 * USO:
 * node backend/scripts/llenarAgendaCorrectamente.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Importar modelos
import Usuario from '../models/Usuario.js';
import Cliente from '../models/Cliente.js';
import Barbero from '../models/Barbero.js';
import Servicio from '../models/Servicio.js';
import Turno from '../models/Turno.js';

// Cargar variables de entorno
dotenv.config();

/**
 * Convierte hora HH:MM a minutos desde las 00:00
 */
const horaAMinutos = (hora) => {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
};

/**
 * Convierte minutos desde las 00:00 a formato HH:MM
 */
const minutosAHora = (minutos) => {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/**
 * ============================================================================
 * FUNCIÓN PRINCIPAL
 * ============================================================================
 */
const llenarAgenda = async () => {
  try {
    console.log('');
    console.log('='.repeat(60));
    console.log('📅 LLENANDO AGENDA CORRECTAMENTE');
    console.log('='.repeat(60));
    console.log('');

    // Conectar a la base de datos
    console.log('🔄 Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Buscar el cliente
    const usuarioCliente = await Usuario.findOne({ email: 'cliente@barberia.com' });
    if (!usuarioCliente) {
      throw new Error('No se encontró el usuario cliente');
    }

    // Buscar o crear el perfil de cliente
    let cliente = await Cliente.findOne({ email: 'cliente@barberia.com' });
    if (!cliente) {
      throw new Error('No se encontró el perfil del cliente');
    }

    // Buscar el barbero Carlos
    const barbero = await Barbero.findOne({ nombre: 'Carlos', apellido: 'Martínez' });
    if (!barbero) {
      throw new Error('No se encontró el barbero Carlos');
    }

    // Obtener servicios
    const servicios = await Servicio.find({ activo: true });
    if (servicios.length === 0) {
      throw new Error('No hay servicios disponibles');
    }

    console.log('📋 Servicios disponibles:');
    servicios.forEach(s => {
      console.log(`   - ${s.nombre}: ${s.duracion} minutos`);
    });
    console.log('');

    // Eliminar turnos existentes del lunes 13
    const fecha = new Date('2025-10-13');
    await Turno.deleteMany({
      barbero: barbero._id,
      fecha: fecha
    });
    console.log('✅ Turnos anteriores del lunes 13 eliminados\n');

    console.log('📋 Creando turnos respetando duraciones...\n');

    const turnosCreados = [];
    const horaInicio = 9 * 60; // 9:00 en minutos
    const horaFin = 18 * 60; // 18:00 en minutos
    let horaActual = horaInicio;

    while (horaActual < horaFin) {
      // Elegir servicio aleatorio
      const servicioAleatorio = servicios[Math.floor(Math.random() * servicios.length)];

      // Verificar si el servicio cabe en el horario restante
      if (horaActual + servicioAleatorio.duracion > horaFin) {
        console.log(`⏰ No hay tiempo suficiente para más turnos (quedan ${horaFin - horaActual} minutos)`);
        break;
      }

      const horaString = minutosAHora(horaActual);

      // Crear turno
      const turno = await Turno.create({
        cliente: cliente._id,
        barbero: barbero._id,
        servicio: servicioAleatorio._id,
        fecha: fecha,
        hora: horaString,
        estado: 'confirmado',
        precio: servicioAleatorio.precioBase,
        metodoPago: 'pendiente',
        pagado: false,
        notasCliente: '',
        notasBarbero: '',
      });

      turnosCreados.push(turno);
      console.log(`✅ ${horaString} - ${servicioAleatorio.nombre} (${servicioAleatorio.duracion} min)`);

      // Avanzar al siguiente turno disponible
      horaActual += servicioAleatorio.duracion;
    }

    // Resumen final
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ AGENDA LLENADA CORRECTAMENTE');
    console.log('='.repeat(60));
    console.log('');
    console.log('📊 RESUMEN:');
    console.log('');
    console.log(`   Cliente: ${cliente.nombre} ${cliente.apellido}`);
    console.log(`   Barbero: ${barbero.nombre} ${barbero.apellido}`);
    console.log(`   Fecha: Lunes 13/10/2025`);
    console.log(`   Turnos creados: ${turnosCreados.length}`);
    console.log(`   Horario: ${minutosAHora(horaInicio)} - ${minutosAHora(horaActual)}`);
    console.log('');
    console.log('🔑 Para ver la agenda, inicia sesión como barbero:');
    console.log('   Email: barbero@barberia.com');
    console.log('   Password: barbero123');
    console.log('');
    console.log('='.repeat(60));
    console.log('');

    // Cerrar conexión
    await mongoose.connection.close();
    console.log('👋 Conexión cerrada\n');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('❌ ERROR AL LLENAR AGENDA');
    console.error('='.repeat(60));
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    console.error('Detalles:', error);
    console.error('');

    await mongoose.connection.close();
    process.exit(1);
  }
};

// Ejecutar el script
llenarAgenda();
