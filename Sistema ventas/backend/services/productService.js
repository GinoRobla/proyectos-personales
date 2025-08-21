// ===== SERVICIO DE PRODUCTOS =====

const { Product } = require('../models/Product');
const { Op } = require('sequelize');

// 1. OBTENER TODOS LOS PRODUCTOS (ordenados por nombre)
async function obtenerTodosLosProductos() {
    return await Product.findAll({ order: [['name', 'ASC']] });
}

// 2. BUSCAR UN PRODUCTO POR SU CÓDIGO DE BARRAS O ID
async function buscarProductoPorCodigo(codigo) {
    const producto = await Product.findOne({
        where: {
            [Op.or]: [
                { barcode: codigo },
                { id: codigo }
            ]
        }
    });
    if (!producto) throw new Error('Producto no encontrado');
    return producto;
}

// 3. BUSCAR PRODUCTOS POR NOMBRE O CÓDIGO
async function buscarProductos(textoBusqueda) {
    return await Product.findAll({
        where: {
            [Op.or]: [
                { name: { [Op.like]: `%${textoBusqueda}%` } },
                { barcode: { [Op.like]: `%${textoBusqueda}%` } }
            ]
        },
        order: [['name', 'ASC']]
    });
}

// 4. CREAR UN NUEVO PRODUCTO
async function crearProducto(datosProducto) {
    if (datosProducto.barcode) {
        const existe = await Product.findOne({ where: { barcode: datosProducto.barcode } });
        if (existe) throw new Error('Ya existe un producto con ese código de barras');
    }
    const producto = await Product.create(datosProducto);
    return producto;
}

// 5. ACTUALIZAR EL STOCK DE UN PRODUCTO
async function actualizarStock(idProducto, nuevoStock) {
    const producto = await Product.findByPk(idProducto);
    if (!producto) throw new Error('Producto no encontrado');
    producto.stock = nuevoStock;
    await producto.save();
    return producto;
}

// 6. OBTENER PRODUCTOS CON POCO STOCK
async function obtenerProductosPocoStock(limite = 5) {
    return await Product.findAll({
        where: { stock: { [Op.lte]: limite } },
        order: [['stock', 'ASC'], ['name', 'ASC']]
    });
}

// 7. ELIMINAR UN PRODUCTO
async function eliminarProducto(idProducto) {
    const producto = await Product.findByPk(idProducto);
    if (!producto) throw new Error('Producto no encontrado');
    await producto.destroy();
    return { message: 'Producto eliminado correctamente' };
}

// 8. EXPORTAR TODAS LAS FUNCIONES PARA USAR EN OTROS ARCHIVOS
module.exports = {
    obtenerTodosLosProductos,
    buscarProductoPorCodigo,
    buscarProductos,
    crearProducto,
    actualizarStock,
    obtenerProductosPocoStock,
    eliminarProducto
};