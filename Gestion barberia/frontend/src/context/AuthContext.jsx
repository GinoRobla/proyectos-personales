/**
 * ============================================================================
 * CONTEXTO: AUTENTICACIÓN
 * ============================================================================
 *
 * Maneja el estado global de autenticación de usuarios en toda la aplicación.
 *
 * RESPONSABILIDADES:
 * - Mantener el estado del usuario autenticado actualmente
 * - Verificar la autenticación al cargar la aplicación
 * - Proporcionar funciones para login, registro y logout
 * - Sincronizar el estado con localStorage
 * - Actualizar información del perfil del usuario
 *
 * ESTADO PROPORCIONADO:
 * - usuarioActual: Datos del usuario autenticado (null si no hay sesión)
 * - estaCargando: Indicador de verificación de autenticación en progreso
 * - estaAutenticado: Boolean que indica si hay un usuario logueado
 *
 * FUNCIONES PROPORCIONADAS:
 * - iniciarSesion: Login con email y contraseña
 * - registrarUsuario: Crear nueva cuenta de usuario
 * - cerrarSesion: Eliminar sesión y limpiar datos
 * - actualizarPerfil: Actualizar datos del perfil
 * - actualizarDatosUsuario: Actualizar estado local del usuario
 */

import { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

// ============================================================================
// CREACIÓN DEL CONTEXTO
// ============================================================================

const AuthContext = createContext();

// ============================================================================
// PROVEEDOR DEL CONTEXTO
// ============================================================================

export const AuthProvider = ({ children }) => {
  // ESTADO: Usuario autenticado actualmente
  // - null cuando no hay usuario logueado
  // - Objeto con datos del usuario cuando está autenticado
  const [usuarioActual, setUsuarioActual] = useState(null);

  // ESTADO: Indicador de carga durante verificación de autenticación
  // - true mientras se verifica el token al cargar la app
  // - false una vez completada la verificación
  const [estaCargando, setEstaCargando] = useState(true);

  // ============================================================================
  // EFECTO: Verificar autenticación al montar el componente
  // ============================================================================
  // Se ejecuta una sola vez cuando la aplicación carga por primera vez.
  // Verifica si hay un token guardado y valida su vigencia con el backend.
  useEffect(() => {
    verificarAutenticacion();
  }, []);

  // ============================================================================
  // FUNCIÓN: Verificar autenticación
  // ============================================================================
  /**
   * VERIFICAR AUTENTICACIÓN
   *
   * Valida si existe un token en localStorage y si sigue siendo válido.
   *
   * Proceso:
   * 1. Buscar token en localStorage
   * 2. Si no hay token, terminar como no autenticado
   * 3. Si hay token, validarlo con el backend
   * 4. Si es válido, cargar datos del usuario
   * 5. Si no es válido, limpiar localStorage
   */
  const verificarAutenticacion = async () => {
    // Paso 1: Buscar el token guardado en el navegador
    const tokenGuardado = localStorage.getItem('token');

    // Paso 2: Si no hay token, el usuario no está autenticado
    if (!tokenGuardado) {
      setEstaCargando(false);
      return;
    }

    try {
      // Paso 3: Validar el token con el backend
      const respuesta = await authService.verificarToken();

      // Paso 4: Si el token es válido, guardar datos del usuario
      setUsuarioActual(respuesta.data.usuario);
    } catch (error) {
      // Paso 5: Si el token no es válido, limpiar todo
      console.error('Error al verificar autenticación:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
    } finally {
      // Siempre terminar el estado de carga
      setEstaCargando(false);
    }
  };

  // ============================================================================
  // FUNCIÓN: Iniciar sesión con email y contraseña
  // ============================================================================
  /**
   * INICIAR SESIÓN
   *
   * Autentica un usuario con email y contraseña.
   *
   * Proceso:
   * 1. Enviar credenciales al backend
   * 2. Si es exitoso, guardar token y datos de usuario
   * 3. Actualizar el estado con los datos del usuario
   * 4. Retornar resultado de la operación
   *
   * @param {string} correoElectronico - Email del usuario
   * @param {string} contrasena - Contraseña del usuario
   * @returns {Object} - { success: boolean, usuario?: Object, message?: string }
   */
  const iniciarSesion = async (correoElectronico, contrasena) => {
    // Paso 1: Llamar al servicio de autenticación
    const respuesta = await authService.login(correoElectronico, contrasena);

    // Paso 2: Si el login fue exitoso
    if (respuesta.success) {
      const { usuario, token } = respuesta.data;

      // Guardar token en localStorage para persistencia
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));

      // Paso 3: Actualizar el estado del usuario
      setUsuarioActual(usuario);

      return { success: true, usuario };
    }

    // Si hubo error, retornar el mensaje
    return { success: false, message: respuesta.message };
  };

  // ============================================================================
  // FUNCIÓN: Registrar nuevo usuario
  // ============================================================================
  /**
   * REGISTRAR USUARIO
   *
   * Crea una nueva cuenta de usuario en el sistema.
   *
   * Proceso:
   * 1. Enviar datos de registro al backend
   * 2. Si es exitoso, guardar token y datos de usuario
   * 3. Actualizar el estado con los datos del nuevo usuario
   * 4. Retornar resultado de la operación
   *
   * @param {Object} datosRegistro - Datos del nuevo usuario (nombre, apellido, email, etc.)
   * @returns {Object} - { success: boolean, usuario?: Object, message?: string }
   */
  const registrarUsuario = async (datosRegistro) => {
    // Paso 1: Llamar al servicio de registro
    const respuesta = await authService.registro(datosRegistro);

    // Paso 2: Si el registro fue exitoso
    if (respuesta.success) {
      const { usuario, token } = respuesta.data;

      // Guardar token en localStorage para persistencia
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));

      // Paso 3: Actualizar el estado del usuario
      setUsuarioActual(usuario);

      return { success: true, usuario };
    }

    // Si hubo error, retornar el mensaje
    return { success: false, message: respuesta.message };
  };

  // ============================================================================
  // FUNCIÓN: Cerrar sesión
  // ============================================================================
  /**
   * CERRAR SESIÓN
   *
   * Elimina la sesión del usuario y limpia todos los datos guardados.
   *
   * Proceso:
   * 1. Eliminar token de localStorage
   * 2. Eliminar datos de usuario de localStorage
   * 3. Limpiar estado del usuario
   * 4. Redirigir a la página principal
   */
  const cerrarSesion = () => {
    // Paso 1 y 2: Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    // Paso 3: Limpiar estado
    setUsuarioActual(null);

    // Paso 4: Redirigir al home
    window.location.href = '/';
  };

  // ============================================================================
  // FUNCIÓN: Actualizar perfil del usuario
  // ============================================================================
  /**
   * ACTUALIZAR PERFIL
   *
   * Actualiza la información del perfil del usuario autenticado.
   *
   * Proceso:
   * 1. Enviar datos actualizados al backend
   * 2. Si es exitoso, actualizar el estado local
   * 3. Sincronizar con localStorage
   * 4. Retornar resultado de la operación
   *
   * @param {Object} datosActualizados - Nuevos datos del perfil
   * @returns {Object} - { success: boolean, message?: string }
   */
  const actualizarPerfil = async (datosActualizados) => {
    // Paso 1: Llamar al servicio de actualización
    const respuesta = await authService.actualizarPerfil(datosActualizados);

    // Paso 2: Si la actualización fue exitosa
    if (respuesta.success) {
      // Actualizar el estado con los nuevos datos
      setUsuarioActual(respuesta.data);

      // Paso 3: Sincronizar con localStorage
      localStorage.setItem('usuario', JSON.stringify(respuesta.data));

      return { success: true };
    }

    // Si hubo error, retornar el mensaje
    return { success: false, message: respuesta.message };
  };

  // ============================================================================
  // FUNCIÓN: Actualizar datos del usuario en el estado
  // ============================================================================
  /**
   * ACTUALIZAR DATOS USUARIO
   *
   * Actualiza directamente el estado del usuario sin hacer petición al backend.
   * Útil cuando otros componentes ya han actualizado el backend y solo necesitan
   * sincronizar el estado local.
   *
   * @param {Object} nuevosDatos - Nuevos datos del usuario
   */
  const actualizarDatosUsuario = (nuevosDatos) => {
    setUsuarioActual(nuevosDatos);
    localStorage.setItem('usuario', JSON.stringify(nuevosDatos));
  };

  // ============================================================================
  // VALOR DEL CONTEXTO
  // ============================================================================
  // Objeto que contiene todo el estado y funciones disponibles para los componentes
  const valorContexto = {
    // Estado
    usuario: usuarioActual,
    cargando: estaCargando,
    estaAutenticado: !!usuarioActual,

    // Funciones
    login: iniciarSesion,
    registro: registrarUsuario,
    logout: cerrarSesion,
    actualizarPerfil,
    actualizarUsuario: actualizarDatosUsuario,
  };

  return (
    <AuthContext.Provider value={valorContexto}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// HOOK PERSONALIZADO: useAuth
// ============================================================================
/**
 * Hook para acceder al contexto de autenticación desde cualquier componente.
 *
 * Uso:
 * const { usuario, estaAutenticado, login, logout } = useAuth();
 *
 * @throws {Error} Si se usa fuera de un AuthProvider
 * @returns {Object} Valor del contexto de autenticación
 */
export const useAuth = () => {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }

  return contexto;
};

export default AuthContext;
