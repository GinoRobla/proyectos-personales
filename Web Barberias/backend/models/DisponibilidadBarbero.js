/**
 * Modelo de Disponibilidad por Barbero.
 * Define los horarios específicos de cada barbero por día de la semana.
 * Estos horarios tienen prioridad sobre los horarios generales.
 */

import mongoose from 'mongoose';

const disponibilidadBarberoSchema = new mongoose.Schema(
  {
    barbero: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Barbero',
      required: [true, 'El barbero es obligatorio'],
    },
    diaSemana: {
      type: Number,
      required: [true, 'El día de la semana es obligatorio'],
      min: [0, 'El día debe estar entre 0 (Domingo) y 6 (Sábado)'],
      max: [6, 'El día debe estar entre 0 (Domingo) y 6 (Sábado)'],
      validate: {
        validator: Number.isInteger,
        message: 'El día de la semana debe ser un número entero',
      },
    },
    horaInicio: {
      type: String,
      required: [true, 'La hora de inicio es obligatoria'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'],
    },
    horaFin: {
      type: String,
      required: [true, 'La hora de fin es obligatoria'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'],
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// Índice único: solo un registro activo por barbero y día de la semana
disponibilidadBarberoSchema.index(
  { barbero: 1, diaSemana: 1 },
  {
    unique: true,
    partialFilterExpression: { activo: true },
  }
);

// Índice para búsquedas rápidas por barbero
disponibilidadBarberoSchema.index({ barbero: 1, activo: 1 });

// Validación personalizada: la hora de fin debe ser mayor que la hora de inicio
disponibilidadBarberoSchema.pre('save', function (next) {
  if (this.horaInicio >= this.horaFin) {
    next(new Error('La hora de fin debe ser posterior a la hora de inicio'));
  } else {
    next();
  }
});

// Campo virtual para obtener el nombre del día
disponibilidadBarberoSchema.virtual('diaNombre').get(function () {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[this.diaSemana];
});

// Campo virtual para obtener el nombre del barbero (cuando esté populado)
disponibilidadBarberoSchema.virtual('barberoNombre').get(function () {
  if (this.populated('barbero') && this.barbero) {
    return `${this.barbero.nombre} ${this.barbero.apellido}`;
  }
  return null;
});

disponibilidadBarberoSchema.set('toJSON', { virtuals: true });
disponibilidadBarberoSchema.set('toObject', { virtuals: true });

export default mongoose.model('DisponibilidadBarbero', disponibilidadBarberoSchema);