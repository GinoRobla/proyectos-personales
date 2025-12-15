import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './ResultadoPago.css';

const PagoFailure = () => {
  const navigate = useNavigate();
  const { estaAutenticado } = useAuth();
  const [searchParams] = useSearchParams();

  // Obtener parámetros de la URL
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');

  const handleReintentar = () => {
    // Volver a la página de reserva de turnos
    navigate('/reservar-turno');
  };

  const handleVerMisTurnos = () => {
    navigate(estaAutenticado ? '/cliente/turnos' : '/');
  };

  return (
    <div className="resultado-pago-page">
      <div className="container">
        <div className="resultado-card error">
          {/* Ícono de error */}
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
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>

          {/* Título */}
          <h1>Pago Rechazado</h1>

          {/* Mensaje */}
          <p className="mensaje-principal">
            Tu pago no pudo ser procesado. Tu turno no ha sido confirmado.
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
              Posibles causas:
            </p>
            <ul>
              <li>Fondos insuficientes</li>
              <li>Tarjeta rechazada</li>
              <li>Error en los datos ingresados</li>
              <li>Límite de la tarjeta excedido</li>
            </ul>
            <p>
              Por favor, verifica los datos e intenta nuevamente.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="botones-accion">
            <button onClick={handleReintentar} className="btn btn-primary">
              Reintentar Reserva
            </button>
            {estaAutenticado && (
              <button onClick={handleVerMisTurnos} className="btn btn-secondary">
                Ver Mis Turnos
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PagoFailure;
