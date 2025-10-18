import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import turnoService from '../../services/turnoService';
import barberoService from '../../services/barberoService';
import './Dashboard.css';

const AdminDashboard = () => {
  const toast = useToast();

  const [turnosSinBarbero, setTurnosSinBarbero] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarAgenda, setMostrarAgenda] = useState(false);
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(null);
  const [turnoActual, setTurnoActual] = useState(null);
  const [turnosBarbero, setTurnosBarbero] = useState([]);
  const [barberosDisponibles, setBarberosDisponibles] = useState({});
  const [hayConflicto, setHayConflicto] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar todos los turnos reservados (activos) sin límite de paginación
      const turnosResponse = await turnoService.obtenerTodos({
        estado: 'reservado',
        limite: 1000 // Aumentar límite para obtener todos los turnos
      });

      // Filtrar turnos sin barbero asignado y fechas futuras (desde hoy)
      const turnosData = turnosResponse.datos || turnosResponse.turnos || [];

      // Obtener fecha de hoy en formato YYYY-MM-DD para comparación confiable
      const hoy = new Date();
      const hoyString = hoy.toISOString().split('T')[0]; // Ejemplo: "2025-10-17"

      const sinBarbero = turnosData.filter(turno => {
        // Extraer solo la fecha (sin hora) del turno
        const fechaTurnoString = turno.fecha.split('T')[0]; // Ejemplo: "2025-10-18"

        // Comparar strings de fechas (más confiable que comparar Date objects)
        return !turno.barbero && fechaTurnoString >= hoyString; // Sin barbero Y fecha futura o hoy
      });
      setTurnosSinBarbero(sinBarbero);

      // Cargar barberos (solo activos)
      const barberosData = await barberoService.obtenerBarberos();
      const barberosActivos = (barberosData.data || barberosData || []).filter(b => b.activo);
      setBarberos(barberosActivos);

      // Verificar disponibilidad de barberos para cada turno
      await verificarDisponibilidadBarberos(sinBarbero, barberosActivos, turnosData);
    } catch (err) {
      toast.error('Error al cargar datos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const verificarDisponibilidadBarberos = async (turnosSinBarbero, barberos, todosLosTurnos) => {
    const disponibilidad = {};

    // Filtrar solo turnos que tienen barbero asignado
    const turnosConBarbero = todosLosTurnos.filter(t => t.barbero && t.barbero._id);

    console.log('🔍 Verificando disponibilidad de barberos...');
    console.log('Turnos sin barbero:', turnosSinBarbero.length);
    console.log('Barberos totales:', barberos.length);
    console.log('Turnos con barbero asignado:', turnosConBarbero.length);

    for (const turno of turnosSinBarbero) {
      disponibilidad[turno._id] = {};
      console.log(`\n📅 Turno sin barbero: ${turno.hora} - ${turno.servicio?.nombre} (${turno.servicio?.duracion} min)`);

      for (const barbero of barberos) {
        // Obtener turnos del barbero en la misma fecha
        const turnosBarberoMismaFecha = turnosConBarbero.filter(t => {
          const mismoBarbero = t.barbero._id === barbero._id;
          const mismaFecha = new Date(t.fecha).toDateString() === new Date(turno.fecha).toDateString();
          return mismoBarbero && mismaFecha;
        });

        // Verificar si hay conflicto de horario
        const hayConflicto = verificarConflicto(turno, turnosBarberoMismaFecha);

        // Disponible = NO hay conflicto
        disponibilidad[turno._id][barbero._id] = !hayConflicto;

        console.log(`  ${hayConflicto ? '❌' : '✅'} ${barbero.nombre} ${barbero.apellido}: ${hayConflicto ? 'OCUPADO' : 'Disponible'}`);
        if (hayConflicto && turnosBarberoMismaFecha.length > 0) {
          turnosBarberoMismaFecha.forEach(t => {
            console.log(`     Ocupado: ${t.hora} - ${t.servicio?.nombre} (${t.servicio?.duracion} min)`);
          });
        }
      }
    }

    console.log('\n📊 Disponibilidad final:', disponibilidad);
    setBarberosDisponibles(disponibilidad);
  };

  const verAgendaBarbero = async (barbero, turno) => {
    try {
      setBarberoSeleccionado(barbero);
      setTurnoActual(turno);

      // Cargar TODOS los turnos del barbero para la fecha del turno (no solo confirmados)
      const fecha = new Date(turno.fecha).toISOString().split('T')[0];
      const turnosResponse = await turnoService.obtenerTodos({
        barberoId: barbero._id,
        fecha: fecha
      });

      const turnosData = turnosResponse.datos || turnosResponse.turnos || [];
      // Filtrar solo turnos reservados (activos) para la agenda
      const turnosAgenda = turnosData.filter(t =>
        t.estado === 'reservado'
      );
      setTurnosBarbero(turnosAgenda);

      // Verificar si hay conflicto de horarios
      const conflicto = verificarConflicto(turno, turnosAgenda);
      setHayConflicto(conflicto);

      setMostrarAgenda(true);
    } catch (err) {
      toast.error('Error al cargar agenda del barbero');
    }
  };

  const asignarBarbero = async (turnoId, barberoId) => {
    try {
      await turnoService.actualizarTurno(turnoId, { barberoId });
      toast.success('Barbero asignado correctamente');
      setMostrarAgenda(false);
      cargarDatos();
    } catch (err) {
      toast.error('Error al asignar barbero');
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const verificarConflicto = (turnoNuevo, turnosExistentes) => {
    if (!turnoNuevo || !turnoNuevo.hora || !turnoNuevo.servicio) {
      return false;
    }

    const [horasNuevo, minutosNuevo] = turnoNuevo.hora.split(':').map(Number);
    const inicioNuevo = horasNuevo * 60 + minutosNuevo;
    const duracionNuevo = turnoNuevo.servicio.duracion || 45;
    const finNuevo = inicioNuevo + duracionNuevo;

    for (const turno of turnosExistentes) {
      if (!turno || !turno.hora || !turno.servicio) {
        continue;
      }

      const [horasExist, minutosExist] = turno.hora.split(':').map(Number);
      const inicioExist = horasExist * 60 + minutosExist;
      const duracionExist = turno.servicio.duracion || 45;
      const finExist = inicioExist + duracionExist;

      // Verificar si hay solapamiento
      if ((inicioNuevo < finExist) && (finNuevo > inicioExist)) {
        return true; // Hay conflicto
      }
    }
    return false; // No hay conflicto
  };

  return (
    <div className="admin-dashboard">
      <div className="container">
        <h1 className="dashboard-title">Panel de Administración</h1>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando...</p>
          </div>
        ) : (
          <>
            {/* Turnos sin barbero asignado - Solo mostrar 2 */}
            {turnosSinBarbero.length > 0 ? (
              <div className="admin-section">
                <div className="section-header">
                  <h2>Turnos sin Barbero Asignado</h2>
                  {turnosSinBarbero.length > 2 && (
                    <Link to="/admin/turnos-sin-asignar" className="btn-ver-todos">
                      Ver todos ({turnosSinBarbero.length})
                    </Link>
                  )}
                </div>
                <div className="turnos-sin-barbero">
                  {turnosSinBarbero.slice(0, 2).map((turno) => (
                    <div key={turno._id} className="turno-card">
                      <div className="turno-info">
                        <div className="turno-cliente">
                          <strong>{turno.cliente?.nombre} {turno.cliente?.apellido}</strong>
                        </div>
                        <div className="turno-detalles">
                          <span>{formatearFecha(turno.fecha)} - {turno.hora}</span>
                          <span>{turno.servicio?.nombre}</span>
                          <span>${turno.precio || turno.servicio?.precioBase}</span>
                        </div>
                      </div>
                      <div className="turno-accion">
                        <div className="barberos-list">
                          {barberos.map((barbero) => {
                            const disponible = barberosDisponibles[turno._id]?.[barbero._id] === true;
                            return (
                              <button
                                key={barbero._id}
                                className={`btn-barbero ${!disponible ? 'ocupado' : ''}`}
                                onClick={() => disponible && verAgendaBarbero(barbero, turno)}
                                disabled={!disponible}
                                title={!disponible ? 'Barbero ocupado en este horario' : 'Ver agenda y asignar'}
                              >
                                {barbero.nombre} {barbero.apellido}
                                {!disponible && <span style={{ marginLeft: '8px', fontSize: '0.75rem', fontWeight: 'bold', color: '#dc3545' }}>OCUPADO</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mensaje-vacio">
                <p>No hay turnos sin barbero asignado</p>
              </div>
            )}

            {/* Gestión */}
            <div className="admin-section">
              <h2>Gestión</h2>
              <div className="gestion-grid">
                <Link to="/admin/barberos" className="gestion-card">
                  <div className="gestion-header">
                    
                    <h3>Barberos</h3>
                  </div>
                  <p className="gestion-descripcion">Administrar barberos del equipo</p>
                  <div className="gestion-footer">
                    <span className="gestion-link">Gestionar →</span>
                  </div>
                </Link>
                <Link to="/admin/servicios" className="gestion-card">
                  <div className="gestion-header">
                    
                    <h3>Servicios</h3>
                  </div>
                  <p className="gestion-descripcion">Administrar servicios ofrecidos</p>
                  <div className="gestion-footer">
                    <span className="gestion-link">Gestionar →</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="admin-section">
              <h2>Estadísticas</h2>
              <Link to="/admin/estadisticas" className="estadisticas-card">
                <div className="estadisticas-content">
                  
                  <div className="estadisticas-info">
                    <h3>Métricas y Reportes</h3>
                    <p>Visualiza el rendimiento de la barbería</p>
                  </div>
                </div>
                <div className="estadisticas-arrow">→</div>
              </Link>
            </div>
          </>
        )}

        {/* Modal de Agenda del Barbero */}
        {mostrarAgenda && barberoSeleccionado && turnoActual && (
          <div className="modal-overlay" onClick={() => setMostrarAgenda(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Agenda de {barberoSeleccionado.nombre} {barberoSeleccionado.apellido}</h2>
                <p className="modal-fecha">{formatearFecha(turnoActual.fecha)}</p>
                <button className="modal-close" onClick={() => setMostrarAgenda(false)}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="turno-a-asignar">
                  <h3>Turno a asignar:</h3>
                  <div className="turno-detalle">
                    <span><strong>{turnoActual.cliente?.nombre} {turnoActual.cliente?.apellido}</strong></span>
                    <span>{turnoActual.hora} - {turnoActual.servicio?.nombre}</span>
                    <span>Duración: {turnoActual.servicio?.duracion || 45} minutos</span>
                    <span>${turnoActual.precio || turnoActual.servicio?.precioBase}</span>
                  </div>
                </div>

                <div className="agenda-barbero">
                  <h3>Turnos ocupados:</h3>
                  {turnosBarbero.length > 0 ? (
                    <div className="horarios-grid">
                      {turnosBarbero
                        .sort((a, b) => a.hora.localeCompare(b.hora))
                        .map((turno) => {
                          return (
                            <div key={turno._id} className="horario-btn">
                              {turno.hora}
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="sin-turnos">Sin turnos asignados para este día</p>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-volver"
                  onClick={() => setMostrarAgenda(false)}
                >
                  Volver
                </button>
                <button
                  className="btn-asignar"
                  onClick={() => asignarBarbero(turnoActual._id, barberoSeleccionado._id)}
                  disabled={hayConflicto}
                >
                  Asignar turno
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;