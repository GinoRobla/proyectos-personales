/**
 * ============================================================================
 * SCRIPT PARA CREAR USUARIOS INICIALES DEL SISTEMA
 * ============================================================================
 *
 * Este script crea usuarios de prueba para cada rol del sistema:
 * - Administrador (gestiona la barbería)
 * - Barbero (atiende clientes)
 * - Cliente (reserva turnos)
 *
 * USO:
 * node backend/scripts/crearUsuariosIniciales.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { Usuario, Barbero, Cliente } from '../models/index.js';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde la raíz del backend
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Función principal para crear los usuarios iniciales
 */
const crearUsuariosIniciales = async () => {
  try {
    console.log('');
    console.log('='.repeat(70));
    console.log(' CREACIÓN DE USUARIOS INICIALES ');
    console.log('='.repeat(70));
    console.log('');

    // Conectar a MongoDB
    console.log('🔄 Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conexión establecida');
    console.log('');

    // Verificar si ya existen usuarios
    const usuariosExistentes = await Usuario.countDocuments();
    if (usuariosExistentes > 0) {
      console.log('⚠️  Ya existen usuarios en la base de datos.');
      console.log(`   Total de usuarios: ${usuariosExistentes}`);
      console.log('');
      console.log('💡 Si deseas recrear los usuarios, primero limpia la base de datos con:');
      console.log('   node backend/scripts/limpiarBaseDeDatos.js');
      console.log('');
      await mongoose.connection.close();
      return;
    }

    // ===== CREAR USUARIO ADMINISTRADOR =====
    console.log('👨‍💼 Creando usuario administrador...');
    const usuarioAdmin = await Usuario.create({
      nombre: 'Admin',
      apellido: 'Sistema',
      email: 'admin@barberia.com',
      password: 'admin123', // Se encriptará automáticamente por el middleware del modelo
      telefono: '+54 9 291 123 4567',
      rol: 'admin',
      verificado: true,
    });
    console.log('   ✅ Usuario admin creado');
    console.log(`   📧 Email: admin@barberia.com`);
    console.log(`   🔑 Contraseña: admin123`);
    console.log('');

    // ===== CREAR USUARIO BARBERO =====
    console.log('💈 Creando usuario barbero...');
    const usuarioBarbero = await Usuario.create({
      nombre: 'Carlos',
      apellido: 'Pérez',
      email: 'barbero@barberia.com',
      password: 'barbero123', // Se encriptará automáticamente por el middleware del modelo
      telefono: '+54 9 291 234 5678',
      rol: 'barbero',
      verificado: true,
    });

    // Crear perfil de barbero (Barbero es una entidad independiente)
    const perfilBarbero = await Barbero.create({
      usuario: usuarioBarbero._id,
      nombre: 'Carlos',
      apellido: 'Pérez',
      email: 'barbero@barberia.com',
      telefono: '+54 9 291 234 5678',
      activo: true,
      objetivoMensual: 50000,
    });

    console.log('   ✅ Usuario barbero creado');
    console.log(`   📧 Email: barbero@barberia.com`);
    console.log(`   🔑 Contraseña: barbero123`);
    console.log('');

    // ===== CREAR USUARIO CLIENTE =====
    console.log('👤 Creando usuario cliente...');
    const usuarioCliente = await Usuario.create({
      nombre: 'Juan',
      apellido: 'González',
      email: 'cliente@email.com',
      password: 'cliente123', // Se encriptará automáticamente por el middleware del modelo
      telefono: '+54 9 291 345 6789',
      rol: 'cliente',
      verificado: true,
    });

    // Crear perfil de cliente (Cliente es una entidad independiente)
    const perfilCliente = await Cliente.create({
      usuario: usuarioCliente._id,
      nombre: 'Juan',
      apellido: 'González',
      email: 'cliente@email.com',
      telefono: '+54 9 291 345 6789',
      activo: true,
    });

    console.log('   ✅ Usuario cliente creado');
    console.log(`   📧 Email: cliente@email.com`);
    console.log(`   🔑 Contraseña: cliente123`);
    console.log('');

    console.log('='.repeat(70));
    console.log(' USUARIOS CREADOS EXITOSAMENTE ');
    console.log('='.repeat(70));
    console.log('');
    console.log('📊 Resumen:');
    console.log('');
    console.log('👨‍💼 ADMINISTRADOR:');
    console.log('   Email:      admin@barberia.com');
    console.log('   Contraseña: admin123');
    console.log('   Rol:        admin');
    console.log('');
    console.log('💈 BARBERO:');
    console.log('   Email:      barbero@barberia.com');
    console.log('   Contraseña: barbero123');
    console.log('   Rol:        barbero');
    console.log('');
    console.log('👤 CLIENTE:');
    console.log('   Email:      cliente@email.com');
    console.log('   Contraseña: cliente123');
    console.log('   Rol:        cliente');
    console.log('');
    console.log('💡 Puedes usar estas credenciales para iniciar sesión en la aplicación');
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambia estas contraseñas en producción!');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('='.repeat(70));
    console.error(' ERROR AL CREAR USUARIOS ');
    console.error('='.repeat(70));
    console.error('');
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('📝 Detalles completos:');
    console.error(error);
    console.error('');
  } finally {
    // Cerrar la conexión a la base de datos
    await mongoose.connection.close();
    console.log('🔌 Conexión a la base de datos cerrada');
    console.log('');
    console.log('='.repeat(70));
    console.log('');
  }
};

// Ejecutar el script
crearUsuariosIniciales();
