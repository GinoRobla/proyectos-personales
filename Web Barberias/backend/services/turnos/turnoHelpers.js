/**
 * turnoHelpers.js
 * Funciones auxiliares compartidas entre módulos de turnos
 * Esto evita importaciones circulares
 */

/**
 * Helper para crear rango de fecha completo (de 00:00 a 23:59)
 */
export const _crearRangoFechaDia = (fechaString) => {
  // Parsea el string (ej: "2025-10-20")
  const [año, mes, dia] = fechaString.split('T')[0].split('-').map(Number);

  // Crea el inicio del día en UTC (ej: 20-10-2025 00:00:00Z)
  const inicioDia = new Date(Date.UTC(año, mes - 1, dia, 0, 0, 0, 0));
  // Crea el fin del día en UTC (ej: 20-10-2025 23:59:59Z)
  const finDia = new Date(Date.UTC(año, mes - 1, dia, 23, 59, 59, 999));

  console.log('[DEBUG _crearRangoFechaDia] Input:', fechaString);
  console.log('[DEBUG _crearRangoFechaDia] Parsed:', { año, mes, dia });
  console.log('[DEBUG _crearRangoFechaDia] Range:', { inicioDia, finDia });

  // Devuelve el objeto de filtro para Mongoose
  return { $gte: inicioDia, $lte: finDia };
};

/**
 * Helper para verificar conflictos de horarios
 */
export const _verificarConflicto = (turnoNuevo, turnosExistentes, duracionTurno) => {
  if (!turnoNuevo?.hora) return false;

  const [hN, mN] = turnoNuevo.hora.split(':').map(Number);
  const inicioN = hN * 60 + mN;
  const finN = inicioN + duracionTurno;

  for (const turnoE of turnosExistentes) {
    if (!turnoE?.hora) continue;
    const [hE, mE] = turnoE.hora.split(':').map(Number);
    const inicioE = hE * 60 + mE;
    const finE = inicioE + duracionTurno;

    // Lógica de superposición
    if (inicioN < finE && finN > inicioE) {
      return true; // Hay conflicto
    }
  }
  return false; // Sin conflicto
};
