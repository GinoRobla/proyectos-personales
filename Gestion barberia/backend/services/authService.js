/**
 * ============================================================================
 * SERVICIO DE AUTENTICACIÓN
 * ============================================================================
 *
 * Este archivo contiene toda la lógica de negocio relacionada con la
 * autenticación y gestión de usuarios en el sistema de la barbería.
 *
 * QUÉ ES UN SERVICIO:
 * Los servicios contienen la lógica de negocio de la aplicación. Son el
 * "cerebro" que procesa datos, toma decisiones y orquesta operaciones.
 * Los controladores llaman a los servicios, y los servicios usan los modelos.
 *
 * RESPONSABILIDADES DE ESTE ARCHIVO:
 * - Registrar nuevos usuarios en el sistema
 * - Autenticar usuarios (login con email y contraseña)
 * - Generar y verificar tokens JWT (para mantener sesiones seguras)
 * - Actualizar perfiles de usuario
 * - Cambiar contraseñas de forma segura
 * - Asociar usuarios con perfiles de barbero
 *
 * QUÉ ES JWT:
 * JWT (JSON Web Token) es un token seguro que se genera cuando un usuario
 * inicia sesión. Este token se envía en cada petición para identificar al
 * usuario sin necesidad de enviar la contraseña cada vez.
 *
 * FLUJO DE AUTENTICACIÓN:
 * 1. Usuario envía email y contraseña
 * 2. Este servicio verifica las credenciales
 * 3. Si son correctas, genera un token JWT
 * 4. El token se envía al cliente (frontend)
 * 5. El cliente envía el token en cada petición
 * 6. El servidor verifica el token para identificar al usuario
 */

import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';
import Barbero from '../models/Barbero.js';
import dotenv from 'dotenv';

// Cargar variables de entorno (credenciales y configuración)
dotenv.config();

// ===== FUNCIONES AUXILIARES (HELPERS) =====

/**
 * GENERAR TOKEN JWT
 *
 * Crea un token JWT que identifica al usuario de forma segura.
 *
 * QUÉ HACE:
 * Genera un token encriptado que contiene el ID y rol del usuario.
 *
 * POR QUÉ EXISTE:
 * Los tokens JWT permiten que el usuario se mantenga autenticado sin
 * necesidad de enviar la contraseña en cada petición. Es más seguro
 * y más eficiente que las sesiones tradicionales.
 *
 * CÓMO FUNCIONA:
 * 1. Recibe el ID del usuario y su rol
 * 2. Crea un objeto con esa información
 * 3. Lo encripta usando una clave secreta (JWT_SECRET)
 * 4. Establece un tiempo de expiración (por defecto 7 días)
 * 5. Devuelve el token encriptado
 *
 * @param {string} identificadorDeUsuario - ID único del usuario en la base de datos
 * @param {string} rolDelUsuario - Rol del usuario (cliente, barbero, admin)
 * @returns {string} - Token JWT encriptado
 *
 * EJEMPLO:
 * const token = generarToken('abc123', 'cliente');
 * // Devuelve: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */
const generarToken = (identificadorDeUsuario, rolDelUsuario) => {
  // jwt.sign() crea el token con la información del usuario
  const tokenGenerado = jwt.sign(
    // Payload: información que se guardará en el token
    { id: identificadorDeUsuario, rol: rolDelUsuario },
    // Clave secreta para encriptar (debe estar en .env)
    process.env.JWT_SECRET,
    // Opciones: tiempo de expiración
    {
      expiresIn: process.env.JWT_EXPIRATION || '7d', // 7 días por defecto
    }
  );

  return tokenGenerado;
};

// ===== FUNCIONES EXPORTADAS (API PÚBLICA DEL SERVICIO) =====

