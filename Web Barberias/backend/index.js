// ============================================================================
// CONFIGURACIÓN DE VARIABLES DE ENTORNO (DEBE SER LO PRIMERO)
// ============================================================================
import dotenv from 'dotenv';
dotenv.config();

// Validar variables de entorno requeridas
import { validateEnv } from './config/validateEnv.js';
validateEnv();

// --- Importaciones de Módulos ---
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import { limiterGlobal } from './config/rateLimiter.js';
// Passport se carga dinámicamente después para que dotenv esté configurado
let passport;

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
import disponibilidadRoutes from './routes/disponibilidadRoutes.js';
import configuracionRoutes from './routes/configuracionRoutes.js';
import pagoRoutes from './routes/pagoRoutes.js';
import verificacionRoutes from './routes/verificacionRoutes.js';

// ============================================================================
// CONFIGURACIÓN INICIAL
// ============================================================================

// Inicializa la aplicación de Express
const app = express();

// Define el puerto. Usa el del .env o 3000 por defecto
const PORT = process.env.PORT || 3000;

// Configurar trust proxy para rate limiting detrás de Nginx/CloudFlare
// Solo en producción para evitar problemas en desarrollo
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Confiar en el primer proxy
}

// ============================================================================
// MIDDLEWARES (Se ejecutan en orden antes de las rutas)
// ============================================================================

// 1. Helmet: Configura headers de seguridad HTTP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Para permitir recursos externos
}));

// 2. Compresión GZIP para respuestas
app.use(compression({
  threshold: 0, // Comprimir desde 0 bytes (por defecto es 1024)
  level: 6 // Nivel de compresión (1-9, por defecto es 6)
}));

// 3. Sanitización contra NoSQL injection
app.use(mongoSanitize());

// 4. Rate Limiting Global: Máximo 100 requests por IP cada 15 minutos
app.use('/api', limiterGlobal);

// 5. Configura CORS: Permite que el frontend (en otra URL) se conecte a esta API
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origin (como Postman, curl, etc)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    },
    credentials: true
  })
);

// 6. JSON Parser: Permite a Express entender el body de las peticiones JSON
app.use(express.json({ limit: '10mb' })); // Límite de 10MB para evitar ataques de payload grande

// 7. URL Encoded: Permite a Express entender datos de formularios HTML
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 8. Inicializar Passport para OAuth (se configura dinámicamente en iniciarServidor)

// ============================================================================
// RUTAS DE LA API (ENDPOINTS)
// ============================================================================

// Asigna las rutas a sus controladores
app.use('/api/auth', authRoutes); // /api/auth/login, /api/auth/registro, /api/auth/perfil
app.use('/api/barberos', barberoRoutes); // /api/barberos/
app.use('/api/servicios', servicioRoutes); // /api/servicios/
app.use('/api/turnos', turnoRoutes); // /api/turnos/, /api/turnos/disponibles
app.use('/api/estadisticas', estadisticasRoutes); // /api/estadisticas/general
app.use('/api/disponibilidad', disponibilidadRoutes); // /api/disponibilidad/general, /api/disponibilidad/barbero, /api/disponibilidad/bloqueos
app.use('/api/configuracion', configuracionRoutes); // /api/configuracion
app.use('/api/pagos', pagoRoutes); // /api/pagos (sistema de señas)
app.use('/api/verificacion', verificacionRoutes); // /api/verificacion (verificación de teléfono)

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
      '/api/disponibilidad',
      '/api/configuracion',
      '/api/pagos',
      '/api/verificacion',
    ],
    healthCheck: '/api/health',
  });
});

// Ruta de Salud (/api/health): Verifica que el servidor esté vivo y servicios críticos
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    checks: {}
  };

  try {
    // Verificar MongoDB
    const mongoose = (await import('mongoose')).default;
    health.checks.database = {
      status: mongoose.connection.readyState === 1 ? 'OK' : 'ERROR',
      readyState: mongoose.connection.readyState,
      name: mongoose.connection.name
    };

    // Verificar memoria
    const memoryUsage = process.memoryUsage();
    const memoryPercent = memoryUsage.heapUsed / memoryUsage.heapTotal;
    health.checks.memory = {
      status: memoryPercent < 0.9 ? 'OK' : 'WARNING',
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      percentage: `${Math.round(memoryPercent * 100)}%`
    };

    // Status general
    const hasError = Object.values(health.checks).some(c => c.status === 'ERROR');
    health.status = hasError ? 'ERROR' : 'OK';

    res.status(hasError ? 503 : 200).json(health);
  } catch (error) {
    res.status(503).json({
      ...health,
      status: 'ERROR',
      error: error.message
    });
  }
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
    // 0. Cargar Passport dinámicamente (después de que dotenv esté configurado)
    console.log('🔄 Configurando Passport (Google OAuth)...');
    const passportModule = await import('./config/passport.js');
    passport = passportModule.default;
    app.use(passport.initialize());
    console.log('✅ Passport configurado correctamente');

    // 1. Conectar a la Base de Datos
    console.log('🔄 Conectando a MongoDB...');
    await conectarBaseDeDatos();

    // 2. Verificar servicio de WhatsApp
    console.log('🔄 Verificando configuración de WhatsApp (Twilio)...');
    await verificarWhatsApp();

    // 3. Iniciar tareas programadas consolidadas (cron jobs)
    console.log('🔄 Iniciando tareas automáticas (Cron Jobs consolidados)...');
    await iniciarCronJobs();

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
