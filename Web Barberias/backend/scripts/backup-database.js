/**
 * Script de Backup de MongoDB
 * Crea backups automáticos de la base de datos con timestamp
 *
 * Uso:
 *   node scripts/backup-database.js
 *
 * Para automatizar con cron (Linux):
 *   0 2 * * * cd /path/to/project && node backend/scripts/backup-database.js
 */

import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/barberia';
const BACKUP_DIR = path.join(__dirname, '../../backups');
const MAX_BACKUPS = 7; // Mantener últimos 7 backups

// Crear directorio de backups si no existe
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generar nombre de backup con timestamp
const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
const backupName = `backup-${timestamp}`;
const backupPath = path.join(BACKUP_DIR, backupName);

console.log('🔄 Iniciando backup de MongoDB...');
console.log(`📁 Destino: ${backupPath}`);

// Ejecutar mongodump
const command = `mongodump --uri="${MONGODB_URI}" --out="${backupPath}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error al crear backup:', error.message);
    process.exit(1);
  }

  if (stderr) {
    console.error('⚠️ Advertencia:', stderr);
  }

  console.log('✅ Backup completado exitosamente!');
  console.log(`📦 Tamaño del backup: ${getDirectorySize(backupPath)} MB`);

  // Limpiar backups antiguos
  cleanOldBackups();
});

/**
 * Obtener tamaño de directorio en MB
 */
function getDirectorySize(dirPath) {
  let totalSize = 0;

  const files = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dirPath, file.name);

    if (file.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    } else {
      totalSize += fs.statSync(filePath).size;
    }
  }

  return (totalSize / (1024 * 1024)).toFixed(2);
}

/**
 * Eliminar backups antiguos (mantener solo los últimos MAX_BACKUPS)
 */
function cleanOldBackups() {
  const backups = fs
    .readdirSync(BACKUP_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && dirent.name.startsWith('backup-'))
    .map((dirent) => ({
      name: dirent.name,
      path: path.join(BACKUP_DIR, dirent.name),
      time: fs.statSync(path.join(BACKUP_DIR, dirent.name)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time); // Ordenar por más reciente primero

  // Si hay más backups que MAX_BACKUPS, eliminar los más antiguos
  if (backups.length > MAX_BACKUPS) {
    const toDelete = backups.slice(MAX_BACKUPS);

    console.log(`\n🧹 Limpiando backups antiguos (mantener ${MAX_BACKUPS})...`);

    for (const backup of toDelete) {
      fs.rmSync(backup.path, { recursive: true, force: true });
      console.log(`  ❌ Eliminado: ${backup.name}`);
    }

    console.log(`✅ Limpieza completada!`);
  }

  console.log(`\n📊 Backups disponibles: ${Math.min(backups.length, MAX_BACKUPS)}`);
}
