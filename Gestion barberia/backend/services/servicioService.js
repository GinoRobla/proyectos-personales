import Servicio from '../models/Servicio.js';

/**
 * OBTENER TODOS LOS SERVICIOS
 * Lista todos los servicios, con un filtro opcional para ver activos/inactivos.
 */
export const obtenerTodos = async (filtros = {}) => {
  try {
    const { activo } = filtros;

    // 1. Prepara la query (consulta)
    const query = {};
    
    // 2. Si el filtro 'activo' (true o false) fue enviado, lo añade a la query
    if (activo !== undefined) {
      query.activo = activo;
    }

    // 3. Busca en la DB con la query y ordena por nombre (A-Z)
    const servicios = await Servicio.find(query).sort({ nombre: 1 });
    
    return servicios;
  } catch (error) {
    throw new Error(`Error al obtener servicios: ${error.message}`);
  }
};

/**
 * OBTENER SERVICIO POR ID
 * Busca un servicio usando su ID de MongoDB.
 */
export const obtenerPorId = async (servicioId) => {
  try {
    // 1. Busca el servicio por su ID
    const servicio = await Servicio.findById(servicioId);

    // 2. Si no lo encuentra, lanza un error
    if (!servicio) {
      throw new Error('Servicio no encontrado');
    }

    return servicio;
  } catch (error) {
    throw new Error(`Error al obtener servicio: ${error.message}`);
  }
};

/**
 * CREAR NUEVO SERVICIO
 * Añade un nuevo servicio al catálogo.
 */
export const crear = async (datosDelServicio) => {
  try {
    const { nombre, descripcion, duracion, precioBase, imagen } = datosDelServicio;

    // 1. Valida que los campos principales existan
    // (precioBase === undefined) se usa por si el precio es 0, que es un valor válido
    if (!nombre || !descripcion || !duracion || precioBase === undefined) {
      throw new Error('Faltan campos obligatorios');
    }

    // 2. Valida que el nombre no esté repetido
    const servicioExistente = await Servicio.findOne({ nombre });
    if (servicioExistente) {
      throw new Error('Ya existe un servicio con ese nombre');
    }

    // 3. Crea y guarda el nuevo servicio en la DB
    // .create() es un atajo para new Servicio(...) + .save()
    const nuevoServicio = await Servicio.create({
      nombre,
      descripcion,
      duracion,
      precioBase,
      imagen,
    });

    return nuevoServicio;
  } catch (error) {
    throw new Error(`Error al crear servicio: ${error.message}`);
  }
};

/**
 * ACTUALIZAR SERVICIO
 * Modifica un servicio existente.
 */
export const actualizar = async (servicioId, datosNuevos) => {
  try {
    // 1. Busca el servicio que queremos editar
    const servicio = await Servicio.findById(servicioId);
    if (!servicio) {
      throw new Error('Servicio no encontrado');
    }

    const { nombre, descripcion, duracion, precioBase, imagen, activo } = datosNuevos;

    // 2. Valida si se cambió el nombre, que no esté repetido
    if (nombre && nombre !== servicio.nombre) {
      const nombreYaEnUso = await Servicio.findOne({ nombre });
      if (nombreYaEnUso) {
        throw new Error('Ya existe un servicio con ese nombre');
      }
    }

    // 3. Actualiza solo los campos que vinieron en 'datosNuevos'
    if (nombre) servicio.nombre = nombre;
    if (descripcion) servicio.descripcion = descripcion;
    if (duracion) servicio.duracion = duracion;
    if (precioBase !== undefined) servicio.precioBase = precioBase;
    if (imagen) servicio.imagen = imagen;
    if (activo !== undefined) servicio.activo = activo;

    // 4. Guarda los cambios en la DB
    // Usamos .save() para que se disparen las validaciones del modelo
    await servicio.save();

    return servicio;
  } catch (error) {
    throw new Error(`Error al actualizar servicio: ${error.message}`);
  }
};

/**
 * ELIMINAR SERVICIO (SOFT DELETE)
 * Desactiva un servicio (lo marca como activo: false) en lugar de borrarlo.
 * Esto mantiene el historial de turnos que usaron este servicio.
 */
export const eliminar = async (servicioId) => {
  try {
    // 1. Busca el servicio
    const servicio = await Servicio.findById(servicioId);
    if (!servicio) {
      throw new Error('Servicio no encontrado');
    }

    // 2. Marca como inactivo (Soft Delete)
    servicio.activo = false;
    
    // 3. Guarda el cambio
    await servicio.save();

    return servicio;
  } catch (error) {
    throw new Error(`Error al eliminar servicio: ${error.message}`);
  }
};

/**
 * CALCULAR PRECIO FINAL
 * Obtiene el precio de un servicio.
 * (Preparado para lógica futura de descuentos o recargos)
 */
export const calcularPrecio = async (servicioId, opciones = {}) => {
  try {
    // 1. Busca el servicio
    const servicio = await Servicio.findById(servicioId);
    if (!servicio) {
      throw new Error('Servicio no encontrado');
    }

    // 2. Por ahora, el precio final es el precio base
    let precioFinal = servicio.precioBase;

    // (Aquí se podría agregar lógica de descuentos, ej:
    // if (opciones.descuento) { precioFinal *= 0.90; }
    // )

    return precioFinal;
  } catch (error) {
    throw new Error(`Error al calcular precio: ${error.message}`);
  }
};