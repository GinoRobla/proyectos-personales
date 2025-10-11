/**
 * ============================================================================
 * MODELO DE SERVICIO
 * ============================================================================
 *
 * Este archivo define la estructura de datos para los servicios de la barbería.
 *
 * QUÉ ES UN SERVICIO:
 * Un servicio es un tipo de atención que ofrece la barbería a sus clientes.
 * Por ejemplo: "Corte de cabello", "Afeitado", "Tinte", etc.
 *
 * RESPONSABILIDADES DE ESTE ARCHIVO:
 * - Definir qué información tiene cada servicio (nombre, precio, duración, etc.)
 * - Validar que los datos sean correctos (precios no negativos, duración razonable, etc.)
 * - Proporcionar la estructura para que los clientes puedan elegir servicios
 * - Organizar servicios por índices para búsquedas rápidas
 *
 * PARA QUÉ SE USA:
 * Cuando un cliente reserva un turno, debe elegir qué servicio quiere.
 * El servicio determina cuánto tiempo tomará (duración) y cuánto costará (precio).
 */

import mongoose from 'mongoose';

/**
 * ESQUEMA (ESTRUCTURA) DEL SERVICIO
 *
 * Define todos los campos que tiene cada servicio en la base de datos.
 */
const esquemaDeServicio = new mongoose.Schema(
  {
    // ===== INFORMACIÓN BÁSICA =====

    /**
     * NOMBRE del servicio
     * - Es obligatorio y único (no puede haber dos servicios con el mismo nombre)
     * - Se eliminan espacios al inicio y final automáticamente
     *
     * EJEMPLOS:
     * - "Corte de cabello"
     * - "Corte + Barba"
     * - "Afeitado clásico"
     * - "Tinte de cabello"
     * - "Tratamiento capilar"
     */
    nombre: {
      type: String,
      required: [true, 'El nombre del servicio es obligatorio'],
      trim: true,
      unique: true,
    },

    /**
     * DESCRIPCIÓN del servicio
     * - Es obligatoria
     * - Explica en detalle qué incluye el servicio
     * - Se muestra a los clientes cuando eligen un servicio
     *
     * EJEMPLO:
     * "Corte de cabello personalizado según tu estilo. Incluye lavado,
     *  corte con tijera o máquina, y peinado final."
     */
    descripcion: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true,
    },

    // ===== INFORMACIÓN DE TIEMPO Y PRECIO =====

    /**
     * DURACIÓN del servicio (en minutos)
     * - Es obligatoria
     * - Debe estar entre 15 y 240 minutos (4 horas máximo)
     *
     * POR QUÉ ES IMPORTANTE:
     * La duración se usa para:
     * 1. Calcular cuándo puede empezar el siguiente turno
     * 2. Mostrar al barbero cuánto tiempo necesita para cada servicio
     * 3. Organizar la agenda del día
     *
     * EJEMPLOS:
     * - Corte simple: 30 minutos
     * - Corte + barba: 45 minutos
     * - Tinte completo: 120 minutos
     *
     * VALIDACIONES:
     * - Mínimo: 15 minutos (servicios muy rápidos)
     * - Máximo: 240 minutos = 4 horas (servicios largos como tratamientos)
     */
    duracion: {
      type: Number,
      required: [true, 'La duración es obligatoria'],
      min: [15, 'La duración mínima es 15 minutos'],
      max: [240, 'La duración máxima es 240 minutos'],
    },

    /**
     * PRECIO BASE del servicio
     * - Es obligatorio
     * - No puede ser negativo (mínimo 0)
     * - Se expresa en la moneda local (por ejemplo, pesos, dólares, etc.)
     *
     * POR QUÉ SE LLAMA "BASE":
     * Es el precio estándar del servicio. En el futuro se podría implementar
     * precios diferentes según el barbero o descuentos especiales.
     *
     * VALIDACIÓN:
     * - Mínimo: 0 (servicios gratuitos están permitidos)
     * - No hay máximo definido
     */
    precioBase: {
      type: Number,
      required: [true, 'El precio base es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },

    // ===== ESTADO Y VISUALIZACIÓN =====

    /**
     * ACTIVO: Indica si el servicio está disponible para reservar
     * - true = el servicio está activo y se muestra a los clientes
     * - false = el servicio está desactivado y NO se puede reservar
     * - Por defecto es true
     *
     * POR QUÉ EXISTE:
     * Permite desactivar servicios temporalmente sin borrarlos.
     * Por ejemplo:
     * - Servicios de temporada (tintes navideños)
     * - Servicios en pausa por falta de productos
     * - Servicios que ya no se ofrecen pero queremos mantener en el historial
     *
     * IMPORTANTE:
     * Los turnos ya reservados con un servicio desactivado NO se cancelan.
     * Solo no se puede hacer nuevas reservas con ese servicio.
     */
    activo: {
      type: Boolean,
      default: true,
    },

    /**
     * IMAGEN del servicio
     * - URL de una imagen representativa del servicio
     * - Si no se especifica, usa una imagen placeholder por defecto
     * - Se muestra en la interfaz cuando los clientes eligen servicios
     *
     * RECOMENDACIONES:
     * - Usar imágenes de buena calidad (300x200 píxeles mínimo)
     * - Mostrar el resultado del servicio (fotos de cortes realizados)
     * - Mantener un estilo visual consistente entre todas las imágenes
     */
    imagen: {
      type: String,
      default: 'https://via.placeholder.com/300x200?text=Servicio',
    },
  },
  {
    /**
     * TIMESTAMPS
     * - Mongoose agrega automáticamente dos campos:
     *   - createdAt: Fecha cuando se creó el servicio
     *   - updatedAt: Fecha de la última modificación
     *
     * UTILIDAD:
     * Podemos saber cuándo se agregó un servicio y cuándo se modificó
     * su precio o descripción.
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
 * Índice por NOMBRE
 * - Acelera las búsquedas de servicios por nombre
 * - Útil cuando buscamos un servicio específico
 * - También ayuda a validar que no haya nombres duplicados
 */
esquemaDeServicio.index({ nombre: 1 });

/**
 * Índice por ACTIVO
 * - Acelera el filtrado de servicios activos vs inactivos
 * - Muy usado porque constantemente filtramos solo servicios activos
 *   para mostrarlos a los clientes
 *
 * EJEMPLO DE USO:
 * Cuando un cliente va a reservar un turno, solo mostramos servicios
 * donde activo = true. Este índice hace esa búsqueda muy rápida.
 */
esquemaDeServicio.index({ activo: 1 });

/**
 * ============================================================================
 * CREAR Y EXPORTAR EL MODELO
 * ============================================================================
 *
 * Creamos el modelo 'Servicio' basado en el esquema que definimos arriba.
 * Este modelo se usa en toda la aplicación para crear, buscar, actualizar
 * y eliminar servicios.
 *
 * OPERACIONES COMUNES:
 * - Listar todos los servicios activos para mostrar a los clientes
 * - Crear un nuevo servicio desde el panel de administración
 * - Actualizar precios o descripciones de servicios existentes
 * - Desactivar servicios que ya no se ofrecen
 */
const Servicio = mongoose.model('Servicio', esquemaDeServicio);

export default Servicio;
