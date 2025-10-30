import { Navigate, Outlet } from "react-router-dom"
import useAuth from "../../../hooks/useAuth"

export const PublicLayout = () => {
  
  const {auth, loading} = useAuth();

  if (loading) {
    return (
      <div className="public-layout">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          color: 'white',
          fontSize: '18px'
        }}>
          Cargando...
        </div>
      </div>
    );
  }
  
  return (
    <div className="public-layout">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">ReactSocial</h1>
            <p className="hero-subtitle">
              Una red social moderna creada con React y Node.js
            </p>
            <div className="hero-description">
              <div className="feature-item">
                <div className="feature-icon">🏗️</div>
                <div className="feature-content">
                  <h3>Arquitectura Full Stack</h3>
                  <p>Aplicación profesional siguiendo patrones MVC y arquitectura REST</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">⚛️</div>
                <div className="feature-content">
                  <h3>Frontend Moderno</h3>
                  <p>React 18, Hooks, Context API, React Router, Vite</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">🛠️</div>
                <div className="feature-content">
                  <h3>Backend Robusto</h3>
                  <p>Node.js, Express.js, Mongoose ODM, Multer para archivos</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">🔒</div>
                <div className="feature-content">
                  <h3>Autenticación Segura</h3>
                  <p>JWT tokens, bcrypt para encriptación, middlewares de autorización</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">💾</div>
                <div className="feature-content">
                  <h3>Base de Datos</h3>
                  <p>MongoDB con esquemas relacionales, paginación, validaciones</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">✨</div>
                <div className="feature-content">
                  <h3>Funcionalidades</h3>
                  <p>CRUD completo, sistema de seguimiento, feed personalizado, subida de archivos</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">🚀</div>
                <div className="feature-content">
                  <h3>Buenas Prácticas</h3>
                  <p>Código modular, separación de responsabilidades, validación de datos</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">🌐</div>
                <div className="feature-content">
                  <h3>API RESTful</h3>
                  <p>Endpoints documentados, CORS configurado, manejo de errores</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Contenido principal - Login/Register */}
          <div className="hero-form">
            {!auth || (!auth._id && !auth.id) ? <Outlet /> : <Navigate to="/social"></Navigate>}
          </div>
        </div>
      </section>
    </div>
  )
}
