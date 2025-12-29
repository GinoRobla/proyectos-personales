/**
 * Modelo de Turno.
 * Reservas y citas de la barbería.
 */

import mongoose from 'mongoose';

const turnoSchema = new mongoose.Schema(
  {
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: [true, 'El cliente es obligatorio'] },
    barbero: { type: mongoose.Schema.Types.ObjectId, ref: 'Barbero', default: null },
    servicio: { type: mongoose.Schema.Types.ObjectId, ref: 'Servicio', required: [true, 'El servicio es obligatorio'] },
    fecha: { type: Date, required: [true, 'La fecha es obligatoria'] },
    hora: {
      type: String,
      required: [true, 'La hora es obligatoria'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'],
    },
    estado: {
      type: String,
      enum: ['pendiente', 'reservado', 'completado', 'cancelado'],
      default: 'reservado',
    },
    precio: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    recordatorioEnviado: { type: Boolean, default: false },
    recordatorioPagoEnviado: { type: Boolean, default: false },

    // Campos para sistema de señas
    requiereSena: {
      type: Boolean,
      default: false,
      description: 'Indica si este turno requiere pago de seña',
    },
    pago: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pago',
      default: null,
      description: 'Referencia al pago/seña asociado',
    },
    senaPagada: {
      type: Boolean,
      default: false,
      description: 'Indica si la seña fue pagada exitosamente',
    },
    estadoPago: {
      type: String,
      enum: ['sin_sena', 'pendiente', 'pagada', 'aplicada', 'retenida'],
      default: 'sin_sena',
      description: 'Estado del pago: sin_sena (no requiere), pendiente (esperando pago), pagada (seña pagada), aplicada (descontada al completar), retenida (cliente no asistió)',
    },
    fechaExpiracion: {
      type: Date,
      default: null,
      description: 'Fecha de expiración para turnos pendientes (si no pagan a tiempo, se cancelan)',
    },

    // Token de cancelación pública
    tokenCancelacion: {
      type: String,
      default: function() {
        return require('crypto').randomBytes(32).toString('hex');
      },
      description: 'Token único para permitir cancelación sin autenticación',
    },
  },
  { timestamps: true, versionKey: false }
);

// Índices para optimizar consultas
turnoSchema.index({ fecha: 1, hora: 1 });
turnoSchema.index({ barbero: 1, fecha: 1 });
turnoSchema.index({ cliente: 1 });
turnoSchema.index({ estado: 1 });
turnoSchema.index({ recordatorioEnviado: 1, fecha: 1, hora: 1 });
turnoSchema.index(
  { barbero: 1, fecha: 1, hora: 1 },
  {
    unique: true,
    partialFilterExpression: { estado: { $in: ['pendiente', 'reservado'] }, barbero: { $ne: null } },
  }
);

// Campos virtuales
turnoSchema.virtual('clienteNombre').get(function () {
  if (this.populated('cliente') && this.cliente) {
    return `${this.cliente.nombre} ${this.cliente.apellido}`;
  }
  return null;
});

turnoSchema.virtual('barberoNombre').get(function () {
  if (this.populated('barbero') && this.barbero) {
    return `${this.barbero.nombre} ${this.barbero.apellido}`;
  }
  return null;
});

turnoSchema.set('toJSON', { virtuals: true });
turnoSchema.set('toObject', { virtuals: true });

export default mongoose.model('Turno', turnoSchema);
