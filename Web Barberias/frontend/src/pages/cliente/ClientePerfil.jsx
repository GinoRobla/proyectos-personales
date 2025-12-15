// frontend/src/pages/cliente/ClientePerfil.jsx

import { useEffect, useCallback, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import authService from '../../services/authService';
import useFormData from '../../hooks/useFormData';
import useApi from '../../hooks/useApi';
import VerificarTelefono from '../../components/VerificarTelefono';
import './ClientePerfil.css';

const ClientePerfil = () => {
  const { actualizarUsuario: actualizarUsuarioContext } = useAuth();
  const toast = useToast();

  // Hooks de API
  const { loading: loadingPerfil, request: cargarPerfilApi } = useApi(authService.obtenerPerfil);
  const { loading: loadingGuardar, request: actualizarPerfilApi } = useApi(authService.actualizarPerfil);
  const { loading: loadingPassword, request: cambiarPasswordApi } = useApi(authService.cambiarPassword);

  const isLoading = loadingPerfil;
  const isSaving = loadingGuardar || loadingPassword;

  // Hook para datos del perfil
  const [telefonoVerificado, setTelefonoVerificado] = useState(false);

  const { values: perfil, handleChange, setValues: setPerfilValues } = useFormData({
    nombre: '', apellido: '', email: '', telefono: '', foto: '',
  });

  // Hook para cambio de contraseña
  const { values: passwords, handleChange: handlePasswordChange, resetForm: resetPasswordForm } = useFormData({
    passwordActual: '', passwordNuevo: '', passwordConfirmar: '',
  });

  // Cargar perfil inicial
  const cargarPerfil = useCallback(async () => {
    const { success, data, message } = await cargarPerfilApi();
    if (success && data) {
      setPerfilValues({
        nombre: data.nombre || '',
        apellido: data.apellido || '',
        email: data.email || '',
        telefono: data.telefono || '',
        foto: data.foto || '',
      });
      // Cargar estado de verificación
      setTelefonoVerificado(data.telefonoVerificado || false);
    } else {
      toast.error(message || 'Error al cargar tu perfil', 4000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (!perfil.nombre.trim() || !perfil.apellido.trim()) {
      toast.error('Nombre y apellido son obligatorios', 4000);
      return;
    }

    if (!perfil.email.trim()) {
      toast.error('El email es obligatorio', 4000);
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(perfil.email)) {
      toast.error('Por favor ingresa un email válido', 4000);
      return;
    }

    if (!perfil.telefono.trim()) {
      toast.error('El teléfono es obligatorio', 4000);
      return;
    }

    // Validaciones de contraseña si se intenta cambiar
    if (passwords.passwordActual || passwords.passwordNuevo || passwords.passwordConfirmar) {
      if (!passwords.passwordActual || !passwords.passwordNuevo || !passwords.passwordConfirmar) {
        toast.error('Para cambiar la contraseña, completa todos los campos de contraseña', 4000);
        return;
      }
      if (passwords.passwordNuevo !== passwords.passwordConfirmar) {
        toast.error('Las contraseñas nuevas no coinciden. Por favor verifica', 4000);
        return;
      }
      if (passwords.passwordNuevo.length < 6) {
        toast.error('La nueva contraseña debe tener al menos 6 caracteres', 4000);
        return;
      }
    }

    let perfilActualizadoExitoso = false;
    let passwordCambiadoExitoso = false;

    // Actualizar perfil
    const responsePerfil = await actualizarPerfilApi(perfil);
    if (responsePerfil.success && responsePerfil.data) {
      actualizarUsuarioContext(responsePerfil.data);
      perfilActualizadoExitoso = true;
    } else {
      toast.error(responsePerfil.message || 'No se pudo actualizar el perfil', 4000);
    }

    // Cambiar contraseña si se proporcionaron datos
    if (passwords.passwordActual && passwords.passwordNuevo) {
      const responsePassword = await cambiarPasswordApi(passwords.passwordActual, passwords.passwordNuevo);
      if (responsePassword.success) {
        resetPasswordForm();
        passwordCambiadoExitoso = true;
      } else {
        toast.error(responsePassword.message || 'No se pudo cambiar la contraseña', 4000);
      }
    }

    // Mostrar mensajes de éxito combinados o individuales
    if (perfilActualizadoExitoso && passwordCambiadoExitoso) {
      toast.success('Perfil y contraseña actualizados correctamente', 3000);
    } else if (perfilActualizadoExitoso) {
      toast.success('Perfil actualizado correctamente', 3000);
    } else if (passwordCambiadoExitoso) {
      toast.success('Contraseña cambiada correctamente', 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="cliente-perfil-page">
        <div className="container perfil-loading">
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cliente-perfil-page">
      <div className="container">
        <h1>Mi Perfil</h1>

        <div className="perfil-card-cliente">
          <form onSubmit={handleSubmit}>
            {/* Información Personal */}
            <h2 className="perfil-section-title">Información Personal</h2>
            <div className="perfil-grid">
              <div className="input-group">
                <label className="input-label">Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  value={perfil.nombre}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Apellido *</label>
                <input
                  type="text"
                  name="apellido"
                  value={perfil.apellido}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={perfil.email}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>
              <div className="input-group">
                <label className="input-label">
                  Teléfono * {telefonoVerificado && <span className="badge-verificado">✓ Verificado</span>}
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={perfil.telefono}
                  onChange={handleChange}
                  required
                  className="input"
                  readOnly={telefonoVerificado}
                  disabled={telefonoVerificado}
                  style={telefonoVerificado ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
                />
              </div>
            </div>

            {/* Verificación de Teléfono */}
            <VerificarTelefono
                telefono={perfil.telefono}
                onVerificado={() => {
                  // Actualizar el estado para bloquear el input inmediatamente
                  setTelefonoVerificado(true);
                }}
                modoAutenticado={true}
              />

            <div className="perfil-divider"></div>

            {/* Cambio de Contraseña */}
            <h2 className="perfil-section-title">Cambiar Contraseña</h2>
            <p className="password-hint">
              Deja estos campos en blanco si no deseas cambiar tu contraseña.
            </p>
            <div className="perfil-grid">
              <div className="input-group">
                <label className="input-label">Contraseña Actual</label>
                <input
                  type="password"
                  name="passwordActual"
                  value={passwords.passwordActual}
                  onChange={handlePasswordChange}
                  className="input"
                  autoComplete="current-password"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Nueva Contraseña</label>
                <input
                  type="password"
                  name="passwordNuevo"
                  value={passwords.passwordNuevo}
                  onChange={handlePasswordChange}
                  minLength={6}
                  className="input"
                  autoComplete="new-password"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  name="passwordConfirmar"
                  value={passwords.passwordConfirmar}
                  onChange={handlePasswordChange}
                  minLength={6}
                  className="input"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="perfil-actions">
              <button type="submit" disabled={isSaving} className="btn btn-primary">
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              {(passwords.passwordActual || passwords.passwordNuevo || passwords.passwordConfirmar) && (
                <button
                  type="button"
                  onClick={resetPasswordForm}
                  className="btn btn-limpiar"
                  disabled={isSaving}
                >
                  Limpiar Contraseñas
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientePerfil;
