import Turno from '../models/Turno.js';
import Barbero from '../models/Barbero.js';
import Servicio from '../models/Servicio.js';
import Cliente from '../models/Cliente.js';

/**
 * Servicio de Estadísticas
 * Contiene toda la lógica de negocio para reportes y estadísticas
 */

/**
 * Obtener estadísticas generales del negocio
 */
export const obtenerEstadisticasGenerales = async (filtros = {}) => {
  try {
    const { desde, hasta } = filtros;

    const query = {};

    if (desde && hasta) {
      query.fecha = {
        $gte: new Date(desde),
        $lte: new Date(hasta),
      };
    }

    // Total de turnos
    const totalTurnos = await Turno.countDocuments(query);

    // Turnos por estado
    const turnosPorEstado = await Turno.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$estado',
          cantidad: { $sum: 1 },
        },
      },
    ]);

    // Ingresos totales (solo completados)
    const ingresosTotales = await Turno.aggregate([
      {
        $match: {
          ...query,
          estado: 'completado',

        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$precio' },
        },
      },
    ]);

    // Ingresos pendientes
    const ingresosPendientes = await Turno.aggregate([
      {
        $match: {
          ...query,
          estado: 'completado',

        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$precio' },
        },
      },
    ]);

    // Servicios más solicitados
    const serviciosMasSolicitados = await Turno.aggregate([
      { $match: query },
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

    // Total de clientes únicos
    const totalClientes = await Cliente.countDocuments({ activo: true });

    // Barberos activos
    const totalBarberos = await Barbero.countDocuments({ activo: true });

    return {
      totalTurnos,
      turnosPorEstado,
      ingresosTotales: ingresosTotales[0]?.total || 0,
      ingresosPendientes: ingresosPendientes[0]?.total || 0,
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

    // Verificar que el barbero existe
    const barbero = await Barbero.findById(barberoId);
    if (!barbero) {
      throw new Error('Barbero no encontrado');
    }

    const query = { barbero: barberoId };

    if (desde && hasta) {
      query.fecha = {
        $gte: new Date(desde),
        $lte: new Date(hasta),
      };
    }

    // Total de turnos
    const totalTurnos = await Turno.countDocuments(query);

    // Turnos por estado
    const turnosPorEstado = await Turno.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$estado',
          cantidad: { $sum: 1 },
        },
      },
    ]);

    // Ingresos generados
    const ingresosGenerados = await Turno.aggregate([
      {
        $match: {
          ...query,
          estado: 'completado',

        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$precio' },
        },
      },
    ]);

    // Servicios más realizados
    const serviciosMasRealizados = await Turno.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$servicio',
          cantidad: { $sum: 1 },
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

    // Promedio de ingresos por turno
    const promedioIngresos = await Turno.aggregate([
      {
        $match: {
          ...query,
          estado: 'completado',
        },
      },
      {
        $group: {
          _id: null,
          promedio: { $avg: '$precio' },
        },
      },
    ]);

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

    const query = {};

    if (desde && hasta) {
      query.fecha = {
        $gte: new Date(desde),
        $lte: new Date(hasta),
      };
    }

    const estadisticasPorBarbero = await Turno.aggregate([
      { $match: { ...query, barbero: { $ne: null } } },
      {
        $group: {
          _id: '$barbero',
          totalTurnos: { $sum: 1 },
          turnosCompletados: {
            $sum: { $cond: [{ $eq: ['$estado', 'completado'] }, 1, 0] },
          },
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
      {
        $lookup: {
          from: 'barberos',
          localField: '_id',
          foreignField: '_id',
          as: 'barberoInfo',
        },
      },
      { $unwind: '$barberoInfo' },
      { $sort: { totalTurnos: -1 } },
    ]);

    return estadisticasPorBarbero;
  } catch (error) {
    throw new Error(`Error al obtener comparativa de barberos: ${error.message}`);
  }
};

/**
 * Obtener turnos agrupados por período (día/semana/mes)
 */