/**
 * VERIFICAR TOKEN JWT
 *
 * Verifica que un token JWT sea válido y no haya expirado.
 *
 * QUÉ HACE:
 * Desencripta un token y verifica su autenticidad y vigencia.
 *
 * POR QUÉ EXISTE:
 * En cada petición que requiera autenticación, debemos verificar que
 * el token sea válido antes de permitir el acceso.
 *
 * CÓMO FUNCIONA:
 * 1. Recibe el token encriptado
 * 2. Intenta desencriptarlo con la clave secreta
 * 3. Verifica que no haya expirado
 * 4. Si todo está bien, devuelve la información del usuario
 * 5. Si algo falla, lanza un error
 *
 * @param {string} tokenAVerificar - Token JWT a verificar
 * @returns {object} - Información del usuario (id, rol) si el token es válido
 * @throws {Error} - Si el token es inválido o ha expirado
 *
 * EJEMPLO:
 * const datosUsuario = verificarToken('eyJhbGciOiJIUzI1NiIsInR...');
 * console.log(datosUsuario); // { id: 'abc123', rol: 'cliente' }
 */
export const verificarToken = (tokenAVerificar) => {
  try {
    // jwt.verify() desencripta y verifica el token
    const informacionDelToken = jwt.verify(tokenAVerificar, process.env.JWT_SECRET);
    return informacionDelToken;
  } catch (error) {
    // Si hay cualquier error (token inválido, expirado, etc.), lanzar excepción
    throw new Error('Token inválido o expirado');
  }
};

/**
 * REGISTRAR NUEVO USUARIO
 *
 * Crea una nueva cuenta de usuario en el sistema.
 *
 * QUÉ HACE:
 * Valida los datos, verifica que el email no exista, crea el usuario
 * y genera un token de autenticación.
 *
 * PROCESO:
 * 1. Validar que todos los campos obligatorios estén presentes
 * 2. Verificar que el email no esté ya registrado
 * 3. Crear el nuevo usuario en la base de datos
 * 4. Generar un token JWT para autenticarlo automáticamente
 * 5. Devolver el usuario y el token
 *
 * @param {object} datosDelNuevoUsuario - Información del usuario a registrar
 * @param {string} datosDelNuevoUsuario.nombre - Nombre del usuario
 * @param {string} datosDelNuevoUsuario.apellido - Apellido del usuario
 * @param {string} datosDelNuevoUsuario.email - Email (será el identificador único)
 * @param {string} datosDelNuevoUsuario.password - Contraseña (se encriptará automáticamente)
 * @param {string} datosDelNuevoUsuario.telefono - Teléfono de contacto
 * @param {string} [datosDelNuevoUsuario.rol='cliente'] - Rol del usuario (opcional, por defecto 'cliente')
 * @param {string} [datosDelNuevoUsuario.foto] - URL de la foto de perfil (opcional)
 * @returns {object} - Objeto con el usuario creado y el token de autenticación
 * @throws {Error} - Si faltan campos o el email ya existe
 *
 * EJEMPLO:
 * const resultado = await registrar({
 *   nombre: 'Juan',
 *   apellido: 'Pérez',
 *   email: 'juan@email.com',
 *   password: 'micontraseña123',
 *   telefono: '1234567890'
 * });
 * // Devuelve: { usuario: {...}, token: 'eyJhbGci...' }
 */
export const registrar = async (datosDelNuevoUsuario) => {
  try {
    // Paso 1: Extraer los datos del objeto de entrada
    const { nombre, apellido, email, password, telefono, rol = 'cliente', foto } = datosDelNuevoUsuario;

    // Paso 2: Validar que todos los campos obligatorios estén presentes
    const faltanCampos = !nombre || !apellido || !email || !password || !telefono;
    if (faltanCampos) {
      throw new Error('Faltan campos obligatorios');
    }

    // Paso 3: Verificar si ya existe un usuario con ese email
    const usuarioYaExiste = await Usuario.findOne({ email });
    if (usuarioYaExiste) {
      throw new Error('El email ya está registrado');
    }

    // Paso 4: Crear el nuevo usuario
    const nuevoUsuario = new Usuario({
      nombre,
      apellido,
      email,
      password, // Se encriptará automáticamente gracias al middleware del modelo
      telefono,
      rol,
      foto,
    });

    // Paso 5: Guardar el usuario en la base de datos
    await nuevoUsuario.save();

    // Paso 6: Generar un token JWT para autenticar al usuario automáticamente
    const tokenDeAutenticacion = generarToken(nuevoUsuario._id, nuevoUsuario.rol);

    // Paso 7: Convertir el usuario a JSON (esto elimina la contraseña automáticamente)
    const usuarioSinContraseña = nuevoUsuario.toJSON();

    // Paso 8: Devolver el usuario y el token
    return {
      usuario: usuarioSinContraseña,
      token: tokenDeAutenticacion,
    };
  } catch (error) {
    // Re-lanzar el error con un mensaje descriptivo
    throw new Error(`Error al registrar usuario: ${error.message}`);
  }
};

