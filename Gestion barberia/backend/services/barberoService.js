/**
 * ============================================================================
 * SERVICIO DE BARBEROS
 * ============================================================================
 *
 * Este archivo contiene toda la lógica de negocio relacionada con la gestión
 * de barberos en el sistema de la barbería.
 *
 * QUÉ ES UN BARBERO:
 * Un barbero es un empleado de la barbería que presta servicios a los clientes.
 * Tiene información profesional (especialidad, horarios) además de una cuenta
 * de usuario para acceder al sistema.
 *
 * RESPONSABILIDADES DE ESTE ARCHIVO:
 * - Crear nuevos barberos (perfil profesional + cuenta de usuario)
 * - Listar barberos con filtros
 * - Obtener información de un barbero específico
 * - Actualizar datos de barberos
 * - Eliminar barberos (y su cuenta de usuario asociada)
 * - Verificar disponibilidad de barberos
 * - Obtener barberos disponibles para una fecha/hora
 *
 * IMPORTANTE:
 * Cada barbero tiene DOS registros en la base de datos:
 * 1. Barbero: Información profesional (especialidad, horarios, foto)
 * 2. Usuario: Cuenta para login (email, contraseña, rol 'barbero')
 */

import Barbero from '../models/Barbero.js';

// ===== FUNCIONES PRINCIPALES =====

/**
 * OBTENER TODOS LOS BARBEROS
 *
 * Lista todos los barberos del sistema con opciones de filtrado.
 *
 * QUÉ HACE:
 * Devuelve una lista de barberos ordenada alfabéticamente por nombre.
 * Puede filtrar por barberos activos o inactivos.
 *
 * FILTROS:
 * - activo: true/false para filtrar por estado activo
 *
 * @param {object} filtros - Criterios de búsqueda
 * @returns {array} - Lista de barberos encontrados
 */
export const obtenerTodos = async (filtros = {}) => {
  try {
    // Construir consulta de búsqueda
    const consultaDeBusqueda = {};

    // Filtrar por estado activo si se especifica
    if (filtros.activo !== undefined) {
      consultaDeBusqueda.activo = filtros.activo;
    }

    // Buscar barberos y ordenar por nombre
    const barberosEncontrados = await Barbero.find(consultaDeBusqueda).sort({ nombre: 1 });

    return barberosEncontrados;
  } catch (error) {
    throw new Error(`Error al obtener barberos: ${error.message}`);
  }
};

/**
 * OBTENER BARBERO POR ID
 *
 * Busca y devuelve un barbero específico por su ID.
 *
 * @param {string} identificadorDeBarbero - ID del barbero a buscar
 * @returns {object} - Barbero encontrado
 * @throws {Error} - Si el barbero no existe
 */
export const obtenerPorId = async (identificadorDeBarbero) => {
  try {
    // Buscar el barbero
    const barberoEncontrado = await Barbero.findById(identificadorDeBarbero);

    // Verificar que exista
    if (!barberoEncontrado) {
      throw new Error('Barbero no encontrado');
    }

    return barberoEncontrado;
  } catch (error) {
    throw new Error(`Error al obtener barbero: ${error.message}`);
  }
};

/**
 * CREAR NUEVO BARBERO
 *
 * Crea un nuevo barbero con su perfil profesional y cuenta de usuario.
 *
 * QUÉ HACE:
 * 1. Valida que no exista otro barbero con el mismo email
 * 2. Crea el perfil profesional del barbero
 * 3. Crea automáticamente una cuenta de usuario con rol 'barbero'
 * 4. Devuelve el barbero creado
 *
 * IMPORTANTE:
 * - El email debe ser único (no puede haber dos barberos con el mismo email)
 * - Se crea automáticamente un usuario asociado para que pueda iniciar sesión
 * - La contraseña por defecto es 'barbero123' (debe cambiarse después)
 *
 * @param {object} datosDelBarbero - Información del barbero a crear
 * @returns {object} - Barbero creado
 * @throws {Error} - Si faltan datos o el email ya existe
 */
