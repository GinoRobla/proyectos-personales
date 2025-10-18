/**
 * ============================================================================
 * SCRIPT PARA LIMPIAR COMPLETAMENTE LA BASE DE DATOS
 * ============================================================================
 *
 * Este script elimina TODOS los registros de todas las colecciones en MongoDB.
 *
 * USO:
 * node backend/scripts/limpiarBaseDeDatos.js
 *
 * ADVERTENCIA:
 * Esta operación NO se puede deshacer. Todos los datos serán eliminados permanentemente.
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { Usuario, Barbero, Cliente, Servicio, Turno } from '../models/index.js';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde la raíz del backend
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Función principal para limpiar la base de datos
 */
const limpiarBaseDeDatos = async () => {
  try {
    console.log('');
    console.log('='.repeat(70));
    console.log(' LIMPIEZA DE BASE DE DATOS - ADVERTENCIA ');
    console.log('='.repeat(70));
    console.log('');
    console.log('⚠️  Esta operación eliminará TODOS los datos de la base de datos.');
    console.log('⚠️  Esta acción NO se puede deshacer.');
    console.log('');

    // Conectar a MongoDB
    console.log('🔄 Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conexión establecida');
    console.log('');

    // Obtener conteos antes de eliminar
    console.log('📊 Conteo actual de registros:');
    const conteoUsuarios = await Usuario.countDocuments();
    const conteoBarberos = await Barbero.countDocuments();
    const conteoClientes = await Cliente.countDocuments();
    const conteoServicios = await Servicio.countDocuments();
    const conteoTurnos = await Turno.countDocuments();

    console.log(`   - Usuarios:  ${conteoUsuarios}`);
    console.log(`   - Barberos:  ${conteoBarberos}`);
    console.log(`   - Clientes:  ${conteoClientes}`);
    console.log(`   - Servicios: ${conteoServicios}`);
    console.log(`   - Turnos:    ${conteoTurnos}`);
    console.log('');

    const totalRegistros = conteoUsuarios + conteoBarberos + conteoClientes + conteoServicios + conteoTurnos;

    if (totalRegistros === 0) {
      console.log('ℹ️  La base de datos ya está vacía. No hay nada que eliminar.');
      console.log('');
      await mongoose.connection.close();
      console.log('✅ Conexión cerrada');
      return;
    }

    console.log(`📝 Total de registros a eliminar: ${totalRegistros}`);
    console.log('');

    // Iniciar proceso de eliminación
    console.log('🗑️  Iniciando limpieza de colecciones...');
    console.log('');

    // Eliminar Turnos (primero porque puede tener referencias)
    console.log('🔄 Eliminando turnos...');
    const resultadoTurnos = await Turno.deleteMany({});
    console.log(`   ✅ ${resultadoTurnos.deletedCount} turnos eliminados`);

    // Eliminar Servicios
    console.log('🔄 Eliminando servicios...');
    const resultadoServicios = await Servicio.deleteMany({});
    console.log(`   ✅ ${resultadoServicios.deletedCount} servicios eliminados`);

    // Eliminar Barberos
    console.log('🔄 Eliminando barberos...');
    const resultadoBarberos = await Barbero.deleteMany({});
    console.log(`   ✅ ${resultadoBarberos.deletedCount} barberos eliminados`);

    // Eliminar Clientes
    console.log('🔄 Eliminando clientes...');
    const resultadoClientes = await Cliente.deleteMany({});
    console.log(`   ✅ ${resultadoClientes.deletedCount} clientes eliminados`);

    // Eliminar Usuarios
    console.log('🔄 Eliminando usuarios...');
    const resultadoUsuarios = await Usuario.deleteMany({});
    console.log(`   ✅ ${resultadoUsuarios.deletedCount} usuarios eliminados`);

    console.log('');
    console.log('='.repeat(70));
    console.log(' LIMPIEZA COMPLETADA EXITOSAMENTE ');
    console.log('='.repeat(70));
    console.log('');
    console.log('✅ La base de datos ha sido limpiada completamente');
    console.log('');

    const totalEliminados =
      resultadoTurnos.deletedCount +
      resultadoServicios.deletedCount +
      resultadoBarberos.deletedCount +
      resultadoClientes.deletedCount +
      resultadoUsuarios.deletedCount;

    console.log(`📊 Resumen:`);
    console.log(`   - Total de registros eliminados: ${totalEliminados}`);
    console.log('');

    // Verificar que todo esté vacío
    console.log('🔍 Verificando que la base de datos esté vacía...');
    const verificacionUsuarios = await Usuario.countDocuments();
    const verificacionBarberos = await Barbero.countDocuments();
    const verificacionClientes = await Cliente.countDocuments();
    const verificacionServicios = await Servicio.countDocuments();
    const verificacionTurnos = await Turno.countDocuments();

    const totalRestante =
      verificacionUsuarios +
      verificacionBarberos +
      verificacionClientes +
      verificacionServicios +
      verificacionTurnos;

    if (totalRestante === 0) {
      console.log('   ✅ Verificación exitosa: Base de datos completamente vacía');
    } else {
      console.log('   ⚠️  Advertencia: Aún quedan algunos registros en la base de datos');
      console.log(`      Total restante: ${totalRestante}`);
    }

    console.log('');

  } catch (error) {
    console.error('');
    console.error('='.repeat(70));
    console.error(' ERROR AL LIMPIAR LA BASE DE DATOS ');
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
limpiarBaseDeDatos();
