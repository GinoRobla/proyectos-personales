import api from './api';

/**
 * Servicio para manejar operaciones de pagos y señas
 */

/**
 * Obtener información de un pago por ID
 * @param {string} pagoId - ID del pago
 * @returns {Promise} Datos del pago
 */
export const obtenerPago = async (pagoId) => {
  try {
    const response = await api.get(`/pagos/${pagoId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener pago:', error);
    throw error;
  }
};

/**
 * Obtener todos los pagos (para admin)
 * @param {Object} filtros - Filtros opcionales (estado, fechaDesde, fechaHasta)
 * @returns {Promise} Lista de pagos
 */
export const obtenerPagos = async (filtros = {}) => {
  try {
    const response = await api.get('/pagos', { params: filtros });
    return response.data;
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    throw error;
  }
};

/**
 * Obtener pagos de un cliente específico
 * @param {string} clienteId - ID del cliente
 * @returns {Promise} Lista de pagos del cliente
 */
export const obtenerPagosCliente = async (clienteId) => {
  try {
    const response = await api.get(`/pagos/cliente/${clienteId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener pagos del cliente:', error);
    throw error;
  }
};

/**
 * Obtener pagos asociados a un turno
 * @param {string} turnoId - ID del turno
 * @returns {Promise} Lista de pagos del turno
 */
export const obtenerPagosTurno = async (turnoId) => {
  try {
    const response = await api.get(`/pagos/turno/${turnoId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener pagos del turno:', error);
    throw error;
  }
};

/**
 * Marcar un pago como completado manualmente (solo admin)
 * @param {string} pagoId - ID del pago
 * @returns {Promise} Pago actualizado
 */
export const marcarPagoCompletado = async (pagoId) => {
  try {
    const response = await api.put(`/pagos/${pagoId}/completar`);
    return response.data;
  } catch (error) {
    console.error('Error al marcar pago como completado:', error);
    throw error;
  }
};

/**
 * Cancelar un pago
 * @param {string} pagoId - ID del pago
 * @returns {Promise} Pago cancelado
 */
export const cancelarPago = async (pagoId) => {
  try {
    const response = await api.put(`/pagos/${pagoId}/cancelar`);
    return response.data;
  } catch (error) {
    console.error('Error al cancelar pago:', error);
    throw error;
  }
};

/**
 * Procesar devolución de un pago
 * @param {string} pagoId - ID del pago
 * @returns {Promise} Resultado de la devolución
 */
export const procesarDevolucion = async (pagoId) => {
  try {
    const response = await api.post(`/pagos/${pagoId}/devolver`);
    return response.data;
  } catch (error) {
    console.error('Error al procesar devolución:', error);
    throw error;
  }
};

/**
 * Obtener configuración de señas (público)
 * @returns {Promise} Configuración de señas
 */
export const obtenerConfiguracionSenas = async () => {
  try {
    const response = await api.get('/configuracion/senas');
    return response.data;
  } catch (error) {
    console.error('Error al obtener configuración de señas:', error);
    throw error;
  }
};

/**
 * Calcular el monto de seña para un servicio
 * @param {number} precioTotal - Precio total del servicio
 * @param {number} porcentajeSena - Porcentaje de seña (ej: 30)
 * @returns {number} Monto de la seña
 */
export const calcularMontoSena = (precioTotal, porcentajeSena) => {
  return Math.round((precioTotal * porcentajeSena) / 100);
};

/**
 * Calcular el monto restante después de pagar la seña
 * @param {number} precioTotal - Precio total del servicio
 * @param {number} montoSena - Monto de la seña pagada
 * @returns {number} Monto restante a pagar
 */
export const calcularMontoRestante = (precioTotal, montoSena) => {
  return precioTotal - montoSena;
};

/**
 * Verificar si un turno requiere seña
 * Esta función NO hace llamada a la API, solo verifica en el objeto turno
 * @param {Object} turno - Objeto del turno
 * @returns {boolean} True si requiere seña
 */
export const turnoRequiereSena = (turno) => {
  return turno?.requiereSena === true;
};

/**
 * Verificar si un pago está pendiente
 * @param {Object} pago - Objeto del pago
 * @returns {boolean} True si está pendiente
 */
export const pagoEstaPendiente = (pago) => {
  return pago?.estado === 'pendiente';
};

/**
 * Verificar si un pago está aprobado
 * @param {Object} pago - Objeto del pago
 * @returns {boolean} True si está aprobado
 */
export const pagoEstaAprobado = (pago) => {
  return pago?.estado === 'aprobado';
};

/**
 * Verificar si un pago fue rechazado
 * @param {Object} pago - Objeto del pago
 * @returns {boolean} True si fue rechazado
 */
export const pagoFueRechazado = (pago) => {
  return pago?.estado === 'rechazado';
};

/**
 * Obtener texto descriptivo del estado de pago
 * @param {string} estado - Estado del pago (puede ser del Pago o del Turno.estadoPago)
 * @returns {string} Texto descriptivo
 */
export const obtenerTextoEstadoPago = (estado) => {
  const estados = {
    // Estados del modelo Pago
    pendiente: 'Pendiente',
    aprobado: 'Aprobado',
    rechazado: 'Rechazado',
    devuelto: 'Devuelto',
    expirado: 'Expirado',
    // Estados del modelo Turno.estadoPago
    sin_sena: 'No requiere',
    pagada: 'Pagada',
    aplicada: 'Aplicada',
    retenida: 'Retenida',
  };

  return estados[estado] || 'Estado desconocido';
};

/**
 * Obtener color para el estado de pago (para UI)
 * @param {string} estado - Estado del pago (puede ser del Pago o del Turno.estadoPago)
 * @returns {string} Color en formato CSS
 */
export const obtenerColorEstadoPago = (estado) => {
  const colores = {
    // Estados del modelo Pago
    pendiente: '#FFA500',   // Naranja
    aprobado: '#28a745',    // Verde
    rechazado: '#dc3545',   // Rojo
    devuelto: '#17a2b8',    // Azul
    expirado: '#6c757d',    // Gris
    // Estados del modelo Turno.estadoPago
    sin_sena: '#6c757d',    // Gris
    pagada: '#28a745',      // Verde
    aplicada: '#007bff',    // Azul
    retenida: '#ffc107',    // Amarillo
  };

  return colores[estado] || '#6c757d';
};

export default {
  obtenerPago,
  obtenerPagos,
  obtenerPagosCliente,
  obtenerPagosTurno,
  marcarPagoCompletado,
  cancelarPago,
  procesarDevolucion,
  obtenerConfiguracionSenas,
  calcularMontoSena,
  calcularMontoRestante,
  turnoRequiereSena,
  pagoEstaPendiente,
  pagoEstaAprobado,
  pagoFueRechazado,
  obtenerTextoEstadoPago,
  obtenerColorEstadoPago,
};
