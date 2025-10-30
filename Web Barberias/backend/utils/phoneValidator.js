/**
 * Utilidades para validación y normalización de números de teléfono
 * Usa libphonenumber-js para validación robusta
 */

import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

/**
 * Valida y normaliza un número de teléfono argentino
 * @param {string} telefono - Número de teléfono a validar
 * @returns {Object} { valido: boolean, numeroNormalizado: string, error: string }
 */
export const validarTelefonoArgentino = (telefono) => {
  if (!telefono) {
    return {
      valido: false,
      numeroNormalizado: null,
      error: 'El número de teléfono es requerido',
    };
  }

  // Usar directamente validación manual para tener control total sobre la normalización
  return validacionManualArgentina(telefono);
};

/**
 * Validación manual como fallback
 * @param {string} telefono
 * @returns {Object}
 */
const validacionManualArgentina = (telefono) => {
  // Limpiar el número
  let limpio = telefono.replace(/[\s\-\(\)]/g, '');

  // Verificar formato básico
  // Formatos aceptados:
  // +5491112345678
  // 5491112345678
  // 91112345678
  // 1112345678
  // 01112345678

  // Si empieza con +549, ya está bien
  if (limpio.startsWith('+549')) {
    if (limpio.length >= 13 && limpio.length <= 14) {
      return {
        valido: true,
        numeroNormalizado: limpio,
        error: null,
      };
    }
  }

  // Si empieza con +549 (formato completo correcto)
  if (limpio.startsWith('+549')) {
    if (limpio.length >= 13 && limpio.length <= 14) {
      return {
        valido: true,
        numeroNormalizado: limpio,
        error: null,
      };
    }
  }

  // Si empieza con 549 (sin +)
  if (limpio.startsWith('549') && limpio.length >= 12 && limpio.length <= 13) {
    return {
      valido: true,
      numeroNormalizado: '+' + limpio,
      error: null,
    };
  }

  // Si empieza con +54 pero no tiene el 9 (y longitud indica que es código de país)
  if (limpio.startsWith('+54') && !limpio.startsWith('+549') && limpio.length >= 13) {
    const sinPrefijo = limpio.substring(3);
    return {
      valido: true,
      numeroNormalizado: '+549' + sinPrefijo,
      error: null,
    };
  }

  // Si empieza con 54 pero no con 549 (y longitud indica que es código de país, no local)
  if (limpio.startsWith('54') && !limpio.startsWith('549') && limpio.length >= 12) {
    const sinPrefijo = limpio.substring(2);
    return {
      valido: true,
      numeroNormalizado: '+549' + sinPrefijo,
      error: null,
    };
  }

  // Si empieza con 0 (formato local con 0)
  if (limpio.startsWith('0') && limpio.length >= 10 && limpio.length <= 12) {
    const sinCero = limpio.substring(1);
    return {
      valido: true,
      numeroNormalizado: '+549' + sinCero,
      error: null,
    };
  }

  // Número local sin prefijos (asumir que es móvil, 10 dígitos)
  // Ejemplos: 2923563555, 1112345678
  if (limpio.length === 10) {
    return {
      valido: true,
      numeroNormalizado: '+549' + limpio,
      error: null,
    };
  }

  return {
    valido: false,
    numeroNormalizado: null,
    error: 'El formato del número de teléfono no es válido. Use el formato: +54 9 11 1234-5678',
  };
};

/**
 * Validación simple usando libphonenumber-js
 * @param {string} telefono
 * @param {string} pais - Código de país (default: 'AR')
 * @returns {boolean}
 */
export const esTelefonoValido = (telefono, pais = 'AR') => {
  try {
    return isValidPhoneNumber(telefono, pais);
  } catch (error) {
    return false;
  }
};
