// frontend/src/hooks/useApi.js (REFACTORIZADO)

import { useState } from 'react';
import { useToast } from '../context/ToastContext';

/**
 * ============================================================================
 * HOOK: useApi (MEJORADO)
 * ============================================================================
 *
 * Hook centralizado para manejar llamadas a la API (servicios).
 * Encapsula automáticamente los estados de carga (loading), error,
 * y muestra notificaciones (toasts) de error.
 * Además, normaliza la respuesta del backend.
 *
 */

/**
 * @param {function} apiCall - La función del servicio que se ejecutará (ej: barberoService.obtenerBarberos).
 * @returns {object} - { data, loading, error, request }
 */
export const useApi = (apiCall) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  /**
   * Ejecuta la llamada a la API.
   * @param  {...any} args - Argumentos que se pasarán a la función apiCall.
   * @returns {object} - { success: boolean, data: any }
   */
  const request = async (...args) => {
    setLoading(true);
    setError(null);
    try {
      // Llama a la función del servicio (ej: barberoService.crearBarbero(datos))
      const response = await apiCall(...args);

      // --- NORMALIZACIÓN DE RESPUESTA ---
      // Busca datos en response.data, response.datos, o la respuesta misma.
      const data = response.data || response.datos || response.turnos || response;

      return { success: true, data: data };

    } catch (err) {
      // --- MANEJO DE ERROR CENTRALIZADO ---
      const errorMessage = err.response?.data?.message || err.message || 'Ocurrió un error inesperado';
      
      setError(errorMessage);
      toast.error(errorMessage); // Muestra el toast de error automáticamente
      
      return { success: false, data: null };

    } finally {
      setLoading(false);
    }
  };

  return {
    loading, // Booleano: indica si la petición está en curso
    error,   // String: mensaje de error (si lo hubo)
    request, // Función: el ejecutor de la llamada a la API
  };
};

export default useApi;