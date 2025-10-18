/**
 * ============================================================================
 * CONFIGURACIÓN DE PASSPORT (AUTENTICACIÓN CON GOOGLE)
 * ============================================================================
 *
 * Este archivo configura Passport.js para permitir que los usuarios inicien
 * sesión usando su cuenta de Google (Google OAuth 2.0).
 *
 * QUÉ ES PASSPORT:
 * Passport es una librería que facilita la autenticación de usuarios.
 * Soporta muchos métodos: usuario/contraseña, Google, Facebook, GitHub, etc.
 *
 * QUÉ ES OAUTH:
 * OAuth es un protocolo que permite que un usuario inicie sesión en tu aplicación
 * usando su cuenta de otra plataforma (como Google) sin compartir su contraseña.
 *
 * CÓMO FUNCIONA EL LOGIN CON GOOGLE:
 * 1. Usuario hace clic en "Iniciar sesión con Google"
 * 2. Se redirige a Google para que autorice el acceso
 * 3. Google devuelve la información del usuario (email, nombre, foto)
 * 4. Este archivo procesa esa información:
 *    - Si el usuario ya existe → lo autentica
 *    - Si es nuevo → crea una cuenta automáticamente
 * 5. El usuario queda autenticado en el sistema
 *
 * RESPONSABILIDADES DE ESTE ARCHIVO:
 * - Configurar la estrategia de autenticación de Google
 * - Manejar el proceso cuando un usuario se autentica con Google
 * - Crear nuevos usuarios si es su primer login con Google
 * - Gestionar sesiones de usuario
 */

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import Usuario from '../models/Usuario.js';
import dotenv from 'dotenv';

// Cargar las variables de entorno (credenciales de Google)
dotenv.config();

/**
 * ============================================================================
 * CONFIGURAR ESTRATEGIA DE GOOGLE OAUTH
 * ============================================================================
 *
 * Aquí le decimos a Passport cómo manejar la autenticación con Google.
 */

passport.use(
  new GoogleStrategy(
    {
      /**
       * CREDENCIALES DE GOOGLE OAUTH
       *
       * Estos valores se obtienen cuando creas una aplicación en Google Cloud Console:
       * https://console.cloud.google.com/
       *
       * IMPORTANTE:
       * Estas credenciales NUNCA deben estar en el código. Siempre van en
       * el archivo .env para mantenerlas seguras.
       */

      // ID de cliente de Google (identifica tu aplicación)
      clientID: process.env.GOOGLE_CLIENT_ID,

      // Secreto de cliente de Google (como una contraseña para tu app)
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,

      // URL a donde Google redirige después de autenticar al usuario
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },

    /**
     * FUNCIÓN DE VERIFICACIÓN
     *
     * Esta función se ejecuta cuando Google devuelve la información del usuario.
     *
     * PARÁMETROS:
     * @param {string} _tokenDeAcceso - Token para acceder a APIs de Google (no lo usamos aquí)
     * @param {string} _tokenDeRefresco - Token para renovar el acceso (no lo usamos aquí)
     * @param {object} perfilDeGoogle - Información del usuario de Google (nombre, email, foto, etc.)
     * @param {function} funcionDeCompletado - Callback que debemos llamar cuando terminemos
     *
     * QUÉ HACE:
     * 1. Busca si ya existe un usuario con ese email de Google
     * 2. Si existe → lo devuelve para iniciar sesión
     * 3. Si no existe → crea un nuevo usuario y lo devuelve
     */
    async (_tokenDeAcceso, _tokenDeRefresco, perfilDeGoogle, funcionDeCompletado) => {
      try {
        // Paso 1: Extraer el email del perfil de Google
        // Google puede tener múltiples emails, tomamos el primero
        const emailDelUsuario = perfilDeGoogle.emails[0].value;

        // Paso 2: Buscar si ya existe un usuario con ese email en nuestra base de datos
        let usuarioExistente = await Usuario.findOne({ email: emailDelUsuario });

        // Paso 3: Si el usuario ya existe, lo devolvemos para hacer login
        if (usuarioExistente) {
          console.log(`✅ Usuario existente inició sesión con Google: ${emailDelUsuario}`);
          return funcionDeCompletado(null, usuarioExistente);
        }

        // Paso 4: Si el usuario NO existe, crear uno nuevo
        console.log(`🆕 Nuevo usuario registrándose con Google: ${emailDelUsuario}`);

        const nuevoUsuario = new Usuario({
          // Nombre (Google lo divide en nombre y apellido)
          nombre: perfilDeGoogle.name.givenName, // Nombre de pila (ej: "Juan")

          // Apellido (si no tiene, dejarlo vacío)
          apellido: perfilDeGoogle.name.familyName || '',

          // Email de Google
          email: emailDelUsuario,

          /**
           * CONTRASEÑA TEMPORAL ALEATORIA
           *
           * POR QUÉ:
           * - El usuario no necesita contraseña porque usa Google para login
           * - Pero nuestro modelo requiere una contraseña
           * - Generamos una aleatoria que el usuario nunca verá ni usará
           *
           * CÓMO SE GENERA:
           * - Math.random() genera un número aleatorio
           * - .toString(36) lo convierte a string en base 36 (letras y números)
           * - .slice(-8) toma los últimos 8 caracteres
           *
           * RESULTADO: Una contraseña como "x7k2m9pq" que nunca se usará
           */
          password: Math.random().toString(36).slice(-8),

          /**
           * TELÉFONO TEMPORAL
           *
           * POR QUÉ:
           * - Nuestro modelo requiere teléfono
           * - Google no nos da el teléfono del usuario
           * - Ponemos uno temporal que el usuario puede actualizar después
           */
          telefono: '0000000000',

          // Por defecto, todos los nuevos usuarios son clientes
          rol: 'cliente',

          // Foto de perfil de Google (si existe)
          // El operador ?. verifica si existe antes de acceder
          foto: perfilDeGoogle.photos[0]?.value || 'https://via.placeholder.com/150',

          // El usuario está activo desde el momento que se registra
          activo: true,
        });

        // Paso 5: Guardar el nuevo usuario en la base de datos
        await nuevoUsuario.save();

        console.log(`✅ Nuevo usuario creado exitosamente: ${emailDelUsuario}`);

        // Paso 6: Devolver el nuevo usuario para iniciar sesión
        return funcionDeCompletado(null, nuevoUsuario);
      } catch (error) {
        // Si hay algún error, lo mostramos y lo pasamos a Passport
        console.error('❌ Error en autenticación con Google:', error);
        return funcionDeCompletado(error, null);
      }
    }
  )
);

