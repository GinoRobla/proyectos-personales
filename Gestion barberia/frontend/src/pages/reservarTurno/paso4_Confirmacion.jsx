// frontend/src/pages/ReservarTurno/Paso4_Confirmacion.jsx

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import useFormData from '../../hooks/useFormData';
import { formatearFechaLarga, formatearHora } from '../../utils/dateUtils';

const Paso4_Confirmacion = ({
  resumen,
  onConfirmarReserva,
  loading,
  turnoEditarId,
}) => {
  const { estaAutenticado } = useAuth();
  
  // Hook para el formulario de cliente no autenticado
  const { values: datosCliente, handleChange: handleChangeDatosCliente } = useFormData({
    nombre: '', apellido: '', email: '', telefono: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pasar los datos del formulario solo si no está autenticado
    const datosFinalesCliente = estaAutenticado ? null : datosCliente;
    onConfirmarReserva(datosFinalesCliente);
  };

  const { servicio, barbero, fecha, hora } = resumen;

  return (
    <div className="paso-contenido">
      <h2>{turnoEditarId ? 'Confirmar cambios' : 'Confirmar reserva'}</h2>
      
      {/* Resumen */}
      <div className="resumen-reserva">
        <h3>Resumen de tu turno</h3>
        <div className="resumen-item">
          <span className="label">Servicio:</span>
          <span className="valor">{servicio?.nombre}</span>
        </div>
        <div className="resumen-item">
          <span className="label">Barbero:</span>
          <span className="valor">
            {barbero === 'indistinto'
              ? 'Indistinto'
              : `${barbero?.nombre}`}
          </span>
        </div>
        <div className="resumen-item">
          <span className="label">Fecha:</span>
          <span className="valor">{formatearFechaLarga(fecha)}</span>
        </div>
        <div className="resumen-item">
          <span className="label">Hora:</span>
          <span className="valor">{formatearHora(hora)}</span>
        </div>
        <div className="resumen-item total">
          <span className="label">Total:</span>
          <span className="valor">${servicio?.precioBase}</span>
        </div>
      </div>

      {/* Formulario de confirmación */}
      <form onSubmit={handleSubmit} className="datos-cliente-form">
        {!estaAutenticado && (
          <>
            <h3>Completa tus datos para finalizar</h3>
            <div className="input-group">
              <label htmlFor="nombre">Nombre *</label>
              <input type="text" id="nombre" name="nombre" value={datosCliente.nombre} onChange={handleChangeDatosCliente} required className="input" />
            </div>
            <div className="input-group">
              <label htmlFor="apellido">Apellido *</label>
              <input type="text" id="apellido" name="apellido" value={datosCliente.apellido} onChange={handleChangeDatosCliente} required className="input" />
            </div>
            <div className="input-group">
              <label htmlFor="email">Email *</label>
              <input type="email" id="email" name="email" value={datosCliente.email} onChange={handleChangeDatosCliente} required className="input" />
            </div>
            <div className="input-group">
              <label htmlFor="telefono">Teléfono *</label>
              <input type="tel" id="telefono" name="telefono" value={datosCliente.telefono} onChange={handleChangeDatosCliente} required className="input" />
            </div>
          </>
        )}
        
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Confirmando...' : (turnoEditarId ? 'Confirmar Cambios' : 'Confirmar Reserva')}
        </button>
      </form>
    </div>
  );
};

export default Paso4_Confirmacion;