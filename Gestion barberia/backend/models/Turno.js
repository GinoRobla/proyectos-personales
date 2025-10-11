/**
 * ============================================================================
 * MODELO DE TURNO (RESERVA/CITA)
 * ============================================================================
 *
 * Este archivo define la estructura de datos para los turnos (reservas) de la barbería.
 *
 * QUÉ ES UN TURNO:
 * Un turno es una reserva que hace un cliente para recibir un servicio en la barbería.
 * Es el corazón del sistema de gestión de la barbería.
 *
 * RESPONSABILIDADES DE ESTE ARCHIVO:
 * - Definir toda la información de una reserva (quién, cuándo, qué servicio, etc.)
 * - Validar que no haya turnos duplicados (mismo barbero, fecha y hora)
 * - Gestionar estados del turno (pendiente, confirmado, completado, cancelado)
 * - Controlar pagos y recordatorios
 * - Relacionar clientes, barberos y servicios
 *
 * CICLO DE VIDA DE UN TURNO:
 * 1. PENDIENTE: El cliente hace la reserva
 * 2. CONFIRMADO: El administrador o barbero confirma el turno
 * 3. COMPLETADO: El servicio se realizó exitosamente
 * 4. CANCELADO: El turno se canceló (por el cliente o la barbería)
 */

import mongoose from 'mongoose';

/**
 * ESQUEMA (ESTRUCTURA) DEL TURNO
 *
 * Define todos los campos que tiene cada turno en la base de datos.
 */
