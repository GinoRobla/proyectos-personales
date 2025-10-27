// frontend/src/pages/admin/Estadisticas.jsx

import { useState, useEffect, useCallback } from 'react';
import estadisticasService from '../../services/estadisticasService';
import useApi from '../../hooks/useApi'; // Importar useApi
import { formatearMoneda } from '../../utils/formatters'; // Asumiendo que existe
import './Estadisticas.css'; // Importar el nuevo CSS

const AdminEstadisticas = () => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());

  // Hook de API
  const { loading, request: cargarEstadisticasApi } = useApi(estadisticasService.obtenerAdmin);

  // Cargar estadísticas
  const cargarEstadisticas = useCallback(async () => {
    const { success, data } = await cargarEstadisticasApi(mesSeleccionado, anioSeleccionado);
    if (success) {
      setEstadisticas(data);
    } else {
      setEstadisticas(null); // Limpiar en caso de error
    }
    // El error ya lo maneja y muestra useApi
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesSeleccionado, anioSeleccionado]);

  useEffect(() => {
    cargarEstadisticas();
  }, [cargarEstadisticas]); // Se ejecuta al inicio y cuando cambia mes/año

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Renderizado Condicional
  if (loading) {
    return (
      <div className="admin-stats-page">
        <div className="container stats-loading">
          <p>Cargando estadísticas...</p>
          {/* Podrías agregar un spinner */}
        </div>
      </div>
    );
  }

  // No necesitamos mostrar el error aquí, useApi ya lo muestra con un toast
  // Si no hay estadísticas (error o datos vacíos), mostramos un mensaje simple
  if (!estadisticas) {
     return (
       <div className="admin-stats-page">
         <div className="container stats-error">
           <div>No se pudieron cargar las estadísticas. Intenta de nuevo más tarde.</div>
         </div>
       </div>
     );
  }


  const { indicadoresPrincipales, estadisticasAdicionales } = estadisticas;

  return (
    <div className="admin-stats-page">
      <div className="container">
        {/* Header */}
        <div className="stats-header">
          <h1 className="stats-title">Panel de Estadísticas</h1>
          <p className="stats-subtitle">Métricas y rendimiento de tu barbería</p>
          {/* Selector de Mes/Año */}
          <div className="periodo-selector">
            <label>Período:</label>
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
              disabled={loading} // Deshabilitar mientras carga
            >
              {meses.map((mes, index) => (
                <option key={index} value={index + 1}>{mes}</option>
              ))}
            </select>
            <input
              type="number"
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
              disabled={loading} // Deshabilitar mientras carga
            />
          </div>
        </div>

        {/* Indicadores Principales */}
        <div className="indicadores-section">
          <h2 className="indicadores-title">Indicadores Principales</h2>
          <div className="indicadores-grid">
            {/* Ingresos Totales */}
            <div className="indicador-card">
              <div className="indicador-label">Ingresos Totales</div>
              <div className="indicador-valor ingresos">
                {formatearMoneda(indicadoresPrincipales.ingresosTotales)}
              </div>
              <div className="indicador-detalle">Este mes</div>
            </div>
            {/* Turnos Totales */}
            <div className="indicador-card">
              <div className="indicador-label">Turnos Totales</div>
              <div className="indicador-valor turnos">
                {indicadoresPrincipales.turnosTotales}
              </div>
              <div className="indicador-detalle">Completados y cancelados</div>
            </div>
            {/* Clientes Atendidos */}
            <div className="indicador-card">
              <div className="indicador-label">Clientes Atendidos</div>
              <div className="indicador-valor clientes">
                {indicadoresPrincipales.clientesAtendidos}
              </div>
              <div className="indicador-detalle">Clientes únicos</div>
            </div>
            {/* Barbero Destacado */}
            <div className="indicador-card">
              <div className="indicador-label">Barbero Destacado</div>
              <div className="indicador-valor nombre">
                {indicadoresPrincipales.barberoMasSolicitado?.barberoInfo?.nombreCompleto || 'N/A'}
              </div>
              <div className="indicador-detalle">
                {indicadoresPrincipales.barberoMasSolicitado?.totalTurnos || 0} turnos
              </div>
            </div>
            {/* Servicio Popular */}
            <div className="indicador-card">
              <div className="indicador-label">Servicio Popular</div>
              <div className="indicador-valor nombre">
                {indicadoresPrincipales.servicioMasPopular?.servicioInfo?.nombre || 'N/A'}
              </div>
              <div className="indicador-detalle">
                {indicadoresPrincipales.servicioMasPopular?.totalReservas || 0} reservas
              </div>
            </div>
          </div>
        </div>

        {/* Comparativa Mes Anterior */}
        <div className="stats-section">
          <h2 className="section-title-alt">Comparativa Mes a Mes</h2>
          {estadisticasAdicionales.comparativaMesAnterior ? (
            <div className="comparativa-grid">
              <div className="comparativa-card">
                <div className="indicador-label">Variación de Ingresos</div>
                <div className={`variacion-valor ${estadisticasAdicionales.comparativaMesAnterior.cambioIngresos >= 0 ? 'positiva' : 'negativa'}`}>
                  {estadisticasAdicionales.comparativaMesAnterior.cambioIngresos !== null
                    ? `${estadisticasAdicionales.comparativaMesAnterior.cambioIngresos >= 0 ? '+' : ''}${estadisticasAdicionales.comparativaMesAnterior.cambioIngresos.toFixed(1)}%`
                    : 'N/A'}
                </div>
                <div className="indicador-detalle">vs mes anterior</div>
              </div>
              <div className="comparativa-card">
                <div className="indicador-label">Variación de Turnos</div>
                <div className={`variacion-valor ${estadisticasAdicionales.comparativaMesAnterior.cambioTurnos >= 0 ? 'positiva' : 'negativa'}`}>
                  {estadisticasAdicionales.comparativaMesAnterior.cambioTurnos >= 0 ? '+' : ''}{estadisticasAdicionales.comparativaMesAnterior.cambioTurnos.toFixed(1)}%
                </div>
                <div className="indicador-detalle">vs mes anterior</div>
              </div>
            </div>
          ) : (
            <div className="empty-state-small">
              <p>No hay datos del mes anterior para comparar</p>
            </div>
          )}
        </div>

        {/* Días de Ocupación */}
        <div className="stats-section">
          <h2 className="section-title-alt">Días de la Semana</h2>
          {estadisticasAdicionales.diasOcupacion?.diaMasOcupado || estadisticasAdicionales.diasOcupacion?.diaMenosOcupado ? (
            <div className="dias-grid">
              {estadisticasAdicionales.diasOcupacion.diaMasOcupado ? (
                <div className="dia-card">
                  <div className="indicador-label">Día Más Ocupado</div>
                  <div className="dia-nombre">
                    {estadisticasAdicionales.diasOcupacion.diaMasOcupado.dia}
                  </div>
                  <div className="indicador-detalle">
                    {estadisticasAdicionales.diasOcupacion.diaMasOcupado.totalTurnos} turnos
                  </div>
                </div>
              ) : (
                <div className="dia-card">
                  <div className="empty-state-small">
                    <p>No hay datos de día más ocupado</p>
                  </div>
                </div>
              )}
              {estadisticasAdicionales.diasOcupacion.diaMenosOcupado ? (
                <div className="dia-card">
                  <div className="indicador-label">Día Menos Ocupado</div>
                  <div className="dia-nombre">
                    {estadisticasAdicionales.diasOcupacion.diaMenosOcupado.dia}
                  </div>
                  <div className="indicador-detalle">
                    {estadisticasAdicionales.diasOcupacion.diaMenosOcupado.totalTurnos} turnos
                  </div>
                </div>
              ) : (
                <div className="dia-card">
                  <div className="empty-state-small">
                    <p>No hay datos de día menos ocupado</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state-small">
              <p>No hay datos de ocupación por día de la semana</p>
            </div>
          )}
        </div>

        {/* Desglose Detallado */}
        <div className="stats-section">
          <h2 className="section-title-alt">Desglose Detallado</h2>
          <div className="desglose-grid">
            {/* Ingresos por Barbero */}
            <div className="desglose-card">
              <h3 className="desglose-title">Ingresos por Barbero</h3>
              {estadisticasAdicionales.ingresosPorBarbero?.length > 0 ? (
                <div>
                  {estadisticasAdicionales.ingresosPorBarbero.map((item, index) => {
                    const maxIngresos = Math.max(...estadisticasAdicionales.ingresosPorBarbero.map(b => b.ingresos));
                    const porcentaje = maxIngresos > 0 ? (item.ingresos / maxIngresos) * 100 : 0;
                    return (
                      <div key={index} className="barbero-item">
                        <div className="barbero-header">
                          <span className="barbero-nombre">{item.barbero.nombre}</span>
                          <span className="barbero-ingresos">{formatearMoneda(item.ingresos)}</span>
                        </div>
                        <div className="barbero-progreso">
                          <div className="barbero-progreso-barra" style={{ width: `${porcentaje}%` }}></div>
                        </div>
                        <div className="barbero-turnos">{item.turnos} clientes atendidos</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state-small">
                  <p>No hay ingresos registrados por barbero en este período</p>
                </div>
              )}
            </div>

            {/* Turnos por Servicio */}
            <div className="desglose-card">
              <h3 className="desglose-title">Turnos por Servicio</h3>
              {estadisticasAdicionales.turnosPorServicio?.length > 0 ? (
                <div>
                  {estadisticasAdicionales.turnosPorServicio.map((item, index) => (
                    <div key={index} className="servicio-item">
                      <div className="servicio-header">
                        <span className="servicio-nombre">{item.servicio.nombre}</span>
                        <span className="servicio-cantidad">{item.totalTurnos}</span>
                      </div>
                      <div className="servicio-stats">
                        <span>Ingresos: {formatearMoneda(item.ingresos)}</span>
                        <span>Promedio: {formatearMoneda(item.rentabilidad)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state-small">
                  <p>No hay servicios realizados en este período</p>
                </div>
              )}
            </div>

            {/* Top Clientes */}
            <div className="desglose-card">
              <h3 className="desglose-title">Top Clientes Frecuentes</h3>
              {estadisticasAdicionales.topClientes?.length > 0 ? (
                <div>
                  {estadisticasAdicionales.topClientes.map((item, index) => (
                    <div key={index} className="cliente-item">
                      <div className="cliente-header">
                        <span className="cliente-nombre">{item.cliente.nombre} {item.cliente.apellido}</span>
                        <span className="cliente-visitas">{item.totalTurnos} visitas</span>
                      </div>
                      <div className="cliente-stats">
                        <span>{item.cliente.email}</span>
                        <span>Total: {formatearMoneda(item.totalGastado)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state-small">
                  <p>No hay clientes registrados en este período</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEstadisticas;