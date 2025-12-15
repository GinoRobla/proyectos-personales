/**
 * Servicio de Pagos.
 * Maneja la lógica de señas, integración con MercadoPago y gestión de pagos.
 */

import pkg from 'mercadopago';
const { MercadoPagoConfig, Preference, Payment, Refund } = pkg;
import Pago from '../models/Pago.js';
import Turno from '../models/Turno.js';
import Cliente from '../models/Cliente.js';
import Servicio from '../models/Servicio.js';
import { obtenerConfiguracion } from './configuracionService.js';
import * as emailService from './emailService.js';

/**
 * Verificar si un turno requiere seña según la configuración actual
 * @param {ObjectId} clienteId - ID del cliente
 * @param {ObjectId} servicioId - ID del servicio
 * @returns {Promise<boolean>} - true si requiere seña, false si no
 */
export const verificarRequiereSena = async (clienteId, servicioId) => {
  try {
    const config = await obtenerConfiguracion();

    // Si las señas no están activas, no requiere seña
    if (!config.senasActivas) {
      console.log('[PAGOS] Sistema de señas desactivado');
      return false;
    }

    // Si las señas son obligatorias, siempre requiere
    if (config.senasObligatorias) {
      console.log('[PAGOS] Señas obligatorias para todos los turnos');
      return true;
    }

    // Evaluar según la política configurada
    switch (config.politicaSenas) {
      case 'ninguno':
        console.log('[PAGOS] Política: ninguno - No requiere seña');
        return false;

      case 'todos':
        console.log('[PAGOS] Política: todos - Requiere seña');
        return true;

      case 'nuevos_clientes':
        // Verificar si el cliente tiene turnos previos completados
        const turnosPrevios = await Turno.countDocuments({
          cliente: clienteId,
          estado: 'completado',
        });
        const esNuevoCliente = turnosPrevios === 0;
        console.log(`[PAGOS] Política: nuevos_clientes - Turnos previos: ${turnosPrevios}, Es nuevo: ${esNuevoCliente}`);
        return esNuevoCliente;

      case 'servicios_premium':
        // Verificar si el servicio está en la lista de premium
        const esPremium = config.serviciosPremiumIds.some(
          (id) => id.toString() === servicioId.toString()
        );
        console.log(`[PAGOS] Política: servicios_premium - Es premium: ${esPremium}`);
        return esPremium;

      default:
        console.log('[PAGOS] Política desconocida - No requiere seña');
        return false;
    }
  } catch (error) {
    console.error('[PAGOS] Error al verificar si requiere seña:', error);
    throw new Error(`Error al verificar requisito de seña: ${error.message}`);
  }
};

/**
 * Crear una preferencia de pago en MercadoPago
 * @param {Object} turno - Turno reservado
 * @param {Object} cliente - Cliente que reserva
 * @param {Object} servicio - Servicio contratado
 * @returns {Promise<Object>} - Objeto con el pago creado y URL de pago
 */
