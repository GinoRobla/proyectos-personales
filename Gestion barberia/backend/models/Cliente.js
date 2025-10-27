/**
 * Modelo de Cliente.
 * Información de clientes de la barbería.
 */

import mongoose from 'mongoose';
import { validarTelefonoArgentino } from '../utils/phoneValidator.js';

const clienteSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, unique: true },
    nombre: { type: String, required: true, trim: true },
    apellido: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
    },
    telefono: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (telefono) {
          const resultado = validarTelefonoArgentino(telefono);
          return resultado.valido;
        },
        message: (props) => {
          const resultado = validarTelefonoArgentino(props.value);
          return resultado.error || 'Número de teléfono inválido';
        },
      },
    },
    telefonoVerificado: { type: Boolean, default: false },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

clienteSchema.index({ email: 1 });
clienteSchema.index({ telefono: 1 });

clienteSchema.virtual('nombreCompleto').get(function () {
  return `${this.nombre} ${this.apellido}`;
});

clienteSchema.set('toJSON', { virtuals: true });
clienteSchema.set('toObject', { virtuals: true });

export default mongoose.model('Cliente', clienteSchema);
