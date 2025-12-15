/**
 * ============================================================================
 * HOOK: useForm
 * ============================================================================
 *
 * Hook personalizado para gestionar estado y cambios de formularios.
 * Reduce código repetitivo en componentes con forms.
 */

import { useState } from 'react';

/**
 * Hook para gestionar formularios
 * @param {object} initialValues - Valores iniciales del formulario
 * @returns {object} - { values, handleChange, handleNestedChange, setValues, resetForm }
 */
export const useForm = (initialValues = {}) => {
  const [values, setValues] = useState(initialValues);

  /**
   * Maneja cambios en inputs simples
   * @param {Event} e - Evento del input
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  /**
   * Maneja cambios en inputs anidados (ej: redesSociales.facebook)
   * @param {string} parentKey - Clave del objeto padre
   * @param {string} childKey - Clave del hijo
   * @param {any} value - Valor a actualizar
   */
  const handleNestedChange = (parentKey, childKey, value) => {
    setValues((prev) => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value,
      },
    }));
  };

  /**
   * Resetea el formulario a los valores iniciales
   */
  const resetForm = () => {
    setValues(initialValues);
  };

  /**
   * Actualiza múltiples valores a la vez
   * @param {object} newValues - Nuevos valores
   */
  const updateValues = (newValues) => {
    setValues((prev) => ({
      ...prev,
      ...newValues,
    }));
  };

  return {
    values,
    handleChange,
    handleNestedChange,
    setValues,
    resetForm,
    updateValues,
  };
};

export default useForm;
