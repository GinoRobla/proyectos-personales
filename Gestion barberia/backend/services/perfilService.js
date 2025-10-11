import Usuario from '../models/Usuario.js';

/**
 * Servicio de Perfil
 * Maneja la lógica de negocio para el perfil de usuario
 */

/**
 * Obtener perfil de usuario
 */
export const obtenerPerfil = async (usuarioId) => {
  try {
    const usuario = await Usuario.findById(usuarioId).select('-password');

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    return usuario;
  } catch (error) {
    throw new Error(`Error al obtener perfil: ${error.message}`);
  }
};

/**
 * Actualizar perfil de usuario
 */
export const actualizarPerfil = async (usuarioId, datos) => {
  try {
    const { nombre, apellido, telefono, email, foto } = datos;

    // Verificar que el usuario existe
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Si se intenta cambiar el email, verificar que no esté en uso
    if (email && email !== usuario.email) {
      const emailExiste = await Usuario.findOne({ email, _id: { $ne: usuarioId } });
      if (emailExiste) {
        throw new Error('El email ya está en uso por otro usuario');
      }
    }

    // Actualizar solo los campos proporcionados
    const datosActualizar = {};
    if (nombre) datosActualizar.nombre = nombre;
    if (apellido) datosActualizar.apellido = apellido;
    if (telefono) datosActualizar.telefono = telefono;
    if (email) datosActualizar.email = email;
    if (foto) datosActualizar.foto = foto;

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      usuarioId,
      datosActualizar,
      { new: true, runValidators: true }
    ).select('-password');

    return usuarioActualizado;
  } catch (error) {
    throw new Error(`Error al actualizar perfil: ${error.message}`);
  }
};

/**
 * Cambiar contraseña
 */
export const cambiarPassword = async (usuarioId, passwordActual, passwordNuevo) => {
  try {
    // Obtener usuario con password
    const usuario = await Usuario.findById(usuarioId).select('+password');

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar password actual
    const passwordCorrecto = await usuario.compararPassword(passwordActual);
    if (!passwordCorrecto) {
      throw new Error('La contraseña actual es incorrecta');
    }

    // Actualizar password
    usuario.password = passwordNuevo;
    await usuario.save();

    return { message: 'Contraseña actualizada correctamente' };
  } catch (error) {
    throw new Error(`Error al cambiar contraseña: ${error.message}`);
  }
};

export default {
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
};
