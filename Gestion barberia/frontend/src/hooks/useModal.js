/**
 * ============================================================================
 * HOOK: useModal
 * ============================================================================
 *
 * Hook para gestionar la visibilidad de componentes modales.
 * Encapsula el estado booleano y las funciones para abrir y cerrar.
 *
 */

import { useState } from 'react';

/**
 * @param {boolean} initialVisibility - Define si el modal está abierto inicialmente (default: false).
 * @returns {object} - { isOpen, openModal, closeModal, toggleModal }
 */
export const useModal = (initialVisibility = false) => {
  // Estado que controla si el modal está abierto o cerrado
  const [isOpen, setIsOpen] = useState(initialVisibility);

  // Funciones para manipular el estado
  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  const toggleModal = () => setIsOpen((prev) => !prev);

  return {
    isOpen,      // Booleano que indica si el modal está visible
    openModal,   // Función para abrir el modal
    closeModal,  // Función para cerrar el modal
    toggleModal, // Función para alternar la visibilidad
  };
};

export default useModal;