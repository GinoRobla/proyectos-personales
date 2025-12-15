/**
 * Servicio de configuración del negocio.
 * Gestiona la configuración general de la barbería.
 */

import ConfiguracionNegocio from '../models/ConfiguracionNegocio.js';

/**
 * Obtener la configuración actual (o crear una por defecto si no existe)
 */
export const obtenerConfiguracion = async () => {
  let config = await ConfiguracionNegocio.findOne();

  // Si no existe configuración, crear una por defecto
  if (!config) {
    config = new ConfiguracionNegocio({
      nombreNegocio: 'Mi Barbería',
      direccion: '',
      telefono: '',
      emailContacto: '',
      logoUrl: null,
      duracionTurnoMinutos: 45,
      diasBloqueadosPermanente: [0], // Domingo bloqueado por defecto
      horarios: 'Lun-Vie: 9:00-20:00',
      redesSociales: {
        facebook: '',
        instagram: '',
        twitter: '',
      },
    });
    await config.save();
  }

  return config;
};

/**
 * Actualizar la configuración
 */
export const actualizarConfiguracion = async (datos) => {
  const {
    nombreNegocio,
    direccion,
    telefono,
    emailContacto,
    logoUrl,
    duracionTurnoMinutos,
    diasBloqueadosPermanente,
    horarios,
    redesSociales,
    // Nuevos campos de señas/pagos
    senasActivas,
    senasObligatorias,
    porcentajeSena,
    politicaSenas,
    serviciosPremiumIds,
    mercadoPagoAccessToken,
    mercadoPagoPublicKey,
    horasAntesCancelacion,
    permitirDevolucionSena,
  } = datos;

  // Validaciones
  if (duracionTurnoMinutos && ![15, 30, 45, 60].includes(duracionTurnoMinutos)) {
    throw new Error('La duración del turno debe ser 15, 30, 45 o 60 minutos');
  }

  if (diasBloqueadosPermanente) {
    const validos = diasBloqueadosPermanente.every(dia => dia >= 0 && dia <= 6);
    if (!validos) {
      throw new Error('Los días bloqueados deben estar entre 0 (Domingo) y 6 (Sábado)');
    }
  }

  // Validaciones de señas
  if (porcentajeSena !== undefined) {
    if (porcentajeSena < 10 || porcentajeSena > 100) {
      throw new Error('El porcentaje de seña debe estar entre 10% y 100%');
    }
  }

  if (politicaSenas !== undefined) {
    const politicasValidas = ['ninguno', 'todos', 'nuevos_clientes', 'servicios_premium'];
    if (!politicasValidas.includes(politicaSenas)) {
      throw new Error(`La política de señas debe ser una de: ${politicasValidas.join(', ')}`);
    }
  }

  // Obtener o crear configuración
  let config = await ConfiguracionNegocio.findOne();

  if (!config) {
    config = new ConfiguracionNegocio();
  }

  // Actualizar campos generales (solo si se proporcionan)
  if (nombreNegocio !== undefined) config.nombreNegocio = nombreNegocio;
  if (direccion !== undefined) config.direccion = direccion;
  if (telefono !== undefined) config.telefono = telefono;
  if (emailContacto !== undefined) config.emailContacto = emailContacto;
  if (logoUrl !== undefined) config.logoUrl = logoUrl;
  if (duracionTurnoMinutos !== undefined) config.duracionTurnoMinutos = duracionTurnoMinutos;
  if (diasBloqueadosPermanente !== undefined) {
    config.diasBloqueadosPermanente = diasBloqueadosPermanente;
  }
  if (horarios !== undefined) config.horarios = horarios;
  if (redesSociales !== undefined) {
    config.redesSociales = {
      facebook: redesSociales.facebook || '',
      instagram: redesSociales.instagram || '',
      twitter: redesSociales.twitter || '',
      whatsapp: redesSociales.whatsapp || '',
    };
  }

  // Actualizar campos de señas/pagos
  if (senasActivas !== undefined) config.senasActivas = senasActivas;
  if (senasObligatorias !== undefined) config.senasObligatorias = senasObligatorias;
  if (porcentajeSena !== undefined) config.porcentajeSena = porcentajeSena;
  if (politicaSenas !== undefined) config.politicaSenas = politicaSenas;
  if (serviciosPremiumIds !== undefined) config.serviciosPremiumIds = serviciosPremiumIds;
  if (mercadoPagoAccessToken !== undefined) config.mercadoPagoAccessToken = mercadoPagoAccessToken;
  if (mercadoPagoPublicKey !== undefined) config.mercadoPagoPublicKey = mercadoPagoPublicKey;
  if (horasAntesCancelacion !== undefined) config.horasAntesCancelacion = horasAntesCancelacion;
  if (permitirDevolucionSena !== undefined) config.permitirDevolucionSena = permitirDevolucionSena;

  await config.save();
  return config;
};

