/**
 * Script para crear usuarios iniciales del sistema.
 * Crea 3 usuarios: admin, barbero y cliente.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Usuario from '../models/Usuario.js';
import Barbero from '../models/Barbero.js';
import Cliente from '../models/Cliente.js';
import conectarBaseDeDatos from '../config/conexion.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde la carpeta backend
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const usuariosIniciales = [
  {
    nombre: 'Admin',
    apellido: 'Sistema',
    email: 'admin@barberia.com',
    password: 'admin123',
    telefono: '+5491123456789',
    rol: 'admin',
    foto: 'https://via.placeholder.com/150',
  },
  {
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'barbero@barberia.com',
    password: 'barbero123',
    telefono: '+5491198765432',
    rol: 'barbero',
    foto: 'https://via.placeholder.com/150',
  },
  {
    nombre: 'Carlos',
    apellido: 'González',
    email: 'cliente@barberia.com',
    password: 'cliente123',
    telefono: '+5491156781234',
    rol: 'cliente',
    foto: 'https://via.placeholder.com/150',
  },
];

const crearUsuarios = async () => {
  try {
    await conectarBaseDeDatos();
    console.log('🚀 Iniciando creación de usuarios...\n');

    // Limpiar usuarios existentes (opcional - comentar si no deseas borrar)
    await Usuario.deleteMany({});
    await Barbero.deleteMany({});
    await Cliente.deleteMany({});
    console.log('🧹 Base de datos limpiada\n');

    for (const datosUsuario of usuariosIniciales) {
      const { nombre, apellido, email, password, telefono, rol, foto } = datosUsuario;

      // Verificar si el usuario ya existe
      const usuarioExistente = await Usuario.findOne({ email });
      if (usuarioExistente) {
        console.log(`⚠️  Usuario ${email} ya existe, saltando...`);
        continue;
      }

      // Crear usuario
      const usuario = await Usuario.create({
        nombre,
        apellido,
        email,
        password,
        telefono,
        rol,
        foto,
        activo: true,
      });

      console.log(`✅ Usuario ${rol} creado: ${email}`);

      // Si es barbero, crear registro en la tabla Barbero
      if (rol === 'barbero') {
        const barbero = await Barbero.create({
          usuario: usuario._id,
          nombre,
          apellido,
          email,
          telefono,
          foto,
          activo: true,
          objetivoMensual: 50000,
        });

        // Asociar el barbero al usuario
        usuario.barberoAsociado = barbero._id;
        await usuario.save();

        console.log(`   ✅ Registro de barbero creado para ${email}`);
      }

      // Si es cliente, crear registro en la tabla Cliente
      if (rol === 'cliente') {
        await Cliente.create({
          usuario: usuario._id,
          nombre,
          apellido,
          email,
          telefono,
          activo: true,
          telefonoVerificado: false,
        });

        console.log(`   ✅ Registro de cliente creado para ${email}`);
      }

      console.log('');
    }

    console.log('🎉 Usuarios creados exitosamente!\n');
    console.log('📋 Credenciales de acceso:');
    console.log('─────────────────────────────────────');
    console.log('👑 Admin:');
    console.log('   Email: admin@barberia.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('✂️  Barbero:');
    console.log('   Email: barbero@barberia.com');
    console.log('   Password: barbero123');
    console.log('');
    console.log('👤 Cliente:');
    console.log('   Email: cliente@barberia.com');
    console.log('   Password: cliente123');
    console.log('─────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear usuarios:', error);
    process.exit(1);
  }
};

crearUsuarios();