const esquemaDeTurno = new mongoose.Schema(
  {
    // ===== RELACIONES (QUIÉN PARTICIPA) =====

    /**
     * CLIENTE que reservó el turno
     * - Es obligatorio (no puede haber turno sin cliente)
     * - Es una referencia (ObjectId) al modelo 'Cliente'
     * - Permite saber quién hizo la reserva
     *
     * QUÉ ES UNA REFERENCIA:
     * En lugar de guardar toda la información del cliente aquí (nombre, email, etc.),
     * solo guardamos su ID. Cuando necesitamos los datos completos, MongoDB los
     * busca automáticamente usando .populate()
     */
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente',
      required: [true, 'El cliente es obligatorio'],
    },

    /**
     * BARBERO asignado al turno
     * - Es opcional (puede ser null)
     * - Es una referencia (ObjectId) al modelo 'Barbero'
     * - null significa que el cliente eligió "barbero indistinto"
     *
     * CASOS DE USO:
     * 1. Cliente elige un barbero específico → se guarda su ID
     * 2. Cliente elige "indistinto" → queda en null
     * 3. Administrador asigna un barbero después → se actualiza con su ID
     *
     * POR QUÉ PUEDE SER NULL:
     * Algunos clientes no tienen preferencia de barbero. El administrador
     * puede asignar uno más tarde según disponibilidad.
     */
    barbero: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Barbero',
      default: null,
    },

    /**
     * SERVICIO solicitado
     * - Es obligatorio
     * - Es una referencia (ObjectId) al modelo 'Servicio'
     * - Define qué se va a hacer (corte, afeitado, tinte, etc.)
     *
     * IMPORTANCIA:
     * El servicio determina:
     * - Cuánto tiempo tomará (duración)
     * - Cuánto costará (precio base)
     * - Qué especialidad se necesita
     */
    servicio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Servicio',
      required: [true, 'El servicio es obligatorio'],
    },

    // ===== INFORMACIÓN DE FECHA Y HORA =====

    /**
     * FECHA del turno
     * - Es obligatoria
     * - Tipo Date (fecha completa con hora, pero solo usamos la parte de fecha)
     * - Representa el día en que se atenderá al cliente
     *
     * FORMATO:
     * Se guarda como fecha de JavaScript (Date object)
     * Ejemplo: new Date('2024-03-15')
     */
    fecha: {
      type: Date,
      required: [true, 'La fecha es obligatoria'],
    },

    /**
     * HORA del turno
     * - Es obligatoria
     * - Formato de texto "HH:mm" (ejemplo: "10:00", "14:30")
     * - Se valida con expresión regular
     *
     * POR QUÉ ES STRING Y NO DATE:
     * Guardamos solo la hora como texto porque:
     * 1. Es más fácil de mostrar y comparar
     * 2. Evita problemas de zonas horarias
     * 3. La fecha ya está en el campo 'fecha'
     *
     * VALIDACIÓN:
     * Debe cumplir el formato HH:mm donde:
     * - HH va de 00 a 23 (hora en formato 24h)
     * - mm va de 00 a 59 (minutos)
     */
    hora: {
      type: String,
      required: [true, 'La hora es obligatoria'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'],
    },

    // ===== ESTADO DEL TURNO =====

    /**
     * ESTADO actual del turno
     * - Solo puede ser uno de estos valores: pendiente, reservado, completado, cancelado
     * - Por defecto es 'pendiente'
     *
     * ESTADOS EXPLICADOS:
     *
     * 1. PENDIENTE:
     *    - El cliente hizo la reserva pero aún no está confirmada
     *    - El barbero o admin debe revisarla y confirmarla
     *    - Es el estado inicial de todo turno nuevo
     *
     * 2. RESERVADO:
     *    - El turno fue aprobado por el barbero o administrador
     *    - El cliente recibirá recordatorios
     *    - El barbero lo ve en su agenda
     *
     * 3. COMPLETADO:
     *    - El servicio se realizó exitosamente
     *    - El cliente ya fue atendido
     *    - Se usa para historial y estadísticas
     *
     * 4. CANCELADO:
     *    - El turno se canceló (por el cliente o la barbería)
     *    - No se atenderá
     *    - Se mantiene en la BD para historial pero liberando el horario
     */
    estado: {
      type: String,
      enum: ['pendiente', 'confirmado', 'completado', 'cancelado'],
      default: 'pendiente',
    },

    // ===== INFORMACIÓN DE PAGO =====

    /**
     * PRECIO del turno
     * - Es obligatorio
     * - No puede ser negativo
     * - Generalmente se copia del precio base del servicio
     * - Se guarda aquí por si el precio del servicio cambia después
     *
     * POR QUÉ GUARDAMOS EL PRECIO AQUÍ:
     * Si el precio del servicio cambia en el futuro, los turnos viejos
     * deben mantener el precio que se acordó en su momento.
     */
    precio: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },

    /**
     * MÉTODO DE PAGO elegido
     * - Puede ser: efectivo, mercadopago, o pendiente
     * - Por defecto es 'pendiente'
     *
     * MÉTODOS:
     * - efectivo: El cliente pagará en efectivo cuando llegue
     * - mercadopago: Se procesó el pago online
     * - pendiente: Aún no se definió cómo pagará
     */
    metodoPago: {
      type: String,
      enum: ['efectivo', 'mercadopago', 'pendiente'],
      default: 'pendiente',
    },

    /**
     * PAGADO: Indica si el servicio ya fue pagado
     * - true = el pago se recibió/procesó
     * - false = aún no se pagó
     * - Por defecto es false
     *
     * CASOS DE USO:
     * - Si metodoPago es 'mercadopago' y se procesó → pagado = true
     * - Si metodoPago es 'efectivo' → pagado = false hasta que llegue el cliente
     * - El barbero puede marcar como pagado cuando recibe el efectivo
     */
    pagado: {
      type: Boolean,
      default: false,
    },

    // ===== NOTAS Y COMENTARIOS =====

    /**
     * NOTAS DEL CLIENTE
     * - Opcional
     * - Comentarios o pedidos especiales del cliente
     * - Se eliminan espacios al inicio y final
     *
     * EJEMPLOS:
     * - "Por favor usar máquina número 2"
     * - "Tengo el cabello muy rizado, necesito más tiempo"
     * - "Alergia a ciertos productos"
     * - "Quiero un degradado bajo"
     */
    notasCliente: {
      type: String,
      trim: true,
      default: '',
    },

    /**
     * NOTAS DEL BARBERO
     * - Opcional
     * - Comentarios privados que el barbero agrega durante o después del servicio
     * - Solo visible para barberos y administradores
     *
     * EJEMPLOS:
     * - "Cliente prefiere corte corto en los lados"
     * - "Usar productos para cabello seco"
     * - "Sensible en el cuero cabelludo"
     * - "Productos utilizados: XYZ"
     */
    notasBarbero: {
      type: String,
      trim: true,
      default: '',
    },

    // ===== SISTEMA DE RECORDATORIOS =====

    /**
     * RECORDATORIO ENVIADO
     * - Indica si ya se envió el email/SMS recordatorio al cliente
     * - Por defecto es false
     *
     * CÓMO FUNCIONA:
     * Un cron job (tarea automática) revisa los turnos cada cierto tiempo.
     * 30 minutos antes del turno, envía un recordatorio al cliente.
     * Cuando se envía, marca este campo como true para no enviar duplicados.
     *
     * IMPORTANTE:
     * Solo se envían recordatorios a turnos con estado 'confirmado'.
     * Los turnos 'pendiente', 'cancelado' o 'completado' no reciben recordatorios.
     */
    recordatorioEnviado: {
      type: Boolean,
      default: false,
    },
  },
  {
    /**
     * TIMESTAMPS
     * - Mongoose agrega automáticamente:
     *   - createdAt: Cuándo se creó la reserva
     *   - updatedAt: Última modificación (cambio de estado, asignación de barbero, etc.)
     */
    timestamps: true,

    /**
     * VERSION KEY
     * - false significa que no se guarda el campo __v
     */
    versionKey: false,
  }
);

