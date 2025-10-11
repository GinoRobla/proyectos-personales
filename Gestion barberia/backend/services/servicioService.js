/**
 * ============================================================================
 * SERVICIO DE SERVICIOS (Lógica de Negocio)
 * ============================================================================
 *
 * Este archivo contiene toda la lógica de negocio relacionada con los servicios
 * que ofrece la barbería (corte de cabello, afeitado, barba, etc.).
 *
 * QUÉ ES UN SERVICIO:
 * Un servicio es un tipo de atención que la barbería ofrece a sus clientes.
 * Cada servicio tiene un nombre, descripción, duración y precio base.
 *
 * RESPONSABILIDADES DE ESTE ARCHIVO:
 * - Crear nuevos servicios
 * - Listar servicios (activos/inactivos)
 * - Obtener información de un servicio específico
 * - Actualizar servicios existentes
 * - Desactivar servicios (soft delete)
 * - Calcular precios finales (con potencial lógica de descuentos)
 *
 * EJEMPLOS DE SERVICIOS:
 * - Corte de cabello (duración: 30 min, precio: $500)
 * - Afeitado completo (duración: 20 min, precio: $300)
 * - Corte + barba (duración: 45 min, precio: $700)
 */

import Servicio from '../models/Servicio.js';

// ===== FUNCIONES PRINCIPALES =====

/**
 * OBTENER TODOS LOS SERVICIOS
 *
 * Lista todos los servicios de la barbería con opciones de filtrado.
 *
 * QUÉ HACE:
 * Devuelve una lista de servicios ordenada alfabéticamente por nombre.
 * Puede filtrar por servicios activos o inactivos.
 *
 * FILTROS:
 * - activo: true para solo servicios activos, false para inactivos
 *
 * @param {object} filtros - Criterios de búsqueda
 * @returns {array} - Lista de servicios encontrados
 */
export const obtenerTodos = async (filtros = {}) => {
  try {
    // Construir consulta de búsqueda
    const consultaDeBusqueda = {};

    // Filtrar por estado activo si se especifica
    if (filtros.activo !== undefined) {
      consultaDeBusqueda.activo = filtros.activo;
    }

    // Buscar servicios y ordenar alfabéticamente
    const serviciosEncontrados = await Servicio.find(consultaDeBusqueda).sort({ nombre: 1 });

    return serviciosEncontrados;
  } catch (error) {
    throw new Error(`Error al obtener servicios: ${error.message}`);
  }
};

/**
 * OBTENER SERVICIO POR ID
 *
 * Busca y devuelve un servicio específico por su ID.
 *
 * @param {string} identificadorDeServicio - ID del servicio a buscar
 * @returns {object} - Servicio encontrado
 * @throws {Error} - Si el servicio no existe
 */
export const obtenerPorId = async (identificadorDeServicio) => {
  try {
    // Buscar el servicio
    const servicioEncontrado = await Servicio.findById(identificadorDeServicio);

    // Verificar que exista
    if (!servicioEncontrado) {
      throw new Error('Servicio no encontrado');
    }

    return servicioEncontrado;
  } catch (error) {
    throw new Error(`Error al obtener servicio: ${error.message}`);
  }
};

/**
 * CREAR NUEVO SERVICIO
 *
 * Crea un nuevo servicio en el catálogo de la barbería.
 *
 * QUÉ HACE:
 * 1. Valida que todos los campos obligatorios estén presentes
 * 2. Verifica que no exista otro servicio con el mismo nombre
 * 3. Crea el servicio en la base de datos
 * 4. Devuelve el servicio creado
 *
 * VALIDACIONES:
 * - Nombre único (no puede haber dos servicios con el mismo nombre)
 * - Todos los campos obligatorios deben estar presentes
 *
 * @param {object} datosDelServicio - Información del servicio a crear
 * @param {string} datosDelServicio.nombre - Nombre del servicio
 * @param {string} datosDelServicio.descripcion - Descripción del servicio
 * @param {number} datosDelServicio.duracion - Duración en minutos
 * @param {number} datosDelServicio.precioBase - Precio base del servicio
 * @param {string} [datosDelServicio.imagen] - URL de la imagen (opcional)
 * @returns {object} - Servicio creado
 * @throws {Error} - Si faltan datos o el nombre ya existe
 */
export const crear = async (datosDelServicio) => {
  try {
    // Extraer datos
    const { nombre, descripcion, duracion, precioBase, imagen } = datosDelServicio;

    // Validar campos obligatorios
    const faltanCampos = !nombre || !descripcion || !duracion || precioBase === undefined;
    if (faltanCampos) {
      throw new Error('Faltan campos obligatorios');
    }

    // Verificar que el nombre sea único
    const servicioConMismoNombre = await Servicio.findOne({ nombre });
    if (servicioConMismoNombre) {
      throw new Error('Ya existe un servicio con ese nombre');
    }

    // Crear el servicio
    const nuevoServicio = new Servicio({
      nombre,
      descripcion,
      duracion,
      precioBase,
      imagen,
    });

    await nuevoServicio.save();

    return nuevoServicio;
  } catch (error) {
    throw new Error(`Error al crear servicio: ${error.message}`);
  }
};