/**
 * Agregar día a lista de bloqueados permanentes
 */
export const agregarDiaBloqueado = async (diaSemana) => {
  if (diaSemana < 0 || diaSemana > 6) {
    throw new Error('El día debe estar entre 0 (Domingo) y 6 (Sábado)');
  }

  const config = await obtenerConfiguracion();

  if (!config.diasBloqueadosPermanente.includes(diaSemana)) {
    config.diasBloqueadosPermanente.push(diaSemana);
    await config.save();
  }

  return config;
};

/**
 * Quitar día de lista de bloqueados permanentes
 */
export const quitarDiaBloqueado = async (diaSemana) => {
  const config = await obtenerConfiguracion();

  config.diasBloqueadosPermanente = config.diasBloqueadosPermanente.filter(
    dia => dia !== diaSemana
  );

  await config.save();
  return config;
};

/**
 * Obtener solo la configuración de señas/pagos
 */
export const obtenerConfiguracionSenas = async () => {
  const config = await obtenerConfiguracion();

  return {
    senasActivas: config.senasActivas,
    senasObligatorias: config.senasObligatorias,
    porcentajeSena: config.porcentajeSena,
    politicaSenas: config.politicaSenas,
    serviciosPremiumIds: config.serviciosPremiumIds,
    horasAntesCancelacion: config.horasAntesCancelacion,
    permitirDevolucionSena: config.permitirDevolucionSena,
    // NO exponer credenciales de MercadoPago en esta función por seguridad
    tieneMercadoPagoConfigurado: !!config.mercadoPagoAccessToken,
  };
};

/**
 * Actualizar solo la configuración de señas/pagos
 */
export const actualizarConfiguracionSenas = async (datosSenas) => {
  const {
    senasActivas,
    senasObligatorias,
    porcentajeSena,
    politicaSenas,
    serviciosPremiumIds,
    mercadoPagoAccessToken,
    mercadoPagoPublicKey,
    horasAntesCancelacion,
    permitirDevolucionSena,
  } = datosSenas;

  // Reutilizar la función de actualización general
  return await actualizarConfiguracion(datosSenas);
};

/**
 * Activar o desactivar el sistema de señas
 */
export const toggleSenas = async (activar) => {
  const config = await obtenerConfiguracion();

  // Si se intenta activar, validar que tenga configuración de MercadoPago
  if (activar && !config.mercadoPagoAccessToken) {
    throw new Error(
      'No se puede activar el sistema de señas sin configurar las credenciales de MercadoPago'
    );
  }

  config.senasActivas = activar;
  await config.save();

  console.log(`[CONFIG] Sistema de señas ${activar ? 'ACTIVADO' : 'DESACTIVADO'}`);

  return config;
};

/**
 * Agregar servicio a lista de premium
 */
export const agregarServicioPremium = async (servicioId) => {
  const config = await obtenerConfiguracion();

  if (!config.serviciosPremiumIds.includes(servicioId)) {
    config.serviciosPremiumIds.push(servicioId);
    await config.save();
  }

  return config;
};

/**
 * Quitar servicio de lista de premium
 */
export const quitarServicioPremium = async (servicioId) => {
  const config = await obtenerConfiguracion();

  config.serviciosPremiumIds = config.serviciosPremiumIds.filter(
    id => id.toString() !== servicioId.toString()
  );

  await config.save();
  return config;
};

export default {
  obtenerConfiguracion,
  actualizarConfiguracion,
  agregarDiaBloqueado,
  quitarDiaBloqueado,
  obtenerConfiguracionSenas,
  actualizarConfiguracionSenas,
  toggleSenas,
  agregarServicioPremium,
  quitarServicioPremium,
};
