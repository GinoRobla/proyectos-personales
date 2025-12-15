// frontend/src/pages/admin/ConfiguracionNegocio.jsx

import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import configuracionService from '../../services/configuracionService';
import { DIAS_SEMANA, DURACIONES_TURNO } from '../../constants/common';
import { validarEmail, validarURL, validarTelefono, validarLongitud } from '../../utils/validators';
import useForm from '../../hooks/useForm';
import './ConfiguracionNegocio.css';

const ConfiguracionNegocio = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);

  const { values: formData, setValues: setFormData, handleChange, handleNestedChange } = useForm({
    nombreNegocio: '',
    direccion: '',
    telefono: '',
    emailContacto: '',
    duracionTurnoMinutos: 45,
    horarios: '',
    redesSociales: {
      facebook: '',
      instagram: '',
      twitter: '',
      whatsapp: '',
    },
  });

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    setLoading(true);
    try {
      const response = await configuracionService.obtenerConfiguracion();
      if (response.success) {
        setConfig(response.data);
        setFormData({
          nombreNegocio: response.data.nombreNegocio || '',
          direccion: response.data.direccion || '',
          telefono: response.data.telefono || '',
          emailContacto: response.data.emailContacto || '',
          duracionTurnoMinutos: response.data.duracionTurnoMinutos || 45,
          horarios: response.data.horarios || 'Lun-Vie: 9:00-20:00',
          redesSociales: {
            facebook: response.data.redesSociales?.facebook || '',
            instagram: response.data.redesSociales?.instagram || '',
            twitter: response.data.redesSociales?.twitter || '',
            whatsapp: response.data.redesSociales?.whatsapp || '',
          },
        });
      } else {
        const mensaje = response.message || 'Error al cargar configuración';
        toast.error(mensaje);
      }
    } catch (error) {
      const mensaje = error.response?.data?.message || error.message || 'Error al cargar configuración';
      toast.error(mensaje);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    handleNestedChange('redesSociales', name, value);
  };

  const validarFormulario = () => {
    // Validar email
    if (formData.emailContacto && !validarEmail(formData.emailContacto)) {
      toast.error('El email de contacto no es válido');
      return false;
    }

    // Validar teléfono
    if (formData.telefono && !validarTelefono(formData.telefono)) {
      toast.error('El formato del teléfono no es válido');
      return false;
    }

    // Validar URLs de redes sociales
    const { facebook, instagram, twitter, whatsapp } = formData.redesSociales;
    if (!validarURL(facebook) || !validarURL(instagram) || !validarURL(twitter) || !validarURL(whatsapp)) {
      toast.error('Una o más URLs de redes sociales no son válidas');
      return false;
    }

    // Validar longitudes
    if (!validarLongitud(formData.nombreNegocio, 100)) {
      toast.error('El nombre del negocio no puede exceder 100 caracteres');
      return false;
    }

    if (!validarLongitud(formData.direccion, 200)) {
      toast.error('La dirección no puede exceder 200 caracteres');
      return false;
    }

    if (!validarLongitud(formData.horarios, 200)) {
      toast.error('Los horarios no pueden exceder 200 caracteres');
      return false;
    }

    return true;
  };

  const guardarConfiguracion = async (e) => {
    e.preventDefault();

    // Validar formulario antes de enviar
    if (!validarFormulario()) {
      return;
    }

    setLoading(true);
    try {
      const response = await configuracionService.actualizarConfiguracion(formData);
      if (response.success) {
        toast.success('Configuración guardada exitosamente');
        // Actualizar el estado config sin recargar desde el servidor
        setConfig(response.data);
      } else {
        toast.error(response.message || 'Error al guardar configuración');
      }
    } catch (error) {
      const mensaje = error.response?.data?.message || error.message || 'Error al guardar configuración';
      toast.error(mensaje);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDiaBloqueado = async (diaSemana) => {
    const estaBloqueado = config?.diasBloqueadosPermanente?.includes(diaSemana);

    setLoading(true);
    try {
      let response;
      if (estaBloqueado) {
        response = await configuracionService.quitarDiaBloqueado(diaSemana);
      } else {
        response = await configuracionService.agregarDiaBloqueado(diaSemana);
      }

      if (response.success) {
        toast.success(estaBloqueado ? 'Día desbloqueado' : 'Día bloqueado permanentemente');
        cargarConfiguracion();
      } else {
        toast.error(response.message || 'Error al actualizar días bloqueados');
      }
    } catch (error) {
      const mensaje = error.response?.data?.message || error.message || 'Error al actualizar días bloqueados';
      toast.error(mensaje);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !config) {
    return (
      <div className="configuracion-negocio">
        <div className="container">
          <div className="loading">Cargando configuración...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="configuracion-negocio">
      <div className="container">
        <h1>Configuración del Negocio</h1>
        <p className="subtitulo">Personaliza tu barbería y ajusta los parámetros generales</p>

        {/* SECCIÓN 1: INFORMACIÓN DEL NEGOCIO */}
        <div className="seccion-config">
          <div className="seccion-header">
            <h2>Información del Negocio</h2>
            <p>Datos básicos de tu barbería</p>
          </div>

          <div className="form-config">
            <div className="form-row">
              <div className="input-group">
                <label htmlFor="nombreNegocio">Nombre de la Barbería</label>
                <input
                  type="text"
                  id="nombreNegocio"
                  name="nombreNegocio"
                  className="input"
                  value={formData.nombreNegocio}
                  onChange={handleChange}
                  placeholder="Mi Barbería"
                  maxLength="100"
                />
              </div>

              <div className="input-group">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  className="input"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="+54 9 11 1234-5678"
                  maxLength="20"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label htmlFor="direccion">Dirección</label>
                <input
                  type="text"
                  id="direccion"
                  name="direccion"
                  className="input"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="Calle 123, Ciudad, Provincia"
                  maxLength="200"
                />
              </div>

              <div className="input-group">
                <label htmlFor="emailContacto">Email de Contacto</label>
                <input
                  type="email"
                  id="emailContacto"
                  name="emailContacto"
                  className="input"
                  value={formData.emailContacto}
                  onChange={handleChange}
                  placeholder="contacto@mibarberia.com"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="horarios">Horarios de Atención</label>
              <input
                type="text"
                id="horarios"
                name="horarios"
                className="input"
                value={formData.horarios}
                onChange={handleChange}
                placeholder="Lun-Vie: 9:00-20:00, Sáb: 9:00-18:00"
                maxLength="200"
              />
              <small className="input-hint">
                Describe los horarios de tu barbería para mostrar en el footer
              </small>
            </div>
          </div>
        </div>

        {/* SECCIÓN: REDES SOCIALES */}
        <div className="seccion-config">
          <div className="seccion-header">
            <h2>Redes Sociales</h2>
            <p>Enlaces a tus redes sociales (dejar vacío para ocultar)</p>
          </div>

          <div className="form-config">
            <div className="form-row">
              <div className="input-group">
                <label htmlFor="facebook">Facebook</label>
                <input
                  type="url"
                  id="facebook"
                  name="facebook"
                  className="input"
                  value={formData.redesSociales.facebook}
                  onChange={handleSocialChange}
                  placeholder="https://facebook.com/tubarberia"
                  maxLength="200"
                />
              </div>

              <div className="input-group">
                <label htmlFor="instagram">Instagram</label>
                <input
                  type="url"
                  id="instagram"
                  name="instagram"
                  className="input"
                  value={formData.redesSociales.instagram}
                  onChange={handleSocialChange}
                  placeholder="https://instagram.com/tubarberia"
                  maxLength="200"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label htmlFor="twitter">Twitter / X</label>
                <input
                  type="url"
                  id="twitter"
                  name="twitter"
                  className="input"
                  value={formData.redesSociales.twitter}
                  onChange={handleSocialChange}
                  placeholder="https://twitter.com/tubarberia"
                  maxLength="200"
                />
              </div>

              <div className="input-group">
                <label htmlFor="whatsapp">WhatsApp</label>
                <input
                  type="url"
                  id="whatsapp"
                  name="whatsapp"
                  className="input"
                  value={formData.redesSociales.whatsapp}
                  onChange={handleSocialChange}
                  placeholder="https://wa.me/5491112345678"
                  maxLength="200"
                />
                <small className="input-hint">
                  Formato: https://wa.me/[código país][número sin espacios]
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: DURACIÓN DE TURNOS */}
        <div className="seccion-config">
          <div className="seccion-header">
            <h2>Duración de Turnos</h2>
            <p>Define cuánto dura cada turno en tu barbería</p>
          </div>

          <div className="duracion-selector">
            {DURACIONES_TURNO.map((duracion) => (
              <div
                key={duracion.valor}
                className={`duracion-card ${formData.duracionTurnoMinutos === duracion.valor ? 'seleccionada' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, duracionTurnoMinutos: duracion.valor }))}
              >
                <div className="duracion-valor">{duracion.valor}'</div>
                <div className="duracion-etiqueta">{duracion.etiqueta}</div>
                {formData.duracionTurnoMinutos === duracion.valor && (
                  <div className="check-icon">✓</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SECCIÓN 3: DÍAS BLOQUEADOS PERMANENTEMENTE */}
        <div className="seccion-config">
          <div className="seccion-header">
            <h2>Días de Atención</h2>
            <p>Selecciona los días en que tu barbería está abierta</p>
          </div>

          <div className="dias-bloqueados-lista">
            {DIAS_SEMANA.map((dia) => {
              const estaBloqueado = config?.diasBloqueadosPermanente?.includes(dia.numero);
              return (
                <div
                  key={dia.numero}
                  className="dia-bloqueo-item"
                >
                  <div className="dia-info">
                    <span className="dia-nombre">{dia.nombre}</span>
                    <span className={`dia-badge ${estaBloqueado ? 'cerrado' : 'abierto'}`}>
                      {estaBloqueado ? 'Cerrado' : 'Abierto'}
                    </span>
                  </div>
                  <button
                    className={`toggle-btn ${estaBloqueado ? 'inactive' : 'active'}`}
                    onClick={() => toggleDiaBloqueado(dia.numero)}
                    disabled={loading}
                    title={estaBloqueado ? 'Habilitar día' : 'Deshabilitar día'}
                  >
                    <span className="toggle-slider"></span>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="nota-info">
            <strong>Nota:</strong> Los días marcados como "Cerrado" no estarán disponibles para reservar turnos.
          </div>
        </div>

        {/* BOTÓN GUARDAR GENERAL */}
        <div className="container" style={{ textAlign: 'center', marginTop: '2rem', marginBottom: '2rem' }}>
          <button onClick={guardarConfiguracion} className="btn btn-primary" disabled={loading} style={{ maxWidth: '300px', margin: '0 auto' }}>
            {loading ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionNegocio;
