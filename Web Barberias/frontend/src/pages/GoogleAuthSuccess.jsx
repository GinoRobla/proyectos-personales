import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import authService from '../services/authService';

const GoogleAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const ejecutadoRef = useRef(false);

  useEffect(() => {
    const procesarCallback = async () => {
      console.log('🔵 [GoogleAuthSuccess] Iniciando procesarCallback...');

      if (ejecutadoRef.current) {
        console.log('🟡 [GoogleAuthSuccess] Ya ejecutado, saliendo...');
        return;
      }
      ejecutadoRef.current = true;

      const token = searchParams.get('token');
      console.log('🔵 [GoogleAuthSuccess] Token obtenido:', token ? 'SÍ' : 'NO');

      if (!token) {
        console.log('🔴 [GoogleAuthSuccess] No hay token, mostrando error...');
        const error = searchParams.get('error') || 'Error en autenticación con Google';
        toast.error(error, 4000);
        navigate('/');
        return;
      }

      try {
        console.log('🔵 [GoogleAuthSuccess] Guardando token en localStorage...');
        localStorage.setItem('token', token);

        console.log('🔵 [GoogleAuthSuccess] Verificando token con el backend...');
        const response = await authService.verificarToken();
        console.log('🔵 [GoogleAuthSuccess] Respuesta del backend:', response);

        if (response.success) {
          console.log('✅ [GoogleAuthSuccess] Token válido, usuario:', response.data.usuario);

          // Guardar usuario en localStorage
          localStorage.setItem('usuario', JSON.stringify(response.data.usuario));

          console.log('🔵 [GoogleAuthSuccess] Mostrando notificación de éxito...');
          toast.success('¡Bienvenido! Sesión iniciada con Google', 3000);

          // Redirigir según el rol del usuario
          console.log('🔵 [GoogleAuthSuccess] Programando redirección en 1.5 segundos...');
          setTimeout(() => {
            const rol = response.data.usuario.rol;
            console.log('🔵 [GoogleAuthSuccess] Redirigiendo a dashboard:', rol);
            if (rol === 'admin') {
              window.location.href = '/admin';
            } else if (rol === 'barbero') {
              window.location.href = '/barbero';
            } else {
              window.location.href = '/cliente';
            }
          }, 1500);
        } else {
          console.log('🔴 [GoogleAuthSuccess] Token inválido');
          throw new Error('Error al verificar token');
        }
      } catch (error) {
        console.error('🔴 [GoogleAuthSuccess] Error al procesar token:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        console.log('🔴 [GoogleAuthSuccess] Mostrando notificación de error...');
        const mensaje = error.response?.data?.message || error.message || 'Error al iniciar sesión con Google';
        toast.error(mensaje, 4000);
        navigate('/');
      }
    };

    procesarCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="brand-logo">
              <h1 className="brand-name">Barbería GR</h1>
            </div>
            <h2>Autenticando con Google...</h2>
            <div style={{ marginTop: '30px' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #3498db',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto',
                }}
              ></div>
            </div>
            <p style={{ marginTop: '20px', color: '#666' }}>
              Procesando tu autenticación...
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GoogleAuthSuccess;