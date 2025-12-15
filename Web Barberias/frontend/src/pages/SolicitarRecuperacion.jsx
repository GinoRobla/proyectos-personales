import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import './AuthPages.css';

const SolicitarRecuperacion = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validación básica
    if (!email || !email.includes('@')) {
      toast.error('Por favor ingresa un email válido', 4000);
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/solicitar-recuperacion', { email });

      setEmailEnviado(true);
      toast.success('¡Email enviado! Revisa tu bandeja de entrada', 5000);
    } catch (error) {
      console.error('Error al solicitar recuperación:', error);

      // Siempre mostrar el mismo mensaje (el backend también lo hace por seguridad)
      setEmailEnviado(true);
      toast.success('Si el email existe, recibirás instrucciones', 5000);
    } finally {
      setLoading(false);
    }
  };

  if (emailEnviado) {
    return (
      <div className="auth-page">
        <div className="container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="brand-logo">
                <h1 className="brand-name">Barbería GR</h1>
              </div>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>✉️</div>
              <h2>Email Enviado</h2>
              <p>Revisa tu bandeja de entrada</p>
            </div>

            <div className="success-message">
              <p>
                Si el email <strong>{email}</strong> está registrado, recibirás instrucciones
                para recuperar tu contraseña.
              </p>
              <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
                📧 Revisa también la carpeta de spam/correo no deseado
              </p>
              <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                ⏱️ El enlace expira en 1 hora
              </p>
            </div>

            <div className="auth-footer" style={{ marginTop: '30px' }}>
              <Link to="/" className="auth-link">
                ← Volver al login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="brand-logo">
              <h1 className="brand-name">Barbería GR</h1>
            </div>
            <h2>Recuperar Contraseña</h2>
            <p>Ingresa tu email y te enviaremos un enlace para resetear tu contraseña</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="email" className="input-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="input"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
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

export default SolicitarRecuperacion;