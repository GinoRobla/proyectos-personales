import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import servicioService from '../../services/servicioService';
import './Servicios.css';

const AdminServicios = () => {
  const toast = useToast();
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [creando, setCreando] = useState(false);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [servicioAEliminar, setServicioAEliminar] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    duracion: '',
    precioBase: '',
  });

  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    try {
      setLoading(true);
      const data = await servicioService.obtenerServicios();
      setServicios(data.data || data || []);
    } catch (err) {
      toast.error('Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  };

  const iniciarCreacion = () => {
    setCreando(true);
    setFormData({
      nombre: '',
      descripcion: '',
      duracion: '',
      precioBase: '',
    });
  };

  const iniciarEdicion = (servicio) => {
    setEditando(servicio._id);
    setFormData({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      duracion: servicio.duracion,
      precioBase: servicio.precioBase,
    });
  };

  const cancelar = () => {
    setEditando(null);
    setCreando(false);
    setFormData({
      nombre: '',
      descripcion: '',
      duracion: '',
      precioBase: '',
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const crearServicio = async () => {
    try {
      await servicioService.crearServicio(formData);
      toast.success('Servicio creado correctamente');
      setCreando(false);
      setFormData({ nombre: '', descripcion: '', duracion: '', precioBase: '' });
      cargarServicios();
    } catch (err) {
      toast.error('Error al crear servicio');
    }
  };

  const guardarCambios = async (servicioId) => {
    try {
      await servicioService.actualizarServicio(servicioId, formData);
      toast.success('Servicio actualizado correctamente');
      setEditando(null);
      cargarServicios();
    } catch (err) {
      toast.error('Error al actualizar servicio');
    }
  };

  const abrirModalEliminar = (servicio) => {
    setServicioAEliminar(servicio);
    setMostrarModalEliminar(true);
  };

  const cerrarModalEliminar = () => {
    setMostrarModalEliminar(false);
    setServicioAEliminar(null);
  };

  const confirmarEliminar = async () => {
    try {
      await servicioService.eliminarServicio(servicioAEliminar._id);
      toast.success('Servicio eliminado correctamente');
      cerrarModalEliminar();
      cargarServicios();
    } catch (err) {
      toast.error('Error al eliminar servicio');
    }
  };

  return (
    <div className="admin-servicios">
      <div className="container">
        <div className="header-con-boton">
          <h1>Gestionar Servicios</h1>
          <button onClick={iniciarCreacion} className="btn btn-primary">
            Nuevo Servicio
          </button>
        </div>

        {/* Formulario de creación */}
        {creando && (
          <>
            <div className="modal-overlay-form" onClick={() => setCreando(false)}>
              <div className="modal-content-form" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-form">
                  <h3>Crear Nuevo Servicio</h3>
                  <button className="modal-close" onClick={() => setCreando(false)}>✕</button>
                </div>
                <div className="modal-body-form">
            <div className="servicio-form">
              <div className="input-group">
                <label className="input-label">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  className="input"
                  value={formData.nombre}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Descripción</label>
                <textarea
                  name="descripcion"
                  className="input"
                  rows="2"
                  value={formData.descripcion}
                  onChange={handleChange}
                />
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label className="input-label">Duración (min)</label>
                  <input
                    type="number"
                    name="duracion"
                    className="input"
                    value={formData.duracion}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Precio</label>
                  <input
                    type="number"
                    name="precioBase"
                    className="input"
                    value={formData.precioBase}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="servicio-acciones">
                <button onClick={crearServicio} className="btn btn-primary btn-sm">
                  Crear
                </button>
                <button onClick={cancelar} className="btn btn-outline btn-sm">
                  Cancelar
                </button>
              </div>
            </div>
                </div>
              </div>
            </div>
          </>
        )}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando servicios...</p>
          </div>
        ) : (
          <div className="servicios-lista">
            {servicios.map((servicio) => (
              <div key={servicio._id} className={`servicio-card ${!servicio.activo ? 'inactivo' : ''}`}>
                {editando === servicio._id ? (
                  <div className="servicio-form">
                    <div className="input-group">
                      <label className="input-label">Nombre</label>
                      <input
                        type="text"
                        name="nombre"
                        className="input"
                        value={formData.nombre}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Descripción</label>
                      <textarea
                        name="descripcion"
                        className="input"
                        rows="2"
                        value={formData.descripcion}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="input-row">
                      <div className="input-group">
                        <label className="input-label">Duración (min)</label>
                        <input
                          type="number"
                          name="duracion"
                          className="input"
                          value={formData.duracion}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="input-group">
                        <label className="input-label">Precio</label>
                        <input
                          type="number"
                          name="precioBase"
                          className="input"
                          value={formData.precioBase}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="servicio-acciones">
                      <button
                        onClick={() => guardarCambios(servicio._id)}
                        className="btn btn-primary btn-sm"
                      >
                        Guardar
                      </button>
                      <button onClick={cancelar} className="btn btn-outline btn-sm">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="servicio-info">
                    <div className="servicio-header">
                      <h3>{servicio.nombre}</h3>
                      <span className="servicio-precio">${servicio.precioBase}</span>
                    </div>
                    <p className="servicio-descripcion">{servicio.descripcion}</p>
                    <div className="servicio-detalles">
                      <span>Duración: {servicio.duracion} min</span>
                      <span className={servicio.activo ? 'activo' : 'inactivo'}>
                        {servicio.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className="servicio-acciones">
                      <button
                        onClick={() => iniciarEdicion(servicio)}
                        className="btn btn-outline btn-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => abrirModalEliminar(servicio)}
                        className="btn btn-danger btn-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal de Confirmación de Eliminación */}
        {mostrarModalEliminar && servicioAEliminar && (
          <div className="modal-overlay" onClick={cerrarModalEliminar}>
            <div className="modal-content-eliminar" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Confirmar Eliminación</h2>
                <button className="modal-close" onClick={cerrarModalEliminar}>✕</button>
              </div>

              <div className="modal-body">
                <p className="modal-texto-principal">
                  ¿Eliminar el servicio <strong>{servicioAEliminar.nombre}</strong>?
                </p>
                <p className="modal-texto-advertencia">
                  Esta acción no se puede deshacer.
                </p>
              </div>

              <div className="modal-footer">
                <button onClick={cerrarModalEliminar} className="btn btn-outline">
                  Cancelar
                </button>
                <button onClick={confirmarEliminar} className="btn btn-danger">
                  Eliminar Servicio
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