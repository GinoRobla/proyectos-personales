/**
 * Script para limpiar completamente la base de datos
 * Elimina TODAS las colecciones y sus datos
 *
 * USO: node scripts/limpiar-base-de-datos.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Obtener la ruta del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar .env desde la carpeta backend (un nivel arriba)
dotenv.config({ path: join(__dirname, '..', '.env') });

// Importar TODOS los modelos
import Usuario from '../models/Usuario.js';
import Cliente from '../models/Cliente.js';
import Barbero from '../models/Barbero.js';
import Servicio from '../models/Servicio.js';
import Turno from '../models/Turno.js';
import DisponibilidadGeneral from '../models/DisponibilidadGeneral.js';
import DisponibilidadBarbero from '../models/DisponibilidadBarbero.js';
import Bloqueo from '../models/Bloqueo.js';
import ConfiguracionNegocio from '../models/ConfiguracionNegocio.js';
import TokenRecuperacion from '../models/TokenRecuperacion.js';

async function limpiarBaseDeDatos() {
  try {
    // Verificar que existe MONGODB_URI
    if (!process.env.MONGODB_URI) {
      throw new Error('❌ MONGODB_URI no está definida en el archivo .env');
    }

    // Conectar a MongoDB
    console.log('🔄 Conectando a MongoDB...');
    console.log(`📍 URI: ${process.env.MONGODB_URI}\n`);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    console.log('🗑️  LIMPIANDO BASE DE DATOS...\n');
    console.log('⚠️  ADVERTENCIA: Esta operación eliminará TODOS los datos\n');

    // Obtener conteo ANTES de eliminar
    const conteos = {
      usuarios: await Usuario.countDocuments(),
      clientes: await Cliente.countDocuments(),
      barberos: await Barbero.countDocuments(),
      servicios: await Servicio.countDocuments(),
      turnos: await Turno.countDocuments(),
      disponibilidadGeneral: await DisponibilidadGeneral.countDocuments(),
      disponibilidadBarbero: await DisponibilidadBarbero.countDocuments(),
      bloqueos: await Bloqueo.countDocuments(),
      configuracion: await ConfiguracionNegocio.countDocuments(),
      tokensRecuperacion: await TokenRecuperacion.countDocuments(),
      counters: await mongoose.connection.collection('counters').countDocuments(),
    };

    console.log('📊 DATOS ACTUALES:');
    console.log(`   - Usuarios: ${conteos.usuarios}`);
    console.log(`   - Clientes: ${conteos.clientes}`);
    console.log(`   - Barberos: ${conteos.barberos}`);
    console.log(`   - Servicios: ${conteos.servicios}`);
    console.log(`   - Turnos: ${conteos.turnos}`);
    console.log(`   - Disponibilidad General: ${conteos.disponibilidadGeneral}`);
    console.log(`   - Disponibilidad Barberos: ${conteos.disponibilidadBarbero}`);
    console.log(`   - Bloqueos: ${conteos.bloqueos}`);
    console.log(`   - Configuración: ${conteos.configuracion}`);
    console.log(`   - Tokens Recuperación: ${conteos.tokensRecuperacion}`);
    console.log(`   - Counters: ${conteos.counters}`);
    console.log('');

    // Eliminar en orden (respetando relaciones)
    console.log('🗑️  Eliminando colecciones...\n');

    // 1. Turnos (dependen de clientes, barberos, servicios)
    await Turno.deleteMany({});
    console.log('   ✅ Turnos eliminados');

    // 2. Tokens de recuperación (dependen de usuarios)
    await TokenRecuperacion.deleteMany({});
    console.log('   ✅ Tokens de recuperación eliminados');

    // 3. Disponibilidad de barberos (dependen de barberos)
    await DisponibilidadBarbero.deleteMany({});
    console.log('   ✅ Disponibilidad de barberos eliminada');

    // 4. Bloqueos
    await Bloqueo.deleteMany({});
    console.log('   ✅ Bloqueos eliminados');

    // 5. Disponibilidad general
    await DisponibilidadGeneral.deleteMany({});
    console.log('   ✅ Disponibilidad general eliminada');

    // 6. Clientes
    await Cliente.deleteMany({});
    console.log('   ✅ Clientes eliminados');

    // 7. Barberos
    await Barbero.deleteMany({});
    console.log('   ✅ Barberos eliminados');

    // 8. Servicios
    await Servicio.deleteMany({});
    console.log('   ✅ Servicios eliminados');

    // 9. Usuarios (debe ser después de clientes y barberos)
    await Usuario.deleteMany({});
    console.log('   ✅ Usuarios eliminados');

    // 10. Configuración del negocio
    await ConfiguracionNegocio.deleteMany({});
    console.log('   ✅ Configuración del negocio eliminada');

    // 11. Counters (colección auxiliar si existe)
    await mongoose.connection.collection('counters').deleteMany({});
    console.log('   ✅ Counters eliminados');

    console.log('\n✅ BASE DE DATOS COMPLETAMENTE LIMPIA\n');

    // Resumen
    const total = Object.values(conteos).reduce((acc, val) => acc + val, 0);
    console.log(`📊 RESUMEN: ${total} documentos eliminados en total\n`);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar
limpiarBaseDeDatos();