export const crearPreferenciaPago = async (turno, cliente, servicio) => {
  try {
    console.log('[PAGOS] Iniciando creación de preferencia de pago');

    // 1. Obtener configuración
    const config = await obtenerConfiguracion();

    if (!config.mercadoPagoAccessToken) {
      throw new Error('No se ha configurado el Access Token de MercadoPago');
    }

    // 2. Configurar cliente de MercadoPago con el Access Token
    const client = new MercadoPagoConfig({
      accessToken: config.mercadoPagoAccessToken,
      options: {
        timeout: 10000 // 10 segundos de timeout
      }
    });
    const preferenceClient = new Preference(client);

    // 3. Calcular montos
    const montoTotal = servicio.precioBase;
    const montoSena = Math.round((montoTotal * config.porcentajeSena) / 100);

    console.log(`[PAGOS] Cálculo de montos: Total: $${montoTotal}, Seña (${config.porcentajeSena}%): $${montoSena}`);
    console.log(`[PAGOS] URLs configuradas - Frontend: ${process.env.FRONTEND_URL}, Backend: ${process.env.BACKEND_URL}`);

    // 4. Crear preferencia de pago
    const preferenceData = {
      items: [
        {
          title: `Seña - ${servicio.nombre}`,
          description: `${config.porcentajeSena}% de seña para turno en ${config.nombreNegocio || 'barbería'}`,
          quantity: 1,
          unit_price: montoSena,
          currency_id: 'ARS',
        },
      ],
      payer: {
        name: cliente.nombre,
        surname: cliente.apellido,
        email: cliente.email,
        phone: {
          number: cliente.telefono,
        },
      },
      back_urls: {
        success: `${process.env.FRONTEND_URL}/pago/success`,
        failure: `${process.env.FRONTEND_URL}/pago/failure`,
        pending: `${process.env.FRONTEND_URL}/pago/pending`,
      },
      notification_url: `${process.env.BACKEND_URL}/api/pagos/webhook`,
      metadata: {
        turno_id: turno._id.toString(),
        cliente_id: cliente._id.toString(),
        servicio_id: servicio._id.toString(),
      },
      statement_descriptor: config.nombreNegocio || 'BARBERIA',
      external_reference: turno._id.toString(),
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    };

    console.log('[PAGOS] Creando preferencia en MercadoPago...');

    // 5. Crear preferencia en MercadoPago
    const respuesta = await preferenceClient.create({ body: preferenceData });

    console.log(`[PAGOS] Preferencia creada exitosamente: ${respuesta.id}`);

    // 6. Calcular fecha de expiración (72 horas por defecto)
    const fechaExpiracion = new Date();
    fechaExpiracion.setHours(fechaExpiracion.getHours() + 72);

    // 7. Guardar registro de pago en la base de datos
    const nuevoPago = new Pago({
      turno: turno._id,
      cliente: cliente._id,
      monto: montoSena,
      montoTotal,
      porcentajeSena: config.porcentajeSena,
      estado: 'pendiente',
      metodoPago: 'mercadopago',
      preferenciaId: respuesta.id,
      urlPago: respuesta.init_point,
      fechaExpiracion,
    });

    await nuevoPago.save();

    console.log(`[PAGOS] Pago guardado en BD con ID: ${nuevoPago._id}`);

    return {
      pago: nuevoPago,
      urlPago: respuesta.init_point,
      preferenciaId: respuesta.id,
    };
  } catch (error) {
    console.error('[PAGOS] Error al crear preferencia de pago:', error);
    throw new Error(`Error al crear preferencia de pago: ${error.message}`);
  }
};

/**
 * Procesar notificación webhook de MercadoPago
 * @param {Object} datos - Datos del webhook
 * @returns {Promise<Object>} - Resultado del procesamiento
 */
