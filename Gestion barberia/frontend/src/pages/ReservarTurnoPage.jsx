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
  const [paso, setPaso] = useState(1); // 1: Servicio, 2: Barbero, 3: Fecha/Hora, 4: Confirmación
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
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Horarios base de la barbería (todos los horarios posibles)
  const horariosBase = [
    '09:00', '09:45', '10:30', '11:00', '11:45', '12:30',
    '13:15', '14:00', '14:45', '15:30', '16:15', '17:00',
    '17:45', '18:30'
  ];

  // Cargar servicios al iniciar
  useEffect(() => {
    cargarServicios();
    if (turnoEditarId) {
      cargarTurnoParaEditar(turnoEditarId);
    }
  }, [turnoEditarId]);

  // Cargar barberos cuando estamos en el paso 2 (selección de barbero)
  useEffect(() => {
    if (paso === 2) {
      cargarBarberos();
    }
  }, [paso]);

  // Cargar horarios disponibles cuando se selecciona fecha (en el paso 3)
  useEffect(() => {
    if (fechaSeleccionada && servicioSeleccionado && barberoSeleccionado) {
      cargarHorariosDisponibles();
    }
  }, [fechaSeleccionada, servicioSeleccionado, barberoSeleccionado]);

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

      // Si se seleccionó un barbero específico, incluir su ID en la consulta
      if (barberoSeleccionado && barberoSeleccionado !== 'indistinto') {
        params.barberoId = barberoSeleccionado._id;
      }

      const response = await turnoService.obtenerHorariosDisponibles(params);
      setHorariosDisponibles(response.data.horariosDisponibles || []);
    } catch (err) {
      setError('Error al cargar horarios disponibles');
      setHorariosDisponibles([]);
    } finally {
      setLoading(false);
    }
  };


  const handleSeleccionarServicio = (servicio) => {
    setServicioSeleccionado(servicio);
    setPaso(2);
    setError('');
  };

  const handleSeleccionarBarbero = (barbero) => {
    setBarberoSeleccionado(barbero);
    setPaso(3);
    setError('');
  };

  const handleSeleccionarFecha = (e) => {
    setFechaSeleccionada(e.target.value);
    setHoraSeleccionada('');
    setError('');
  };

  const handleSeleccionarHora = (hora) => {
    setHoraSeleccionada(hora);
    setPaso(4);
    setError('');
  };

  const esHoraPasada = (hora) => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    const hoyString = `${year}-${month}-${day}`;

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

  const esHorarioDisponible = (hora) => {
    return horariosDisponibles.includes(hora);
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
      // Validar que el usuario tenga un teléfono válido si está autenticado
      if (estaAutenticado && usuario && (usuario.telefono === '0000000000' || !usuario.telefono)) {
        setError('Debes completar tu número de teléfono en tu perfil antes de reservar un turno. Ve a "Mi Perfil" para actualizarlo.');
        setLoading(false);
        return;
      }

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

  // Helper para obtener fecha local en formato YYYY-MM-DD
  const obtenerFechaLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Obtener próximos 14 días hábiles (excluyendo domingos)
  const obtenerProximosDias = () => {
    const dias = [];
    const hoy = new Date();
    let fecha = new Date(hoy);

    while (dias.length < 14) {
      if (fecha.getDay() !== 0) { // Excluir domingos
        dias.push({
          fecha: obtenerFechaLocal(fecha),
          dia: fecha.getDate(),
          diaSemana: fecha.toLocaleDateString('es-AR', { weekday: 'short' }),
          mes: fecha.toLocaleDateString('es-AR', { month: 'short' }),
          esHoy: obtenerFechaLocal(fecha) === obtenerFechaLocal(hoy),
          esMañana: obtenerFechaLocal(fecha) === obtenerFechaLocal(new Date(hoy.getTime() + 86400000))
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
    return obtenerFechaLocal(finMes);
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

          {/* Paso 2: Seleccionar Barbero */}
          {paso === 2 && (
            <div className="paso-contenido">
              <button onClick={handleVolver} className="btn-volver">
                ← Volver
              </button>
              <h2>Selecciona tu barbero</h2>
              <div className="resumen-seleccion">
                <p>Servicio: <strong>{servicioSeleccionado?.nombre}</strong></p>
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
                    >
                      <div className="barbero-avatar">
                        <span>{barbero.nombre[0]}{barbero.apellido[0]}</span>
                      </div>
                      <h3>{barbero.nombre} {barbero.apellido}</h3>
                      {barbero.especialidades?.length > 0 && (
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

          {/* Paso 3: Seleccionar Fecha y Hora */}
          {paso === 3 && (
            <div className="paso-contenido">
              <button onClick={handleVolver} className="btn-volver">
                ← Volver
              </button>
              <h2>Fecha y hora</h2>
              <div className="resumen-seleccion">
                <p>Servicio: <strong>{servicioSeleccionado?.nombre}</strong></p>
                <p>Barbero: <strong>
                  {barberoSeleccionado === 'indistinto'
                    ? 'Cualquiera disponible'
                    : `${barberoSeleccionado?.nombre} ${barberoSeleccionado?.apellido}`}
                </strong></p>
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
                    <h3>Horarios</h3>
                    {loading ? (
                      <div className="loading">Cargando horarios...</div>
                    ) : (
                      <div className="horarios-grid">
                        {horariosBase.map((hora) => {
                          const horaPasada = esHoraPasada(hora);
                          const disponible = esHorarioDisponible(hora);
                          const deshabilitado = horaPasada || !disponible;

                          return (
                            <button
                              key={hora}
                              className={`horario-btn ${
                                horaSeleccionada === hora ? 'seleccionado' : ''
                              } ${deshabilitado ? 'deshabilitado' : ''}`}
                              onClick={() => !deshabilitado && handleSeleccionarHora(hora)}
                              disabled={deshabilitado}
                              style={{
                                opacity: deshabilitado ? 0.4 : 1,
                                cursor: deshabilitado ? 'not-allowed' : 'pointer',
                                pointerEvents: deshabilitado ? 'none' : 'auto'
                              }}
                              title={
                                horaPasada
                                  ? 'Horario pasado'
                                  : !disponible
                                    ? 'No disponible'
                                    : 'Disponible'
                              }
                            >
                              <span style={{ display: 'block' }}>{hora}</span>
                              {horaPasada && <span style={{ fontSize: '10px', display: 'block', marginTop: '8px' }}>(Pasado)</span>}
                              {!horaPasada && !disponible && <span style={{ fontSize: '10px', display: 'block', marginTop: '8px' }}>(Ocupado)</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
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
