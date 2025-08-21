const saleService = require('../services/saleService');

const saleController = {
    // Crear nueva venta
    async createSale(req, res) {
        try {
            const saleData = req.body;
            const newSale = await saleService.crearVenta(saleData);
            res.status(201).json(newSale);
        } catch (error) {
            console.error('Error en createSale:', error);
            res.status(400).json({ message: error.message });
        }
    },

    // Obtener todas las ventas
    async getAllSales(req, res) {
        try {
            const sales = await saleService.obtenerTodasLasVentas();
            res.json(sales);
        } catch (error) {
            console.error('Error en getAllSales:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // Obtener venta por ID - Simplificado
    async getSaleById(req, res) {
        try {
            const { id } = req.params;
            const sales = await saleService.obtenerTodasLasVentas();
            const sale = sales.find(s => s.id == id);
            if (!sale) {
                return res.status(404).json({ message: 'Venta no encontrada' });
            }
            res.json(sale);
        } catch (error) {
            console.error('Error en getSaleById:', error);
            res.status(404).json({ message: error.message });
        }
    },

    // Obtener estadísticas de ventas
    async getSalesStats(req, res) {
        try {
            const stats = await saleService.obtenerEstadisticas();
            res.json(stats);
        } catch (error) {
            console.error('Error en getSalesStats:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // Obtener top productos más vendidos
    async getTopProducts(req, res) {
        try {
            const topProducts = await saleService.obtenerTopProductos();
            res.json(topProducts);
        } catch (error) {
            console.error('Error en getTopProducts:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // Obtener estadísticas por rango de fechas
    async getStatsByDateRange(req, res) {
        try {
            const { fechaInicio, fechaFin } = req.query;
            const stats = await saleService.obtenerEstadisticasPorFecha(fechaInicio, fechaFin);
            res.json(stats);
        } catch (error) {
            console.error('Error en getStatsByDateRange:', error);
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = saleController;