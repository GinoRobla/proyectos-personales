import Turno from '../models/Turno.js';
import Cliente from '../models/Cliente.js';
import Barbero from '../models/Barbero.js';
import Servicio from '../models/Servicio.js';

/**
 * -------------------------------------------------------------------
 * FUNCIÓN HELPER (USO INTERNO)
 * -------------------------------------------------------------------
 */

/**
 * (Helper) Crea un rango de fechas UTC para un día completo (00:00 a 23:59)
 * @param {string} fechaString - Fecha en formato YYYY-MM-DD
 * @returns {object} - Objeto de query de Mongoose {$gte, $lte}
 */
const _crearRangoFechaDia = (fechaString) => {
  // Parsea el string (ej: "2025-10-20")
  const [año, mes, dia] = fechaString.split('T')[0].split('-').map(Number);

  // Crea el inicio del día en UTC (ej: 20-10-2025 00:00:00Z)
  const inicioDia = new Date(Date.UTC(año, mes - 1, dia, 0, 0, 0, 0));
  // Crea el fin del día en UTC (ej: 20-10-2025 23:59:59Z)
  const finDia = new Date(Date.UTC(año, mes - 1, dia, 23, 59, 59, 999));

  console.log('[DEBUG _crearRangoFechaDia] Input:', fechaString);
  console.log('[DEBUG _crearRangoFechaDia] Parsed:', { año, mes, dia });
  console.log('[DEBUG _crearRangoFechaDia] Range:', { inicioDia, finDia });

  // Devuelve el objeto de filtro para Mongoose
  return { $gte: inicioDia, $lte: finDia };
};

/**
 * -------------------------------------------------------------------
 * SERVICIOS EXPORTADOS
 * -------------------------------------------------------------------
 */

/**
 * OBTENER TODOS LOS TURNOS
 * Lista turnos con filtros y paginación.
 */
export const obtenerTodos = async (filtros = {}, paginacion = {}) => {
  try {
    const { estado, barberoId, clienteId, fecha, desde, hasta } = filtros;
    const { skip = 0, limite = 10 } = paginacion;

    // 1. Construir la consulta de búsqueda
    const query = {};

    // Filtro por estado (puede ser uno o varios: "reservado,completado")
    if (estado) {
      if (estado.includes(',')) {
        query.estado = { $in: estado.split(',') }; // $in: ["reservado", "completado"]
      } else {
        query.estado = estado;
      }
    }

    if (barberoId) query.barbero = barberoId;
    if (clienteId) query.cliente = clienteId;

    // Filtro por fecha (usa el helper para buscar en todo el día UTC)
    if (fecha) {
      query.fecha = _crearRangoFechaDia(fecha);
    } else if (desde && hasta) {
      // Filtro por rango de fechas
      query.fecha = {
        $gte: new Date(desde),
        $lte: new Date(hasta),
      };
    }

    console.log('[DEBUG obtenerTodos] Filtros recibidos:', filtros);
    console.log('[DEBUG obtenerTodos] Query construido:', JSON.stringify(query, null, 2));

    // 2. Contar total de documentos (para la paginación)
    const totalTurnos = await Turno.countDocuments(query);

    // 3. Obtener TODOS los turnos sin paginación primero (para ordenar correctamente)
    const todosTurnos = await Turno.find(query)
      .populate('cliente') // Trae los datos del Cliente
      .populate('barbero') // Trae los datos del Barbero
      .populate('servicio'); // Trae los datos del Servicio

    // 4. Ordenar en memoria: reservado > completado > cancelado, luego por fecha desc, luego por hora desc
    const ordenEstado = { 'reservado': 1, 'completado': 2, 'cancelado': 3 };
    todosTurnos.sort((a, b) => {
      const estadoA = ordenEstado[a.estado] || 999;
      const estadoB = ordenEstado[b.estado] || 999;

      // Primero por estado
      if (estadoA !== estadoB) return estadoA - estadoB;

      // Si tienen el mismo estado, ordenar por fecha descendente (más reciente primero)
      const fechaComp = new Date(b.fecha) - new Date(a.fecha);
      if (fechaComp !== 0) return fechaComp;

      // Si tienen la misma fecha, ordenar por hora descendente
      return b.hora.localeCompare(a.hora);
    });

    // 5. Aplicar paginación DESPUÉS de ordenar
    const turnos = todosTurnos.slice(skip, skip + limite);

    console.log('[DEBUG obtenerTodos] Turnos encontrados:', turnos.length);
    if (turnos.length > 0) {
      console.log('[DEBUG obtenerTodos] Primer turno:', {
        fecha: turnos[0].fecha,
        hora: turnos[0].hora,
        estado: turnos[0].estado
      });
    }

    return {
      turnos,
      total: totalTurnos,
    };
  } catch (error) {
    throw new Error(`Error al obtener turnos: ${error.message}`);
  }
};

/**
 * OBTENER TURNO POR ID
 * Busca un turno por su ID e incluye todos los datos relacionados.
 */
export const obtenerPorId = async (turnoId) => {
  try {
    const turno = await Turno.findById(turnoId)
      .populate('cliente')
      .populate('barbero')
      .populate('servicio');

    if (!turno) {
      throw new Error('Turno no encontrado');
    }

    return turno;
  } catch (error) {
    throw new Error(`Error al obtener turno: ${error.message}`);
  }
};

/**
 * CREAR NUEVO TURNO (RESERVA)
 * Crea una nueva reserva en el sistema.
 */
export const crear = async (datosDeTurno) => {
  try {
    const { clienteData, barberoId, servicioId, fecha, hora, precio, metodoPago, notasCliente } =
      datosDeTurno;

    // 1. Validar campos obligatorios
    if (!clienteData || !servicioId || !fecha || !hora || precio === undefined) {
      throw new Error('Faltan campos obligatorios');
    }

    // 2. Verificar que el servicio exista
    const servicio = await Servicio.findById(servicioId);
    if (!servicio) throw new Error('Servicio no encontrado');

    // [FIX] Parsea la fecha a UTC para la consulta y para guardarla
    const [año, mes, dia] = fecha.split('T')[0].split('-').map(Number);
    const fechaInicioDia = new Date(Date.UTC(año, mes - 1, dia, 0, 0, 0, 0));
    const fechaFinDia = new Date(Date.UTC(año, mes - 1, dia, 23, 59, 59, 999));

    // 3. Asignar barbero (si no se especificó, buscar el más disponible)
    let barberoAsignado = barberoId;

    if (!barberoAsignado) {
      // Buscar todos los barberos activos
      const barberosActivos = await Barbero.find({ activo: true });

      if (barberosActivos.length === 0) {
        throw new Error('No hay barberos disponibles en este momento');
      }

      // Para cada barbero, contar turnos del día y verificar si está ocupado en ese horario
      const barberosConInfo = await Promise.all(
        barberosActivos.map(async (barbero) => {
          // Verificar si tiene turno en ese horario específico
          const tieneOcupado = await Turno.findOne({
            barbero: barbero._id,
            fecha: { $gte: fechaInicioDia, $lte: fechaFinDia },
            hora,
            estado: 'reservado',
          });

          // Contar cuántos turnos tiene ese día
          const cantidadTurnos = await Turno.countDocuments({
            barbero: barbero._id,
            fecha: { $gte: fechaInicioDia, $lte: fechaFinDia },
            estado: 'reservado',
          });

          return {
            id: barbero._id,
            nombre: `${barbero.nombre} ${barbero.apellido}`,
            ocupado: !!tieneOcupado,
            cantidadTurnos,
          };
        })
      );

      // Filtrar solo barberos disponibles en ese horario
      const barberosDisponibles = barberosConInfo.filter((b) => !b.ocupado);

      if (barberosDisponibles.length === 0) {
        throw new Error('No hay barberos disponibles para ese horario');
      }

      // Encontrar el mínimo de turnos
      const minTurnos = Math.min(...barberosDisponibles.map((b) => b.cantidadTurnos));

      // Filtrar barberos que tienen el mínimo de turnos
      const barberosConMenosTurnos = barberosDisponibles.filter(
        (b) => b.cantidadTurnos === minTurnos
      );

      // Si hay empate, elegir uno aleatorio
      const barberoElegido =
        barberosConMenosTurnos[Math.floor(Math.random() * barberosConMenosTurnos.length)];

      barberoAsignado = barberoElegido.id;

      console.log('[DEBUG asignación automática]', {
        barberos: barberosConInfo.map((b) => ({
          nombre: b.nombre,
          turnos: b.cantidadTurnos,
          ocupado: b.ocupado,
        })),
        elegido: barberoElegido.nombre,
        razon: `Menos turnos (${minTurnos})`,
      });
    } else {
      // 4. Verificar disponibilidad del barbero específico
      const barbero = await Barbero.findById(barberoAsignado);
      if (!barbero) throw new Error('Barbero no encontrado');

      // Busca un turno en ese día, a esa hora, con ese barbero
      const turnoYaExiste = await Turno.findOne({
        barbero: barberoAsignado,
        fecha: { $gte: fechaInicioDia, $lte: fechaFinDia },
        hora,
        estado: 'reservado',
      });

      if (turnoYaExiste) {
        throw new Error('El barbero ya tiene un turno asignado en ese horario');
      }
    }

    // 4. [REFACTOR] Buscar o Crear Cliente
    // Usa findOneAndUpdate con 'upsert: true' para crear o actualizar en 1 paso
    const clienteDelTurno = await Cliente.findOneAndUpdate(
      { email: clienteData.email }, // Filtro de búsqueda
      { // Datos a actualizar o crear
        $set: { 
          nombre: clienteData.nombre,
          apellido: clienteData.apellido,
          telefono: clienteData.telefono,
        }
      },
      { 
        new: true, // Devuelve el documento actualizado (o el nuevo)
        upsert: true, // Si no lo encuentra, lo crea
        runValidators: true // Corre las validaciones del modelo Cliente
      }
    );

    // 5. Crear el turno (reservado automáticamente)
    const nuevoTurno = new Turno({
      cliente: clienteDelTurno._id,
      barbero: barberoAsignado, // Siempre tiene un barbero asignado
      servicio: servicioId,
      fecha: fechaInicioDia, // [FIX] Guarda la fecha como UTC a las 00:00
      hora,
      precio,
      metodoPago: metodoPago || 'pendiente',
      notasCliente: notasCliente || '',
      estado: 'reservado',
    });

    console.log('[DEBUG crear] Turno creado con barbero:', barberoAsignado);

    await nuevoTurno.save();

    // 6. Cargar los datos relacionados para la respuesta
    await nuevoTurno.populate(['cliente', 'barbero', 'servicio']);

    return nuevoTurno;
  } catch (error) {
    throw new Error(`Error al crear turno: ${error.message}`);
  }
};

