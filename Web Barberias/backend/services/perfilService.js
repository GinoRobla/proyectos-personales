// Importa los modelos necesarios
import Usuario from '../models/Usuario.js';
import Cliente from '../models/Cliente.js';
import Barbero from '../models/Barbero.js';

/**
 * -------------------------------------------------------------------
 * SERVICIOS EXPORTADOS
 * -------------------------------------------------------------------
 */

/**
 * Obtener perfil de usuario
 * Busca un usuario por su ID y lo devuelve sin la contraseña.
 */
export const obtenerPerfil = async (usuarioId) => {
  try {
    // Busca al usuario por ID
    // .select('-password') le dice a Mongoose que EXCLUYA el campo 'password'
    const usuario = await Usuario.findById(usuarioId).select('-password');

    // Si no se encuentra, lanza un error
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Convertir a objeto plano para poder agregar campos
    const usuarioObj = usuario.toObject();

    // Si es cliente, buscar el campo telefonoVerificado en Cliente
    if (usuario.rol === 'cliente') {
      const cliente = await Cliente.findOne({ usuario: usuarioId });
      if (cliente) {
        usuarioObj.telefonoVerificado = cliente.telefonoVerificado || false;
      }
    }

    // Si es barbero, buscar el campo telefonoVerificado en Barbero
    if (usuario.rol === 'barbero') {
      const barbero = await Barbero.findOne({ usuario: usuarioId });
      if (barbero) {
        usuarioObj.telefonoVerificado = barbero.telefonoVerificado || false;
      }
    }

    // Devuelve el usuario con telefonoVerificado incluido
    return usuarioObj;
  } catch (error) {
    throw new Error(`Error al obtener perfil: ${error.message}`);
  }
};

/**
 * Actualizar perfil de usuario
 * Modifica los datos de un usuario y también de su rol (Cliente/Barbero)
 */
export const actualizarPerfil = async (usuarioId, datos) => {
  try {
    // Desestructura los datos que se pueden actualizar
    const { nombre, apellido, telefono, email, foto } = datos;

    // 1. Verificar que el usuario existe
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // 2. Lógica de validación de Email
    // Si el email es nuevo Y es diferente al que ya tenía...
    if (email && email !== usuario.email) {
      // ...busca si otro usuario (con distinto ID) ya está usando ese email
      const emailExiste = await Usuario.findOne({
        email,
        _id: { $ne: usuarioId }, // $ne = "not equal" (no igual)
      });
      if (emailExiste) {
        throw new Error('El email ya está en uso por otro usuario');
      }
    }

    // 3. Construir el objeto de actualización para el 'Usuario'
    // Se añaden solo los campos que SÍ vinieron en 'datos'
    const datosActualizar = {};
    if (nombre) datosActualizar.nombre = nombre;
    if (apellido) datosActualizar.apellido = apellido;
    if (telefono) datosActualizar.telefono = telefono;
    if (email) datosActualizar.email = email;
    if (foto) datosActualizar.foto = foto;

    // 4. Actualizar el 'Usuario' en la base de datos
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      usuarioId, // A quién actualizar
      datosActualizar, // Con qué datos
      { new: true, runValidators: true } // Opciones:
      // new: true => Devuelve el documento ya actualizado
      // runValidators: true => Fuerza a que corran las validaciones del Schema
    ).select('-password'); // Sigue sin devolver el password

    // 5. [FIX] Actualizar la colección 'Cliente' o 'Barbero' (si es necesario)
    // Creamos un objeto solo con los datos que comparten (nombre, apellido, tel)
    const datosRelacionados = {};
    if (nombre) datosRelacionados.nombre = nombre;
    if (apellido) datosRelacionados.apellido = apellido;
    if (telefono) datosRelacionados.telefono = telefono;

    // Solo si el usuario es 'cliente' Y hay datos para actualizar
    if (usuario.rol === 'cliente' && Object.keys(datosRelacionados).length > 0) {
      await Cliente.findOneAndUpdate(
        { usuario: usuarioId }, // Filtro: buscar por el ID de usuario
        { $set: datosRelacionados } // $set: actualiza solo estos campos, no borra el resto
      );
    }

    // Solo si el usuario es 'barbero' Y hay datos para actualizar
    if (usuario.rol === 'barbero' && Object.keys(datosRelacionados).length > 0) {
      await Barbero.findOneAndUpdate(
        { usuario: usuarioId }, // Filtro: buscar por el ID de usuario
        { $set: datosRelacionados } // $set: actualiza solo estos campos
      );
    }

    // 6. Devolver el usuario principal actualizado
    return usuarioActualizado;
  } catch (error) {
    throw new Error(`Error al actualizar perfil: ${error.message}`);
  }
};

/**
 * Cambiar contraseña
 */
export const cambiarPassword = async (
  usuarioId,
  passwordActual,
  passwordNuevo
) => {
  try {
    // 1. Obtener usuario CON la contraseña
    // .select('+password') FUERZA a que Mongoose INCLUYA el password
    const usuario = await Usuario.findById(usuarioId).select('+password');

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // 2. Verificar password actual
    // (Esta función 'compararPassword' debe estar en tu Modelo de Usuario)
    const passwordCorrecto = await usuario.compararPassword(passwordActual);
    if (!passwordCorrecto) {
      throw new Error('La contraseña actual es incorrecta');
    }

    // 3. Actualizar password
    // Asignamos el nuevo password (en texto plano)
    usuario.password = passwordNuevo;
    
    // 4. Guardar
    // Usamos .save() (y NO findByIdAndUpdate) para que se ejecute el 'hook'
    // (pre-save) del modelo que hashea (encripta) la contraseña antes de guardarla.
    await usuario.save();

    return { message: 'Contraseña actualizada correctamente' };
  } catch (error) {
    throw new Error(`Error al cambiar contraseña: ${error.message}`);
  }
};