/**
 * ============================================================================
 * SCRIPT: LIMPIAR BASE DE DATOS
 * ============================================================================
 *
 * Este script elimina TODOS los datos de la base de datos excepto:
 * - Los servicios (corte, barba, etc.)
 * - Una cuenta de cada rol (admin, barbero, cliente)
 *
 * IMPORTANTE: Este script es DESTRUCTIVO. Elimina todos los datos.
 * Úsalo solo cuando quieras resetear la base de datos.
 *
 * USO:
 * node backend/scripts/limpiarBaseDeDatos.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Importar modelos
import Usuario from '../models/Usuario.js';
import Barbero from '../models/Barbero.js';
import Cliente from '../models/Cliente.js';
import Servicio from '../models/Servicio.js';
import Turno from '../models/Turno.js';

// Cargar variables de entorno
dotenv.config();

/**
 * ============================================================================
 * FUNCIÓN PRINCIPAL
 * ============================================================================
 */
const limpiarBaseDeDatos = async () => {
  try {
    console.log('');
    console.log('='.repeat(60));
    console.log('🧹 INICIANDO LIMPIEZA DE BASE DE DATOS');
    console.log('='.repeat(60));
    console.log('');

    // ========================================================================
    // PASO 1: CONECTAR A LA BASE DE DATOS
    // ========================================================================
    console.log('🔄 Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/barberia");
    console.log('✅ Conectado a MongoDB\n');

    // ========================================================================
    // PASO 2: ELIMINAR TODOS LOS DATOS
    // ========================================================================
    console.log('🗑️  Eliminando todos los datos...');

    await Turno.deleteMany({});
    console.log('✅ Turnos eliminados');

    await Cliente.deleteMany({});
    console.log('✅ Clientes eliminados');

    await Barbero.deleteMany({});
    console.log('✅ Barberos eliminados');

    await Usuario.deleteMany({});
    console.log('✅ Usuarios eliminados');

    await Servicio.deleteMany({});
    console.log('✅ Servicios eliminados');

    console.log('');

    // ========================================================================
    // PASO 3: CREAR SERVICIOS BÁSICOS
    // ========================================================================
    console.log('📋 Creando servicios básicos...');

    const servicios = await Servicio.insertMany([
      {
        nombre: 'Corte Clásico',
        descripcion: 'Corte tradicional con tijera y máquina',
        duracion: 30, // minutos
        precioBase: 5000,
        activo: true,
        imagen: 'https://via.placeholder.com/300x200?text=Corte+Clásico',
      },
      {
        nombre: 'Corte + Barba',
        descripcion: 'Servicio completo de corte y arreglo de barba',
        duracion: 45,
        precioBase: 7500,
        activo: true,
        imagen: 'https://via.placeholder.com/300x200?text=Corte+Barba',
      },
      {
        nombre: 'Solo Barba',
        descripcion: 'Arreglo y perfilado de barba',
        duracion: 20,
        precioBase: 3000,
        activo: true,
        imagen: 'https://via.placeholder.com/300x200?text=Barba',
      },
      {
        nombre: 'Coloración',
        descripcion: 'Tinte profesional de cabello o barba',
        duracion: 60,
        precioBase: 10000,
        activo: true,
        imagen: 'https://via.placeholder.com/300x200?text=Coloración',
      },
    ]);

    console.log(`✅ ${servicios.length} servicios creados\n`);

    // ========================================================================
    // PASO 4: CREAR USUARIO ADMINISTRADOR
    // ========================================================================
    console.log('👤 Creando usuario administrador...');

    const usuarioAdmin = await Usuario.create({
      nombre: 'Admin',
      apellido: 'Sistema',
      email: 'admin@barberia.com',
      password: 'admin123', // Se encripta automáticamente por el modelo
      telefono: '+54 9 11 1111-1111',
      rol: 'admin',
      activo: true,
    });

    console.log('✅ Admin creado:');
    console.log('   Email: admin@barberia.com');
    console.log('   Password: admin123');
    console.log('');

    // ========================================================================
    // PASO 5: CREAR BARBERO Y USUARIO BARBERO
    // ========================================================================
    console.log('💈 Creando barbero de prueba...');

    // Primero crear el perfil de barbero
    const barbero = await Barbero.create({
      nombre: 'Carlos',
      apellido: 'Martínez',
      email: 'barbero@barberia.com',
      telefono: '+54 9 11 2222-2222',
      especialidad: 'Cortes clásicos y modernos',
      activo: true,
      horarioLaboral: {
        1: { inicio: '09:00', fin: '18:00' }, // Lunes
        2: { inicio: '09:00', fin: '18:00' }, // Martes
        3: { inicio: '09:00', fin: '18:00' }, // Miércoles
        4: { inicio: '09:00', fin: '18:00' }, // Jueves
        5: { inicio: '09:00', fin: '18:00' }, // Viernes
        6: { inicio: '09:00', fin: '14:00' }, // Sábado
      },
    });

    // Luego crear el usuario asociado
    const usuarioBarbero = await Usuario.create({
      nombre: 'Carlos',
      apellido: 'Martínez',
      email: 'barbero@barberia.com',
      password: 'barbero123',
      telefono: '+54 9 11 2222-2222',
      rol: 'barbero',
      activo: true,
      barberoAsociado: barbero._id, // Vincular con el perfil de barbero
    });

    console.log('✅ Barbero creado:');
    console.log('   Email: barbero@barberia.com');
    console.log('   Password: barbero123');
    console.log('');

    // ========================================================================
    // PASO 6: CREAR USUARIO CLIENTE
    // ========================================================================
    console.log('👨 Creando usuario cliente...');

    const usuarioCliente = await Usuario.create({
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'cliente@barberia.com',
      password: 'cliente123',
      telefono: '+54 9 11 3333-3333',
      rol: 'cliente',
      activo: true,
    });

    console.log('✅ Cliente creado:');
    console.log('   Email: cliente@barberia.com');
    console.log('   Password: cliente123');
    console.log('');

    // ========================================================================
    // PASO 7: RESUMEN FINAL
    // ========================================================================
    console.log('='.repeat(60));
    console.log('✅ LIMPIEZA COMPLETADA EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('');
    console.log('📊 RESUMEN DE DATOS:');
    console.log('');
    console.log(`   Servicios: ${servicios.length}`);
    console.log('   Usuarios: 3 (1 admin, 1 barbero, 1 cliente)');
    console.log('   Barberos: 1');
    console.log('   Clientes: 0');
    console.log('   Turnos: 0');
    console.log('');
    console.log('🔑 CREDENCIALES DE ACCESO:');
    console.log('');
    console.log('   ADMIN:');
    console.log('   - Email: admin@barberia.com');
    console.log('   - Password: admin123');
    console.log('');
    console.log('   BARBERO:');
    console.log('   - Email: barbero@barberia.com');
    console.log('   - Password: barbero123');
    console.log('');
    console.log('   CLIENTE:');
    console.log('   - Email: cliente@barberia.com');
    console.log('   - Password: cliente123');
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
    console.error('❌ ERROR EN LA LIMPIEZA');
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
limpiarBaseDeDatos();
