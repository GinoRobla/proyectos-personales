import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import estadisticasService from '../../services/estadisticasService';
import barberoService from '../../services/barberoService';
import './BarberoEstadisticas.css';

/**
 * ============================================================================
 * PÁGINA: ESTADÍSTICAS DEL BARBERO
 * ============================================================================
 *
 * Panel de estadísticas personales para el barbero autenticado.
 *
 * QUÉ MUESTRA:
 * - Ingresos generados (semana/mes)
 * - Cantidad de clientes atendidos
 * - Evolución de ingresos semanales o por día
 * - Objetivo mensual cumplido (%)
 *
 * FUNCIONALIDADES:
 * - Ver estadísticas del mes actual
 * - Cambiar período (mes/año)
 * - Establecer y actualizar objetivo mensual
 * - Ver evolución de ingresos en gráfico simple
 */

const BarberoEstadisticas = () => {
  const { usuario } = useAuth();
  const toast = useToast();

  // Estado de carga y datos
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState(null);

  // Selector de período
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());

  // Objetivo mensual
  const [editandoObjetivo, setEditandoObjetivo] = useState(false);
  const [nuevoObjetivo, setNuevoObjetivo] = useState(0);
  const [guardandoObjetivo, setGuardandoObjetivo] = useState(false);

  // ===== CARGAR DATOS =====

  useEffect(() => {
    cargarEstadisticas();
  }, [mesSeleccionado, anioSeleccionado]);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const response = await estadisticasService.obtenerMisEstadisticas(
        mesSeleccionado,
        anioSeleccionado
      );
      setEstadisticas(response.data);
      setNuevoObjetivo(response.data?.barbero?.objetivoMensual || 0);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      toast.error('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  // ===== ACTUALIZAR OBJETIVO =====

  const handleGuardarObjetivo = async () => {
    try {
      setGuardandoObjetivo(true);

      // Buscar el barbero asociado al usuario
      const responseBarberos = await barberoService.obtenerBarberos();
      const barbero = responseBarberos.data.find(b => b.email === usuario.email);

      if (!barbero) {
        toast.error('No se encontró el perfil de barbero');
        return;
      }

      // Actualizar el objetivo mensual
      await barberoService.actualizarBarbero(barbero._id, {
        objetivoMensual: nuevoObjetivo,
      });

      toast.success('Objetivo mensual actualizado correctamente');
      setEditandoObjetivo(false);
      cargarEstadisticas(); // Recargar estadísticas
    } catch (error) {
      console.error('Error al actualizar objetivo:', error);
      toast.error('Error al actualizar el objetivo mensual');
    } finally {
      setGuardandoObjetivo(false);
    }
  };

  // ===== UTILIDADES DE FORMATO =====

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(valor);
  };

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  // ===== RENDERIZADO CONDICIONAL =====

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  if (!estadisticas) {
    return (
      <div style={{ padding: '2rem' }}>
        <p style={{ color: '#dc3545' }}>No se pudieron cargar las estadísticas</p>
      </div>
    );
  }

  const { indicadoresPrincipales, serviciosMasRealizados } = estadisticas;

  // ===== RENDER PRINCIPAL =====

  return (
    <div
      style={{
        padding: '1rem',
        background: '#f5f5f5',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* HEADER */}
        <div style={{ marginBottom: '2rem' }}>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: '600',
              color: '#212529',
              marginBottom: '0.5rem',
            }}
          >
            Mis Estadísticas
          </h1>
          <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
            Rendimiento personal y objetivos
          </p>

          {/* Selector de Mes/Año */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <label style={{ color: '#495057', fontWeight: '500' }}>Período:</label>
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
                cursor: 'pointer',
              }}
            >
              {meses.map((mes, index) => (
                <option key={index} value={index + 1}>
                  {mes}
                </option>
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
                color: '#495057',
              }}
            />
          </div>
        </div>

        {/* INDICADORES PRINCIPALES */}
        <div style={{ marginBottom: '2rem' }}>
          <h2
            style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#495057',
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Indicadores Principales
          </h2>

          <div
            style={{
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            }}
          >
            {/* INGRESOS DEL MES */}
            <div
              style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#6c757d',
                  textTransform: 'uppercase',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                }}
              >
                Ingresos del Mes
              </div>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#28a745',
                }}
              >
                {formatearMoneda(indicadoresPrincipales.ingresosMensuales)}
              </div>
            </div>

            {/* INGRESOS DE LA SEMANA */}
            <div
              style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#6c757d',
                  textTransform: 'uppercase',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                }}
              >
                Ingresos de la Semana
              </div>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#17a2b8',
                }}
              >
                {formatearMoneda(indicadoresPrincipales.ingresosSemanales)}
              </div>
            </div>

            {/* CANTIDAD DE CLIENTES */}
            <div
              style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#6c757d',
                  textTransform: 'uppercase',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                }}
              >
                Cantidad de Clientes
              </div>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#007bff',
                }}
              >
                {indicadoresPrincipales.turnosCompletados}
              </div>
            </div>
          </div>
        </div>

        {/* OBJETIVO MENSUAL */}
        <div
          style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <h3
              style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#212529',
                margin: 0,
              }}
            >
              Objetivo Mensual
            </h3>

            {!editandoObjetivo && (
              <button
                onClick={() => setEditandoObjetivo(true)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Fijar Objetivo
              </button>
            )}
          </div>

          {/* EDITAR OBJETIVO */}
          {editandoObjetivo && (
            <div style={{ marginBottom: '1rem' }} className="objetivo-editar-container">
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#495057',
                }}
              >
                Nuevo Objetivo Mensual ($)
              </label>
              <input
                type="number"
                value={nuevoObjetivo}
                onChange={(e) => setNuevoObjetivo(parseInt(e.target.value) || 0)}
                className="objetivo-input"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  marginBottom: '0.5rem',
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }} className="objetivo-botones">
                <button
                  onClick={handleGuardarObjetivo}
                  disabled={guardandoObjetivo}
                  className="btn-guardar-objetivo"
                  style={{
                    flex: '1 1 auto',
                    minWidth: '120px',
                    padding: '0.75rem 1.5rem',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: guardandoObjetivo ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    opacity: guardandoObjetivo ? 0.6 : 1,
                  }}
                >
                  {guardandoObjetivo ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={() => {
                    setEditandoObjetivo(false);
                    setNuevoObjetivo(indicadoresPrincipales.objetivoMensual);
                  }}
                  className="btn-cancelar-objetivo"
                  style={{
                    flex: '1 1 auto',
                    minWidth: '120px',
                    padding: '0.75rem 1.5rem',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* VISUALIZACIÓN DEL OBJETIVO */}
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#495057' }}>
                  Progreso: {formatearMoneda(indicadoresPrincipales.ingresosMensuales)} /{' '}
                  {formatearMoneda(indicadoresPrincipales.objetivoMensual)}
                </span>
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color:
                      indicadoresPrincipales.porcentajeObjetivo >= 100
                        ? '#28a745'
                        : indicadoresPrincipales.porcentajeObjetivo >= 75
                        ? '#ffc107'
                        : '#dc3545',
                  }}
                >
                  {indicadoresPrincipales.porcentajeObjetivo}%
                </span>
              </div>

              {/* Barra de Progreso */}
              <div
                style={{
                  width: '100%',
                  height: '20px',
                  background: '#e9ecef',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(indicadoresPrincipales.porcentajeObjetivo, 100)}%`,
                    height: '100%',
                    background:
                      indicadoresPrincipales.porcentajeObjetivo >= 100
                        ? '#28a745'
                        : indicadoresPrincipales.porcentajeObjetivo >= 75
                        ? '#ffc107'
                        : '#dc3545',
                    transition: 'width 0.3s ease',
                  }}
                ></div>
              </div>
            </div>

            {/* Mensaje de diferencia */}
            <p
              style={{
                fontSize: '0.875rem',
                color: indicadoresPrincipales.diferenciaMeta >= 0 ? '#28a745' : '#dc3545',
                margin: 0,
              }}
            >
              {indicadoresPrincipales.diferenciaMeta >= 0
                ? `¡Superaste tu objetivo por ${formatearMoneda(indicadoresPrincipales.diferenciaMeta)}!`
                : `Te faltan ${formatearMoneda(Math.abs(indicadoresPrincipales.diferenciaMeta))} para alcanzar tu objetivo`}
            </p>
          </div>
        </div>

        {/* SERVICIOS MÁS REALIZADOS */}
        {serviciosMasRealizados && serviciosMasRealizados.length > 0 && (
          <div
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '2rem',
            }}
          >
            <h3
              style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#212529',
                marginBottom: '1rem',
              }}
            >
              Servicios Más Realizados
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.875rem',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                    <th
                      style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#495057',
                      }}
                    >
                      Servicio
                    </th>
                    <th
                      style={{
                        padding: '0.75rem',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#495057',
                      }}
                    >
                      Cantidad
                    </th>
                    <th
                      style={{
                        padding: '0.75rem',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#495057',
                      }}
                    >
                      Ingresos
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {serviciosMasRealizados.map((item, index) => (
                    <tr
                      key={index}
                      style={{
                        borderBottom: '1px solid #e9ecef',
                        background: index % 2 === 0 ? '#f8f9fa' : 'white',
                      }}
                    >
                      <td style={{ padding: '0.75rem' }}>{item.servicio.nombre}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {item.cantidad}
                      </td>
                      <td
                        style={{
                          padding: '0.75rem',
                          textAlign: 'right',
                          fontWeight: '600',
                          color: '#28a745',
                        }}
                      >
                        {formatearMoneda(item.ingresos)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarberoEstadisticas;
