import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import turnoService from '../../services/turnoService';
import barberoService from '../../services/barberoService';
import './Dashboard.css';

const TurnosSinAsignar = () => {
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

      // Cargar todos los turnos confirmados
      const turnosResponse = await turnoService.obtenerTodos({
        estado: 'confirmado'
      });

      // Filtrar turnos sin barbero asignado
      const turnosData = turnosResponse.datos || turnosResponse.turnos || [];
      const sinBarbero = turnosData.filter(turno => !turno.barbero);
      setTurnosSinBarbero(sinBarbero);

      // Cargar barberos
      const barberosData = await barberoService.obtenerBarberos();
      setBarberos(barberosData.data || barberosData || []);

      // Verificar disponibilidad de barberos para cada turno
      await verificarDisponibilidadBarberos(sinBarbero, barberosData.data || barberosData || [], turnosData);
    } catch (err) {
      toast.error('Error al cargar datos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const verificarDisponibilidadBarberos = async (turnosSinBarbero, barberos, todosLosTurnos) => {
    const disponibilidad = {};
    const turnosConBarbero = todosLosTurnos.filter(t => t.barbero && t.barbero._id);

    for (const turno of turnosSinBarbero) {
      disponibilidad[turno._id] = {};

      for (const barbero of barberos) {
        const turnosBarberoMismaFecha = turnosConBarbero.filter(t => {
          const mismoBarbero = t.barbero._id === barbero._id;
          const mismaFecha = new Date(t.fecha).toDateString() === new Date(turno.fecha).toDateString();
          return mismoBarbero && mismaFecha;
        });

        const hayConflicto = verificarConflicto(turno, turnosBarberoMismaFecha);
        disponibilidad[turno._id][barbero._id] = !hayConflicto;
      }
    }

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
      // Filtrar solo turnos confirmados o pendientes para la agenda
      const turnosAgenda = turnosData.filter(t =>
        t.estado === 'confirmado' || t.estado === 'pendiente'
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

  const calcularHoraFin = (horaInicio, duracionMinutos) => {
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const totalMinutos = horas * 60 + minutos + duracionMinutos;
    const nuevasHoras = Math.floor(totalMinutos / 60);
    const nuevosMinutos = totalMinutos % 60;
    return `${nuevasHoras.toString().padStart(2, '0')}:${nuevosMinutos.toString().padStart(2, '0')}`;
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

      if ((inicioNuevo < finExist) && (finNuevo > inicioExist)) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="admin-dashboard">
      <div className="container">
        <h1 className="dashboard-title">Turnos sin Barbero Asignado</h1>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando...</p>
          </div>
        ) : (
          <>
            {turnosSinBarbero.length > 0 ? (
              <div className="admin-section">
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                  Total de turnos pendientes: <strong>{turnosSinBarbero.length}</strong>
                </p>
                <div className="turnos-sin-barbero">
                  {turnosSinBarbero.map((turno) => (
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
                  <h3>Horarios ocupados:</h3>
                  {turnosBarbero.length > 0 ? (
                    <div className="horarios-ocupados-grid">
                      {turnosBarbero
                        .sort((a, b) => a.hora.localeCompare(b.hora))
                        .map((turno) => {
                          const horaFin = calcularHoraFin(turno.hora, turno.servicio?.duracion || 45);
                          return (
                            <div key={turno._id} className="horario-ocupado-badge">
                              {turno.hora} - {horaFin}
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

export default TurnosSinAsignar;