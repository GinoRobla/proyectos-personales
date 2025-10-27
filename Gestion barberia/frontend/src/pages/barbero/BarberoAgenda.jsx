import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import turnoService from '../../services/turnoService';
import { formatearFechaLarga, formatearHora, obtenerFechaLocalISO } from '../../utils/dateUtils'; // Importar
import './BarberoAgenda.css';

const BarberoAgenda = () => {
  const toast = useToast();
  const [turnos, setTurnos] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(obtenerFechaLocalISO()); // Usar util
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarTurnos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaSeleccionada]);

  const cargarTurnos = async () => {
    try {
      setLoading(true);
      setError('');
      // NO filtrar por estado - queremos mostrar TODOS (reservado, completado, cancelado)
      const params = { fecha: fechaSeleccionada };
      const response = await turnoService.obtenerMisTurnos(params);
      console.log('[DEBUG BarberoAgenda] Response:', response);
      // Ordenar por hora - manejar ambas estructuras de respuesta
      const turnosArray = response.datos || response.turnos || [];
      const turnosOrdenados = turnosArray.sort((a, b) => a.hora.localeCompare(b.hora));
      console.log('[DEBUG BarberoAgenda] Turnos ordenados:', turnosOrdenados);
      setTurnos(turnosOrdenados);
    } catch (err) {
      const mensajeError = 'No se pudieron cargar los turnos. Intenta de nuevo';
      setError(mensajeError);
      toast.error(mensajeError, 4000);
      console.error('[DEBUG BarberoAgenda] Error:', err);
    }
    finally { setLoading(false); }
  };

  const handleCambiarFecha = (e) => setFechaSeleccionada(e.target.value);

  // --- NAVEGACIÓN ENTRE DÍAS ---
  const cambiarDia = (offset) => {
    const [year, month, day] = fechaSeleccionada.split('-').map(Number);
    // Crear fecha en zona local para evitar problemas de conversión UTC
    const fecha = new Date(year, month - 1, day);
    fecha.setDate(fecha.getDate() + offset);
    const nuevaFecha = obtenerFechaLocalISO(fecha);
    console.log('[DEBUG cambiarDia] Fecha actual:', fechaSeleccionada, 'Offset:', offset, 'Nueva fecha:', nuevaFecha);
    setFechaSeleccionada(nuevaFecha);
  };
  const handleDiaAnterior = () => cambiarDia(-1);
  const handleDiaSiguiente = () => {
    console.log('[DEBUG handleDiaSiguiente] Intentando ir al día siguiente desde:', fechaSeleccionada);
    cambiarDia(1);
  };
  const handleHoy = () => setFechaSeleccionada(obtenerFechaLocalISO()); // Usar util

  const esHoy = () => fechaSeleccionada === obtenerFechaLocalISO(); // Usar util

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'reservado': return 'Reservado';
      case 'completado': return 'Completado';
      case 'cancelado': return 'Cancelado';
      default: return estado;
    }
  };

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
                   <span className={`estado-badge estado-${turno.estado}`}>{getEstadoTexto(turno.estado)}</span>
               </div>
             ))}
           </div>
         )}
      </div>
      
    </div>
  );
};

export default BarberoAgenda;