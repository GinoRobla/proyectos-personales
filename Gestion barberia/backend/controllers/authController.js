/**
 * ============================================================================
 * CONTROLADOR: AUTENTICACIÓN
 * ============================================================================
 *
 * Este controlador maneja todas las peticiones HTTP relacionadas con la
 * autenticación y gestión de usuarios en el sistema.
 *
 * RESPONSABILIDADES:
 * - Procesar solicitudes de registro de nuevos usuarios
 * - Procesar solicitudes de inicio de sesión (login)
 * - Validar tokens JWT para verificar sesiones activas
 * - Obtener y actualizar información del perfil del usuario
 * - Gestionar cambios de contraseña
 * - Manejar el callback de autenticación con Google OAuth
 *
 * ESTRUCTURA DE RESPUESTAS:
 * Todas las respuestas siguen el formato estándar:
 * {
 *   success: boolean,        // Indica si la operación fue exitosa
 *   message: string,          // Mensaje descriptivo (opcional)
 *   data: object             // Datos de la respuesta (opcional)
 * }
 *
 * CÓDIGOS DE ESTADO HTTP UTILIZADOS:
 * - 200: Operación exitosa (GET, PUT)
 * - 201: Recurso creado exitosamente (POST)
 * - 400: Error de validación o datos incorrectos
 * - 401: Credenciales inválidas
 * - 403: Acceso prohibido (usuario desactivado)
 * - 404: Recurso no encontrado
 * - 500: Error interno del servidor
 *
 * FLUJO DE AUTENTICACIÓN:
 * 1. Usuario envía credenciales (email/password) o usa Google OAuth
 * 2. Se validan las credenciales en el servicio de autenticación
 * 3. Si son válidas, se genera un token JWT
 * 4. El token se envía al cliente y se guarda en localStorage
 * 5. El cliente incluye el token en cada petición posterior
 * 6. El middleware de autenticación valida el token en cada petición protegida
 */

// ============================================================================
// IMPORTACIONES
// ============================================================================

// Importar todas las funciones del servicio de autenticación
// Este servicio contiene la lógica de negocio
import * as servicioAutenticacion from '../services/authService.js';

// ============================================================================
// FUNCIONES DEL CONTROLADOR
// ============================================================================

/**
 * REGISTRO DE USUARIO
 *
 * Maneja la petición HTTP para registrar un nuevo usuario en el sistema.
 *
 * Endpoint: POST /api/auth/registro
 *
 * Body esperado:
 * {
 *   nombre: string,          // Nombre completo del usuario
 *   email: string,           // Email único del usuario
 *   password: string,        // Contraseña (se encriptará antes de guardar)
 *   telefono: string,        // Número de teléfono de contacto
 *   rol: string              // Rol del usuario: 'cliente', 'barbero', 'admin'
 * }
 *
 * Respuesta exitosa (201):
 * {
 *   success: true,
 *   message: "Usuario registrado exitosamente",
 *   data: {
 *     usuario: {...},        // Datos del usuario creado (sin password)
 *     token: "jwt_token"     // Token JWT para autenticación automática
 *   }
 * }
 *
 * PROCESO:
 * 1. Recibir datos del body de la petición
 * 2. Llamar al servicio para registrar el usuario
 * 3. Si es exitoso, responder con código 201 y datos del usuario
 * 4. Si falla, determinar el tipo de error y responder con código apropiado
 *
 * @param {Object} req - Objeto de petición de Express (contiene req.body)
 * @param {Object} res - Objeto de respuesta de Express
 */
