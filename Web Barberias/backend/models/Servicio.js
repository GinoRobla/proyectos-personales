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
    activo: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

servicioSchema.index({ nombre: 1 });
servicioSchema.index({ activo: 1 });

export default mongoose.model('Servicio', servicioSchema);
