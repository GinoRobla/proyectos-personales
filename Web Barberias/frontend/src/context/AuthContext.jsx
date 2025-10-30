import { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

// 1. Se crea el Contexto de Autenticación.
const AuthContext = createContext();

/**
 * Hook para usar los datos de autenticación (usuario, login, logout)
 * desde cualquier componente.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

/**
 * Componente "Proveedor" que gestiona el estado de la sesión del usuario
 * y lo comparte con toda la aplicación.
 */
export const AuthProvider = ({ children }) => {
  // Almacena el objeto del usuario si está logueado (o null si no lo está).
  const [usuario, setUsuario] = useState(null);

  // Indica si se está verificando la sesión al cargar la página (true) o no (false).
  const [estaCargando, setEstaCargando] = useState(true);

  // Al cargar la aplicación por primera vez, verifica si ya hay una sesión guardada.
  useEffect(() => {
    checkAuthSession();
  }, []);

  // Comprueba si hay un token guardado en el navegador y si sigue siendo válido.
  const checkAuthSession = async () => {
    const token = localStorage.getItem('token');

    // Si no hay token, el usuario no está logueado. Termina la carga.
    if (!token) {
      setEstaCargando(false);
      return;
    }

    try {
      // Si hay token, consulta al backend para validarlo.
      const response = await authService.verificarToken();
      // Si el token es válido, guarda los datos del usuario en el estado.
      setUsuario(response.data.usuario);
    } catch (error) {
      // Si el token es inválido o expiró, limpia los datos guardados.
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
    } finally {
      // Pase lo que pase, marca la carga inicial como completada.
      setEstaCargando(false);
    }
  };

  // Función para iniciar sesión llamando al servicio de autenticación.
  const login = async (email, password) => {
    const response = await authService.login(email, password);

    if (response.success) {
      const { usuario, token } = response.data;
      // Guarda los datos en localStorage para que la sesión persista.
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));
      // Actualiza el estado de React con el usuario logueado.
      setUsuario(usuario);
      return { success: true, user: usuario };
    }
    // Si falla, devuelve el mensaje de error.
    return { success: false, message: response.message };
  };

  // Función para registrar un nuevo usuario.
  const register = async (registerData) => {
    const response = await authService.registro(registerData);

    if (response.success) {
      const { usuario, token } = response.data;
      // Inicia sesión y guarda los datos inmediatamente después del registro.
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));
      setUsuario(usuario);
      return { success: true, user: usuario };
    }
    return { success: false, message: response.message };
  };

  // Función para cerrar la sesión del usuario.
  const logout = () => {
    // Limpia los datos de sesión del navegador.
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    // Limpia el estado de React.
    setUsuario(null);
    // Redirige al inicio (esto refresca la página por completo).
    window.location.href = '/';
  };

  // Actualiza los datos del perfil en el backend.
  const updateProfile = async (updatedData) => {
    const response = await authService.actualizarPerfil(updatedData);
    if (response.success) {
      // Actualiza el estado y el localStorage con los nuevos datos del usuario.
      setUsuario(response.data);
      localStorage.setItem('usuario', JSON.stringify(response.data));
      return { success: true };
    }
    return { success: false, message: response.message };
  };

  // Función para actualizar el estado del usuario localmente (sin llamar a la API).
  const updateUser = (newUserData) => {
    setUsuario(newUserData);
    localStorage.setItem('usuario', JSON.stringify(newUserData));
  };

  // Objeto con todos los valores que se compartirán en el contexto.
  const contextValue = {
    usuario,
    estaCargando,
    estaAutenticado: !!usuario, // '!!usuario' convierte el objeto 'usuario' en un booleano (true si existe, false si es null).
    login,
    registro: register,
    logout,
    actualizarPerfil: updateProfile,
    actualizarUsuario: updateUser,
    updateProfile, // Mantener compatibilidad
    updateUser, // Mantener compatibilidad
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;