import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import barberoService from '../services/barberoService';
import servicioService from '../services/servicioService';
import turnoService from '../services/turnoService';
import './ReservarTurno.css';

/**
 * Página de Reserva de Turnos - Mobile-First
 * Core del sistema: Permite a los clientes reservar turnos fácilmente desde el móvil
 */

const ReservarTurnoPage = () => {
  const { estaAutenticado, usuario } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const turnoEditarId = searchParams.get('editar');

  // Estados del formulario
  const [paso, setPaso] = useState(1); // 1: Servicio, 2: Fecha/Hora, 3: Barbero, 4: Confirmación
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  const [turnoOriginal, setTurnoOriginal] = useState(null);

  // Datos del formulario si no está autenticado
  const [datosCliente, setDatosCliente] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
  });

  // Datos del sistema
  const [servicios, setServicios] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [barberosOcupados, setBarberosOcupados] = useState([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar servicios al iniciar
  useEffect(() => {
    cargarServicios();
    if (turnoEditarId) {
      cargarTurnoParaEditar(turnoEditarId);
    }
  }, [turnoEditarId]);

  // Cargar barberos cuando estamos en el paso 3 (selección de barbero)
  useEffect(() => {
    if (paso === 3 && fechaSeleccionada && horaSeleccionada) {
      cargarBarberos();
      identificarBarberosOcupados();
    }
  }, [paso, fechaSeleccionada, horaSeleccionada]);

  // Cargar horarios disponibles cuando se selecciona fecha
  useEffect(() => {
    if (fechaSeleccionada && servicioSeleccionado) {
      cargarHorariosDisponibles();
    }
  }, [fechaSeleccionada, servicioSeleccionado]);

  const cargarTurnoParaEditar = async (turnoId) => {
    try {
      setLoading(true);
      const response = await turnoService.obtenerTurnoPorId(turnoId);
      const turno = response.data;

      setTurnoOriginal(turno);
      setServicioSeleccionado(turno.servicio);
      setBarberoSeleccionado(turno.barbero || 'indistinto');
      setFechaSeleccionada(turno.fecha.split('T')[0]);
      setHoraSeleccionada(turno.hora);
      setPaso(1); // Empezar desde el paso 1
    } catch (err) {
      setError('Error al cargar el turno');
    } finally {
      setLoading(false);
    }
  };

  const cargarServicios = async () => {
    try {
      setLoading(true);
      const response = await servicioService.obtenerServicios();
      setServicios(response.data.filter(s => s.activo));
    } catch (err) {
      setError('Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  };

  const cargarBarberos = async () => {
    try {
      setLoading(true);
      const response = await barberoService.obtenerBarberos();
      setBarberos(response.data.filter(b => b.activo));
    } catch (err) {
      setError('Error al cargar barberos');
    } finally {
      setLoading(false);
    }
  };

  const cargarHorariosDisponibles = async () => {
    try {
      setLoading(true);
      const params = {
        fecha: fechaSeleccionada,
        servicioId: servicioSeleccionado._id,
      };

      const response = await turnoService.obtenerHorariosDisponibles(params);
      setHorariosDisponibles(response.data.horariosDisponibles || []);
    } catch (err) {
      setError('Error al cargar horarios disponibles');
      setHorariosDisponibles([]);
    } finally {
      setLoading(false);
    }
  };

  const identificarBarberosOcupados = async () => {
    try {
      // Obtener todos los barberos
      const todosLosBarberos = await barberoService.obtenerBarberos();
      const barberosActivos = todosLosBarberos.data.filter(b => b.activo);

      // Obtener barberos disponibles para la fecha y hora seleccionada
      const response = await barberoService.obtenerBarberosDisponibles(fechaSeleccionada, horaSeleccionada);
      const barberosDisponibles = response.data;

      // Obtener los IDs de barberos ocupados (los que no están disponibles)
      const idsDisponibles = barberosDisponibles.map(b => b._id);
      const idsOcupados = barberosActivos
        .filter(b => !idsDisponibles.includes(b._id))
        .map(b => b._id);

      setBarberosOcupados(idsOcupados);
    } catch (err) {
      console.error('Error al identificar barberos ocupados:', err);
      setBarberosOcupados([]);
    }
  };

  const handleSeleccionarServicio = (servicio) => {
    setServicioSeleccionado(servicio);
    setPaso(2);
    setError('');
  };

  const handleSeleccionarBarbero = (barbero) => {
    setBarberoSeleccionado(barbero);
    setPaso(4);
    setError('');
  };

  const handleSeleccionarFecha = (e) => {
    setFechaSeleccionada(e.target.value);
    setHoraSeleccionada('');
    setError('');
  };

  const handleSeleccionarHora = (hora) => {
    setHoraSeleccionada(hora);
    setPaso(3);
    setError('');
  };

  const esHoraPasada = (hora) => {
    const hoy = new Date();
    const hoyString = hoy.toISOString().split('T')[0];

    // Solo verificar si es el día de hoy
    if (fechaSeleccionada === hoyString) {
      const [horaNum, minutoNum] = hora.split(':').map(Number);
      const horaActual = hoy.getHours();
      const minutoActual = hoy.getMinutes();

      // Si la hora es menor, está pasada
      if (horaNum < horaActual) return true;
      // Si la hora es igual pero los minutos son menores o iguales, está pasada
      if (horaNum === horaActual && minutoNum <= minutoActual) return true;
    }

    return false;
  };

  const handleChangeDatosCliente = (e) => {
    setDatosCliente({
      ...datosCliente,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleConfirmarReserva = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Si estamos editando
      if (turnoEditarId) {
        const datosActualizacion = {
          servicioId: servicioSeleccionado._id,
          fecha: fechaSeleccionada,
          hora: horaSeleccionada,
          precio: servicioSeleccionado.precioBase,
        };

        // Si seleccionó un barbero específico
        if (barberoSeleccionado && barberoSeleccionado !== 'indistinto') {
          datosActualizacion.barberoId = barberoSeleccionado._id;
        }

        await turnoService.actualizarTurno(turnoEditarId, datosActualizacion);
        setSuccess('¡Turno actualizado con éxito!');
      } else {
        // Si estamos creando un turno nuevo
        const datosReserva = {
          servicioId: servicioSeleccionado._id,
          fecha: fechaSeleccionada,
          hora: horaSeleccionada,
          precio: servicioSeleccionado.precioBase,
        };

        // Si seleccionó un barbero específico
        if (barberoSeleccionado && barberoSeleccionado !== 'indistinto') {
          datosReserva.barberoId = barberoSeleccionado._id;
        }

        // Si está autenticado, enviar datos del usuario
        if (estaAutenticado && usuario) {
          datosReserva.clienteData = {
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            telefono: usuario.telefono,
          };
        } else {
          // Si no está autenticado, enviar datos del formulario
          datosReserva.clienteData = datosCliente;
        }

        await turnoService.crearTurno(datosReserva);
        setSuccess('¡Turno reservado con éxito! Recibirás un email de confirmación.');
      }

      // Redirigir después de 2 segundos
      setTimeout(() => {
        if (estaAutenticado) {
          navigate('/cliente/turnos');
        } else {
          navigate('/');
        }
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al reservar el turno');
    } finally {
      setLoading(false);
    }
  };

  const handleVolver = () => {
    if (paso > 1) {
      setPaso(paso - 1);
      setError('');
    }
  };

  // Obtener próximos 14 días hábiles (excluyendo domingos)
  const obtenerProximosDias = () => {
    const dias = [];
    const hoy = new Date();
    let fecha = new Date(hoy);

    while (dias.length < 14) {
      if (fecha.getDay() !== 0) { // Excluir domingos
        dias.push({
          fecha: fecha.toISOString().split('T')[0],
          dia: fecha.getDate(),
          diaSemana: fecha.toLocaleDateString('es-AR', { weekday: 'short' }),
          mes: fecha.toLocaleDateString('es-AR', { month: 'short' }),
          esHoy: fecha.toDateString() === hoy.toDateString(),
          esMañana: fecha.toDateString() === new Date(hoy.getTime() + 86400000).toDateString()
        });
      }
      fecha.setDate(fecha.getDate() + 1);
    }

    return dias;
  };

  // Obtener fecha máxima (30 días adelante - solo mes actual)
  const obtenerFechaMaxima = () => {
    const hoy = new Date();
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    return finMes.toISOString().split('T')[0];
  };

  return (
    <div className="reservar-page">
      <div className="container">
        <div className="reservar-card">
          {/* Header */}
          <div className="reservar-header">
            <h1>{turnoEditarId ? 'Editar Turno' : 'Reservar Turno'}</h1>
            <div className="pasos-indicador">
              <div className={`paso ${paso >= 1 ? 'activo' : ''}`}>1</div>
              <div className="linea"></div>
              <div className={`paso ${paso >= 2 ? 'activo' : ''}`}>2</div>
              <div className="linea"></div>
              <div className={`paso ${paso >= 3 ? 'activo' : ''}`}>3</div>
              <div className="linea"></div>
              <div className={`paso ${paso >= 4 ? 'activo' : ''}`}>4</div>
            </div>
          </div>

          {/* Alertas */}
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* Paso 1: Seleccionar Servicio */}
          {paso === 1 && (
            <div className="paso-contenido">
              <h2>Selecciona un servicio</h2>
              {loading ? (
                <div className="loading">Cargando servicios...</div>
              ) : (
                <div className="servicios-grid">
                  {servicios.map((servicio) => (
                    <button
                      key={servicio._id}
                      className="servicio-card"
                      onClick={() => handleSeleccionarServicio(servicio)}
                    >
                      <h3>{servicio.nombre}</h3>
                      <p className="descripcion">{servicio.descripcion}</p>
                      <div className="servicio-info">
                        <span className="precio">${servicio.precioBase}</span>
                        <span className="duracion">{servicio.duracion} min</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Paso 2: Seleccionar Fecha y Hora */}
          {paso === 2 && (
            <div className="paso-contenido">
              <button onClick={handleVolver} className="btn-volver">
                ← Volver
              </button>
              <h2>Fecha y hora</h2>
              <div className="resumen-seleccion">
                <p>Servicio: <strong>{servicioSeleccionado?.nombre}</strong></p>
              </div>

              <div className="fecha-hora-contenedor">
                {/* Selector de Fecha - Próximos días */}
                <div className="fechas-grupo">
                  <h3>Próximos días</h3>
                  <div className="dias-grid">
                    {obtenerProximosDias().map((diaInfo) => (
                      <button
                        key={diaInfo.fecha}
                        className={`dia-btn ${fechaSeleccionada === diaInfo.fecha ? 'seleccionado' : ''}`}
                        onClick={() => {
                          setFechaSeleccionada(diaInfo.fecha);
                          setHoraSeleccionada('');
                        }}
                      >
                        <div className="dia-numero">{diaInfo.dia}</div>
                        <div className="dia-semana">{diaInfo.diaSemana}</div>
                        {diaInfo.esHoy && <div className="dia-label">Hoy</div>}
                        {diaInfo.esMañana && <div className="dia-label">Mañana</div>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selector de Hora */}
                {fechaSeleccionada && (
                  <div className="horarios-contenedor">
                    <h3>Horarios disponibles</h3>
                    {loading ? (
                      <div className="loading">Cargando horarios...</div>
                    ) : horariosDisponibles.length > 0 ? (
                      <div className="horarios-grid">
                        {horariosDisponibles.map((hora) => {
                          const horaPasada = esHoraPasada(hora);
                          return (
                            <button
                              key={hora}
                              className={`horario-btn ${
                                horaSeleccionada === hora ? 'seleccionado' : ''
                              } ${horaPasada ? 'deshabilitado' : ''}`}
                              onClick={() => !horaPasada && handleSeleccionarHora(hora)}
                              disabled={horaPasada}
                              style={{
                                opacity: horaPasada ? 0.5 : 1,
                                cursor: horaPasada ? 'not-allowed' : 'pointer'
                              }}
                            >
                              {hora}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="no-horarios">
                        No hay horarios disponibles para esta fecha
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paso 3: Seleccionar Barbero */}
          {paso === 3 && (
            <div className="paso-contenido">
              <button onClick={handleVolver} className="btn-volver">
                ← Volver
              </button>
              <h2>Selecciona tu barbero</h2>
              <div className="resumen-seleccion">
                <p>Servicio: <strong>{servicioSeleccionado?.nombre}</strong></p>
                <p>Fecha y hora: <strong>{new Date(fechaSeleccionada + 'T00:00:00').toLocaleDateString('es-AR')} - {horaSeleccionada}</strong></p>
              </div>
              {loading ? (
                <div className="loading">Cargando barberos...</div>
              ) : (
                <div className="barberos-grid">
                  {/* Opción: Indistinto */}
                  <button
                    className="barbero-card indistinto"
                    onClick={() => handleSeleccionarBarbero('indistinto')}
                  >
                    <div className="barbero-avatar">
                      <span>👤</span>
                    </div>
                    <h3>Indistinto</h3>
                    <p>Cualquier barbero disponible</p>
                  </button>

                  {/* Barberos específicos */}
                  {barberos.map((barbero) => (
                    <button
                      key={barbero._id}
                      className="barbero-card"
                      onClick={() => handleSeleccionarBarbero(barbero)}
                      disabled={barberosOcupados.includes(barbero._id)}
                      style={{
                        opacity: barberosOcupados.includes(barbero._id) ? 0.5 : 1,
                        cursor: barberosOcupados.includes(barbero._id) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <div className="barbero-avatar">
                        <span>{barbero.nombre[0]}{barbero.apellido[0]}</span>
                      </div>
                      <h3>{barbero.nombre} {barbero.apellido}</h3>
                      {barberosOcupados.includes(barbero._id) && (
                        <p className="ocupado" style={{ color: 'red', fontSize: '12px' }}>Ocupado</p>
                      )}
                      {barbero.especialidades?.length > 0 && !barberosOcupados.includes(barbero._id) && (
                        <p className="especialidades">
                          {barbero.especialidades.join(', ')}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Paso 4: Confirmación */}
          {paso === 4 && (
            <div className="paso-contenido">
              <button onClick={handleVolver} className="btn-volver">
                ← Volver
              </button>
              <h2>{turnoEditarId ? 'Confirmar cambios' : 'Confirmar reserva'}</h2>

              {/* Resumen de la reserva */}
              <div className="resumen-reserva">
                <h3>Resumen de tu turno</h3>
                <div className="resumen-item">
                  <span className="label">Servicio:</span>
                  <span className="valor">{servicioSeleccionado?.nombre}</span>
                </div>
                <div className="resumen-item">
                  <span className="label">Barbero:</span>
                  <span className="valor">
                    {barberoSeleccionado === 'indistinto'
                      ? 'Cualquiera disponible'
                      : `${barberoSeleccionado?.nombre} ${barberoSeleccionado?.apellido}`}
                  </span>
                </div>
                <div className="resumen-item">
                  <span className="label">Fecha:</span>
                  <span className="valor">
                    {new Date(fechaSeleccionada + 'T00:00:00').toLocaleDateString('es-AR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="resumen-item">
                  <span className="label">Hora:</span>
                  <span className="valor">{horaSeleccionada}</span>
                </div>
                <div className="resumen-item">
                  <span className="label">Duración:</span>
                  <span className="valor">{servicioSeleccionado?.duracion} min</span>
                </div>
                <div className="resumen-item">
                  <span className="label">Total:</span>
                  <span className="valor">${servicioSeleccionado?.precioBase}</span>
                </div>
              </div>

              {/* Formulario de datos si no está autenticado */}
              {!estaAutenticado && (
                <form onSubmit={handleConfirmarReserva} className="datos-cliente-form">
                  <h3>Tus datos</h3>
                  <div className="form-row">
                    <div className="input-group">
                      <label htmlFor="nombre" className="input-label">
                        Nombre
                      </label>
                      <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        className="input"
                        placeholder="Juan"
                        value={datosCliente.nombre}
                        onChange={handleChangeDatosCliente}
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="apellido" className="input-label">
                        Apellido
                      </label>
                      <input
                        type="text"
                        id="apellido"
                        name="apellido"
                        className="input"
                        placeholder="Pérez"
                        value={datosCliente.apellido}
                        onChange={handleChangeDatosCliente}
                        required
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="email" className="input-label">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="input"
                      placeholder="tu@email.com"
                      value={datosCliente.email}
                      onChange={handleChangeDatosCliente}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="telefono" className="input-label">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      className="input"
                      placeholder="+54 11 1234-5678"
                      value={datosCliente.telefono}
                      onChange={handleChangeDatosCliente}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Confirmando...' : turnoEditarId ? 'Confirmar cambios' : 'Confirmar Reserva'}
                  </button>
                </form>
              )}

              {/* Si está autenticado, solo botón de confirmar */}
              {estaAutenticado && (
                <button
                  onClick={handleConfirmarReserva}
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Confirmando...' : turnoEditarId ? 'Confirmar cambios' : 'Confirmar Reserva'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservarTurnoPage;
