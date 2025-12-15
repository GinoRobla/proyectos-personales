/**
 * Modelo de Pago.
 * Gestiona las señas y pagos de turnos con MercadoPago.
 */

import mongoose from 'mongoose';

const pagoSchema = new mongoose.Schema(
  {
    turno: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Turno',
      required: [true, 'El turno es obligatorio'],
    },
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente',
      required: [true, 'El cliente es obligatorio'],
    },
    monto: {
      type: Number,
      required: [true, 'El monto de la seña es obligatorio'],
      min: [0, 'El monto no puede ser negativo'],
    },
    montoTotal: {
      type: Number,
      required: [true, 'El monto total del servicio es obligatorio'],
      min: [0, 'El monto total no puede ser negativo'],
    },
    porcentajeSena: {
      type: Number,
      required: [true, 'El porcentaje de seña es obligatorio'],
      min: [10, 'El porcentaje mínimo es 10%'],
      max: [100, 'El porcentaje máximo es 100%'],
    },
    estado: {
      type: String,
      enum: ['pendiente', 'aprobado', 'rechazado', 'devuelto', 'expirado'],
      default: 'pendiente',
    },
    metodoPago: {
      type: String,
      default: 'mercadopago',
    },

    // Datos de MercadoPago
    preferenciaId: {
      type: String,
      default: null,
    },
    pagoId: {
      type: String,
      default: null,
    },
    estadoMP: {
      type: String,
      default: null,
    },
    urlPago: {
      type: String,
      default: null,
    },

    // Metadatos de gestión
    fechaPago: {
      type: Date,
      default: null,
    },
    aplicado: {
      type: Boolean,
      default: false,
      description: 'Indica si la seña fue descontada del total al completar el turno',
    },
    devuelto: {
      type: Boolean,
      default: false,
      description: 'Indica si la seña fue devuelta al cliente',
    },
    motivoDevolucion: {
      type: String,
      default: null,
    },
    fechaExpiracion: {
      type: Date,
      default: null,
      description: 'Fecha límite para realizar el pago',
    },
  },
  { timestamps: true, versionKey: false }
);

// Índices para optimizar consultas
pagoSchema.index({ turno: 1 });
pagoSchema.index({ cliente: 1 });
pagoSchema.index({ estado: 1 });
pagoSchema.index({ preferenciaId: 1 });
pagoSchema.index({ pagoId: 1 });
pagoSchema.index({ createdAt: 1 });

// Campo virtual para calcular el monto restante a pagar
pagoSchema.virtual('montoRestante').get(function () {
  if (this.aplicado) {
    return 0;
  }
  return this.montoTotal - this.monto;
});

pagoSchema.set('toJSON', { virtuals: true });
pagoSchema.set('toObject', { virtuals: true });

export default mongoose.model('Pago', pagoSchema);
