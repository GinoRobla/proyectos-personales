/**
 * ============================================================================
 * CONFIGURACIÓN DE CONEXIÓN A LA BASE DE DATOS
 * ============================================================================
 *
 * Este archivo maneja la conexión con MongoDB, la base de datos donde se
 * guarda toda la información de la barbería (usuarios, turnos, etc.).
 *
 * QUÉ ES MONGODB:
 * MongoDB es una base de datos NoSQL que guarda información en documentos
 * (similar a objetos JSON). Es perfecta para aplicaciones modernas.
 *
 * QUÉ ES MONGOOSE:
 * Mongoose es una librería que facilita el trabajo con MongoDB desde Node.js.
 * Nos permite definir esquemas (modelos) y validar datos automáticamente.
 *
 * RESPONSABILIDADES DE ESTE ARCHIVO:
 * - Establecer la conexión con MongoDB usando la URL de la base de datos
 * - Mostrar mensajes informativos sobre el estado de la conexión
 * - Manejar errores de conexión
 * - Cerrar la conexión limpiamente cuando la aplicación se cierra
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Cargar las variables de entorno desde el archivo .env
dotenv.config();

/**
 * CONECTAR A LA BASE DE DATOS
 *
 * Esta función establece la conexión con MongoDB.
 *
 * CÓMO FUNCIONA:
 * 1. Lee la URL de conexión desde las variables de entorno (MONGODB_URI)
 * 2. Intenta conectarse a MongoDB usando Mongoose
 * 3. Si la conexión es exitosa, muestra información en la consola
 * 4. Si hay un error, lo muestra y termina la aplicación
 *
 * @returns {Promise} Promesa que resuelve con la conexión si es exitosa
 *
 * IMPORTANTE:
 * Esta función es asíncrona (async), lo que significa que puede tardar
 * un poco en completarse. Siempre debe usarse con await.
 *
 * EJEMPLO DE USO:
 * await conectarBaseDeDatos();
 */
const conectarBaseDeDatos = async () => {
  try {
    // Paso 1: Intentar conectar a MongoDB
    // process.env.MONGODB_URI contiene la URL de la base de datos (viene del archivo .env)
    const conexionEstablecida = await mongoose.connect(process.env.MONGODB_URI, {
      // Opciones de conexión para compatibilidad y estabilidad
      useNewUrlParser: true, // Usa el nuevo parser de URLs de MongoDB
      useUnifiedTopology: true, // Usa el nuevo motor de gestión de conexiones
    });

    // Paso 2: Si llegamos aquí, la conexión fue exitosa
    // Mostrar información útil en la consola
    console.log(`✅ MongoDB conectado exitosamente`);
    console.log(`🖥️  Servidor: ${conexionEstablecida.connection.host}`);
    console.log(`📊 Base de datos: ${conexionEstablecida.connection.name}`);

    // Devolver la conexión por si se necesita usar después
    return conexionEstablecida;
  } catch (errorDeConexion) {
    // Paso 3: Si hubo un error, mostrarlo y salir de la aplicación
    console.error('❌ ERROR: No se pudo conectar a MongoDB');
    console.error('📝 Detalles del error:', errorDeConexion.message);
    console.error('');
    console.error('💡 Posibles soluciones:');
    console.error('   1. Verifica que MongoDB esté ejecutándose');
    console.error('   2. Revisa que la URL en MONGODB_URI sea correcta');
    console.error('   3. Verifica tu conexión a internet (si usas MongoDB Atlas)');
    console.error('   4. Asegúrate de que las credenciales sean correctas');

    // Salir del proceso con código de error (1)
    // Esto detiene toda la aplicación porque sin BD no puede funcionar
    process.exit(1);
  }
};

/**
 * ============================================================================
 * EVENTOS DE LA CONEXIÓN
 * ============================================================================
 *
 * Mongoose emite eventos cuando pasan cosas con la conexión.
 * Aquí configuramos qué hacer cuando ocurren esos eventos.
 */

/**
 * EVENTO: connected
 *
 * Se dispara cuando Mongoose se conecta exitosamente a MongoDB.
 *
 * POR QUÉ ES ÚTIL:
 * Nos confirma que todo está funcionando correctamente.
 */
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose conectado a MongoDB');
});

/**
 * EVENTO: error
 *
 * Se dispara cuando hay un error en la conexión.
 *
 * POR QUÉ ES IMPORTANTE:
 * Si la conexión se pierde mientras la aplicación está corriendo,
 * necesitamos saberlo para poder manejarlo.
 *
 * EJEMPLOS DE CUÁNDO OCURRE:
 * - MongoDB se detuvo o reinició
 * - Se perdió la conexión a internet (si usas MongoDB Atlas)
 * - Problemas de red
 */
mongoose.connection.on('error', (errorDeConexion) => {
  console.error('❌ Error en la conexión con MongoDB:', errorDeConexion);
  console.error('⚠️  La aplicación puede no funcionar correctamente sin conexión a la BD');
});

/**
 * EVENTO: disconnected
 *
 * Se dispara cuando Mongoose se desconecta de MongoDB.
 *
 * CUÁNDO OCURRE:
 * - Al cerrar la aplicación normalmente
 * - Si se pierde la conexión inesperadamente
 * - Al reiniciar el servidor de MongoDB
 */
mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose desconectado de MongoDB');
});

/**
 * ============================================================================
 * CIERRE LIMPIO DE LA CONEXIÓN
 * ============================================================================
 *
 * Cuando la aplicación se cierra (por ejemplo, presionando Ctrl+C),
 * es importante cerrar la conexión a MongoDB correctamente.
 *
 * POR QUÉ ES IMPORTANTE:
 * - Evita dejar conexiones abiertas que consumen recursos
 * - Previene errores en la base de datos
 * - Es una buena práctica de programación
 */

/**
 * EVENTO: SIGINT
 *
 * SIGINT es la señal que se envía cuando presionas Ctrl+C para detener la aplicación.
 *
 * QUÉ HACE ESTE CÓDIGO:
 * 1. Detecta cuando quieres cerrar la aplicación
 * 2. Cierra la conexión a MongoDB correctamente
 * 3. Muestra un mensaje de despedida
 * 4. Termina el proceso con código de éxito (0)
 */
process.on('SIGINT', async () => {
  // Paso 1: Cerrar la conexión a MongoDB
  await mongoose.connection.close();

  // Paso 2: Mostrar mensaje de despedida
  console.log('👋 Conexión a MongoDB cerrada correctamente');
  console.log('🛑 Aplicación detenida por el usuario');

  // Paso 3: Salir del proceso con código de éxito (0)
  // 0 significa que todo salió bien (no es un error)
  process.exit(0);
});

/**
 * ============================================================================
 * EXPORTAR LA FUNCIÓN
 * ============================================================================
 *
 * Exportamos la función para que pueda ser usada en otros archivos.
 *
 * EJEMPLO DE USO EN index.js:
 * import conectarBaseDeDatos from './config/conexion.js';
 * await conectarBaseDeDatos();
 */
export default conectarBaseDeDatos;
