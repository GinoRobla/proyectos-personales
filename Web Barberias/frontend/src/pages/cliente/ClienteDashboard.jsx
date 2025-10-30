import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import turnoService from '../../services/turnoService';
import useModal from '../../hooks/useModal';
import useApi from '../../hooks/useApi';
import { formatearFechaCorta } from '../../utils/dateUtils';
import './ClienteDashboard.css';

const ClienteDashboard = () => {
  const { usuario } = useAuth();
  const toast = useToast();
  const [proximosTurnos, setProximosTurnos] = useState([]);
  const [historialTurnos, setHistorialTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [error, setError] = useState('');
  const [turnoCancelarId, setTurnoCancelarId] = useState(null);

  // Hooks para modales
  const { isOpen: cancelarModalOpen, openModal: openCancelarModal, closeModal: closeCancelarModal } = useModal();

  // Hook de API para cancelar
  const { loading: loadingCancelar, request: cancelarTurnoApi } = useApi(turnoService.cancelarTurno);

  // Scroll al inicio cuando se monta el componente
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    cargarProximosTurnos();
    cargarHistorialTurnos();
  }, []);

  const cargarProximosTurnos = async () => {
    try {
      setLoading(true);
      const response = await turnoService.obtenerMisTurnos({ pagina: 1, limite: 50, estado: 'reservado' });
      const ahora = new Date();

      // Filtrar solo turnos futuros y ordenar por fecha/hora
      const turnosFuturos = (response.datos || response.turnos || [])
        .map(turno => ({
          ...turno,
          fechaHora: new Date(`${turno.fecha.split('T')[0]}T${turno.hora}`)
        }))
        .filter(turno => turno.fechaHora >= ahora)
        .sort((a, b) => a.fechaHora - b.fechaHora)
        .slice(0, 3); // Tomar solo los 3 más próximos

      setProximosTurnos(turnosFuturos);
    } catch (err) { setError('Error al cargar próximos turnos'); }
    finally { setLoading(false); }
  };

  const cargarHistorialTurnos = async () => {
    try {
      setLoadingHistorial(true);
      const response = await turnoService.obtenerMisTurnos({ pagina: 1, limite: 4, estado: 'completado,cancelado' });
      const turnosOrdenados = (response.datos || response.turnos || []).sort((a, b) => {
          const fechaHoraA = new Date(`${a.fecha.split('T')[0]}T${a.hora}`);
          const fechaHoraB = new Date(`${b.fecha.split('T')[0]}T${b.hora}`);
          return fechaHoraB - fechaHoraA; // Orden descendente (más reciente primero)
      });
      setHistorialTurnos(turnosOrdenados);
    } catch (err) {
      console.error('Error al cargar historial:', err);
    }
    finally { setLoadingHistorial(false); }
  };

  const abrirModalCancelar = (turnoId) => {
    setTurnoCancelarId(turnoId);
    openCancelarModal();
  };

  const cerrarModalCancelar = () => {
    closeCancelarModal();
    setTurnoCancelarId(null);
  };

  const handleCancelarTurno = async () => {
    if (!turnoCancelarId) return;

    const { success, message } = await cancelarTurnoApi(turnoCancelarId);

    if (success) {
      toast.success('Turno cancelado correctamente', 3000);
      cerrarModalCancelar();
      cargarProximosTurnos();
    } else {
      toast.error(message || 'No se pudo cancelar tu turno. Intenta de nuevo', 4000);
    }
  };

  // Renderizado (usando las funciones de dateUtils y los hooks de modal)
  return (
    <div className="cliente-dashboard">
      <div className="container">
        {/* ... (Bienvenida sin cambios) ... */}
         <div className="bienvenida-card">
          <h1>¡Hola, {usuario?.nombre}!</h1>
          <p>Reservá tu próximo turno</p>
        </div>

        {/* Próximos Turnos */}
        <div className="seccion">
          <div className="seccion-header">
            <h2>Próximos Turnos</h2>
            <Link to="/reservar" className="btn-reservar-compacto">Reservar Turno</Link>
          </div>
          {loading ? ( <div className="loading"><div className="spinner"></div><p>Cargando...</p></div> )
           : error ? ( <div className="alert alert-error">{error}</div> )
           : proximosTurnos.length === 0 ? (
              <div className="empty-state">
                <h3>No tienes turnos próximos</h3>
                <Link to="/reservar" className="btn btn-primary">Reservar Ahora</Link>
              </div>
            ) : (
            <>
              <div className="turnos-lista">
                {proximosTurnos.map((turno) => (
                  <div key={turno._id} className="turno-card-simple">
                    <div className="turno-hora">{turno.hora}</div>
                    <div className="turno-fecha">{formatearFechaCorta(turno.fecha)}</div>
                    <button
                      onClick={() => abrirModalCancelar(turno._id)}
                      className="btn-cancelar-turno"
                      disabled={loadingCancelar}
                    >
                      Cancelar Turno
                    </button>
                  </div>
                ))}
              </div>
              <div className="seccion-footer"><Link to="/cliente/turnos" className="ver-todos-btn">Ver todos →</Link></div>
            </>
          )}
        </div>

        {/* Historial de Turnos */}
        <div className="seccion">
          <div className="seccion-header">
            <h2>Historial de Turnos</h2>
          </div>
          {loadingHistorial ? (
            <div className="loading"><div className="spinner"></div><p>Cargando...</p></div>
          ) : historialTurnos.length === 0 ? (
            <div className="empty-state">
              <h3>No tienes turnos en tu historial</h3>
              <p>Tus turnos completados o cancelados aparecerán aquí</p>
            </div>
          ) : (
            <>
              <div className="turnos-lista">
                {historialTurnos.map((turno) => (
                  <div key={turno._id} className="turno-card-simple">
                    <div className="turno-hora">{turno.hora}</div>
                    <div className="turno-fecha">{formatearFechaCorta(turno.fecha)}</div>
                    <div className={`estado-badge estado-${turno.estado}`}>
                      {turno.estado === 'completado' ? 'Completado' : 'Cancelado'}
                    </div>
                  </div>
                ))}
              </div>
              <div className="seccion-footer">
                <Link to="/cliente/turnos" className="ver-todos-btn">Ver todos →</Link>
              </div>
            </>
          )}
        </div>

      </div>

      {/* Modal Cancelar Turno */}
      {cancelarModalOpen && (
        <div className="modal-overlay" onClick={cerrarModalCancelar}>
          <div className="modal-content-confirmar" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmar Cancelación</h2>
              <button className="modal-close" onClick={cerrarModalCancelar}>✕</button>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que deseas cancelar este turno?</p>
              <p className="advertencia">Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-footer">
              <button
                onClick={cerrarModalCancelar}
                className="btn btn-outline btn-sm"
                disabled={loadingCancelar}
              >
                No, mantener
              </button>
              <button
                onClick={handleCancelarTurno}
                className="btn btn-danger btn-sm"
                disabled={loadingCancelar}
              >
                {loadingCancelar ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClienteDashboard;