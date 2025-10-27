// Importa los modelos de la base de datos
import Turno from '../models/Turno.js';
import Barbero from '../models/Barbero.js';
import Servicio from '../models/Servicio.js';
import Cliente from '../models/Cliente.js';

/**
 * -------------------------------------------------------------------
 * FUNCIÓN HELPER (USO INTERNO)
 * -------------------------------------------------------------------
 */

/**
 * (Helper) Calcula el primer y último día de un mes/año específico.
 * Si no se pasan mes/año, usa el mes y año actual.
 * Devuelve un objeto de query de fecha para Mongoose.
 */
const _obtenerQueryRangoMes = (mes, anio) => {
  // Obtiene la fecha de hoy si no se especifican mes/año
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
      $gte: primerDia, // "Mayor o igual que" el primer día
      $lte: ultimoDia, // "Menor o igual que" el último día
    },
  };
};

/**
 * -------------------------------------------------------------------
 * SERVICIOS EXPORTADOS
 * -------------------------------------------------------------------
 */

/**
 * Obtener estadísticas generales del negocio
 */
export const obtenerEstadisticasGenerales = async (filtros = {}) => {
  try {
    const { desde, hasta } = filtros;

    // Construye el filtro de fecha (si existe)
    const query = {};
    if (desde && hasta) {
      query.fecha = {
        $gte: new Date(desde),
        $lte: new Date(hasta),
      };
    }

    // Cuenta el total de turnos que coinciden con el filtro
    const totalTurnos = await Turno.countDocuments(query);

    // Cuenta cuántos turnos hay por cada estado (pendiente, completado, etc.)
    const turnosPorEstado = await Turno.aggregate([
      { $match: query }, // Filtra por el rango de fecha
      {
        $group: {
          _id: '$estado', // Agrupa por el campo 'estado'
          cantidad: { $sum: 1 }, // Cuenta 1 por cada turno en ese grupo
        },
      },
    ]);

    // Suma el precio de todos los turnos 'completados'
    const ingresosTotales = await Turno.aggregate([
      {
        $match: {
          ...query, // Usa el filtro de fecha
          estado: 'completado', // Pero solo de turnos completados
        },
      },
      {
        $group: {
          _id: null, // Agrupa todo en un solo resultado
          total: { $sum: '$precio' }, // Suma el campo 'precio'
        },
      },
    ]);

    // Busca los 5 servicios más pedidos
    const serviciosMasSolicitados = await Turno.aggregate([
      { $match: query }, // Filtra por fecha
      {
        $group: {
          _id: '$servicio', // Agrupa por ID de servicio
          cantidad: { $sum: 1 }, // Cuenta cuántos turnos tiene cada servicio
          ingresos: { $sum: '$precio' }, // Suma los ingresos de ese servicio
        },
      },
      { $sort: { cantidad: -1 } }, // Ordena de mayor a menor cantidad
      { $limit: 5 }, // Limita a los 5 primeros
      {
        // Busca la información del servicio (nombre, precio, etc.)
        $lookup: {
          from: 'servicios', // Colección 'servicios'
          localField: '_id', // Campo local (de 'Turno')
          foreignField: '_id', // Campo foráneo (de 'Servicio')
          as: 'servicioInfo', // Guarda el resultado en 'servicioInfo'
        },
      },
      { $unwind: '$servicioInfo' }, // Desempaqueta el array 'servicioInfo'
    ]);

    // Cuenta total de clientes y barberos activos
    const totalClientes = await Cliente.countDocuments({ activo: true });
    const totalBarberos = await Barbero.countDocuments({ activo: true });

    return {
      totalTurnos,
      turnosPorEstado,
      // El resultado de 'ingresosTotales' es un array (ej: [{ _id: null, total: 500 }])
      // Usamos '?' para acceder de forma segura y '|| 0' si no hay resultados
      ingresosTotales: ingresosTotales[0]?.total || 0,
      serviciosMasSolicitados,
      totalClientes,
      totalBarberos,
    };
  } catch (error) {
    throw new Error(`Error al obtener estadísticas generales: ${error.message}`);
  }
};

/**
 * Obtener estadísticas de un barbero específico
 */