export const crear = async (datosDelBarbero) => {
  try {
    // Extraer datos
    const { nombre, apellido, email, telefono, foto, especialidad, horarioLaboral, password } = datosDelBarbero;

    // Validar campos obligatorios
    const faltanCampos = !nombre || !apellido || !email || !telefono || !especialidad;
    if (faltanCampos) {
      throw new Error('Faltan campos obligatorios');
    }

    // Verificar que el email no exista en la colección de Barberos
    const barberoConMismoEmail = await Barbero.findOne({ email });
    if (barberoConMismoEmail) {
      throw new Error('Ya existe un barbero con ese email');
    }

    // Verificar que el email no exista en la colección de Usuarios
    const Usuario = (await import('../models/Usuario.js')).default;
    const usuarioConMismoEmail = await Usuario.findOne({ email });
    if (usuarioConMismoEmail) {
      throw new Error('Ya existe un usuario con ese email');
    }

    // Crear el perfil profesional del barbero
    const nuevoBarbero = new Barbero({
      nombre,
      apellido,
      email,
      telefono,
      foto,
      especialidad,
      horarioLaboral: horarioLaboral || undefined,
    });

    await nuevoBarbero.save();

    // Crear la cuenta de usuario asociada
    const nuevoUsuario = new Usuario({
      nombre,
      apellido,
      email,
      telefono,
      password: password || 'barbero123', // Contraseña por defecto si no se proporciona
      rol: 'barbero',
      activo: true,
    });

    await nuevoUsuario.save();

    return nuevoBarbero;
  } catch (error) {
    throw new Error(`Error al crear barbero: ${error.message}`);
  }
};

/**
 * ACTUALIZAR BARBERO
 *
 * Modifica la información de un barbero existente.
 *
 * QUÉ PUEDE ACTUALIZARSE:
 * - Nombre y apellido
 * - Email (verificando que no esté en uso)
 * - Teléfono y foto
 * - Especialidad
 * - Horario laboral
 * - Estado activo/inactivo
 *
 * @param {string} identificadorDeBarbero - ID del barbero a actualizar
 * @param {object} datosNuevos - Nuevos datos del barbero
 * @returns {object} - Barbero actualizado
 * @throws {Error} - Si el barbero no existe o el email ya está en uso
 */
export const actualizar = async (identificadorDeBarbero, datosNuevos) => {
  try {
    // Extraer datos a actualizar
    const { nombre, apellido, email, telefono, foto, especialidad, horarioLaboral, activo, objetivoMensual } =
      datosNuevos;

    // Buscar el barbero
    const barberoAActualizar = await Barbero.findById(identificadorDeBarbero);

    if (!barberoAActualizar) {
      throw new Error('Barbero no encontrado');
    }

    // Si se está cambiando el email, verificar que no exista otro barbero con ese email
    if (email && email !== barberoAActualizar.email) {
      const emailYaEnUso = await Barbero.findOne({ email });
      if (emailYaEnUso) {
        throw new Error('Ya existe un barbero con ese email');
      }
    }

    // Actualizar solo los campos proporcionados
    if (nombre) barberoAActualizar.nombre = nombre;
    if (apellido) barberoAActualizar.apellido = apellido;
    if (email) barberoAActualizar.email = email;
    if (telefono) barberoAActualizar.telefono = telefono;
    if (foto) barberoAActualizar.foto = foto;
    if (especialidad) barberoAActualizar.especialidad = especialidad;
    if (horarioLaboral) barberoAActualizar.horarioLaboral = horarioLaboral;
    if (activo !== undefined) barberoAActualizar.activo = activo;
    if (objetivoMensual !== undefined) barberoAActualizar.objetivoMensual = objetivoMensual;

    // Guardar cambios
    await barberoAActualizar.save();

    return barberoAActualizar;
  } catch (error) {
    throw new Error(`Error al actualizar barbero: ${error.message}`);
  }
};

/**
 * ELIMINAR BARBERO
 *
 * Elimina permanentemente un barbero y su cuenta de usuario asociada.
 *
 * QUÉ HACE:
 * 1. Busca el barbero a eliminar
 * 2. Elimina la cuenta de usuario asociada (mismo email, rol 'barbero')
 * 3. Elimina el perfil profesional del barbero
 *
 * IMPORTANTE:
 * Esta es una eliminación PERMANENTE. Si solo quieres desactivar temporalmente
 * al barbero, usa la función actualizar() con activo: false.
 *
 * @param {string} identificadorDeBarbero - ID del barbero a eliminar
 * @returns {object} - Barbero eliminado
 * @throws {Error} - Si el barbero no existe
 */
