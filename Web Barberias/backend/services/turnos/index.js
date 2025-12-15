/**
 * Barrel export para turnos
 * Re-exporta todas las funciones de los módulos especializados
 */

export * from './turnoService.js';
export * from './turnoDisponibilidad.js';
export * from './turnoCancelacion.js';
export * from './turnoValidacion.js';

// También exportar default consolidado
import turnoServiceDefault from './turnoService.js';
import turnoDisponibilidadDefault from './turnoDisponibilidad.js';
import turnoCancelacionDefault from './turnoCancelacion.js';
import turnoValidacionDefault from './turnoValidacion.js';

export default {
  ...turnoServiceDefault,
  ...turnoDisponibilidadDefault,
  ...turnoCancelacionDefault,
  ...turnoValidacionDefault,
};
