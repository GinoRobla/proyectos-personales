/**
 * ============================================================================
 * PÁGINA: REGISTRO (Refactorizada)
 * ============================================================================
 */

import { useState, useEffect } from 'react'; // useEffect añadido por si acaso
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext'; // Importar useToast
import useFormData from '../hooks/useFormData'; // Importar useFormData
import { ROLES } from '../utils/constants'; // Importar constantes
import './AuthPages.css';

const RegisterPage = () => {
  const { registro, estaAutenticado, usuario } = useAuth(); // Añadido usuario para redirección
  const navigate = useNavigate();
  const toast = useToast(); // Usar useToast

  // Hook para manejar el formulario
  const { values: formData, handleChange: handleChange } = useFormData({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
  });

  // Estado local para carga
  const [loading, setLoading] = useState(false);

  // Efecto para redirigir si ya está autenticado
  useEffect(() => {
    if (estaAutenticado && usuario) {
      // Redirigir según rol (aunque registro crea clientes, por si acaso)
      if (usuario.rol === ROLES.ADMIN) navigate('/admin');
      else if (usuario.rol === ROLES.BARBERO) navigate('/barbero');
      else navigate('/cliente');
    }
  }, [estaAutenticado, usuario, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validaciones del frontend
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden. Por favor verifica', 4000);
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres', 4000);
      setLoading(false);
      return;
    }

    // Validación de email básica
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Por favor ingresa un email válido', 4000);
      setLoading(false);
      return;
    }

    try {
      // Excluir confirmPassword antes de enviar
      const { confirmPassword, ...dataToSend } = formData;

      const result = await registro({
        ...dataToSend,
        rol: ROLES.CLIENTE, // Usar constante para rol
      });

      if (result.success) {
        toast.success('¡Cuenta creada exitosamente! Bienvenido a Barbería GR', 3000);
        // La redirección se maneja en el useEffect
      } else {
        // Los mensajes específicos vienen del backend mejorado
        toast.error(result.message || 'Error al registrarse. Intenta de nuevo', 4000);
        setLoading(false); // Detener carga solo si hubo error
      }
    } catch (err) {
      // Manejo de errores específicos
      let mensajeError = 'Error de conexión al registrarse';

      if (err.response?.data) {
        // Error del backend (email duplicado, validación, rate limiting, etc.)
        // Chequear tanto 'mensaje' (español) como 'message' (inglés)
        mensajeError = err.response.data.mensaje || err.response.data.message || mensajeError;
      } else if (err.message) {
        mensajeError = err.message;
      } else if (!navigator.onLine) {
        mensajeError = 'No tienes conexión a internet. Verifica tu conexión';
      }

      toast.error(mensajeError, 4000);
      setLoading(false);
    }
    // No es necesario setLoading(false) aquí si hay éxito, porque la redirección ocurrirá
  };

  // Renderizado (se usa formData.nombre, etc. y handleChange)
  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="brand-logo">
              <h1 className="brand-name">Barbería GR</h1>
            </div>
            <h2>Crear Cuenta</h2>
            <p>Regístrate para reservar turnos</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="input-group">
                <label htmlFor="nombre" className="input-label">Nombre</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  className="input"
                  placeholder="Juan"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  autoComplete="given-name"
                />
              </div>
              <div className="input-group">
                <label htmlFor="apellido" className="input-label">Apellido</label>
                <input
                  type="text"
                  id="apellido"
                  name="apellido"
                  className="input"
                  placeholder="Pérez"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>
            {/* Resto de inputs usando formData y handleChange... */}
             <div className="input-group">
              <label htmlFor="email" className="input-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="input"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label htmlFor="telefono" className="input-label">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                className="input"
                placeholder="+54 11 1234-5678"
                value={formData.telefono}
                onChange={handleChange}
                required
                autoComplete="tel"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password" className="input-label">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                className="input"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                minLength={6}
              />
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword" className="input-label">Confirmar Contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="input"
                placeholder="Repite tu contraseña"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                minLength={6}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              ¿Ya tienes cuenta?{' '}
              <Link to="/" className="auth-link">Inicia sesión aquí</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;