/**
 * LOGIN DE USUARIO
 *
 * Autentica a un usuario existente con email y contraseña.
 *
 * QUÉ HACE:
 * Verifica las credenciales del usuario y genera un token de autenticación
 * si son correctas.
 *
 * PROCESO DETALLADO:
 * 1. Validar que se hayan proporcionado email y contraseña
 * 2. Validar el formato del email
 * 3. Buscar el usuario por email (incluyendo la contraseña)
 * 4. Verificar que el usuario exista
 * 5. Verificar que la cuenta esté activa
 * 6. Comparar la contraseña ingresada con la encriptada
 * 7. Actualizar la fecha de último login
 * 8. Generar un token JWT
 * 9. Devolver el usuario y el token
 *
 * @param {string} emailIngresado - Email del usuario
 * @param {string} contraseñaIngresada - Contraseña del usuario
 * @returns {object} - Objeto con el usuario y el token de autenticación
 * @throws {Error} - Si las credenciales son inválidas o la cuenta está desactivada
 *
 * EJEMPLO:
 * const resultado = await login('juan@email.com', 'micontraseña123');
 * // Devuelve: { usuario: {...}, token: 'eyJhbGci...' }
 */
export const login = async (emailIngresado, contraseñaIngresada) => {
  try {
    // Paso 1: Validar que se proporcionen email y contraseña
    const faltanCredenciales = !emailIngresado || !contraseñaIngresada;
    if (faltanCredenciales) {
      throw new Error('Email y contraseña son obligatorios');
    }

    // Paso 2: Validar formato de email con expresión regular
    const expresionRegularEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailEsValido = expresionRegularEmail.test(emailIngresado);
    if (!emailEsValido) {
      throw new Error('Formato de email inválido');
    }

    // Paso 3: Buscar el usuario por email
    // IMPORTANTE: .select('+password') es necesario porque el campo password
    // tiene select: false en el modelo, y aquí SÍ lo necesitamos para comparar
    const usuarioEncontrado = await Usuario.findOne({ email: emailIngresado }).select('+password');

    // Paso 4: Verificar que el usuario exista
    if (!usuarioEncontrado) {
      throw new Error('No existe una cuenta con este email');
    }

    // Paso 5: Verificar que la cuenta esté activa
    if (!usuarioEncontrado.activo) {
      throw new Error('Usuario desactivado. Contacte al administrador');
    }

    // Paso 6: Comparar la contraseña ingresada con la encriptada
    // El método compararPassword está definido en el modelo Usuario
    const contraseñaEsCorrecta = await usuarioEncontrado.compararPassword(contraseñaIngresada);

    if (!contraseñaEsCorrecta) {
      throw new Error('Contraseña incorrecta');
    }

    // Paso 7: Actualizar la fecha de último login
    usuarioEncontrado.ultimoLogin = new Date();
    await usuarioEncontrado.save();

    // Paso 8: Generar un token JWT para la sesión
    const tokenDeAutenticacion = generarToken(usuarioEncontrado._id, usuarioEncontrado.rol);

    // Paso 9: Convertir a JSON para eliminar la contraseña
    const usuarioSinContraseña = usuarioEncontrado.toJSON();

    // Paso 10: Devolver el usuario y el token
    return {
      usuario: usuarioSinContraseña,
      token: tokenDeAutenticacion,
    };
  } catch (error) {
    // Para errores conocidos, re-lanzarlos sin modificar el mensaje
    const esErrorConocido =
      error.message.includes('Email y contraseña') ||
      error.message.includes('Formato de email') ||
      error.message.includes('No existe una cuenta') ||
      error.message.includes('Contraseña incorrecta') ||
      error.message.includes('desactivado');

    if (esErrorConocido) {
      throw error;
    }

    // Para errores desconocidos, envolver con un mensaje genérico
    throw new Error(`Error al iniciar sesión: ${error.message}`);
  }
};

