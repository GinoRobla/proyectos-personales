import { validationResult } from 'express-validator';

/**
 * Middleware para procesar los resultados de express-validator
 * Debe usarse después de los validadores en las rutas
 *
 * Ejemplo de uso:
 * router.post('/login', validarLogin, validar, loginController);
 */
export const validar = (req, res, next) => {
  const errores = validationResult(req);

  if (!errores.isEmpty()) {
    // Obtener el primer error para mostrarlo como mensaje principal
    const primerError = errores.array()[0];
    const mensajePrincipal = primerError.msg;

    return res.status(400).json({
      success: false,
      message: mensajePrincipal, // Mensaje específico del primer error
      errores: errores.array().map(err => ({
        campo: err.path || err.param,
        mensaje: err.msg,
        valor: err.value
      }))
    });
  }

  next();
};