/**
 * ============================================================================
 * SERIALIZACIÓN DE USUARIOS (GESTIÓN DE SESIONES)
 * ============================================================================
 *
 * NOTA IMPORTANTE:
 * Estas funciones son requeridas por Passport, pero NO las usamos porque
 * estamos usando JWT en lugar de sesiones. Las dejamos vacías para evitar
 * conflictos.
 *
 * POR QUÉ NO USAMOS SESIONES:
 * - Las sesiones expiran y causan errores intermitentes
 * - JWT es más escalable y no requiere memoria en el servidor
 * - JWT funciona mejor para aplicaciones SPA (Single Page Application)
 * - No hay problemas de sincronización entre múltiples servidores
 */

/**
 * SERIALIZAR USUARIO
 *
 * Passport requiere esta función, pero como usamos JWT en lugar de sesiones,
 * simplemente devolvemos el usuario completo sin guardarlo en ninguna sesión.
 *
 * @param {object} usuario - El usuario completo que acaba de iniciar sesión
 * @param {function} funcionDeCompletado - Callback que recibe el dato a guardar
 */
passport.serializeUser((usuario, funcionDeCompletado) => {
  // No guardar nada en la sesión, solo pasar el usuario completo
  funcionDeCompletado(null, usuario);
});

/**
 * DESERIALIZAR USUARIO
 *
 * Passport requiere esta función, pero como usamos JWT en lugar de sesiones,
 * simplemente devolvemos lo que recibimos sin hacer consultas a la BD.
 *
 * @param {object} usuario - El usuario que Passport intenta recuperar
 * @param {function} funcionDeCompletado - Callback que recibe el usuario
 */
passport.deserializeUser((usuario, funcionDeCompletado) => {
  // No buscar en la BD, solo devolver lo que recibimos
  funcionDeCompletado(null, usuario);
});

/**
 * ============================================================================
 * EXPORTAR CONFIGURACIÓN
 * ============================================================================
 *
 * Exportamos el objeto passport configurado para usarlo en el servidor principal.
 *
 * EJEMPLO DE USO EN index.js:
 * import passportConfig from './config/passport.js';
 * app.use(passportConfig.initialize());
 * app.use(passportConfig.session());
 */
export default passport;
