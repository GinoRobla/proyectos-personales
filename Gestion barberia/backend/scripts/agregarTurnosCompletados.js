/**
 * ============================================================================
 * SCRIPT: AGREGAR TURNOS COMPLETADOS
 * ============================================================================
 *
 * Este script agrega 10 turnos completados al historial del cliente.
 *
 * USO:
 * node backend/scripts/agregarTurnosCompletados.js
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
const agregarTurnosCompletados = async () => {
  try {
    console.log('');
    console.log('='.repeat(60));
    console.log('📅 AGREGANDO TURNOS COMPLETADOS');
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

    // Buscar el barbero
    const barbero = await Barbero.findOne({ email: 'barbero@barberia.com' });
    if (!barbero) {
      throw new Error('No se encontró el barbero');
    }

    // Obtener servicios
    const servicios = await Servicio.find({ activo: true });
    if (servicios.length === 0) {
      throw new Error('No hay servicios disponibles');
    }

    console.log('📋 Creando 10 turnos completados...\n');

    // Crear 10 turnos completados en fechas pasadas
    const turnosCreados = [];
    const fechaActual = new Date();

    for (let i = 1; i <= 10; i++) {
      // Calcular fecha pasada (10 días atrás, 20 días atrás, etc.)
      const diasAtras = i * 10;
      const fechaTurno = new Date(fechaActual);
      fechaTurno.setDate(fechaTurno.getDate() - diasAtras);

      // Elegir servicio aleatorio
      const servicioAleatorio = servicios[Math.floor(Math.random() * servicios.length)];

      // Crear turno completado
      const turno = await Turno.create({
        cliente: cliente._id,
        barbero: barbero._id,
        servicio: servicioAleatorio._id,
        fecha: fechaTurno,
        hora: ['10:00', '11:00', '14:00', '15:00', '16:00'][i % 5], // Variar horas
        estado: 'completado',
        precio: servicioAleatorio.precioBase,
        metodoPago: ['efectivo', 'mercadopago'][i % 2], // Alternar métodos de pago
        pagado: true,
        notasCliente: i % 3 === 0 ? 'Excelente atención como siempre' : '',
        notasBarbero: i % 2 === 0 ? 'Cliente regular, prefiere corte clásico' : '',
      });

      turnosCreados.push(turno);
      console.log(`✅ Turno ${i}/10 creado - ${fechaTurno.toLocaleDateString('es-AR')} a las ${turno.hora}`);
    }

    // Resumen final
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ TURNOS COMPLETADOS AGREGADOS EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('');
    console.log('📊 RESUMEN:');
    console.log('');
    console.log(`   Cliente: ${cliente.nombre} ${cliente.apellido}`);
    console.log(`   Email: ${cliente.email}`);
    console.log(`   Turnos completados agregados: ${turnosCreados.length}`);
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
agregarTurnosCompletados();
