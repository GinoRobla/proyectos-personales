// frontend/src/pages/admin/TurnosSinAsignar.jsx (REFACTORIZADO)

import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import turnoService from '../../services/turnoService';
import useModal from '../../hooks/useModal';
import { formatearFechaLarga } from '../../utils/dateUtils';
import useApi from '../../hooks/useApi';
import TurnosPendientesList from '../../components/admin/TurnosPendientesList'; // <-- IMPORTAR
import './Dashboard.css';

const TurnosSinAsignar = () => {
  const toast = useToast();
  const [turnosSinBarbero, setTurnosSinBarbero] = useState([]);
  const [barberosDisponibles, setBarberosDisponibles] = useState({});

  // --- Lógica de API (idéntica a Dashboard) ---
  const { loading: loadingTurnos, request: cargarTurnosApi } = useApi(turnoService.obtenerTodos);
  const { loading: loadingDisponibilidad, request: cargarDisponibilidadApi } = useApi(turnoService.obtenerDisponibilidadBarberos);
  const loading = loadingTurnos || loadingDisponibilidad;
  
  // --- Lógica de Modal (idéntica a Dashboard) ---
  const { isOpen: agendaModalOpen, openModal: openAgendaModal, closeModal: closeAgendaModal } = useModal();
  // ... (todos los estados y funciones de modal idénticos: verAgendaBarbero, asignarBarbero, etc.)

  // --- Carga de Datos (idéntica a Dashboard) ---
  useEffect(() => {
    cargarDatos();
  }, []);
  
  const cargarDatos = async () => { /* ... (lógica de carga idéntica) ... */ };
  const verAgendaBarbero = async (barbero, turno) => { /* ... (lógica de modal idéntica) ... */ };
  const asignarBarbero = async (turnoId, barberoId) => { /* ... (lógica de asignación idéntica) ... */ };

  return (
    <div className="admin-dashboard">
      <div className="container">
        <h1 className="dashboard-title">Turnos sin Asignar</h1>
        {/* --- ESTILO INLINE ELIMINADO --- */}
        <p className="page-subtitle">
          Asigna un barbero disponible a los siguientes turnos pendientes.
        </p>

        {loading ? (
          <div className="loading"><div className="spinner"></div><p>Cargando turnos...</p></div>
        ) : (
          <>
            {turnosSinBarbero.length > 0 ? (
              <div className="admin-section">
                {/* --- CÓDIGO REFACTORIZADO --- */}
                <TurnosPendientesList
                  turnos={turnosSinBarbero} // La lista completa
                  barberosDisponibles={barberosDisponibles}
                  onVerAgenda={verAgendaBarbero}
                />
                {/* --- FIN REFACTORIZACIÓN --- */}
              </div>
            ) : (
              <div className="mensaje-vacio">
                <p>¡Excelente! No hay turnos pendientes de asignación.</p>
              </div>
            )}
          </>
        )}

        {/* Modal de Agenda (idéntico a Dashboard.jsx) */}
        {agendaModalOpen && barberoSeleccionado && turnoActual && (
           <div className="modal-overlay" onClick={closeAgendaModal}>
             {/* ... (Contenido del modal idéntico) ... */}
           </div>
        )}
      </div>
    </div>
  );
};

export default TurnosSinAsignar;