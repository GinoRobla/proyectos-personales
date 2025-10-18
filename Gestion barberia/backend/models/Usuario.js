import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const esquemaDeUsuario = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  apellido: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  telefono: {
    type: String,
    required: true
  },
  rol: {
    type: String,
    enum: ['cliente', 'barbero', 'admin'],
    default: 'cliente'
  },
  foto: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  activo: {
    type: Boolean,
    default: true
  },
  ultimoLogin: {
    type: Date
  },
  barberoAsociado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barbero'
  }
}, {
  timestamps: true
});

// Middleware: Encriptar password antes de guardar
esquemaDeUsuario.pre('save', async function(next) {
  // Solo encriptar si el password fue modificado
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método: Comparar password
esquemaDeUsuario.methods.compararPassword = async function(passwordIngresado) {
  return await bcrypt.compare(passwordIngresado, this.password);
};

// Campo virtual para nombre completo
esquemaDeUsuario.virtual('nombreCompleto').get(function () {
  return `${this.nombre} ${this.apellido}`;
});

// Nuevo campo virtual: descripción del rol
esquemaDeUsuario.virtual('rolDescripcion').get(function () {
  switch (this.rol) {
    case 'cliente':
      return 'Cliente';
    case 'barbero':
      return 'Barbero';
    case 'admin':
      return 'Administrador';
    default:
      return 'Desconocido';
  }
});

// Incluir virtuales al convertir a JSON u objetos
esquemaDeUsuario.set('toJSON', { virtuals: true });
esquemaDeUsuario.set('toObject', { virtuals: true });

const Usuario = mongoose.model('Usuario', esquemaDeUsuario);

export default Usuario;
