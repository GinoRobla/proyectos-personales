import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import configuracionService from '../../services/configuracionService';
import servicioService from '../../services/servicioService';
import './ConfiguracionSenas.css';

const ConfiguracionSenas = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [servicios, setServicios] = useState([]);

  const [formData, setFormData] = useState({
    senasActivas: false,
    porcentajeSena: 30,
    politicaSenas: 'todos',
    serviciosPremiumIds: [],
    mercadoPagoAccessToken: '',
    mercadoPagoPublicKey: '',
    horasAntesCancelacion: 24,
    permitirDevolucionSena: true,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar configuración y servicios en paralelo
      const [configRes, serviciosRes] = await Promise.all([
        configuracionService.obtenerConfiguracion(),
        servicioService.obtenerServicios(true),
      ]);

      if (configRes.success) {
        const config = configRes.data;
        setFormData({
          senasActivas: config.senasActivas || false,
          porcentajeSena: config.porcentajeSena || 30,
          politicaSenas: config.politicaSenas || 'todos',
          serviciosPremiumIds: config.serviciosPremiumIds || [],
          mercadoPagoAccessToken: config.mercadoPagoAccessToken || '',
          mercadoPagoPublicKey: config.mercadoPagoPublicKey || '',
          horasAntesCancelacion: config.horasAntesCancelacion || 24,
          permitirDevolucionSena: config.permitirDevolucionSena !== undefined ? config.permitirDevolucionSena : true,
        });
      }

      if (serviciosRes.success) {
        setServicios(serviciosRes.data || []);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleServicioPremiumToggle = (servicioId) => {
    setFormData((prev) => {
      const isSelected = prev.serviciosPremiumIds.includes(servicioId);
      return {
        ...prev,
        serviciosPremiumIds: isSelected
          ? prev.serviciosPremiumIds.filter((id) => id !== servicioId)
          : [...prev.serviciosPremiumIds, servicioId],
      };
    });
  };

  const validarFormulario = () => {
    // Si las señas están activas, validar credenciales de MercadoPago
    if (formData.senasActivas) {
      if (!formData.mercadoPagoAccessToken) {
        toast.error('Debes configurar el Access Token de MercadoPago para activar el sistema de señas');
        return false;
      }

      if (!formData.mercadoPagoAccessToken.startsWith('APP_USR-') && !formData.mercadoPagoAccessToken.startsWith('TEST-')) {
        toast.error('El Access Token de MercadoPago no tiene el formato correcto');
        return false;
      }
    }

    // Validar porcentaje
    const porcentaje = Number(formData.porcentajeSena);
    if (porcentaje < 10 || porcentaje > 100) {
      toast.error('El porcentaje de seña debe estar entre 10% y 100%');
      return false;
    }

    // Validar horas de anticipación
    const horas = Number(formData.horasAntesCancelacion);
    if (horas < 0 || horas > 168) {
      toast.error('Las horas de anticipación deben estar entre 0 y 168 (7 días)');
      return false;
    }

    // Si la política es servicios premium, validar que hay al menos uno seleccionado
    if (formData.politicaSenas === 'servicios_premium' && formData.serviciosPremiumIds.length === 0) {
      toast.error('Debes seleccionar al menos un servicio premium');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setGuardando(true);
    try {
      const response = await configuracionService.actualizarConfiguracion(formData);

      if (response.success) {
        toast.success('Configuración de señas actualizada correctamente');
        // No recargar datos para evitar scroll al inicio
        // Los datos ya están en formData y se guardaron correctamente
      } else {
        toast.error(response.message || 'Error al guardar la configuración');
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      const mensaje = error.response?.data?.message || 'Error al guardar la configuración';
      toast.error(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="config-senas-page">
        <div className="loading">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="config-senas-page">
      <div className="page-header">
        <h1>Configuración de Señas y Pagos</h1>
        <p className="subtitle">Administra el sistema de anticipos para tus turnos</p>
      </div>

      <form onSubmit={handleSubmit} className="config-form">
        {/* Activar/Desactivar Sistema */}
        <section className="form-section">
          <h2>Estado del Sistema</h2>
          <div className="switch-container">
            <label className="switch">
              <input
                type="checkbox"
                name="senasActivas"
                checked={formData.senasActivas}
                onChange={handleChange}
              />
              <span className="slider"></span>
            </label>
            <span className="switch-label">
              {formData.senasActivas ? 'Sistema de señas ACTIVADO' : 'Sistema de señas DESACTIVADO'}
            </span>
          </div>
          <p className="help-text">
            Cuando está activado, se solicitará una seña para confirmar los turnos según la política configurada.
          </p>
        </section>

        {/* Credenciales MercadoPago */}
        <section className="form-section">
          <h2>Credenciales de MercadoPago</h2>
          <div className="input-group">
            <label htmlFor="mercadoPagoAccessToken">Access Token *</label>
            <input
              type="password"
              id="mercadoPagoAccessToken"
              name="mercadoPagoAccessToken"
              value={formData.mercadoPagoAccessToken}
              onChange={handleChange}
              placeholder="APP_USR-xxxxxxx o TEST-xxxxxxx"
              className="input"
            />
            <p className="help-text">
              Obtén tus credenciales en{' '}
              <a
                href="https://www.mercadopago.com.ar/developers/panel/app"
                target="_blank"
                rel="noopener noreferrer"
              >
                Panel de Desarrolladores de MercadoPago
              </a>
            </p>
          </div>

          <div className="input-group">
            <label htmlFor="mercadoPagoPublicKey">Public Key *</label>
            <input
              type="text"
              id="mercadoPagoPublicKey"
              name="mercadoPagoPublicKey"
              value={formData.mercadoPagoPublicKey}
              onChange={handleChange}
              placeholder="APP_USR-xxxxxxx o TEST-xxxxxxx"
              className="input"
            />
          </div>
        </section>

        {/* Configuración de Señas */}
        <section className="form-section">
          <h2>Configuración de Señas</h2>

          <div className="input-group">
            <label htmlFor="porcentajeSena">Porcentaje de Seña (%)</label>
            <input
              type="number"
              id="porcentajeSena"
              name="porcentajeSena"
              value={formData.porcentajeSena}
              onChange={handleChange}
              min="10"
              max="100"
              className="input"
            />
            <p className="help-text">Entre 10% y 100% del precio del servicio</p>
          </div>

          <div className="input-group">
            <label htmlFor="politicaSenas">Política de Aplicación</label>
            <select
              id="politicaSenas"
              name="politicaSenas"
              value={formData.politicaSenas}
              onChange={handleChange}
              className="input"
            >
              <option value="ninguno">Ninguno (señas desactivadas)</option>
              <option value="todos">Todos los turnos</option>
              <option value="nuevos_clientes">Solo clientes nuevos</option>
              <option value="servicios_premium">Solo servicios premium</option>
            </select>
            <p className="help-text">Determina a qué turnos se les aplicará la seña obligatoria</p>
          </div>

          {/* Selección de Servicios Premium */}
          {formData.politicaSenas === 'servicios_premium' && (
            <div className="input-group">
              <label>Servicios Premium</label>
              <div className="servicios-premium-list">
                {servicios.length === 0 ? (
                  <p className="no-data">No hay servicios disponibles</p>
                ) : (
                  servicios.map((servicio) => (
                    <div key={servicio._id} className="servicio-checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={formData.serviciosPremiumIds.includes(servicio._id)}
                          onChange={() => handleServicioPremiumToggle(servicio._id)}
                        />
                        <span>{servicio.nombre} - ${servicio.precioBase}</span>
                      </label>
                    </div>
                  ))
                )}
              </div>
              <p className="help-text">Selecciona los servicios que requieren seña obligatoria</p>
            </div>
          )}
        </section>

        {/* Política de Cancelación */}
        <section className="form-section">
          <h2>Política de Cancelación</h2>

          <div className="input-group">
            <label htmlFor="horasAntesCancelacion">Horas de Anticipación para Cancelar</label>
            <input
              type="number"
              id="horasAntesCancelacion"
              name="horasAntesCancelacion"
              value={formData.horasAntesCancelacion}
              onChange={handleChange}
              min="0"
              max="168"
              className="input"
            />
            <p className="help-text">
              Si el cliente cancela con más anticipación, puede obtener devolución de la seña
            </p>
          </div>

          <div className="switch-container">
            <label className="switch">
              <input
                type="checkbox"
                name="permitirDevolucionSena"
                checked={formData.permitirDevolucionSena}
                onChange={handleChange}
              />
              <span className="slider"></span>
            </label>
            <span className="switch-label">Permitir devolución de seña</span>
          </div>
          <p className="help-text">
            Si está activado, se podrá devolver la seña si se cancela con la anticipación configurada
          </p>
        </section>

        {/* Botones */}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfiguracionSenas;
