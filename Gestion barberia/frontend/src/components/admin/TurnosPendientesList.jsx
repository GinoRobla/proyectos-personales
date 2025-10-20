// frontend/src/components/admin/TurnosPendientesList.jsx (NUEVO ARCHIVO)

import React from 'react';
import { formatearFechaCorta } from '../../utils/dateUtils';

/**
 * Componente reutilizable que renderiza la lista de turnos pendientes de asignación.
 * Recibe los turnos, la disponibilidad de barberos y el handler para ver la agenda.
 */
const TurnosPendientesList = ({ turnos, barberosDisponibles, onVerAgenda }) => {
  return (
    <div className="turnos-sin-barbero">
      {turnos.map((turno) => {
        // Obtener la lista de barberos para ESTE turno
        const barberosParaTurno = barberosDisponibles[turno._id] || [];

        return (
          <div key={turno._id} className="turno-card">
            <div className="turno-info">
              <div className="turno-cliente">
                <strong>
                  {turno.cliente?.nombre} {turno.cliente?.apellido}
                </strong>
              </div>
              <div className="turno-detalles">
                <span>
                  {formatearFechaCorta(turno.fecha)} - {turno.hora}
                </span>
                <span>
                  {turno.servicio?.nombre} ($
                  {turno.precio || turno.servicio?.precioBase})
                </span>
              </div>
            </div>
            <div className="turno-accion">
              <div className="barberos-list">
                {barberosParaTurno.map((barbero) => (
                  <button
                    key={barbero._id}
                    className={`btn-barbero ${
                      barbero.isDisponible ? '' : 'ocupado'
                    }`}
                    onClick={() =>
                      barbero.isDisponible && onVerAgenda(barbero, turno)
                    }
                    disabled={!barbero.isDisponible}
                    title={
                      !barbero.isDisponible
                        ? 'Ocupado'
                        : `Asignar a ${barbero.nombre}`
                    }
                  >
                    {barbero.nombre}
                    {!barbero.isDisponible && (
                      <span className="ocupado-label">Ocupado</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TurnosPendientesList;