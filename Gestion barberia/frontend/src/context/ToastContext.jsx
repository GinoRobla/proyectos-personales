/**
 * ============================================================================
 * CONTEXTO: NOTIFICACIONES TOAST
 * ============================================================================
 *
 * Maneja el sistema de notificaciones tipo toast en toda la aplicación.
 *
 * RESPONSABILIDADES:
 * - Mantener la lista de notificaciones activas
 * - Mostrar y ocultar notificaciones toast
 * - Proporcionar funciones de conveniencia para diferentes tipos de mensajes
 * - Gestionar el ciclo de vida de cada notificación
 *
 * TIPOS DE NOTIFICACIONES:
 * - success: Mensajes de éxito (verde)
 * - error: Mensajes de error (rojo)
 * - warning: Mensajes de advertencia (amarillo)
 * - info: Mensajes informativos (azul)
 *
 * FUNCIONES PROPORCIONADAS:
 * - mostrarToast: Función genérica para mostrar cualquier tipo de toast
 * - exito: Atajo para mostrar mensaje de éxito
 * - error: Atajo para mostrar mensaje de error
 * - advertencia: Atajo para mostrar mensaje de advertencia
 * - informacion: Atajo para mostrar mensaje informativo
 */

import { createContext, useContext, useState } from 'react';
import Toast from '../components/Toast';

// ============================================================================
// CREACIÓN DEL CONTEXTO
// ============================================================================

const ToastContext = createContext();

// ============================================================================
// HOOK PERSONALIZADO: useToast
// ============================================================================
/**
 * Hook para acceder al sistema de notificaciones toast desde cualquier componente.
 *
 * Uso:
 * const toast = useToast();
 * toast.exito('Operación exitosa');
 * toast.error('Ocurrió un error');
 *
 * @throws {Error} Si se usa fuera de un ToastProvider
 * @returns {Object} Funciones para mostrar notificaciones
 */
export const useToast = () => {
  const contexto = useContext(ToastContext);

  if (!contexto) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }

  return contexto;
};

// ============================================================================
// PROVEEDOR DEL CONTEXTO
// ============================================================================

export const ToastProvider = ({ children }) => {
  // ESTADO: Lista de notificaciones toast activas
  // Cada toast tiene: { id, message, type, duration }
  const [listaToasts, setListaToasts] = useState([]);

  // ============================================================================
  // FUNCIÓN: Mostrar notificación toast
  // ============================================================================
  /**
   * MOSTRAR TOAST
   *
   * Muestra una notificación toast en la pantalla.
   *
   * Proceso:
   * 1. Generar un ID único para el toast
   * 2. Agregar el nuevo toast a la lista de toasts activos
   * 3. El componente Toast se encargará de ocultarse automáticamente
   *
   * @param {string} mensaje - Texto a mostrar en la notificación
   * @param {string} tipo - Tipo de notificación: 'success', 'error', 'warning', 'info'
   * @param {number} duracion - Duración en milisegundos (por defecto 3000ms)
   */
  const mostrarToast = (mensaje, tipo = 'info', duracion = 3000) => {
    // Paso 1: Generar ID único usando timestamp
    const idUnico = Date.now();

    // Paso 2: Agregar el nuevo toast a la lista
    setListaToasts((toastsAnteriores) => [
      ...toastsAnteriores,
      { id: idUnico, message: mensaje, type: tipo, duration: duracion },
    ]);
  };

  // ============================================================================
  // FUNCIÓN: Eliminar notificación toast
  // ============================================================================
  /**
   * ELIMINAR TOAST
   *
   * Elimina un toast específico de la lista de notificaciones activas.
   *
   * @param {number} id - ID del toast a eliminar
   */
  const eliminarToast = (id) => {
    setListaToasts((toastsAnteriores) =>
      toastsAnteriores.filter((toast) => toast.id !== id)
    );
  };

  // ============================================================================
  // FUNCIONES DE CONVENIENCIA
  // ============================================================================
  // Atajos para mostrar diferentes tipos de notificaciones sin especificar el tipo

  /**
   * MOSTRAR MENSAJE DE ÉXITO
   *
   * Atajo para mostrar una notificación de éxito (verde).
   *
   * @param {string} mensaje - Texto del mensaje
   * @param {number} duracion - Duración opcional en milisegundos
   */
  const exito = (mensaje, duracion) => mostrarToast(mensaje, 'success', duracion);

  /**
   * MOSTRAR MENSAJE DE ERROR
   *
   * Atajo para mostrar una notificación de error (rojo).
   *
   * @param {string} mensaje - Texto del mensaje
   * @param {number} duracion - Duración opcional en milisegundos
   */
  const errorToast = (mensaje, duracion) => mostrarToast(mensaje, 'error', duracion);

  /**
   * MOSTRAR MENSAJE DE ADVERTENCIA
   *
   * Atajo para mostrar una notificación de advertencia (amarillo).
   *
   * @param {string} mensaje - Texto del mensaje
   * @param {number} duracion - Duración opcional en milisegundos
   */
  const advertencia = (mensaje, duracion) => mostrarToast(mensaje, 'warning', duracion);

  /**
   * MOSTRAR MENSAJE INFORMATIVO
   *
   * Atajo para mostrar una notificación informativa (azul).
   *
   * @param {string} mensaje - Texto del mensaje
   * @param {number} duracion - Duración opcional en milisegundos
   */
  const informacion = (mensaje, duracion) => mostrarToast(mensaje, 'info', duracion);

  // ============================================================================
  // VALOR DEL CONTEXTO
  // ============================================================================
  // Objeto que contiene todas las funciones disponibles para mostrar notificaciones
  const valorContexto = {
    showToast: mostrarToast,
    success: exito,
    error: errorToast,
    warning: advertencia,
    info: informacion,
  };

  return (
    <ToastContext.Provider value={valorContexto}>
      {children}

      {/* Contenedor de todas las notificaciones toast activas */}
      <div className="toast-container">
        {listaToasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => eliminarToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};