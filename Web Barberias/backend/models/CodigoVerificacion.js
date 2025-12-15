/**
 * Modelo de Código de Verificación de Teléfono
 * Almacena códigos temporales para verificar números de teléfono
 */

import mongoose from 'mongoose';

const codigoVerificacionSchema = new mongoose.Schema(
  {
    telefono: {
      type: String,
      required: true,
      index: true,
    },
    codigo: {
      type: String,
      required: true,
    },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: false, // Puede ser null para usuarios no registrados
    },
    intentos: {
      type: Number,
      default: 0,
      max: 3, // Máximo 3 intentos
    },
    verificado: {
      type: Boolean,
      default: false,
    },
    expiraEn: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para buscar por teléfono y expiración
codigoVerificacionSchema.index({ telefono: 1, expiraEn: 1 });

// Método para verificar si el código expiró
codigoVerificacionSchema.methods.estaExpirado = function () {
  return new Date() > this.expiraEn;
};

// Método para verificar si se excedieron los intentos
codigoVerificacionSchema.methods.excedioIntentos = function () {
  return this.intentos >= 3;
};

const CodigoVerificacion = mongoose.model('CodigoVerificacion', codigoVerificacionSchema);

export default CodigoVerificacion;
