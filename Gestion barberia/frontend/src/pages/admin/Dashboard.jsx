// frontend/src/pages/admin/Dashboard.jsx (REFACTORIZADO)

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import turnoService from '../../services/turnoService';
import useModal from '../../hooks/useModal';
import { formatearFechaLarga } from '../../utils/dateUtils';
import useApi from '../../hooks/useApi';
import TurnosPendientesList from '../../components/admin/TurnosPendientesList'; // <-- IMPORTAR
import './Dashboard.css';

const AdminDashboard = () => {
  const toast = useToast();
  const [turnosSinBarbero, setTurnosSinBarbero] = useState([]);
  const [barberosDisponibles, setBarberosDisponibles] = useState({});

  // --- Lógica de API (sin cambios) ---
  const { loading: loadingTurnos, request: cargarTurnosApi } = useApi(turnoService.obtenerTodos);
  const { loading: loadingDisponibilidad, request: cargarDisponibilidadApi } = useApi(turnoService.obtenerDisponibilidadBarberos);
  const loading = loadingTurnos || loadingDisponibilidad;
  
  // --- Lógica de Modal (sin cambios) ---
  const { isOpen: agendaModalOpen, openModal: openAgendaModal, closeModal: closeAgendaModal } = useModal();
  const [turnoActual, setTurnoActual] = useState(null);
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(null);
  // ... (otros estados y lógica de modal: turnosBarberoAgenda, hayConflictoAgenda, etc.)
  // ... (useApi para cargar agenda, asignar barbero)
  
  // --- Carga de Datos (sin cambios) ---
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => { /* ... (lógica de carga idéntica a la anterior) ... */ };
  const verAgendaBarbero = async (barbero, turno) => { /* ... (lógica de modal idéntica) ... */ };
  const asignarBarbero = async (turnoId, barberoId) => { /* ... (lógica de asignación idéntica) ... */ };

  return (
    <div className="admin-dashboard">
      <div className="container">
        <h1 className="dashboard-title">Panel de Administración</h1>

        {loading ? (
          <div className="loading"><div className="spinner"></div><p>Cargando...</p></div>
        ) : (
          <>
            {/* Turnos sin barbero asignado */}
            <div className="admin-section">
              <div className="section-header">
                <h2>Turnos sin Barbero Asignado ({turnosSinBarbero.length})</h2>
                {turnosSinBarbero.length > 2 && (
                  <Link to="/admin/turnos-sin-asignar" className="btn-ver-todos">
                    Ver todos
                  </Link>
                )}
              </div>
              
              {turnosSinBarbero.length > 0 ? (
                // --- CÓDIGO REFACTORIZADO ---
                <TurnosPendientesList
                  turnos={turnosSinBarbero.slice(0, 2)} // Solo los primeros 2
                  barberosDisponibles={barberosDisponibles}
                  onVerAgenda={verAgendaBarbero}
                />
                // --- FIN REFACTORIZACIÓN ---
              ) : (
                <div className="mensaje-vacio"><p>No hay turnos pendientes de asignación.</p></div>
              )}
            </div>

            {/* ... (Gestión y Estadísticas sin cambios) ... */}
          </>
        )}

        {/* Modal de Agenda (sin cambios) */}
        {agendaModalOpen && barberoSeleccionado && turnoActual && (
           <div className="modal-overlay" onClick={closeAgendaModal}>
             {/* ... (Contenido del modal idéntico) ... */}
           </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;