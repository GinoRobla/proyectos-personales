/**
 * ============================================================================
 * SERVICIO DE TURNOS (RESERVAS)
 * ============================================================================
 *
 * Este archivo contiene toda la lógica de negocio relacionada con la gestión
 * de turnos y reservas en el sistema de la barbería.
 *
 * QUÉ ES UN TURNO:
 * Un turno es una reserva que hace un cliente para recibir un servicio
 * (corte de cabello, afeitado, etc.) en una fecha y hora específica,
 * opcionalmente con un barbero asignado.
 *
 * RESPONSABILIDADES DE ESTE ARCHIVO:
 * - Crear nuevos turnos (con o sin barbero asignado)
 * - Listar turnos con filtros (por estado, barbero, cliente, fecha)
 * - Obtener detalles de un turno específico
 * - Actualizar información de turnos (estado, barbero, notas, etc.)
 * - Cancelar turnos
 * - Verificar disponibilidad de horarios
 * - Gestionar el envío de emails de confirmación
 *
 * FLUJO TÍPICO DE UN TURNO:
 * 1. Cliente solicita un turno (o admin lo crea)
 * 2. Se verifica disponibilidad del horario y barbero
 * 3. Se crea o encuentra el cliente en la base de datos
 * 4. Se crea el turno con estado 'reservado'
 * 5. Se envían emails de confirmación (cliente, barbero, admin)
 * 6. El día del turno se envían recordatorios
 * 7. Después del servicio, el estado cambia a 'completado'
 * 8. Se marca como pagado cuando se recibe el pago
 */

import Turno from '../models/Turno.js';
import Cliente from '../models/Cliente.js';
import Barbero from '../models/Barbero.js';
import Servicio from '../models/Servicio.js';

// ===== FUNCIONES PRINCIPALES DEL SERVICIO =====

/**
 * OBTENER TODOS LOS TURNOS
 *
 * Lista turnos con opciones de filtrado y paginación.
 *
 * QUÉ HACE:
 * Permite buscar turnos aplicando filtros (estado, barbero, cliente, fecha)
 * y devuelve los resultados paginados.
 *
 * FILTROS SOPORTADOS:
 * - estado: Estado del turno (reservado, completado, cancelado)
 * - barberoId: ID del barbero asignado
 * - clienteId: ID del cliente
 * - fecha: Fecha específica (formato: YYYY-MM-DD)
 * - desde/hasta: Rango de fechas
 *
 * PAGINACIÓN:
 * - skip: Número de registros a saltar
 * - limite: Cantidad máxima de registros a devolver
 *
 * @param {object} filtros - Criterios de búsqueda
 * @param {object} paginacion - Opciones de paginación
 * @returns {object} - Objeto con turnos encontrados y total
 */
