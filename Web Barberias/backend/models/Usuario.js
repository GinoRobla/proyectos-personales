/**
 * Modelo de Usuario.
 * Maneja autenticación, roles y datos básicos de usuarios.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { validarTelefonoArgentino } from '../utils/phoneValidator.js';

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    telefono: {
      type: String,
      required: true,
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
    rol: {
      type: String,
      enum: ['cliente', 'barbero', 'admin'],
      default: 'cliente',
    },
    foto: { type: String, default: 'https://via.placeholder.com/150' },
    activo: { type: Boolean, default: true },
    ultimoLogin: { type: Date },
    barberoAsociado: { type: mongoose.Schema.Types.ObjectId, ref: 'Barbero' },
    // Campos para OAuth (Google, Facebook, etc.)
    proveedor: { type: String, enum: ['local', 'google', 'facebook'], default: 'local' },
    googleId: { type: String, sparse: true, unique: true },
  },
  { timestamps: true }
);

// Encriptar password antes de guardar
usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
usuarioSchema.methods.compararPassword = async function (passwordIngresado) {
  // Validar que la contraseña almacenada existe
  if (!this.password) {
    throw new Error('Usuario sin contraseña configurada. Contacta al administrador.');
  }
  return await bcrypt.compare(passwordIngresado, this.password);
};

// Campos virtuales
usuarioSchema.virtual('nombreCompleto').get(function () {
  return `${this.nombre} ${this.apellido}`;
});

usuarioSchema.virtual('rolDescripcion').get(function () {
  const roles = { cliente: 'Cliente', barbero: 'Barbero', admin: 'Administrador' };
  return roles[this.rol] || 'Desconocido';
});

usuarioSchema.set('toJSON', { virtuals: true });
usuarioSchema.set('toObject', { virtuals: true });

export default mongoose.model('Usuario', usuarioSchema);
