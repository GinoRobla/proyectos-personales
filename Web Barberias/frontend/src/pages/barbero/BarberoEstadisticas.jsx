// frontend/src/pages/barbero/BarberoEstadisticas.jsx

import { useState, useEffect, useCallback } from 'react';
// import { useAuth } from '../../context/AuthContext'; // No se usa directamente aquí
import { useToast } from '../../context/ToastContext';
import estadisticasService from '../../services/estadisticasService';
import barberoService from '../../services/barberoService'; // Necesario para actualizar objetivo
import { formatearMoneda } from '../../utils/formatters'; // Asumiendo formatters.js existe
import useApi from '../../hooks/useApi'; // Importar useApi
import './BarberoEstadisticas.css'; // Importar CSS

const BarberoEstadisticas = () => {
    const toast = useToast();
    const [estadisticas, setEstadisticas] = useState(null);
    const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
    const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
    const [editandoObjetivo, setEditandoObjetivo] = useState(false);
    const [nuevoObjetivo, setNuevoObjetivo] = useState(0);

    // Hooks de API
    const { loading: loadingStats, request: cargarStatsApi } = useApi(estadisticasService.obtenerMisEstadisticas);
    // Asumiendo que actualizarBarbero puede actualizar el objetivo
    const { loading: guardandoObjetivo, request: guardarObjetivoApi } = useApi(barberoService.actualizarBarbero);

    const isLoading = loadingStats; // Solo carga inicial

    // Cargar estadísticas
    const cargarEstadisticas = useCallback(async () => {
        const { success, data } = await cargarStatsApi(mesSeleccionado, anioSeleccionado);
        if (success) {
            setEstadisticas(data);
            setNuevoObjetivo(data?.barbero?.objetivoMensual || 0); // Inicializar input con valor actual
        } else {
            setEstadisticas(null); // Limpiar si hay error
        }
        // Error manejado por useApi
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mesSeleccionado, anioSeleccionado]);

    useEffect(() => {
        cargarEstadisticas();
    }, [cargarEstadisticas]);

    // Guardar objetivo
    const handleGuardarObjetivo = async () => {
        if (!estadisticas?.barbero?.id) return; // Necesitamos el ID del barbero

        const objetivoNumerico = parseFloat(nuevoObjetivo);
        if (isNaN(objetivoNumerico) || objetivoNumerico < 0) {
            toast.error('Ingresa un objetivo válido (número mayor o igual a 0)');
            return;
        }

        // Llamada a la API para actualizar el barbero con el nuevo objetivo
        const { success } = await guardarObjetivoApi(estadisticas.barbero.id, {
            objetivoMensual: objetivoNumerico
        });

        if (success) {
            toast.success('Objetivo mensual actualizado');
            setEditandoObjetivo(false);
            // Recargar estadísticas para reflejar el cambio si es necesario
            // o actualizar localmente si la API no devuelve el barbero actualizado
            setEstadisticas(prev => ({
                ...prev,
                barbero: { ...prev.barbero, objetivoMensual: objetivoNumerico },
                indicadoresPrincipales: {
                    ...prev.indicadoresPrincipales,
                    objetivoMensual: objetivoNumerico,
                    // Recalcular porcentaje y diferencia si es necesario aquí
                     porcentajeObjetivo: objetivoNumerico > 0 ? Math.round((prev.indicadoresPrincipales.ingresosMensuales / objetivoNumerico) * 100) : 0,
                     diferenciaMeta: prev.indicadoresPrincipales.ingresosMensuales - objetivoNumerico,
                }
            }));
        }
        // Error manejado por useApi
    };

    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Renderizado Condicional
    if (isLoading) {
        return (
            <div className="barbero-estadisticas-page">
                <div className="container" style={{ textAlign: 'center', padding: '2rem' }}> {/* Estilo temporal */}
                    Cargando estadísticas...
                    {/* Podrías poner un spinner */}
                </div>
            </div>
        );
    }

    if (!estadisticas) {
        return (
            <div className="barbero-estadisticas-page">
                <div className="container" style={{ textAlign: 'center', padding: '2rem' }}> {/* Estilo temporal */}
                    Error al cargar estadísticas. Intenta de nuevo.
                </div>
            </div>
        );
    }


    const { indicadoresPrincipales, serviciosMasRealizados } = estadisticas;

    return (
        <div className="barbero-estadisticas-page">
            <div className="container">
                {/* Header y selector de mes/año */}
                 <div className="page-header">
                   <h1>Mis Estadísticas</h1>
                   {/* Selector Mes/Año */}
                   <div className="periodo-selector">
                        <select
                        value={mesSeleccionado}
                        onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
                        disabled={isLoading || guardandoObjetivo}
                        >
                        {meses.map((mes, index) => (
                            <option key={index} value={index + 1}>{mes}</option>
                        ))}
                        </select>
                        <input
                        type="number"
                        value={anioSeleccionado}
                        onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
                        disabled={isLoading || guardandoObjetivo}
                        />
                   </div>
                 </div>

                {/* Indicadores */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Ingresos Mes</h3>
                        <div className="stat-value primary">{formatearMoneda(indicadoresPrincipales.ingresosMensuales)}</div>
                    </div>
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
                     <div className="objetivo-header">
                        <h3>Objetivo Mensual</h3>
                        {!editandoObjetivo ? (
                            <button onClick={() => setEditandoObjetivo(true)} disabled={isLoading}>Fijar</button>
                         ) : (
                             <button onClick={() => setEditandoObjetivo(false)} className="cancelar" disabled={guardandoObjetivo}>Cancelar</button>
                         )}
                     </div>
                     {editandoObjetivo ? (
                        <div className="objetivo-editar-container">
                             <input
                                type="number"
                                value={nuevoObjetivo}
                                onChange={(e) => setNuevoObjetivo(e.target.value)}
                                className="objetivo-input"
                                placeholder="Ej: 50000"
                                min="0"
                                disabled={guardandoObjetivo}
                             />
                             <div className="objetivo-botones">
                                <button onClick={handleGuardarObjetivo} className="btn btn-sm btn-guardar-objetivo" disabled={guardandoObjetivo}>
                                    {guardandoObjetivo ? 'Guardando...' : 'Guardar'}
                                </button>
                             </div>
                        </div>
                     ) : (
                         <div className="objetivo-progreso">
                             <div className="progreso-texto">
                               <span>{formatearMoneda(indicadoresPrincipales.ingresosMensuales)} / {formatearMoneda(indicadoresPrincipales.objetivoMensual)}</span>
                               <span>{indicadoresPrincipales.porcentajeObjetivo}%</span>
                             </div>
                             <div className="progreso-barra">
                                {/* Asegura que el width no exceda 100% */}
                                <div style={{ width: `${Math.min(indicadoresPrincipales.porcentajeObjetivo, 100)}%` }}></div>
                             </div>
                             {indicadoresPrincipales.objetivoMensual > 0 && (
                                <p className={`diferencia ${indicadoresPrincipales.diferenciaMeta >= 0 ? 'positiva' : 'negativa'}`}>
                                    {indicadoresPrincipales.diferenciaMeta >= 0 ? '+' : ''}{formatearMoneda(indicadoresPrincipales.diferenciaMeta)}
                                </p>
                             )}
                         </div>
                     )}
                </div>

                {/* Servicios Más Realizados */}
                <div className="servicios-tabla-card">
                  <h3>Servicios Más Realizados</h3>
                  {serviciosMasRealizados?.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                            <th>Servicio</th>
                            <th>Cantidad</th>
                            <th>Ingresos</th>
                        </tr>
                      </thead>
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
                  ) : (
                    <div className="empty-state-small">
                      <p>No hay servicios realizados en este período</p>
                    </div>
                  )}
                </div>
            </div>
        </div>
    );
};

export default BarberoEstadisticas;