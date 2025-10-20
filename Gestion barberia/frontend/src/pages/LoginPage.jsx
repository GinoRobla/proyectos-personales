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
      const resultado = await login(datosFormulario.email, datosFormulario.password);

      if (resultado.success) {
        toast.success('Sesión iniciada correctamente');
        // La redirección ahora se maneja en el useEffect
      } else {
        toast.error(resultado.message || 'Error al iniciar sesión');
        setEstaCargando(false);
      }
    } catch (error) {
      const mensajeError = error.response?.data?.message || 'Error al conectar con el servidor';
      toast.error(mensajeError);
      setEstaCargando(false);
    }
    // No necesitamos el setTimeout, useEffect se encargará de la redirección
    // No necesitamos resetear el estado de carga aquí si la redirección ocurre
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
            </div>

            <button type="submit" className="btn btn-primary" disabled={estaCargando}>
              {estaCargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

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