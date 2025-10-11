/**
 * ============================================================================
 * MODELO DE BARBERO
 * ============================================================================
 *
 * Este archivo define la estructura de datos para los barberos de la barbería.
 *
 * QUÉ ES UN BARBERO:
 * Un barbero es un profesional que trabaja en la barbería y atiende a los clientes.
 * Tiene información sobre sus datos personales, especialidad, horarios de trabajo, etc.
 *
 * RESPONSABILIDADES DE ESTE ARCHIVO:
 * - Definir qué información se guarda de cada barbero
 * - Validar que los datos sean correctos
 * - Gestionar horarios laborales de cada barbero
 * - Proporcionar métodos útiles para trabajar con barberos
 *
 * DIFERENCIA ENTRE BARBERO Y USUARIO:
 * - Un BARBERO es el perfil profesional (especialidad, horarios, etc.)
 * - Un USUARIO con rol 'barbero' es la cuenta para iniciar sesión
 * - Están conectados mediante el campo 'barberoAsociado' en Usuario
 */

import mongoose from 'mongoose';

/**
 * ESQUEMA (ESTRUCTURA) DEL BARBERO
 *
 * Define todos los campos que tiene cada barbero en la base de datos.
 */
const esquemaDeBarbero = new mongoose.Schema(
  {
    // ===== INFORMACIÓN PERSONAL =====

    /**
     * NOMBRE del barbero
     * - Es obligatorio
     * - Se eliminan espacios al inicio y final automáticamente
     */
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },

    /**
     * APELLIDO del barbero
     * - Es obligatorio
     * - Se eliminan espacios al inicio y final automáticamente
     */
    apellido: {
      type: String,
      required: [true, 'El apellido es obligatorio'],
      trim: true,
    },

    /**
     * EMAIL de contacto del barbero
     * - Es obligatorio y único (no puede haber dos barberos con el mismo email)
     * - Se convierte automáticamente a minúsculas
     * - Se valida el formato usando una expresión regular
     * - Se usa para enviar notificaciones de turnos asignados
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
     * TELÉFONO de contacto del barbero
     * - Es obligatorio
     * - Se usa para comunicación y coordinación
     */
    telefono: {
      type: String,
      required: [true, 'El teléfono es obligatorio'],
      trim: true,
    },

    /**
     * FOTO de perfil del barbero
     * - URL de la imagen de perfil
     * - Si no se especifica, usa una imagen placeholder por defecto
     * - Esta foto se muestra en el sistema cuando los clientes reservan turnos
     */
    foto: {
      type: String,
      default: 'https://via.placeholder.com/150',
    },

    // ===== INFORMACIÓN PROFESIONAL =====

    /**
     * ESPECIALIDAD del barbero
     * - Es obligatorio
     * - Describe en qué es especialista el barbero
     *
     * EJEMPLOS:
     * - "Cortes clásicos"
     * - "Barbería moderna y degradados"
     * - "Afeitado y diseño de barba"
     * - "Coloración y tratamientos"
     *
     * PARA QUÉ SIRVE:
     * Los clientes pueden ver las especialidades al elegir barbero,
     * y el administrador puede asignar turnos según la especialidad.
     */
    especialidad: {
      type: String,
      required: [true, 'La especialidad es obligatoria'],
      trim: true,
    },

    // ===== ESTADO Y DISPONIBILIDAD =====

    /**
     * ACTIVO: Indica si el barbero está trabajando actualmente
     * - true = está activo y puede recibir turnos
     * - false = está inactivo (vacaciones, licencia, ya no trabaja, etc.)
     * - Por defecto es true
     *
     * POR QUÉ ES IMPORTANTE:
     * Permite desactivar barberos temporalmente sin borrar su información.
     * Los barberos inactivos no aparecen en el sistema de reservas.
     */
    activo: {
      type: Boolean,
      default: true,
    },

    /**
     * HORARIO LABORAL del barbero
     * - Define qué días y en qué horarios trabaja cada barbero
     * - Es un Map (diccionario) donde la clave es el día de la semana
     * - Cada día tiene una hora de inicio y una hora de fin
     *
     * FORMATO DE LOS DÍAS:
     * - 0 = Domingo
     * - 1 = Lunes
     * - 2 = Martes
     * - 3 = Miércoles
     * - 4 = Jueves
     * - 5 = Viernes
     * - 6 = Sábado
     *
     * EJEMPLO DE ESTRUCTURA:
     * {
     *   "1": { "inicio": "09:00", "fin": "18:00" },  // Lunes de 9am a 6pm
     *   "2": { "inicio": "09:00", "fin": "18:00" },  // Martes de 9am a 6pm
     *   "3": { "inicio": "09:00", "fin": "18:00" },  // Miércoles de 9am a 6pm
     *   ...
     * }
     *
     * HORARIO POR DEFECTO:
     * Si no se especifica, el barbero trabaja de lunes a sábado de 9:00 a 18:00.
     *
     * PARA QUÉ SIRVE:
     * El sistema solo permite reservar turnos en los horarios laborales de cada barbero.
     * Cada barbero puede tener horarios diferentes.
     */
    horarioLaboral: {
      type: Map,
      of: {
        inicio: String, // Hora de inicio en formato "HH:mm" (ejemplo: "09:00")
        fin: String, // Hora de fin en formato "HH:mm" (ejemplo: "18:00")
      },
      default: {
        // Horario por defecto: Lunes a Sábado de 9:00 a 18:00
        1: { inicio: '09:00', fin: '18:00' }, // Lunes
        2: { inicio: '09:00', fin: '18:00' }, // Martes
        3: { inicio: '09:00', fin: '18:00' }, // Miércoles
        4: { inicio: '09:00', fin: '18:00' }, // Jueves
        5: { inicio: '09:00', fin: '18:00' }, // Viernes
        6: { inicio: '09:00', fin: '18:00' }, // Sábado
        // Nota: No hay domingo (0) por defecto, significa que no trabaja domingos
      },
    },

    /**
     * OBJETIVO MENSUAL de ingresos
     * - Meta de ingresos que el barbero quiere alcanzar cada mes
     * - Se usa para calcular el porcentaje de cumplimiento
     * - El barbero puede modificar este valor desde su panel
     * - Por defecto es 0 (sin objetivo establecido)
     *
     * EJEMPLO:
     * Si objetivoMensual = 500000 (pesos argentinos)
     * Y en el mes actual lleva 250000 de ingresos
     * Entonces el porcentaje de cumplimiento es 50%
     *
     * PARA QUÉ SIRVE:
     * Motiva al barbero y le permite trackear su progreso hacia sus metas.
     */
    objetivoMensual: {
      type: Number,
      default: 0,
      min: [0, 'El objetivo no puede ser negativo'],
    },
  },
  {
    /**
     * TIMESTAMPS
     * - Mongoose agrega automáticamente dos campos:
     *   - createdAt: Fecha cuando se creó el registro del barbero
     *   - updatedAt: Fecha de la última modificación
     */
    timestamps: true,

    /**
     * VERSION KEY
     * - false significa que no se guarda el campo __v
     * - Hace que los objetos JSON sean más limpios
     */
    versionKey: false,
  }
);

