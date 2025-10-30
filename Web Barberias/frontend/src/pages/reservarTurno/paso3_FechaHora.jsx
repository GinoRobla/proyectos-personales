// frontend/src/pages/ReservarTurno/Paso3_FechaHora.jsx

import React from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatearFechaCorta, obtenerFechaLocalISO } from '../../utils/dateUtils';

// ¡HORARIOS CADA 45 MINUTOS!
// Lunes a Viernes: 9:00 a 20:00 (último turno 19:15 para terminar a 20:00)
const horariosLunesViernes = [
  '09:00', '09:45', '10:30', '11:15', '12:00', '12:45',
  '13:30', '14:15', '15:00', '15:45', '16:30', '17:15',
  '18:00', '18:45', '19:15',
];

// Sábados: 8:00 a 18:00 (último turno 17:15 para terminar a 18:00)
const horariosSabado = [
  '08:00', '08:45', '09:30', '10:15', '11:00', '11:45',
  '12:30', '13:15', '14:00', '14:45', '15:30', '16:15',
  '17:00',
];

const Paso3_FechaHora = ({
  diasDisponibles,
  horariosDisponibles,
  fechaSeleccionada,
  horaSeleccionada,
  onSeleccionarFecha,
  onSeleccionarHora,
  loadingHorarios,
}) => {
  // Determinar qué horarios mostrar según el día de la semana
  const obtenerHorariosBase = () => {
    if (!fechaSeleccionada) return horariosLunesViernes;

    const fecha = new Date(fechaSeleccionada + 'T00:00:00Z');
    const diaSemana = fecha.getUTCDay(); // 0=Domingo, 6=Sábado

    return diaSemana === 6 ? horariosSabado : horariosLunesViernes;
  };

  const horariosBase = obtenerHorariosBase();

  return (
    <div className="paso-contenido">
      <h2>Elige fecha y hora</h2>
      <div className="fecha-hora-contenedor">
        {/* Selector de Día */}
        <div className="fechas-grupo">
          <h3>Días disponibles</h3>
          <div className="dias-grid">
            {diasDisponibles.map((fechaISO) => {
              const fechaDate = new Date(fechaISO);
              // Usar UTC para evitar corrimiento de días por zona horaria
              const fechaLocal = obtenerFechaLocalISO(fechaDate);
              const esHoy = obtenerFechaLocalISO(new Date()) === fechaLocal;
              return (
                <button
                  key={fechaISO}
                  className={`dia-btn ${fechaSeleccionada === fechaLocal ? 'seleccionado' : ''}`}
                  onClick={() => onSeleccionarFecha(fechaLocal)}
                >
                  <div className="dia-numero">{fechaDate.getUTCDate()}</div>
                  <div className="dia-semana">
                    {fechaDate.toLocaleDateString('es-AR', {
                      weekday: 'short',
                      timeZone: 'UTC', // Mantener UTC para consistencia
                    })}
                  </div>
                  {esHoy && <div className="dia-label">Hoy</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selector de Hora */}
        {fechaSeleccionada && (
          <div className="horarios-contenedor">
            <h3>Horarios para el {formatearFechaCorta(fechaSeleccionada)}</h3>
            {loadingHorarios ? (
              <LoadingSpinner mensaje="Cargando horarios..." />
            ) : (
              <div className="horarios-grid">
                {horariosBase.map((hora) => {
                  const disponible = horariosDisponibles.includes(hora);
                  return (
                    <button
                      key={hora}
                      className={`horario-btn ${horaSeleccionada === hora ? 'seleccionado' : ''} ${!disponible ? 'deshabilitado' : ''}`}
                      onClick={() => disponible && onSeleccionarHora(hora)}
                      disabled={!disponible}
                    >
                      {hora}
                    </button>
                  );
                })}
                {horariosDisponibles.length === 0 && !loadingHorarios && (
                  <p className="no-horarios">
                    No hay horarios disponibles para este día.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Paso3_FechaHora;