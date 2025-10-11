/**
 * ============================================================================
 * ÍNDICE DE MODELOS (EXPORTACIÓN CENTRALIZADA)
 * ============================================================================
 *
 * Este archivo sirve como punto central de exportación para todos los modelos
 * de la base de datos de la barbería.
 *
 * QUÉ ES ESTE ARCHIVO:
 * Es un "barril" (barrel) que reúne todos los modelos en un solo lugar
 * para facilitar las importaciones en otros archivos.
 *
 * POR QUÉ EXISTE:
 * En lugar de importar cada modelo individualmente desde su archivo:
 *   import Usuario from './models/Usuario.js';
 *   import Barbero from './models/Barbero.js';
 *   import Cliente from './models/Cliente.js';
 *   etc...
 *
 * Podemos importar todos desde un solo lugar:
 *   import { Usuario, Barbero, Cliente, Servicio, Turno } from './models/index.js';
 *
 * BENEFICIOS:
 * - Código más limpio y organizado
 * - Importaciones más cortas
 * - Un solo punto de mantenimiento si cambian las rutas de los modelos
 * - Facilita ver todos los modelos disponibles en el sistema
 *
 * MODELOS INCLUIDOS:
 * - Usuario: Usuarios del sistema (clientes, barberos, admins)
 * - Barbero: Información profesional de los barberos
 * - Cliente: Información de los clientes
 * - Servicio: Servicios ofrecidos por la barbería (corte, barba, etc.)
 * - Turno: Reservas de turnos
 */

// ===== IMPORTACIÓN DE MODELOS =====

// Modelo de Usuario (autenticación y roles)
import Usuario from './Usuario.js';

// Modelo de Barbero (perfiles profesionales)
import Barbero from './Barbero.js';

// Modelo de Cliente (información de clientes)
import Cliente from './Cliente.js';

// Modelo de Servicio (servicios de la barbería)
import Servicio from './Servicio.js';

// Modelo de Turno (reservas y citas)
import Turno from './Turno.js';

// ===== EXPORTACIÓN CENTRALIZADA =====

/**
 * Exportamos todos los modelos para que puedan ser importados desde otros archivos.
 *
 * EJEMPLO DE USO:
 * import { Usuario, Barbero, Turno } from './models/index.js';
 *
 * const usuario = await Usuario.findById(id);
 * const barberos = await Barbero.find({ activo: true });
 * const turnos = await Turno.find({ fecha: hoy });
 */
export { Usuario, Barbero, Cliente, Servicio, Turno };
