import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Global } from "../../helpers/Global";
import { useForm } from "../../hooks/useForm"
import useAuth from "../../hooks/useAuth";


export const Login = () => {
  
  const {form, changed} = useForm({});
  const [saved, setSaved] = useState("not_sended");
  const {auth, setAuth, setCounters} = useAuth();
  const navigate = useNavigate();

  // Efecto para redireccionar cuando se actualiza el auth
  useEffect(() => {
    if (auth && (auth._id || auth.id) && saved === "login") {
      navigate("/social", { replace: true });
    }
  }, [auth, saved, navigate]);

  const loginUser = async(e) => {
    e.preventDefault();

    // datos del formulario
    const userToLogin = form;

    // peticion al backend
    const request = await fetch(Global.url + "user/login", {
      method: "POST",
      body: JSON.stringify(userToLogin),
      headers: {
        "Content-Type": "application/json",
      }
    });

    const data = await request.json();

    
    if(data.status == "success") {      
      
      // persistir los datos en el navegador
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));      
      
      setSaved("login");

      // setear datos en el auth
      setAuth(data.user);

      // obtener contadores del usuario
      try {
        const requestCounters = await fetch(Global.url + "user/counters/" + data.user.id, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": data.token,
          }
        });

        const dataCounters = await requestCounters.json();
        if (dataCounters.status === "success") {
          setCounters(dataCounters);
        }
      } catch (error) {
        console.log("Error al obtener contadores:", error);
      }

      // La redirección se maneja en el useEffect

    }else{
      setSaved("error");
    }
  }
  
  return (
    <div className="auth-container">
      <div className="auth-main">
        <div className="auth-form login">
          <label className="auth-label">Iniciar Sesión</label>

          {saved == "login" ? (
            <div className="auth-alert alert-success">
              ¡Inicio de sesión exitoso! Redirigiendo...
            </div>
          ) : ""}
          {saved == "error" ? (
            <div className="auth-alert alert-danger">
              Error al iniciar sesión. Verifica tus credenciales.
            </div>
          ) : ""}
          
          <form onSubmit={loginUser}>
            <div className="form-group">
              <input 
                type="email" 
                name="email" 
                placeholder="Correo electrónico"
                className="auth-input"
                onChange={changed}
                required
              />
            </div>

            <div className="form-group">
              <input 
                type="password" 
                name="password" 
                placeholder="Contraseña"
                className="auth-input"
                onChange={changed}
                required
              />
            </div>

            <button type="submit" className="auth-button">
              Iniciar Sesión
            </button>
          </form>

          <div className="auth-switch">
            ¿No tienes una cuenta? <a href="/registro">Regístrate aquí</a>
          </div>
        </div>
      </div>
    </div>
  )
}
