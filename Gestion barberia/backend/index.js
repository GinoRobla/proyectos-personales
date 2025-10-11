/**
 * ============================================================================
 * SERVIDOR PRINCIPAL DE LA API - GESTIÓN DE BARBERÍA
 * ============================================================================
 *
 * Este es el archivo principal que inicia el servidor backend de la aplicación.
 *
 * QUÉ ES ESTE ARCHIVO:
 * Es el punto de entrada del backend. Cuando ejecutas "npm start", este es
 * el primer archivo que se ejecuta. Aquí se configura todo y se inicia el servidor.
 *
 * RESPONSABILIDADES:
 * - Configurar Express (el framework web)
 * - Conectar a la base de datos MongoDB
 * - Configurar middlewares (herramientas que procesan las peticiones)
 * - Definir las rutas de la API (endpoints)
 * - Iniciar tareas automáticas (cron jobs)
 * - Manejar errores globalmente
 * - Iniciar el servidor HTTP
 */

import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import conectarBaseDeDatos from './config/conexion.js';
import { iniciarCronJobs } from './services/cronService.js';
import { verificarConfiguracion as verificarEmail } from './services/emailService.js';
import passportConfig from './config/passport.js';

/**
 * IMPORTAR RUTAS
 *
 * Las rutas definen los endpoints (URLs) de la API.
 * Cada archivo de rutas maneja un área específica del sistema.
 */
import authRoutes from './routes/authRoutes.js'; // Rutas de autenticación (login, registro)
import barberoRoutes from './routes/barberoRoutes.js'; // Rutas para gestionar barberos
import servicioRoutes from './routes/servicioRoutes.js'; // Rutas para gestionar servicios
import turnoRoutes from './routes/turnoRoutes.js'; // Rutas para gestionar turnos/reservas
import estadisticasRoutes from './routes/estadisticasRoutes.js'; // Rutas para estadísticas
import perfilRoutes from './routes/perfilRoutes.js'; // Rutas para perfil de usuario

/**
 * ============================================================================
 * CONFIGURACIÓN INICIAL
 * ============================================================================
 */

/**
 * Cargar variables de entorno desde el archivo .env
 *
 * POR QUÉ USAMOS VARIABLES DE ENTORNO:
 * - Mantener secretos fuera del código (contraseñas, claves API, etc.)
 * - Configurar la aplicación sin cambiar el código
 * - Tener diferentes configuraciones para desarrollo y producción
 */
dotenv.config();

/**
 * Crear la aplicación Express
 *
 * QUÉ ES EXPRESS:
 * Es un framework (conjunto de herramientas) para crear servidores web
 * y APIs de forma simple y estructurada.
 */
const aplicacion = express();

/**
 * Puerto en el que correrá el servidor
 *
 * CÓMO FUNCIONA:
 * - Primero intenta usar el puerto definido en .env (process.env.PORT)
 * - Si no existe, usa el puerto 3000 por defecto
 *
 * EJEMPLO:
 * Si PORT=5000 en .env → el servidor corre en puerto 5000
 * Si no hay PORT en .env → el servidor corre en puerto 3000
 */
const PUERTO_DEL_SERVIDOR = process.env.PORT || 3000;

/**
 * ============================================================================
 * MIDDLEWARES (HERRAMIENTAS QUE PROCESAN LAS PETICIONES)
 * ============================================================================
 *
 * Los middlewares son funciones que se ejecutan ANTES de que una petición
 * llegue a su ruta final. Procesan, validan o modifican la petición.
 *
 * ORDEN IMPORTANTE:
 * Los middlewares se ejecutan en el orden en que se definen aquí.
 */

/**
 * CORS (Cross-Origin Resource Sharing)
 *
 * QUÉ HACE:
 * Permite que el frontend (que corre en otro puerto o dominio) pueda
 * hacer peticiones a este backend.
 *
 * POR QUÉ ES NECESARIO:
 * Por seguridad, los navegadores bloquean peticiones entre diferentes orígenes.
 * CORS le dice al navegador que está bien hacer estas peticiones.
 *
 * EJEMPLO:
 * Frontend en http://localhost:5173 puede hacer peticiones a http://localhost:3000
 */
aplicacion.use(cors());

/**
 * PARSER DE JSON
 *
 * QUÉ HACE:
 * Convierte el cuerpo (body) de las peticiones HTTP de JSON a objetos JavaScript.
 *
 * POR QUÉ ES NECESARIO:
 * Cuando el frontend envía datos (ej: en un POST), vienen como texto JSON.
 * Este middleware los convierte a objetos que podemos usar fácilmente.
 *
 * EJEMPLO:
 * JSON: '{"nombre": "Juan"}'  →  Objeto: { nombre: "Juan" }
 */
aplicacion.use(express.json());

/**
 * PARSER DE URL ENCODED
 *
 * QUÉ HACE:
 * Procesa datos enviados desde formularios HTML tradicionales.
 *
 * POR QUÉ extended: true:
 * Permite parsear objetos anidados y arrays en los datos del formulario.
 */
