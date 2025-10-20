// frontend/src/pages/ReservarTurnoPage.jsx (REFACTORIZADO)

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import barberoService from '../services/barberoService';
import servicioService from '../services/servicioService';
import { turnoService } from '../services/turnoService';
import useApi from '../hooks/useApi';

// Importar los nuevos componentes de pasos
import Paso1_Servicios from './ReservarTurno/Paso1_Servicios';
import Paso2_Barberos from './ReservarTurno/Paso2_Barberos';
import Paso3_FechaHora from './ReservarTurno/Paso3_FechaHora';
import Paso4_Confirmacion from './ReservarTurno/Paso4_Confirmacion';

import './ReservarTurno.css';

const ReservarTurnoPage = () => {
  const { estaAutenticado, usuario } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const turnoEditarId = searchParams.get('editar');

  // --- ESTADO DEL FLUJO ---
  const [paso, setPaso] = useState(1);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [horaSeleccionada, setHoraSeleccionada] = useState('');

  // --- ESTADO DE DATOS (cacheados) ---
  const [servicios, setServicios] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [diasDisponibles, setDiasDisponibles] = useState([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  
  // --- HOOKS DE API ---
  const { loading: loadingServicios, request: cargarServiciosApi } = useApi(servicioService.obtenerServicios);
  const { loading: loadingDias, request: cargarDiasApi } = useApi(turnoService.obtenerDiasDisponibles);
  const { loading: loadingBarberos, request: cargarBarberosApi } = useApi(barberoService.obtenerBarberos);
  const { loading: loadingHorarios, request: cargarHorariosApi } = useApi(turnoService.obtenerHorariosDisponibles);
  
  const { loading: loadingCrear, request: crearTurnoApi } = useApi(turnoService.crearTurno);
  const { loading: loadingEditar, request: editarTurnoApi } = useApi(turnoService.actualizarTurno);

  const isConfirmando = loadingCrear || loadingEditar;

  // --- EFECTOS DE CARGA DE DATOS ---

  // Cargar servicios y días al inicio
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      // Ejecutar en paralelo
      const [serviciosRes, diasRes] = await Promise.all([
        cargarServiciosApi(true), // Solo activos
        cargarDiasApi(),
      ]);
      
      if (serviciosRes.success) {
        setServicios(serviciosRes.data || []);
      }
      if (diasRes.success) {
        setDiasDisponibles(diasRes.data || []);
      }
      // Los errores ya los maneja useApi con un toast
    };
    cargarDatosIniciales();
  }, [cargarServiciosApi, cargarDiasApi]);

  // Cargar barberos cuando se avanza al paso 2 (si no están cacheados)
  const cargarBarberos = useCallback(async () => {
    if (barberos.length === 0) {
      const { success, data } = await cargarBarberosApi();
      if (success) {
        setBarberos(data.filter(b => b.activo) || []);
      }
    }
  }, [barberos.length, cargarBarberosApi]);

  // Cargar horarios cuando se selecciona una fecha
  const cargarHorarios = useCallback(async (fecha, servicio, barbero) => {
    const params = {
      fecha: fecha,
      servicioId: servicio._id,
    };
    if (barbero !== 'indistinto') {
      params.barberoId = barbero._id;
    }
    
    const { success, data } = await cargarHorariosApi(params);
    if (success) {
      setHorariosDisponibles(data.horariosDisponibles || []);
    } else {
      setHorariosDisponibles([]); // Limpiar horarios si falla
    }
  }, [cargarHorariosApi]);


  // --- MANEJADORES DE PASOS ---

  const handleSeleccionarServicio = (servicio) => {
    setServicioSeleccionado(servicio);
    setPaso(2);
    cargarBarberos(); // Precargar barberos para el siguiente paso
  };

  const handleSeleccionarBarbero = (barbero) => {
    setBarberoSeleccionado(barbero);
    setPaso(3);
    // Si ya había una fecha, recargar horarios con el nuevo barbero
    if (fechaSeleccionada && servicioSeleccionado) {
       cargarHorarios(fechaSeleccionada, servicioSeleccionado, barbero);
    }
  };

  const handleSeleccionarFecha = (fecha) => {
    setFechaSeleccionada(fecha);
    setHoraSeleccionada(''); // Resetear hora
    // Cargar horarios al seleccionar fecha
    if (servicioSeleccionado && barberoSeleccionado) {
      cargarHorarios(fecha, servicioSeleccionado, barberoSeleccionado);
    }
  };

  const handleSeleccionarHora = (hora) => {
    setHoraSeleccionada(hora);
    setPaso(4); // Avanzar a confirmación
  };

  const handleConfirmarReserva = async (datosCliente) => {
    // Validación de teléfono para usuarios logueados
    if (estaAutenticado && usuario && !usuario.telefono) {
      toast.error('Por favor, completa tu teléfono en "Mi Perfil" antes de reservar.');
      return;
    }

    const datosTurno = {
      servicioId: servicioSeleccionado._id,
      fecha: fechaSeleccionada,
      hora: horaSeleccionada,
      precio: servicioSeleccionado.precioBase,
      barberoId: barberoSeleccionado === 'indistinto' ? null : barberoSeleccionado._id,
      // Usar datos del usuario logueado o del formulario
      clienteData: estaAutenticado ? { ...usuario } : { ...datosCliente },
    };

    let response;
    if (turnoEditarId) {
      response = await editarTurnoApi(turnoEditarId, datosTurno);
    } else {
      response = await crearTurnoApi(datosTurno);
    }

    if (response.success) {
      toast.success(`¡Turno ${turnoEditarId ? 'actualizado' : 'reservado'} con éxito!`);
      setTimeout(() => {
        // Redirigir a "mis turnos" si está logueado, o a home si no
        navigate(estaAutenticado ? '/cliente/turnos' : '/');
      }, 1500);
    }
    // El error (ej: turno ya ocupado) lo maneja useApi
  };

  // Volver al paso anterior
  const handleVolver = () => (paso > 1) && setPaso(paso - 1);

  // --- RENDERIZADO DEL CONTENEDOR ---

  const renderPaso = () => {
    switch (paso) {
      case 1:
        return (
          <Paso1_Servicios
            servicios={servicios}
            onSeleccionarServicio={handleSeleccionarServicio}
            loading={loadingServicios || loadingDias}
          />
        );
      case 2:
        return (
          <Paso2_Barberos
            barberos={barberos}
            onSeleccionarBarbero={handleSeleccionarBarbero}
            loading={loadingBarberos}
          />
        );
      case 3:
        return (
          <Paso3_FechaHora
            diasDisponibles={diasDisponibles}
            horariosDisponibles={horariosDisponibles}
            fechaSeleccionada={fechaSeleccionada}
            horaSeleccionada={horaSeleccionada}
            onSeleccionarFecha={handleSeleccionarFecha}
            onSeleccionarHora={handleSeleccionarHora}
            loadingHorarios={loadingHorarios}
          />
        );
      case 4:
        return (
          <Paso4_Confirmacion
            resumen={{
              servicio: servicioSeleccionado,
              barbero: barberoSeleccionado,
              fecha: fechaSeleccionada,
              hora: horaSeleccionada,
            }}
            onConfirmarReserva={handleConfirmarReserva}
            loading={isConfirmando}
            turnoEditarId={turnoEditarId}
          />
        );
      default:
        return <Paso1_Servicios servicios={servicios} onSeleccionarServicio={handleSeleccionarServicio} loading={loadingServicios} />;
    }
  };

  return (
    <div className="reservar-page">
      <div className="container">
        <div className="reservar-card">
          {/* Header con indicador de pasos */}
          <div className="reservar-header">
            <h1>{turnoEditarId ? 'Editar Turno' : 'Reservar Turno'}</h1>
            <div className="pasos-indicador">
              <div className={`paso ${paso >= 1 ? 'activo' : ''}`}>1</div><div className="linea"></div>
              <div className={`paso ${paso >= 2 ? 'activo' : ''}`}>2</div><div className="linea"></div>
              <div className={`paso ${paso >= 3 ? 'activo' : ''}`}>3</div><div className="linea"></div>
              <div className={`paso ${paso >= 4 ? 'activo' : ''}`}>4</div>
            </div>
          </div>
          
          {/* Botón Volver (si no es el paso 1 ni el 5/éxito) */}
          {paso > 1 && paso < 5 && (
             <button onClick={handleVolver} className="btn-volver">← Volver</button>
          )}

          {/* Resumen de selección (en pasos 3 y 4) */}
          {paso === 3 && servicioSeleccionado && (
             <div className="resumen-seleccion-inline">
                <p>Servicio: <strong>{servicioSeleccionado?.nombre}</strong></p>
             </div>
          )}
          {paso === 4 && servicioSeleccionado && barberoSeleccionado && (
             <div className="resumen-seleccion-inline">
                <p>Servicio: <strong>{servicioSeleccionado?.nombre}</strong></p>
                <p>Barbero: <strong>{barberoSeleccionado === 'indistinto' ? 'Indistinto' : `${barberoSeleccionado?.nombre}`}</strong></p>
             </div>
          )}


          {/* Renderizar el paso actual */}
          {renderPaso()}
          
        </div>
      </div>
    </div>
  );
};

export default ReservarTurnoPage;