import mongoose from 'mongoose';
import crypto from 'crypto';

const tokenRecuperacionSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiracion: {
    type: Date,
    required: true,
    index: true
  },
  usado: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Índice compuesto para optimizar búsquedas
tokenRecuperacionSchema.index({ token: 1, usado: 1, expiracion: 1 });

// Método estático para generar token único
tokenRecuperacionSchema.statics.generarToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Método para verificar si el token está expirado
tokenRecuperacionSchema.methods.estaExpirado = function() {
  return new Date() > this.expiracion;
};

// Eliminar automáticamente tokens expirados después de 24 horas
tokenRecuperacionSchema.index({ expiracion: 1 }, {
  expireAfterSeconds: 86400 // 24 horas
});

const TokenRecuperacion = mongoose.model('TokenRecuperacion', tokenRecuperacionSchema);

export default TokenRecuperacion;