/**
 * generales - Estadísticas
 * Módulo extraído de estadisticasService.js para mejor organización
 */

// Importa los modelos de la base de datos
import Turno from '../../models/Turno.js';
import Barbero from '../../models/Barbero.js';
import Servicio from '../../models/Servicio.js';
import Cliente from '../../models/Cliente.js';


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