export const obtenerTodos = async (filtros = {}, paginacion = {}) => {
  try {
    // Paso 1: Extraer filtros
    const { estado, barberoId, clienteId, fecha, desde, hasta } = filtros;
    const { skip = 0, limite = 10 } = paginacion;

    // Paso 2: Construir la consulta de MongoDB
    const consultaDeBusqueda = {};

    // Filtro por estado (puede ser múltiple separado por comas)
    if (estado) {
      if (estado.includes(',')) {
        // Múltiples estados: "reservado,completado"
        const listaDeEstados = estado.split(',');
        consultaDeBusqueda.estado = { $in: listaDeEstados };
      } else {
        // Un solo estado
        consultaDeBusqueda.estado = estado;
      }
    }

    // Filtro por barbero
    if (barberoId) {
      consultaDeBusqueda.barbero = barberoId;
    }

    // Filtro por cliente
    if (clienteId) {
      consultaDeBusqueda.cliente = clienteId;
    }

    // Filtro por fecha específica
    if (fecha) {
      // Extraer solo la parte de fecha (sin hora) para evitar problemas de zona horaria
      const cadenaDeFecha = fecha.includes('T') ? fecha.split('T')[0] : fecha;
      const [año, mes, dia] = cadenaDeFecha.split('-').map(Number);

      // Crear rango de fechas en UTC para cubrir todo el día
      const inicioDia = new Date(Date.UTC(año, mes - 1, dia, 0, 0, 0, 0));
      const finDia = new Date(Date.UTC(año, mes - 1, dia, 23, 59, 59, 999));

      consultaDeBusqueda.fecha = {
        $gte: inicioDia, // Mayor o igual al inicio del día
        $lte: finDia,    // Menor o igual al fin del día
      };
    } else if (desde && hasta) {
      // Filtro por rango de fechas
      consultaDeBusqueda.fecha = {
        $gte: new Date(desde),
        $lte: new Date(hasta),
      };
    }

    // Paso 3: Contar total de documentos (para la paginación)
    const cantidadTotalDeTurnos = await Turno.countDocuments(consultaDeBusqueda);

    // Paso 4: Obtener turnos con paginación y datos relacionados
    const turnosEncontrados = await Turno.find(consultaDeBusqueda)
      .populate('cliente')   // Cargar información del cliente
      .populate('barbero')   // Cargar información del barbero
      .populate('servicio')  // Cargar información del servicio
      .sort({ fecha: -1, hora: -1 }) // Ordenar por más recientes primero
      .skip(skip)            // Saltar registros (paginación)
      .limit(limite);        // Limitar cantidad de resultados

    // Paso 5: Devolver resultados
    return {
      turnos: turnosEncontrados,
      total: cantidadTotalDeTurnos,
    };
  } catch (error) {
    throw new Error(`Error al obtener turnos: ${error.message}`);
  }
};

/**
 * OBTENER TURNO POR ID
 *
 * Busca y devuelve un turno específico con toda su información relacionada.
 *
 * QUÉ HACE:
 * Busca un turno por su ID único e incluye los datos del cliente,
 * barbero y servicio asociados.
 *
 * @param {string} identificadorDeTurno - ID del turno a buscar
 * @returns {object} - Turno encontrado con datos completos
 * @throws {Error} - Si el turno no existe
 */
export const obtenerPorId = async (identificadorDeTurno) => {
  try {
    // Buscar el turno y cargar los datos relacionados
    const turnoEncontrado = await Turno.findById(identificadorDeTurno)
      .populate('cliente')
      .populate('barbero')
      .populate('servicio');

    // Verificar que el turno exista
    if (!turnoEncontrado) {
      throw new Error('Turno no encontrado');
    }

    return turnoEncontrado;
  } catch (error) {
    throw new Error(`Error al obtener turno: ${error.message}`);
  }
};

/**
 * CREAR NUEVO TURNO (RESERVA)
 *
 * Crea una nueva reserva de turno en el sistema.
 *
 * QUÉ HACE:
 * Valida los datos, verifica disponibilidad, crea o actualiza el cliente,
 * crea el turno y envía emails de confirmación.
 *
 * PROCESO COMPLETO:
 * 1. Validar campos obligatorios
 * 2. Verificar que el servicio exista
 * 3. Verificar que el barbero exista (si se especificó)
 * 4. Verificar disponibilidad del barbero en ese horario
 * 5. Buscar o crear el cliente
 * 6. Crear el turno con estado 'reservado'
 * 7. Enviar emails de confirmación (no bloqueante)
 * 8. Devolver el turno creado
 *
 * @param {object} datosDeTurno - Información del turno a crear
 * @returns {object} - Turno creado con datos completos
 * @throws {Error} - Si faltan datos o no hay disponibilidad
 */
