// frontend/src/components/LoadingSpinner.jsx (NUEVO ARCHIVO)

import React from 'react';

// Estilos básicos para el spinner (puedes moverlos a un .css si prefieres)
const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    minHeight: '150px',
    color: '#555',
    width: '100%',
  },
  spinner: {
    border: '4px solid rgba(0, 0, 0, 0.1)',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    borderLeftColor: 'var(--primary, #007bff)',
    animation: 'spin 1s ease infinite',
  },
  mensaje: {
    marginTop: '1rem',
    fontSize: '0.9rem',
  },
};

// Inyectar keyframes de animación globalmente (si no existe)
const styleSheetId = 'spinner-animation';
if (!document.getElementById(styleSheetId)) {
  const styleSheet = document.createElement('style');
  styleSheet.id = styleSheetId;
  styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}

const LoadingSpinner = ({ mensaje = 'Cargando...' }) => {
  return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner}></div>
      {mensaje && <p style={styles.mensaje}>{mensaje}</p>}
    </div>
  );
};

export default LoadingSpinner;