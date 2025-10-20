import { useState, useEffect } from 'react';
import turnoService from '../../services/turnoService';
import { formatearFechaLarga, formatearHora, obtenerFechaLocalISO } from '../utils/dateUtils'; // Importar
import './BarberoAgenda.css';

const BarberoAgenda = () => {
  const [turnos, setTurnos] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(obtenerFechaLocalISO()); // Usar util
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarTurnos();
  }, [fechaSeleccionada]);

  const cargarTurnos = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { fecha: fechaSeleccionada };
      const response = await turnoService.obtenerMisTurnos(params);
      // Ordenar por hora
      const turnosOrdenados = (response.datos || []).sort((a, b) => a.hora.localeCompare(b.hora));
      setTurnos(turnosOrdenados);
    } catch (err) { setError('Error al cargar turnos'); }
    finally { setLoading(false); }
  };

  const handleCambiarFecha = (e) => setFechaSeleccionada(e.target.value);

  // --- NAVEGACIÓN ENTRE DÍAS ---
  const cambiarDia = (offset) => {
    const [year, month, day] = fechaSeleccionada.split('-').map(Number);
    // Usar UTC para evitar problemas de zona horaria al sumar/restar días
    const fecha = new Date(Date.UTC(year, month - 1, day));
    fecha.setUTCDate(fecha.getUTCDate() + offset);
    setFechaSeleccionada(obtenerFechaLocalISO(fecha)); // Usar util
  };
  const handleDiaAnterior = () => cambiarDia(-1);
  const handleDiaSiguiente = () => cambiarDia(1);
  const handleHoy = () => setFechaSeleccionada(obtenerFechaLocalISO()); // Usar util

  const esHoy = () => fechaSeleccionada === obtenerFechaLocalISO(); // Usar util

  // Renderizado (usando dateUtils)
  return (
    <div className="barbero-agenda">
      <div className="container">
        <div className="page-header">
          <div><h1>Mi Agenda</h1><p>Gestiona tus turnos</p></div>
        </div>

        {/* Selector de Fecha */}
        <div className="fecha-selector">
          <button onClick={handleDiaAnterior} className="btn-nav">←</button>
          <div className="fecha-actual"><span className="fecha-texto">{formatearFechaLarga(fechaSeleccionada)}</span></div> {/* Usar dateUtils */}
          <button onClick={handleDiaSiguiente} className="btn-nav">→</button>
        </div>
        <div className="fecha-manual-container">
          <input type="date" value={fechaSeleccionada} onChange={handleCambiarFecha} className="input-fecha" />
          {!esHoy() && <button onClick={handleHoy} className="btn-ir-hoy">Ir a hoy</button>}
        </div>

        {/* Contenido */}
        {loading ? ( <div className="loading"><div className="spinner"></div><p>Cargando...</p></div> )
         : error ? ( <div className="alert alert-error">{error}</div> )
         : turnos.length === 0 ? ( <div className="empty-state"><h3>No hay turnos para esta fecha</h3></div> )
         : (
           <div className="turnos-lista">
             {turnos.map((turno) => (
               <div key={turno._id} className="turno-agenda-item"> {/* Clase CSS para estilo */}
                  <div className="turno-agenda-hora">{formatearHora(turno.hora)}</div> {/* Usar dateUtils */}
                  <div className="turno-agenda-info">
                    <div className="turno-agenda-servicio">{turno.servicio?.nombre}</div>
                    <div className="turno-agenda-cliente">{turno.cliente?.nombre} {turno.cliente?.apellido} ({turno.cliente?.telefono})</div>
                  </div>
                   <span className={`estado-badge estado-${turno.estado}`}>{turno.estado}</span>
               </div>
             ))}
           </div>
         )}
      </div>
      {/* Añadir estilos para .turno-agenda-item y sus hijos */}
      <style>{`
        .turno-agenda-item { display: flex; align-items: center; gap: 1rem; padding: 0.8rem; background: white; border-radius: 6px; margin-bottom: 0.5rem; border: 1px solid #eee; }
        .turno-agenda-hora { font-weight: bold; font-size: 1rem; color: var(--primary); min-width: 60px; text-align: center; }
        .turno-agenda-info { flex-grow: 1; display: flex; flex-direction: column; gap: 0.2rem; }
        .turno-agenda-servicio { font-weight: 600; font-size: 0.9rem; }
        .turno-agenda-cliente { font-size: 0.8rem; color: #555; }
        .estado-badge { /* Asegúrate que los estilos del badge funcionen aquí */ }
      `}</style>
    </div>
  );
};

export default BarberoAgenda;