export const obtenerEstadisticasPorBarbero = async (barberoId, filtros = {}) => {
  try {
    const { desde, hasta } = filtros;

    // 1. Verificar que el barbero existe
    const barbero = await Barbero.findById(barberoId);
    if (!barbero) {
      throw new Error('Barbero no encontrado');
    }

    // 2. Construir la query base (SIEMPRE filtrar por este barbero)
    const query = { barbero: barberoId };

    // 3. Añadir filtro de fecha (si existe)
    if (desde && hasta) {
      query.fecha = {
        $gte: new Date(desde),
        $lte: new Date(hasta),
      };
    }

    // 4. Calcular estadísticas (similar al general, pero usando la 'query' del barbero)
    const totalTurnos = await Turno.countDocuments(query);

    const turnosPorEstado = await Turno.aggregate([
      { $match: query },
      { $group: { _id: '$estado', cantidad: { $sum: 1 } } },
    ]);

    const ingresosGenerados = await Turno.aggregate([
      { $match: { ...query, estado: 'completado' } },
      { $group: { _id: null, total: { $sum: '$precio' } } },
    ]);

    const serviciosMasRealizados = await Turno.aggregate([
      { $match: query },
      { $group: { _id: '$servicio', cantidad: { $sum: 1 } } },
      { $sort: { cantidad: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'servicios',
          localField: '_id',
          foreignField: '_id',
          as: 'servicioInfo',
        },
      },
      { $unwind: '$servicioInfo' },
    ]);

    // Calcula el promedio de ingresos ($avg) por turno completado
    const promedioIngresos = await Turno.aggregate([
      { $match: { ...query, estado: 'completado' } },
      { $group: { _id: null, promedio: { $avg: '$precio' } } },
    ]);

    // 5. Devolver resultados
    return {
      barbero: {
        id: barbero._id,
        nombre: `${barbero.nombre} ${barbero.apellido}`,
      },
      totalTurnos,
      turnosPorEstado,
      ingresosGenerados: ingresosGenerados[0]?.total || 0,
      promedioIngresosPorTurno: promedioIngresos[0]?.promedio || 0,
      serviciosMasRealizados,
    };
  } catch (error) {
    throw new Error(`Error al obtener estadísticas por barbero: ${error.message}`);
  }
};

/**
 * Obtener comparativa entre todos los barberos
 */
export const obtenerComparativaBarberos = async (filtros = {}) => {
  try {
    const { desde, hasta } = filtros;

    // Construye el filtro de fecha (si existe)
    const query = {};
    if (desde && hasta) {
      query.fecha = {
        $gte: new Date(desde),
        $lte: new Date(hasta),
      };
    }

    // Esta consulta agrupa por barbero y calcula sus métricas
    const estadisticasPorBarbero = await Turno.aggregate([
      // Filtra por fecha Y que el turno SÍ tenga un barbero asignado
      { $match: { ...query, barbero: { $ne: null } } },
      {
        $group: {
          _id: '$barbero', // Agrupa por ID de barbero
          totalTurnos: { $sum: 1 }, // Cuenta todos sus turnos
          // $cond: Es un "if" -> if(estado == 'completado', suma 1, else suma 0)
          turnosCompletados: {
            $sum: { $cond: [{ $eq: ['$estado', 'completado'] }, 1, 0] },
          },
          // if(estado == 'completado', suma el precio, else suma 0)
          ingresos: {
            $sum: {
              $cond: [
                { $eq: ['$estado', 'completado'] },
                '$precio',
                0,
              ],
            },
          },
        },
      },
      // Busca la información del barbero (nombre, apellido)
      {
        $lookup: {
          from: 'barberos',
          localField: '_id',
          foreignField: '_id',
          as: 'barberoInfo',
        },
      },
      { $unwind: '$barberoInfo' }, // Desempaqueta el array
      { $sort: { ingresos: -1 } }, // Ordena por ingresos (de mayor a menor)
    ]);

    return estadisticasPorBarbero;
  } catch (error) {
    throw new Error(
      `Error al obtener comparativa de barberos: ${error.message}`
    );
  }
};

/**
 * Obtener turnos agrupados por período (día/semana/mes)
 */
