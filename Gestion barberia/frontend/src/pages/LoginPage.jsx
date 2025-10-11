/**
 * ============================================================================
 * PÁGINA: LOGIN
 * ============================================================================
 *
 * Página de inicio de sesión que permite a los usuarios autenticarse
 * en el sistema mediante credenciales tradicionales (email/contraseña)
 * o a través de autenticación con Google OAuth.
 *
 * RESPONSABILIDADES:
 * - Permitir inicio de sesión con email y contraseña
 * - Ofrecer autenticación mediante Google OAuth
 * - Validar credenciales ingresadas
 * - Redirigir al dashboard correspondiente según el rol del usuario
 * - Prevenir acceso si el usuario ya está autenticado
 * - Mostrar mensajes de error cuando la autenticación falla
 *
 * RUTA:
 * - /
 * - /login
 *
 * ACCESO:
 * - Público (solo usuarios no autenticados)
 *
 * FLUJO:
 * 1. El usuario llega a la página de login
 * 2. Si ya está autenticado, se redirige automáticamente a su dashboard
 * 3. El usuario puede elegir:
 *    a) Ingresar email y contraseña manualmente
 *    b) Usar el botón "Continuar con Google"
 * 4. Al enviar el formulario:
 *    - Se validan los campos (email y contraseña requeridos)
 *    - Se llama al servicio de autenticación
 *    - Si es exitoso, se muestra un toast de confirmación
 *    - Se redirige según el rol:
 *      * Admin -> /admin
 *      * Barbero -> /barbero
 *      * Cliente -> /cliente
 * 5. Si hay error, se muestra un mensaje al usuario
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './AuthPages.css';

const LoginPage = () => {
  // ============================================================================
  // HOOKS Y CONTEXTOS
  // ============================================================================

  const navegar = useNavigate();
  const { login, loginConGoogle, estaAutenticado, usuario } = useAuth();
  const toast = useToast();

  // ============================================================================
  // ESTADOS
  // ============================================================================

  // ESTADO: Datos del formulario de login
  const [datosFormulario, setDatosFormulario] = useState({
    email: '',
    password: '',
  });

  // ESTADO: Indica si se está procesando el envío del formulario
  const [estaCargando, setEstaCargando] = useState(false);

  // ============================================================================
  // EFECTOS
  // ============================================================================

  /**
   * EFECTO: Redirigir si ya está autenticado
   *
   * Si el usuario ya inició sesión previamente y su token sigue siendo válido,
   * se le redirige automáticamente a su dashboard correspondiente.
   *
   * DEPENDENCIAS:
   * - estaAutenticado: booleano del contexto de autenticación
   * - usuario: objeto con datos del usuario (incluye el rol)
   * - navegar: función de navegación de react-router
   */
  useEffect(() => {
    if (estaAutenticado && usuario) {
      const rol = usuario.rol;

      // Redirigir según el rol del usuario
      if (rol === 'admin') {
        navegar('/admin');
      } else if (rol === 'barbero') {
        navegar('/barbero');
      } else {
        navegar('/cliente');
      }
    }
  }, [estaAutenticado, usuario, navegar]);

  // ============================================================================
  // FUNCIONES DE MANEJO
  // ============================================================================

  /**
   * MANEJAR CAMBIO EN CAMPO
   *
   * Se ejecuta cada vez que el usuario escribe en un campo del formulario.
   * Actualiza el estado del formulario con el nuevo valor ingresado.
   *
   * @param {Event} evento - Evento de cambio del input
   */
  const manejarCambioEnCampo = (evento) => {
    setDatosFormulario({
      ...datosFormulario,
      [evento.target.name]: evento.target.value,
    });
  };

  /**
   * MANEJAR ENVÍO DE FORMULARIO
   *
   * Se ejecuta cuando el usuario hace clic en el botón "Ingresar".
   *
   * PROCESO:
   * 1. Prevenir la recarga de la página
   * 2. Activar estado de carga (deshabilitar botón)
   * 3. Llamar al servicio de autenticación con email y password
   * 4. Si el login es exitoso:
   *    - Mostrar toast de éxito
   *    - Esperar 500ms para que el usuario vea el mensaje
   *    - Redirigir al dashboard según el rol del usuario
   * 5. Si el login falla:
   *    - Mostrar toast de error con el mensaje recibido
   *    - Desactivar estado de carga para permitir reintentar
   *
   * @param {Event} evento - Evento de envío del formulario
   */
  const manejarEnvioDeFormulario = async (evento) => {
    evento.preventDefault();
    setEstaCargando(true);

    try {
      // Intentar iniciar sesión con las credenciales ingresadas
      const resultado = await login(datosFormulario.email, datosFormulario.password);

      if (resultado.success) {
        // Mostrar mensaje de éxito al usuario
        toast.success('Sesión iniciada correctamente');

        // Esperar un poco para que se vea el toast antes de redirigir
        setTimeout(() => {
          const rol = resultado.usuario.rol;

          // Redirigir según el rol del usuario autenticado
          if (rol === 'admin') {
            navegar('/admin');
          } else if (rol === 'barbero') {
            navegar('/barbero');
          } else {
            navegar('/cliente');
          }
        }, 500);
      } else {
        // Mostrar error recibido del servidor
        toast.error(resultado.message || 'Error al iniciar sesión');
        setEstaCargando(false);
      }
    } catch (error) {
      // Manejar errores de red o del servidor
      const mensajeError = error.response?.data?.message || 'Error al iniciar sesión';
      toast.error(mensajeError);
      setEstaCargando(false);
    }
  };

  /**
   * MANEJAR LOGIN CON GOOGLE
   *
   * Inicia el flujo de autenticación con Google OAuth.
   *
   * PROCESO:
   * 1. Llama a la función loginConGoogle del contexto
   * 2. El contexto redirige al usuario a la página de Google
   * 3. Después de autenticarse, Google redirige a /auth/callback
   * 4. AuthCallbackPage procesa el token y redirige al dashboard
   */
  const manejarLoginConGoogle = () => {
    loginConGoogle();
  };

  // ============================================================================
  // RENDERIZADO
  // ============================================================================

  return (
    <div className="auth-page">
      <div className="container">
        {/* Tarjeta principal de autenticación */}
        <div className="auth-card">
          {/* Encabezado con logo y título */}
          <div className="auth-header">
            <div className="brand-logo">
              <h1 className="brand-name">Barbería GR</h1>
            </div>
            <h2>Iniciar Sesión</h2>
            <p>Ingresa a tu cuenta</p>
          </div>

          {/* Formulario de Login Tradicional */}
          <form onSubmit={manejarEnvioDeFormulario} className="auth-form">
            {/* Campo: Email */}
            <div className="input-group">
              <label htmlFor="email" className="input-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="input"
                placeholder="tu@email.com"
                value={datosFormulario.email}
                onChange={manejarCambioEnCampo}
                required
                autoComplete="email"
              />
            </div>

            {/* Campo: Contraseña */}
            <div className="input-group">
              <label htmlFor="password" className="input-label">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="input"
                placeholder="••••••••"
                value={datosFormulario.password}
                onChange={manejarCambioEnCampo}
                required
                autoComplete="current-password"
              />
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={estaCargando}
            >
              {estaCargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          {/* Divisor visual entre login tradicional y OAuth */}
          <div className="auth-divider">
            <span>o continúa con</span>
          </div>

          {/* Botón: Login con Google */}
          <button
            type="button"
            className="btn btn-google"
            onClick={manejarLoginConGoogle}
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              style={{ width: '20px', height: '20px' }}
            />
            Continuar con Google
          </button>

          {/* Footer con link a página de registro */}
          <div className="auth-footer">
            <p>
              ¿No tienes cuenta?{' '}
              <Link to="/registro" className="auth-link">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
