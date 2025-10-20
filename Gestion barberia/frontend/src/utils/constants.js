/**
 * ============================================================================
 * UTILS: CONSTANTES
 * ============================================================================
 *
 * Constantes y valores fijos utilizados en toda la aplicación.
 * Centralizar estos valores ayuda a evitar errores de tipeo y facilita
 * el mantenimiento.
 *
 */

// Roles de usuario en el sistema
export const ROLES = {
  ADMIN: 'admin',
  BARBERO: 'barbero',
  CLIENTE: 'cliente',
};

// Estados posibles de un turno
export const ESTADOS_TURNO = {
  RESERVADO: 'reservado',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado',
  PENDIENTE: 'pendiente', // Si se usa para turnos sin asignar
};

// Mensajes de error comunes
export const MENSAJES_ERROR = {
  CARGA_DATOS: 'Hubo un error al cargar los datos. Intenta de nuevo más tarde.',
  NO_ENCONTRADO: 'El recurso solicitado no fue encontrado.',
  PERMISOS: 'No tienes permisos para realizar esta acción.',
  GENERAL: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
};