export const obtenerTurnosPorPeriodo = async (filtros = {}) => {
  try {
    const { desde, hasta, periodo = 'dia' } = filtros;

    // Requiere fechas para poder filtrar
    if (!desde || !hasta) {
      throw new Error('Las fechas desde y hasta son requeridas');
    }

    // Define cómo se agruparán las fechas según el 'periodo'
    let groupBy;
    switch (periodo) {
      case 'mes':
        groupBy = {
          year: { $year: '$fecha' }, // Agrupa por ej: { year: 2024, month: 10 }
          month: { $month: '$fecha' },
        };
        break;
      case 'semana':
        groupBy = {
          year: { $year: '$fecha' }, // Agrupa por ej: { year: 2024, week: 42 }
          week: { $week: '$fecha' },
        };
        break;
      case 'dia':
      default:
        groupBy = {
          year: { $year: '$fecha' }, // Agrupa por ej: { year: 2024, month: 10, day: 19 }
          month: { $month: '$fecha' },
          day: { $dayOfMonth: '$fecha' },
        };
        break;
    }

    const turnosPorPeriodo = await Turno.aggregate([
      // 1. Filtra por el rango de fechas obligatorio
      {
        $match: {
          fecha: {
            $gte: new Date(desde),
            $lte: new Date(hasta),
          },
        },
      },
      // 2. Agrupa usando el 'groupBy' que definimos arriba (día, semana o mes)
      {
        $group: {
          _id: groupBy,
          totalTurnos: { $sum: 1 },
          // Suma ingresos solo si el turno está 'completado'
          ingresos: {
            $sum: {
              $cond: [
                { $eq: ['$estado', 'completado'] },
                '$precio',
                0,
              ],
            },
          },
        },
      },
      // 3. Ordena cronológicamente
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } },
    ]);

    return turnosPorPeriodo;
  } catch (error) {
    throw new Error(`Error al obtener turnos por período: ${error.message}`);
  }
};

/**
 * Obtener estadísticas específicas para el panel del admin (Dashboard)
 */
