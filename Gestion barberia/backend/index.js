// --- Importaciones de Módulos ---
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// --- Importaciones Locales ---
import conectarBaseDeDatos from './config/conexion.js';
import { iniciarCronJobs } from './services/cronService.js';
import { verificarConfiguracion as verificarWhatsApp } from './services/whatsappService.js';

// --- Importaciones de Rutas (Endpoints) ---
import authRoutes from './routes/authRoutes.js';
import barberoRoutes from './routes/barberoRoutes.js';
import servicioRoutes from './routes/servicioRoutes.js';
import turnoRoutes from './routes/turnoRoutes.js';
import estadisticasRoutes from './routes/estadisticasRoutes.js';

// ============================================================================
// CONFIGURACIÓN INICIAL
// ============================================================================

// Carga las variables de entorno del archivo .env (ej: claves de API, URL de DB)
dotenv.config();

// Inicializa la aplicación de Express
const app = express();

// Define el puerto. Usa el del .env o 3000 por defecto
const PORT = process.env.PORT || 3000;

// ============================================================================
// MIDDLEWARES (Se ejecutan en orden antes de las rutas)
// ============================================================================

// 1. Configura CORS: Permite que el frontend (en otra URL) se conecte a esta API
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  })
);

// 2. JSON Parser: Permite a Express entender el body de las peticiones JSON
app.use(express.json());

// 3. URL Encoded: Permite a Express entender datos de formularios HTML
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// RUTAS DE LA API (ENDPOINTS)
// ============================================================================

// Asigna las rutas a sus controladores
app.use('/api/auth', authRoutes); // /api/auth/login, /api/auth/registro, /api/auth/perfil
app.use('/api/barberos', barberoRoutes); // /api/barberos/
app.use('/api/servicios', servicioRoutes); // /api/servicios/
app.use('/api/turnos', turnoRoutes); // /api/turnos/, /api/turnos/disponibles
app.use('/api/estadisticas', estadisticasRoutes); // /api/estadisticas/general

// ============================================================================
// RUTAS ESPECIALES (Verificación)
// ============================================================================

// Ruta Raíz (/): Muestra información básica de la API
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API de Gestión de Barbería v2.0.0',
    estado: 'Funcionando',
    rutas: [
      '/api/auth',
      '/api/barberos',
      '/api/servicios',
      '/api/turnos',
      '/api/estadisticas',
    ],
    healthCheck: '/api/health',
  });
});

// Ruta de Salud (/api/health): Verifica que el servidor esté vivo
app.get('/api/health', (req, res) => {
  res.json({
    estado: 'OK',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())} segundos`,
  });
});

// ============================================================================
// MANEJO DE ERRORES (Debe ir al final)
// ============================================================================

// 4. Manejador de Rutas No Encontradas (404)
// Se ejecuta si ninguna ruta anterior coincidió
app.use((req, res) => {
  res.status(404).json({
    exito: false,
    mensaje: `Ruta no encontrada: ${req.method} ${req.path}`,
  });
});

// 5. Manejador de Errores Global (500)
// Captura cualquier error (ej: 'throw new Error(...)') de las rutas
app.use((error, req, res, next) => {
  // Muestra el error en la consola del servidor
  console.error('❌ Error Global Capturado:', error.message);

  // Prepara la respuesta de error
  const respuestaDeError = {
    exito: false,
    mensaje: error.message || 'Error interno del servidor',
  };

  // Si estamos en 'development' (desarrollo), muestra más detalles
  if (process.env.NODE_ENV === 'development') {
    respuestaDeError.stack = error.stack;
  }

  // Envía la respuesta de error 500
  res.status(500).json(respuestaDeError);
});

// ============================================================================
// ARRANQUE DEL SERVIDOR
// ============================================================================

// Función principal que inicia todo en orden
const iniciarServidor = async () => {
  try {
    // 1. Conectar a la Base de Datos
    console.log('🔄 Conectando a MongoDB...');
    await conectarBaseDeDatos();

    // 2. Verificar servicio de WhatsApp
    console.log('🔄 Verificando configuración de WhatsApp (Twilio)...');
    await verificarWhatsApp();

    // 3. Iniciar tareas programadas (ej: recordatorios)
    console.log('🔄 Iniciando tareas automáticas (Cron Jobs)...');
    iniciarCronJobs();

    // 4. Iniciar el servidor HTTP
    console.log('🔄 Iniciando servidor Express...');
    app.listen(PORT, () => {
      // Mensaje de éxito
      console.log('\n' + '='.repeat(60));
      console.log('       🚀  SERVIDOR INICIADO EXITOSAMENTE  🚀');
      console.log('='.repeat(60));
      console.log(`\n✅ Servidor corriendo en: http://localhost:${PORT}`);
      console.log(`🏥 Health check:           http://localhost:${PORT}/api/health\n`);
      console.log('💡 Presiona Ctrl+C para detener el servidor');
      console.log('='.repeat(60) + '\n');
    });
  } catch (error) {
    // Si algo falla al inicio (ej: no se conecta a la DB), lo captura
    console.error('\n' + '='.repeat(60));
    console.error('     ❌  ERROR FATAL AL INICIAR EL SERVIDOR  ❌');
    console.error('='.repeat(60) + '\n');
    console.error('Error:', error.message);
    console.error('\nDetalles:', error);
    console.error('\n💡 Revisa la configuración (DB, .env) y vuelve a intentar.');
    console.error('='.repeat(60) + '\n');
    
    // Termina el proceso si no se pudo arrancar
    process.exit(1);
  }
};

// Ejecuta la función de arranque
iniciarServidor();

// Exporta 'app' para que pueda ser usada en tests
export default app;  