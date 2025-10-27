// frontend/src/pages/admin/Servicios.jsx

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import servicioService from '../../services/servicioService';
import useFormData from '../../hooks/useFormData';
import useModal from '../../hooks/useModal';
import useApi from '../../hooks/useApi';
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
    const { success, data, message } = await cargarServiciosApi();
    if (success) {
      setServicios(data || []);
    } else {
      toast.error(message || 'Error al cargar la lista de servicios', 4000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarServicios();
  }, [cargarServicios]);

  const guardarServicio = async () => {
    // Validaciones del frontend
    if (!formData.nombre.trim()) {
      toast.error('El nombre del servicio es obligatorio', 4000);
      return;
    }

    if (!formData.duracion || isNaN(formData.duracion)) {
      toast.error('La duración es obligatoria y debe ser un número', 4000);
      return;
    }

    if (formData.duracion <= 0) {
      toast.error('La duración debe ser mayor a 0 minutos', 4000);
      return;
    }

    if (!formData.precioBase || isNaN(formData.precioBase)) {
      toast.error('El precio es obligatorio y debe ser un número', 4000);
      return;
    }

    if (formData.precioBase < 0) {
      toast.error('El precio no puede ser negativo', 4000);
      return;
    }

    let response;

    if (editandoId) {
      response = await actualizarServicioApi(editandoId, formData);
    } else {
      response = await guardarServicioApi(formData);
    }

    if (response.success) {
      toast.success(`Servicio ${editandoId ? 'actualizado' : 'creado'} exitosamente`, 3000);
      cancelarFormulario();
      cargarServicios();
    } else {
      const mensaje = response.message || `Error al ${editandoId ? 'actualizar' : 'crear'} servicio`;
      toast.error(mensaje, 4000);
    }
  };

  const toggleActivo = async (servicioId, activoActual) => {
    const response = await actualizarServicioApi(servicioId, { activo: !activoActual });
    if (response.success) {
      toast.success(!activoActual ? 'Servicio activado correctamente' : 'Servicio desactivado correctamente', 3000);
      cargarServicios();
    } else {
      toast.error('No se pudo actualizar el estado del servicio', 4000);
    }
  };

  const confirmarEliminar = async () => {
    if (!servicioAEliminar) return;
    const response = await eliminarServicioApi(servicioAEliminar._id);
    if (response.success) {
      toast.success('Servicio eliminado correctamente', 3000);
      cerrarModalEliminar();
      cargarServicios();
    } else {
      const mensaje = response.message || 'No se pudo eliminar el servicio. Verifica que no esté asignado a turnos';
      toast.error(mensaje, 4000);
    }
  };

  // --- FUNCIONES DE UI ---
  const iniciarCreacion = () => {
    resetForm();
    setEditandoId(null);
    openFormModal();
  };

  const iniciarEdicion = (servicio) => {
    setEditandoId(servicio._id);
    setValues({
      nombre: servicio.nombre || '',
      descripcion: servicio.descripcion || '',
      duracion: servicio.duracion || '',
      precioBase: servicio.precioBase || '',
    });
    openFormModal();
  };

  const cancelarFormulario = () => {
    closeFormModal();
    resetForm();
    setEditandoId(null);
  };

  const abrirModalEliminar = (servicio) => {
    setServicioAEliminar(servicio);
    openDeleteModal();
  };

  const cerrarModalEliminar = () => {
    closeDeleteModal();
    setServicioAEliminar(null);
  };

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
              <div className="modal-header-form">
                <h2>{editandoId ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
                <button className="modal-close" onClick={cancelarFormulario}>✕</button>
              </div>

              <div className="modal-body-form">
                <div className="servicio-form">
                  <div className="input-group">
                    <label htmlFor="nombre">Nombre</label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      className="input"
                      value={formData.nombre}
                      onChange={handleChange}
                      placeholder="Nombre del servicio"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="descripcion">Descripción</label>
                    <textarea
                      id="descripcion"
                      name="descripcion"
                      className="input"
                      value={formData.descripcion}
                      onChange={handleChange}
                      placeholder="Descripción del servicio"
                      rows="3"
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="duracion">Duración (minutos)</label>
                    <input
                      type="number"
                      id="duracion"
                      name="duracion"
                      className="input"
                      value={formData.duracion}
                      onChange={handleChange}
                      placeholder="30"
                      min="1"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="precioBase">Precio Base</label>
                    <input
                      type="number"
                      id="precioBase"
                      name="precioBase"
                      className="input"
                      value={formData.precioBase}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

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
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando servicios...</p>
          </div>
        ) : servicios.length === 0 ? (
          <div className="empty-state">
            <p>No hay servicios registrados</p>
            <button onClick={iniciarCreacion} className="btn btn-primary">
              Agregar Primer Servicio
            </button>
          </div>
        ) : (
          <div className="servicios-lista">
            {servicios.map((servicio) => (
              <div key={servicio._id} className={`servicio-card ${!servicio.activo ? 'inactivo' : ''}`}>
                <div className="servicio-card-header">
                  <div className="servicio-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="6" cy="6" r="3"/>
                      <circle cx="6" cy="18" r="3"/>
                      <line x1="20" y1="4" x2="8.12" y2="15.88"/>
                      <line x1="14.47" y1="14.48" x2="20" y2="20"/>
                      <line x1="8.12" y1="8.12" x2="12" y2="12"/>
                    </svg>
                  </div>
                  {!servicio.activo && (
                    <span className="badge-status badge-inactivo">Inactivo</span>
                  )}
                  {servicio.activo && (
                    <span className="badge-status badge-activo">Disponible</span>
                  )}
                </div>

                <div className="servicio-card-body">
                  <h3 className="servicio-nombre">{servicio.nombre}</h3>

                  {servicio.descripcion && (
                    <p className="servicio-descripcion">{servicio.descripcion}</p>
                  )}

                  <div className="servicio-info-grid">
                    <div className="info-item">
                      <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <div className="info-content">
                        <span className="info-label">Duración</span>
                        <span className="info-value">{servicio.duracion} min</span>
                      </div>
                    </div>

                    <div className="info-item">
                      <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23"/>
                        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                      </svg>
                      <div className="info-content">
                        <span className="info-label">Precio</span>
                        <span className="info-value">${servicio.precioBase}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="servicio-card-footer">
                  <button
                    onClick={() => iniciarEdicion(servicio)}
                    className="btn-icon btn-edit"
                    disabled={isLoading}
                    title="Editar servicio"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => toggleActivo(servicio._id, servicio.activo)}
                    className={`btn-icon ${servicio.activo ? 'btn-toggle-off' : 'btn-toggle-on'}`}
                    disabled={isLoading}
                    title={servicio.activo ? 'Desactivar' : 'Activar'}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {servicio.activo ? (
                        <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                      ) : (
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      )}
                    </svg>
                  </button>
                  <button
                    onClick={() => abrirModalEliminar(servicio)}
                    className="btn-icon btn-delete"
                    disabled={isLoading}
                    title="Eliminar servicio"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Confirmación de Eliminación */}
        {deleteModalOpen && servicioAEliminar && (
          <div className="modal-overlay" onClick={cerrarModalEliminar}>
            <div className="modal-content-eliminar" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Confirmar Eliminación</h2>
                <button className="modal-close" onClick={cerrarModalEliminar}>✕</button>
              </div>

              <div className="modal-body">
                <p>¿Estás seguro de que deseas eliminar el servicio?</p>
                <p className="servicio-nombre-eliminar">{servicioAEliminar.nombre}</p>
                <p className="advertencia">Esta acción no se puede deshacer.</p>
              </div>

              <div className="modal-footer">
                <button
                  onClick={cerrarModalEliminar}
                  className="btn btn-outline"
                  disabled={loadingEliminar}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEliminar}
                  className="btn btn-danger"
                  disabled={loadingEliminar}
                >
                  {loadingEliminar ? 'Eliminando...' : 'Eliminar Servicio'}
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