export const crear = async (datosDeTurno) => {
  try {
    // Paso 1: Extraer datos del objeto de entrada
    const { clienteData, barberoId, servicioId, fecha, hora, precio, metodoPago, notasCliente } =
      datosDeTurno;

    // Paso 2: Validar campos obligatorios
    const faltanCampos = !clienteData || !servicioId || !fecha || !hora || precio === undefined;
    if (faltanCampos) {
      throw new Error('Faltan campos obligatorios');
    }

    // Paso 3: Verificar que el servicio exista
    const servicioEncontrado = await Servicio.findById(servicioId);
    if (!servicioEncontrado) {
      throw new Error('Servicio no encontrado');
    }

    // Paso 4: Verificar que el barbero exista (si se especificó uno)
    let barberoAsignado = null;
    if (barberoId) {
      barberoAsignado = await Barbero.findById(barberoId);
      if (!barberoAsignado) {
        throw new Error('Barbero no encontrado');
      }

      // Paso 5: Verificar disponibilidad del barbero en ese horario
      const turnoYaExiste = await Turno.findOne({
        barbero: barberoId,
        fecha: new Date(fecha),
        hora,
        estado: 'reservado', // Solo turnos activos
      });

      if (turnoYaExiste) {
        throw new Error('El barbero ya tiene un turno asignado en ese horario');
      }
    }

    // Paso 6: Buscar o crear cliente
    let clienteDelTurno = await Cliente.findOne({ email: clienteData.email });

    if (!clienteDelTurno) {
      // Cliente nuevo: crear registro
      clienteDelTurno = new Cliente({
        nombre: clienteData.nombre,
        apellido: clienteData.apellido,
        email: clienteData.email,
        telefono: clienteData.telefono,
      });
      await clienteDelTurno.save();
    } else {
      // Cliente existente: actualizar datos (por si cambiaron)
      clienteDelTurno.nombre = clienteData.nombre;
      clienteDelTurno.apellido = clienteData.apellido;
      clienteDelTurno.telefono = clienteData.telefono;
      await clienteDelTurno.save();
    }

    // Paso 7: Crear el turno (reservado automáticamente)
    const nuevoTurno = new Turno({
      cliente: clienteDelTurno._id,
      barbero: barberoId || null, // null si no se especificó barbero
      servicio: servicioId,
      fecha: new Date(fecha),
      hora,
      precio,
      metodoPago: metodoPago || 'pendiente',
      notasCliente: notasCliente || '',
      estado: 'reservado', // Los turnos se reservan automáticamente
    });

    await nuevoTurno.save();

    // Paso 8: Cargar los datos relacionados para la respuesta
    await nuevoTurno.populate('cliente');
    await nuevoTurno.populate('barbero');
    await nuevoTurno.populate('servicio');

    // Paso 9: NO enviar emails de confirmación
    // Los recordatorios se enviarán SOLO por WhatsApp mediante el cron job

    return nuevoTurno;
  } catch (error) {
    throw new Error(`Error al crear turno: ${error.message}`);
  }
};

/**
 * ACTUALIZAR TURNO EXISTENTE
 *
 * Modifica la información de un turno ya creado.
 *
 * QUÉ PUEDE ACTUALIZARSE:
 * - Barbero asignado (puede cambiarse o removerse)
 * - Estado (reservado, completado, cancelado)
 * - Método de pago (efectivo, tarjeta, etc.)
 * - Estado de pago (pagado: true/false)
 * - Notas del barbero
 * - Fecha y hora del turno
 * - Servicio y precio
 *
 * @param {string} identificadorDeTurno - ID del turno a actualizar
 * @param {object} datosNuevos - Nuevos datos del turno
 * @returns {object} - Turno actualizado
 * @throws {Error} - Si el turno no existe o los datos son inválidos
 */
