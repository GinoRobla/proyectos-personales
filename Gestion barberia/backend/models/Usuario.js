/**
 * ============================================================================
 * MODELO DE USUARIO
 * ============================================================================
 *
 * Este archivo define la estructura de datos para los usuarios del sistema.
 *
 * QUÉ ES UN USUARIO:
 * Un usuario es cualquier persona que use el sistema de la barbería.
 * Puede ser un cliente que reserva turnos, un barbero que los atiende,
 * o un administrador que gestiona todo.
 *
 * RESPONSABILIDADES DE ESTE ARCHIVO:
 * - Definir qué información se guarda de cada usuario (nombre, email, etc.)
 * - Validar que los datos sean correctos (email válido, contraseña segura, etc.)
 * - Encriptar contraseñas automáticamente antes de guardarlas
 * - Proporcionar métodos para verificar contraseñas
 * - Organizar usuarios por índices para búsquedas rápidas
 *
 * IMPORTANTE SOBRE SEGURIDAD:
 * Las contraseñas NUNCA se guardan en texto plano. Este modelo usa bcrypt
 * para encriptarlas automáticamente antes de guardarlas en la base de datos.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * ESQUEMA (ESTRUCTURA) DEL USUARIO
 *
 * Aquí definimos qué campos tiene cada usuario y sus reglas de validación.
 * Es como un formulario que dice qué información es obligatoria y cuál opcional.
 */
const esquemaDeUsuario = new mongoose.Schema(
  {
    // ===== INFORMACIÓN PERSONAL =====

    /**
     * NOMBRE del usuario
     * - Es obligatorio (required: true)
     * - Se elimina espacios al inicio y final (trim: true)
     */
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },

    /**
     * APELLIDO del usuario
     * - Es obligatorio
     * - Se elimina espacios al inicio y final
     */
    apellido: {
      type: String,
      required: [true, 'El apellido es obligatorio'],
      trim: true,
    },

    /**
     * EMAIL del usuario
     * - Es obligatorio y único (no puede haber dos usuarios con el mismo email)
     * - Se convierte automáticamente a minúsculas (lowercase: true)
     * - Se valida que tenga formato de email válido usando una expresión regular
     * - Sirve como identificador único para iniciar sesión
     */
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
    },

    /**
     * CONTRASEÑA del usuario
     * - Es obligatoria
     * - Debe tener mínimo 6 caracteres
     * - select: false significa que NO se devuelve por defecto en las consultas
     *   (por seguridad, para no exponer contraseñas accidentalmente)
     * - Se encripta automáticamente antes de guardarse (ver middleware más abajo)
     */
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
      select: false,
    },

    /**
     * TELÉFONO de contacto del usuario
     * - Es obligatorio
     * - Se usa para notificaciones y contacto
     */
    telefono: {
      type: String,
      required: [true, 'El teléfono es obligatorio'],
      trim: true,
    },

    // ===== INFORMACIÓN DEL SISTEMA =====

    /**
     * ROL del usuario en el sistema
     * - Define qué permisos tiene el usuario
     * - Puede ser: 'cliente', 'barbero' o 'admin'
     * - Por defecto es 'cliente'
     *
     * ROLES:
     * - cliente: Puede reservar turnos y ver su historial
     * - barbero: Puede ver y gestionar sus turnos asignados
     * - admin: Puede gestionar todo el sistema (usuarios, servicios, etc.)
     */
    rol: {
      type: String,
      enum: ['cliente', 'barbero', 'admin'],
      default: 'cliente',
    },

    /**
     * FOTO de perfil del usuario
     * - URL de la imagen de perfil
     * - Si no se especifica, usa una imagen placeholder (imagen de ejemplo)
     */
    foto: {
      type: String,
      default: 'https://via.placeholder.com/150',
    },

    /**
     * ACTIVO: Indica si el usuario está activo en el sistema
     * - true = puede usar el sistema normalmente
     * - false = cuenta desactivada (no puede iniciar sesión)
     * - Por defecto es true
     * - Se usa para "eliminar" usuarios sin borrarlos realmente de la BD
     */
    activo: {
      type: Boolean,
      default: true,
    },

    /**
     * BARBERO ASOCIADO
     * - Si el usuario es un barbero, aquí se guarda la referencia a su perfil de barbero
     * - Es una referencia (ObjectId) al modelo 'Barbero'
     * - null si el usuario no es un barbero
     *
     * POR QUÉ EXISTE ESTO:
     * Los barberos tienen dos registros: uno como Usuario (para login) y otro
     * como Barbero (con información profesional como especialidad, horarios, etc.)
     */
    barberoAsociado: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Barbero',
      default: null,
    },

    /**
     * ÚLTIMO LOGIN
     * - Fecha y hora del último inicio de sesión
     * - Se actualiza cada vez que el usuario hace login
     * - null si nunca ha iniciado sesión
     * - Útil para estadísticas y seguridad
     */
    ultimoLogin: {
      type: Date,
      default: null,
    },
  },
  {
    /**
     * TIMESTAMPS
     * - Mongoose agrega automáticamente dos campos:
     *   - createdAt: Fecha de creación del usuario
     *   - updatedAt: Fecha de última actualización
     */
    timestamps: true,

    /**
     * VERSION KEY
     * - false significa que no se guarda el campo __v (versión del documento)
     * - Esto hace que los objetos JSON sean más limpios
     */
    versionKey: false,
  }
);

