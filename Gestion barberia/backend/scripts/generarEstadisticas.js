/**
 * ============================================================================
 * SCRIPT PARA GENERAR ESTADÍSTICAS DE TURNOS
 * ============================================================================
 *
 * Este script genera turnos para octubre y septiembre 2025
 * para visualizar estadísticas del admin y barbero
 *
 * USO:
 * node backend/scripts/generarEstadisticas.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { Turno, Barbero, Cliente, Servicio } from '../models/index.js';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde la raíz del backend
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Función para generar una fecha aleatoria en un rango de horas laborales
 */
const generarFechaAleatoria = (mes, anio) => {
  const diasDelMes = new Date(anio, mes, 0).getDate();
  let dia = Math.floor(Math.random() * diasDelMes) + 1;
  let fecha = new Date(anio, mes - 1, dia);

  // Evitar domingos
  while (fecha.getDay() === 0) {
    dia = Math.floor(Math.random() * diasDelMes) + 1;
    fecha = new Date(anio, mes - 1, dia);
  }

  // Horario laboral: 9:00 a 17:00
  const hora = Math.floor(Math.random() * 9) + 9; // 9 a 17
  const minuto = Math.random() < 0.5 ? 0 : 30;

  fecha.setHours(hora, minuto, 0, 0);
  return fecha;
};

/**
 * Función principal para generar estadísticas
 */
