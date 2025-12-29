// frontend/src/pages/admin/GestionDisponibilidad.jsx

import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import disponibilidadService from '../../services/disponibilidadService';
import barberoService from '../../services/barberoService';
import configuracionService from '../../services/configuracionService';
import useModal from '../../hooks/useModal';
import { DIAS_SEMANA_LUNES_PRIMERO } from '../../constants/common';
import { formatearFechaConAjuste } from '../../utils/dateUtils';
import { validarRangoHoras, validarRangoFechas } from '../../utils/validators';
import './GestionDisponibilidad.css';

// Usar días de lunes a domingo para gestión de disponibilidad
const DIAS_SEMANA_COMPLETO = DIAS_SEMANA_LUNES_PRIMERO;

const GestionDisponibilidad = () => {
  const toast = useToast();
  const [tabActivo, setTabActivo] = useState('general'); // general, barbero, bloqueos

  // Estados para configuración
  const [configuracion, setConfiguracion] = useState(null);
  const [diasActivos, setDiasActivos] = useState(DIAS_SEMANA_COMPLETO);

  // Estados para horarios generales
  const [horariosGenerales, setHorariosGenerales] = useState([]);
  const [loadingGenerales, setLoadingGenerales] = useState(false);

  // Estados para horarios de barberos
  const [barberos, setBarberos] = useState([]);
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(null);
  const [horariosBarbero, setHorariosBarbero] = useState([]);
  const [loadingBarberos, setLoadingBarberos] = useState(false);

  // Estados para bloqueos
  const [bloqueos, setBloqueos] = useState([]);
  const [loadingBloqueos, setLoadingBloqueos] = useState(false);
  const [mostrarFormBloqueo, setMostrarFormBloqueo] = useState(false);
  const [bloqueoEditando, setBloqueoEditando] = useState(null);

  // Estados para modales de confirmación
  const { isOpen: deleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const [horarioAEliminar, setHorarioAEliminar] = useState(null);
  const { isOpen: deleteBloqueoModalOpen, openModal: openDeleteBloqueoModal, closeModal: closeDeleteBloqueoModal } = useModal();
  const [bloqueoAEliminar, setBloqueoAEliminar] = useState(null);

  // Estados para modales de edición
  const { isOpen: editHorarioModalOpen, openModal: openEditHorarioModal, closeModal: closeEditHorarioModal } = useModal();
  const [horarioEditando, setHorarioEditando] = useState(null);

  // Form para nuevo bloqueo
  const [formBloqueo, setFormBloqueo] = useState({
    barberoId: '',
    fechaInicio: '',
    fechaFin: '',
    horaInicio: '',
    horaFin: '',
    tipo: 'DIA_COMPLETO',
    motivo: '',
  });

  // ========== CARGA INICIAL ==========
  useEffect(() => {
    cargarConfiguracion();
    cargarHorariosGenerales();
    cargarBarberos();
    cargarBloqueos();
  }, []);

  useEffect(() => {
    if (barberoSeleccionado) {
      cargarHorariosBarbero(barberoSeleccionado);
    }
  }, [barberoSeleccionado]);

  // ========== FUNCIONES DE CARGA ==========

  const cargarConfiguracion = async () => {
    try {
      const response = await configuracionService.obtenerConfiguracion();
      if (response.success) {
        const config = response.data;
        setConfiguracion(config);

        // Filtrar días activos (excluir días bloqueados permanentemente)
        const diasBloqueados = config.diasBloqueadosPermanente || [];
        const diasFiltrados = DIAS_SEMANA_COMPLETO.filter(dia => !diasBloqueados.includes(dia.numero));
        setDiasActivos(diasFiltrados);
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      // Si hay error, mostrar todos los días por defecto
      setDiasActivos(DIAS_SEMANA_COMPLETO);
    }
  };

  const cargarHorariosGenerales = async () => {
    setLoadingGenerales(true);
    try {
      const response = await disponibilidadService.obtenerDisponibilidadGeneral();
      if (response.success) {
        setHorariosGenerales(response.data || []);
      } else {
        toast.error(response.message || 'Error al cargar horarios generales');
      }
    } catch (error) {
      const mensaje = error.response?.data?.message || error.message || 'Error al cargar horarios generales';
      toast.error(mensaje);
    } finally {
      setLoadingGenerales(false);
    }
  };

  const cargarBarberos = async () => {
    try {
      const response = await barberoService.obtenerBarberos();
      if (response.success) {
        setBarberos(response.data || []);
      }
    } catch (error) {
      console.error('Error al cargar barberos:', error);
    }
  };

  const cargarHorariosBarbero = async (barberoId) => {
    setLoadingBarberos(true);
    try {
      const response = await disponibilidadService.obtenerDisponibilidadBarbero(barberoId);
      if (response.success) {
        setHorariosBarbero(response.data || []);
      } else {
        toast.error(response.message || 'Error al cargar horarios del barbero');
      }
    } catch (error) {
      const mensaje = error.response?.data?.message || error.message || 'Error al cargar horarios del barbero';
      toast.error(mensaje);
    } finally {
      setLoadingBarberos(false);
    }
  };

  const cargarBloqueos = async () => {
    setLoadingBloqueos(true);
    try {
      const response = await disponibilidadService.obtenerBloqueos();
      if (response.success) {
        setBloqueos(response.data || []);
      } else {
        toast.error(response.message || 'Error al cargar bloqueos');
      }
    } catch (error) {
      const mensaje = error.response?.data?.message || error.message || 'Error al cargar bloqueos';
      toast.error(mensaje);
    } finally {
      setLoadingBloqueos(false);
    }
  };

  // ========== FUNCIONES DE HORARIOS GENERALES ==========

  const guardarHorarioGeneral = async (diaSemana, horaInicio, horaFin) => {
    if (!horaInicio || !horaFin) {
      toast.error('Debes completar hora de inicio y fin');
      return;
    }

    if (!validarRangoHoras(horaInicio, horaFin)) {
      toast.error('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    setLoadingGenerales(true);
    try {
      const response = await disponibilidadService.crearOActualizarDisponibilidadGeneral({
        diaSemana,
        horaInicio,
        horaFin,
        activo: true,
      });

      if (response.success) {
        toast.success('Horario guardado exitosamente');
        cargarHorariosGenerales();
      } else {
        toast.error(response.message || 'Error al guardar horario');
      }
    } catch (error) {
      const mensaje = error.response?.data?.message || error.message || 'Error al guardar horario';
      toast.error(mensaje);
    } finally {
      setLoadingGenerales(false);
    }
  };

  const abrirModalEliminar = (diaSemana, tipo = 'general', diaNombre = '') => {
    setHorarioAEliminar({ diaSemana, tipo, diaNombre });
    openDeleteModal();
  };

  const cerrarModalEliminar = () => {
    closeDeleteModal();
    setHorarioAEliminar(null);
  };

  const confirmarEliminar = async () => {
    if (!horarioAEliminar) return;

    const { diaSemana, tipo } = horarioAEliminar;

    if (tipo === 'general') {
      setLoadingGenerales(true);
      try {
        const response = await disponibilidadService.eliminarDisponibilidadGeneral(diaSemana);
        if (response.success) {
          toast.success('Horario eliminado');
          cargarHorariosGenerales();
          cerrarModalEliminar();
        } else {
          toast.error(response.message || 'Error al eliminar horario');
        }
      } catch (error) {
        const mensaje = error.response?.data?.message || error.message || 'Error al eliminar horario';
        toast.error(mensaje);
      } finally {
        setLoadingGenerales(false);
      }
    } else if (tipo === 'barbero') {
      setLoadingBarberos(true);
      try {
        const response = await disponibilidadService.eliminarDisponibilidadBarbero(
          barberoSeleccionado,
          diaSemana
        );
        if (response.success) {
          toast.success('Horario eliminado');
          cargarHorariosBarbero(barberoSeleccionado);
          cerrarModalEliminar();
        } else {
          toast.error(response.message || 'Error al eliminar horario');
        }
      } catch (error) {
        const mensaje = error.response?.data?.message || error.message || 'Error al eliminar horario';
        toast.error(mensaje);
      } finally {
        setLoadingBarberos(false);
      }
    }
  };

  // ========== FUNCIONES DE HORARIOS DE BARBERO ==========

  const guardarHorarioBarbero = async (diaSemana, horaInicio, horaFin) => {
    if (!barberoSeleccionado) {
      toast.error('Selecciona un barbero');
      return;
    }

    if (!horaInicio || !horaFin) {
      toast.error('Debes completar hora de inicio y fin');
      return;
    }

    if (!validarRangoHoras(horaInicio, horaFin)) {
      toast.error('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    setLoadingBarberos(true);
    try {
      const response = await disponibilidadService.crearOActualizarDisponibilidadBarbero({
        barberoId: barberoSeleccionado,
        diaSemana,
        horaInicio,
        horaFin,
        activo: true,
      });

      if (response.success) {
        toast.success('Horario del barbero guardado');
        cargarHorariosBarbero(barberoSeleccionado);
      } else {
        toast.error(response.message || 'Error al guardar horario');
      }
    } catch (error) {
      const mensaje = error.response?.data?.message || error.message || 'Error al guardar horario';
      toast.error(mensaje);
    } finally {
      setLoadingBarberos(false);
    }
  };


  // ========== FUNCIONES DE BLOQUEOS ==========

  const iniciarEdicionBloqueo = (bloqueo) => {
    setBloqueoEditando(bloqueo._id);
    setFormBloqueo({
      barberoId: bloqueo.barbero || '',
      fechaInicio: bloqueo.fechaInicio.split('T')[0],
      fechaFin: bloqueo.fechaFin.split('T')[0],
      horaInicio: bloqueo.horaInicio || '',
      horaFin: bloqueo.horaFin || '',
      tipo: bloqueo.tipo,
      motivo: bloqueo.motivo,
    });
    setMostrarFormBloqueo(true);
  };

  const cancelarEdicionBloqueo = () => {
    setBloqueoEditando(null);
    setMostrarFormBloqueo(false);
    setFormBloqueo({
      barberoId: '',
      fechaInicio: '',
      fechaFin: '',
      horaInicio: '',
      horaFin: '',
      tipo: 'DIA_COMPLETO',
      motivo: '',
    });
  };

  const crearBloqueo = async (e) => {
    e.preventDefault();

    if (!formBloqueo.fechaInicio || !formBloqueo.fechaFin || !formBloqueo.motivo) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    // Validar rango de fechas
    if (!validarRangoFechas(formBloqueo.fechaInicio, formBloqueo.fechaFin)) {
      toast.error('La fecha de fin debe ser igual o posterior a la fecha de inicio');
      return;
    }

    // Validar horas si es RANGO_HORAS
    if (formBloqueo.tipo === 'RANGO_HORAS') {
      if (!formBloqueo.horaInicio || !formBloqueo.horaFin) {
        toast.error('Para bloqueos por horas, debes especificar inicio y fin');
        return;
      }
      if (!validarRangoHoras(formBloqueo.horaInicio, formBloqueo.horaFin)) {
        toast.error('La hora de fin debe ser posterior a la hora de inicio');
        return;
      }
    }

    setLoadingBloqueos(true);
    try {
      const datos = {
        ...formBloqueo,
        barberoId: formBloqueo.barberoId || null,
      };

      let response;
      if (bloqueoEditando) {
        response = await disponibilidadService.actualizarBloqueo(bloqueoEditando, datos);
      } else {
        response = await disponibilidadService.crearBloqueo(datos);
      }

      if (response.success) {
        toast.success(`Bloqueo ${bloqueoEditando ? 'actualizado' : 'creado'} exitosamente`);
        cancelarEdicionBloqueo();
        cargarBloqueos();
      } else {
        toast.error(response.message || `Error al ${bloqueoEditando ? 'actualizar' : 'crear'} bloqueo`);
      }
    } catch (error) {
      const mensaje = error.response?.data?.message || error.message || `Error al ${bloqueoEditando ? 'actualizar' : 'crear'} bloqueo`;
      toast.error(mensaje);
    } finally {
      setLoadingBloqueos(false);
    }
  };

  const abrirModalEliminarBloqueo = (bloqueo) => {
    setBloqueoAEliminar(bloqueo);
    openDeleteBloqueoModal();
  };

  const cerrarModalEliminarBloqueo = () => {
    closeDeleteBloqueoModal();
    setBloqueoAEliminar(null);
  };

  const confirmarEliminarBloqueo = async () => {
    if (!bloqueoAEliminar) return;

    setLoadingBloqueos(true);
    try {
      const response = await disponibilidadService.eliminarBloqueo(bloqueoAEliminar._id);
      if (response.success) {
        toast.success('Bloqueo eliminado');
        cargarBloqueos();
        cerrarModalEliminarBloqueo();
      } else {
        toast.error(response.message || 'Error al eliminar bloqueo');
      }
    } catch (error) {
      const mensaje = error.response?.data?.message || error.message || 'Error al eliminar bloqueo';
      toast.error(mensaje);
    } finally {
      setLoadingBloqueos(false);
    }
  };

  // ========== FUNCIONES PARA MODALES DE EDICIÓN DE HORARIOS ==========

  const abrirModalEditarHorario = (dia, tipo) => {
    const horario = tipo === 'general'
      ? horariosGenerales.find(h => h.diaSemana === dia.numero)
      : horariosBarbero.find(h => h.diaSemana === dia.numero);

    setHorarioEditando({
      dia,
      tipo,
      horaInicio: horario?.horaInicio || '09:00',
      horaFin: horario?.horaFin || '18:00',
    });
    openEditHorarioModal();
  };

  const cerrarModalEditarHorario = () => {
    closeEditHorarioModal();
    setHorarioEditando(null);
  };

  const guardarDesdeModal = async () => {
    if (!horarioEditando) return;

    const { dia, tipo, horaInicio, horaFin } = horarioEditando;

    if (tipo === 'general') {
      await guardarHorarioGeneral(dia.numero, horaInicio, horaFin);
    } else if (tipo === 'barbero') {
      await guardarHorarioBarbero(dia.numero, horaInicio, horaFin);
    }

    cerrarModalEditarHorario();
  };

  // ========== COMPONENTE DE CUADRÍCULA DE HORARIOS ==========

  const CuadriculaHorarios = ({ horarios, onEditar, onEliminar, loading, tipo }) => {
    const obtenerHorario = (diaSemana) => {
      return horarios.find(h => h.diaSemana === diaSemana) || null;
    };

    return (
      <div className="cuadricula-horarios">
        {diasActivos.map((dia) => {
          const horario = obtenerHorario(dia.numero);

          return (
            <div key={dia.numero} className="dia-horario-card">
              <h3 className="dia-nombre">{dia.nombre}</h3>

              {!horario && (
                <div className="horario-vacio">
                  <p>Sin horario configurado</p>
                  <button
                    onClick={() => onEditar(dia, tipo)}
                    className="btn btn-sm btn-primary"
                    disabled={loading}
                  >
                    Configurar
                  </button>
                </div>
              )}

              {horario && (
                <div className="horario-definido">
                  <p className="horario-texto">
                    <strong>{horario.horaInicio}</strong> - <strong>{horario.horaFin}</strong>
                  </p>
                  <div className="horario-acciones">
                    <button
                      onClick={() => onEditar(dia, tipo)}
                      className="btn btn-sm btn-outline"
                      disabled={loading}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onEliminar(dia.numero, dia.nombre)}
                      className="btn btn-sm btn-danger"
                      disabled={loading}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ========== RENDER PRINCIPAL ==========

  return (
    <div className="gestion-disponibilidad">
      <div className="container">
        <h1>Gestión de Disponibilidad</h1>
        <p className="subtitulo">Configura los horarios de atención y bloqueos</p>

        {/* TABS */}
        <div className="tabs">
          <button
            className={`tab ${tabActivo === 'general' ? 'activo' : ''}`}
            onClick={() => setTabActivo('general')}
          >
            Horarios Generales
          </button>
          <button
            className={`tab ${tabActivo === 'barbero' ? 'activo' : ''}`}
            onClick={() => setTabActivo('barbero')}
          >
            Horarios por Barbero
          </button>
          <button
            className={`tab ${tabActivo === 'bloqueos' ? 'activo' : ''}`}
            onClick={() => setTabActivo('bloqueos')}
          >
            Bloqueos y Excepciones
          </button>
        </div>

        {/* TAB 1: HORARIOS GENERALES */}
        {tabActivo === 'general' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Horarios Generales de la Barbería</h2>
              <p>Define los días y horarios de apertura de tu negocio</p>
              {configuracion && configuracion.diasBloqueadosPermanente && configuracion.diasBloqueadosPermanente.length > 0 && (
                <div className="info-dias-bloqueados">
                  <p>ℹ️ Los días bloqueados en Configuración no aparecen aquí. Para habilitarlos, ve a Configuración del Negocio.</p>
                </div>
              )}
            </div>

            {loadingGenerales ? (
              <div className="loading">Cargando...</div>
            ) : (
              <CuadriculaHorarios
                horarios={horariosGenerales}
                onEditar={abrirModalEditarHorario}
                onEliminar={(diaSemana, diaNombre) => abrirModalEliminar(diaSemana, 'general', diaNombre)}
                loading={loadingGenerales}
                tipo="general"
              />
            )}
          </div>
        )}

        {/* TAB 2: HORARIOS POR BARBERO */}
        {tabActivo === 'barbero' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Horarios por Barbero</h2>
              <p>Configura horarios específicos para cada barbero</p>
              {configuracion && configuracion.diasBloqueadosPermanente && configuracion.diasBloqueadosPermanente.length > 0 && (
                <div className="info-dias-bloqueados">
                  <p>ℹ️ Los días bloqueados en Configuración no aparecen aquí. Para habilitarlos, ve a Configuración del Negocio.</p>
                </div>
              )}
            </div>

            <div className="selector-barbero">
              <label>Selecciona un barbero:</label>
              <select
                value={barberoSeleccionado || ''}
                onChange={(e) => setBarberoSeleccionado(e.target.value)}
                className="input"
              >
                <option value="">-- Selecciona un barbero --</option>
                {barberos.map((barbero) => (
                  <option key={barbero._id} value={barbero._id}>
                    {barbero.nombre} {barbero.apellido}
                  </option>
                ))}
              </select>
            </div>

            {barberoSeleccionado && (
              <>
                {loadingBarberos ? (
                  <div className="loading">Cargando...</div>
                ) : (
                  <CuadriculaHorarios
                    horarios={horariosBarbero}
                    onEditar={abrirModalEditarHorario}
                    onEliminar={(diaSemana, diaNombre) => abrirModalEliminar(diaSemana, 'barbero', diaNombre)}
                    loading={loadingBarberos}
                    tipo="barbero"
                  />
                )}
              </>
            )}

            {!barberoSeleccionado && (
              <div className="empty-state">
                <p>Selecciona un barbero para configurar sus horarios</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BLOQUEOS */}
        {tabActivo === 'bloqueos' && (
          <div className="tab-content">
            <div className="tab-header-with-button">
              <div className="tab-header">
                <h2>Bloqueos y Excepciones</h2>
                <p>Gestiona vacaciones, feriados y días no disponibles</p>
              </div>
              <button
                onClick={() => setMostrarFormBloqueo(true)}
                className="btn btn-primary btn-nuevo-bloqueo"
                disabled={mostrarFormBloqueo}
              >
                + Nuevo Bloqueo
              </button>
            </div>

            {mostrarFormBloqueo && (
              <div className="modal-overlay" onClick={() => !loadingBloqueos && cancelarEdicionBloqueo()}>
                <div className="modal-content-bloqueo" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>{bloqueoEditando ? 'Editar Bloqueo' : 'Nuevo Bloqueo'}</h2>
                    <button
                      className="modal-close"
                      onClick={cancelarEdicionBloqueo}
                      disabled={loadingBloqueos}
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={crearBloqueo} className="form-bloqueo-modal">
                <div className="form-row">
                  <div className="input-group">
                    <label>Barbero (opcional)</label>
                    <select
                      value={formBloqueo.barberoId}
                      onChange={(e) => setFormBloqueo({ ...formBloqueo, barberoId: e.target.value })}
                      className="input"
                    >
                      <option value="">Bloqueo General (toda la barbería)</option>
                      {barberos.map((barbero) => (
                        <option key={barbero._id} value={barbero._id}>
                          {barbero.nombre} {barbero.apellido}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Tipo de Bloqueo</label>
                    <select
                      value={formBloqueo.tipo}
                      onChange={(e) => setFormBloqueo({ ...formBloqueo, tipo: e.target.value })}
                      className="input"
                      required
                    >
                      <option value="DIA_COMPLETO">Día Completo</option>
                      <option value="RANGO_HORAS">Rango de Horas</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>Fecha Inicio *</label>
                    <input
                      type="date"
                      value={formBloqueo.fechaInicio}
                      onChange={(e) => setFormBloqueo({ ...formBloqueo, fechaInicio: e.target.value })}
                      className="input"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Fecha Fin *</label>
                    <input
                      type="date"
                      value={formBloqueo.fechaFin}
                      onChange={(e) => setFormBloqueo({ ...formBloqueo, fechaFin: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                </div>

                {formBloqueo.tipo === 'RANGO_HORAS' && (
                  <div className="form-row">
                    <div className="input-group">
                      <label>Hora Inicio</label>
                      <input
                        type="time"
                        value={formBloqueo.horaInicio}
                        onChange={(e) => setFormBloqueo({ ...formBloqueo, horaInicio: e.target.value })}
                        className="input"
                      />
                    </div>

                    <div className="input-group">
                      <label>Hora Fin</label>
                      <input
                        type="time"
                        value={formBloqueo.horaFin}
                        onChange={(e) => setFormBloqueo({ ...formBloqueo, horaFin: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>
                )}

                <div className="input-group">
                  <label>Motivo *</label>
                  <input
                    type="text"
                    value={formBloqueo.motivo}
                    onChange={(e) => setFormBloqueo({ ...formBloqueo, motivo: e.target.value })}
                    className="input"
                    placeholder="Ej: Vacaciones, Feriado, Capacitación..."
                    required
                  />
                </div>

                    <div className="modal-footer">
                      <button
                        type="button"
                        onClick={cancelarEdicionBloqueo}
                        className="btn btn-outline"
                        disabled={loadingBloqueos}
                      >
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={loadingBloqueos}>
                        {loadingBloqueos
                          ? (bloqueoEditando ? 'Actualizando...' : 'Creando...')
                          : (bloqueoEditando ? 'Actualizar Bloqueo' : 'Crear Bloqueo')
                        }
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* LISTA DE BLOQUEOS */}
            {loadingBloqueos && !mostrarFormBloqueo ? (
              <div className="loading">Cargando bloqueos...</div>
            ) : bloqueos.length === 0 ? (
              <div className="empty-state">
                <p>No hay bloqueos registrados</p>
              </div>
            ) : (
              <div className="lista-bloqueos">
                {bloqueos.map((bloqueo) => (
                  <div key={bloqueo._id} className="bloqueo-card">
                    <div className="bloqueo-header">
                      <span className={`badge ${bloqueo.barbero ? 'badge-barbero' : 'badge-general'}`}>
                        {bloqueo.barberoNombre}
                      </span>
                      <span className="badge badge-tipo">{bloqueo.tipo.replace('_', ' ')}</span>
                    </div>
                    <p className="bloqueo-motivo">{bloqueo.motivo}</p>
                    <div className="bloqueo-fechas">
                      <p>
                        <strong>Desde:</strong> {formatearFechaConAjuste(bloqueo.fechaInicio)}
                      </p>
                      <p>
                        <strong>Hasta:</strong> {formatearFechaConAjuste(bloqueo.fechaFin)}
                      </p>
                      {bloqueo.tipo === 'RANGO_HORAS' && (
                        <p>
                          <strong>Horario:</strong> {bloqueo.horaInicio} - {bloqueo.horaFin}
                        </p>
                      )}
                    </div>
                    <div className="bloqueo-acciones">
                      <button
                        onClick={() => iniciarEdicionBloqueo(bloqueo)}
                        className="btn btn-sm btn-outline"
                        disabled={loadingBloqueos}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => abrirModalEliminarBloqueo(bloqueo)}
                        className="btn btn-sm btn-danger"
                        disabled={loadingBloqueos}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE HORARIOS */}
      {deleteModalOpen && horarioAEliminar && (
        <div className="modal-overlay" onClick={cerrarModalEliminar}>
          <div className="modal-content-eliminar" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button className="modal-close" onClick={cerrarModalEliminar}>✕</button>
            </div>

            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar el horario de este día?</p>
              {horarioAEliminar.diaNombre && (
                <p className="dia-nombre-eliminar">{horarioAEliminar.diaNombre}</p>
              )}
              <p className="advertencia">Esta acción no se puede deshacer.</p>
            </div>

            <div className="modal-footer">
              <button
                onClick={cerrarModalEliminar}
                className="btn btn-outline"
                disabled={loadingGenerales || loadingBarberos}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                className="btn btn-danger"
                disabled={loadingGenerales || loadingBarberos}
              >
                {(loadingGenerales || loadingBarberos) ? 'Eliminando...' : 'Eliminar Horario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE BLOQUEOS */}
      {deleteBloqueoModalOpen && bloqueoAEliminar && (
        <div className="modal-overlay" onClick={cerrarModalEliminarBloqueo}>
          <div className="modal-content-eliminar" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button className="modal-close" onClick={cerrarModalEliminarBloqueo}>✕</button>
            </div>

            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar este bloqueo?</p>
              <div className="bloqueo-info-eliminar">
                <p><strong>Motivo:</strong> {bloqueoAEliminar.motivo}</p>
                <p><strong>Desde:</strong> {formatearFechaConAjuste(bloqueoAEliminar.fechaInicio)}</p>
                <p><strong>Hasta:</strong> {formatearFechaConAjuste(bloqueoAEliminar.fechaFin)}</p>
                {bloqueoAEliminar.barberoNombre && (
                  <p><strong>Barbero:</strong> {bloqueoAEliminar.barberoNombre}</p>
                )}
              </div>
              <p className="advertencia">Esta acción no se puede deshacer.</p>
            </div>

            <div className="modal-footer">
              <button
                onClick={cerrarModalEliminarBloqueo}
                className="btn btn-outline"
                disabled={loadingBloqueos}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminarBloqueo}
                className="btn btn-danger"
                disabled={loadingBloqueos}
              >
                {loadingBloqueos ? 'Eliminando...' : 'Eliminar Bloqueo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN DE HORARIOS */}
      {editHorarioModalOpen && horarioEditando && (
        <div className="modal-overlay" onClick={cerrarModalEditarHorario}>
          <div className="modal-content-horario" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Configurar Horario - {horarioEditando.dia.nombre}</h2>
              <button className="modal-close" onClick={cerrarModalEditarHorario}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="input-group">
                  <label>Hora de Inicio</label>
                  <input
                    type="time"
                    value={horarioEditando.horaInicio}
                    onChange={(e) => setHorarioEditando({ ...horarioEditando, horaInicio: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="input-group">
                  <label>Hora de Fin</label>
                  <input
                    type="time"
                    value={horarioEditando.horaFin}
                    onChange={(e) => setHorarioEditando({ ...horarioEditando, horaFin: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={cerrarModalEditarHorario}
                className="btn btn-outline"
                disabled={loadingGenerales || loadingBarberos}
              >
                Cancelar
              </button>
              <button
                onClick={guardarDesdeModal}
                className="btn btn-primary"
                disabled={loadingGenerales || loadingBarberos}
              >
                {(loadingGenerales || loadingBarberos) ? 'Guardando...' : 'Guardar Horario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionDisponibilidad;
