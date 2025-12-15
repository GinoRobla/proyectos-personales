import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import './AuthPages.css';

const ResetearContrasena = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [token, setToken] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validandoToken, setValidandoToken] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);

  // Extraer token de la URL al cargar
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');

    if (!tokenFromUrl) {
      toast.error('Token no encontrado en la URL', 4000);
      setValidandoToken(false);
      return;
    }

    setToken(tokenFromUrl);
    validarToken(tokenFromUrl);
  }, [searchParams]);

  // Validar token con el backend
  const validarToken = async (tokenToValidate) => {
    try {
      const response = await api.post('/auth/validar-token-recuperacion', {
        token: tokenToValidate,
      });

      if (response.data.valido) {
        setTokenValido(true);
      } else {
        setTokenValido(false);
        toast.error('El enlace es inválido o ha expirado', 4000);
      }
    } catch (error) {
      console.error('Error al validar token:', error);
      setTokenValido(false);
      toast.error('El enlace es inválido o ha expirado', 4000);
    } finally {
      setValidandoToken(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validaciones frontend
    if (nuevaPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres', 4000);
      setLoading(false);
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      toast.error('Las contraseñas no coinciden', 4000);
      setLoading(false);
      return;
    }

    // Validar complejidad
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(nuevaPassword)) {
      toast.error(
        'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
        5000
      );
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/resetear-contrasena', {
        token,
        nuevaPassword,
      });

      toast.success('¡Contraseña actualizada! Ya puedes iniciar sesión', 5000);

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error al resetear contraseña:', error);

      const mensajeError =
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        'Error al actualizar la contraseña. Intenta de nuevo';

      toast.error(mensajeError, 5000);
      setLoading(false);
    }
  };

  // Mientras valida el token
  if (validandoToken) {
    return (
      <div className="auth-page">
        <div className="container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="brand-logo">
                <h1 className="brand-name">Barbería GR</h1>
              </div>
              <h2>Validando enlace...</h2>
              <div style={{ marginTop: '20px' }}>
                <div className="spinner"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si el token no es válido
  if (!tokenValido) {
    return (
      <div className="auth-page">
        <div className="container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="brand-logo">
                <h1 className="brand-name">Barbería GR</h1>
              </div>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
              <h2>Enlace Inválido</h2>
              <p>Este enlace ha expirado o ya fue utilizado</p>
            </div>

            <div className="error-message">
              <p>El enlace de recuperación tiene una validez de 1 hora.</p>
              <p style={{ marginTop: '10px' }}>
                Por favor, solicita un nuevo enlace para recuperar tu contraseña.
              </p>
            </div>

            <div className="auth-footer" style={{ marginTop: '30px' }}>
              <Link to="/solicitar-recuperacion" className="btn btn-primary">
                Solicitar Nuevo Enlace
              </Link>
              <div style={{ marginTop: '15px' }}>
                <Link to="/" className="auth-link">
                  ← Volver al login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Formulario para resetear contraseña
  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="brand-logo">
              <h1 className="brand-name">Barbería GR</h1>
            </div>
            <h2>Nueva Contraseña</h2>
            <p>Ingresa tu nueva contraseña</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="nuevaPassword" className="input-label">
                Nueva Contraseña
              </label>
              <input
                type="password"
                id="nuevaPassword"
                className="input"
                placeholder="Mínimo 8 caracteres"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                required
                autoFocus
                minLength={8}
                autoComplete="new-password"
              />
              <small style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Debe contener mayúscula, minúscula y número
              </small>
            </div>

            <div className="input-group">
              <label htmlFor="confirmarPassword" className="input-label">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                id="confirmarPassword"
                className="input"
                placeholder="Repite tu contraseña"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </form>

          <div className="auth-footer">
            <Link to="/" className="auth-link">
              ← Volver al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetearContrasena;