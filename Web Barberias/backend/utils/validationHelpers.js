/**
 * Helpers de validación reutilizables
 * Funciones comunes para validar datos en validators
 */

/**
 * Valida que una fecha no esté en el pasado
 * @param {string} value - Fecha en formato ISO
 * @returns {boolean}
 * @throws {Error} Si la fecha es en el pasado
 */
export const validarFechaNoEnPasado = (value) => {
  const [anio, mes, dia] = value.split('T')[0].split('-').map(Number);
  const fechaSeleccionada = new Date(Date.UTC(anio, mes - 1, dia));

  const ahora = new Date();
  const hoy = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));

  if (fechaSeleccionada < hoy) {
    throw new Error('La fecha no puede ser en el pasado');
  }

  return true;
};

/**
 * Valida formato de email
 * @param {string} email
 * @returns {boolean}
 */
export const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Valida formato de teléfono
 * Acepta formatos: +54911234567, 1123456789, etc.
 * @param {string} telefono
 * @returns {boolean}
 */
export const validarTelefono = (telefono) => {
  const regex = /^\+?[\d\s\-()]{10,20}$/;
  return regex.test(telefono);
};

/**
 * Valida fortaleza de contraseña
 * Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número
 * @param {string} password
 * @returns {boolean}
 */
export const validarPasswordFuerte = (password) => {
  if (password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres');
  }

  if (!/[a-z]/.test(password)) {
    throw new Error('La contraseña debe contener al menos una letra minúscula');
  }

  if (!/[A-Z]/.test(password)) {
    throw new Error('La contraseña debe contener al menos una letra mayúscula');
  }

  if (!/\d/.test(password)) {
    throw new Error('La contraseña debe contener al menos un número');
  }

  return true;
};

/**
 * Valida que un ID de MongoDB sea válido
 * @param {string} id
 * @returns {boolean}
 */
export const validarMongoId = (id) => {
  const regex = /^[0-9a-fA-F]{24}$/;
  return regex.test(id);
};

/**
 * Valida rango de precio
 * @param {number} precio
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
export const validarRangoPrecio = (precio, min = 0, max = 1000000) => {
  const num = parseFloat(precio);
  if (isNaN(num) || num < min || num > max) {
    throw new Error(`El precio debe estar entre ${min} y ${max}`);
  }
  return true;
};

export default {
  validarFechaNoEnPasado,
  validarEmail,
  validarTelefono,
  validarPasswordFuerte,
  validarMongoId,
  validarRangoPrecio,
};
