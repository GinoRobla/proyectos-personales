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
    throw new Error('Por favor completa todos los campos: nombre, apellido, email, teléfono y contraseña');
  }

  // Validar formato de email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('El formato del email no es válido');
  }

  // Validar longitud mínima de contraseña
  if (password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }

  const usuarioExistente = await Usuario.findOne({ email });
  if (usuarioExistente) {
    throw new Error('Este email ya está registrado. Intenta con otro o inicia sesión');
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
  console.log('[LOGIN] Intento de login con email:', email);

  if (!email || !password) {
    console.log('[LOGIN] Error: Email o contraseña vacíos');
    throw new Error('Email y contraseña son obligatorios');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.log('[LOGIN] Error: Formato de email inválido');
    throw new Error('Formato de email inválido');
  }

  const usuario = await Usuario.findOne({ email }).select('+password');
  console.log('[LOGIN] Usuario encontrado:', usuario ? `ID: ${usuario._id}, Rol: ${usuario.rol}, Activo: ${usuario.activo}` : 'No encontrado');

  if (!usuario) {
    console.log('[LOGIN] Error: Usuario no encontrado en la base de datos');
    throw new Error('El email ingresado no está registrado. Verifica o crea una cuenta');
  }

  const passwordValida = await usuario.compararPassword(password);
  console.log('[LOGIN] Contraseña válida:', passwordValida);

  if (!passwordValida) {
    console.log('[LOGIN] Error: Contraseña incorrecta');
    throw new Error('Contraseña incorrecta. Por favor verifica e intenta de nuevo');
  }

  if (!usuario.activo) {
    console.log('[LOGIN] Error: Usuario desactivado');
    throw new Error('Tu cuenta está desactivada. Contacta al administrador');
  }

  usuario.ultimoLogin = new Date();
  await usuario.save();

  const token = generarToken(usuario._id, usuario.rol);
  const usuarioInfo = usuario.toJSON();

  console.log('[LOGIN] Login exitoso para usuario:', usuario.email, 'Rol:', usuario.rol);
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
    throw new Error('Debes ingresar la contraseña actual y la nueva contraseña');
  }

  if (passNueva.length < 6) {
    throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
  }

  const usuario = await Usuario.findById(usuarioId).select('+password');

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  if (!(await usuario.compararPassword(passActual))) {
    throw new Error('La contraseña actual es incorrecta. Verifica e intenta de nuevo');
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
