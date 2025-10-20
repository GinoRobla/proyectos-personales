import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import turnoService from '../../services/turnoService';
import useModal from '../hooks/useModal'; // Importar hook
import { formatearFechaCorta, formatearFechaLarga } from '../utils/dateUtils'; // Importar utils
import './ClienteDashboard.css';

const ClienteDashboard = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [proximosTurnos, setProximosTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [turnoCancelarId, setTurnoCancelarId] = useState(null);

  // Hooks para modales
  const { isOpen: detalleModalOpen, openModal: openDetalleModal, closeModal: closeDetalleModal } = useModal();
  const { isOpen: cancelarModalOpen, openModal: openCancelarModal, closeModal: closeCancelarModal } = useModal();

  useEffect(() => {
    cargarProximosTurnos();
  }, []);

  const cargarProximosTurnos = async () => {
    // ... (lógica de carga sin cambios)
    try {
      setLoading(true);
      const response = await turnoService.obtenerMisTurnos({ pagina: 1, limite: 3, estado: 'reservado' });
      const turnosOrdenados = (response.datos || response.turnos || []).sort((a, b) => {
          const fechaHoraA = new Date(`${a.fecha.split('T')[0]}T${a.hora}`);
          const fechaHoraB = new Date(`${b.fecha.split('T')[0]}T${b.hora}`);
          return fechaHoraA - fechaHoraB;
      });
      setProximosTurnos(turnosOrdenados);
    } catch (err) { setError('Error al cargar próximos turnos'); }
    finally { setLoading(false); }
  };

  const abrirModalCancelar = (turnoId) => {
    setTurnoCancelarId(turnoId);
    openCancelarModal(); // Usar hook
  };

  const cerrarModalCancelar = () => {
    closeCancelarModal(); // Usar hook
    setTurnoCancelarId(null);
  };

  const handleCancelarTurno = async () => {
    if (!turnoCancelarId) return;
    try {
      await turnoService.cancelarTurno(turnoCancelarId);
      cerrarModalCancelar();
      closeDetalleModal(); // Cerrar también el de detalles si estaba abierto
      cargarProximosTurnos();
    } catch (err) {
      alert('Error al cancelar el turno'); // Podrías usar useToast aquí
    }
  };

  const verDetalles = (turno) => {
    setTurnoSeleccionado(turno);
    openDetalleModal(); // Usar hook
  };

  const cerrarModalDetalles = () => {
    closeDetalleModal(); // Usar hook
    setTurnoSeleccionado(null);
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
                    <div className="turno-fecha">{formatearFechaCorta(turno.fecha)}</div> {/* Usar dateUtils */}
                    <button onClick={() => verDetalles(turno)} className="btn-ver-detalles">Ver detalles</button>
                  </div>
                ))}
              </div>
              <div className="seccion-footer"><Link to="/cliente/turnos" className="ver-todos-btn">Ver todos →</Link></div>
            </>
          )}
        </div>

        {/* ... (Info Barbería sin cambios) ... */}
        <div className="info-barberia">
          <h3>Información de la Barbería</h3>
          {/* ... */}
        </div>
      </div>

      {/* Modal Detalles (controlado por useModal) */}
      {detalleModalOpen && turnoSeleccionado && (
        <div className="modal-overlay" onClick={cerrarModalDetalles}>
          <div className="modal-content-turno" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalles del Turno</h2>
              <button className="modal-close" onClick={cerrarModalDetalles}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detalle-grupo"><label>Fecha</label><span>{formatearFechaLarga(turnoSeleccionado.fecha)}</span></div> {/* Usar dateUtils */}
              <div className="detalle-grupo"><label>Hora</label><span>{turnoSeleccionado.hora}</span></div>
              {/* ... resto de detalles ... */}
               <div className="detalle-grupo">
                <label>Servicio</label>
                <span>{turnoSeleccionado.servicio?.nombre}</span>
              </div>
              <div className="detalle-grupo">
                <label>Barbero</label>
                <span>{turnoSeleccionado.barbero ? `${turnoSeleccionado.barbero.nombre} ${turnoSeleccionado.barbero.apellido}` : 'Por asignar'}</span>
              </div>
               <div className="detalle-grupo">
                <label>Precio</label>
                <span className="precio">${turnoSeleccionado.servicio?.precioBase}</span>
              </div>
              <div className="detalle-grupo">
                <label>Estado</label>
                 <span className={`estado-badge estado-${turnoSeleccionado.estado}`}>
                  {turnoSeleccionado.estado === 'reservado' ? 'Reservado' :
                   turnoSeleccionado.estado === 'completado' ? 'Completado' :
                   turnoSeleccionado.estado === 'cancelado' ? 'Cancelado' : turnoSeleccionado.estado}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              {turnoSeleccionado.estado === 'reservado' && (
                <>
                  <button onClick={() => { cerrarModalDetalles(); navigate(`/reservar?editar=${turnoSeleccionado._id}`); }} className="btn btn-outline btn-sm">Editar</button>
                  <button onClick={() => abrirModalCancelar(turnoSeleccionado._id)} className="btn btn-danger btn-sm">Cancelar</button>
                </>
              )}
               <button onClick={cerrarModalDetalles} className="btn btn-secondary btn-sm">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cancelar (controlado por useModal) */}
      {cancelarModalOpen && (
        <div className="modal-overlay" onClick={cerrarModalCancelar}>
           <div className="modal-content-confirmar" onClick={(e) => e.stopPropagation()}>
             <div className="modal-header">
               <h2>Confirmar Cancelación</h2>
               <button className="modal-close" onClick={cerrarModalCancelar}>✕</button>
             </div>
             <div className="modal-body">
               <p>¿Seguro deseas cancelar este turno?</p>
               <p className="advertencia">Esta acción no se puede deshacer.</p>
             </div>
             <div className="modal-footer">
               <button onClick={cerrarModalCancelar} className="btn btn-outline btn-sm">No, mantener</button>
               <button onClick={handleCancelarTurno} className="btn btn-danger btn-sm">Sí, cancelar</button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ClienteDashboard;