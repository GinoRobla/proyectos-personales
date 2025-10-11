/**
 * ============================================================================
 * MODELO DE CLIENTE
 * ============================================================================
 *
 * Este archivo define la estructura de datos para los clientes de la barbería.
 *
 * QUÉ ES UN CLIENTE:
 * Un cliente es una persona que reserva turnos en la barbería para recibir
 * servicios (cortes de cabello, afeitado, etc.).
 *
 * RESPONSABILIDADES DE ESTE ARCHIVO:
 * - Definir qué información se guarda de cada cliente
 * - Validar que los datos de contacto sean correctos
 * - Proporcionar métodos útiles para trabajar con clientes
 * - Organizar clientes por índices para búsquedas rápidas
 *
 * NOTA IMPORTANTE:
 * Este modelo es similar al modelo Usuario, pero los clientes aquí
 * pueden ser creados directamente desde el panel de administración
 * sin necesidad de que tengan una cuenta de usuario.
 */

import mongoose from 'mongoose';

/**
 * ESQUEMA (ESTRUCTURA) DEL CLIENTE
 *
 * Define todos los campos que tiene cada cliente en la base de datos.
 */
const esquemaDeCliente = new mongoose.Schema(
  {
    // ===== INFORMACIÓN PERSONAL =====

    /**
     * NOMBRE del cliente
     * - Es obligatorio
     * - Se eliminan espacios al inicio y final automáticamente
     */
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },

    /**
     * APELLIDO del cliente
     * - Es obligatorio
     * - Se eliminan espacios al inicio y final automáticamente
     */
    apellido: {
      type: String,
      required: [true, 'El apellido es obligatorio'],
      trim: true,
    },

    // ===== INFORMACIÓN DE CONTACTO =====

    /**
     * EMAIL del cliente
     * - Es obligatorio
     * - Se convierte automáticamente a minúsculas
     * - Se valida el formato usando una expresión regular
     * - Se usa para enviar confirmaciones y recordatorios de turnos
     *
     * NOTA: A diferencia del modelo Barbero o Usuario, aquí el email
     * NO es único, porque un cliente puede tener múltiples registros
     * si fue creado por diferentes vías (app web vs panel admin).
     */
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
    },

    /**
     * TELÉFONO del cliente
     * - Es obligatorio
     * - Se usa para contactar al cliente y enviar recordatorios
     *
     * POR QUÉ ES IMPORTANTE:
     * El teléfono es crucial para notificar al cliente sobre cambios
     * en sus turnos o recordatorios importantes.
     */
    telefono: {
      type: String,
      required: [true, 'El teléfono es obligatorio'],
      trim: true,
    },

    // ===== ESTADO =====

    /**
     * ACTIVO: Indica si el cliente está activo en el sistema
     * - true = puede reservar turnos normalmente
     * - false = cliente desactivado (por ejemplo, si pidió ser eliminado)
     * - Por defecto es true
     *
     * POR QUÉ EXISTE:
     * En lugar de borrar clientes de la base de datos (lo cual eliminaría
     * el historial de turnos), los marcamos como inactivos. Así mantenemos
     * el historial pero el cliente no puede hacer nuevas reservas.
     */
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    /**
     * TIMESTAMPS
     * - Mongoose agrega automáticamente dos campos:
     *   - createdAt: Fecha cuando se registró el cliente
     *   - updatedAt: Fecha de la última modificación de sus datos
     *
     * UTILIDAD:
     * Podemos saber desde cuándo es cliente y cuándo actualizó sus datos.
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
 * Los índices permiten buscar clientes más rápidamente en la base de datos.
 */

/**
 * Índice por EMAIL
 * - Acelera las búsquedas de clientes por email
 * - Útil cuando el cliente hace login o cuando buscamos su historial
 */
esquemaDeCliente.index({ email: 1 });

/**
 * Índice por TELÉFONO
 * - Acelera las búsquedas de clientes por teléfono
 * - Útil cuando el administrador busca un cliente para asignarle un turno
 * - También evita duplicados accidentales de clientes con el mismo teléfono
 */
esquemaDeCliente.index({ telefono: 1 });

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
 * Combina automáticamente el nombre y apellido del cliente.
 *
 * EJEMPLO:
 * Si nombre = "María" y apellido = "González"
 * Entonces nombreCompleto = "María González"
 *
 * CÓMO SE USA:
 * const nombreCompleto = cliente.nombreCompleto;
 *
 * DÓNDE SE USA:
 * - En emails de confirmación de turnos
 * - En listas de turnos del panel de administración
 * - En cualquier lugar donde mostramos el nombre del cliente
 *
 * POR QUÉ ES VIRTUAL:
 * No necesitamos guardar el nombre completo en la BD porque podemos
 * calcularlo fácilmente cuando lo necesitamos.
 */
esquemaDeCliente.virtual('nombreCompleto').get(function () {
  return `${this.nombre} ${this.apellido}`;
});

/**
 * ============================================================================
 * CONFIGURACIÓN DE SERIALIZACIÓN
 * ============================================================================
 *
 * Estas configuraciones determinan cómo se convierten los clientes
 * cuando los enviamos como respuesta JSON o los convertimos a objetos.
 */

/**
 * Incluir campos virtuales al convertir a JSON
 * - Cuando enviamos un cliente en una respuesta de API, incluye 'nombreCompleto'
 */
esquemaDeCliente.set('toJSON', { virtuals: true });

/**
 * Incluir campos virtuales al convertir a Objeto
 * - Cuando convertimos un cliente a objeto JavaScript, incluye 'nombreCompleto'
 */
esquemaDeCliente.set('toObject', { virtuals: true });

/**
 * ============================================================================
 * CREAR Y EXPORTAR EL MODELO
 * ============================================================================
 *
 * Creamos el modelo 'Cliente' basado en el esquema que definimos arriba.
 * Este modelo se usa en toda la aplicación para crear, buscar, actualizar
 * y eliminar clientes.
 */
const Cliente = mongoose.model('Cliente', esquemaDeCliente);

export default Cliente;