/**
 * ACTUALIZAR TURNO EXISTENTE
 * Modifica la información de un turno (estado, barbero, pago, etc.).
 */
export const actualizar = async (turnoId, datosNuevos) => {
  try {
    const { barberoId, estado, metodoPago, pagado, notasBarbero, fecha, hora, servicioId, precio } = datosNuevos;

    // 1. Buscar el turno
    const turno = await Turno.findById(turnoId);
    if (!turno) {
      throw new Error('Turno no encontrado');
    }

    // 2. Actualizar campos (solo si se proporcionaron)
    if (servicioId) {
      if (!(await Servicio.findById(servicioId))) {
        throw new Error('Servicio no encontrado');
      }
      turno.servicio = servicioId;
    }

    if (precio !== undefined) turno.precio = precio;
    if (hora) turno.hora = hora;

    // [FIX] Si se actualiza la fecha, guardarla también en UTC
    if (fecha) {
      const [año, mes, dia] = fecha.split('T')[0].split('-').map(Number);
      turno.fecha = new Date(Date.UTC(año, mes - 1, dia));
    }

    // Actualizar barbero (permite 'null' para quitarlo)
    if (barberoId !== undefined) {
      if (barberoId === null) {
        turno.barbero = null;
      } else {
        if (!(await Barbero.findById(barberoId))) {
          throw new Error('Barbero no encontrado');
        }
        turno.barbero = barberoId;
      }
    }

    if (estado) turno.estado = estado;
    if (metodoPago) turno.metodoPago = metodoPago;
    if (pagado !== undefined) turno.pagado = pagado;
    if (notasBarbero !== undefined) turno.notasBarbero = notasBarbero;

    // 3. Guardar cambios (esto dispara validaciones del modelo)
    await turno.save();

    // 4. Cargar datos relacionados para la respuesta
    await turno.populate(['cliente', 'barbero', 'servicio']);

    return turno;
  } catch (error) {
    throw new Error(`Error al actualizar turno: ${error.message}`);
  }
};

/**
 * CANCELAR TURNO
 * Marca un turno como 'cancelado' (no lo borra).
 */
export const cancelar = async (turnoId) => {
  try {
    // 1. Buscar el turno
    const turno = await Turno.findById(turnoId);
    if (!turno) {
      throw new Error('Turno no encontrado');
    }

    // 2. Cambiar estado y guardar
    turno.estado = 'cancelado';
    await turno.save();

    // 3. Devolver el turno actualizado con sus datos
    await turno.populate(['cliente', 'barbero', 'servicio']);
    
    return turno;
  } catch (error) {
    throw new Error(`Error al cancelar turno: ${error.message}`);
  }
};

