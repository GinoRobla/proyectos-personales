/**
 * Modelo de Configuración del Negocio.
 * Almacena configuraciones generales de la barbería que el admin puede modificar.
 * Solo existe 1 registro en esta colección.
 */

import mongoose from 'mongoose';

const configuracionNegocioSchema = new mongoose.Schema(
  {
    nombreNegocio: {
      type: String,
      default: 'Mi Barbería',
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    direccion: {
      type: String,
      default: '',
      maxlength: [200, 'La dirección no puede exceder 200 caracteres'],
    },
    telefono: {
      type: String,
      default: '',
      maxlength: [20, 'El teléfono no puede exceder 20 caracteres'],
    },
    emailContacto: {
      type: String,
      default: '',
      match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
    },
    logoUrl: {
      type: String,
      default: null,
    },
    duracionTurnoMinutos: {
      type: Number,
      default: 45,
      enum: [30, 45, 60],
      required: [true, 'La duración del turno es obligatoria'],
    },
    diasBloqueadosPermanente: {
      type: [Number],
      default: [0], // 0 = Domingo bloqueado por defecto
      validate: {
        validator: function (dias) {
          return dias.every(dia => dia >= 0 && dia <= 6);
        },
        message: 'Los días deben estar entre 0 (Domingo) y 6 (Sábado)',
      },
    },
    horarios: {
      type: String,
      default: 'Lun-Vie: 9:00-20:00',
      maxlength: [200, 'Los horarios no pueden exceder 200 caracteres'],
    },
    redesSociales: {
      facebook: {
        type: String,
        default: '',
        maxlength: [200, 'URL demasiado larga'],
      },
      instagram: {
        type: String,
        default: '',
        maxlength: [200, 'URL demasiado larga'],
      },
      twitter: {
        type: String,
        default: '',
        maxlength: [200, 'URL demasiado larga'],
      },
      whatsapp: {
        type: String,
        default: '',
        maxlength: [200, 'URL demasiado larga'],
      },
    },

    // Configuración de señas y pagos
    senasActivas: {
      type: Boolean,
      default: false,
      description: 'Activar o desactivar el sistema completo de señas',
    },
    porcentajeSena: {
      type: Number,
      default: 30,
      min: [10, 'El porcentaje mínimo es 10%'],
      max: [100, 'El porcentaje máximo es 100%'],
      description: 'Porcentaje del precio del servicio que se cobra como seña',
    },
    politicaSenas: {
      type: String,
      enum: ['ninguno', 'todos', 'nuevos_clientes', 'servicios_premium'],
      default: 'ninguno',
      description: 'Política de aplicación de señas: ninguno, todos, nuevos_clientes, servicios_premium',
    },
    serviciosPremiumIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Servicio',
      default: [],
      description: 'IDs de servicios considerados premium que requieren seña',
    },

    // Credenciales de MercadoPago (IMPORTANTE: encriptar en producción)
    mercadoPagoAccessToken: {
      type: String,
      default: '',
      description: 'Access Token de MercadoPago para procesar pagos',
    },
    mercadoPagoPublicKey: {
      type: String,
      default: '',
      description: 'Public Key de MercadoPago (para uso en frontend si es necesario)',
    },

    // Políticas de cancelación y devolución
    horasAntesCancelacion: {
      type: Number,
      default: 24,
      min: [0, 'No puede ser negativo'],
      description: 'Horas de anticipación requeridas para cancelar y recibir devolución de seña',
    },
    permitirDevolucionSena: {
      type: Boolean,
      default: true,
      description: 'Permitir devolución de seña si se cancela con anticipación',
    },
  },
  { timestamps: true, versionKey: false }
);

// Solo puede haber UNA configuración
configuracionNegocioSchema.index({}, { unique: true });

// Campo virtual para obtener nombres de los días bloqueados
configuracionNegocioSchema.virtual('diasBloqueadosNombres').get(function () {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return this.diasBloqueadosPermanente.map(dia => dias[dia]);
});

configuracionNegocioSchema.set('toJSON', { virtuals: true });
configuracionNegocioSchema.set('toObject', { virtuals: true });

export default mongoose.model('ConfiguracionNegocio', configuracionNegocioSchema);