export const obtenerTurnosPorPeriodo = async (filtros = {}) => {
  try {
    const { desde, hasta, periodo = 'dia' } = filtros;

    if (!desde || !hasta) {
      throw new Error('Las fechas desde y hasta son requeridas');
    }

    let groupBy;
    switch (periodo) {
      case 'mes':
        groupBy = {
          year: { $year: '$fecha' },
          month: { $month: '$fecha' },
        };
        break;
      case 'semana':
        groupBy = {
          year: { $year: '$fecha' },
          week: { $week: '$fecha' },
        };
        break;
      case 'dia':
      default:
        groupBy = {
          year: { $year: '$fecha' },
          month: { $month: '$fecha' },
          day: { $dayOfMonth: '$fecha' },
        };
        break;
    }

    const turnosPorPeriodo = await Turno.aggregate([
      {
        $match: {
          fecha: {
            $gte: new Date(desde),
            $lte: new Date(hasta),
          },
        },
      },
      {
        $group: {
          _id: groupBy,
          totalTurnos: { $sum: 1 },
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
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } },
    ]);

    return turnosPorPeriodo;
  } catch (error) {
    throw new Error(`Error al obtener turnos por período: ${error.message}`);
  }
};

/**
 * Obtener estadísticas específicas para el panel del admin
 */