export const procesarWebhook = async (datos) => {
  try {
    console.log('[WEBHOOK] Recibiendo notificación de MercadoPago:', JSON.stringify(datos, null, 2));

    const { type, data } = datos;

    // Solo procesar notificaciones de tipo 'payment'
    if (type !== 'payment') {
      console.log(`[WEBHOOK] Tipo de notificación ignorado: ${type}`);
      return { procesado: false, mensaje: 'Tipo de notificación no soportado' };
    }

    if (!data || !data.id) {
      console.log('[WEBHOOK] Notificación sin ID de pago');
      return { procesado: false, mensaje: 'Datos de pago incompletos' };
    }

    // Obtener configuración para Access Token
    const config = await obtenerConfiguracion();

    // Configurar cliente de MercadoPago SDK v2
    const client = new MercadoPagoConfig({
      accessToken: config.mercadoPagoAccessToken,
      options: {
        timeout: 10000
      }
    });
    const paymentClient = new Payment(client);

    // Obtener información del pago desde MercadoPago
    const pagoMP = await paymentClient.get({ id: data.id });
    console.log(`[WEBHOOK] Estado del pago en MP: ${pagoMP.status}`);

    // Buscar el pago en nuestra base de datos usando la referencia externa (turno_id)
    const turnoId = pagoMP.external_reference;
    const pago = await Pago.findOne({ turno: turnoId });

    if (!pago) {
      console.log(`[WEBHOOK] No se encontró pago asociado al turno: ${turnoId}`);
      return { procesado: false, mensaje: 'Pago no encontrado en BD' };
    }

    console.log(`[WEBHOOK] Pago encontrado en BD: ${pago._id}`);

    // Actualizar estado según respuesta de MercadoPago
    pago.pagoId = data.id;
    pago.estadoMP = pagoMP.status;

    switch (pagoMP.status) {
      case 'approved':
        console.log('[WEBHOOK] ✅ Pago APROBADO');
        pago.estado = 'aprobado';
        pago.fechaPago = new Date();

        // Actualizar el turno
        const turnoAprobado = await Turno.findById(pago.turno)
          .populate('cliente')
          .populate('servicio')
          .populate('barbero');
        if (turnoAprobado) {
          turnoAprobado.senaPagada = true;
          turnoAprobado.estadoPago = 'pagada';
          turnoAprobado.estado = 'reservado'; // Cambiar de 'pendiente' a 'reservado'
          await turnoAprobado.save();
          console.log(`[WEBHOOK] Turno ${turnoAprobado._id} actualizado - Seña pagada y turno reservado`);

          // Enviar email de confirmación
          if (turnoAprobado.cliente && turnoAprobado.cliente.email) {
            try {
              await emailService.enviarEmailPagoAprobado(
                turnoAprobado.cliente.email,
                turnoAprobado.cliente.nombre,
                turnoAprobado,
                pago
              );
            } catch (error) {
              console.error('[WEBHOOK] Error al enviar email de pago aprobado:', error);
            }
          }
        }
        break;

      case 'rejected':
      case 'cancelled':
        console.log(`[WEBHOOK] ❌ Pago RECHAZADO/CANCELADO: ${pagoMP.status}`);
        pago.estado = 'rechazado';

        // Enviar email de pago rechazado
        const turnoRechazado = await Turno.findById(pago.turno)
          .populate('cliente')
          .populate('servicio')
          .populate('barbero');
        if (turnoRechazado && turnoRechazado.cliente && turnoRechazado.cliente.email) {
          try {
            await emailService.enviarEmailPagoRechazado(
              turnoRechazado.cliente.email,
              turnoRechazado.cliente.nombre,
              turnoRechazado
            );
          } catch (error) {
            console.error('[WEBHOOK] Error al enviar email de pago rechazado:', error);
          }
        }
        break;

      case 'pending':
      case 'in_process':
        console.log(`[WEBHOOK] ⏳ Pago PENDIENTE: ${pagoMP.status}`);
        pago.estado = 'pendiente';

        // Enviar email de pago pendiente
        const turnoPendiente = await Turno.findById(pago.turno)
          .populate('cliente')
          .populate('servicio')
          .populate('barbero');
        if (turnoPendiente && turnoPendiente.cliente && turnoPendiente.cliente.email) {
          try {
            await emailService.enviarEmailPagoPendiente(
              turnoPendiente.cliente.email,
              turnoPendiente.cliente.nombre,
              turnoPendiente,
              pago.urlPago
            );
          } catch (error) {
            console.error('[WEBHOOK] Error al enviar email de pago pendiente:', error);
          }
        }
        break;

      default:
        console.log(`[WEBHOOK] Estado desconocido: ${pagoMP.status}`);
        break;
    }

    await pago.save();
    console.log('[WEBHOOK] Pago actualizado en BD');

    return {
      procesado: true,
      pagoId: pago._id,
      estado: pago.estado,
    };
  } catch (error) {
    console.error('[WEBHOOK] Error al procesar webhook:', error);
    throw new Error(`Error al procesar webhook: ${error.message}`);
  }
};

/**
 * Obtener un pago por ID
 * @param {ObjectId} pagoId - ID del pago
 * @returns {Promise<Object>} - Pago encontrado
 */
export const obtenerPagoPorId = async (pagoId) => {
  try {
    const pago = await Pago.findById(pagoId)
      .populate('turno')
      .populate('cliente');

    if (!pago) {
      throw new Error('Pago no encontrado');
    }

    return pago;
  } catch (error) {
    throw new Error(`Error al obtener pago: ${error.message}`);
  }
};