export const obtenerEstadisticasAdmin = async (filtros = {}) => {
  try {
    const { mes, anio } = filtros;

    // 1. Obtiene el rango de fechas del mes (usa el helper)
    const queryMes = _obtenerQueryRangoMes(mes, anio);

    // 2. Cálculos de Indicadores Principales
    // 💵 Ingresos totales del mes (solo completados)
    const ingresosTotales = await Turno.aggregate([
      { $match: { ...queryMes, estado: 'completado' } },
      { $group: { _id: null, total: { $sum: '$precio' } } },
    ]);

    // ✂️ Turnos totales (completados + cancelados)
    const turnosTotales = await Turno.countDocuments({
      ...queryMes,
      estado: { $in: ['completado', 'cancelado'] },
    });

    // 🧍‍♂️ Clientes atendidos únicos (cuenta clientes distintos)
    const clientesAtendidos = await Turno.aggregate([
      { $match: { ...queryMes, estado: 'completado' } },
      { $group: { _id: '$cliente' } }, // Agrupa por cliente (elimina duplicados)
      { $count: 'total' }, // Cuenta cuántos grupos (clientes únicos) hay
    ]);

    // 🧔 Barbero más solicitado
    const barberoMasSolicitado = await Turno.aggregate([
      {
        $match: {
          ...queryMes,
          estado: 'completado',
          barbero: { $ne: null },
        },
      },
      { $group: { _id: '$barbero', totalTurnos: { $sum: 1 } } },
      { $sort: { totalTurnos: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: 'barberos',
          localField: '_id',
          foreignField: '_id',
          as: 'barberoInfo',
        },
      },
      { $unwind: '$barberoInfo' },
    ]);

    // 💈 Servicio más popular
    const servicioMasPopular = await Turno.aggregate([
      { $match: { ...queryMes, estado: 'completado' } },
      { $group: { _id: '$servicio', totalReservas: { $sum: 1 } } },
      { $sort: { totalReservas: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: 'servicios',
          localField: '_id',
          foreignField: '_id',
          as: 'servicioInfo',
        },
      },
      { $unwind: '$servicioInfo' },
    ]);

    // 3. Cálculos para Gráficos y Tablas
    // 💰 Ingresos por barbero (para gráfico de barras)
    const ingresosPorBarbero = await Turno.aggregate([
      {
        $match: {
          ...queryMes,
          estado: 'completado',
          barbero: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$barbero',
          ingresos: { $sum: '$precio' },
          turnos: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'barberos',
          localField: '_id',
          foreignField: '_id',
          as: 'barberoInfo',
        },
      },
      { $unwind: '$barberoInfo' },
      { $sort: { ingresos: -1 } },
    ]);

    // 💇 Turnos por servicio
    const turnosPorServicio = await Turno.aggregate([
      { $match: { ...queryMes, estado: 'completado' } },
      {
        $group: {
          _id: '$servicio',
          totalTurnos: { $sum: 1 },
          ingresos: { $sum: '$precio' },
        },
      },
      {
        $lookup: {
          from: 'servicios',
          localField: '_id',
          foreignField: '_id',
          as: 'servicioInfo',
        },
      },
      { $unwind: '$servicioInfo' },
      { $sort: { totalTurnos: -1 } },
    ]);

    // 👥 Top 3 clientes frecuentes
    const topClientes = await Turno.aggregate([
      {
        $match: {
          ...queryMes,
          estado: 'completado',
          cliente: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$cliente',
          totalTurnos: { $sum: 1 },
          totalGastado: { $sum: '$precio' },
        },
      },
      { $sort: { totalTurnos: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: 'clientes',
          localField: '_id',
          foreignField: '_id',
          as: 'clienteInfo',
        },
      },
      { $unwind: '$clienteInfo' },
    ]);

    // 📈 Comparativa mes a mes
    const mesActual = mes || new Date().getMonth() + 1;
    const anioActual = anio || new Date().getFullYear();
    const mesAnterior = mesActual === 1 ? 12 : mesActual - 1;
    const anioMesAnterior = mesActual === 1 ? anioActual - 1 : anioActual;

    // Reutilizamos el helper para el mes anterior
    const queryMesAnterior = _obtenerQueryRangoMes(mesAnterior, anioMesAnterior);

    const ingresosMesAnterior = await Turno.aggregate([
      { $match: { ...queryMesAnterior, estado: 'completado' } },
      { $group: { _id: null, total: { $sum: '$precio' } } },
    ]);

    const turnosMesAnterior = await Turno.countDocuments({
      ...queryMesAnterior,
      estado: { $in: ['completado', 'cancelado'] },
    });

    // 📅 Días más y menos ocupados (1=Dom, 2=Lun, ...)
    const turnosPorDia = await Turno.aggregate([
      { $match: { ...queryMes, estado: 'completado' } },
      {
        $group: {
          _id: { $dayOfWeek: '$fecha' }, // Agrupa por día de la semana
          totalTurnos: { $sum: 1 },
        },
      },
      { $sort: { totalTurnos: -1 } },
    ]);

    // Mapea los números (1-7) a nombres ("Domingo", "Lunes", etc.)
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const turnosPorDiaFormateado = turnosPorDia.map(item => ({
      dia: diasSemana[item._id - 1], // Restamos 1 porque el array empieza en 0
      diaSemana: item._id,
      totalTurnos: item.totalTurnos,
    }));

    // 4. Formatear y devolver la respuesta final
    const ingresosMesActual = ingresosTotales[0]?.total || 0;
    const ingresosMesAnteriorTotal = ingresosMesAnterior[0]?.total || 0;
    const cambioIngresos = ingresosMesAnteriorTotal
      ? ((ingresosMesActual - ingresosMesAnteriorTotal) / ingresosMesAnteriorTotal) * 100
      : 0;
    const cambioTurnos = turnosMesAnterior
      ? ((turnosTotales - turnosMesAnterior) / turnosMesAnterior) * 100
      : 0;
    
    // Formatea los datos de barberoMasSolicitado para que incluyan el nombre completo
    const infoBarberoMasSolicitado = barberoMasSolicitado[0] ? {
        ...barberoMasSolicitado[0],
        barberoInfo: {
            ...barberoMasSolicitado[0].barberoInfo,
            nombreCompleto: `${barberoMasSolicitado[0].barberoInfo.nombre} ${barberoMasSolicitado[0].barberoInfo.apellido}`,
        },
    } : null;

    // Formatea los datos de ingresosPorBarbero
    const ingresosPorBarberoFormateado = ingresosPorBarbero.map(item => ({
      barbero: {
        id: item.barberoInfo._id,
        nombre: `${item.barberoInfo.nombre} ${item.barberoInfo.apellido}`,
      },
      ingresos: item.ingresos,
      turnos: item.turnos,
    }));
    
    // Formatea los datos de turnosPorServicio
    const turnosPorServicioFormateado = turnosPorServicio.map(item => ({
      servicio: {
        id: item.servicioInfo._id,
        nombre: item.servicioInfo.nombre,
        precio: item.servicioInfo.precio,
      },
      totalTurnos: item.totalTurnos,
      ingresos: item.ingresos,
      rentabilidad: item.totalTurnos > 0 ? item.ingresos / item.totalTurnos : 0,
    }));
    
    // Formatea los datos de topClientes
    const topClientesFormateado = topClientes.map(item => ({
      cliente: {
        id: item.clienteInfo._id,
        nombre: item.clienteInfo.nombre || 'Cliente',
        apellido: item.clienteInfo.apellido || '',
        email: item.clienteInfo.email,
      },
      totalTurnos: item.totalTurnos,
      totalGastado: item.totalGastado,
    }));

    return {
      periodo: { mes: mesActual, anio: anioActual },
      indicadoresPrincipales: {
        ingresosTotales: ingresosMesActual,
        turnosTotales,
        clientesAtendidos: clientesAtendidos[0]?.total || 0,
        barberoMasSolicitado: infoBarberoMasSolicitado,
        servicioMasPopular: servicioMasPopular[0] || null,
      },
      estadisticasAdicionales: {
        ingresosPorBarbero: ingresosPorBarberoFormateado,
        turnosPorServicio: turnosPorServicioFormateado,
        topClientes: topClientesFormateado,
        comparativaMesAnterior: {
          ingresosMesActual,
          ingresosMesAnterior: ingresosMesAnteriorTotal,
          cambioIngresos: Math.round(cambioIngresos), // Redondea el porcentaje
          turnosMesActual: turnosTotales,
          turnosMesAnterior,
          cambioTurnos: Math.round(cambioTurnos), // Redondea el porcentaje
        },
        diasOcupacion: {
          diaMasOcupado: turnosPorDiaFormateado[0] || null,
          diaMenosOcupado: turnosPorDiaFormateado[turnosPorDiaFormateado.length - 1] || null,
          todosPorDia: turnosPorDiaFormateado,
        },
      },
    };
  } catch (error) {
    throw new Error(`Error al obtener estadísticas del admin: ${error.message}`);
  }
};

