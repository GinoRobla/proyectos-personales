import { useState, useEffect } from 'react';
import estadisticasService from '../../services/estadisticasService';

/**
 * Estadísticas Panel Admin
 * Indicadores principales y estadísticas adicionales para el dueño de la barbería
 */

const AdminEstadisticas = () => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());

  useEffect(() => {
    cargarEstadisticas();
  }, [mesSeleccionado, anioSeleccionado]);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await estadisticasService.obtenerAdmin(mesSeleccionado, anioSeleccionado);
      setEstadisticas(response.data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(valor);
  };

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <div className="container">
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px'
          }}>
            <p style={{ color: '#6c757d', fontSize: '1.125rem' }}>Cargando estadísticas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div className="container">
          <div style={{
            padding: '1rem',
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            color: '#856404'
          }}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!estadisticas) {
    return null;
  }

  const { indicadoresPrincipales, estadisticasAdicionales } = estadisticas;

  return (
    <div style={{
      padding: '1rem',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div className="container" style={{
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#212529',
            marginBottom: '0.5rem'
          }}>
            Panel de Estadísticas
          </h1>
          <p style={{
            color: '#6c757d',
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            Métricas y rendimiento de tu barbería
          </p>

          {/* Selector de Mes/Año */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <label style={{ color: '#495057', fontWeight: '500', fontSize: '0.875rem' }}>
              Período:
            </label>
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #ced4da',
                fontSize: '0.840rem',
                background: 'white',
                color: '#495057',
                cursor: 'pointer'
              }}
            >
              {meses.map((mes, index) => (
                <option key={index} value={index + 1}>{mes}</option>
              ))}
            </select>
            <input
              type="number"
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #ced4da',
                fontSize: '0.875rem',
                width: '90px',
                background: 'white',
                color: '#495057'
              }}
            />
          </div>
        </div>

        {/* Indicadores Principales */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#495057',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontSize: '0.875rem'
          }}>
            Indicadores Principales
          </h2>
          <div style={{
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))'
          }}>
            {/* Ingresos Totales */}
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#6c757d',
                textTransform: 'uppercase',
                fontWeight: '600',
                letterSpacing: '0.5px',
                marginBottom: '0.5rem'
              }}>
                Ingresos Totales
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#28a745',
                marginBottom: '0.25rem'
              }}>
                {formatearMoneda(indicadoresPrincipales.ingresosTotales)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                Este mes
              </div>
            </div>

            {/* Turnos Totales */}
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#6c757d',
                textTransform: 'uppercase',
                fontWeight: '600',
                letterSpacing: '0.5px',
                marginBottom: '0.5rem'
              }}>
                Turnos Totales
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#212529',
                marginBottom: '0.25rem'
              }}>
                {indicadoresPrincipales.turnosTotales}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                Completados y cancelados
              </div>
            </div>

            {/* CANTIDAD DE CLIENTES */}
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#6c757d',
                textTransform: 'uppercase',
                fontWeight: '600',
                letterSpacing: '0.5px',
                marginBottom: '0.5rem'
              }}>
                CANTIDAD DE CLIENTES
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#007bff',
                marginBottom: '0.25rem'
              }}>
                {indicadoresPrincipales.clientesAtendidos}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                Clientes únicos atendidos
              </div>
            </div>

            {/* Barbero Más Solicitado */}
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#6c757d',
                textTransform: 'uppercase',
                fontWeight: '600',
                letterSpacing: '0.5px',
                marginBottom: '0.5rem'
              }}>
                Barbero Destacado
              </div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#212529',
                marginBottom: '0.25rem'
              }}>
                {indicadoresPrincipales.barberoMasSolicitado?.barberoInfo?.nombreCompleto || 'N/A'}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                {indicadoresPrincipales.barberoMasSolicitado?.totalTurnos || 0} turnos realizados
              </div>
            </div>

            {/* Servicio Más Popular */}
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#6c757d',
                textTransform: 'uppercase',
                fontWeight: '600',
                letterSpacing: '0.5px',
                marginBottom: '0.5rem'
              }}>
                Servicio Popular
              </div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#212529',
                marginBottom: '0.25rem'
              }}>
                {indicadoresPrincipales.servicioMasPopular?.servicioInfo?.nombre || 'N/A'}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                {indicadoresPrincipales.servicioMasPopular?.totalReservas || 0} reservas
              </div>
            </div>
          </div>
        </div>

        {/* Comparativa Mes Anterior */}
        {estadisticasAdicionales.comparativaMesAnterior && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#495057',
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '0.875rem'
            }}>
              Comparativa Mes a Mes
            </h2>
            <div style={{
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))'
            }}>
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#6c757d',
                  textTransform: 'uppercase',
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                  marginBottom: '0.5rem'
                }}>
                  Variación de Ingresos
                </div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: estadisticasAdicionales.comparativaMesAnterior.cambioIngresos >= 0 ? '#28a745' : '#dc3545',
                  marginBottom: '0.25rem'
                }}>
                  {estadisticasAdicionales.comparativaMesAnterior.cambioIngresos !== null
                    ? `${estadisticasAdicionales.comparativaMesAnterior.cambioIngresos >= 0 ? '+' : ''}${estadisticasAdicionales.comparativaMesAnterior.cambioIngresos.toFixed(1)}%`
                    : 'N/A'}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                  vs mes anterior
                </div>
              </div>

              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#6c757d',
                  textTransform: 'uppercase',
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                  marginBottom: '0.5rem'
                }}>
                  Variación de Turnos
                </div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: estadisticasAdicionales.comparativaMesAnterior.cambioTurnos >= 0 ? '#28a745' : '#dc3545',
                  marginBottom: '0.25rem'
                }}>
                  {estadisticasAdicionales.comparativaMesAnterior.cambioTurnos >= 0 ? '+' : ''}{estadisticasAdicionales.comparativaMesAnterior.cambioTurnos.toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                  vs mes anterior
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Días de Ocupación */}
        {estadisticasAdicionales.diasOcupacion && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#495057',
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '0.875rem'
            }}>
              Días de la Semana
            </h2>
            <div style={{
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))'
            }}>
              {estadisticasAdicionales.diasOcupacion.diaMasOcupado && (
                <div style={{
                  background: 'white',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6c757d',
                    textTransform: 'uppercase',
                    fontWeight: '600',
                    letterSpacing: '0.5px',
                    marginBottom: '0.5rem'
                  }}>
                    Día Más Ocupado
                  </div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: '#212529',
                    marginBottom: '0.25rem'
                  }}>
                    {estadisticasAdicionales.diasOcupacion.diaMasOcupado.dia}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                    {estadisticasAdicionales.diasOcupacion.diaMasOcupado.totalTurnos} turnos
                  </div>
                </div>
              )}

              {estadisticasAdicionales.diasOcupacion.diaMenosOcupado && (
                <div style={{
                  background: 'white',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6c757d',
                    textTransform: 'uppercase',
                    fontWeight: '600',
                    letterSpacing: '0.5px',
                    marginBottom: '0.5rem'
                  }}>
                    Día Menos Ocupado
                  </div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: '#212529',
                    marginBottom: '0.25rem'
                  }}>
                    {estadisticasAdicionales.diasOcupacion.diaMenosOcupado.dia}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                    {estadisticasAdicionales.diasOcupacion.diaMenosOcupado.totalTurnos} turnos
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Estadísticas Adicionales */}
        <div>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#495057',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontSize: '0.875rem'
          }}>
            Desglose Detallado
          </h2>

          <div style={{
            display: 'grid',
            gap: '1.5rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))',
            maxWidth: estadisticasAdicionales.ingresosPorBarbero?.length === 1 ? '450px' : 'none'
          }}>
            {/* Ingresos por Barbero */}
            <div style={{
              background: 'white',
              padding: '1rem',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#212529',
                marginBottom: '1.25rem'
              }}>
                Ingresos por Barbero
              </h3>
              {estadisticasAdicionales.ingresosPorBarbero.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {estadisticasAdicionales.ingresosPorBarbero.map((item, index) => {
                    const maxIngresos = Math.max(...estadisticasAdicionales.ingresosPorBarbero.map(b => b.ingresos));
                    const porcentaje = (item.ingresos / maxIngresos) * 100;

                    return (
                      <div key={index}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '0.5rem'
                        }}>
                          <span style={{ fontWeight: '600', color: '#212529' }}>
                            {item.barbero.nombre}
                          </span>
                          <span style={{ color: '#28a745', fontWeight: '700' }}>
                            {formatearMoneda(item.ingresos)}
                          </span>
                        </div>
                        <div style={{
                          background: '#e9ecef',
                          borderRadius: '4px',
                          height: '8px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            background: '#28a745',
                            height: '100%',
                            width: `${porcentaje}%`,
                            transition: 'width 0.3s ease'
                          }}></div>
                        </div>
                        <div style={{
                          fontSize: '0.8125rem',
                          color: '#6c757d',
                          marginTop: '0.375rem'
                        }}>
                          {item.turnos} clientes atendidos
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: '#6c757d', textAlign: 'center', padding: '2rem 0' }}>
                  No hay datos disponibles
                </p>
              )}
            </div>

            {/* Turnos por Servicio */}
            <div style={{
              background: 'white',
              padding: '1rem',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#212529',
                marginBottom: '1.25rem'
              }}>
                Turnos por Servicio
              </h3>
              {estadisticasAdicionales.turnosPorServicio.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {estadisticasAdicionales.turnosPorServicio.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '1rem',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        border: '1px solid #e9ecef'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontWeight: '600', color: '#212529' }}>
                          {item.servicio.nombre}
                        </span>
                        <span style={{
                          background: '#007bff',
                          color: 'white',
                          padding: '0.25rem 0.625rem',
                          borderRadius: '4px',
                          fontSize: '0.8125rem',
                          fontWeight: '600'
                        }}>
                          {item.totalTurnos}
                        </span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.8125rem',
                        color: '#6c757d'
                      }}>
                        <span>Ingresos: {formatearMoneda(item.ingresos)}</span>
                        <span>Promedio: {formatearMoneda(item.rentabilidad)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#6c757d', textAlign: 'center', padding: '2rem 0' }}>
                  No hay datos disponibles
                </p>
              )}
            </div>

            {/* Top Clientes */}
            {estadisticasAdicionales.topClientes && estadisticasAdicionales.topClientes.length > 0 && (
              <div style={{
                background: 'white',
                padding: '1rem',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#212529',
                  marginBottom: '1.25rem'
                }}>
                  Top Clientes Frecuentes
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {estadisticasAdicionales.topClientes.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '1rem',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        border: '1px solid #e9ecef'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem',
                        alignItems: 'center'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', color: '#212529', marginBottom: '0.25rem' }}>
                            {item.cliente.nombre} {item.cliente.apellido}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                            {item.cliente.email}
                          </div>
                        </div>
                        <span style={{
                          background: '#28a745',
                          color: 'white',
                          padding: '0.25rem 0.625rem',
                          borderRadius: '4px',
                          fontSize: '0.8125rem',
                          fontWeight: '600'
                        }}>
                          {item.totalTurnos} visitas
                        </span>
                      </div>
                      <div style={{
                        fontSize: '0.8125rem',
                        color: '#6c757d'
                      }}>
                        Total gastado: {formatearMoneda(item.totalGastado)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEstadisticas;