export const registrarUsuario = async (req, res) => {
  try {
    // Paso 1: Obtener los datos del usuario desde el body de la petición
    // req.body contiene: { nombre, email, password, telefono, rol }
    const datosUsuario = req.body;

    // Paso 2: Llamar al servicio de autenticación para registrar el usuario
    // El servicio se encarga de:
    // - Validar que todos los campos estén presentes
    // - Verificar que el email no esté ya registrado
    // - Encriptar la contraseña con bcrypt
    // - Crear el usuario en la base de datos
    // - Generar un token JWT para autenticación automática
    const resultado = await servicioAutenticacion.registrar(datosUsuario);

    // Paso 3: Responder con éxito (código 201 = Created)
    // Incluir mensaje de éxito y datos del usuario con su token
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: resultado, // Contiene: { usuario, token }
    });
  } catch (error) {
    // Paso 4: Manejar errores
    // Registrar el error en la consola para debugging
    console.error('Error en registro:', error);

    // Paso 5: Determinar el código de estado HTTP según el tipo de error
    let codigoEstado = 500; // Por defecto, error interno del servidor

    // Si el email ya está registrado → 400 (Bad Request)
    if (error.message.includes('ya está registrado')) {
      codigoEstado = 400;
    }

    // Si faltan campos obligatorios → 400 (Bad Request)
    if (error.message.includes('Faltan campos')) {
      codigoEstado = 400;
    }

    // Paso 6: Responder con el error
    res.status(codigoEstado).json({
      success: false,
      message: error.message, // Mensaje descriptivo del error
    });
  }
};

/**
 * INICIO DE SESIÓN (LOGIN)
 *
 * Maneja la petición HTTP para iniciar sesión con email y contraseña.
 *
 * Endpoint: POST /api/auth/login
 *
 * Body esperado:
 * {
 *   email: string,           // Email del usuario
 *   password: string         // Contraseña del usuario
 * }
 *
 * Respuesta exitosa (200):
 * {
 *   success: true,
 *   message: "Login exitoso",
 *   data: {
 *     usuario: {...},        // Datos del usuario (sin password)
 *     token: "jwt_token"     // Token JWT para mantener la sesión
 *   }
 * }
 *
 * PROCESO:
 * 1. Extraer email y password del body
 * 2. Llamar al servicio para validar credenciales
 * 3. Si son correctas, responder con token JWT
 * 4. Si son incorrectas, responder con error 401 (Unauthorized)
 *
 * @param {Object} req - Objeto de petición de Express
 * @param {Object} res - Objeto de respuesta de Express
 */
export const iniciarSesion = async (req, res) => {
  try {
    // Paso 1: Extraer email y password del body de la petición
    // Usamos desestructuración para obtener solo estos campos
    const { email, password } = req.body;

    // Paso 2: Llamar al servicio de autenticación para validar credenciales
    // El servicio se encarga de:
    // - Verificar que email y password estén presentes
    // - Buscar el usuario por email en la base de datos
    // - Comparar la contraseña con bcrypt
    // - Verificar que el usuario no esté desactivado
    // - Generar un token JWT si todo es correcto
    const resultado = await servicioAutenticacion.login(email, password);

    // Paso 3: Responder con éxito (código 200 = OK)
    // Incluir mensaje de éxito y datos del usuario con su token
    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: resultado, // Contiene: { usuario, token }
    });
  } catch (error) {
    // Paso 4: Manejar errores
    // Registrar el error en la consola
    console.error('Error en login:', error);

    // Paso 5: Determinar el código de estado HTTP según el tipo de error
    let codigoEstado = 500; // Por defecto, error interno del servidor

    // Si las credenciales son incorrectas → 401 (Unauthorized)
    if (error.message.includes('Credenciales')) {
      codigoEstado = 401;
    }

    // Si el usuario está desactivado → 403 (Forbidden)
    if (error.message.includes('desactivado')) {
      codigoEstado = 403;
    }

    // Si faltan campos obligatorios → 400 (Bad Request)
    if (error.message.includes('obligatorios')) {
      codigoEstado = 400;
    }

    // Paso 6: Responder con el error
    res.status(codigoEstado).json({
      success: false,
      message: error.message, // Mensaje descriptivo del error
    });
  }
};

/**
 * OBTENER PERFIL DEL USUARIO AUTENTICADO
 *
 * Obtiene la información del perfil del usuario que está actualmente autenticado.
 *
 * Endpoint: GET /api/auth/perfil
 * Headers requeridos:
 * - Authorization: Bearer <token_jwt>
 *
 * Respuesta exitosa (200):
 * {
 *   success: true,
 *   data: {
 *     _id: string,
 *     nombre: string,
 *     email: string,
 *     telefono: string,
 *     rol: string,
 *     activo: boolean,
 *     ...
 *   }
 * }
 *
 * IMPORTANTE:
 * Esta ruta está protegida por el middleware de autenticación.
 * El middleware ya validó el token y añadió el usuario a req.usuario.
 *
 * PROCESO:
 * 1. Obtener el ID del usuario desde req.usuario (puesto por el middleware)
 * 2. Llamar al servicio para obtener los datos completos del usuario
 * 3. Responder con los datos del usuario (sin password)
 *
 * @param {Object} req - Objeto de petición (contiene req.usuario del middleware)
 * @param {Object} res - Objeto de respuesta de Express
 */
export const obtenerPerfilUsuario = async (req, res) => {
  try {
    // Paso 1: Obtener el ID del usuario desde req.usuario
    // req.usuario fue añadido por el middleware de autenticación (authMiddleware.js)
    // después de validar el token JWT
    const idUsuario = req.usuario._id;

    // Paso 2: Llamar al servicio para obtener los datos completos del usuario
    // El servicio busca el usuario en la base de datos y excluye el password
    const usuario = await servicioAutenticacion.obtenerUsuarioPorId(idUsuario);

    // Paso 3: Responder con éxito (código 200 = OK)
    // Enviar los datos del usuario al cliente
    res.status(200).json({
      success: true,
      data: usuario, // Datos del usuario sin el password
    });
  } catch (error) {
    // Paso 4: Manejar errores
    // Registrar el error en la consola
    console.error('Error al obtener perfil:', error);

    // Paso 5: Responder con error 500 (Internal Server Error)
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * ACTUALIZAR PERFIL DEL USUARIO AUTENTICADO
 *
 * Actualiza la información del perfil del usuario que está autenticado.
 *
 * Endpoint: PUT /api/auth/perfil
 * Headers requeridos:
 * - Authorization: Bearer <token_jwt>
 *
 * Body (campos opcionales a actualizar):
 * {
 *   nombre: string,          // Nuevo nombre
 *   telefono: string,        // Nuevo teléfono
 *   email: string            // Nuevo email (se valida que no esté en uso)
 * }
 *
 * Respuesta exitosa (200):
 * {
 *   success: true,
 *   message: "Perfil actualizado exitosamente",
 *   data: {
 *     ...datosActualizados    // Datos del usuario actualizados
 *   }
 * }
 *
 * PROCESO:
 * 1. Obtener el ID del usuario autenticado
 * 2. Obtener los campos a actualizar del body
 * 3. Llamar al servicio para actualizar el perfil
 * 4. Responder con los datos actualizados
 *
 * @param {Object} req - Objeto de petición (contiene req.usuario y req.body)
 * @param {Object} res - Objeto de respuesta de Express
 */
export const actualizarPerfilUsuario = async (req, res) => {
  try {
    // Paso 1: Obtener el ID del usuario desde req.usuario
    // Este ID viene del token JWT validado por el middleware
    const idUsuario = req.usuario._id;

    // Paso 2: Obtener los campos a actualizar desde el body
    // Solo se actualizarán los campos que vengan en el body
    const camposActualizar = req.body;

    // Paso 3: Llamar al servicio para actualizar el perfil
    // El servicio se encarga de:
    // - Validar que el usuario existe
    // - Si se actualiza el email, verificar que no esté en uso por otro usuario
    // - Actualizar solo los campos proporcionados
    // - Devolver el usuario actualizado
    const usuarioActualizado = await servicioAutenticacion.actualizarPerfil(
      idUsuario,
      camposActualizar
    );

    // Paso 4: Responder con éxito (código 200 = OK)
    res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: usuarioActualizado, // Datos del usuario actualizado
    });
  } catch (error) {
    // Paso 5: Manejar errores
    console.error('Error al actualizar perfil:', error);

    // Paso 6: Determinar el código de estado según el error
    // Si el usuario no existe → 404 (Not Found)
    // Si hay otro error → 500 (Internal Server Error)
    const codigoEstado = error.message.includes('no encontrado') ? 404 : 500;

    // Paso 7: Responder con el error
    res.status(codigoEstado).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * CAMBIAR CONTRASEÑA
 *
 * Permite al usuario autenticado cambiar su contraseña actual por una nueva.
 *
 * Endpoint: PUT /api/auth/cambiar-password
 * Headers requeridos:
 * - Authorization: Bearer <token_jwt>
 *
 * Body esperado:
 * {
 *   passwordActual: string,  // Contraseña actual del usuario
 *   passwordNuevo: string    // Nueva contraseña deseada
 * }
 *
 * Respuesta exitosa (200):
 * {
 *   success: true,
 *   message: "Contraseña cambiada exitosamente"
 * }
 *
 * PROCESO:
 * 1. Obtener el ID del usuario autenticado
 * 2. Extraer passwordActual y passwordNuevo del body
 * 3. Llamar al servicio para cambiar la contraseña
 * 4. Responder con mensaje de éxito
 *
 * SEGURIDAD:
 * - Se verifica que la contraseña actual sea correcta
 * - La nueva contraseña se encripta antes de guardarla
 *
 * @param {Object} req - Objeto de petición de Express
 * @param {Object} res - Objeto de respuesta de Express
 */
export const cambiarContrasena = async (req, res) => {
  try {
    // Paso 1: Obtener el ID del usuario desde req.usuario
    const idUsuario = req.usuario._id;

    // Paso 2: Extraer las contraseñas del body
    // passwordActual: contraseña actual que el usuario debe proporcionar
    // passwordNuevo: nueva contraseña que el usuario desea establecer
    const { passwordActual, passwordNuevo } = req.body;

    // Paso 3: Llamar al servicio para cambiar la contraseña
    // El servicio se encarga de:
    // - Verificar que ambas contraseñas estén presentes
    // - Buscar el usuario en la base de datos
    // - Comparar passwordActual con la contraseña guardada usando bcrypt
    // - Si coincide, encriptar passwordNuevo con bcrypt
    // - Guardar la nueva contraseña encriptada
    const resultado = await servicioAutenticacion.cambiarPassword(
      idUsuario,
      passwordActual,
      passwordNuevo
    );

    // Paso 4: Responder con éxito (código 200 = OK)
    res.status(200).json({
      success: true,
      message: resultado.message, // "Contraseña cambiada exitosamente"
    });
  } catch (error) {
    // Paso 5: Manejar errores
    console.error('Error al cambiar contraseña:', error);

    // Paso 6: Determinar el código de estado según el tipo de error
    let codigoEstado = 500; // Por defecto, error interno

    // Si la contraseña actual es incorrecta → 400 (Bad Request)
    if (error.message.includes('incorrecta')) {
      codigoEstado = 400;
    }

    // Si faltan campos obligatorios → 400 (Bad Request)
    if (error.message.includes('obligatorias')) {
      codigoEstado = 400;
    }

    // Paso 7: Responder con el error
    res.status(codigoEstado).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * VERIFICAR TOKEN JWT
 *
 * Verifica si el token JWT proporcionado es válido y devuelve los datos del usuario.
 *
 * Endpoint: GET /api/auth/verificar
 * Headers requeridos:
 * - Authorization: Bearer <token_jwt>
 *
 * Respuesta exitosa (200):
 * {
 *   success: true,
 *   message: "Token válido",
 *   data: {
 *     usuario: {
 *       _id: string,
 *       nombre: string,
 *       email: string,
 *       rol: string,
 *       ...
 *     }
 *   }
 * }
 *
 * USO PRINCIPAL:
 * Este endpoint se usa cuando:
 * - La aplicación frontend se recarga y necesita verificar si el token guardado
 *   en localStorage sigue siendo válido
 * - Se quiere obtener los datos actualizados del usuario sin hacer login de nuevo
 *
 * IMPORTANTE:
 * Si llegamos a ejecutar esta función, significa que el token YA FUE VALIDADO
 * por el middleware de autenticación. Por lo tanto, solo necesitamos responder
 * con éxito y devolver los datos del usuario.
 *
 * @param {Object} req - Objeto de petición (contiene req.usuario del middleware)
 * @param {Object} res - Objeto de respuesta de Express
 */
export const verificarTokenJWT = async (req, res) => {
  try {
    // Paso 1: Si llegamos aquí, el token es válido
    // El middleware de autenticación ya validó:
    // - Que el token existe en los headers
    // - Que el token tiene el formato correcto
    // - Que el token fue firmado con nuestro JWT_SECRET
    // - Que el token no ha expirado
    // - Que el usuario existe en la base de datos

    // Paso 2: El usuario ya está disponible en req.usuario (puesto por el middleware)
    // Solo necesitamos responder con éxito y devolver los datos

    res.status(200).json({
      success: true,
      message: 'Token válido',
      data: {
        usuario: req.usuario, // Datos completos del usuario (sin password)
      },
    });
  } catch (error) {
    // Paso 3: Manejar errores inesperados
    // En teoría, si el middleware funcionó correctamente, no deberíamos llegar aquí
    console.error('Error al verificar token:', error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * CALLBACK DE AUTENTICACIÓN CON GOOGLE OAUTH
 *
 * Maneja el callback después de que el usuario se autentica con Google.
 * Este endpoint es llamado automáticamente por Google después de que el usuario
 * acepta los permisos.
 *
 * Endpoint: GET /api/auth/google/callback
 *
 * FLUJO COMPLETO DE GOOGLE OAUTH:
 *
 * 1. Usuario hace clic en "Iniciar sesión con Google" en el frontend
 * 2. Frontend redirige a: /api/auth/google
 * 3. Passport redirige al usuario a la página de login de Google
 * 4. Usuario ingresa sus credenciales de Google y acepta permisos
 * 5. Google redirige de vuelta a: /api/auth/google/callback (ESTE ENDPOINT)
 * 6. Passport recibe los datos del usuario desde Google
 * 7. Se busca o crea el usuario en nuestra base de datos
 * 8. Se genera un token JWT
 * 9. Se redirige al frontend con el token en la URL
 * 10. Frontend extrae el token de la URL y lo guarda en localStorage
 *
 * PROCESO DE ESTA FUNCIÓN:
 * 1. Obtener los datos del usuario desde req.user (puesto por Passport)
 * 2. Generar un token JWT para el usuario
 * 3. Redirigir al frontend con el token en la URL
 * 4. Si hay error, redirigir al frontend con mensaje de error
 *
 * @param {Object} req - Objeto de petición (contiene req.user de Passport)
 * @param {Object} res - Objeto de respuesta de Express
 */
export const callbackAutenticacionGoogle = async (req, res) => {
  try {
    // Paso 1: Obtener los datos del usuario desde req.user
    // Passport ya validó la autenticación con Google y creó/encontró
    // el usuario en la base de datos. Los datos están en req.user
    const usuario = req.user;

    // Paso 2: Generar un token JWT para el usuario
    // Importamos jsonwebtoken de forma dinámica
    const jwt = await import('jsonwebtoken');

    // Paso 3: Crear el token JWT
    // El token contiene:
    // - id: ID del usuario en nuestra base de datos
    // - rol: Rol del usuario (cliente, barbero, admin)
    const token = jwt.default.sign(
      {
        id: usuario._id,    // ID del usuario en MongoDB
        rol: usuario.rol    // Rol del usuario
      },
      process.env.JWT_SECRET,                    // Clave secreta para firmar el token
      { expiresIn: process.env.JWT_EXPIRATION || '7d' }  // Token expira en 7 días
    );

    // Paso 4: Redirigir al frontend con el token
    // El frontend tiene una página especial /auth/callback que:
    // - Extrae el token de la URL
    // - Lo guarda en localStorage
    // - Redirige al usuario a su dashboard correspondiente
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    // Paso 5: Manejar errores
    // Si algo falla en la generación del token o cualquier otro paso
    console.error('Error en Google callback:', error);

    // Redirigir al frontend con un parámetro de error
    // El frontend mostrará un mensaje de error al usuario
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
};

// ============================================================================
// EXPORTACIÓN POR DEFECTO
// ============================================================================

// Exportar todas las funciones del controlador como objeto por defecto
// Esto permite importar el controlador completo si es necesario
export default {
  registrarUsuario,
  iniciarSesion,
  obtenerPerfilUsuario,
  actualizarPerfilUsuario,
  cambiarContrasena,
  verificarTokenJWT,
  callbackAutenticacionGoogle,
};