export const obtenerEstadisticasAdmin = async (filtros = {}) => {
  try {
    const { mes, anio } = filtros;

    // Si no se proporciona mes/año, usar el mes actual
    const fecha = new Date();
    const mesActual = mes || fecha.getMonth() + 1;
    const anioActual = anio || fecha.getFullYear();

    // Calcular el primer y último día del mes en UTC
    const primerDia = new Date(Date.UTC(anioActual, mesActual - 1, 1, 0, 0, 0));
    const ultimoDia = new Date(Date.UTC(anioActual, mesActual, 0, 23, 59, 59));

    const query = {
      fecha: {
        $gte: primerDia,
        $lte: ultimoDia,
      },
    };

    // 💵 Ingresos totales del mes (solo completados)
    const ingresosTotales = await Turno.aggregate([
      {
        $match: {
          ...query,
          estado: 'completado',

        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$precio' },
        },
      },
    ]);

    // ✂️ Turnos totales del mes (completados + cancelados)
    const turnosTotales = await Turno.countDocuments({
      ...query,
      estado: { $in: ['completado', 'cancelado'] },
    });

    // 🧍‍♂️ Clientes atendidos únicos del mes
    const clientesAtendidos = await Turno.aggregate([
      {
        $match: {
          ...query,
          estado: 'completado',
        },
      },
      {
        $group: {
          _id: '$cliente',
        },
      },
      {
        $count: 'total',
      },
    ]);

    // 🧔 Barbero más solicitado (solo turnos completados)
    const barberoMasSolicitado = await Turno.aggregate([
      {
        $match: {
          ...query,
          estado: 'completado',
          barbero: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$barbero',
          totalTurnos: { $sum: 1 },
        },
      },
      {
        $sort: { totalTurnos: -1 },
      },
      {
        $limit: 1,
      },
      {
        $lookup: {
          from: 'barberos',
          localField: '_id',
          foreignField: '_id',
          as: 'barberoInfo',
        },
      },
      {
        $unwind: '$barberoInfo',
      },
    ]);

    // 💈 Servicio más popular (solo turnos completados)
    const servicioMasPopular = await Turno.aggregate([
      {
        $match: {
          ...query,
          estado: 'completado',
        },
      },
      {
        $group: {
          _id: '$servicio',
          totalReservas: { $sum: 1 },
        },
      },
      {
        $sort: { totalReservas: -1 },
      },
      {
        $limit: 1,
      },
      {
        $lookup: {
          from: 'servicios',
          localField: '_id',
          foreignField: '_id',
          as: 'servicioInfo',
        },
      },
      {
        $unwind: '$servicioInfo',
      },
    ]);

    // 💰 Ingresos por barbero (para gráfico de barras)
    const ingresosPorBarbero = await Turno.aggregate([
      {
        $match: {
          ...query,
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
      {
        $unwind: '$barberoInfo',
      },
      {
        $sort: { ingresos: -1 },
      },
    ]);

    // 💇 Turnos por servicio (solo turnos completados)
    const turnosPorServicio = await Turno.aggregate([
      {
        $match: {
          ...query,
          estado: 'completado',
        },
      },
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
      {
        $unwind: '$servicioInfo',
      },
      {
        $sort: { totalTurnos: -1 },
      },
    ]);

    // 👥 Top clientes frecuentes (los que más turnos tienen)
    const topClientes = await Turno.aggregate([
      {
        $match: {
          ...query,
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
      {
        $sort: { totalTurnos: -1 },
      },
      {
        $limit: 3,
      },
      {
        $lookup: {
          from: 'clientes',
          localField: '_id',
          foreignField: '_id',
          as: 'clienteInfo',
        },
      },
      {
        $unwind: '$clienteInfo',
      },
    ]);

    // 📈 Comparativa mes a mes (mes actual vs mes anterior)
    const mesAnterior = mesActual === 1 ? 12 : mesActual - 1;
    const anioMesAnterior = mesActual === 1 ? anioActual - 1 : anioActual;

    const primerDiaMesAnterior = new Date(Date.UTC(anioMesAnterior, mesAnterior - 1, 1, 0, 0, 0));
    const ultimoDiaMesAnterior = new Date(Date.UTC(anioMesAnterior, mesAnterior, 0, 23, 59, 59));

    const queryMesAnterior = {
      fecha: {
        $gte: primerDiaMesAnterior,
        $lte: ultimoDiaMesAnterior,
      },
    };

    const ingresosMesAnterior = await Turno.aggregate([
      {
        $match: {
          ...queryMesAnterior,
          estado: 'completado',

        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$precio' },
        },
      },
    ]);

    const turnosMesAnterior = await Turno.countDocuments({
      ...queryMesAnterior,
      estado: { $in: ['completado', 'cancelado'] },
    });

    const ingresosMesAnteriorTotal = ingresosMesAnterior[0]?.total || 0;
    const cambioIngresos = ingresosTotales[0]?.total
      ? ((ingresosTotales[0].total - ingresosMesAnteriorTotal) / ingresosMesAnteriorTotal) * 100
      : 0;
    const cambioTurnos = turnosMesAnterior
      ? ((turnosTotales - turnosMesAnterior) / turnosMesAnterior) * 100
      : 0;

    // 📅 Días más y menos ocupados del mes (solo turnos completados)
    const turnosPorDia = await Turno.aggregate([
      {
        $match: {
          ...query,
          estado: 'completado',
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: '$fecha' }, // 1=Domingo, 2=Lunes, ..., 7=Sábado
          totalTurnos: { $sum: 1 },
        },
      },
      {
        $sort: { totalTurnos: -1 },
      },
    ]);

    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const turnosPorDiaFormateado = turnosPorDia.map(item => ({
      dia: diasSemana[item._id - 1],
      diaSemana: item._id,
      totalTurnos: item.totalTurnos,
    }));

    const diaMasOcupado = turnosPorDiaFormateado[0] || null;
    const diaMenosOcupado = turnosPorDiaFormateado[turnosPorDiaFormateado.length - 1] || null;

    return {
      periodo: {
        mes: mesActual,
        anio: anioActual,
      },
      indicadoresPrincipales: {
        ingresosTotales: ingresosTotales[0]?.total || 0,
        turnosTotales,
        clientesAtendidos: clientesAtendidos[0]?.total || 0,
        barberoMasSolicitado: barberoMasSolicitado[0] ? {
          ...barberoMasSolicitado[0],
          barberoInfo: {
            ...barberoMasSolicitado[0].barberoInfo,
            nombreCompleto: `${barberoMasSolicitado[0].barberoInfo.nombre} ${barberoMasSolicitado[0].barberoInfo.apellido}`,
          },
        } : null,
        servicioMasPopular: servicioMasPopular[0] || null,
      },
      estadisticasAdicionales: {
        ingresosPorBarbero: ingresosPorBarbero.map(item => ({
          barbero: {
            id: item.barberoInfo._id,
            nombre: `${item.barberoInfo.nombre} ${item.barberoInfo.apellido}`,
          },
          ingresos: item.ingresos,
          turnos: item.turnos,
        })),
        turnosPorServicio: turnosPorServicio.map(item => ({
          servicio: {
            id: item.servicioInfo._id,
            nombre: item.servicioInfo.nombre,
            precio: item.servicioInfo.precio,
          },
          totalTurnos: item.totalTurnos,
          ingresos: item.ingresos,
          rentabilidad: item.ingresos / item.totalTurnos,
        })),
        topClientes: topClientes.map(item => ({
          cliente: {
            id: item.clienteInfo._id,
            nombre: item.clienteInfo.nombre || 'Cliente',
            apellido: item.clienteInfo.apellido || '',
            email: item.clienteInfo.email,
          },
          totalTurnos: item.totalTurnos,
          totalGastado: item.totalGastado,
        })),
        comparativaMesAnterior: {
          ingresosMesActual: ingresosTotales[0]?.total || 0,
          ingresosMesAnterior: ingresosMesAnteriorTotal,
          cambioIngresos: Math.round(cambioIngresos * 10) / 10,
          turnosMesActual: turnosTotales,
          turnosMesAnterior,
          cambioTurnos: Math.round(cambioTurnos * 10) / 10,
        },
        diasOcupacion: {
          diaMasOcupado,
          diaMenosOcupado,
          todosPorDia: turnosPorDiaFormateado,
        },
      },
    };
  } catch (error) {
    throw new Error(`Error al obtener estadísticas del admin: ${error.message}`);
  }
};

/**
 * OBTENER ESTADÍSTICAS DEL BARBERO AUTENTICADO
 *
 * Obtiene estadísticas personales para el panel del barbero.
 * Muestra: ingresos, turnos completados, evolución de ingresos y objetivo mensual.
 *
 * @param {string} barberoId - ID del barbero
 * @param {object} filtros - Opciones: mes, anio, periodo ('semana', 'mes')
 * @returns {object} - Estadísticas del barbero
 */
export const obtenerEstadisticasBarbero = async (barberoId, filtros = {}) => {
  try {
    const { mes, anio, periodo = 'mes' } = filtros;

    // Verificar que el barbero existe
    const barbero = await Barbero.findById(barberoId);
    if (!barbero) {
      throw new Error('Barbero no encontrado');
    }

    // Si no se proporciona mes/año, usar el mes actual
    const fecha = new Date();
    const mesActual = mes || fecha.getMonth() + 1;
    const anioActual = anio || fecha.getFullYear();

    // Calcular el primer y último día del mes en UTC
    const primerDiaMes = new Date(Date.UTC(anioActual, mesActual - 1, 1, 0, 0, 0));
    const ultimoDiaMes = new Date(Date.UTC(anioActual, mesActual, 0, 23, 59, 59));

    // Query para el mes actual
    const queryMes = {
      barbero: barberoId,
      fecha: {
        $gte: primerDiaMes,
        $lte: ultimoDiaMes,
      },
    };

    // 💵 INGRESOS GENERADOS DEL MES (solo completados)
    const ingresosMes = await Turno.aggregate([
      {
        $match: {
          ...queryMes,
          estado: 'completado',

        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$precio' },
        },
      },
    ]);

    const ingresosMensuales = ingresosMes[0]?.total || 0;

    // ✂️ TURNOS COMPLETADOS DEL MES
    const turnosCompletados = await Turno.countDocuments({
      ...queryMes,
      estado: 'completado',
    });

    // 💵 INGRESOS DE LA SEMANA ACTUAL
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const primerDiaSemana = new Date(hoy);
    primerDiaSemana.setDate(hoy.getDate() - diaSemana + 1); // Lunes
    primerDiaSemana.setHours(0, 0, 0, 0);

    const ultimoDiaSemana = new Date(primerDiaSemana);
    ultimoDiaSemana.setDate(primerDiaSemana.getDate() + 6); // Domingo
    ultimoDiaSemana.setHours(23, 59, 59, 999);

    const querySemana = {
      barbero: barberoId,
      fecha: {
        $gte: primerDiaSemana,
        $lte: ultimoDiaSemana,
      },
    };

    const ingresosSemana = await Turno.aggregate([
      {
        $match: {
          ...querySemana,
          estado: 'completado',

        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$precio' },
        },
      },
    ]);

    const ingresosSemanales = ingresosSemana[0]?.total || 0;

    // 💰 EVOLUCIÓN DE INGRESOS (por día del mes)
    const evolucionIngresosPorDia = await Turno.aggregate([
      {
        $match: {
          ...queryMes,
          estado: 'completado',

        },
      },
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
      {
        $sort: { '_id.dia': 1 },
      },
    ]);

    // Formatear evolución de ingresos
    const evolucionIngresos = evolucionIngresosPorDia.map(item => ({
      fecha: `${item._id.anio}-${String(item._id.mes).padStart(2, '0')}-${String(item._id.dia).padStart(2, '0')}`,
      dia: item._id.dia,
      ingresos: item.ingresos,
      turnos: item.turnos,
    }));

    // 💰 EVOLUCIÓN DE INGRESOS POR SEMANA (últimas 4 semanas)
    const hace4Semanas = new Date(hoy);
    hace4Semanas.setDate(hoy.getDate() - 28);
    hace4Semanas.setHours(0, 0, 0, 0);

    const queryUltimas4Semanas = {
      barbero: barberoId,
      fecha: {
        $gte: hace4Semanas,
        $lte: hoy,
      },
    };

    const evolucionIngresosPorSemana = await Turno.aggregate([
      {
        $match: {
          ...queryUltimas4Semanas,
          estado: 'completado',

        },
      },
      {
        $group: {
          _id: {
            semana: { $week: '$fecha' },
            anio: { $year: '$fecha' },
          },
          ingresos: { $sum: '$precio' },
          turnos: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.anio': 1, '_id.semana': 1 },
      },
    ]);

    const evolucionSemanal = evolucionIngresosPorSemana.map(item => ({
      semana: item._id.semana,
      anio: item._id.anio,
      ingresos: item.ingresos,
      turnos: item.turnos,
    }));

    // 🎯 OBJETIVO MENSUAL
    const objetivoMensual = barbero.objetivoMensual || 0;
    const porcentajeObjetivo = objetivoMensual > 0
      ? Math.round((ingresosMensuales / objetivoMensual) * 100)
      : 0;

    // SERVICIOS MÁS REALIZADOS EN EL MES
    const serviciosMasRealizados = await Turno.aggregate([
      {
        $match: {
          ...queryMes,
          estado: 'completado',
        },
      },
      {
        $group: {
          _id: '$servicio',
          cantidad: { $sum: 1 },
          ingresos: { $sum: '$precio' },
        },
      },
      {
        $sort: { cantidad: -1 },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: 'servicios',
          localField: '_id',
          foreignField: '_id',
          as: 'servicioInfo',
        },
      },
      {
        $unwind: '$servicioInfo',
      },
    ]);

    return {
      barbero: {
        id: barbero._id,
        nombre: `${barbero.nombre} ${barbero.apellido}`,
        objetivoMensual,
      },
      periodo: {
        mes: mesActual,
        anio: anioActual,
      },
      indicadoresPrincipales: {
        ingresosMensuales,
        ingresosSemanales,
        turnosCompletados,
        objetivoMensual,
        porcentajeObjetivo,
        diferenciaMeta: ingresosMensuales - objetivoMensual,
      },
      evolucionIngresos: {
        porDia: evolucionIngresos,
        porSemana: evolucionSemanal,
      },
      serviciosMasRealizados: serviciosMasRealizados.map(item => ({
        servicio: {
          id: item.servicioInfo._id,
          nombre: item.servicioInfo.nombre,
          precio: item.servicioInfo.precio,
        },
        cantidad: item.cantidad,
        ingresos: item.ingresos,
      })),
    };
  } catch (error) {
    throw new Error(`Error al obtener estadísticas del barbero: ${error.message}`);
  }
};

export default {
  obtenerEstadisticasGenerales,
  obtenerEstadisticasPorBarbero,
  obtenerComparativaBarberos,
  obtenerTurnosPorPeriodo,
  obtenerEstadisticasAdmin,
  obtenerEstadisticasBarbero,
};
