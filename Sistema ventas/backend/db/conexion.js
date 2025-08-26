// Importa la clase Sequelize para manejar la conexión y los modelos
const { Sequelize } = require('sequelize');
// Importa path para construir rutas de archivos de forma segura
const path = require('path');

let sequelize;

// Si existe DATABASE_URL, usar PostgreSQL
if (process.env.DATABASE_URL) {
    // Configuración para PostgreSQL
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });
} else {
    // Configuración local con SQLite
    const dbPath = path.join(__dirname, '..', 'data', 'sistema-pos.db');
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: dbPath,
        logging: false
    });
}

// Exporta la instancia para usarla en modelos y servicios
module.exports = sequelize;