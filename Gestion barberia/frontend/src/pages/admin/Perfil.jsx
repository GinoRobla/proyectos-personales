import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import perfilService from '../../services/perfilService';

const AdminPerfil = () => {
  const { usuario, actualizarUsuario } = useAuth();
  const { mostrarToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Estado para datos del perfil
  const [perfil, setPerfil] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    foto: '',
  });

  // Estado para cambio de contraseña
  const [passwords, setPasswords] = useState({
    passwordActual: '',
    passwordNuevo: '',
    passwordConfirmar: '',
  });

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      const response = await perfilService.obtenerMiPerfil();
      setPerfil({
        nombre: response.data.nombre,
        apellido: response.data.apellido,
        email: response.data.email,
        telefono: response.data.telefono,
        foto: response.data.foto || '',
      });
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      mostrarToast('Error al cargar el perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setPerfil({
      ...perfil,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!perfil.nombre || !perfil.apellido || !perfil.email || !perfil.telefono) {
      mostrarToast('Por favor completa todos los campos obligatorios', 'error');
      return;
    }

    // Validar contraseñas si se están cambiando
    if (passwords.passwordActual || passwords.passwordNuevo || passwords.passwordConfirmar) {
      if (!passwords.passwordActual || !passwords.passwordNuevo || !passwords.passwordConfirmar) {
        mostrarToast('Para cambiar la contraseña, completa todos los campos de contraseña', 'error');
        return;
      }

      if (passwords.passwordNuevo !== passwords.passwordConfirmar) {
        mostrarToast('Las contraseñas nuevas no coinciden', 'error');
        return;
      }

      if (passwords.passwordNuevo.length < 6) {
        mostrarToast('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
      }
    }

    try {
      setGuardando(true);

      // Actualizar perfil
      const response = await perfilService.actualizarMiPerfil(perfil);
      actualizarUsuario(response.data);

      // Cambiar contraseña si se proporcionaron los datos
      if (passwords.passwordActual && passwords.passwordNuevo) {
        await perfilService.cambiarPassword(passwords.passwordActual, passwords.passwordNuevo);
        setPasswords({
          passwordActual: '',
          passwordNuevo: '',
          passwordConfirmar: '',
        });
        mostrarToast('Perfil y contraseña actualizados correctamente', 'success');
      } else {
        mostrarToast('Perfil actualizado correctamente', 'success');
      }
    } catch (error) {
      console.error('Error al actualizar:', error);
      mostrarToast(
        error.response?.data?.message || 'Error al actualizar el perfil',
        'error'
      );
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', fontSize: '1.75rem', fontWeight: '600' }}>
        Mi Perfil
      </h1>

      {/* Todo junto en una sola card */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Información Personal */}
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            Información Personal
          </h2>

          <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                value={perfil.nombre}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Apellido *
              </label>
              <input
                type="text"
                name="apellido"
                value={perfil.apellido}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={perfil.email}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Teléfono *
              </label>
              <input
                type="tel"
                name="telefono"
                value={perfil.telefono}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          {/* Divisor */}
          <div style={{
            margin: '2rem 0',
            borderTop: '1px solid #e9ecef'
          }}></div>

          {/* Cambio de Contraseña */}
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Cambiar Contraseña
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '1.5rem' }}>
            Deja estos campos en blanco si no deseas cambiar tu contraseña
          </p>

          <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Contraseña Actual
              </label>
              <input
                type="password"
                name="passwordActual"
                value={passwords.passwordActual}
                onChange={handlePasswordChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Nueva Contraseña
              </label>
              <input
                type="password"
                name="passwordNuevo"
                value={passwords.passwordNuevo}
                onChange={handlePasswordChange}
                minLength={6}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                name="passwordConfirmar"
                value={passwords.passwordConfirmar}
                onChange={handlePasswordChange}
                minLength={6}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          {/* Botones */}
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={guardando}
              style={{
                padding: '0.75rem 2rem',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: guardando ? 'not-allowed' : 'pointer',
                opacity: guardando ? 0.6 : 1
              }}
            >
              {guardando ? 'Guardando...' : 'Guardar Cambios'}
            </button>

            {(passwords.passwordActual || passwords.passwordNuevo || passwords.passwordConfirmar) && (
              <button
                type="button"
                onClick={() => {
                  setPasswords({
                    passwordActual: '',
                    passwordNuevo: '',
                    passwordConfirmar: '',
                  });
                }}
                style={{
                  padding: '0.75rem 2rem',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Limpiar Contraseñas
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPerfil;
