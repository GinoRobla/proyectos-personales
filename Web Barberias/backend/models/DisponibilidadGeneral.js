/**
 * Modelo de Disponibilidad General.
 * Define los horarios generales de apertura de la barbería por día de la semana.
 */

import mongoose from 'mongoose';

const disponibilidadGeneralSchema = new mongoose.Schema(
  {
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

// Índice único: solo un registro activo por día de la semana
disponibilidadGeneralSchema.index(
  { diaSemana: 1 },
  {
    unique: true,
    partialFilterExpression: { activo: true },
  }
);

// Validación personalizada: la hora de fin debe ser mayor que la hora de inicio
disponibilidadGeneralSchema.pre('save', function (next) {
  if (this.horaInicio >= this.horaFin) {
    next(new Error('La hora de fin debe ser posterior a la hora de inicio'));
  } else {
    next();
  }
});

// Campo virtual para obtener el nombre del día
disponibilidadGeneralSchema.virtual('diaNombre').get(function () {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[this.diaSemana];
});

disponibilidadGeneralSchema.set('toJSON', { virtuals: true });
disponibilidadGeneralSchema.set('toObject', { virtuals: true });

export default mongoose.model('DisponibilidadGeneral', disponibilidadGeneralSchema);