/**
 * Obtener pago asociado a un turno
 * @param {ObjectId} turnoId - ID del turno
 * @returns {Promise<Object|null>} - Pago encontrado o null
 */
export const obtenerPagoPorTurno = async (turnoId) => {
  try {
    const pago = await Pago.findOne({ turno: turnoId })
      .populate('cliente');

    return pago;
  } catch (error) {
    throw new Error(`Error al obtener pago del turno: ${error.message}`);
  }
};

/**
 * Obtener lista de pagos con filtros opcionales
 * @param {Object} filtros - Filtros de búsqueda (estado, fechaDesde, fechaHasta)
 * @returns {Promise<Array>} - Lista de pagos
 */
export const obtenerPagos = async (filtros = {}) => {
  try {
    const pagos = await Pago.find(filtros)
      .populate({
        path: 'turno',
        populate: [
          { path: 'cliente', select: 'nombre apellido email telefono' },
          { path: 'barbero', select: 'nombre apellido' },
          { path: 'servicio', select: 'nombre precio' }
        ]
      })
      .sort({ createdAt: -1 }) // Más recientes primero
      .lean();

    return pagos;
  } catch (error) {
    throw new Error(`Error al obtener pagos: ${error.message}`);
  }
};

/**
 * Aplicar seña al total cuando el cliente completa su turno
 * @param {ObjectId} turnoId - ID del turno
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const aplicarSenaAlTotal = async (turnoId) => {
  try {
    const turno = await Turno.findById(turnoId).populate('pago');

    if (!turno) {
      throw new Error('Turno no encontrado');
    }

    if (!turno.requiereSena || !turno.pago) {
      return {
        aplicado: false,
        mensaje: 'El turno no tiene seña asociada',
        montoAPagar: turno.precio,
      };
    }

    const pago = await Pago.findById(turno.pago);

    if (!pago || pago.estado !== 'aprobado') {
      return {
        aplicado: false,
        mensaje: 'La seña no fue pagada',
        montoAPagar: turno.precio,
      };
    }

    if (pago.aplicado) {
      return {
        aplicado: false,
        mensaje: 'La seña ya fue aplicada anteriormente',
        montoAPagar: turno.precio - pago.monto,
      };
    }

    // Marcar la seña como aplicada
    pago.aplicado = true;
    await pago.save();

    turno.estadoPago = 'aplicada';
    await turno.save();

    const montoAPagar = turno.precio - pago.monto;

    console.log(`[PAGOS] Seña aplicada al turno ${turnoId}: $${pago.monto} descontados. Total a pagar: $${montoAPagar}`);

    return {
      aplicado: true,
      mensaje: 'Seña aplicada exitosamente',
      montoSena: pago.monto,
      montoTotal: turno.precio,
      montoAPagar,
    };
  } catch (error) {
    throw new Error(`Error al aplicar seña: ${error.message}`);
  }
};

/**
 * Retener seña cuando el cliente no asiste
 * @param {ObjectId} turnoId - ID del turno
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const retenerSena = async (turnoId) => {
  try {
    const turno = await Turno.findById(turnoId).populate('pago');

    if (!turno) {
      throw new Error('Turno no encontrado');
    }

    if (!turno.requiereSena || !turno.pago) {
      return {
        retenido: false,
        mensaje: 'El turno no tiene seña asociada',
      };
    }

    const pago = await Pago.findById(turno.pago);

    if (!pago || pago.estado !== 'aprobado') {
      return {
        retenido: false,
        mensaje: 'La seña no fue pagada',
      };
    }

    // Marcar el turno como retenida (no se aplicó ni se devolvió)
    turno.estadoPago = 'retenida';
    await turno.save();

    console.log(`[PAGOS] Seña retenida del turno ${turnoId}: $${pago.monto} - Cliente no asistió`);

    return {
      retenido: true,
      mensaje: 'Seña retenida por inasistencia',
      montoRetenido: pago.monto,
    };
  } catch (error) {
    throw new Error(`Error al retener seña: ${error.message}`);
  }
};

/**
 * Devolver seña al cliente (por cancelación con anticipación)
 * @param {ObjectId} turnoId - ID del turno
 * @param {string} motivo - Motivo de la devolución
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const devolverSena = async (turnoId, motivo = 'Cancelación con anticipación') => {
  try {
    const config = await obtenerConfiguracion();

    if (!config.permitirDevolucionSena) {
      throw new Error('Las devoluciones de seña no están permitidas según la configuración');
    }

    const turno = await Turno.findById(turnoId).populate('pago');

    if (!turno) {
      throw new Error('Turno no encontrado');
    }

    if (!turno.requiereSena || !turno.pago) {
      return {
        devuelto: false,
        mensaje: 'El turno no tiene seña asociada',
      };
    }

    const pago = await Pago.findById(turno.pago);

    if (!pago || pago.estado !== 'aprobado') {
      return {
        devuelto: false,
        mensaje: 'La seña no fue pagada o ya fue procesada',
      };
    }

    if (pago.devuelto) {
      return {
        devuelto: false,
        mensaje: 'La seña ya fue devuelta anteriormente',
      };
    }

    // Verificar si la cancelación es con suficiente anticipación
    const ahora = new Date();
    const fechaTurno = new Date(turno.fecha);
    const horasAntes = (fechaTurno - ahora) / (1000 * 60 * 60);

    if (horasAntes < config.horasAntesCancelacion) {
      throw new Error(
        `Debe cancelar con al menos ${config.horasAntesCancelacion} horas de anticipación para recibir devolución`
      );
    }

    // Verificar que el pago tenga un pagoId de MercadoPago
    if (!pago.pagoId) {
      throw new Error('No se encontró el ID de pago de MercadoPago. No se puede procesar la devolución.');
    }

    console.log(`[PAGOS] Procesando devolución automática en MercadoPago para pago ID: ${pago.pagoId}`);

    // Configurar cliente de MercadoPago
    const client = new MercadoPagoConfig({
      accessToken: config.mercadoPagoAccessToken,
      options: {
        timeout: 10000
      }
    });
    const refundClient = new Refund(client);

    try {
      // Crear devolución en MercadoPago
      const refundData = {
        payment_id: parseInt(pago.pagoId),
        amount: pago.monto, // Monto a devolver (puede ser parcial o total)
      };

      const refundResponse = await refundClient.create({ body: refundData });

      console.log(`[PAGOS] ✅ Devolución creada en MercadoPago - Refund ID: ${refundResponse.id}`);
      console.log(`[PAGOS] Estado de devolución: ${refundResponse.status}`);

      // Marcar pago como devuelto en nuestra BD
      pago.estado = 'devuelto';
      pago.devuelto = true;
      pago.motivoDevolucion = motivo;
      pago.estadoMP = `refunded - ${refundResponse.status}`;
      await pago.save();

      // Actualizar estado del turno
      turno.estadoPago = 'devuelto';
      await turno.save();

      console.log(`[PAGOS] Seña devuelta del turno ${turnoId}: $${pago.monto} - Motivo: ${motivo}`);

      return {
        devuelto: true,
        mensaje: 'Seña devuelta exitosamente. El dinero será reembolsado a la cuenta del cliente.',
        montoDevuelto: pago.monto,
        motivo,
        refundId: refundResponse.id,
        estadoRefund: refundResponse.status,
      };
    } catch (mpError) {
      console.error('[PAGOS] Error al procesar devolución en MercadoPago:', mpError);

      // Si falla la devolución en MP, no marcar como devuelto en BD
      throw new Error(
        `Error al procesar devolución en MercadoPago: ${mpError.message || 'Error desconocido'}. ` +
        `Por favor, procese la devolución manualmente desde el panel de MercadoPago.`
      );
    }
  } catch (error) {
    throw new Error(`Error al devolver seña: ${error.message}`);
  }
};

export default {
  verificarRequiereSena,
  crearPreferenciaPago,
  procesarWebhook,
  obtenerPagoPorId,
  obtenerPagoPorTurno,
  obtenerPagos,
  aplicarSenaAlTotal,
  retenerSena,
  devolverSena,
};
