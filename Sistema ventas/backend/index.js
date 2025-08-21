// ===== SERVIDOR BACKEND PRINCIPAL =====
// Este archivo inicia el servidor Express, importa modelos y rutas, y deja todo listo para funcionar en cualquier PC.

// Cargar variables de entorno desde .env
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const sequelize = require('./db/conexion');

// Importar modelos para que Sequelize los registre antes de sync
require('./models/Product');
require('./models/Sale');

// Crear la app de Express
const app = express();
app.use(cors());
app.use(express.json());

// Importar y usar rutas
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);

// Puerto y host configurables por variable de entorno
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1';

async function startServer() {
    try {
        await sequelize.sync(); // Sincroniza modelos con la base de datos
        app.listen(PORT, HOST, () => {
            console.log(`\u2705 Backend escuchando en http://${HOST}:${PORT}`);
        });
    } catch (err) {
        console.error('❌ Error al sincronizar la base de datos:', err.message);
        process.exit(1);
    }
}

startServer();