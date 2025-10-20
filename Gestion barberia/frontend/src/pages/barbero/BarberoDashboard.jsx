import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import turnoService from '../../services/turnoService';
import { formatearFechaLarga, formatearHora } from '../utils/dateUtils'; // Importar
import './BarberoDashboard.css';

const BarberoDashboard = () => {
  const { usuario } = useAuth();
  const [turnosHoy, setTurnosHoy] = useState([]);
  const [proximoTurno, setProximoTurno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const hoy = new Date().toISOString().split('T')[0];
      const response = await turnoService.obtenerMisTurnos({ fecha: hoy, limite: 20 });
      const turnos = response.datos || [];
      setTurnosHoy(turnos);

      const proximo = turnos
        .filter(t => t.estado === 'reservado' && new Date(`${t.fecha.split('T')[0]}T${t.hora}`) > new Date()) // Asegurar que sea futuro
        .sort((a, b) => a.hora.localeCompare(b.hora))[0];
      setProximoTurno(proximo);

    } catch (err) { setError('Error al cargar datos'); }
    finally { setLoading(false); }
  };

  // Renderizado (usando formatearFechaLarga y formatearHora)
  return (
    <div className="barbero-dashboard">
      <div className="container">
        <div className="bienvenida-card">
          <h1>Hola, {usuario?.nombre}</h1>
          <p>{formatearFechaLarga(new Date())}</p> {/* Usar dateUtils */}
        </div>

        <div className="seccion">
          <div className="seccion-header"><h2>Turnos de hoy</h2></div>
          {loading ? ( <div className="loading"><div className="spinner"></div><p>Cargando...</p></div> )
           : error ? ( <div className="alert alert-error">{error}</div> )
           : turnosHoy.length === 0 ? ( <div className="empty-state"><h3>No tienes turnos hoy</h3></div> )
           : (
             <>
               <div className="turnos-lista">
                 {turnosHoy.slice(0, 3).map((turno) => ( // Mostrar solo 3
                   <div key={turno._id} className="turno-item-simple"> {/* Estilo simplificado */}
                      <div className="turno-hora-simple">{formatearHora(turno.hora)}</div>
                      <div className="turno-cliente-simple">{turno.cliente?.nombre} {turno.cliente?.apellido}</div>
                      <div className="turno-servicio-simple">{turno.servicio?.nombre}</div>
                      <span className={`estado-badge estado-${turno.estado}`}>{turno.estado}</span>
                   </div>
                 ))}
               </div>
               {turnosHoy.length > 3 && (
                 <Link to="/barbero/agenda" className="btn-ver-todos">Ver todos ({turnosHoy.length})</Link>
               )}
             </>
           )}
        </div>

        {proximoTurno && (
          <div className="seccion">
            <div className="seccion-header"><h2>Próximo turno</h2></div>
            <div className="proximo-turno-card">
               <div><label>Hora</label><span>{formatearHora(proximoTurno.hora)}</span></div>
               <div><label>Cliente</label><span>{proximoTurno.cliente?.nombre} {proximoTurno.cliente?.apellido}</span></div>
               <div><label>Servicio</label><span>{proximoTurno.servicio?.nombre}</span></div>
            </div>
          </div>
        )}

      </div>
       {/* Añadir estilos para .turno-item-simple, .turno-hora-simple, etc. si es necesario */}
       <style>{`
        .turno-item-simple { display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: #f9f9f9; border-radius: 6px; margin-bottom: 0.5rem; font-size: 0.85rem;}
        .turno-hora-simple { font-weight: bold; color: var(--primary); min-width: 50px; }
        .turno-cliente-simple { flex-grow: 1; }
        .turno-servicio-simple { color: #555; }
        .proximo-turno-card { background: #e7f3ff; border-left: 4px solid #007bff; padding: 1rem; border-radius: 6px; display: flex; flex-direction: column; gap: 0.5rem; }
        .proximo-turno-card div { display: flex; justify-content: space-between; }
        .proximo-turno-card label { font-weight: bold; color: #555; font-size: 0.8rem; }
        .proximo-turno-card span { font-size: 0.9rem; }
       `}</style>
    </div>
  );
};

export default BarberoDashboard;