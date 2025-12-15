/**
 * ============================================================================
 * CONSTANTES COMPARTIDAS
 * ============================================================================
 *
 * Constantes utilizadas en múltiples componentes de la aplicación.
 * Centralizar estas constantes evita duplicación y facilita el mantenimiento.
 */

/**
 * Días de la semana
 * Formato: { numero: 0-6 (Domingo-Sábado), nombre: string }
 */
export const DIAS_SEMANA = [
  { numero: 0, nombre: 'Domingo' },
  { numero: 1, nombre: 'Lunes' },
  { numero: 2, nombre: 'Martes' },
  { numero: 3, nombre: 'Miércoles' },
  { numero: 4, nombre: 'Jueves' },
  { numero: 5, nombre: 'Viernes' },
  { numero: 6, nombre: 'Sábado' },
];

/**
 * Días de la semana ordenados de Lunes a Domingo (para gestión de disponibilidad)
 */
export const DIAS_SEMANA_LUNES_PRIMERO = [
  { numero: 1, nombre: 'Lunes' },
  { numero: 2, nombre: 'Martes' },
  { numero: 3, nombre: 'Miércoles' },
  { numero: 4, nombre: 'Jueves' },
  { numero: 5, nombre: 'Viernes' },
  { numero: 6, nombre: 'Sábado' },
  { numero: 0, nombre: 'Domingo' },
];

/**
 * Duraciones de turno disponibles
 * Formato: { valor: número en minutos, etiqueta: string descriptiva }
 */
export const DURACIONES_TURNO = [
  { valor: 30, etiqueta: '30 minutos' },
  { valor: 45, etiqueta: '45 minutos' },
  { valor: 60, etiqueta: '60 minutos (1 hora)' },
];

/**
 * Tipos de bloqueo disponibles
 */
export const TIPOS_BLOQUEO = {
  DIA_COMPLETO: 'DIA_COMPLETO',
  RANGO_HORAS: 'RANGO_HORAS',
};

/**
 * Estados de turno
 */
export const ESTADOS_TURNO = {
  RESERVADO: 'reservado',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado',
  NO_ASISTIO: 'no_asistio',
};

/**
 * Roles de usuario
 */
export const ROLES = {
  ADMIN: 'admin',
  BARBERO: 'barbero',
  CLIENTE: 'cliente',
};
