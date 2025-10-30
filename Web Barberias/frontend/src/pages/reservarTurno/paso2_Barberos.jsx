// frontend/src/pages/ReservarTurno/Paso2_Barberos.jsx

import React from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';

const Paso2_Barberos = ({ barberos, onSeleccionarBarbero, loading }) => {
  if (loading) {
    return <LoadingSpinner mensaje="Cargando barberos..." />;
  }

  return (
    <div className="paso-contenido">
      <h2>Selecciona tu barbero</h2>
      <div className="barberos-grid">
        {/* Opción "Indistinto" */}
        <button
          className="barbero-card indistinto"
          onClick={() => onSeleccionarBarbero('indistinto')}
        >
          <div className="barbero-avatar">
            <span>👤</span>
          </div>
          <h3>Indistinto</h3>
          <p>Cualquier barbero</p>
        </button>

        {/* Lista de barberos */}
        {barberos.map((b) => (
          <button
            key={b._id}
            className="barbero-card"
            onClick={() => onSeleccionarBarbero(b)}
          >
            <div className="barbero-avatar">
              <span>
                {b.nombre[0]}
                {b.apellido[0]}
              </span>
            </div>
            <h3>
              {b.nombre} {b.apellido}
            </h3>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Paso2_Barberos;