aplicacion.use(express.urlencoded({ extended: true }));

/**
 * CONFIGURACIÓN DE SESIONES
 *
 * QUÉ SON LAS SESIONES:
 * Un mecanismo para recordar información sobre un usuario entre diferentes
 * peticiones HTTP (como su estado de login).
 *
 * POR QUÉ LAS NECESITAMOS:
 * Passport (autenticación con Google) requiere sesiones para funcionar.
 *
 * CONFIGURACIÓN:
 * - secret: Clave secreta para encriptar los datos de sesión
 * - resave: false → No guardar la sesión si no cambió
 * - saveUninitialized: false → No guardar sesiones vacías
 * - cookie.secure: true en producción → Solo cookies por HTTPS (más seguro)
 */
aplicacion.use(
  session({
    secret: process.env.SESSION_SECRET || 'mi-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS solo en producción
    },
  })
);

/**
 * INICIALIZAR PASSPORT (AUTENTICACIÓN)
 *
 * QUÉ HACE:
 * Configura Passport.js para manejar la autenticación de usuarios.
 * Debe ir DESPUÉS de la configuración de sesiones.
 */
aplicacion.use(passportConfig.initialize());
aplicacion.use(passportConfig.session());

/**
 * ============================================================================
 * RUTAS DE LA API (ENDPOINTS)
 * ============================================================================
 *
 * Aquí definimos qué URLs responde nuestro servidor y qué hacen.
 * Cada ruta está en un archivo separado para mantener el código organizado.
 */

/**
 * RUTAS DE AUTENTICACIÓN (/api/auth/...)
 * Manejan login, registro, cambio de contraseña, etc.
 */
aplicacion.use('/api/auth', authRoutes);

/**
 * RUTAS DE BARBEROS (/api/barberos/...)
 * Crear, listar, actualizar y eliminar barberos
 */
aplicacion.use('/api/barberos', barberoRoutes);

/**
 * RUTAS DE SERVICIOS (/api/servicios/...)
 * Gestionar los servicios que ofrece la barbería
 */
aplicacion.use('/api/servicios', servicioRoutes);

/**
 * RUTAS DE TURNOS (/api/turnos/...)
 * Crear y gestionar reservas/citas
 */
aplicacion.use('/api/turnos', turnoRoutes);

/**
 * RUTAS DE ESTADÍSTICAS (/api/estadisticas/...)
 * Obtener datos y métricas del negocio
 */
aplicacion.use('/api/estadisticas', estadisticasRoutes);

/**
 * RUTAS DE PERFIL (/api/perfil/...)
 * Gestionar el perfil del usuario autenticado
 */
aplicacion.use('/api/perfil', perfilRoutes);

/**
 * ============================================================================
 * RUTAS ESPECIALES
 * ============================================================================
 */

/**
 * RUTA RAÍZ (/)
 *
 * Muestra información básica sobre la API.
 * Útil para verificar que el servidor está funcionando.
 */
aplicacion.get('/', (peticion, respuesta) => {
  respuesta.json({
    mensaje: 'API de Gestión de Barbería',
    version: '2.0.0',
    endpoints: {
      autenticacion: '/api/auth',
      barberos: '/api/barberos',
      servicios: '/api/servicios',
      turnos: '/api/turnos',
      estadisticas: '/api/estadisticas',
      perfil: '/api/perfil',
      salud: '/api/health',
    },
    documentacion: 'Visita cada endpoint para ver la documentación específica',
  });
});

/**
 * RUTA DE SALUD (/api/health)
 *
 * Endpoint para verificar que el servidor está funcionando correctamente.
 * Útil para monitoreo y debugging.
 *
 * RETORNA:
 * - status: Estado del servidor (OK si funciona)
 * - timestamp: Hora actual del servidor
 * - uptime: Cuánto tiempo lleva el servidor corriendo (en segundos)
 */
aplicacion.get('/api/health', (peticion, respuesta) => {
  respuesta.json({
    estado: 'OK',
    mensaje: 'El servidor está funcionando correctamente',
    timestamp: new Date().toISOString(),
    tiempoActivo: `${Math.floor(process.uptime())} segundos`,
  });
});

/**
 * ============================================================================
 * MANEJO DE ERRORES
 * ============================================================================
 */

/**
 * MANEJO DE RUTAS NO ENCONTRADAS (404)
 *
 * Si alguien intenta acceder a una ruta que no existe, esta función se ejecuta.
 *
 * IMPORTANTE:
 * Debe ir DESPUÉS de todas las rutas, porque solo se ejecuta si ninguna
 * ruta anterior coincidió con la petición.
 */
aplicacion.use((peticion, respuesta) => {
  respuesta.status(404).json({
    exito: false,
    mensaje: `Ruta no encontrada: ${peticion.method} ${peticion.path}`,
    sugerencia: 'Verifica la URL y el método HTTP (GET, POST, PUT, DELETE)',
  });
});

