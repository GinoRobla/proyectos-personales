/**
 * ============================================================================
 * SCRIPT: AGREGAR TURNOS CONFIRMADOS
 * ============================================================================
 *
 * Este script llena completamente la agenda del barbero Carlos para:
 * - Sábado 11/10/2025 (9:00 - 14:00)
 * - Lunes 13/10/2025 (9:00 - 18:00)
 * - Martes 14/10/2025 (9:00 - 18:00)
 *
 * USO:
 * node backend/scripts/agregarTurnosConfirmados.js
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
 * ============================================================================
 * FUNCIÓN PRINCIPAL
 * ============================================================================
 */
const agregarTurnosConfirmados = async () => {
  try {
    console.log('');
    console.log('='.repeat(60));
    console.log('📅 AGREGANDO TURNOS CONFIRMADOS');
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
      cliente = await Cliente.create({
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'cliente@barberia.com',
        telefono: '+54 9 11 3333-3333',
        usuario: usuarioCliente._id,
      });
      console.log('✅ Perfil de cliente creado\n');
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

    console.log('📋 Llenando agenda del Lunes 13/10/2025...\n');

    // Eliminar turnos existentes del lunes 13
    await Turno.deleteMany({
      barbero: barbero._id,
      fecha: new Date('2025-10-13')
    });
    console.log('✅ Turnos anteriores del lunes 13 eliminados\n');

    const turnosCreados = [];

    // Lunes 13/10/2025 - Horario: 9:00 a 18:00
    const fecha = new Date('2025-10-13');
    const horas = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];

    for (const hora of horas) {
      // Elegir servicio aleatorio
      const servicioAleatorio = servicios[Math.floor(Math.random() * servicios.length)];

      // Crear turno confirmado
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
      console.log(`✅ Turno creado - ${hora} - ${servicioAleatorio.nombre}`);
    }

    // Resumen final
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ TURNOS CONFIRMADOS AGREGADOS EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('');
    console.log('📊 RESUMEN:');
    console.log('');
    console.log(`   Cliente: ${cliente.nombre} ${cliente.apellido}`);
    console.log(`   Email: ${cliente.email}`);
    console.log(`   Barbero: ${barbero.nombre} ${barbero.apellido}`);
    console.log(`   Turnos confirmados agregados: ${turnosCreados.length}`);
    console.log(`   Fecha: Lunes 13/10/2025`);
    console.log(`   Horario: 9:00 - 18:00 (agenda completa)`);
    console.log('');
    console.log('🔑 Para ver los turnos, inicia sesión con:');
    console.log('   Email: cliente@barberia.com');
    console.log('   Password: cliente123');
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
    console.error('❌ ERROR AL AGREGAR TURNOS');
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
agregarTurnosConfirmados();
