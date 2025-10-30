// frontend/src/pages/admin/Barberos.jsx

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import barberoService from '../../services/barberoService';
import useFormData from '../../hooks/useFormData';
import useModal from '../../hooks/useModal';
import useApi from '../../hooks/useApi';
import './Barberos.css';

const initialFormState = {
  nombre: '', apellido: '', email: '', telefono: '', password: '',
};

const AdminBarberos = () => {
  const toast = useToast();
  const [barberos, setBarberos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [barberoAEliminar, setBarberoAEliminar] = useState(null);

  // --- HOOKS DE ESTADO ---
  const { values: formData, handleChange, setValues, resetForm } = useFormData(initialFormState);
  const { isOpen: formModalOpen, openModal: openFormModal, closeModal: closeFormModal } = useModal();
  const { isOpen: deleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();

  // --- HOOKS DE API ---
  const { loading: loadingBarberos, request: cargarBarberosApi } = useApi(barberoService.obtenerBarberos);
  const { loading: loadingGuardar, request: guardarBarberoApi } = useApi(barberoService.crearBarbero);
  const { loading: loadingActualizar, request: actualizarBarberoApi } = useApi(barberoService.actualizarBarbero);
  const { loading: loadingEliminar, request: eliminarBarberoApi } = useApi(barberoService.eliminarBarbero);

  const isLoading = loadingBarberos || loadingGuardar || loadingActualizar || loadingEliminar;

  // --- FUNCIONES DE DATOS ---
  const cargarBarberos = useCallback(async () => {
    const { success, data, message } = await cargarBarberosApi();
    if (success) {
      setBarberos(data || []);
    } else {
      toast.error(message || 'Error al cargar la lista de barberos', 4000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarBarberos();
  }, [cargarBarberos]);

  const guardarBarbero = async () => {
    // Validaciones del frontend antes de enviar
    if (!formData.nombre.trim() || !formData.apellido.trim()) {
      toast.error('Nombre y apellido son obligatorios', 4000);
      return;
    }

    if (!formData.email.trim()) {
      toast.error('El email es obligatorio', 4000);
      return;
    }

    if (!formData.telefono.trim()) {
      toast.error('El teléfono es obligatorio', 4000);
      return;
    }

    if (!editandoId && !formData.password) {
      toast.error('La contraseña es obligatoria para nuevos barberos', 4000);
      return;
    }

    if (formData.password && formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres', 4000);
      return;
    }

    let response;

    if (editandoId) {
      const datos = { ...formData };
      if (!datos.password) delete datos.password;
      response = await actualizarBarberoApi(editandoId, datos);
    } else {
      response = await guardarBarberoApi(formData);
    }

    if (response.success) {
      toast.success(`Barbero ${editandoId ? 'actualizado' : 'creado'} exitosamente`, 3000);
      cancelarFormulario();
      cargarBarberos();
    } else {
      // Mostrar mensajes de error específicos del backend
      const mensaje = response.message || `Error al ${editandoId ? 'actualizar' : 'crear'} barbero`;
      toast.error(mensaje, 4000);
    }
  };

  const toggleActivo = async (barberoId, activoActual) => {
    const response = await actualizarBarberoApi(barberoId, { activo: !activoActual });
    if (response.success) {
      toast.success(!activoActual ? 'Barbero activado correctamente' : 'Barbero desactivado correctamente', 3000);
      cargarBarberos();
    } else {
      toast.error('No se pudo actualizar el estado del barbero', 4000);
    }
  };

  const confirmarEliminar = async () => {
    if (!barberoAEliminar) return;
    const response = await eliminarBarberoApi(barberoAEliminar._id);
    if (response.success) {
      toast.success('Barbero eliminado correctamente', 3000);
      cerrarModalEliminar();
      cargarBarberos();
    } else {
      const mensaje = response.message || 'No se pudo eliminar el barbero. Verifica que no tenga turnos asignados';
      toast.error(mensaje, 4000);
    }
  };

  // --- FUNCIONES DE UI ---
  const iniciarCreacion = () => {
    resetForm();
    setEditandoId(null);
    openFormModal();
  };

  const iniciarEdicion = (barbero) => {
    setEditandoId(barbero._id);
    setValues({
      nombre: barbero.nombre || '',
      apellido: barbero.apellido || '',
      email: barbero.email || '',
      telefono: barbero.telefono || '',
      password: '',
    });
    openFormModal();
  };

  const cancelarFormulario = () => {
    closeFormModal();
    resetForm();
    setEditandoId(null);
  };

  const abrirModalEliminar = (barbero) => {
    setBarberoAEliminar(barbero);
    openDeleteModal();
  };

  const cerrarModalEliminar = () => {
    closeDeleteModal();
    setBarberoAEliminar(null);
  };

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
              <div className="modal-header-form">
                <h2>{editandoId ? 'Editar Barbero' : 'Nuevo Barbero'}</h2>
                <button className="modal-close" onClick={cancelarFormulario}>✕</button>
              </div>

              <div className="modal-body-form">
                <div className="input-group">
                  <label htmlFor="nombre">Nombre</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    className="input"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Nombre del barbero"
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="apellido">Apellido</label>
                  <input
                    type="text"
                    id="apellido"
                    name="apellido"
                    className="input"
                    value={formData.apellido}
                    onChange={handleChange}
                    placeholder="Apellido del barbero"
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="input"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@ejemplo.com"
                    required
                    disabled={!!editandoId}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="telefono">Teléfono</label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    className="input"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="Teléfono de contacto"
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="password">
                    {editandoId ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="input"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={editandoId ? 'Dejar vacío para mantener la actual' : 'Contraseña'}
                    required={!editandoId}
                  />
                </div>

                <div className="barbero-acciones">
                  <button
                    onClick={guardarBarbero}
                    className="btn btn-primary btn-sm"
                    disabled={loadingGuardar || loadingActualizar}
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
        ) : barberos.length === 0 ? (
          <div className="empty-state">
            <p>No hay barberos registrados</p>
            <button onClick={iniciarCreacion} className="btn btn-primary">
              Agregar Primer Barbero
            </button>
          </div>
        ) : (
          <div className="barberos-lista">
            {barberos.map((barbero) => (
              <div key={barbero._id} className={`barbero-card ${!barbero.activo ? 'inactivo' : ''}`}>
                <div className="barbero-card-header">
                  <div className="barbero-avatar">
                    {barbero.nombre.charAt(0)}{barbero.apellido.charAt(0)}
                  </div>
                  {!barbero.activo && (
                    <span className="badge-status badge-inactivo">Inactivo</span>
                  )}
                  {barbero.activo && (
                    <span className="badge-status badge-activo">Activo</span>
                  )}
                </div>

                <div className="barbero-card-body">
                  <h3 className="barbero-nombre">{barbero.nombre} {barbero.apellido}</h3>

                  <div className="barbero-info-grid">
                    <div className="info-item">
                      <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                      <span className="info-text">{barbero.email}</span>
                    </div>

                    <div className="info-item">
                      <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                      </svg>
                      <span className="info-text">{barbero.telefono || 'No especificado'}</span>
                    </div>
                  </div>
                </div>

                <div className="barbero-card-footer">
                  <button
                    onClick={() => iniciarEdicion(barbero)}
                    className="btn-icon btn-edit"
                    disabled={isLoading}
                    title="Editar barbero"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => toggleActivo(barbero._id, barbero.activo)}
                    className={`btn-icon ${barbero.activo ? 'btn-toggle-off' : 'btn-toggle-on'}`}
                    disabled={isLoading}
                    title={barbero.activo ? 'Desactivar' : 'Activar'}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {barbero.activo ? (
                        <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                      ) : (
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      )}
                    </svg>
                  </button>
                  <button
                    onClick={() => abrirModalEliminar(barbero)}
                    className="btn-icon btn-delete"
                    disabled={isLoading}
                    title="Eliminar barbero"
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
        {deleteModalOpen && barberoAEliminar && (
          <div className="modal-overlay" onClick={cerrarModalEliminar}>
            <div className="modal-content-eliminar" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Confirmar Eliminación</h2>
                <button className="modal-close" onClick={cerrarModalEliminar}>✕</button>
              </div>

              <div className="modal-body">
                <p>¿Estás seguro de que deseas eliminar al barbero?</p>
                <p className="barbero-nombre-eliminar">
                  {barberoAEliminar.nombre} {barberoAEliminar.apellido}
                </p>
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
