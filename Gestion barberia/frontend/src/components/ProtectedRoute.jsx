/**
 * ============================================================================
 * COMPONENTE: RUTA PROTEGIDA
 * ============================================================================
 *
 * Componente de seguridad que protege rutas según autenticación y roles.
 *
 * RESPONSABILIDADES:
 * - Verificar si el usuario está autenticado
 * - Validar que el usuario tenga el rol apropiado
 * - Redirigir a login si no está autenticado
 * - Redirigir a home si no tiene el rol necesario
 * - Mostrar indicador de carga durante verificación
 *
 * PROPS:
 * - children: Contenido a mostrar si pasa las validaciones
 * - allowedRoles: Array de roles permitidos (opcional)
 *
 * FLUJO DE VALIDACIÓN:
 * 1. Mostrar loading mientras verifica autenticación
 * 2. Si no está autenticado → redirigir a /login
 * 3. Si no tiene rol permitido → redirigir a /
 * 4. Si pasa validaciones → mostrar contenido
 *
 * USO:
 * <ProtectedRoute allowedRoles={['admin']}>
 *   <ComponenteAdmin />
 * </ProtectedRoute>
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ============================================================================
// DEFINICIÓN DEL COMPONENTE
// ============================================================================

/**
 * COMPONENTE: ProtectedRoute
 *
 * @param {Object} props - Props del componente
 * @param {ReactNode} props.children - Contenido a proteger
 * @param {Array<string>} props.allowedRoles - Roles permitidos (ej: ['admin', 'barbero'])
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  // Obtener estado de autenticación del contexto
  const { usuario, estaAutenticado, estaCargando } = useAuth();

  // ============================================================================
  // PASO 1: Mostrar indicador de carga durante verificación
  // ============================================================================
  // Mientras se está verificando la autenticación, mostrar un spinner
  // para evitar redirecciones prematuras
  if (estaCargando) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '80vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // ============================================================================
  // PASO 2: Verificar autenticación
  // ============================================================================
  // Si el usuario no está autenticado, redirigir a la página de login
  // replace=true evita que se agregue al historial (no puede volver con el botón atrás)
  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  // ============================================================================
  // PASO 3: Verificar roles permitidos
  // ============================================================================
  // Si se especificaron roles permitidos y el usuario no tiene ninguno de ellos,
  // redirigir a la página principal
  const tieneRolPermitido =
    allowedRoles.length === 0 || // Si no se especificaron roles, permitir a todos los autenticados
    allowedRoles.includes(usuario?.rol); // Si se especificaron, verificar que el usuario tenga uno

  if (!tieneRolPermitido) {
    return <Navigate to="/" replace />;
  }

  // ============================================================================
  // PASO 4: Mostrar contenido protegido
  // ============================================================================
  // Si pasó todas las validaciones, mostrar el contenido hijo
  return children;
};

// ============================================================================
// EXPORTACIÓN
// ============================================================================

export default ProtectedRoute;