/**
 * ============================================================================
 * ÍNDICES PARA BÚSQUEDAS RÁPIDAS
 * ============================================================================
 *
 * Los índices son como el índice de un libro: permiten encontrar información
 * rápidamente sin tener que revisar todo.
 *
 * Por ejemplo, si buscamos usuarios por email, MongoDB puede usar este índice
 * en lugar de revisar TODOS los usuarios uno por uno.
 */

// Índice por email (para búsquedas de login)
esquemaDeUsuario.index({ email: 1 });

// Índice por rol (para filtrar usuarios por tipo)
esquemaDeUsuario.index({ rol: 1 });

/**
 * ============================================================================
 * CAMPOS VIRTUALES (CALCULADOS)
 * ============================================================================
 *
 * Los campos virtuales son propiedades que se calculan automáticamente
 * pero NO se guardan en la base de datos.
 */

/**
 * NOMBRE COMPLETO
 *
 * Este campo virtual junta el nombre y apellido automáticamente.
 *
 * EJEMPLO:
 * Si nombre = "Juan" y apellido = "Pérez"
 * Entonces nombreCompleto = "Juan Pérez"
 *
 * POR QUÉ ES VIRTUAL:
 * No tiene sentido guardar el nombre completo en la BD cuando ya tenemos
 * el nombre y apellido por separado. Este campo se calcula cuando lo necesitamos.
 */
esquemaDeUsuario.virtual('nombreCompleto').get(function () {
  return `${this.nombre} ${this.apellido}`;
});

/**
 * ============================================================================
 * MIDDLEWARE: ENCRIPTAR CONTRASEÑA ANTES DE GUARDAR
 * ============================================================================
 *
 * Este middleware se ejecuta AUTOMÁTICAMENTE antes de guardar un usuario.
 *
 * QUÉ HACE:
 * Encripta la contraseña usando bcrypt antes de guardarla en la base de datos.
 *
 * POR QUÉ ES IMPORTANTE:
 * Por seguridad, NUNCA guardamos contraseñas en texto plano. Si alguien
 * accede a la base de datos, no podrá ver las contraseñas reales.
 *
 * CÓMO FUNCIONA:
 * 1. Verifica si la contraseña fue modificada (solo encripta si cambió)
 * 2. Genera un "salt" (valor aleatorio para hacer la encriptación más segura)
 * 3. Encripta la contraseña combinándola con el salt
 * 4. Guarda la contraseña encriptada en lugar de la original
 */
