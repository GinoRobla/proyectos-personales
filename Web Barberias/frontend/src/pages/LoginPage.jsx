/**
 * ============================================================================
 * PÁGINA: LOGIN (Refactorizada)
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useFormData from '../hooks/useFormData'; // Importar el nuevo hook
import './AuthPages.css';

const LoginPage = () => {
  // Hooks y contextos
  const navegar = useNavigate();
  const { login, estaAutenticado, usuario } = useAuth();
  const toast = useToast();

  // Hook para manejar el formulario
  const { values: datosFormulario, handleChange: manejarCambioEnCampo } = useFormData({
    email: '',
    password: '',
  });

  // Estado local para el botón de carga (podría integrarse con useApi si se prefiere)
  const [estaCargando, setEstaCargando] = useState(false);

  // Efecto para redirigir si ya está autenticado (sin cambios)
  useEffect(() => {
    if (estaAutenticado && usuario) {
      const rol = usuario.rol;
      if (rol === 'admin') navegar('/admin');
      else if (rol === 'barbero') navegar('/barbero');
      else navegar('/cliente');
    }
  }, [estaAutenticado, usuario, navegar]);

  /**
   * MANEJAR ENVÍO DE FORMULARIO (Simplificado)
   */
  const manejarEnvioDeFormulario = async (evento) => {
    evento.preventDefault();
    setEstaCargando(true);

    try {
      console.log('[FRONTEND] Intentando login con:', datosFormulario.email);
      const resultado = await login(datosFormulario.email, datosFormulario.password);
      console.log('[FRONTEND] Resultado del login:', resultado);

      if (resultado.success) {
        toast.success('¡Bienvenido! Sesión iniciada correctamente', 3000);
        // La redirección ahora se maneja en el useEffect
      } else {
        console.log('[FRONTEND] Error en login:', resultado.message);
        // Los mensajes de error ahora vienen del backend mejorado
        toast.error(resultado.message || 'Error al iniciar sesión', 4000);
        setEstaCargando(false);
      }
    } catch (error) {
      console.error('[FRONTEND] Error capturado:', error);
      // Mensajes de error específicos según el tipo de error
      let mensajeError = 'Error al conectar con el servidor';

      if (error.response?.data) {
        // Error del servidor (backend)
        // Chequear tanto 'mensaje' (español) como 'message' (inglés)
        mensajeError = error.response.data.mensaje || error.response.data.message || mensajeError;
      } else if (error.message) {
        // Error de la aplicación
        mensajeError = error.message;
      } else if (!navigator.onLine) {
        // Sin conexión a internet
        mensajeError = 'No tienes conexión a internet. Verifica tu conexión';
      }

      console.log('[FRONTEND] Mostrando error:', mensajeError);
      toast.error(mensajeError, 4000);
      setEstaCargando(false);
    }
  };

  // Renderizado (se reemplaza datosFormulario.email por values.email, etc.)
  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="brand-logo">
              <h1 className="brand-name">Barbería GR</h1>
            </div>
            <h2>Iniciar Sesión</h2>
            <p>Ingresa a tu cuenta</p>
          </div>

          <form onSubmit={manejarEnvioDeFormulario} className="auth-form">
            <div className="input-group">
              <label htmlFor="email" className="input-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="input"
                placeholder="tu@email.com"
                value={datosFormulario.email} // Usamos el estado del hook
                onChange={manejarCambioEnCampo} // Usamos el handler del hook
                required
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password" className="input-label">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                className="input"
                placeholder="••••••••"
                value={datosFormulario.password} // Usamos el estado del hook
                onChange={manejarCambioEnCampo} // Usamos el handler del hook
                required
                autoComplete="current-password"
              />
              <div style={{ textAlign: 'right', marginTop: '8px' }}>
                <Link to="/solicitar-recuperacion" className="auth-link" style={{ fontSize: '14px' }}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={estaCargando}>
              {estaCargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div style={{ margin: '20px 0', textAlign: 'center', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '1px',
              background: '#ddd',
              zIndex: 0
            }}></div>
            <span style={{
              position: 'relative',
              background: 'white',
              padding: '0 15px',
              color: '#666',
              fontSize: '14px',
              zIndex: 1
            }}>
              O continúa con
            </span>
          </div>

          <a
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/google`}
            className="btn"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              background: 'white',
              color: '#333',
              border: '1px solid #ddd',
              marginTop: '15px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"></path>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"></path>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"></path>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"></path>
            </svg>
            Continuar con Google
          </a>

          <div className="auth-footer">
            <p>
              ¿No tienes cuenta?{' '}
              <Link to="/registro" className="auth-link">Regístrate aquí</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;