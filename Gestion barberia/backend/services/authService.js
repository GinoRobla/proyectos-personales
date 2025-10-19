import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';
import Barbero from '../models/Barbero.js';
import dotenv from 'dotenv';

dotenv.config();

// Genera un token JWT para un usuario.
const generarToken = (usuarioId, rol) => {
  return jwt.sign({ id: usuarioId, rol }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION || '7d',
  });
};

// Verifica la validez de un token JWT.
export const verificarToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};

// Registra un nuevo usuario en el sistema.
export const registrar = async (datosUsuario) => {
  const { nombre, apellido, email, password, telefono, rol = 'cliente', foto } = datosUsuario;

  if (!nombre || !apellido || !email || !password || !telefono) {
    throw new Error('Faltan campos obligatorios');
  }

  const usuarioExistente = await Usuario.findOne({ email });
  if (usuarioExistente) {
    throw new Error('El email ya está registrado');
  }

  const nuevoUsuario = new Usuario({
    nombre,
    apellido,
    email,
    password,
    telefono,
    rol,
    foto,
  });

  await nuevoUsuario.save();

  const token = generarToken(nuevoUsuario._id, nuevoUsuario.rol);
  const usuario = nuevoUsuario.toJSON();

  return { usuario, token };
};

// Autentica a un usuario y devuelve sus datos con un token JWT.
export const login = async (email, password) => {
  if (!email || !password) {
    throw new Error('Email y contraseña son obligatorios');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Formato de email inválido');
  }

  const usuario = await Usuario.findOne({ email }).select('+password');

  if (!usuario || !(await usuario.compararPassword(password))) {
    throw new Error('Credenciales incorrectas');
  }

  if (!usuario.activo) {
    throw new Error('Usuario desactivado. Contacte al administrador');
  }

  usuario.ultimoLogin = new Date();
  await usuario.save();

  const token = generarToken(usuario._id, usuario.rol);
  const usuarioInfo = usuario.toJSON();

  return { usuario: usuarioInfo, token };
};

// Obtiene un usuario por su ID, incluyendo datos de barbero si aplica.
export const obtenerUsuarioPorId = async (usuarioId) => {
  const usuario = await Usuario.findById(usuarioId).populate('barberoAsociado');

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  return usuario;
};

// Actualiza el perfil de un usuario.
export const actualizarPerfil = async (usuarioId, datos) => {
  const { nombre, apellido, telefono, foto } = datos;

  const usuario = await Usuario.findById(usuarioId);

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  // Actualizar solo los campos proporcionados
  if (nombre) usuario.nombre = nombre;
  if (apellido) usuario.apellido = apellido;
  if (telefono) usuario.telefono = telefono;
  if (foto) usuario.foto = foto;

  await usuario.save();

  // Actualizar también el perfil relacionado (Cliente o Barbero)
  const Model = usuario.rol === 'cliente' ? (await import('../models/Cliente.js')).default : Barbero;
  const perfil = await Model.findOne({ usuario: usuarioId });

  if (perfil) {
    if (nombre) perfil.nombre = nombre;
    if (apellido) perfil.apellido = apellido;
    if (telefono) perfil.telefono = telefono;
    await perfil.save();
  }

  return usuario;
};

// Cambia la contraseña de un usuario de forma segura.
export const cambiarPassword = async (usuarioId, passActual, passNueva) => {
  if (!passActual || !passNueva) {
    throw new Error('Las contraseñas actual y nueva son obligatorias');
  }

  const usuario = await Usuario.findById(usuarioId).select('+password');

  if (!usuario || !(await usuario.compararPassword(passActual))) {
    throw new Error('La contraseña actual es incorrecta');
  }

  usuario.password = passNueva;
  await usuario.save();

  return { message: 'Contraseña actualizada exitosamente' };
};

// Asocia un perfil de barbero a una cuenta de usuario.
export const asociarBarbero = async (usuarioId, barberoId) => {
  const [usuario, barbero] = await Promise.all([
    Usuario.findById(usuarioId),
    Barbero.findById(barberoId),
  ]);

  if (!usuario) throw new Error('Usuario no encontrado');
  if (!barbero) throw new Error('Barbero no encontrado');

  if (usuario.rol !== 'barbero') {
    throw new Error('El usuario debe tener rol de barbero');
  }

  usuario.barberoAsociado = barberoId;
  await usuario.save();

  return usuario;
};
