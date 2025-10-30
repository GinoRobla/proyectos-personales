/**
 * Modelo de Servicio.
 * Servicios ofrecidos por la barbería (cortes, afeitado, etc.).
 */

import mongoose from 'mongoose';

const servicioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del servicio es obligatorio'],
      trim: true,
      unique: true,
    },
    descripcion: { type: String, default: '' },
    precioBase: {
      type: Number,
      required: [true, 'El precio base es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    duracion: {
      type: Number,
      required: [true, 'La duración es obligatoria'],
      min: [15, 'La duración mínima es 15 minutos'],
      max: [240, 'La duración máxima es 240 minutos'],
    },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

servicioSchema.index({ nombre: 1 });
servicioSchema.index({ activo: 1 });

export default mongoose.model('Servicio', servicioSchema);