/**
 * OBTENER USUARIO POR ID
 *
 * Busca y devuelve un usuario específico por su ID.
 *
 * QUÉ HACE:
 * Busca un usuario en la base de datos por su identificador único
 * e incluye la información del barbero asociado si existe.
 *
 * CÓMO FUNCIONA:
 * 1. Busca el usuario por ID
 * 2. Si es un barbero, carga también su información profesional
 * 3. Verifica que el usuario exista
 * 4. Devuelve el usuario completo
 *
 * @param {string} identificadorDeUsuario - ID del usuario a buscar
 * @returns {object} - Usuario encontrado con su información completa
 * @throws {Error} - Si el usuario no existe
 *
 * EJEMPLO:
 * const usuario = await obtenerUsuarioPorId('abc123');
 */
export const obtenerUsuarioPorId = async (identificadorDeUsuario) => {
  try {
    // Buscar el usuario y cargar el barbero asociado si existe
    // .populate() reemplaza el ID del barbero con el objeto completo
    const usuarioEncontrado = await Usuario.findById(identificadorDeUsuario).populate(
      'barberoAsociado'
    );

    // Verificar que el usuario exista
    if (!usuarioEncontrado) {
      throw new Error('Usuario no encontrado');
    }

    return usuarioEncontrado;
  } catch (error) {
    throw new Error(`Error al obtener usuario: ${error.message}`);
  }
};

/**
 * ACTUALIZAR PERFIL DE USUARIO
 *
 * Actualiza la información personal de un usuario existente.
 *
 * QUÉ HACE:
 * Permite modificar los datos del perfil de un usuario (nombre, apellido,
 * teléfono, foto).
 *
 * IMPORTANTE:
 * No permite cambiar el email, password o rol desde aquí por seguridad.
 *
 * PROCESO:
 * 1. Buscar el usuario por ID
 * 2. Verificar que exista
 * 3. Actualizar solo los campos proporcionados
 * 4. Guardar los cambios
 * 5. Devolver el usuario actualizado
 *
 * @param {string} identificadorDeUsuario - ID del usuario a actualizar
 * @param {object} datosNuevos - Nuevos datos del usuario
 * @param {string} [datosNuevos.nombre] - Nuevo nombre
 * @param {string} [datosNuevos.apellido] - Nuevo apellido
 * @param {string} [datosNuevos.telefono] - Nuevo teléfono
 * @param {string} [datosNuevos.foto] - Nueva foto de perfil
 * @returns {object} - Usuario actualizado
 * @throws {Error} - Si el usuario no existe
 */
export const actualizarPerfil = async (identificadorDeUsuario, datosNuevos) => {
  try {
    // Extraer los datos a actualizar
    const { nombre, apellido, telefono, foto } = datosNuevos;

    // Buscar el usuario
    const usuarioAActualizar = await Usuario.findById(identificadorDeUsuario);

    // Verificar que exista
    if (!usuarioAActualizar) {
      throw new Error('Usuario no encontrado');
    }

    // Actualizar solo los campos que se proporcionaron
    if (nombre) usuarioAActualizar.nombre = nombre;
    if (apellido) usuarioAActualizar.apellido = apellido;
    if (telefono) usuarioAActualizar.telefono = telefono;
    if (foto) usuarioAActualizar.foto = foto;

    // Guardar los cambios en la base de datos
    await usuarioAActualizar.save();

    return usuarioAActualizar;
  } catch (error) {
    throw new Error(`Error al actualizar perfil: ${error.message}`);
  }
};