/**
 * OBTENER ESTADÍSTICAS DEL BARBERO AUTENTICADO (Panel del Barbero)
 */
export const obtenerEstadisticasBarbero = async (barberoId, filtros = {}) => {
  try {
    const { mes, anio } = filtros;

    // 1. Verificar que el barbero existe
    const barbero = await Barbero.findById(barberoId);
    if (!barbero) {
      throw new Error('Barbero no encontrado');
    }

    // 2. Obtener rango del mes actual (usando el helper)
    const rangoMes = _obtenerQueryRangoMes(mes, anio);
    const queryMes = {
      barbero: barberoId, // Clave: filtrar siempre por el ID del barbero
      ...rangoMes, // Añade fecha: { $gte, $lte }
    };

    // 3. Calcular Indicadores del Mes
    // 💵 INGRESOS GENERADOS DEL MES (solo completados)
    const ingresosMes = await Turno.aggregate([
      { $match: { ...queryMes, estado: 'completado' } },
      { $group: { _id: null, total: { $sum: '$precio' } } },
    ]);
    const ingresosMensuales = ingresosMes[0]?.total || 0;

    // ✂️ TURNOS COMPLETADOS DEL MES
    const turnosCompletados = await Turno.countDocuments({
      ...queryMes,
      estado: 'completado',
    });

    // 4. Calcular Indicadores de la Semana Actual
    const hoy = new Date();
    // 0=Domingo, 1=Lunes. Queremos que la semana empiece en Lunes (1)
    const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay();
    
    // Va al inicio del Lunes de esta semana
    const primerDiaSemana = new Date(hoy);
    primerDiaSemana.setDate(hoy.getDate() - diaSemana + 1);
    primerDiaSemana.setHours(0, 0, 0, 0);

    // Va al final del Domingo de esta semana
    const ultimoDiaSemana = new Date(primerDiaSemana);
    ultimoDiaSemana.setDate(primerDiaSemana.getDate() + 6);
    ultimoDiaSemana.setHours(23, 59, 59, 999);

    const ingresosSemana = await Turno.aggregate([
      {
        $match: {
          barbero: barberoId,
          estado: 'completado',
          fecha: { $gte: primerDiaSemana, $lte: ultimoDiaSemana },
        },
      },
      { $group: { _id: null, total: { $sum: '$precio' } } },
    ]);
    const ingresosSemanales = ingresosSemana[0]?.total || 0;

    // 5. Cálculos para Gráficos
    // 💰 EVOLUCIÓN DE INGRESOS (por día del mes)
    const evolucionIngresosPorDia = await Turno.aggregate([
      { $match: { ...queryMes, estado: 'completado' } },
      {
        $group: {
          _id: {
            dia: { $dayOfMonth: '$fecha' },
            mes: { $month: '$fecha' },
            anio: { $year: '$fecha' },
          },
          ingresos: { $sum: '$precio' },
          turnos: { $sum: 1 },
        },
      },
      { $sort: { '_id.dia': 1 } },
    ]);

    // 💰 EVOLUCIÓN DE INGRESOS (últimas 4 semanas)
    const hace4Semanas = new Date(hoy);
    hace4Semanas.setDate(hoy.getDate() - 28); // Resta 28 días
    hace4Semanas.setHours(0, 0, 0, 0);

    const evolucionIngresosPorSemana = await Turno.aggregate([
      {
        $match: {
          barbero: barberoId,
          estado: 'completado',
          fecha: { $gte: hace4Semanas, $lte: hoy }, // Rango: últimas 4 semanas
        },
      },
      {
        $group: {
          _id: {
            semana: { $week: '$fecha' }, // Agrupa por número de semana
            anio: { $year: '$fecha' },
          },
          ingresos: { $sum: '$precio' },
          turnos: { $sum: 1 },
        },
      },
      { $sort: { '_id.anio': 1, '_id.semana': 1 } },
    ]);

    // 💇 SERVICIOS MÁS REALIZADOS EN EL MES
    const serviciosMasRealizados = await Turno.aggregate([
      { $match: { ...queryMes, estado: 'completado' } },
      {
        $group: {
          _id: '$servicio',
          cantidad: { $sum: 1 },
          ingresos: { $sum: '$precio' },
        },
      },
      { $sort: { cantidad: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'servicios',
          localField: '_id',
          foreignField: '_id',
          as: 'servicioInfo',
        },
      },
      { $unwind: '$servicioInfo' },
    ]);

    // 6. Formatear y Devolver Respuesta
    // 🎯 OBJETIVO MENSUAL
    const objetivoMensual = barbero.objetivoMensual || 0;
    const porcentajeObjetivo =
      objetivoMensual > 0
        ? Math.round((ingresosMensuales / objetivoMensual) * 100)
        : 0;

    // Formatear evolución de ingresos por día
    const evolucionDiariaFmt = evolucionIngresosPorDia.map(item => ({
      fecha: `${item._id.anio}-${String(item._id.mes).padStart(2, '0')}-${String(item._id.dia).padStart(2, '0')}`,
      dia: item._id.dia,
      ingresos: item.ingresos,
      turnos: item.turnos,
    }));
    
    // Formatear evolución de ingresos por semana
    const evolucionSemanalFmt = evolucionIngresosPorSemana.map(item => ({
      semana: item._id.semana,
      anio: item._id.anio,
      ingresos: item.ingresos,
      turnos: item.turnos,
    }));
    
    // Formatear servicios más realizados
    const serviciosMasRealizadosFmt = serviciosMasRealizados.map(item => ({
      servicio: {
        id: item.servicioInfo._id,
        nombre: item.servicioInfo.nombre,
        precio: item.servicioInfo.precio,
      },
      cantidad: item.cantidad,
      ingresos: item.ingresos,
    }));

    return {
      barbero: {
        id: barbero._id,
        nombre: `${barbero.nombre} ${barbero.apellido}`,
        objetivoMensual,
      },
      periodo: {
        mes: mes || new Date().getMonth() + 1,
        anio: anio || new Date().getFullYear(),
      },
      indicadoresPrincipales: {
        ingresosMensuales,
        ingresosSemanales,
        turnosCompletados,
        objetivoMensual,
        porcentajeObjetivo,
        // Calcula cuánto falta o sobra para la meta
        diferenciaMeta: ingresosMensuales - objetivoMensual,
      },
      evolucionIngresos: {
        porDia: evolucionDiariaFmt,
        porSemana: evolucionSemanalFmt,
      },
      serviciosMasRealizados: serviciosMasRealizadosFmt,
    };
  } catch (error) {
    throw new Error(
      `Error al obtener estadísticas del barbero: ${error.message}`
    );
  }
};

