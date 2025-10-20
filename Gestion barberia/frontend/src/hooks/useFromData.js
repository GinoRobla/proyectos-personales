/**
 * ============================================================================
 * HOOK: useFormData
 * ============================================================================
 *
 * Hook personalizado para gestionar el estado y los cambios de formularios.
 * Simplifica el manejo de inputs, textareas y selects.
 *
 */

import { useState } from 'react';

/**
 * @param {object} initialState - Objeto con los valores iniciales del formulario.
 * @returns {object} - { values, handleChange, setValues, resetForm }
 */
export const useFormData = (initialState = {}) => {
  // Estado que almacena los valores de todos los campos del formulario
  const [values, setValues] = useState(initialState);

  /**
   * Maneja el cambio de valor de cualquier input del formulario.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>} e - El evento de cambio.
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues((prevValues) => ({
      ...prevValues,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  /**
   * Resetea el formulario a sus valores iniciales.
   */
  const resetForm = () => {
    setValues(initialState);
  };

  return {
    values,       // Objeto con los valores actuales del formulario
    handleChange, // Función para pasar al 'onChange' de los inputs
    setValues,    // Función para establecer todos los valores del formulario manualmente
    resetForm,    // Función para limpiar el formulario
  };
};

export default useFormData;