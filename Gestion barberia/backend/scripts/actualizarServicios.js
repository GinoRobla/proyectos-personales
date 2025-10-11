/**
 * ============================================================================
 * SCRIPT: ACTUALIZAR SERVICIOS
 * ============================================================================
 *
 * Este script:
 * - Elimina el servicio de Coloración
 * - Actualiza todos los servicios para que duren 45 minutos
 *
 * USO:
 * node backend/scripts/actualizarServicios.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Servicio from '../models/Servicio.js';
import Turno from '../models/Turno.js';

dotenv.config();

const actualizarServicios = async () => {
  try {
    console.log('');
    console.log('='.repeat(60));
    console.log('🔧 ACTUALIZANDO SERVICIOS');
    console.log('='.repeat(60));
    console.log('');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // 1. Eliminar servicio de Coloración
    const coloracion = await Servicio.findOne({ nombre: 'Coloración' });
    if (coloracion) {
      // Eliminar turnos asociados a coloración
      await Turno.deleteMany({ servicio: coloracion._id });
      await Servicio.deleteOne({ _id: coloracion._id });
      console.log('✅ Servicio "Coloración" eliminado\n');
    }

    // 2. Actualizar duraciones de todos los servicios a 45 minutos
    await Servicio.updateMany(
      {},
      { $set: { duracion: 45 } }
    );
    console.log('✅ Todos los servicios ahora duran 45 minutos\n');

    // 3. Mostrar servicios actualizados
    const servicios = await Servicio.find({ activo: true });
    console.log('📋 Servicios actualizados:');
    servicios.forEach(s => {
      console.log(`   - ${s.nombre}: ${s.duracion} minutos - $${s.precioBase}`);
    });

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ SERVICIOS ACTUALIZADOS CORRECTAMENTE');
    console.log('='.repeat(60));
    console.log('');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

actualizarServicios();
