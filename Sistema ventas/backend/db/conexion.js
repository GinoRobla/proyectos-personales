// Importa la clase Sequelize para manejar la conexión y los modelos
const { Sequelize } = require('sequelize');
// Importa path para construir rutas de archivos de forma segura
const path = require('path');

let sequelize;

// Si existe DATABASE_URL (producción con PostgreSQL)
if (process.env.DATABASE_URL) {
    // Configuración para PostgreSQL en Railway/Producción
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Necesario para Railway
            }
        }
    });
} else {
    // Configuración local con SQLite (desarrollo)
    const dbPath = path.join(__dirname, '..', 'data', 'sistema-pos.db');
    sequelize = new Sequelize({
        dialect: 'sqlite',      // Especifica el motor de base de datos
        storage: dbPath,        // Ruta al archivo de la base de datos
        logging: false          // Desactiva el log de consultas SQL en consola
    });
}

// Exporta la instancia para usarla en modelos y servicios
module.exports = sequelize;