export const eliminar = async (identificadorDeBarbero) => {
  try {
    // Buscar el barbero
    const barberoAEliminar = await Barbero.findById(identificadorDeBarbero);

    if (!barberoAEliminar) {
      throw new Error('Barbero no encontrado');
    }

    // Eliminar la cuenta de usuario asociada
    const Usuario = (await import('../models/Usuario.js')).default;
    await Usuario.deleteOne({ email: barberoAEliminar.email, rol: 'barbero' });

    // Eliminar el perfil del barbero
    await Barbero.findByIdAndDelete(identificadorDeBarbero);

    return barberoAEliminar;
  } catch (error) {
    throw new Error(`Error al eliminar barbero: ${error.message}`);
  }
};

/**
 * VERIFICAR DISPONIBILIDAD DE UN BARBERO
 *
 * Verifica si un barbero específico está disponible en una fecha/hora.
 *
 * QUÉ HACE:
 * Valida que el barbero exista y esté activo.
 *
 * NOTA:
 * Actualmente solo verifica que esté activo. Aquí se podría agregar
 * lógica adicional para verificar horarios laborales según el día de la semana.
 *
 * @param {string} identificadorDeBarbero - ID del barbero
 * @param {string} fecha - Fecha a verificar
 * @param {string} hora - Hora a verificar
 * @returns {boolean} - true si está disponible
 * @throws {Error} - Si el barbero no existe o no está activo
 */
export const verificarDisponibilidad = async (identificadorDeBarbero, fecha, hora) => {
  try {
    // Buscar el barbero
    const barberoEncontrado = await Barbero.findById(identificadorDeBarbero);

    if (!barberoEncontrado) {
      throw new Error('Barbero no encontrado');
    }

    if (!barberoEncontrado.activo) {
      throw new Error('El barbero no está activo');
    }

    // Aquí se podría agregar lógica adicional para verificar
    // el horario laboral del barbero según el día de la semana

    return true;
  } catch (error) {
    throw new Error(`Error al verificar disponibilidad: ${error.message}`);
  }
};

/**
 * OBTENER BARBEROS DISPONIBLES
 *
 * Devuelve la lista de barberos disponibles para una fecha y hora específica.
 *
 * QUÉ HACE:
 * 1. Obtiene todos los barberos activos
 * 2. Si se especifica fecha/hora, filtra los que tienen turnos ocupados
 * 3. Devuelve solo los barberos disponibles
 *
 * CÓMO FUNCIONA:
 * - Sin fecha/hora: devuelve todos los barberos activos
 * - Con fecha/hora: excluye los que tienen turnos en ese horario
 *
 * @param {string} fecha - Fecha a consultar (opcional)
 * @param {string} hora - Hora a consultar (opcional)
 * @returns {array} - Lista de barberos disponibles
 */
export const obtenerDisponibles = async (fecha, hora) => {
  try {
    // Importar el modelo de Turno
    const Turno = (await import('../models/Turno.js')).default;

    // Obtener todos los barberos activos
    const barberosActivos = await Barbero.find({ activo: true }).sort({ nombre: 1 });

    // Si no hay fecha y hora, retornar todos los barberos activos
    if (!fecha || !hora) {
      return barberosActivos;
    }

    // Preparar la fecha para la consulta
    const fechaAConsultar = new Date(fecha);
    fechaAConsultar.setHours(0, 0, 0, 0);

    // Buscar turnos ocupados en esa fecha y hora
    const turnosOcupados = await Turno.find({
      fecha: {
        $gte: fechaAConsultar,
        $lte: new Date(fechaAConsultar.getTime() + 24 * 60 * 60 * 1000),
      },
      hora,
      estado: { $in: ['pendiente', 'confirmado'] },
      barbero: { $ne: null }, // Solo turnos con barbero asignado
    });

    // Obtener IDs de barberos ocupados
    const identificadoresDeBarberosOcupados = turnosOcupados.map((turno) => turno.barbero.toString());

    // Filtrar barberos disponibles (los que NO están ocupados)
    const barberosDisponibles = barberosActivos.filter(
      (barbero) => !identificadoresDeBarberosOcupados.includes(barbero._id.toString())
    );

    return barberosDisponibles;
  } catch (error) {
    throw new Error(`Error al obtener barberos disponibles: ${error.message}`);
  }
};

// ===== EXPORTACIÓN =====

export default {
  obtenerTodos,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
  verificarDisponibilidad,
  obtenerDisponibles,
};
