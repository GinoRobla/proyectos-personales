import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import useAuth from "../../hooks/useAuth";


export const Logout = () => {
  
    const {setAuth, setCounters} = useAuth();
    const navigate = useNavigate();
    
    useEffect(() => {
        // vaciar el localstorage
        localStorage.clear();

        // setear estados globales a vacio
        setAuth({});
        setCounters({});

        // navigate(redirrecion al login)
        navigate('/login');
    }, [])
  
    return (
    <h1>Cerrando sesion...</h1>
  )
}
