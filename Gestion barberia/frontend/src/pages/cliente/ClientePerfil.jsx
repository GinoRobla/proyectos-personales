// frontend/src/pages/cliente/ClientePerfil.jsx

import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import authService from '../../services/authService';
import useFormData from '../hooks/useFormData';
import useApi from '../../hooks/useApi'; // <-- Importar useApi
// import './ClientePerfil.css';

const ClientePerfil = () => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // --- Validaciones (sin cambios) ---
    if (!perfil.nombre || !perfil.apellido || !perfil.telefono) {
      toast.error('Nombre, Apellido y Teléfono son obligatorios.');
      return;
    }
    const passNuevo = passwords.passwordNuevo;
    if (passNuevo && passNuevo.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (passNuevo && passNuevo !== passwords.passwordConfirmar) {
      toast.error('Las nuevas contraseñas no coinciden.');
      return;
    }
    if (passNuevo && !passwords.passwordActual) {
        toast.error('Debe ingresar su contraseña actual para cambiarla.');
        return;
    }

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
      actualizarUsuario(responsePerfil.data); // Sincronizar AuthContext
    }
    
    // 2. Cambiar contraseña (si se ingresó)
    if (passwords.passwordActual && passwords.passwordNuevo) {
      const responsePass = await cambiarPasswordApi(passwords.passwordActual, passwords.passwordNuevo);
      if (responsePass.success) {
        passActualizado = true;
        resetPasswordForm();
      }
    }

    // 3. Mostrar mensajes de éxito
    if (perfilActualizado && passActualizado) {
      toast.success('Perfil y contraseña actualizados con éxito');
    } else if (perfilActualizado) {
      toast.success('Perfil actualizado con éxito');
    }
    // Los errores ya fueron mostrados por los hooks
  };

  // --- RENDERIZADO ---
  // (El JSX es idéntico al de la Fase 5, solo cambiamos el `disabled` del botón)
  return (
     <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Mi Perfil</h1>
      <div style={{ background: 'white', borderRadius: '8px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleSubmit}>
          {/* ... (Inputs de Información Personal) ... */}
          
          <div style={{ margin: '2rem 0', borderTop: '1px solid #e9ecef' }}></div>

          {/* ... (Inputs de Cambiar Contraseña) ... */}

           <div style={{ marginTop: '2rem' }}>
             <button type="submit" disabled={guardando} className='btn btn-primary'>
               {guardando ? 'Guardando...' : 'Guardar Cambios'}
             </button>
              {/* ... (botón Limpiar Contraseñas) ... */}
           </div>
        </form>
      </div>
    </div>
  );
};

export default ClientePerfil;