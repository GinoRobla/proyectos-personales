import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import authService from '../../services/authService';
import './ClientePerfil.css';

const ClientePerfil = () => {
  const { usuario, actualizarUsuario } = useAuth();
  const toast = useToast();

  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
  });

  const [cambiarPassword, setCambiarPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    passwordActual: '',
    passwordNuevo: '',
    passwordConfirm: '',
  });

  useEffect(() => {
    if (usuario) {
      setFormData({
        nombre: usuario.nombre || '',
        apellido: usuario.apellido || '',
        telefono: usuario.telefono || '',
        email: usuario.email || '',
      });
    }
  }, [usuario]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Actualizar perfil
      const response = await authService.actualizarPerfil({
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono,
      });

      if (response.success) {
        actualizarUsuario(response.data);

        // Si también quiere cambiar contraseña
        if (cambiarPassword && passwordData.passwordActual && passwordData.passwordNuevo) {
          if (passwordData.passwordNuevo !== passwordData.passwordConfirm) {
            toast.error('Las contraseñas no coinciden');
            setLoading(false);
            return;
          }

          if (passwordData.passwordNuevo.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            setLoading(false);
            return;
          }

          try {
            const passwordResponse = await authService.cambiarPassword(
              passwordData.passwordActual,
              passwordData.passwordNuevo
            );

            if (passwordResponse.success) {
              toast.success('Perfil y contraseña actualizados correctamente');
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Error al cambiar contraseña');
            setLoading(false);
            return;
          }
        } else {
          toast.success('Perfil actualizado correctamente');
        }

        setEditando(false);
        setCambiarPassword(false);
        setPasswordData({
          passwordActual: '',
          passwordNuevo: '',
          passwordConfirm: '',
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="perfil-page">
      <div className="container">
        <h1>Mi Perfil</h1>

        {/* Información del Perfil */}
        <div className="perfil-card">
          <div className="perfil-header">
            <div className="perfil-avatar">
              {usuario?.nombre?.charAt(0)}{usuario?.apellido?.charAt(0)}
            </div>
            <div className="perfil-info">
              <h2>{usuario?.nombre} {usuario?.apellido}</h2>
              <p className="perfil-rol">{usuario?.rol}</p>
            </div>
          </div>

          {!editando ? (
            <div className="perfil-detalles">
              <div className="detalle-item">
                <span className="label">Nombre:</span>
                <span className="valor">{usuario?.nombre}</span>
              </div>
              <div className="detalle-item">
                <span className="label">Apellido:</span>
                <span className="valor">{usuario?.apellido}</span>
              </div>
              <div className="detalle-item">
                <span className="label">Email:</span>
                <span className="valor">{usuario?.email}</span>
              </div>
              <div className="detalle-item">
                <span className="label">Teléfono:</span>
                <span className="valor">{usuario?.telefono}</span>
              </div>

              <div className="perfil-acciones">
                <button
                  onClick={() => setEditando(true)}
                  className="btn btn-primary"
                >
                  Editar Perfil
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="perfil-form">
              <h3>Información Personal</h3>

              <div className="input-group">
                <label htmlFor="nombre" className="input-label">
                  Nombre
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  className="input"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="apellido" className="input-label">
                  Apellido
                </label>
                <input
                  type="text"
                  id="apellido"
                  name="apellido"
                  className="input"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="email" className="input-label">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="input"
                  value={formData.email}
                  disabled
                />
                <small className="input-hint">El email no se puede modificar</small>
              </div>

              <div className="input-group">
                <label htmlFor="telefono" className="input-label">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  className="input"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Opción para cambiar contraseña */}
              <div className="cambiar-password-toggle">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={cambiarPassword}
                    onChange={(e) => setCambiarPassword(e.target.checked)}
                  />
                  <span>Cambiar contraseña</span>
                </label>
              </div>

              {/* Campos de contraseña (condicionales) */}
              {cambiarPassword && (
                <>
                  <h3 className="section-title">Cambiar Contraseña</h3>

                  <div className="input-group">
                    <label htmlFor="passwordActual" className="input-label">
                      Contraseña Actual
                    </label>
                    <input
                      type="password"
                      id="passwordActual"
                      name="passwordActual"
                      className="input"
                      value={passwordData.passwordActual}
                      onChange={handlePasswordChange}
                      required={cambiarPassword}
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="passwordNuevo" className="input-label">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      id="passwordNuevo"
                      name="passwordNuevo"
                      className="input"
                      value={passwordData.passwordNuevo}
                      onChange={handlePasswordChange}
                      required={cambiarPassword}
                    />
                    <small className="input-hint">Mínimo 6 caracteres</small>
                  </div>

                  <div className="input-group">
                    <label htmlFor="passwordConfirm" className="input-label">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      id="passwordConfirm"
                      name="passwordConfirm"
                      className="input"
                      value={passwordData.passwordConfirm}
                      onChange={handlePasswordChange}
                      required={cambiarPassword}
                    />
                  </div>
                </>
              )}

              <div className="perfil-acciones">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditando(false);
                    setCambiarPassword(false);
                    setFormData({
                      nombre: usuario?.nombre || '',
                      apellido: usuario?.apellido || '',
                      telefono: usuario?.telefono || '',
                      email: usuario?.email || '',
                    });
                    setPasswordData({
                      passwordActual: '',
                      passwordNuevo: '',
                      passwordConfirm: '',
                    });
                  }}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientePerfil;