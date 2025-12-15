import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './ResultadoPago.css';

const PagoPending = () => {
  const navigate = useNavigate();
  const { estaAutenticado } = useAuth();
  const [searchParams] = useSearchParams();

  // Obtener parámetros de la URL
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');

  const handleVerMisTurnos = () => {
    navigate(estaAutenticado ? '/cliente/turnos' : '/');
  };

  const handleVolverInicio = () => {
    navigate('/');
  };

  return (
    <div className="resultado-pago-page">
      <div className="container">
        <div className="resultado-card pendiente">
          {/* Ícono de pendiente */}
          <div className="icono-resultado">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>

          {/* Título */}
          <h1>Pago Pendiente</h1>

          {/* Mensaje */}
          <p className="mensaje-principal">
            Tu pago está siendo procesado. Te notificaremos cuando se confirme.
          </p>

          {/* Detalles del pago */}
          {paymentId && (
            <div className="detalles-pago">
              <p className="detalle-item">
                <span className="label">ID de Pago:</span>
                <span className="valor">{paymentId}</span>
              </p>
              {status && (
                <p className="detalle-item">
                  <span className="label">Estado:</span>
                  <span className="valor">{status}</span>
                </p>
              )}
            </div>
          )}

          {/* Información adicional */}
          <div className="info-adicional">
            <p>
              Los pagos pueden demorar hasta 24 horas en acreditarse.
            </p>
            <p>
              Recibirás una notificación por email cuando tu pago sea confirmado.
            </p>
            <p>
              Mientras tanto, tu turno quedará reservado con estado "Pendiente de pago".
            </p>
          </div>

          {/* Botones de acción */}
          <div className="botones-accion">
            {estaAutenticado ? (
              <button onClick={handleVerMisTurnos} className="btn btn-primary">
                Ver Mis Turnos
              </button>
            ) : (
              <button onClick={handleVolverInicio} className="btn btn-primary">
                Volver al Inicio
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PagoPending;
