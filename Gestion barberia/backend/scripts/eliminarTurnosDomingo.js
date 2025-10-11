import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Turno from '../models/Turno.js';

dotenv.config();

const eliminar = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    const result = await Turno.deleteMany({
      fecha: new Date('2025-10-12')
    });

    console.log(`✅ Turnos eliminados del domingo 12/10/2025: ${result.deletedCount}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

eliminar();
