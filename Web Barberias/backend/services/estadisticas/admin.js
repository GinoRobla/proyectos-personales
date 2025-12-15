/**
 * admin - Estadísticas
 * Módulo extraído de estadisticasService.js para mejor organización
 */

// Importa los modelos de la base de datos
import Turno from '../../models/Turno.js';
import Barbero from '../../models/Barbero.js';
import Servicio from '../../models/Servicio.js';
import Cliente from '../../models/Cliente.js';
import { obtenerQueryRangoMes } from './helpers.js';


export const obtenerEstadisticasAdmin = async (filtros = {}) => {
  try {
    const { mes, anio } = filtros;

    // 1. Obtiene el rango de fechas del mes (usa el helper)
    const queryMes = obtenerQueryRangoMes(mes, anio);

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
    const queryMesAnterior = obtenerQueryRangoMes(mesAnterior, anioMesAnterior);

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
/**
 * OBTENER ESTADÍSTICAS DEL DÍA (Para reporte diario del admin)
 */

export const obtenerEstadisticasDiarias = async (fecha = null) => {
  try {
    // 1. Definir la fecha (usa la fecha proporcionada o la de hoy)
    const fechaObjetivo = fecha ? new Date(fecha) : new Date();

    // 2. Crear el rango de fechas para el día (00:00 a 23:59)
    const inicioDia = new Date(fechaObjetivo);
    inicioDia.setUTCHours(0, 0, 0, 0);

    const finDia = new Date(fechaObjetivo);
    finDia.setUTCHours(23, 59, 59, 999);

    const query = {
      fecha: {
        $gte: inicioDia,
        $lte: finDia,
      },
    };

    // 3. Contar turnos completados y cancelados
    const turnosCompletados = await Turno.countDocuments({
      ...query,
      estado: 'completado',
    });

    const turnosCancelados = await Turno.countDocuments({
      ...query,
      estado: 'cancelado',
    });

    // 4. Calcular total generado por la barbería (solo completados)
    const totalGenerado = await Turno.aggregate([
      { $match: { ...query, estado: 'completado' } },
      { $group: { _id: null, total: { $sum: '$precio' } } },
    ]);

    // 5. Calcular generado por cada barbero
    const porBarbero = await Turno.aggregate([
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
          generado: { $sum: '$precio' },
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
      { $sort: { generado: -1 } },
    ]);

    // 6. Formatear resultados
    const porBarberoFormateado = porBarbero.map((item) => ({
      id: item.barberoInfo._id,
      nombre: `${item.barberoInfo.nombre} ${item.barberoInfo.apellido}`,
      generado: item.generado,
      turnos: item.turnos,
    }));

    return {
      fecha: fechaObjetivo.toISOString().split('T')[0],
      turnosCompletados,
      turnosCancelados,
      totalGenerado: totalGenerado[0]?.total || 0,
      porBarbero: porBarberoFormateado,
    };
  } catch (error) {
    throw new Error(`Error al obtener estadísticas diarias: ${error.message}`);
  }
};

/**
 * OBTENER ESTADÍSTICAS DEL BARBERO AUTENTICADO (Panel del Barbero)
 */

