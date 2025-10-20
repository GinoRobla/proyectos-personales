// frontend/src/pages/barbero/BarberoPerfil.jsx

import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import authService from '../../services/authService';
import useFormData from '../hooks/useFormData';
import useApi from '../../hooks/useApi'; // <-- Importar useApi
// import './BarberoPerfil.css';

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

  // Cargar datos iniciales (sin cambios)
  useEffect(() => {
    if (usuario) {
      setPerfilValues({
        nombre: usuario.nombre || '',
        apellido: usuario.apellido || '',
        email: usuario.email || '',
        telefono: usuario.telefono || '',
      });
    }
  }, [usuario, setPerfilValues]);

  // handleSubmit (idéntico a ClientePerfil.jsx)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // --- Validaciones (sin cambios) ---
    if (!perfil.nombre || !perfil.apellido || !perfil.telefono) { /*...*/ return; }
    if (passwords.passwordNuevo && passwords.passwordNuevo.length < 6) { /*...*/ return; }
    if (passwords.passwordNuevo && passwords.passwordNuevo !== passwords.passwordConfirmar) { /*...*/ return; }
    if (passwords.passwordNuevo && !passwords.passwordActual) { /*...*/ return; }

    // --- Lógica de API ---
    let perfilActualizado = false;
    let passActualizado = false;

    // 1. Actualizar perfil
    const perfilParaActualizar = {
      nombre: perfil.nombre,
      apellido: perfil.apellido,
      telefono: perfil.telefono,
    };
    const responsePerfil = await actualizarPerfilApi(perfilParaActualizar);

    if (responsePerfil.success) {
      perfilActualizado = true;
      actualizarUsuario(responsePerfil.data);
    }
    
    // 2. Cambiar contraseña
    if (passwords.passwordActual && passwords.passwordNuevo) {
      const responsePass = await cambiarPasswordApi(passwords.passwordActual, passwords.passwordNuevo);
      if (responsePass.success) {
        passActualizado = true;
        resetPasswordForm();
      }
    }

    // 3. Mostrar mensajes de éxito
    if (perfilActualizado && passActualizado) {
      toast.success('Perfil y contraseña actualizados');
    } else if (perfilActualizado) {
      toast.success('Perfil actualizado');
    }
  };

  // --- RENDERIZADO ---
  // (El JSX es idéntico al de ClientePerfil, solo cambiamos el título y el `disabled` del botón)
  return (
     <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Mi Perfil (Barbero)</h1>
      <div style={{ background: 'white', borderRadius: '8px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleSubmit}>
          {/* ... (Inputs de Información Personal) ... */}
          <div style={{ margin: '2rem 0', borderTop: '1px solid #e9ecef' }}></div>
          {/* ... (Inputs de Cambiar Contraseña) ... */}
           <div style={{ marginTop: '2rem' }}>
             <button type="submit" disabled={guardando} className='btn btn-primary'>
               {guardando ? 'Guardando...' : 'Guardar Cambios'}
             </button>
             {/* ... (botón Limpiar) ... */}
           </div>
        </form>
      </div>
    </div>
  );
};

export default BarberoPerfil;