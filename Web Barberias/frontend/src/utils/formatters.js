/**
 * ============================================================================
 * UTILS: FORMATTERS
 * ============================================================================
 *
 * Funciones para formatear datos comunes (moneda, fechas, etc.).
 *
 */

/**
 * Formatea un número como moneda en pesos argentinos (ARS).
 * @param {number} valor - El valor numérico a formatear.
 * @returns {string} - El valor formateado como moneda (ej: "$ 5.000,00").
 */
export const formatearMoneda = (valor) => {
  // Verifica si el valor es un número válido, si no, devuelve un string vacío o un placeholder
  if (typeof valor !== 'number' || isNaN(valor)) {
    // Puedes devolver '$ 0,00' o un string vacío según prefieras
    return '$ 0,00';
  }
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(valor);
};

// Podrías añadir otras funciones de formato aquí si las necesitas,
// por ejemplo, para formatear porcentajes, números grandes, etc.