export const actualizar = async (identificadorDeTurno, datosNuevos) => {
  try {
    // Extraer datos a actualizar
    const { barberoId, estado, metodoPago, pagado, notasBarbero, fecha, hora, servicioId, precio } = datosNuevos;

    // Buscar el turno
    const turnoAActualizar = await Turno.findById(identificadorDeTurno);

    if (!turnoAActualizar) {
      throw new Error('Turno no encontrado');
    }

    // Actualizar servicio si se proporcionó
    if (servicioId) {
      const servicioEncontrado = await Servicio.findById(servicioId);
      if (!servicioEncontrado) {
        throw new Error('Servicio no encontrado');
      }
      turnoAActualizar.servicio = servicioId;
    }

    // Actualizar precio si se proporcionó
    if (precio !== undefined) {
      turnoAActualizar.precio = precio;
    }

    // Actualizar fecha si se proporcionó
    if (fecha) {
      turnoAActualizar.fecha = new Date(fecha);
    }

    // Actualizar hora si se proporcionó
    if (hora) {
      turnoAActualizar.hora = hora;
    }

    // Actualizar barbero (permitir null para "sin barbero asignado")
    if (barberoId !== undefined) {
      if (barberoId === null) {
        // Remover barbero asignado
        turnoAActualizar.barbero = null;
      } else {
        // Verificar que el barbero exista
        const barberoEncontrado = await Barbero.findById(barberoId);
        if (!barberoEncontrado) {
          throw new Error('Barbero no encontrado');
        }
        turnoAActualizar.barbero = barberoId;
      }
    }

    // Actualizar otros campos si se proporcionaron
    if (estado) turnoAActualizar.estado = estado;
    if (metodoPago) turnoAActualizar.metodoPago = metodoPago;
    if (pagado !== undefined) turnoAActualizar.pagado = pagado;
    if (notasBarbero !== undefined) turnoAActualizar.notasBarbero = notasBarbero;

    // Guardar cambios
    await turnoAActualizar.save();

    // Cargar datos relacionados
    await turnoAActualizar.populate('cliente');
    await turnoAActualizar.populate('barbero');
    await turnoAActualizar.populate('servicio');

    return turnoAActualizar;
  } catch (error) {
    throw new Error(`Error al actualizar turno: ${error.message}`);
  }
};

/**
 * CANCELAR TURNO
 *
 * Marca un turno como cancelado.
 *
 * QUÉ HACE:
 * Cambia el estado del turno a 'cancelado'. El turno se mantiene en la
 * base de datos para historial, pero ya no se considera activo.
 *
 * @param {string} identificadorDeTurno - ID del turno a cancelar
 * @returns {object} - Turno cancelado
 * @throws {Error} - Si el turno no existe
 */
export const cancelar = async (identificadorDeTurno) => {
  try {
    // Buscar el turno
    const turnoACancelar = await Turno.findById(identificadorDeTurno);

    if (!turnoACancelar) {
      throw new Error('Turno no encontrado');
    }

    // Cambiar estado a cancelado
    turnoACancelar.estado = 'cancelado';
    await turnoACancelar.save();

    // Cargar datos relacionados
    await turnoACancelar.populate('cliente');
    await turnoACancelar.populate('barbero');
    await turnoACancelar.populate('servicio');

    return turnoACancelar;
  } catch (error) {
    throw new Error(`Error al cancelar turno: ${error.message}`);
  }
};

/**
 * OBTENER HORARIOS DISPONIBLES
 *
 * Devuelve los horarios disponibles para una fecha específica.
 *
 * QUÉ HACE:
 * Compara los horarios base de la barbería con los turnos ya reservados
 * para mostrar solo los horarios libres.
 *
 * HORARIOS BASE:
 * La barbería trabaja de 9:00 AM a 5:00 PM con turnos de 1 hora.
 *
 * CÓMO FUNCIONA:
 * 1. Define los horarios base (9:00 a 17:00)
 * 2. Busca turnos ocupados en esa fecha
 * 3. Filtra los horarios que ya están ocupados
 * 4. Devuelve solo los disponibles
 *
 * @param {string} fecha - Fecha a consultar (formato: YYYY-MM-DD)
 * @param {string} [barberoId] - ID del barbero (opcional)
 * @returns {array} - Lista de horarios disponibles
 */
