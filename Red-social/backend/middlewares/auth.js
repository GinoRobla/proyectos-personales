const jwt = require("jwt-simple");
const moment = require("moment");

//importar clave secreta
const libjwt = require("../services/jwt");
const secret = libjwt.secret;

//middleware de autenticacion
const auth = (req, res, next) => {
    // Comprobar si existe la cabecera de autenticación
    if (!req.headers.authorization) {
        return res.status(403).json({
            status: "error",
            message: "La petición no tiene la cabecera de autenticación"
        });
    }

    // Limpiar el token
    const token = req.headers.authorization.replace(/['"]+/g, "");

    try {
        // Decodificar el token
        const payload = jwt.decode(token, secret);

        // Comprobar si el token ha expirado
        if (payload.exp <= moment().unix()) {
            return res.status(401).json({
                status: "error",
                message: "El token ha expirado"
            });
        }

        // Añadir el usuario identificado a la request dentro del try
        req.user = payload;

        // Continuar a la siguiente función
        next();

    } catch (error) {
        return res.status(404).json({
            status: "error",
            message: "Token no válido"
        });
    }
}

// Exportar el middleware
module.exports = {
    auth
};
