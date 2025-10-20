import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import estadisticasService from '../../services/estadisticasService';
import barberoService from '../../services/barberoService';
import { formatearMoneda } from '../utils/formatters'; // Importar formatter
import './BarberoEstadisticas.css';

const BarberoEstadisticas = () => {
    // ... (estados y lógica sin cambios significativos)
     const { usuario } = useAuth();
     const toast = useToast();
     const [loading, setLoading] = useState(true);
     const [estadisticas, setEstadisticas] = useState(null);
     const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
     const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
     const [editandoObjetivo, setEditandoObjetivo] = useState(false);
     const [nuevoObjetivo, setNuevoObjetivo] = useState(0);
     const [guardandoObjetivo, setGuardandoObjetivo] = useState(false);

    useEffect(() => { cargarEstadisticas(); }, [mesSeleccionado, anioSeleccionado]);

    const cargarEstadisticas = async () => { /* ... (sin cambios) */ };
    const handleGuardarObjetivo = async () => { /* ... (sin cambios) */ };

    const meses = [ /* ... (sin cambios) */ ];

    // ... (manejo de loading/error sin cambios)

     if (loading) return <div>Cargando...</div>;
     if (!estadisticas) return <div>Error al cargar.</div>;

    const { indicadoresPrincipales, serviciosMasRealizados } = estadisticas;

    // Renderizado (usando formatearMoneda importado)
    return (
        <div className="barbero-estadisticas-page"> {/* Clase CSS específica */}
            <div className="container">
                {/* ... (Header y selector de mes/año sin cambios) ... */}
                 <div className="page-header">
                   <h1>Mis Estadísticas</h1>
                   {/* Selector Mes/Año */}
                   <div> {/* ... */} </div>
                 </div>

                {/* Indicadores */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Ingresos Mes</h3>
                        <div className="stat-value primary">{formatearMoneda(indicadoresPrincipales.ingresosMensuales)}</div>
                    </div>
                    {/* ... otros indicadores ... */}
                    <div className="stat-card">
                        <h3>Ingresos Semana</h3>
                        <div className="stat-value secondary">{formatearMoneda(indicadoresPrincipales.ingresosSemanales)}</div>
                    </div>
                     <div className="stat-card">
                        <h3>Clientes Atendidos</h3>
                        <div className="stat-value info">{indicadoresPrincipales.turnosCompletados}</div>
                    </div>
                </div>

                {/* Objetivo Mensual */}
                <div className="objetivo-card">
                    {/* ... (lógica y UI de objetivo sin cambios, ya usa formatearMoneda) ... */}
                     <div className="objetivo-header">
                        <h3>Objetivo Mensual</h3>
                        {!editandoObjetivo && <button onClick={() => setEditandoObjetivo(true)}>Fijar</button>}
                     </div>
                     {editandoObjetivo /* ... Formulario ... */}
                     <div className="objetivo-progreso">
                        {/* ... Barra de progreso ... */}
                         <div className="progreso-texto">
                           <span>{formatearMoneda(indicadoresPrincipales.ingresosMensuales)} / {formatearMoneda(indicadoresPrincipales.objetivoMensual)}</span>
                           <span>{indicadoresPrincipales.porcentajeObjetivo}%</span>
                         </div>
                         <div className="progreso-barra">
                            <div style={{ width: `${Math.min(indicadoresPrincipales.porcentajeObjetivo, 100)}%` }}></div>
                         </div>
                         <p className={`diferencia ${indicadoresPrincipales.diferenciaMeta >= 0 ? 'positiva' : 'negativa'}`}>
                            {indicadoresPrincipales.diferenciaMeta >= 0 ? `+${formatearMoneda(indicadoresPrincipales.diferenciaMeta)}` : `-${formatearMoneda(Math.abs(indicadoresPrincipales.diferenciaMeta))}`}
                         </p>
                     </div>
                </div>

                {/* Servicios Más Realizados */}
                {serviciosMasRealizados?.length > 0 && (
                  <div className="servicios-tabla-card">
                    <h3>Servicios Más Realizados</h3>
                    <table>
                      <thead><tr><th>Servicio</th><th>Cantidad</th><th>Ingresos</th></tr></thead>
                      <tbody>
                        {serviciosMasRealizados.map((item, index) => (
                          <tr key={index}>
                            <td>{item.servicio.nombre}</td>
                            <td>{item.cantidad}</td>
                            <td>{formatearMoneda(item.ingresos)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
             {/* Añadir estilos necesarios en BarberoEstadisticas.css */}
             <style>{`
                .barbero-estadisticas-page { /*...*/ }
                .page-header { /*...*/ }
                .stats-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 2rem; }
                .stat-card { background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .stat-card h3 { font-size: 0.8rem; color: #555; margin-bottom: 0.5rem; text-transform: uppercase; }
                .stat-value { font-size: 1.8rem; font-weight: bold; }
                .stat-value.primary { color: #28a745; }
                .stat-value.secondary { color: #17a2b8; }
                .stat-value.info { color: #007bff; }
                .objetivo-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem; }
                .objetivo-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .objetivo-header h3 { font-size: 1.1rem; margin: 0; }
                .objetivo-progreso { /*...*/ }
                .progreso-texto { display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.5rem; }
                .progreso-barra { height: 10px; background: #e9ecef; border-radius: 5px; overflow: hidden; }
                .progreso-barra div { height: 100%; background: #28a745; }
                .diferencia { text-align: right; margin-top: 0.5rem; font-size: 0.9rem; }
                .diferencia.positiva { color: #28a745; }
                .diferencia.negativa { color: #dc3545; }
                .servicios-tabla-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .servicios-tabla-card h3 { font-size: 1.1rem; margin-bottom: 1rem; }
                .servicios-tabla-card table { width: 100%; border-collapse: collapse; }
                .servicios-tabla-card th, .servicios-tabla-card td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #eee; font-size: 0.9rem; }
                .servicios-tabla-card th { font-weight: bold; color: #555; }
                .servicios-tabla-card td:last-child, .servicios-tabla-card th:last-child { text-align: right; }
             `}</style>
        </div>
    );
};

export default BarberoEstadisticas;