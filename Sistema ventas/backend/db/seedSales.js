// Importa la conexión Sequelize y los modelos Sale y Product
const sequelize = require('./conexion');
const { Sale } = require('../models/Sale');
const { Product } = require('../models/Product');

// Función principal para crear la tabla y poblarla con ventas de ejemplo
async function crearTablaYSeed() {
    try {
        await sequelize.sync(); // Crea las tablas Sale y Product si no existen

        // Obtiene todos los productos para asociar ventas
        const productos = await Product.findAll();
        if (!productos.length) {
            console.log('⚠️ No hay productos. Ejecuta primero el seed de productos');
            return;
        }

        // Array de ventas de ejemplo con diferentes fechas y montos
        const ventasSeed = [
            { diasAntes: 0, monto: 1000 },
            { diasAntes: 1, monto: 2000 },
            { diasAntes: 3, monto: 3000 },
            { diasAntes: new Date().getDate() - 1, monto: 4000 },
            { diasAntes: new Date().getDate() + new Date().getMonth() * 30, monto: 5000 }
        ];

        // Inserta cada venta asociada al primer producto encontrado
        for (const ventaSeed of ventasSeed) {
            const producto = productos[0];
            const items = [{
                productId: producto.id,
                productName: producto.name,
                barcode: producto.barcode,
                price: producto.price,
                quantity: 1,
                subtotal: ventaSeed.monto
            }];
            // Calcula la fecha de la venta según el parámetro diasAntes
            const fechaVenta = new Date();
            fechaVenta.setDate(fechaVenta.getDate() - ventaSeed.diasAntes);
            fechaVenta.setHours(12, 0, 0, 0);

            // Inserta la venta en la base de datos
            await Sale.create({
                total: ventaSeed.monto,
                items: JSON.stringify(items),
                createdAt: fechaVenta.toISOString()
            });
        }
        console.log('✅ Seed de ventas insertado correctamente');
    } catch (err) {
        console.error('❌ Error en el seed de ventas:', err.message);
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