esquemaDeUsuario.pre('save', async function (siguienteMiddleware) {
  // Paso 1: Verificar si la contraseña fue modificada
  // Si no cambió, no necesitamos encriptarla de nuevo
  const contraseñaFueModificada = this.isModified('password');
  if (!contraseñaFueModificada) {
    return siguienteMiddleware(); // Continuar sin hacer nada
  }

  try {
    // Paso 2: Generar el "salt" (valor aleatorio)
    // El número 10 es el "costo" de encriptación (más alto = más seguro pero más lento)
    const valorAleatorioParaEncriptacion = await bcrypt.genSalt(10);

    // Paso 3: Encriptar la contraseña usando el salt
    const contraseñaEncriptada = await bcrypt.hash(
      this.password,
      valorAleatorioParaEncriptacion
    );

    // Paso 4: Reemplazar la contraseña en texto plano por la encriptada
    this.password = contraseñaEncriptada;

    // Continuar con el guardado
    siguienteMiddleware();
  } catch (error) {
    // Si hay algún error en la encriptación, pasarlo al siguiente middleware
    siguienteMiddleware(error);
  }
});

/**
 * ============================================================================
 * MÉTODOS PERSONALIZADOS DEL MODELO
 * ============================================================================
 *
 * Estos métodos se pueden usar en cualquier instancia de Usuario.
 * Son como funciones especiales que cada usuario puede ejecutar.
 */

/**
 * COMPARAR CONTRASEÑA
 *
 * Verifica si una contraseña ingresada coincide con la contraseña encriptada
 * guardada en la base de datos.
 *
 * @param {string} contraseñaIngresada - La contraseña que el usuario escribió (sin encriptar)
 * @returns {Promise<boolean>} - true si la contraseña es correcta, false si no
 *
 * CÓMO SE USA:
 * const esCorrecta = await usuario.compararPassword('micontraseña123');
 *
 * POR QUÉ NO COMPARAMOS DIRECTAMENTE:
 * No podemos comparar la contraseña ingresada con la guardada porque la guardada
 * está encriptada. bcrypt sabe cómo compararlas correctamente.
 */
esquemaDeUsuario.methods.compararPassword = async function (contraseñaIngresada) {
  // bcrypt.compare compara la contraseña en texto plano con la encriptada
  // Devuelve true si coinciden, false si no
  const contraseñaEsCorrecta = await bcrypt.compare(
    contraseñaIngresada,
    this.password
  );

  return contraseñaEsCorrecta;
};

/**
 * CONVERTIR A JSON (SIN CONTRASEÑA)
 *
 * Este método se ejecuta automáticamente cuando convertimos un usuario a JSON
 * (por ejemplo, al enviarlo como respuesta en una API).
 *
 * QUÉ HACE:
 * Elimina la contraseña del objeto antes de convertirlo a JSON.
 *
 * POR QUÉ:
 * Por seguridad, NUNCA debemos enviar contraseñas al frontend o exponerlas
 * en las respuestas de la API, ni siquiera encriptadas.
 *
 * CÓMO FUNCIONA:
 * 1. Convierte el documento de MongoDB a un objeto JavaScript normal
 * 2. Incluye los campos virtuales (como nombreCompleto)
 * 3. Elimina el campo password
 * 4. Devuelve el objeto limpio y seguro
 */
esquemaDeUsuario.methods.toJSON = function () {
  // Paso 1 y 2: Convertir a objeto e incluir virtuals
  const usuarioComoObjeto = this.toObject({ virtuals: true });

  // Paso 3: Eliminar la contraseña del objeto
  delete usuarioComoObjeto.password;

  // Paso 4: Devolver el objeto sin contraseña
  return usuarioComoObjeto;
};

/**
 * ============================================================================
 * CREAR Y EXPORTAR EL MODELO
 * ============================================================================
 *
 * Creamos el modelo 'Usuario' basado en el esquema que definimos arriba.
 * Este modelo es lo que usaremos en el resto de la aplicación para crear,
 * buscar, actualizar y eliminar usuarios.
 */
const Usuario = mongoose.model('Usuario', esquemaDeUsuario);

export default Usuario;
