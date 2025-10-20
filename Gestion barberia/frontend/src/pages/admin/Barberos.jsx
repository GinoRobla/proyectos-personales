// frontend/src/pages/admin/Barberos.jsx (REFACTORIZADO CON useApi)

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import barberoService from '../../services/barberoService';
import useFormData from '../../hooks/useFormData';
import useModal from '../../hooks/useModal';
import useApi from '../../hooks/useApi'; // <-- Importar useApi
import './Barberos.css';

// Estado inicial del formulario (sin cambios)
const initialFormState = {
  nombre: '', apellido: '', email: '', telefono: '', password: '',
};

const AdminBarberos = () => {
  const toast = useToast(); // Lo mantenemos para los mensajes de ÉXITO
  const [barberos, setBarberos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [barberoAEliminar, setBarberoAEliminar] = useState(null);

  // --- HOOKS DE ESTADO (useFormData, useModal) ---
  const { values: formData, handleChange, setValues, resetForm } = useFormData(initialFormState);
  const { isOpen: formModalOpen, openModal: openFormModal, closeModal: closeFormModal } = useModal();
  const { isOpen: deleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();

  // --- HOOKS DE API ---
  // Creamos instancias de useApi para cada llamada al servicio
  const { loading: loadingBarberos, request: cargarBarberosApi } = useApi(barberoService.obtenerBarberos);
  const { loading: loadingGuardar, request: guardarBarberoApi } = useApi(barberoService.crearBarbero); // Se ajusta dinámicamente
  const { loading: loadingActualizar, request: actualizarBarberoApi } = useApi(barberoService.actualizarBarbero);
  const { loading: loadingEliminar, request: eliminarBarberoApi } = useApi(barberoService.eliminarBarbero);

  // Combinar estados de carga (opcional, pero útil)
  const isLoading = loadingBarberos || loadingGuardar || loadingActualizar || loadingEliminar;

  // --- FUNCIONES DE DATOS ---

  // Usamos useCallback para que la función no se recree innecesariamente
  const cargarBarberos = useCallback(async () => {
    const { success, data } = await cargarBarberosApi();
    if (success) {
      // El hook useApi ya normalizó la respuesta (data vs datos)
      setBarberos(data || []);
    }
    // El error ya se mostró por toast automáticamente
  }, [cargarBarberosApi]);

  // Cargar barberos al montar el componente
  useEffect(() => {
    cargarBarberos();
  }, [cargarBarberos]);

  // Guardar (Crear o Editar)
  const guardarBarbero = async () => {
    let response;
    
    if (editandoId) { // Editando
      const datos = { ...formData };
      if (!datos.password) delete datos.password;
      response = await actualizarBarberoApi(editandoId, datos);
    } else { // Creando
      response = await guardarBarberoApi(formData);
    }

    if (response.success) {
      toast.success(`Barbero ${editandoId ? 'actualizado' : 'creado'} correctamente`);
      cancelarFormulario();
      cargarBarberos();
    }
    // El error (ej: email duplicado) lo maneja useApi y muestra el toast.
  };

  // Activar/Desactivar
  const toggleActivo = async (barberoId, activoActual) => {
    const response = await actualizarBarberoApi(barberoId, { activo: !activoActual });
    if (response.success) {
      toast.success(!activoActual ? 'Barbero activado' : 'Barbero desactivado');
      cargarBarberos();
    }
  };

  // Eliminar
  const confirmarEliminar = async () => {
    if (!barberoAEliminar) return;
    const response = await eliminarBarberoApi(barberoAEliminar._id);
    if (response.success) {
      toast.success('Barbero eliminado correctamente');
      cerrarModalEliminar();
      cargarBarberos();
    }
  };

  // --- FUNCIONES DE UI (Sin cambios) ---
  const iniciarCreacion = () => { /* ... */ resetForm(); setEditandoId(null); openFormModal(); };
  const iniciarEdicion = (barbero) => { /* ... */ setEditandoId(barbero._id); setValues({ /*...*/ }); openFormModal(); };
  const cancelarFormulario = () => { /* ... */ closeFormModal(); resetForm(); setEditandoId(null); };
  const abrirModalEliminar = (barbero) => { /* ... */ setBarberoAEliminar(barbero); openDeleteModal(); };
  const cerrarModalEliminar = () => { /* ... */ closeDeleteModal(); setBarberoAEliminar(null); };


  // --- RENDERIZADO ---
  return (
    <div className="admin-barberos">
      <div className="container">
        <div className="header-con-boton">
          <h1>Gestionar Barberos</h1>
          <button onClick={iniciarCreacion} className="btn btn-primary" disabled={isLoading}>
            Nuevo Barbero
          </button>
        </div>

        {/* Modal Unificado para Crear/Editar */}
        {formModalOpen && (
          <div className="modal-overlay-form" onClick={cancelarFormulario}>
            <div className="modal-content-form" onClick={(e) => e.stopPropagation()}>
              {/* ... (Contenido del modal) ... */}
              <div className="modal-body-form">
                {/* ... (Inputs del formulario) ... */}
                <div className="barbero-acciones">
                  <button 
                    onClick={guardarBarbero} 
                    className="btn btn-primary btn-sm"
                    disabled={loadingGuardar || loadingActualizar} // Deshabilitar solo el botón de guardar
                  >
                    {loadingGuardar || loadingActualizar ? 'Guardando...' : (editandoId ? 'Guardar Cambios' : 'Crear Barbero')}
                  </button>
                  <button onClick={cancelarFormulario} className="btn btn-outline btn-sm">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estado de Carga Principal */}
        {loadingBarberos ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando barberos...</p>
          </div>
        ) : (
          <div className="barberos-lista">
            {/* ... (map de barberos) ... */}
             {barberos.map((barbero) => (
              <div key={barbero._id} className={`barbero-card ${!barbero.activo ? 'inactivo' : ''}`}>
                <div className="barbero-info">
                  {/* ... (info) ... */}
                  <div className="barbero-acciones">
                    <button onClick={() => iniciarEdicion(barbero)} className="btn btn-outline btn-sm" disabled={isLoading}>Editar</button>
                    <button onClick={() => toggleActivo(barbero._id, barbero.activo)} className={`btn btn-sm ${barbero.activo ? 'btn-warning' : 'btn-primary'}`} disabled={isLoading}>
                      {barbero.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button onClick={() => abrirModalEliminar(barbero)} className="btn btn-danger btn-sm" disabled={isLoading}>Eliminar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Confirmación de Eliminación */}
        {deleteModalOpen && barberoAEliminar && (
          <div className="modal-overlay" onClick={cerrarModalEliminar}>
            <div className="modal-content-eliminar" onClick={(e) => e.stopPropagation()}>
              {/* ... (Contenido del modal) ... */}
              <div className="modal-footer">
                <button onClick={cerrarModalEliminar} className="btn btn-outline" disabled={loadingEliminar}>Cancelar</button>
                <button onClick={confirmarEliminar} className="btn btn-danger" disabled={loadingEliminar}>
                  {loadingEliminar ? 'Eliminando...' : 'Eliminar Barbero'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBarberos;