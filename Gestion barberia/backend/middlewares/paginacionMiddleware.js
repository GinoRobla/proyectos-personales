/**
 * Middleware de paginación.
 * Extrae y valida parámetros de paginación de la query string.
 */

export const paginacion = (req, res, next) => {
  const pagina = parseInt(req.query.pagina) || 1;
  const limite = parseInt(req.query.limite) || 10;

  if (pagina < 1) {
    return res.status(400).json({
      success: false,
      message: 'El número de página debe ser mayor a 0',
    });
  }

  if (limite < 1 || limite > 1000) {
    return res.status(400).json({
      success: false,
      message: 'El límite debe estar entre 1 y 1000',
    });
  }

  req.paginacion = {
    pagina,
    limite,
    skip: (pagina - 1) * limite,
  };

  next();
};

/**
 * Genera respuesta paginada estándar
 */
export const generarRespuestaPaginada = (datos, total, pagina, limite) => {
  const totalPaginas = Math.ceil(total / limite);

  return {
    datos,
    paginacion: {
      total,
      totalPaginas,
      paginaActual: pagina,
      limite,
      tienePaginaSiguiente: pagina < totalPaginas,
      tienePaginaAnterior: pagina > 1,
    },
  };
};

export default {
  paginacion,
  generarRespuestaPaginada,
};
