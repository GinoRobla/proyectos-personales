import mongoose from 'mongoose';

const esquemaDeTurno = new mongoose.Schema(
  {
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente',
      required: [true, 'El cliente es obligatorio'],
    },
    barbero: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Barbero',
      default: null,
    },
    servicio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Servicio',
      required: [true, 'El servicio es obligatorio'],
    },
    fecha: {
      type: Date,
      required: [true, 'La fecha es obligatoria'],
    },
    hora: {
      type: String,
      required: [true, 'La hora es obligatoria'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'],
    },
    estado: {
      type: String,
      enum: ['reservado', 'completado', 'cancelado'],
      default: 'reservado',
    },
    precio: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    recordatorioEnviado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ===== ÍNDICES =====
esquemaDeTurno.index({ fecha: 1, hora: 1 });
esquemaDeTurno.index({ barbero: 1, fecha: 1 });
esquemaDeTurno.index({ cliente: 1 });
esquemaDeTurno.index({ estado: 1 });
esquemaDeTurno.index({ recordatorioEnviado: 1, fecha: 1, hora: 1 });
esquemaDeTurno.index(
  { barbero: 1, fecha: 1, hora: 1 },
  {
    unique: true,
    partialFilterExpression: {
      estado: 'reservado',
      barbero: { $ne: null },
    },
  }
);

// ===== CAMPOS VIRTUALES =====
esquemaDeTurno.virtual('clienteNombre').get(function () {
  if (this.populated('cliente') && this.cliente) {
    return `${this.cliente.nombre} ${this.cliente.apellido}`;
  }
  return null;
});

esquemaDeTurno.virtual('barberoNombre').get(function () {
  if (this.populated('barbero') && this.barbero) {
    return `${this.barbero.nombre} ${this.barbero.apellido}`;
  }
  return null;
});

// Incluir virtuales en JSON y objetos
esquemaDeTurno.set('toJSON', { virtuals: true });
esquemaDeTurno.set('toObject', { virtuals: true });

const Turno = mongoose.model('Turno', esquemaDeTurno);

export default Turno;
