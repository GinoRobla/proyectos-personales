import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './ResultadoPago.css';

const PagoSuccess = () => {
  const navigate = useNavigate();
  const { estaAutenticado } = useAuth();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  // Obtener parámetros de la URL (MercadoPago los envía)
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');

  useEffect(() => {
    // Countdown para redirección automática
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirigir a Mis Turnos si está autenticado, o al home si no
          navigate(estaAutenticado ? '/cliente/turnos' : '/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, estaAutenticado]);

  const handleVerMisTurnos = () => {
    navigate(estaAutenticado ? '/cliente/turnos' : '/');
  };

  return (
    <div className="resultado-pago-page">
      <div className="container">
        <div className="resultado-card exito">
          {/* Ícono de éxito */}
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
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>

          {/* Título */}
          <h1>Pago Exitoso</h1>

          {/* Mensaje */}
          <p className="mensaje-principal">
            Tu pago ha sido procesado correctamente. Tu turno está confirmado.
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
              Recibirás un recordatorio por WhatsApp antes de tu turno.
            </p>
            <p>
              El monto restante se pagará en la barbería al completar el servicio.
            </p>
          </div>

          {/* Botón de acción */}
          <button onClick={handleVerMisTurnos} className="btn btn-primary">
            Ver Mis Turnos
          </button>

          {/* Countdown */}
          <p className="countdown-text">
            Redirigiendo automáticamente en {countdown} segundo{countdown !== 1 ? 's' : ''}...
          </p>
        </div>
      </div>
    </div>
  );
};

export default PagoSuccess;