/**
 * ============================================================================
 * ÍNDICES PARA BÚSQUEDAS RÁPIDAS
 * ============================================================================
 *
 * Los índices mejoran el rendimiento de las búsquedas en la base de datos.
 */

/**
 * Índice por EMAIL
 * - Acelera las búsquedas de barberos por email
 * - Útil para verificar si un email ya está registrado
 */
esquemaDeBarbero.index({ email: 1 });

/**
 * Índice por ACTIVO
 * - Acelera el filtrado de barberos activos vs inactivos
 * - Muy usado porque constantemente filtramos solo barberos activos
 *   para mostrarlos en el sistema de reservas
 */
esquemaDeBarbero.index({ activo: 1 });

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
 * Combina automáticamente el nombre y apellido del barbero.
 *
 * EJEMPLO:
 * Si nombre = "Carlos" y apellido = "Martínez"
 * Entonces nombreCompleto = "Carlos Martínez"
 *
 * CÓMO SE USA:
 * const nombreCompleto = barbero.nombreCompleto;
 *
 * POR QUÉ ES VIRTUAL:
 * No tiene sentido guardar el nombre completo en la BD cuando podemos
 * calcularlo fácilmente juntando nombre y apellido.
 */
esquemaDeBarbero.virtual('nombreCompleto').get(function () {
  return `${this.nombre} ${this.apellido}`;
});

/**
 * ============================================================================
 * CONFIGURACIÓN DE SERIALIZACIÓN
 * ============================================================================
 *
 * Estas configuraciones determinan cómo se convierten los barberos
 * cuando los enviamos como respuesta JSON o los convertimos a objetos.
 */

/**
 * Incluir campos virtuales al convertir a JSON
 * - Cuando enviamos un barbero como respuesta de API, incluye 'nombreCompleto'
 */
esquemaDeBarbero.set('toJSON', { virtuals: true });

/**
 * Incluir campos virtuales al convertir a Objeto
 * - Cuando convertimos un barbero a objeto JavaScript, incluye 'nombreCompleto'
 */
esquemaDeBarbero.set('toObject', { virtuals: true });

/**
 * ============================================================================
 * CREAR Y EXPORTAR EL MODELO
 * ============================================================================
 *
 * Creamos el modelo 'Barbero' basado en el esquema que definimos arriba.
 * Este modelo se usa en toda la aplicación para crear, buscar, actualizar
 * y eliminar barberos.
 */
const Barbero = mongoose.model('Barbero', esquemaDeBarbero);

export default Barbero;
