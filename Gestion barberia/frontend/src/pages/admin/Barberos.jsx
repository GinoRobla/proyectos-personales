import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import barberoService from '../../services/barberoService';
import './Barberos.css';

const AdminBarberos = () => {
  const toast = useToast();
  const [barberos, setBarberos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [creando, setCreando] = useState(false);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [barberoAEliminar, setBarberoAEliminar] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '',
  });

  useEffect(() => {
    cargarBarberos();
  }, []);

  const cargarBarberos = async () => {
    try {
      setLoading(true);
      const data = await barberoService.obtenerBarberos();
      setBarberos(data.data || data || []);
    } catch (err) {
      toast.error('Error al cargar barberos');
    } finally {
      setLoading(false);
    }
  };

  const iniciarCreacion = () => {
    setCreando(true);
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      password: '',
    });
  };

  const iniciarEdicion = (barbero) => {
    setEditando(barbero._id);
    setFormData({
      nombre: barbero.nombre,
      apellido: barbero.apellido,
      email: barbero.email,
      telefono: barbero.telefono,
      password: '',
    });
  };

  const cancelar = () => {
    setEditando(null);
    setCreando(false);
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      password: '',
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const crearBarbero = async () => {
    try {
      await barberoService.crearBarbero(formData);
      toast.success('Barbero creado correctamente');
      setCreando(false);
      setFormData({ nombre: '', apellido: '', email: '', telefono: '', password: '' });
      cargarBarberos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear barbero');
    }
  };

  const guardarCambios = async (barberoId) => {
    try {
      const datos = { ...formData };
      if (!datos.password) delete datos.password; // No enviar password si está vacío

      await barberoService.actualizarBarbero(barberoId, datos);
      toast.success('Barbero actualizado correctamente');
      setEditando(null);
      cargarBarberos();
    } catch (err) {
      toast.error('Error al actualizar barbero');
    }
  };

  const toggleActivo = async (barberoId, activoActual) => {
    try {
      await barberoService.actualizarBarbero(barberoId, { activo: !activoActual });
      toast.success(!activoActual ? 'Barbero activado' : 'Barbero desactivado');
      cargarBarberos();
    } catch (err) {
      toast.error('Error al cambiar estado del barbero');
    }
  };

  const abrirModalEliminar = (barbero) => {
    setBarberoAEliminar(barbero);
    setMostrarModalEliminar(true);
  };

  const cerrarModalEliminar = () => {
    setMostrarModalEliminar(false);
    setBarberoAEliminar(null);
  };

  const confirmarEliminar = async () => {
    try {
      await barberoService.eliminarBarbero(barberoAEliminar._id);
      toast.success('Barbero eliminado correctamente');
      cerrarModalEliminar();
      cargarBarberos();
    } catch (err) {
      toast.error('Error al eliminar barbero');
    }
  };

  return (
    <div className="admin-barberos">
      <div className="container">
        <div className="header-con-boton">
          <h1>Gestionar Barberos</h1>
          <button onClick={iniciarCreacion} className="btn btn-primary">
            Nuevo Barbero
          </button>
        </div>

        {/* Formulario de creación */}
        {creando && (
          <>
            <div className="modal-overlay-form" onClick={() => setCreando(false)}>
              <div className="modal-content-form" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-form">
                  <h3>Crear Nuevo Barbero</h3>
                  <button className="modal-close" onClick={() => setCreando(false)}>✕</button>
                </div>
                <div className="modal-body-form">
            <div className="barbero-form">
              <div className="input-row">
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
                  <label className="input-label">Apellido</label>
                  <input
                    type="text"
                    name="apellido"
                    className="input"
                    value={formData.apellido}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label className="input-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="input"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    className="input"
                    value={formData.telefono}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Contraseña</label>
                <input
                  type="password"
                  name="password"
                  className="input"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div className="barbero-acciones">
                <button onClick={crearBarbero} className="btn btn-primary btn-sm">
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
            <p>Cargando barberos...</p>
          </div>
        ) : (
          <div className="barberos-lista">
            {barberos.map((barbero) => (
              <div key={barbero._id} className={`barbero-card ${!barbero.activo ? 'inactivo' : ''}`}>
                {editando === barbero._id ? (
                  <div className="barbero-form">
                    <div className="input-row">
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
                        <label className="input-label">Apellido</label>
                        <input
                          type="text"
                          name="apellido"
                          className="input"
                          value={formData.apellido}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Teléfono</label>
                      <input
                        type="tel"
                        name="telefono"
                        className="input"
                        value={formData.telefono}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="barbero-acciones">
                      <button
                        onClick={() => guardarCambios(barbero._id)}
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
                  <div className="barbero-info">
                    <div className="barbero-header">
                      <div className="barbero-avatar">
                        {barbero.nombre?.charAt(0)}{barbero.apellido?.charAt(0)}
                      </div>
                      <div className="barbero-datos">
                        <h3>{barbero.nombre} {barbero.apellido}</h3>
                        <div className="barbero-contacto">
                          <span>📧 {barbero.email}</span>
                          <span>📱 {barbero.telefono}</span>
                          <span className={barbero.activo ? 'activo' : 'inactivo'}>
                            {barbero.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="barbero-acciones">
                      <button
                        onClick={() => iniciarEdicion(barbero)}
                        className="btn btn-outline btn-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleActivo(barbero._id, barbero.activo)}
                        className={`btn btn-sm ${barbero.activo ? 'btn-warning' : 'btn-primary'}`}
                      >
                        {barbero.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => abrirModalEliminar(barbero)}
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
        {mostrarModalEliminar && barberoAEliminar && (
          <div className="modal-overlay" onClick={cerrarModalEliminar}>
            <div className="modal-content-eliminar" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Confirmar Eliminación</h2>
                <button className="modal-close" onClick={cerrarModalEliminar}>✕</button>
              </div>

              <div className="modal-body">
                <p className="modal-texto-principal">
                  ¿Eliminar a <strong>{barberoAEliminar.nombre} {barberoAEliminar.apellido}</strong>?
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
                  Eliminar Barbero
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