/**
 * ACTUALIZAR SERVICIO
 *
 * Modifica la información de un servicio existente.
 *
 * QUÉ PUEDE ACTUALIZARSE:
 * - Nombre (verificando que no esté en uso por otro servicio)
 * - Descripción
 * - Duración en minutos
 * - Precio base
 * - Imagen
 * - Estado activo/inactivo
 *
 * @param {string} identificadorDeServicio - ID del servicio a actualizar
 * @param {object} datosNuevos - Nuevos datos del servicio
 * @returns {object} - Servicio actualizado
 * @throws {Error} - Si el servicio no existe o el nombre ya está en uso
 */
export const actualizar = async (identificadorDeServicio, datosNuevos) => {
  try {
    // Extraer datos a actualizar
    const { nombre, descripcion, duracion, precioBase, imagen, activo } = datosNuevos;

    // Buscar el servicio
    const servicioAActualizar = await Servicio.findById(identificadorDeServicio);

    if (!servicioAActualizar) {
      throw new Error('Servicio no encontrado');
    }

    // Si se está cambiando el nombre, verificar que no exista otro servicio con ese nombre
    if (nombre && nombre !== servicioAActualizar.nombre) {
      const nombreYaEnUso = await Servicio.findOne({ nombre });
      if (nombreYaEnUso) {
        throw new Error('Ya existe un servicio con ese nombre');
      }
    }

    // Actualizar solo los campos proporcionados
    if (nombre) servicioAActualizar.nombre = nombre;
    if (descripcion) servicioAActualizar.descripcion = descripcion;
    if (duracion) servicioAActualizar.duracion = duracion;
    if (precioBase !== undefined) servicioAActualizar.precioBase = precioBase;
    if (imagen) servicioAActualizar.imagen = imagen;
    if (activo !== undefined) servicioAActualizar.activo = activo;

    // Guardar cambios
    await servicioAActualizar.save();

    return servicioAActualizar;
  } catch (error) {
    throw new Error(`Error al actualizar servicio: ${error.message}`);
  }
};

/**
 * ELIMINAR SERVICIO (SOFT DELETE)
 *
 * Desactiva un servicio sin eliminarlo de la base de datos.
 *
 * QUÉ HACE:
 * En lugar de eliminar permanentemente el servicio, solo lo marca como
 * inactivo (activo: false). Esto permite mantener el historial de turnos
 * que usaron este servicio.
 *
 * POR QUÉ SOFT DELETE:
 * - Preserva el historial de turnos pasados
 * - Permite reactivar el servicio en el futuro
 * - Mantiene la integridad referencial de la base de datos
 *
 * @param {string} identificadorDeServicio - ID del servicio a eliminar
 * @returns {object} - Servicio desactivado
 * @throws {Error} - Si el servicio no existe
 */
export const eliminar = async (identificadorDeServicio) => {
  try {
    // Buscar el servicio
    const servicioAEliminar = await Servicio.findById(identificadorDeServicio);

    if (!servicioAEliminar) {
      throw new Error('Servicio no encontrado');
    }

    // Desactivar en lugar de eliminar
    servicioAEliminar.activo = false;
    await servicioAEliminar.save();

    return servicioAEliminar;
  } catch (error) {
    throw new Error(`Error al eliminar servicio: ${error.message}`);
  }
};

/**
 * CALCULAR PRECIO FINAL
 *
 * Calcula el precio final de un servicio (con potencial lógica de descuentos).
 *
 * QUÉ HACE:
 * Actualmente devuelve el precio base del servicio.
 * En el futuro se puede agregar lógica para:
 * - Aplicar descuentos por promociones
 * - Recargos por horarios especiales
 * - Precios diferenciados por barbero
 * - Combos de servicios
 *
 * EJEMPLO DE EXTENSIÓN:
 * if (opciones.descuento) {
 *   precioFinal = precioFinal * (1 - opciones.descuento / 100);
 * }
 *
 * @param {string} identificadorDeServicio - ID del servicio
 * @param {object} [opciones={}] - Opciones adicionales para cálculo
 * @returns {number} - Precio final calculado
 * @throws {Error} - Si el servicio no existe
 */
export const calcularPrecio = async (identificadorDeServicio, opciones = {}) => {
  try {
    // Buscar el servicio
    const servicioEncontrado = await Servicio.findById(identificadorDeServicio);

    if (!servicioEncontrado) {
      throw new Error('Servicio no encontrado');
    }

    // Por ahora retornamos el precio base
    // Aquí se puede agregar lógica de descuentos, recargos, etc.
    let precioFinal = servicioEncontrado.precioBase;

    return precioFinal;
  } catch (error) {
    throw new Error(`Error al calcular precio: ${error.message}`);
  }
};

// ===== EXPORTACIÓN =====

export default {
  obtenerTodos,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
  calcularPrecio,
};
