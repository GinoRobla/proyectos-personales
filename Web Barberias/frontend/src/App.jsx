import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Páginas públicas
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ReservarTurnoPage from './pages/ReservarTurnoPage';
import SolicitarRecuperacion from './pages/SolicitarRecuperacion';
import ResetearContrasena from './pages/ResetearContrasena';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';

// Páginas de resultado de pago
import PagoSuccess from './pages/pago/PagoSuccess';
import PagoFailure from './pages/pago/PagoFailure';
import PagoPending from './pages/pago/PagoPending';

// Páginas protegidas - Cliente
import ClienteDashboard from './pages/cliente/ClienteDashboard';
import ClienteTurnos from './pages/cliente/ClienteTurnos';
import ClientePerfil from './pages/cliente/ClientePerfil';

// Páginas protegidas - Barbero
import BarberoDashboard from './pages/barbero/BarberoDashboard';
import BarberoAgenda from './pages/barbero/BarberoAgenda';
import BarberoPerfil from './pages/barbero/BarberoPerfil';
import BarberoEstadisticas from './pages/barbero/BarberoEstadisticas';

// Páginas protegidas - Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminTurnos from './pages/admin/Turnos';
import AdminBarberos from './pages/admin/Barberos';
import AdminServicios from './pages/admin/Servicios';
import AdminEstadisticas from './pages/admin/Estadisticas';
import AdminPerfil from './pages/admin/Perfil';
import GestionDisponibilidad from './pages/admin/GestionDisponibilidad';
import ConfiguracionNegocio from './pages/admin/ConfiguracionNegocio';
import ConfiguracionSenas from './pages/admin/ConfiguracionSenas';
import GestionPagos from './pages/admin/GestionPagos';

// Componentes
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Layout />}>
            <Route index element={<LoginPage />} />
            <Route path="registro" element={<RegisterPage />} />
            <Route path="reservar" element={<ReservarTurnoPage />} />
            <Route path="solicitar-recuperacion" element={<SolicitarRecuperacion />} />
            <Route path="resetear-contrasena" element={<ResetearContrasena />} />
            <Route path="auth/google/success" element={<GoogleAuthSuccess />} />

            {/* Rutas de resultado de pago */}
            <Route path="pago/success" element={<PagoSuccess />} />
            <Route path="pago/failure" element={<PagoFailure />} />
            <Route path="pago/pending" element={<PagoPending />} />

            {/* Rutas protegidas - Cliente */}
            <Route
              path="cliente"
              element={
                <ProtectedRoute allowedRoles={['cliente']}>
                  <ClienteDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="cliente/turnos"
              element={
                <ProtectedRoute allowedRoles={['cliente']}>
                  <ClienteTurnos />
                </ProtectedRoute>
              }
            />
            <Route
              path="cliente/perfil"
              element={
                <ProtectedRoute allowedRoles={['cliente']}>
                  <ClientePerfil />
                </ProtectedRoute>
              }
            />

            {/* Rutas protegidas - Barbero */}
            <Route
              path="barbero"
              element={
                <ProtectedRoute allowedRoles={['barbero']}>
                  <BarberoDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="barbero/agenda"
              element={
                <ProtectedRoute allowedRoles={['barbero']}>
                  <BarberoAgenda />
                </ProtectedRoute>
              }
            />
            <Route
              path="barbero/perfil"
              element={
                <ProtectedRoute allowedRoles={['barbero']}>
                  <BarberoPerfil />
                </ProtectedRoute>
              }
            />
            <Route
              path="barbero/estadisticas"
              element={
                <ProtectedRoute allowedRoles={['barbero']}>
                  <BarberoEstadisticas />
                </ProtectedRoute>
              }
            />

            {/* Rutas protegidas - Admin */}
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/turnos"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminTurnos />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/barberos"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminBarberos />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/servicios"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminServicios />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/estadisticas"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminEstadisticas />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/perfil"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPerfil />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/disponibilidad"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <GestionDisponibilidad />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/configuracion"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ConfiguracionNegocio />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/configuracion-senas"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ConfiguracionSenas />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/pagos"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <GestionPagos />
                </ProtectedRoute>
              }
            />

            {/* Ruta 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
