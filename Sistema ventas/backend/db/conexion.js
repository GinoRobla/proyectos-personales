// Importa la clase Sequelize para manejar la conexión y los modelos
const { Sequelize } = require('sequelize');
// Importa path para construir rutas de archivos de forma segura
const path = require('path');

// Construye la ruta absoluta al archivo de la base de datos SQLite
const dbPath = path.join(__dirname, '..', 'data', 'sistema-pos.db');

// Crea una instancia de Sequelize configurada para SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',      // Especifica el motor de base de datos
    storage: dbPath,        // Ruta al archivo de la base de datos
    logging: false          // Desactiva el log de consultas SQL en consola
});

// Exporta la instancia para usarla en modelos y servicios
module.exports = sequelize;