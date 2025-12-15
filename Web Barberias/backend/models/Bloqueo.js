/**
 * Modelo de Bloqueo.
 * Define excepciones y bloqueos de horarios:
 * - Bloqueos generales (feriados, cierre temporal de la barbería)
 * - Bloqueos por barbero (vacaciones, ausencias, descansos)
 * - Puede ser por día completo o por rango de horas
 */

import mongoose from 'mongoose';

const bloqueoSchema = new mongoose.Schema(
  {
    barbero: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Barbero',
      default: null,
      // null = bloqueo general para toda la barbería
    },
    fechaInicio: {
      type: Date,
      required: [true, 'La fecha de inicio es obligatoria'],
    },
    fechaFin: {
      type: Date,
      required: [true, 'La fecha de fin es obligatoria'],
    },
    horaInicio: {
      type: String,
      default: null,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'],
      // null = bloqueo de día completo
    },
    horaFin: {
      type: String,
      default: null,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'],
      // null = bloqueo de día completo
    },
    tipo: {
      type: String,
      enum: ['DIA_COMPLETO', 'RANGO_HORAS'],
      required: [true, 'El tipo de bloqueo es obligatorio'],
    },
    motivo: {
      type: String,
      required: [true, 'El motivo del bloqueo es obligatorio'],
      maxlength: [200, 'El motivo no puede exceder 200 caracteres'],
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// Índices para optimizar búsquedas
bloqueoSchema.index({ fechaInicio: 1, fechaFin: 1 });
bloqueoSchema.index({ barbero: 1, fechaInicio: 1 });
bloqueoSchema.index({ activo: 1, fechaInicio: 1 });

// Validación: fechaFin debe ser mayor o igual a fechaInicio
bloqueoSchema.pre('save', function (next) {
  if (this.fechaFin < this.fechaInicio) {
    return next(new Error('La fecha de fin debe ser posterior o igual a la fecha de inicio'));
  }

  // Si es RANGO_HORAS, horaInicio y horaFin son obligatorias
  if (this.tipo === 'RANGO_HORAS') {
    if (!this.horaInicio || !this.horaFin) {
      return next(new Error('Para bloqueos de rango de horas, debe especificar hora de inicio y fin'));
    }
    if (this.horaInicio >= this.horaFin) {
      return next(new Error('La hora de fin debe ser posterior a la hora de inicio'));
    }
  }

  // Si es DIA_COMPLETO, horaInicio y horaFin deben ser null
  if (this.tipo === 'DIA_COMPLETO') {
    this.horaInicio = null;
    this.horaFin = null;
  }

  next();
});

// Campo virtual para saber si es un bloqueo general o por barbero
bloqueoSchema.virtual('esGeneral').get(function () {
  return this.barbero === null;
});

// Campo virtual para obtener el nombre del barbero (cuando esté populado)
bloqueoSchema.virtual('barberoNombre').get(function () {
  if (this.populated('barbero') && this.barbero) {
    return `${this.barbero.nombre} ${this.barbero.apellido}`;
  }
  return this.barbero === null ? 'Bloqueo General' : null;
});

bloqueoSchema.set('toJSON', { virtuals: true });
bloqueoSchema.set('toObject', { virtuals: true });

export default mongoose.model('Bloqueo', bloqueoSchema);