export const obtenerHorariosDisponibles = async (fecha, barberoId = null) => {
  try {
    // Validar que se proporcione la fecha
    if (!fecha) {
      throw new Error('La fecha es requerida');
    }

    // Horarios base de la barbería (9:00 AM a 18:30 PM, turnos de 45 min)
    const horariosBaseDeLaBarberia = [
      '09:00',
      '09:45',
      '10:30',
      '11:00',
      '11:45',
      '12:30',
      '13:15',
      '14:00',
      '14:45',
      '15:30',
      '16:15',
      '17:00',
      '17:45',
      '18:30',
    ];

    // Preparar la fecha para la consulta
    const fechaAConsultar = new Date(fecha);
    fechaAConsultar.setHours(0, 0, 0, 0);

    // Construir consulta para buscar turnos ocupados
    const consultaDeTurnosOcupados = {
      fecha: {
        $gte: fechaAConsultar,
        $lte: new Date(fechaAConsultar.getTime() + 24 * 60 * 60 * 1000),
      },
      estado: 'reservado', // Solo turnos activos
    };

    // Si se especificó un barbero, filtrar por ese barbero
    if (barberoId) {
      consultaDeTurnosOcupados.barbero = barberoId;

      // CASO 1: Barbero específico - mostrar horarios libres de ese barbero
      const turnosOcupados = await Turno.find(consultaDeTurnosOcupados);
      const horasYaOcupadas = turnosOcupados.map((turno) => turno.hora);

      // Filtrar horarios disponibles
      const horariosDisponibles = horariosBaseDeLaBarberia.filter(
        (horario) => !horasYaOcupadas.includes(horario)
      );

      return horariosDisponibles;
    } else {
      // CASO 2: Barbero "indistinto" - mostrar horarios donde AL MENOS UN barbero esté disponible

      // Obtener todos los barberos activos
      const barberosActivos = await Barbero.find({ activo: true });
      const totalBarberos = barberosActivos.length;

      if (totalBarberos === 0) {
        // Si no hay barberos activos, no hay horarios disponibles
        return [];
      }

      // Buscar TODOS los turnos reservados de la fecha (sin filtrar por barbero)
      const turnosOcupados = await Turno.find(consultaDeTurnosOcupados).populate('barbero');

      // Agrupar turnos por hora para contar cuántos barberos están ocupados por horario
      const barberosPorHorario = {};

      turnosOcupados.forEach((turno) => {
        if (!barberosPorHorario[turno.hora]) {
          barberosPorHorario[turno.hora] = 0;
        }
        // Solo contar si tiene barbero asignado
        if (turno.barbero) {
          barberosPorHorario[turno.hora]++;
        }
      });

      // Filtrar horarios donde AL MENOS UN barbero esté disponible
      // Un horario está disponible si: (barberos ocupados) < (total de barberos)
      const horariosDisponibles = horariosBaseDeLaBarberia.filter((horario) => {
        const barberosOcupados = barberosPorHorario[horario] || 0;
        return barberosOcupados < totalBarberos; // Hay al menos un barbero disponible
      });

      return horariosDisponibles;
    }
  } catch (error) {
    throw new Error(`Error al obtener horarios disponibles: ${error.message}`);
  }
};

/**
 * VALIDAR DISPONIBILIDAD
 *
 * Verifica si un horario específico está disponible.
 *
 * QUÉ HACE:
 * Busca si ya existe un turno activo en la fecha, hora y barbero especificados.
 *
 * @param {string} fecha - Fecha a verificar
 * @param {string} hora - Hora a verificar (formato: HH:MM)
 * @param {string} [barberoId] - ID del barbero (opcional)
 * @returns {boolean} - true si está disponible, false si está ocupado
 */
export const validarDisponibilidad = async (fecha, hora, barberoId = null) => {
  try {
    // Construir consulta
    const consultaDeVerificacion = {
      fecha: new Date(fecha),
      hora,
      estado: 'reservado',
    };

    // Si se especificó barbero, incluirlo en la búsqueda
    if (barberoId) {
      consultaDeVerificacion.barbero = barberoId;
    }

    // Buscar si existe un turno con esas características
    const turnoYaExiste = await Turno.findOne(consultaDeVerificacion);

    // Si NO existe turno, el horario está disponible
    return !turnoYaExiste;
  } catch (error) {
    throw new Error(`Error al validar disponibilidad: ${error.message}`);
  }
};

// ===== EXPORTACIÓN =====

export default {
  obtenerTodos,
  obtenerPorId,
  crear,
  actualizar,
  cancelar,
  obtenerHorariosDisponibles,
  validarDisponibilidad,
};