/**
 * CAMBIAR CONTRASEÑA
 *
 * Permite a un usuario cambiar su contraseña de forma segura.
 *
 * QUÉ HACE:
 * Verifica la contraseña actual y la reemplaza por una nueva.
 *
 * MEDIDAS DE SEGURIDAD:
 * - Requiere la contraseña actual para confirmar identidad
 * - La contraseña se encripta automáticamente al guardar
 * - Devuelve un mensaje de éxito sin exponer información sensible
 *
 * PROCESO:
 * 1. Validar que se proporcionen ambas contraseñas
 * 2. Buscar el usuario (incluyendo la contraseña actual)
 * 3. Verificar que la contraseña actual sea correcta
 * 4. Establecer la nueva contraseña
 * 5. Guardar (se encriptará automáticamente)
 * 6. Devolver confirmación
 *
 * @param {string} identificadorDeUsuario - ID del usuario
 * @param {string} contraseñaActual - Contraseña actual del usuario
 * @param {string} contraseñaNueva - Nueva contraseña deseada
 * @returns {object} - Mensaje de confirmación
 * @throws {Error} - Si las contraseñas no se proporcionan o la actual es incorrecta
 */
export const cambiarPassword = async (identificadorDeUsuario, contraseñaActual, contraseñaNueva) => {
  try {
    // Paso 1: Validar que se proporcionen ambas contraseñas
    const faltanContraseñas = !contraseñaActual || !contraseñaNueva;
    if (faltanContraseñas) {
      throw new Error('Contraseñas son obligatorias');
    }

    // Paso 2: Buscar el usuario incluyendo la contraseña actual
    const usuarioEncontrado = await Usuario.findById(identificadorDeUsuario).select('+password');

    if (!usuarioEncontrado) {
      throw new Error('Usuario no encontrado');
    }

    // Paso 3: Verificar que la contraseña actual sea correcta
    const contraseñaActualEsCorrecta = await usuarioEncontrado.compararPassword(contraseñaActual);

    if (!contraseñaActualEsCorrecta) {
      throw new Error('Contraseña actual incorrecta');
    }

    // Paso 4: Establecer la nueva contraseña
    usuarioEncontrado.password = contraseñaNueva;

    // Paso 5: Guardar (se encriptará automáticamente gracias al middleware del modelo)
    await usuarioEncontrado.save();

    // Paso 6: Devolver mensaje de éxito
    return { message: 'Contraseña actualizada exitosamente' };
  } catch (error) {
    throw new Error(`Error al cambiar contraseña: ${error.message}`);
  }
};

/**
 * ASOCIAR BARBERO A USUARIO
 *
 * Vincula un perfil de barbero a una cuenta de usuario.
 *
 * QUÉ HACE:
 * Cuando se crea un barbero, necesita tener una cuenta de usuario
 * para poder iniciar sesión. Esta función crea esa asociación.
 *
 * POR QUÉ EXISTE:
 * Los barberos tienen dos registros en la base de datos:
 * 1. Usuario (para login y autenticación)
 * 2. Barbero (para información profesional: especialidad, horarios, etc.)
 *
 * Esta función los conecta mediante el campo 'barberoAsociado'.
 *
 * VALIDACIONES:
 * - Verifica que tanto el usuario como el barbero existan
 * - Verifica que el usuario tenga rol de 'barbero'
 *
 * @param {string} identificadorDeUsuario - ID del usuario
 * @param {string} identificadorDeBarbero - ID del perfil de barbero
 * @returns {object} - Usuario actualizado con la asociación
 * @throws {Error} - Si no existen o el usuario no tiene rol de barbero
 *
 * EJEMPLO:
 * const usuario = await asociarBarbero('usuarioId123', 'barberoId456');
 */
export const asociarBarbero = async (identificadorDeUsuario, identificadorDeBarbero) => {
  try {
    // Paso 1: Buscar el usuario y el barbero
    const usuarioEncontrado = await Usuario.findById(identificadorDeUsuario);
    const barberoEncontrado = await Barbero.findById(identificadorDeBarbero);

    // Paso 2: Validar que ambos existan
    if (!usuarioEncontrado) throw new Error('Usuario no encontrado');
    if (!barberoEncontrado) throw new Error('Barbero no encontrado');

    // Paso 3: Verificar que el usuario tenga rol de barbero
    if (usuarioEncontrado.rol !== 'barbero') {
      throw new Error('El usuario debe tener rol de barbero');
    }

    // Paso 4: Crear la asociación
    usuarioEncontrado.barberoAsociado = identificadorDeBarbero;

    // Paso 5: Guardar el cambio
    await usuarioEncontrado.save();

    return usuarioEncontrado;
  } catch (error) {
    throw new Error(`Error al asociar barbero: ${error.message}`);
  }
};

