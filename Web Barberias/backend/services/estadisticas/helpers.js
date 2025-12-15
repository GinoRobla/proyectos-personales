/**
 * Helpers para servicios de estadísticas
 * Funciones auxiliares compartidas
 */

/**
 * Calcula el primer y último día de un mes/año específico.
 * Si no se pasan mes/año, usa el mes y año actual.
 * Devuelve un objeto de query de fecha para Mongoose.
 * @param {number} mes - Mes (1-12)
 * @param {number} anio - Año
 * @returns {Object} Query de fecha para MongoDB
 */
export const obtenerQueryRangoMes = (mes, anio) => {
  const fecha = new Date();
  const mesActual = mes || fecha.getMonth() + 1; // getMonth() es 0-11, por eso +1
  const anioActual = anio || fecha.getFullYear();

  // Calcula el primer día (UTC para consistencia)
  const primerDia = new Date(Date.UTC(anioActual, mesActual - 1, 1, 0, 0, 0));
  // Calcula el último día (Día 0 del *siguiente* mes)
  const ultimoDia = new Date(Date.UTC(anioActual, mesActual, 0, 23, 59, 59));

  // Retorna el filtro de fecha para MongoDB
  return {
    fecha: {
      $gte: primerDia,
      $lte: ultimoDia,
    },
  };
};

/**
 * Construye query de filtro de fecha desde/hasta
 * @param {string} desde - Fecha desde
 * @param {string} hasta - Fecha hasta
 * @returns {Object} Query de fecha o objeto vacío
 */
export const construirQueryFecha = (desde, hasta) => {
  if (!desde || !hasta) return {};

  return {
    fecha: {
      $gte: new Date(desde),
      $lte: new Date(hasta),
    },
  };
};
