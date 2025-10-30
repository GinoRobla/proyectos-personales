// frontend/src/pages/ReservarTurno/Paso1_Servicios.jsx

import React from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';

const Paso1_Servicios = ({ servicios, onSeleccionarServicio, loading }) => {
  if (loading) {
    return <LoadingSpinner mensaje="Cargando servicios..." />;
  }

  return (
    <div className="paso-contenido">
      <h2>Selecciona un servicio</h2>
      <div className="servicios-grid">
        {servicios.map((s) => (
          <button
            key={s._id}
            className="servicio-card"
            onClick={() => onSeleccionarServicio(s)}
          >
            <h3>{s.nombre}</h3>
            <p className="descripcion">{s.descripcion}</p>
            <div className="servicio-info">
              <span className="precio">${s.precioBase}</span>
              <span className="duracion">{s.duracion} min</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Paso1_Servicios;