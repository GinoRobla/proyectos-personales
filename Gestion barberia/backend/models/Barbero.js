/**
 * Modelo de Barbero.
 * Información de barberos y sus objetivos mensuales.
 */

import mongoose from 'mongoose';

const barberoSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, unique: true },
    nombre: { type: String, trim: true, required: true },
    apellido: { type: String, trim: true, required: true },
    email: { type: String, trim: true, lowercase: true, unique: true, required: true },
    telefono: { type: String, trim: true, required: true },
    foto: { type: String, trim: true },
    activo: { type: Boolean, default: true },
    objetivoMensual: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

barberoSchema.virtual('nombreCompleto').get(function () {
  return `${this.nombre} ${this.apellido}`;
});

barberoSchema.set('toJSON', { virtuals: true });
barberoSchema.set('toObject', { virtuals: true });

export default mongoose.model('Barbero', barberoSchema);