/**
 * VALIDAR DISPONIBILIDAD
 * Verifica si un slot (fecha, hora, barbero) está libre.
 */
export const validarDisponibilidad = async (fecha, hora, barberoId = null) => {
  try {
    // 1. [FIX] Busca turnos ocupados usando el rango UTC del día
    const rangoDia = _crearRangoFechaDia(fecha);
    
    const query = {
      fecha: rangoDia,
      hora,
      estado: 'reservado',
    };

    if (barberoId) {
      query.barbero = barberoId;
    }

    // 2. Busca si existe un turno
    const turnoYaExiste = await Turno.findOne(query);

    // 3. Devuelve true si NO existe (está disponible)
    return !turnoYaExiste;
  } catch (error) {
    throw new Error(`Error al validar disponibilidad: ${error.message}`);
  }
};

export const obtenerDiasDisponibles = () => {
  try {
    const dias = [];
    const hoy = new Date();
    let fecha = new Date(hoy);

    // Asegurarse de que 'hoy' comience a las 00:00 para evitar problemas de zona horaria
    fecha.setHours(0, 0, 0, 0);

    while (dias.length < 14) {
      if (fecha.getDay() !== 0) { // 0 = Domingo
        dias.push(new Date(fecha));
      }
      fecha.setDate(fecha.getDate() + 1);
    }
    return dias;
  } catch (error) {
    throw new Error(`Error al obtener días disponibles: ${error.message}`);
  }
};

export const obtenerHorariosDisponibles = async (fecha, barberoId = null) => {
  try {
    if (!fecha) {
      throw new Error('La fecha es requerida');
    }

    // Parsear la fecha una sola vez (usar fecha local)
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const fechaSeleccionadaLocal = new Date(anio, mes - 1, dia);
    const diaSemana = fechaSeleccionadaLocal.getDay(); // 0=Domingo, 6=Sábado

    // Lunes a Viernes: 9:00 a 20:00 (último turno 19:15 para terminar a 20:00)
    const horariosLunesViernes = [
      '09:00', '09:45', '10:30', '11:15', '12:00', '12:45',
      '13:30', '14:15', '15:00', '15:45', '16:30', '17:15',
      '18:00', '18:45', '19:15',
    ];

    // Sábados: 8:00 a 18:00 (último turno 17:00 para terminar a 18:00)
    const horariosSabado = [
      '08:00', '08:45', '09:30', '10:15', '11:00', '11:45',
      '12:30', '13:15', '14:00', '14:45', '15:30', '16:15',
      '17:00',
    ];

    const horariosBase = diaSemana === 6 ? horariosSabado : horariosLunesViernes;

    console.log(`[DEBUG] Fecha: ${fecha}, Día de semana: ${diaSemana} (${diaSemana === 6 ? 'SÁBADO' : 'Lun-Vie'}), Horarios base: ${horariosBase.length}`);

    const rangoDia = _crearRangoFechaDia(fecha);
    const queryOcupados = { fecha: rangoDia, estado: 'reservado' };

    let horariosFiltrados = [...horariosBase];

    // Filtrar horarios pasados si la fecha es hoy
    const ahora = new Date();

    // Comparar fechas en zona local (solo día, mes y año)
    const hoyLocal = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const esMismoDia = fechaSeleccionadaLocal.getTime() === hoyLocal.getTime();

    if (esMismoDia) {
      // Usar hora LOCAL para filtrar horarios pasados
      const horaActual = ahora.getHours();
      const minutoActual = ahora.getMinutes();

      console.log(`[DEBUG] Es hoy! Hora actual: ${horaActual}:${minutoActual}`);

      horariosFiltrados = horariosBase.filter(hora => {
        const [horaNum, minutoNum] = hora.split(':').map(Number);
        // Solo permitir horarios futuros (no iguales, solo mayores)
        if (horaNum < horaActual) return false;
        if (horaNum === horaActual && minutoNum <= minutoActual) return false;
        return true;
      });

      console.log(`[DEBUG] Horarios después de filtrar pasados: ${horariosFiltrados.length}`);
    }

    // La lógica de disponibilidad sigue igual, pero parte de `horariosFiltrados`
    if (barberoId) {
      queryOcupados.barbero = barberoId;
      const turnosOcupados = await Turno.find(queryOcupados);
      const horasOcupadas = new Set(turnosOcupados.map((turno) => turno.hora));
      const resultado = horariosFiltrados.filter((h) => !horasOcupadas.has(h));
      console.log(`[DEBUG] Horarios disponibles finales (con barbero): ${resultado.length}`);
      return resultado;
    } else {
      const barberosActivos = await Barbero.countDocuments({ activo: true });
      console.log(`[DEBUG] Barberos activos: ${barberosActivos}`);

      if (barberosActivos === 0) {
        console.log('[DEBUG] No hay barberos activos, retornando array vacío');
        return [];
      }

      const turnosOcupados = await Turno.find(queryOcupados);
      console.log(`[DEBUG] Turnos ocupados encontrados: ${turnosOcupados.length}`);

      const conteoPorHora = {};
      turnosOcupados.forEach((turno) => {
        if (turno.barbero) {
          conteoPorHora[turno.hora] = (conteoPorHora[turno.hora] || 0) + 1;
        }
      });

      const resultado = horariosFiltrados.filter((horario) => {
        const ocupados = conteoPorHora[horario] || 0;
        return ocupados < barberosActivos;
      });

      console.log(`[DEBUG] Horarios disponibles finales (sin barbero específico): ${resultado.length}`);
      return resultado;
    }
  } catch (error) {
    throw new Error(`Error al obtener horarios disponibles: ${error.message}`);
  }
};

