// frontend/src/pages/cliente/ClienteTurnos.jsx

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext'; // <-- Importar Toast
import turnoService from '../../services/turnoService';
import useModal from '../hooks/useModal';
import { formatearFechaCorta, formatearFechaLarga } from '../utils/dateUtils';
import useApi from '../hooks/useApi'; // <-- Importar useApi
import './ClienteTurnos.css';

const ClienteTurnos = () => {
  const navigate = useNavigate();
  const toast = useToast(); // Para mensajes de éxito
  const [turnos, setTurnos] = useState([]);
  const [paginacion, setPaginacion] = useState({ pagina: 1, limite: 10, total: 0, totalPaginas: 0 });
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [turnoCancelarId, setTurnoCancelarId] = useState(null);

  // --- HOOKS DE ESTADO (Modales) ---
  const { isOpen: detalleModalOpen, openModal: openDetalleModal, closeModal: closeDetalleModal } = useModal();
  const { isOpen: cancelarModalOpen, openModal: openCancelarModal, closeModal: closeCancelarModal } = useModal();

  // --- HOOKS DE API ---
  const { loading: loadingTurnos, request: cargarTurnosApi } = useApi(turnoService.obtenerMisTurnos);
  const { loading: loadingCancelar, request: cancelarTurnoApi } = useApi(turnoService.cancelarTurno);

  // --- FUNCIONES DE DATOS ---
  const cargarTurnos = useCallback(async () => {
    const params = { pagina: paginacion.pagina, limite: paginacion.limite };
    const { success, data } = await cargarTurnosApi(params);
    
    if (success) {
      // data es el objeto normalizado, ej: { datos: [...], paginacion: {...} }
      setTurnos(data.datos || data.turnos || []);
      setPaginacion(prev => ({
        ...prev,
        total: data.paginacion?.total || data.total || 0,
        totalPaginas: data.paginacion?.totalPaginas || data.totalPaginas || 0,
      }));
    }
    // El error ya lo maneja useApi
  }, [paginacion.pagina, paginacion.limite, cargarTurnosApi]);

  useEffect(() => {
    cargarTurnos();
  }, [cargarTurnos]); // Se dispara cuando cambia cargarTurnos (que depende de paginacion.pagina)

  const handleCancelarTurno = async () => {
    if (!turnoCancelarId) return;
    
    const { success } = await cancelarTurnoApi(turnoCancelarId);
    
    if (success) {
      toast.success('Turno cancelado correctamente');
      cerrarModalCancelar();
      closeDetalleModal(); // Cerrar ambos modales
      cargarTurnos(); // Recargar la lista
    }
  };

  // --- PAGINACIÓN (Sin cambios) ---
  const handlePaginaSiguiente = () => { /* ... */ };
  const handlePaginaAnterior = () => { /* ... */ };
  
  // --- DETALLES (Sin cambios) ---
  const verDetalles = (turno) => { setTurnoSeleccionado(turno); openDetalleModal(); };
  const cerrarModalDetalles = () => { closeDetalleModal(); setTurnoSeleccionado(null); };
  const abrirModalCancelar = (turnoId) => { setTurnoCancelarId(turnoId); openCancelarModal(); };
  const cerrarModalCancelar = () => { closeCancelarModal(); setTurnoCancelarId(null); };

  // --- RENDERIZADO ---
  return (
    <div className="cliente-turnos">
      <div className="container">
        {/* ... (Header) ... */}
        
        {/* Contenido */}
        {loadingTurnos ? (
          <div className="loading"><div className="spinner"></div><p>Cargando turnos...</p></div>
        ) : turnos.length === 0 ? (
          <div className="empty-state">
            <h3>No tienes turnos</h3>
            <Link to="/reservar" className="btn-reservar-header">Reservar</Link>
          </div>
        ) : (
          <>
            <div className="turnos-tabla">
              {/* ... (Tabla de turnos) ... */}
            </div>
            {/* ... (Paginación) ... */}
          </>
        )}
      </div>

      {/* Modal Detalles */}
      {detalleModalOpen && turnoSeleccionado && (
         <div className="modal-overlay" onClick={cerrarModalDetalles}>
           <div className_ ="modal-content-turno" onClick={(e) => e.stopPropagation()}>
             {/* ... (Contenido del modal) ... */}
             <div className="modal-footer">
               {turnoSeleccionado.estado === 'reservado' && (
                 <>
                   <button onClick={() => { /* ... */ }} className="btn btn-outline btn-sm" disabled={loadingCancelar}>Editar</button>
                   <button onClick={() => abrirModalCancelar(turnoSeleccionado._id)} className="btn btn-danger btn-sm" disabled={loadingCancelar}>Cancelar</button>
                 </>
               )}
                <button onClick={cerrarModalDetalles} className="btn btn-secondary btn-sm">Cerrar</button>
             </div>
           </div>
         </div>
      )}

      {/* Modal Cancelar */}
      {cancelarModalOpen && (
         <div className="modal-overlay" onClick={cerrarModalCancelar}>
           <div className="modal-content-confirmar" onClick={(e) => e.stopPropagation()}>
             {/* ... (Header) ... */}
             <div className="modal-body">
               <p>¿Seguro deseas cancelar este turno?</p>
             </div>
             <div className="modal-footer">
               <button onClick={cerrarModalCancelar} className="btn btn-outline btn-sm" disabled={loadingCancelar}>No, mantener</button>
               <button onClick={handleCancelarTurno} className="btn btn-danger btn-sm" disabled={loadingCancelar}>
                 {loadingCancelar ? 'Cancelando...' : 'Sí, cancelar'}
               </button>
             </div>
           </div>
         </div>
      )}
    </div>
  );
};

export default ClienteTurnos;