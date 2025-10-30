import { createContext, useEffect, useState } from "react";
import { Global } from "../helpers/Global";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [auth, setAuth] = useState({});
    const [counters, setCounters] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authUser();
    }, []);

    const authUser = async () => {

        // sacar datos usuario identificado del localstorage
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");

        // comprobar si tengo el token y el user
        if (!token || !user) {
            setLoading(false);
            return false;
        }

        try {
            // transformar los datos a un objeto javascript
            const userObj = JSON.parse(user);
            const userId = userObj.id;

            // peticion ajax al backend que compuebe el token y que me devuelva todos los datos del usuario
            const request = await fetch(Global.url + "user/getProfile/" + userId, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token,
                }
            });

            const data = await request.json();

            // verificar si la respuesta es válida
            if (data.status === "success") {
                // peticion para los contadores
                const requestCounters = await fetch(Global.url + "user/counters/" + userId, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": token,
                    }
                });

                const dataCounters = await requestCounters.json();

                // setear el estado de auth
                setAuth(data.user);
                setCounters(dataCounters.status === "success" ? dataCounters : {});
            } else {
                // Si el token no es válido, limpiar localStorage
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setAuth({});
                setCounters({});
            }
        } catch (error) {
            console.log("Error en la autenticación:", error);
            // Limpiar localStorage en caso de error
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setAuth({});
            setCounters({});
        }

        setLoading(false);
    }

    return (
        <AuthContext.Provider value={{ auth, setAuth, counters, setCounters, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext;