const _verificarConflicto = (turnoNuevo, turnosExistentes) => {
  if (!turnoNuevo?.hora || !turnoNuevo?.servicio) return false;
  
  const [hN, mN] = turnoNuevo.hora.split(':').map(Number);
  const inicioN = hN * 60 + mN;
  // Usamos 45 min como duración base si el servicio no la tiene (aunque debería)
  const duracionN = turnoNuevo.servicio.duracion || 45; 
  const finN = inicioN + duracionN;

  for (const turnoE of turnosExistentes) {
    if (!turnoE?.hora || !turnoE?.servicio) continue;
    const [hE, mE] = turnoE.hora.split(':').map(Number);
    const inicioE = hE * 60 + mE;
    const duracionE = turnoE.servicio.duracion || 45;
    const finE = inicioE + duracionE;

    // Lógica de superposición
    if (inicioN < finE && finN > inicioE) {
      return true; // Hay conflicto
    }
  }
  return false; // Sin conflicto
};

export const obtenerDisponibilidadParaTurnos = async (idsTurnos) => {
  try {
    if (!idsTurnos || idsTurnos.length === 0) {
      return {};
    }

    // 1. Obtener los turnos a verificar (con cliente y servicio)
    const turnosAVerificar = await Turno.find({ _id: { $in: idsTurnos } })
      .populate('servicio', 'duracion')
      .populate('cliente', 'nombre apellido');

    if (turnosAVerificar.length === 0) {
      return {};
    }

    // 2. Obtener todos los barberos activos
    const barberosActivos = await Barbero.find({ activo: true }, '_id nombre');

    // 3. Obtener todas las fechas únicas de los turnos a verificar
    const fechasUnicas = [...new Set(turnosAVerificar.map(t => t.fecha.toISOString().split('T')[0]))];

    // 4. Obtener TODOS los turnos (con barbero) en esas fechas para verificar conflictos
    const turnosOcupados = await Turno.find({
      fecha: { $in: fechasUnicas.map(f => _crearRangoFechaDia(f)) },
      barbero: { $exists: true },
      estado: 'reservado'
    }).populate('servicio', 'duracion');

    // 5. Procesar la disponibilidad
    const disponibilidadFinal = {};

    for (const turno of turnosAVerificar) {
      const turnoIdStr = turno._id.toString();
      const fechaTurnoStr = turno.fecha.toISOString().split('T')[0];
      disponibilidadFinal[turnoIdStr] = [];

      for (const barbero of barberosActivos) {
        const barberoIdStr = barbero._id.toString();

        // Filtrar los turnos ocupados solo para este barbero y esta fecha
        const turnosDelBarberoEnFecha = turnosOcupados.filter(t =>
          t.barbero.toString() === barberoIdStr &&
          t.fecha.toISOString().split('T')[0] === fechaTurnoStr
        );

        // Verificar conflicto
        const tieneConflicto = _verificarConflicto(turno, turnosDelBarberoEnFecha);
        
        disponibilidadFinal[turnoIdStr].push({
          _id: barbero._id,
          nombre: barbero.nombre,
          isDisponible: !tieneConflicto
        });
      }
    }

    return disponibilidadFinal;

  } catch (error) {
    console.error("Error en obtenerDisponibilidadParaTurnos:", error);
    throw new Error(`Error al verificar disponibilidad: ${error.message}`);
  }
};