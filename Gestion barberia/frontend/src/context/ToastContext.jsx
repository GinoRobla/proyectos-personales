import { createContext, useContext, useState } from 'react';
import Toast from '../components/Toast';

// 1. Se crea un Context de React para compartir las funciones de notificación.
const ToastContext = createContext();

/**
 * Hook para usar las notificaciones desde cualquier componente de forma sencilla.
 * Lanza un error si se intenta usar fuera del ToastProvider.
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de un ToastProvider');
  }
  return context;
};

/**
 * Componente "Proveedor" que gestiona el estado de los toasts
 * y los muestra en la pantalla. Debe envolver tu aplicación.
 */
export const ToastProvider = ({ children }) => {
  // Almacena la lista de notificaciones (toasts) que se están mostrando.
  const [toasts, setToasts] = useState([]);

  /**
   * Elimina una notificación de la pantalla usando su ID.
   * @param {number} id - El ID de la notificación a quitar.
   */
  const removeToast = (id) => {
    // Filtra la lista, quedándose con todos los toasts menos el que coincide con el ID.
    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
  };

  /**
   * Añade una nueva notificación a la lista para que aparezca en pantalla.
   * @param {string} message - El texto que se mostrará.
   * @param {string} type - El tipo de notificación ('success', 'error', 'warning', 'info').
   * @param {number} duration - Cuánto tiempo (en ms) será visible.
   */
  const showToast = (message, type = 'info', duration = 3000) => {
    const newToast = {
      id: Date.now(), // Se usa el timestamp como un ID único y simple.
      message,
      type,
      duration,
    };
    // Añade el nuevo toast a la lista existente de toasts.
    setToasts(currentToasts => [...currentToasts, newToast]);
  };

  // Objeto con las funciones que se compartirán a través del contexto.
  const contextValue = {
    success: (message, duration) => showToast(message, 'success', duration),
    error: (message, duration) => showToast(message, 'error', duration),
    warning: (message, duration) => showToast(message, 'warning', duration),
    info: (message, duration) => showToast(message, 'info', duration),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {/* Muestra el resto de la aplicación */}
      {children}

      {/* Área fija donde aparecerán todas las notificaciones */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            // La función para cerrar se pasa al componente Toast.
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};