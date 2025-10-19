/**
 * Configuración de conexión a MongoDB usando Mongoose.
 * Maneja la conexión, eventos y cierre limpio de la base de datos.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Conecta la aplicación a MongoDB usando la URI del archivo .env
 * @returns {Promise} Conexión establecida
 */
const conectarBaseDeDatos = async () => {
  try {
    const conexion = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB conectado: ${conexion.connection.name}`);
    return conexion;
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    console.error('Verifica MONGODB_URI en .env y que MongoDB esté corriendo');
    process.exit(1);
  }
};

// Evento: conexión exitosa
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose conectado');
});

// Evento: error en la conexión
mongoose.connection.on('error', (error) => {
  console.error('❌ Error en conexión:', error);
});

// Evento: desconexión
mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose desconectado');
});

// Cierre limpio al presionar Ctrl+C
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('👋 Conexión cerrada correctamente');
  process.exit(0);
});

export default conectarBaseDeDatos;