const generarEstadisticas = async () => {
  try {
    console.log('');
    console.log('='.repeat(70));
    console.log(' GENERACIÓN DE ESTADÍSTICAS ');
    console.log('='.repeat(70));
    console.log('');

    // Conectar a MongoDB
    console.log('🔄 Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conexión establecida');
    console.log('');

    // Obtener barberos, clientes y servicios
    const barberos = await Barbero.find({ activo: true });
    const clientes = await Cliente.find({ activo: true });
    const servicios = await Servicio.find({ activo: true });

    if (barberos.length === 0) {
      console.log('❌ No hay barberos en la base de datos');
      return;
    }

    if (clientes.length === 0) {
      console.log('❌ No hay clientes en la base de datos');
      return;
    }

    if (servicios.length === 0) {
      console.log('❌ No hay servicios en la base de datos');
      return;
    }

    console.log(`📊 Barberos disponibles: ${barberos.length}`);
    console.log(`📊 Clientes disponibles: ${clientes.length}`);
    console.log(`📊 Servicios disponibles: ${servicios.length}`);
    console.log('');

    // Eliminar turnos existentes de octubre y septiembre
    await Turno.deleteMany({
      fecha: {
        $gte: new Date(2025, 8, 1), // Septiembre 2025
        $lt: new Date(2025, 10, 1), // Noviembre 2025
      },
    });

    console.log('🗑️  Turnos anteriores de septiembre y octubre eliminados');
    console.log('');

    // Generar turnos
    const turnosACrear = [];
    const estados = [
      { estado: 'completado', peso: 60 },
      { estado: 'cancelado', peso: 15 },
      { estado: 'reservado', peso: 25 },
    ];

    // Generar 80 turnos para septiembre
    console.log('📅 Generando turnos para SEPTIEMBRE 2025...');
    for (let i = 0; i < 80; i++) {
      const barberoAleatorio = barberos[Math.floor(Math.random() * barberos.length)];
      const clienteAleatorio = clientes[Math.floor(Math.random() * clientes.length)];
      const servicioAleatorio = servicios[Math.floor(Math.random() * servicios.length)];

      // Seleccionar estado basado en peso
      const random = Math.random() * 100;
      let estadoSeleccionado;
      if (random < estados[0].peso) {
        estadoSeleccionado = 'completado';
      } else if (random < estados[0].peso + estados[1].peso) {
        estadoSeleccionado = 'cancelado';
      } else {
        estadoSeleccionado = 'reservado';
      }

      const fecha = generarFechaAleatoria(9, 2025); // Septiembre = mes 9
      const hora = `${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}`;

      turnosACrear.push({
        fecha,
        hora,
        barbero: barberoAleatorio._id,
        cliente: clienteAleatorio._id,
        servicio: servicioAleatorio._id,
        estado: estadoSeleccionado,
        precio: servicioAleatorio.precioBase,
      });
    }

    // Generar 100 turnos para octubre
    console.log('📅 Generando turnos para OCTUBRE 2025...');
    for (let i = 0; i < 100; i++) {
      const barberoAleatorio = barberos[Math.floor(Math.random() * barberos.length)];
      const clienteAleatorio = clientes[Math.floor(Math.random() * clientes.length)];
      const servicioAleatorio = servicios[Math.floor(Math.random() * servicios.length)];

      // Seleccionar estado basado en peso
      const random = Math.random() * 100;
      let estadoSeleccionado;
      if (random < estados[0].peso) {
        estadoSeleccionado = 'completado';
      } else if (random < estados[0].peso + estados[1].peso) {
        estadoSeleccionado = 'cancelado';
      } else {
        estadoSeleccionado = 'reservado';
      }

      const fecha = generarFechaAleatoria(10, 2025); // Octubre = mes 10
      const hora = `${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}`;

      turnosACrear.push({
        fecha,
        hora,
        barbero: barberoAleatorio._id,
        cliente: clienteAleatorio._id,
        servicio: servicioAleatorio._id,
        estado: estadoSeleccionado,
        precio: servicioAleatorio.precioBase,
      });
    }

    // Insertar todos los turnos
    await Turno.insertMany(turnosACrear);

    console.log('');
    console.log('✅ Turnos creados exitosamente');
    console.log('');

    // Mostrar resumen
    const turnosSeptiembre = turnosACrear.filter(
      (t) => t.fecha.getMonth() === 8
    );
    const turnosOctubre = turnosACrear.filter((t) => t.fecha.getMonth() === 9);

    console.log('='.repeat(70));
    console.log(' RESUMEN DE TURNOS GENERADOS ');
    console.log('='.repeat(70));
    console.log('');
    console.log('📅 SEPTIEMBRE 2025:');
    console.log(`   Total: ${turnosSeptiembre.length}`);
    console.log(
      `   Completados: ${turnosSeptiembre.filter((t) => t.estado === 'completado').length}`
    );
    console.log(
      `   Cancelados: ${turnosSeptiembre.filter((t) => t.estado === 'cancelado').length}`
    );
    console.log(
      `   Reservados: ${turnosSeptiembre.filter((t) => t.estado === 'reservado').length}`
    );
    console.log('');
    console.log('📅 OCTUBRE 2025:');
    console.log(`   Total: ${turnosOctubre.length}`);
    console.log(
      `   Completados: ${turnosOctubre.filter((t) => t.estado === 'completado').length}`
    );
    console.log(
      `   Cancelados: ${turnosOctubre.filter((t) => t.estado === 'cancelado').length}`
    );
    console.log(
      `   Reservados: ${turnosOctubre.filter((t) => t.estado === 'reservado').length}`
    );
    console.log('');
    console.log(`📊 TOTAL DE TURNOS: ${turnosACrear.length}`);
    console.log('');
    console.log('💡 Ahora puedes ver las estadísticas en el dashboard de admin y barbero');
    console.log('');
  } catch (error) {
    console.error('');
    console.error('='.repeat(70));
    console.error(' ERROR AL GENERAR ESTADÍSTICAS ');
    console.error('='.repeat(70));
    console.error('');
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('📝 Detalles completos:');
    console.error(error);
    console.error('');
  } finally {
    // Cerrar la conexión a la base de datos
    await mongoose.connection.close();
    console.log('🔌 Conexión a la base de datos cerrada');
    console.log('');
    console.log('='.repeat(70));
    console.log('');
  }
};

// Ejecutar el script
generarEstadisticas();
