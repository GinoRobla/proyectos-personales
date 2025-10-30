import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Global } from "../../helpers/Global";
import { useForm } from "../../hooks/useForm"


export const Register = () => {
  
  const {form, changed} = useForm({});
  const [saved, setSaved] = useState("not_sended");
  const navigate = useNavigate();

  const saveUser = async(e) => {
    // prevenir actualizacion de pantalla
    e.preventDefault();

    // recoger datos del formulario
    let newUser = form;

    // guardar usuario en el backend
    const request = await fetch(Global.url + "user/register", {
      method: "POST",
      body: JSON.stringify(newUser),
      headers: {
        "Content-Type": "application/json",
      }
    });

    const data = await request.json();

    if(data.status == "success"){
      setSaved("saved");
      
      // redirigir al login después del registro exitoso
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } else{
      setSaved("error");
    }

  }
  
  return (
    <div className="auth-container">
      <div className="auth-main">
        <div className="auth-form signup">
          <label className="auth-label">Registro</label>

          {saved == "saved" ? (
            <div className="auth-alert alert-success">
              ¡Usuario registrado correctamente! Redirigiendo al login...
            </div>
          ) : ""}
          {saved == "error" ? (
            <div className="auth-alert alert-danger">
              Error al registrar usuario. Inténtalo de nuevo.
            </div>
          ) : ""}
          
          <form onSubmit={saveUser}>
            <div className="form-group">
              <input 
                type="text" 
                name="name" 
                placeholder="Nombre"
                className="auth-input"
                onChange={changed}
                required
              />
            </div>

            <div className="form-group">
              <input 
                type="text" 
                name="surname" 
                placeholder="Apellidos"
                className="auth-input"
                onChange={changed}
                required
              />
            </div>

            <div className="form-group">
              <input 
                type="text" 
                name="nick" 
                placeholder="Nombre de usuario"
                className="auth-input"
                onChange={changed}
                required
              />
            </div>

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

            <div className="form-group">
              <input 
                type="text" 
                name="bio" 
                placeholder="Biografía (opcional)"
                className="auth-input"
                onChange={changed}
              />
            </div>

            <button type="submit" className="auth-button">
              Registrarse
            </button>
          </form>

          <div className="auth-switch">
            ¿Ya tienes una cuenta? <a href="/login">Inicia sesión aquí</a>
          </div>
        </div>
      </div>
    </div>
  )
}
