/**
 * turnoService - crud
 * Módulo extraído de turnoService.js para mejor organización
 */

import Turno from '../../models/Turno.js';
import Cliente from '../../models/Cliente.js';
import Barbero from '../../models/Barbero.js';
import Servicio from '../../models/Servicio.js';
import { enviarCancelacionBarberoWhatsApp } from '../whatsappService.js';
import { validarTelefonoArgentino } from '../../utils/phoneValidator.js';
import { calcularSlotsDisponibles } from '../disponibilidadService.js';
import { obtenerConfiguracion } from '../configuracionService.js';
import { verificarRequiereSena, crearPreferenciaPago, devolverSena } from '../pagoService.js';
// Importar helpers desde el archivo separado para evitar importaciones circulares
import { _crearRangoFechaDia, _verificarConflicto } from './turnoHelpers.js';

// Re-exportar las funciones helper para compatibilidad hacia atrás
export { _crearRangoFechaDia, _verificarConflicto };

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
      .populate('servicio') // Trae los datos del Servicio
      .populate('pago'); // Trae los datos del Pago

    // 4. Ordenar en memoria: pendiente > reservado > completado > cancelado, luego por fecha desc, luego por hora desc
    const ordenEstado = { 'pendiente': 0, 'reservado': 1, 'completado': 2, 'cancelado': 3 };
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
            estado: { $in: ['pendiente', 'reservado'] },
          });

          // Contar cuántos turnos tiene ese día
          const cantidadTurnos = await Turno.countDocuments({
            barbero: barbero._id,
            fecha: { $gte: fechaInicioDia, $lte: fechaFinDia },
            estado: { $in: ['pendiente', 'reservado'] },
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
        estado: { $in: ['pendiente', 'reservado'] },
      });

      if (turnoYaExiste) {
        throw new Error('El barbero ya tiene un turno asignado en ese horario');
      }
    }

    // 4. Validar y normalizar teléfono
    const resultadoTelefono = validarTelefonoArgentino(clienteData.telefono);
    if (!resultadoTelefono.valido) {
      throw new Error(resultadoTelefono.error);
    }

    // 4.5. Verificar que el teléfono esté verificado
    const { esTelefonoVerificado } = await import('../verificacionService.js');
    const telefonoVerificado = await esTelefonoVerificado(resultadoTelefono.numeroNormalizado);
    
    if (!telefonoVerificado) {
    throw new Error('TELEFONO_NO_VERIFICADO: Debes verificar tu número de teléfono antes de reservar un turno.');
    }

    // 5. Buscar o crear Cliente por email
    let clienteDelTurno = await Cliente.findOne({ email: clienteData.email });

    if (clienteDelTurno) {
      // Si el cliente existe, actualizar sus datos
      clienteDelTurno.nombre = clienteData.nombre;
      clienteDelTurno.apellido = clienteData.apellido;
      clienteDelTurno.telefono = resultadoTelefono.numeroNormalizado;
      await clienteDelTurno.save();
    } else {
      // Si no existe, buscar el Usuario por email y crear el Cliente automáticamente
      const { Usuario } = await import('../../models/index.js');
      const usuarioExistente = await Usuario.findOne({ email: clienteData.email });

      if (!usuarioExistente) {
        throw new Error('Debes registrarte antes de reservar un turno. Por favor, crea una cuenta en "Registrarse"');
      }

      clienteDelTurno = new Cliente({
        usuario: usuarioExistente._id,
        nombre: clienteData.nombre,
        apellido: clienteData.apellido,
        email: clienteData.email,
        telefono: resultadoTelefono.numeroNormalizado,
      });
      await clienteDelTurno.save();
      console.log('[TURNOS] Cliente creado automáticamente:', clienteDelTurno._id);
    }

    // 6. Verificar si el turno requiere seña
    console.log('[TURNOS] Verificando si el turno requiere seña...');
    const requiereSena = await verificarRequiereSena(clienteDelTurno._id, servicioId);
    console.log(`[TURNOS] Requiere seña: ${requiereSena}`);

    // 7. Crear el turno (pendiente si requiere seña, reservado si no)
    // Si requiere seña, establecer expiración de 15 minutos (recordatorio a los 5 min, cancelación a los 15 min)
    const fechaExpiracion = requiereSena ? new Date(Date.now() + 15 * 60 * 1000) : null;

    const nuevoTurno = new Turno({
      cliente: clienteDelTurno._id,
      barbero: barberoAsignado, // Siempre tiene un barbero asignado
      servicio: servicioId,
      fecha: fechaInicioDia, // [FIX] Guarda la fecha como UTC a las 00:00
      hora,
      precio,
      estado: requiereSena ? 'pendiente' : 'reservado',
      requiereSena,
      estadoPago: requiereSena ? 'pendiente' : 'sin_sena',
      fechaExpiracion,
    });

    console.log('[DEBUG crear] Turno creado con barbero:', barberoAsignado);

    await nuevoTurno.save();

    // 8. Cargar los datos relacionados para la respuesta
    await nuevoTurno.populate(['cliente', 'barbero', 'servicio']);

    // 9. Si requiere seña, crear preferencia de pago en MercadoPago
    let urlPago = null;
    let pagoId = null;

    if (requiereSena) {
      try {
        console.log('[TURNOS] Creando preferencia de pago en MercadoPago...');
        const resultadoPago = await crearPreferenciaPago(
          nuevoTurno,
          clienteDelTurno,
          servicio
        );

        urlPago = resultadoPago.urlPago;
        pagoId = resultadoPago.pago._id;

        // Actualizar turno con referencia al pago
        nuevoTurno.pago = pagoId;
        await nuevoTurno.save();

        console.log(`[TURNOS] ✅ Preferencia de pago creada: ${pagoId}`);
        console.log(`[TURNOS] URL de pago: ${urlPago}`);
      } catch (error) {
        console.error('[TURNOS] ❌ Error al crear preferencia de pago:', error.message);
        // Si falla la creación del pago, cancelamos el turno
        await Turno.findByIdAndDelete(nuevoTurno._id);
        throw new Error(`Error al crear el pago: ${error.message}`);
      }
    }

    // 10. Retornar turno con información de pago si corresponde
    return {
      turno: nuevoTurno,
      requiereSena,
      urlPago,
      pagoId,
    };
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
 * Si el turno requiere seña y el pago está aprobado, intenta devolver automáticamente.
 */

export default {
  obtenerTodos,
  obtenerPorId,
  crear,
  actualizar,
};
