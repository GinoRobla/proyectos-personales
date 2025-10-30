import { Navigate, Outlet } from "react-router-dom"
import { PrivSidebar } from "./PrivSidebar"
import useAuth from "../../../hooks/useAuth"

export const PrivateLayout = () => {
  
  const {auth, loading} = useAuth();

  if(loading) {
    return <div className="loading">
      <h1>Cargando...</h1>
    </div>
  }else{

    return (
      <div className="layout-instagram">
        {/* Sidebar de navegación */}
        <PrivSidebar />
  
        {/* Contenido principal */}
        <main className="main-content">
          {auth._id || auth.id ? <Outlet /> : <Navigate to="/login" />}
        </main>
      </div>
    )

  }
  
  
}
