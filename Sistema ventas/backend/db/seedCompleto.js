const seedProducts = require('./seedProducts');
const seedSales = require('./seedSales');
const db = require('./conexion');

function seedComplete() {
    console.log('--- 🌱 SEED COMPLETO ---');
    seedProducts(() => { // Ejecuta productos primero
        seedSales(() => { // Cuando termina, ejecuta ventas
            console.log('✅ Productos y ventas de ejemplo insertados');
            db.close();
        });
    });
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    seedComplete();
}

module.exports = seedComplete;
