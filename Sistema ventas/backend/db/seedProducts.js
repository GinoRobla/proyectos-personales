// Importa la conexión Sequelize y el modelo Product
const sequelize = require('./conexion');
const { Product } = require('../models/Product');

// Array de productos de ejemplo para insertar en la base de datos
const productos = [
    { name: "Arroz 1kg", price: 1250.00, stock: 120, barcode: "7501000000001", image: null },
    { name: "Jugo de Durazno 1L", price: 1800.00, stock: 40, barcode: "7791000000006", image: null }
];

// Función principal para crear la tabla y poblarla con productos de ejemplo
async function crearTablaYSeed() {
    try {
        await sequelize.sync(); // Crea la tabla Product si no existe
        // Inserta cada producto, evitando duplicados por barcode
        for (const producto of productos) {
            await Product.findOrCreate({ where: { barcode: producto.barcode }, defaults: producto });
        }
        console.log('✅ Productos de ejemplo insertados');
    } catch (err) {
        console.error('❌ Error en el seed de productos:', err.message);
    } finally {
        await sequelize.close(); // Cierra la conexión a la base de datos
    }
}

// Si el archivo se ejecuta directamente, corre la función de seed
if (require.main === module) {
    crearTablaYSeed();
}

// Exporta la función para poder llamarla desde otros scripts si es necesario
module.exports = crearTablaYSeed;