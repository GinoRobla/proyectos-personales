/**
 * barberos - Estadísticas
 * Módulo extraído de estadisticasService.js para mejor organización
 */

// Importa los modelos de la base de datos
import Turno from '../../models/Turno.js';
import Barbero from '../../models/Barbero.js';
import Servicio from '../../models/Servicio.js';
import Cliente from '../../models/Cliente.js';
import { obtenerQueryRangoMes } from './helpers.js';


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

export const obtenerEstadisticasBarbero = async (barberoId, filtros = {}) => {
  try {
    const { mes, anio } = filtros;

    // 1. Verificar que el barbero existe
    const barbero = await Barbero.findById(barberoId);
    if (!barbero) {
      throw new Error('Barbero no encontrado');
    }

    // 2. Obtener rango del mes actual (usando el helper)
    const rangoMes = obtenerQueryRangoMes(mes, anio);
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
    const diaSemana = hoy.getUTCDay() === 0 ? 7 : hoy.getUTCDay();

    // Va al inicio del Lunes de esta semana
    const primerDiaSemana = new Date(hoy);
    primerDiaSemana.setUTCDate(hoy.getUTCDate() - diaSemana + 1);
    primerDiaSemana.setUTCHours(0, 0, 0, 0);

    // Va al final del Domingo de esta semana
    const ultimoDiaSemana = new Date(primerDiaSemana);
    ultimoDiaSemana.setUTCDate(primerDiaSemana.getUTCDate() + 6);
    ultimoDiaSemana.setUTCHours(23, 59, 59, 999);

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
      serviciosMasRealizados: serviciosMasRealizadosFmt,
    };
  } catch (error) {
    throw new Error(
      `Error al obtener estadísticas del barbero: ${error.message}`
    );
  }
};