/**
 * ============================================================================
 * ÍNDICES PARA BÚSQUEDAS RÁPIDAS Y OPTIMIZACIÓN
 * ============================================================================
 *
 * Los índices son cruciales en este modelo porque constantemente buscamos
 * turnos por fecha, barbero, cliente, estado, etc.
 */

/**
 * Índice compuesto por FECHA y HORA
 * - Acelera búsquedas de turnos en un día específico
 * - Útil para mostrar la agenda diaria
 */
esquemaDeTurno.index({ fecha: 1, hora: 1 });

/**
 * Índice compuesto por BARBERO y FECHA
 * - Acelera búsquedas de turnos de un barbero en un rango de fechas
 * - Muy usado en la vista de agenda del barbero
 */
esquemaDeTurno.index({ barbero: 1, fecha: 1 });

/**
 * Índice por CLIENTE
 * - Acelera búsquedas del historial de turnos de un cliente
 * - Útil para mostrar "Mis Turnos" en el panel del cliente
 */
esquemaDeTurno.index({ cliente: 1 });

/**
 * Índice por ESTADO
 * - Acelera filtros por estado (mostrar solo pendientes, solo confirmados, etc.)
 * - Muy usado en el panel de administración
 */
esquemaDeTurno.index({ estado: 1 });

/**
 * Índice para el SISTEMA DE RECORDATORIOS
 * - Combina recordatorioEnviado, fecha y hora
 * - Permite encontrar rápidamente turnos que necesitan recordatorio:
 *   "Turnos donde recordatorioEnviado = false y la fecha/hora está próxima"
 */
esquemaDeTurno.index({ recordatorioEnviado: 1, fecha: 1, hora: 1 });

/**
 * ============================================================================
 * ÍNDICE ÚNICO: PREVENCIÓN DE TURNOS DUPLICADOS
 * ============================================================================
 *
 * Este índice especial EVITA que se creen dos turnos con el mismo barbero
 * en la misma fecha y hora.
 *
 * CÓMO FUNCIONA:
 * - Si ya existe un turno con el barbero X el día Y a la hora Z
 * - Y el estado es 'pendiente' o 'reservado'
 * - Entonces NO se puede crear otro turno con esos mismos valores
 *
 * POR QUÉ ES PARCIAL (partialFilterExpression):
 * Solo aplica a turnos activos (pendiente/reservado).
 * Esto permite tener turnos cancelados o completados con los mismos valores.
 *
 * POR QUÉ EXCLUIMOS barbero null:
 * Si barbero es null (indistinto), no hay conflicto porque no sabemos
 * qué barbero atenderá. Solo validamos cuando hay barbero específico.
 */
esquemaDeTurno.index(
  { barbero: 1, fecha: 1, hora: 1 }, // Combinación que debe ser única
  {
    unique: true, // No permite duplicados
    partialFilterExpression: {
      // Solo aplica si se cumplen estas condiciones:
      estado: { $in: ['pendiente', 'confirmado'] }, // Estado activo
      barbero: { $ne: null }, // Barbero asignado (no null)
    },
  }
);

/**
 * ============================================================================
 * CREAR Y EXPORTAR EL MODELO
 * ============================================================================
 *
 * Creamos el modelo 'Turno' basado en el esquema que definimos arriba.
 *
 * OPERACIONES COMUNES:
 * - Crear nuevo turno cuando un cliente hace una reserva
 * - Buscar turnos de un barbero para mostrar su agenda
 * - Buscar turnos de un cliente para mostrar su historial
 * - Actualizar estado (de pendiente a confirmado, de confirmado a completado)
 * - Buscar turnos que necesitan recordatorio
 * - Generar estadísticas (turnos completados, cancelados, ingresos, etc.)
 */
const Turno = mongoose.model('Turno', esquemaDeTurno);

export default Turno;
