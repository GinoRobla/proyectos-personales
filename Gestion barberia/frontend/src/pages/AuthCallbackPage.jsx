import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Página de Callback de Google OAuth
 * Recibe el token y redirige al dashboard correspondiente
 */

const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (token) {
      // Guardar token en localStorage
      localStorage.setItem('token', token);

      // Decodificar el token para obtener el rol (simplificado)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const rol = payload.rol;

        // Redirigir según el rol
        if (rol === 'admin') {
          navigate('/admin');
        } else if (rol === 'barbero') {
          navigate('/barbero');
        } else {
          navigate('/cliente');
        }
      } catch (err) {
        console.error('Error al decodificar token:', err);
        navigate('/');
      }
    } else if (error) {
      // Error en la autenticación
      navigate(`/login?error=${error}`);
    } else {
      // No hay token ni error, redirigir al home
      navigate('/');
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center" style={{ minHeight: '80vh' }}>
      <div className="text-center">
        <div className="spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '1rem' }}>Autenticando con Google...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
