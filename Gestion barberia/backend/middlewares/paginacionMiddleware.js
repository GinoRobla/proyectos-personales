/**
 * Middleware de Paginación
 * Extrae y valida parámetros de paginación de la query string
 */

export const paginacion = (req, res, next) => {
  // Obtener parámetros de paginación (por defecto página 1, 10 resultados)
  const pagina = parseInt(req.query.pagina) || 1;
  const limite = parseInt(req.query.limite) || 10;

  // Validar que sean números positivos
  if (pagina < 1) {
    return res.status(400).json({
      success: false,
      message: 'El número de página debe ser mayor a 0',
    });
  }

  if (limite < 1 || limite > 100) {
    return res.status(400).json({
      success: false,
      message: 'El límite debe estar entre 1 y 100',
    });
  }

  // Calcular skip (cuántos documentos saltar)
  const skip = (pagina - 1) * limite;

  // Agregar parámetros al request
  req.paginacion = {
    pagina,
    limite,
    skip,
  };

  next();
};

/**
 * Función helper para generar respuesta paginada
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
