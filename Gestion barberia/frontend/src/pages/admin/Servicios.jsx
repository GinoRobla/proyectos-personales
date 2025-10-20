// frontend/src/pages/admin/Servicios.jsx

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import servicioService from '../../services/servicioService';
import useFormData from '../../hooks/useFormData';
import useModal from '../../hooks/useModal';
import useApi from '../../hooks/useApi'; // <-- Importar useApi
import './Servicios.css';

const initialFormState = {
  nombre: '', descripcion: '', duracion: '', precioBase: '',
};

const AdminServicios = () => {
  const toast = useToast();
  const [servicios, setServicios] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [servicioAEliminar, setServicioAEliminar] = useState(null);

  // --- HOOKS DE ESTADO ---
  const { values: formData, handleChange, setValues, resetForm } = useFormData(initialFormState);
  const { isOpen: formModalOpen, openModal: openFormModal, closeModal: closeFormModal } = useModal();
  const { isOpen: deleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();

  // --- HOOKS DE API ---
  const { loading: loadingServicios, request: cargarServiciosApi } = useApi(servicioService.obtenerServicios);
  const { loading: loadingGuardar, request: guardarServicioApi } = useApi(servicioService.crearServicio);
  const { loading: loadingActualizar, request: actualizarServicioApi } = useApi(servicioService.actualizarServicio);
  const { loading: loadingEliminar, request: eliminarServicioApi } = useApi(servicioService.eliminarServicio);

  const isLoading = loadingServicios || loadingGuardar || loadingActualizar || loadingEliminar;

  // --- FUNCIONES DE DATOS ---

  const cargarServicios = useCallback(async () => {
    // Pedimos todos (activos e inactivos)
    const { success, data } = await cargarServiciosApi(false);
    if (success) {
      setServicios(data || []);
    }
    // El error ya se muestra por toast
  }, [cargarServiciosApi]);

  useEffect(() => {
    cargarServicios();
  }, [cargarServicios]);

  const guardarServicio = async () => {
    if (isNaN(formData.duracion) || formData.duracion <= 0 || isNaN(formData.precioBase) || formData.precioBase < 0) {
      toast.error('La duración y el precio deben ser números válidos.');
      return;
    }

    const datosParaGuardar = {
      ...formData,
      duracion: parseInt(formData.duracion, 10),
      precioBase: parseFloat(formData.precioBase),
    };

    let response;
    if (editandoId) {
      response = await actualizarServicioApi(editandoId, datosParaGuardar);
    } else {
      response = await guardarServicioApi(datosParaGuardar);
    }

    if (response.success) {
      toast.success(`Servicio ${editandoId ? 'actualizado' : 'creado'} correctamente`);
      cancelarFormulario();
      cargarServicios();
    }
    // El error lo maneja useApi
  };

  const toggleActivo = async (servicioId, activoActual) => {
    const response = await actualizarServicioApi(servicioId, { activo: !activoActual });
    if (response.success) {
      toast.success(!activoActual ? 'Servicio activado' : 'Servicio desactivado');
      cargarServicios();
    }
  };

  const confirmarEliminar = async () => {
    if (!servicioAEliminar) return;
    const response = await eliminarServicioApi(servicioAEliminar._id);
    if (response.success) {
      toast.success('Servicio desactivado (eliminado) correctamente');
      cerrarModalEliminar();
      cargarServicios();
    }
  };

  // --- FUNCIONES DE UI (Sin cambios) ---
  const iniciarCreacion = () => { resetForm(); setEditandoId(null); openFormModal(); };
  const iniciarEdicion = (servicio) => { /* ... */ };
  const cancelarFormulario = () => { closeFormModal(); resetForm(); setEditandoId(null); };
  const abrirModalEliminar = (servicio) => { setServicioAEliminar(servicio); openDeleteModal(); };
  const cerrarModalEliminar = () => { closeDeleteModal(); setServicioAEliminar(null); };

  // --- RENDERIZADO ---
  return (
    <div className="admin-servicios">
      <div className="container">
        <div className="header-con-boton">
          <h1>Gestionar Servicios</h1>
          <button onClick={iniciarCreacion} className="btn btn-primary" disabled={isLoading}>
            Nuevo Servicio
          </button>
        </div>

        {/* Modal Unificado para Crear/Editar */}
        {formModalOpen && (
          <div className="modal-overlay-form" onClick={cancelarFormulario}>
            <div className="modal-content-form" onClick={(e) => e.stopPropagation()}>
              {/* ... (Header del modal) ... */}
              <div className="modal-body-form">
                <div className="servicio-form">
                  {/* ... (Inputs del formulario) ... */}
                  <div className="servicio-acciones">
                    <button 
                      onClick={guardarServicio} 
                      className="btn btn-primary btn-sm"
                      disabled={loadingGuardar || loadingActualizar}
                    >
                      {loadingGuardar || loadingActualizar ? 'Guardando...' : (editandoId ? 'Guardar Cambios' : 'Crear Servicio')}
                    </button>
                    <button onClick={cancelarFormulario} className="btn btn-outline btn-sm">
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estado de Carga Principal */}
        {loadingServicios ? (
          <div className="loading"><div className="spinner"></div><p>Cargando servicios...</p></div>
        ) : (
          <div className="servicios-lista">
            {/* ... (map de servicios) ... */}
            {servicios.map((servicio) => (
              <div key={servicio._id} className={`servicio-card ${!servicio.activo ? 'inactivo' : ''}`}>
                <div className="servicio-info">
                  {/* ... (info del servicio) ... */}
                  <div className="servicio-acciones">
                    <button onClick={() => iniciarEdicion(servicio)} className="btn btn-outline btn-sm" disabled={isLoading}>Editar</button>
                    <button onClick={() => toggleActivo(servicio._id, servicio.activo)} className={`btn btn-sm ${servicio.activo ? 'btn-warning' : 'btn-primary'}`} disabled={isLoading}>
                      {servicio.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button onClick={() => abrirModalEliminar(servicio)} className="btn btn-danger btn-sm" disabled={isLoading}>Eliminar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Confirmación de Eliminación */}
        {deleteModalOpen && servicioAEliminar && (
          <div className="modal-overlay" onClick={cerrarModalEliminar}>
            <div className="modal-content-eliminar" onClick={(e) => e.stopPropagation()}>
              {/* ... (Contenido del modal) ... */}
              <div className="modal-footer">
                <button onClick={cerrarModalEliminar} className="btn btn-outline" disabled={loadingEliminar}>Cancelar</button>
                <button onClick={confirmarEliminar} className="btn btn-danger" disabled={loadingEliminar}>
                  {loadingEliminar ? 'Desactivando...' : 'Desactivar Servicio'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminServicios;