// frontend/src/pages/ReservarTurno/Paso3_FechaHora.jsx

import React from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatearFechaCorta, obtenerFechaLocalISO } from '../../utils/dateUtils';

const Paso3_FechaHora = ({
  diasDisponibles,
  horariosDisponibles,
  fechaSeleccionada,
  horaSeleccionada,
  onSeleccionarFecha,
  onSeleccionarHora,
  loadingHorarios,
}) => {
  // Ya NO usamos horarios hardcodeados
  // Los horarios vienen directamente del backend según la configuración

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
            ) : horariosDisponibles.length === 0 ? (
              <p className="no-horarios">
                No hay horarios disponibles para este día.
              </p>
            ) : (
              <div className="horarios-grid">
                {horariosDisponibles.map((hora) => (
                  <button
                    key={hora}
                    className={`horario-btn ${horaSeleccionada === hora ? 'seleccionado' : ''}`}
                    onClick={() => onSeleccionarHora(hora)}
                  >
                    {hora}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Paso3_FechaHora;