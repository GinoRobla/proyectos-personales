// frontend/src/pages/barbero/BarberoPerfil.jsx

import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; // Ajusta la ruta si es necesario
import { useToast } from '../../context/ToastContext'; // Ajusta la ruta si es necesario
import authService from '../../services/authService';
import useFormData from '../../hooks/useFormData'; // Ajusta la ruta si es necesario
import useApi from '../../hooks/useApi'; // Ajusta la ruta si es necesario
import './BarberoPerfil.css'; // Importar el nuevo CSS

const BarberoPerfil = () => {
  const { usuario, actualizarUsuario } = useAuth();
  const toast = useToast();

  // --- HOOKS DE ESTADO ---
  const { values: perfil, handleChange, setValues: setPerfilValues } = useFormData({
    nombre: '', apellido: '', email: '', telefono: ''
  });
  const { values: passwords, handleChange: handlePasswordChange, resetForm: resetPasswordForm } = useFormData({
    passwordActual: '', passwordNuevo: '', passwordConfirmar: ''
  });

  // --- HOOKS DE API ---
  const { loading: loadingPerfil, request: actualizarPerfilApi } = useApi(authService.actualizarPerfil);
  const { loading: loadingPassword, request: cambiarPasswordApi } = useApi(authService.cambiarPassword);

  const guardando = loadingPerfil || loadingPassword;

  // Cargar datos iniciales
  useEffect(() => {
    if (usuario) {
      setPerfilValues({
        nombre: usuario.nombre || '',
        apellido: usuario.apellido || '',
        email: usuario.email || '', // Email generalmente no se edita aquí
        telefono: usuario.telefono || '',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  // handleSubmit (similar a ClientePerfil.jsx)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones mejoradas
    if (!perfil.nombre.trim() || !perfil.apellido.trim()) {
      toast.error('Nombre y apellido son obligatorios', 4000);
      return;
    }

    if (!perfil.telefono.trim()) {
      toast.error('El teléfono es obligatorio', 4000);
      return;
    }

    const passNuevo = passwords.passwordNuevo;
    if (passNuevo && passNuevo.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres', 4000);
      return;
    }
    if (passNuevo && passNuevo !== passwords.passwordConfirmar) {
      toast.error('Las contraseñas nuevas no coinciden. Por favor verifica', 4000);
      return;
    }
    if (passNuevo && !passwords.passwordActual) {
      toast.error('Debes ingresar tu contraseña actual para cambiarla', 4000);
      return;
    }

    let perfilActualizado = false;
    let passActualizado = false;

    // Actualizar perfil
    const perfilParaActualizar = {
      nombre: perfil.nombre,
      apellido: perfil.apellido,
      telefono: perfil.telefono,
    };
    const responsePerfil = await actualizarPerfilApi(perfilParaActualizar);

    if (responsePerfil.success) {
      perfilActualizado = true;
      actualizarUsuario(responsePerfil.data);
    } else {
      toast.error(responsePerfil.message || 'No se pudo actualizar el perfil', 4000);
    }

    // Cambiar contraseña
    if (passwords.passwordActual && passwords.passwordNuevo) {
      const responsePass = await cambiarPasswordApi(passwords.passwordActual, passwords.passwordNuevo);
      if (responsePass.success) {
        passActualizado = true;
        resetPasswordForm();
      } else {
        toast.error(responsePass.message || 'No se pudo cambiar la contraseña', 4000);
      }
    }

    // Mostrar mensajes de éxito
    if (perfilActualizado && passActualizado) {
      toast.success('Perfil y contraseña actualizados correctamente', 3000);
    } else if (perfilActualizado) {
      toast.success('Perfil actualizado correctamente', 3000);
    } else if (passActualizado) {
      toast.success('Contraseña cambiada correctamente', 3000);
    }
  };

  return (
    // Clase base específica
    <div className="perfil-page-barbero">
      <div className="container">
        <h1>Mi Perfil (Barbero)</h1>
        {/* Clase de card específica */}
        <div className="perfil-card-barbero">
          {/* Clase de form específica */}
          <form onSubmit={handleSubmit} className="perfil-form-barbero">
            <h3 className="section-title">Información Personal</h3>
             {/* Inputs: Usan clases genéricas de index.css */}
             <div className="input-group">
                <label className="input-label" htmlFor="nombre">Nombre *</label>
                <input type="text" id="nombre" name="nombre" value={perfil.nombre} onChange={handleChange} required className="input" />
            </div>
             <div className="input-group">
                <label className="input-label" htmlFor="apellido">Apellido *</label>
                <input type="text" id="apellido" name="apellido" value={perfil.apellido} onChange={handleChange} required className="input" />
            </div>
             <div className="input-group">
                <label className="input-label" htmlFor="email">Email (no editable)</label>
                <input type="email" id="email" name="email" value={perfil.email} readOnly disabled className="input" />
            </div>
            <div className="input-group">
                <label className="input-label" htmlFor="telefono">Teléfono *</label>
                <input type="tel" id="telefono" name="telefono" value={perfil.telefono} onChange={handleChange} required className="input" />
            </div>

            <h3 className="section-title">Cambiar Contraseña</h3>
            <p className="input-hint">Deja en blanco si no deseas cambiarla.</p>
             {/* Inputs Contraseña */}
             <div className="input-group">
                <label className="input-label" htmlFor="passwordActual">Contraseña Actual</label>
                <input type="password" id="passwordActual" name="passwordActual" value={passwords.passwordActual} onChange={handlePasswordChange} className="input" autoComplete="current-password"/>
            </div>
             <div className="input-group">
                <label className="input-label" htmlFor="passwordNuevo">Nueva Contraseña</label>
                <input type="password" id="passwordNuevo" name="passwordNuevo" value={passwords.passwordNuevo} onChange={handlePasswordChange} className="input" autoComplete="new-password"/>
            </div>
             <div className="input-group">
                <label className="input-label" htmlFor="passwordConfirmar">Confirmar Nueva Contraseña</label>
                <input type="password" id="passwordConfirmar" name="passwordConfirmar" value={passwords.passwordConfirmar} onChange={handlePasswordChange} className="input" autoComplete="new-password"/>
            </div>

            {/* Clase de acciones específica */}
            <div className="perfil-acciones-barbero">
              <button type="submit" disabled={guardando} className='btn btn-primary'>
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              {(passwords.passwordActual || passwords.passwordNuevo || passwords.passwordConfirmar) && (
                 <button
                   type="button"
                   onClick={resetPasswordForm}
                   disabled={guardando}
                   className="btn btn-outline"
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

export default BarberoPerfil;