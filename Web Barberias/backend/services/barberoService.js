import Barbero from '../models/Barbero.js';
import Usuario from '../models/Usuario.js';
import Turno from '../models/Turno.js';
import { validarTelefonoArgentino } from '../utils/phoneValidator.js';

// Obtiene todos los barberos, con opción de filtrar por estado.
export const obtenerTodos = (filtros = {}) => {
  const consulta = filtros.activo !== undefined ? { activo: filtros.activo } : {};
  return Barbero.find(consulta).sort({ nombre: 1 });
};

// Obtiene un barbero por su ID.
export const obtenerPorId = async (barberoId) => {
  const barbero = await Barbero.findById(barberoId);
  if (!barbero) {
    throw new Error('Barbero no encontrado');
  }
  return barbero;
};

// Crea un nuevo perfil de barbero y su cuenta de usuario asociada.
export const crear = async (datosBarbero) => {
  const { nombre, apellido, email, telefono, foto, password } = datosBarbero;

  if (!nombre || !apellido || !email || !telefono) {
    throw new Error('Faltan campos obligatorios');
  }

  // Validar y normalizar teléfono
  const resultadoTelefono = validarTelefonoArgentino(telefono);
  if (!resultadoTelefono.valido) {
    throw new Error(resultadoTelefono.error);
  }

  const [barberoExistente, usuarioExistente] = await Promise.all([
    Barbero.findOne({ email }),
    Usuario.findOne({ email }),
  ]);

  if (barberoExistente || usuarioExistente) {
    throw new Error('El email ya está en uso');
  }

  const nuevoUsuario = new Usuario({
    nombre,
    apellido,
    email,
    telefono: resultadoTelefono.numeroNormalizado,
    password: password || 'barbero123',
    rol: 'barbero',
    activo: true,
  });

  await nuevoUsuario.save();

  const nuevoBarbero = new Barbero({
    usuario: nuevoUsuario._id,
    nombre,
    apellido,
    email,
    telefono: resultadoTelefono.numeroNormalizado,
    foto
  });

  await nuevoBarbero.save();
  return nuevoBarbero;
};

// Actualiza la información de un barbero y su usuario asociado.
export const actualizar = async (barberoId, datos) => {
  const barbero = await Barbero.findById(barberoId);
  if (!barbero) {
    throw new Error('Barbero no encontrado');
  }

  // Validar y normalizar teléfono si se proporciona
  let telefonoNormalizado = null;
  if (datos.telefono) {
    const resultadoTelefono = validarTelefonoArgentino(datos.telefono);
    if (!resultadoTelefono.valido) {
      throw new Error(resultadoTelefono.error);
    }
    telefonoNormalizado = resultadoTelefono.numeroNormalizado;
  }

  const usuario = await Usuario.findOne({ email: barbero.email, rol: 'barbero' });

  // Si se cambia el email, verificar que no esté en uso y actualizar ambos documentos.
  if (datos.email && datos.email !== barbero.email) {
    const emailExistente = await Usuario.findOne({ email: datos.email });
    if (emailExistente) {
      throw new Error('El email ya está en uso');
    }
    barbero.email = datos.email;
    if (usuario) usuario.email = datos.email;
  }

  // Actualizar campos compartidos en el usuario
  if (usuario) {
    if (datos.nombre) usuario.nombre = datos.nombre;
    if (datos.apellido) usuario.apellido = datos.apellido;
    if (telefonoNormalizado) usuario.telefono = telefonoNormalizado;
    if (datos.activo !== undefined) usuario.activo = datos.activo;
    // Actualizar contraseña si se proporciona
    if (datos.password) {
      usuario.password = datos.password;
    }
  }

  // Actualizar campos del barbero
  if (datos.nombre) barbero.nombre = datos.nombre;
  if (datos.apellido) barbero.apellido = datos.apellido;
  if (telefonoNormalizado) barbero.telefono = telefonoNormalizado;
  if (datos.foto) barbero.foto = datos.foto;
  if (datos.activo !== undefined) barbero.activo = datos.activo;
  if (datos.objetivoMensual !== undefined) barbero.objetivoMensual = datos.objetivoMensual;

  await Promise.all([barbero.save(), usuario?.save()]);
  return barbero;
};

// Elimina un barbero y su cuenta de usuario asociada.
export const eliminar = async (barberoId) => {
  const barbero = await Barbero.findByIdAndDelete(barberoId);
  if (!barbero) {
    throw new Error('Barbero no encontrado');
  }
  await Usuario.deleteOne({ email: barbero.email, rol: 'barbero' });
  return barbero;
};

// Verifica si un barbero está disponible en una fecha y hora específicas.
export const verificarDisponibilidad = async (barberoId) => {
  const barbero = await Barbero.findById(barberoId);
  if (!barbero) {
    throw new Error('Barbero no encontrado');
  }
  if (!barbero.activo) {
    throw new Error('El barbero no está activo');
  }
  return true;
};

// Obtiene los barberos disponibles para una fecha y hora dadas.
export const obtenerDisponibles = async (fecha, hora) => {
  const barberosActivos = await Barbero.find({ activo: true }).sort({ nombre: 1 });
  if (!fecha || !hora) {
    return barberosActivos;
  }

  const fechaInicio = new Date(fecha);
  fechaInicio.setUTCHours(0, 0, 0, 0);
  const fechaFin = new Date(fechaInicio);
  fechaFin.setDate(fechaFin.getDate() + 1);

  const turnos = await Turno.find({
    fecha: { $gte: fechaInicio, $lt: fechaFin },
    hora,
    estado: 'reservado',
  }).select('barbero');

  const idsBarberosOcupados = new Set(turnos.map((turno) => turno.barbero?.toString()));
  return barberosActivos.filter((barbero) => !idsBarberosOcupados.has(barbero._id.toString()));
};

export default {
  obtenerTodos,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
  verificarDisponibilidad,
  obtenerDisponibles,
};
