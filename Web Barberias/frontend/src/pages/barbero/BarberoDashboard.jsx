// frontend/src/pages/barbero/BarberoDashboard.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Ajusta ruta si es necesario
import turnoService from '../../services/turnoService';
import { formatearFechaLarga, formatearHora, obtenerFechaLocalISO } from '../../utils/dateUtils'; // Ajusta ruta si es necesario
import useApi from '../../hooks/useApi'; // Importar hook
import './BarberoDashboard.css'; // Importar CSS

const BarberoDashboard = () => {
  const { usuario } = useAuth();
  const [turnosHoy, setTurnosHoy] = useState([]);
  const [proximoTurno, setProximoTurno] = useState(null);

  // Hook de API para cargar turnos
  const { loading, error, request: cargarTurnosApi } = useApi(turnoService.obtenerMisTurnos);

  useEffect(() => {
    cargarDatos();
  }, []); // Cargar solo una vez al montar

  const cargarDatos = async () => {
    const hoyISO = obtenerFechaLocalISO(); // Obtener fecha de hoy
    const params = { fecha: hoyISO, limite: 20, estado: 'reservado,completado,cancelado' }; // Incluir todos los estados de hoy

    const { success, data } = await cargarTurnosApi(params);

    if (success && data?.datos) { // Verificar si hay datos
      const turnosDelDia = data.datos.sort((a, b) => a.hora.localeCompare(b.hora)); // Ordenar por hora
      setTurnosHoy(turnosDelDia);

      // Encontrar el próximo turno reservado y futuro
      const ahora = new Date();
      const proximo = turnosDelDia
        .filter(t => {
            if (t.estado !== 'reservado') return false;
            // Construir fecha/hora del turno EN UTC para comparar correctamente
            const [year, month, day] = t.fecha.split('T')[0].split('-').map(Number);
            const [hour, minute] = t.hora.split(':').map(Number);
            const fechaHoraTurnoUTC = new Date(Date.UTC(year, month - 1, day, hour, minute));
            // Comparar con la hora actual UTC
            return fechaHoraTurnoUTC > ahora;
        })
        .sort((a, b) => a.hora.localeCompare(b.hora))[0]; // El primero después de ordenar
      setProximoTurno(proximo);

    } else if (!success) {
      // El error ya lo maneja useApi con un toast
      setTurnosHoy([]); // Limpiar en caso de error
      setProximoTurno(null);
    }
  };

  return (
    <div className="barbero-dashboard">
      <div className="container">
        {/* Bienvenida */}
        <div className="bienvenida-card">
          <h1>Hola, {usuario?.nombre}</h1>
          <p>{formatearFechaLarga(new Date())}</p>
        </div>

        {/* Sección Turnos de Hoy - PRIMERO */}
        <div className="seccion">
          <div className="seccion-header">
            <h2>Turnos de hoy ({turnosHoy.length})</h2>
            {/* Opcional: Contador */}
          </div>
          {loading ? (
            <div className="loading">
              <div className="spinner"></div> {/* Asumiendo que tienes un spinner CSS */}
              <p>Cargando turnos...</p>
            </div>
           ) : error ? ( // Mostrar error si el hook lo reporta
              // Podrías mostrar un mensaje más amigable o usar Toast
              <div className="alert alert-error">Error al cargar turnos. Intenta de nuevo.</div>
           ) : turnosHoy.length === 0 ? (
              <div className="empty-state">
                <h3>No tienes turnos programados para hoy</h3>
              </div>
           ) : (
             <>
               <div className="turnos-lista">
                 {/* Mostrar solo los primeros N (ej. 5) o todos */}
                 {turnosHoy.slice(0, 5).map((turno) => (
                   <div key={turno._id} className="turno-item-simple">
                      <div className="turno-hora-simple">{formatearHora(turno.hora)}</div>
                      <div className="turno-cliente-simple">
                        {turno.cliente?.nombre} {turno.cliente?.apellido}
                      </div>
                      <div className="turno-servicio-simple">{turno.servicio?.nombre}</div>
                      {/* Badge de estado */}
                      <span className={`estado-badge estado-${turno.estado}`}>
                          {turno.estado === 'reservado' ? 'Reservado' :
                           turno.estado === 'completado' ? 'Completado' :
                           turno.estado === 'cancelado' ? 'Cancelado' :
                           turno.estado}
                      </span>
                   </div>
                 ))}
               </div>
               {/* Botón Ver Todos si hay más de N */}
               {turnosHoy.length > 5 && (
                 <Link to="/barbero/agenda" className="btn-ver-todos">
                    Ver todos los turnos de hoy ({turnosHoy.length})
                 </Link>
               )}
             </>
           )}
        </div>

        {/* Sección Próximo Turno (solo si existe) */}
        {proximoTurno && (
          <div className="seccion">
            <div className="seccion-header"><h2>Próximo turno</h2></div>
            <div className="proximo-turno-card">
               <div>
                 <label>Hora</label>
                 <span>{formatearHora(proximoTurno.hora)}</span>
               </div>
               <div>
                 <label>Cliente</label>
                 <span>{proximoTurno.cliente?.nombre} {proximoTurno.cliente?.apellido}</span>
               </div>
               <div>
                 <label>Servicio</label>
                 <span>{proximoTurno.servicio?.nombre}</span>
               </div>
            </div>
          </div>
        )}

        {/* Acciones Rápidas - AHORA AL FINAL */}
        <div className="acciones-rapidas-grid">
          <Link to="/barbero/perfil" className="accion-btn">
            <div className="accion-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span>Mi Perfil</span>
          </Link>

          <Link to="/barbero/agenda" className="accion-btn">
            <div className="accion-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <span>Mi Agenda</span>
          </Link>

          <Link to="/barbero/estadisticas" className="accion-btn">
            <div className="accion-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="20" x2="12" y2="10"/>
                <line x1="18" y1="20" x2="18" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="16"/>
              </svg>
            </div>
            <span>Estadísticas</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default BarberoDashboard;