/**
 * ============================================================================
 * HOOK PERSONALIZADO: useApi
 * ============================================================================
 *
 * Hook para simplificar el manejo de peticiones asíncronas a la API.
 * Gestiona automáticamente los estados de carga, error y datos.
 *
 * RESPONSABILIDADES:
 * - Manejar el estado de carga de peticiones HTTP
 * - Capturar y almacenar errores de las peticiones
 * - Guardar los datos recibidos de la API
 * - Proporcionar función para ejecutar la petición
 * - Permitir resetear el estado del hook
 *
 * ESTADOS MANEJADOS:
 * - datos: Información recibida de la API (null inicialmente)
 * - estaCargando: Indicador de petición en progreso
 * - mensajeError: Mensaje de error si la petición falla
 *
 * FUNCIONES PROPORCIONADAS:
 * - ejecutar: Ejecuta la función de API con los parámetros dados
 * - reiniciar: Limpia todos los estados a sus valores iniciales
 *
 * USO:
 * const { datos, estaCargando, mensajeError, ejecutar } = useApi(servicioApi.obtenerDatos);
 * const resultado = await ejecutar(parametro1, parametro2);
 * if (resultado.success) {
 *   // Manejar éxito
 * }
 */

import { useState } from 'react';

// ============================================================================
// DEFINICIÓN DEL HOOK
// ============================================================================

/**
 * HOOK: useApi
 *
 * @param {Function} funcionApi - Función asíncrona del servicio de API a ejecutar
 * @returns {Object} Estado y funciones del hook
 */
export const useApi = (funcionApi) => {
  // ESTADO: Datos recibidos de la API
  // - null cuando no hay datos o antes de la primera petición
  // - Objeto/Array con los datos después de una petición exitosa
  const [datos, setDatos] = useState(null);

  // ESTADO: Indicador de carga
  // - true cuando hay una petición en progreso
  // - false cuando no hay peticiones activas
  const [estaCargando, setEstaCargando] = useState(false);

  // ESTADO: Mensaje de error
  // - null cuando no hay error
  // - String con el mensaje de error cuando falla la petición
  const [mensajeError, setMensajeError] = useState(null);

  // ============================================================================
  // FUNCIÓN: Ejecutar petición a la API
  // ============================================================================
  /**
   * EJECUTAR PETICIÓN
   *
   * Ejecuta la función de API proporcionada con los parámetros dados.
   *
   * Proceso:
   * 1. Activar indicador de carga
   * 2. Limpiar cualquier error previo
   * 3. Ejecutar la función de API
   * 4. Si es exitosa, guardar los datos
   * 5. Si falla, capturar y guardar el error
   * 6. Desactivar indicador de carga
   * 7. Retornar resultado de la operación
   *
   * @param {...any} parametros - Parámetros a pasar a la función de API
   * @returns {Promise<Object>} { success: boolean, data?: any, error?: string }
   */
  const ejecutar = async (...parametros) => {
    // Paso 1: Activar el indicador de carga
    setEstaCargando(true);

    // Paso 2: Limpiar cualquier error anterior
    setMensajeError(null);

    try {
      // Paso 3: Ejecutar la función de API con los parámetros
      const respuesta = await funcionApi(...parametros);

      // Paso 4: Guardar los datos recibidos
      const datosRecibidos = respuesta.data || respuesta;
      setDatos(datosRecibidos);

      // Retornar éxito con los datos
      return { success: true, data: datosRecibidos };
    } catch (errorCapturado) {
      // Paso 5: Capturar y procesar el error

      // Extraer mensaje de error de diferentes fuentes posibles
      const mensajeErrorExtraido =
        errorCapturado.response?.data?.message ||
        errorCapturado.message ||
        'Error en la petición';

      // Guardar el mensaje de error en el estado
      setMensajeError(mensajeErrorExtraido);

      // Retornar fallo con el mensaje de error
      return { success: false, error: mensajeErrorExtraido };
    } finally {
      // Paso 6: Siempre desactivar el indicador de carga
      setEstaCargando(false);
    }
  };

  // ============================================================================
  // FUNCIÓN: Reiniciar estado del hook
  // ============================================================================
  /**
   * REINICIAR ESTADO
   *
   * Limpia todos los estados del hook a sus valores iniciales.
   * Útil cuando se quiere limpiar datos de una petición anterior.
   */
  const reiniciar = () => {
    setDatos(null);
    setMensajeError(null);
    setEstaCargando(false);
  };

  // ============================================================================
  // RETORNO DEL HOOK
  // ============================================================================

  return {
    // Estados (manteniendo nombres originales para compatibilidad)
    data: datos,
    loading: estaCargando,
    error: mensajeError,

    // Funciones (manteniendo nombres originales para compatibilidad)
    execute: ejecutar,
    reset: reiniciar,
  };
};

// ============================================================================
// EXPORTACIÓN
// ============================================================================

export default useApi;