/**
 * MANEJO DE ERRORES GLOBAL
 *
 * Captura todos los errores que ocurren en la aplicación.
 *
 * CÓMO FUNCIONA:
 * Si cualquier ruta o middleware lanza un error, esta función lo captura
 * y devuelve una respuesta apropiada al cliente.
 *
 * PARÁMETROS:
 * @param {Error} error - El error que ocurrió
 * @param {Request} peticion - La petición HTTP que causó el error
 * @param {Response} respuesta - Objeto para enviar la respuesta
 * @param {Function} siguiente - Función para pasar al siguiente middleware (no se usa aquí)
 *
 * IMPORTANTE:
 * En desarrollo, enviamos detalles del error para debugging.
 * En producción, enviamos menos información para no exponer detalles internos.
 */
aplicacion.use((error, peticion, respuesta, siguiente) => {
  // Mostrar el error en la consola del servidor para debugging
  console.error('❌ Error capturado por el manejador global:');
  console.error(error);

  // Determinar el código de estado HTTP (500 = Error del servidor por defecto)
  const codigoDeEstado = error.status || 500;

  // Preparar la respuesta
  const respuestaDeError = {
    exito: false,
    mensaje: error.message || 'Error interno del servidor',
  };

  // En desarrollo, agregar información detallada del error
  if (process.env.NODE_ENV === 'development') {
    respuestaDeError.stack = error.stack; // Incluir el stack trace
    respuestaDeError.detalles = error;
  }

  // Enviar la respuesta de error
  respuesta.status(codigoDeEstado).json(respuestaDeError);
});

/**
 * ============================================================================
 * FUNCIÓN PARA INICIAR EL SERVIDOR
 * ============================================================================
 *
 * Esta función se encarga de iniciar todos los componentes del sistema
 * en el orden correcto.
 */

/**
 * INICIAR SERVIDOR
 *
 * Secuencia de inicio:
 * 1. Conectar a MongoDB
 * 2. Verificar configuración de email
 * 3. Iniciar tareas automáticas (cron jobs para recordatorios)
 * 4. Iniciar el servidor HTTP
 *
 * IMPORTANTE:
 * Si cualquier paso falla, el servidor no inicia y muestra el error.
 */
const iniciarServidor = async () => {
  try {
    // ===== PASO 1: CONECTAR A LA BASE DE DATOS =====
    console.log('🔄 Conectando a la base de datos...');
    await conectarBaseDeDatos();

    // ===== PASO 2: VERIFICAR CONFIGURACIÓN DE EMAIL =====
    console.log('🔄 Verificando configuración de email...');
    await verificarEmail();

    // ===== PASO 3: INICIAR TAREAS AUTOMÁTICAS (CRON JOBS) =====
    console.log('🔄 Iniciando tareas automáticas (recordatorios)...');
    iniciarCronJobs();

    // ===== PASO 4: INICIAR SERVIDOR HTTP =====
    console.log('🔄 Iniciando servidor HTTP...');

    aplicacion.listen(PUERTO_DEL_SERVIDOR, () => {
      // Mostrar mensaje de éxito con información útil
      console.log('');
      console.log('='.repeat(60));
      console.log(' SERVIDOR INICIADO EXITOSAMENTE ');
      console.log('='.repeat(60));
      console.log('');
      console.log(`🚀 Servidor corriendo en: http://localhost:${PUERTO_DEL_SERVIDOR}`);
      console.log(`📊 API disponible en:     http://localhost:${PUERTO_DEL_SERVIDOR}/api`);
      console.log(`🏥 Health check en:       http://localhost:${PUERTO_DEL_SERVIDOR}/api/health`);
      console.log('');
      console.log('💡 Presiona Ctrl+C para detener el servidor');
      console.log('='.repeat(60));
      console.log('');
    });
  } catch (error) {
    // Si hay algún error durante el inicio, mostrarlo y salir
    console.error('');
    console.error('='.repeat(60));
    console.error(' ERROR AL INICIAR EL SERVIDOR ');
    console.error('='.repeat(60));
    console.error('');
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('📝 Detalles completos:');
    console.error(error);
    console.error('');
    console.error('💡 Revisa la configuración y vuelve a intentar');
    console.error('='.repeat(60));
    console.error('');

    // Salir del proceso con código de error
    process.exit(1);
  }
};

/**
 * ============================================================================
 * EJECUTAR EL SERVIDOR
 * ============================================================================
 *
 * Llamamos a la función para iniciar todo el sistema.
 */
iniciarServidor();

/**
 * ============================================================================
 * EXPORTAR LA APLICACIÓN
 * ============================================================================
 *
 * Exportamos la aplicación para que pueda ser usada en tests o en otros archivos.
 *
 * EJEMPLO DE USO EN TESTS:
 * import app from './index.js';
 * // Hacer pruebas con supertest, etc.
 */
export default aplicacion;
