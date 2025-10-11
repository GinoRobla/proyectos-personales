/**
 * ============================================================================
 * COMPONENTE: NOTIFICACIÓN TOAST
 * ============================================================================
 *
 * Componente de notificación estilo toast (mensaje temporal en pantalla).
 *
 * RESPONSABILIDADES:
 * - Mostrar mensaje de notificación con estilo visual según tipo
 * - Auto-cerrarse después de la duración especificada
 * - Permitir cierre manual por el usuario
 * - Mostrar icono apropiado según el tipo de mensaje
 *
 * PROPS:
 * - message: Texto del mensaje a mostrar
 * - type: Tipo de notificación ('success', 'error', 'warning', 'info')
 * - onClose: Función callback a ejecutar al cerrar
 * - duration: Duración en ms antes de auto-cerrar (3000 por defecto)
 *
 * TIPOS DISPONIBLES:
 * - success: Mensaje de éxito (verde) con icono ✓
 * - error: Mensaje de error (rojo) con icono ✕
 * - warning: Mensaje de advertencia (amarillo) con icono ⚠
 * - info: Mensaje informativo (azul) con icono ℹ
 *
 * COMPORTAMIENTO:
 * - Se auto-cierra después de 'duration' milisegundos
 * - El usuario puede cerrarlo manualmente con el botón X
 * - Si duration es 0 o negativo, no se auto-cierra
 */

import { useEffect } from 'react';
import './Toast.css';

// ============================================================================
// DEFINICIÓN DEL COMPONENTE
// ============================================================================

/**
 * COMPONENTE: Toast
 *
 * @param {Object} props - Props del componente
 * @param {string} props.message - Mensaje a mostrar
 * @param {string} props.type - Tipo de toast ('success', 'error', 'warning', 'info')
 * @param {Function} props.onClose - Callback al cerrar
 * @param {number} props.duration - Duración en milisegundos (3000 por defecto)
 */
const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  // ============================================================================
  // EFECTO: Auto-cerrar después de la duración especificada
  // ============================================================================
  // Se ejecuta cuando cambian duration o onClose.
  // Configura un temporizador para cerrar automáticamente el toast.
  useEffect(() => {
    // Solo configurar temporizador si duration es mayor a 0
    if (duration > 0) {
      // Crear temporizador que ejecutará onClose después de 'duration' ms
      const temporizador = setTimeout(() => {
        onClose();
      }, duration);

      // Función de limpieza: cancelar el temporizador si el componente se desmonta
      // antes de que se complete el tiempo
      return () => clearTimeout(temporizador);
    }
  }, [duration, onClose]);

  // ============================================================================
  // FUNCIÓN: Obtener icono según tipo
  // ============================================================================
  /**
   * OBTENER ICONO
   *
   * Retorna el icono apropiado según el tipo de toast.
   *
   * @returns {string} Icono a mostrar
   */
  const obtenerIcono = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  };

  // ============================================================================
  // RENDERIZADO
  // ============================================================================

  return (
    <div className={`toast toast-${type}`}>
      {/* Contenido del toast: icono + mensaje */}
      <div className="toast-content">
        {/* Icono según el tipo de notificación */}
        <div className="toast-icon">{obtenerIcono()}</div>

        {/* Mensaje de la notificación */}
        <p className="toast-message">{message}</p>
      </div>

      {/* Botón para cerrar manualmente */}
      <button className="toast-close" onClick={onClose} aria-label="Cerrar notificación">
        ✕
      </button>
    </div>
  );
};

// ============================================================================
// EXPORTACIÓN
// ============================================================================

export default Toast;