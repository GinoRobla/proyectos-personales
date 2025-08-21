// ===== COMPONENTE HISTORIAL DE VENTAS =====
// Este componente muestra todas las ventas realizadas con filtros y detalles

import React, { useState, useEffect, useCallback } from 'react'
import './Historial.css'
import { useApi } from '../../hooks/useApi'
import { obtenerVentas, obtenerProductos } from '../../helpers/apiClient'
import { formatearDinero, formatearFechaHora, contarProductos } from '../../helpers/utils'

export const Historial = () => {
    // 1. ESTADOS PRINCIPALES
    const [productos, setProductos] = useState([])   // Lista de productos para mostrar en el modal
    const [ventas, setVentas] = useState([])           // Lista de todas las ventas
    const [ventasFiltradas, setVentasFiltradas] = useState([]) // Ventas después de filtrar
    const [fechaDesde, setFechaDesde] = useState('')   // Fecha inicio del filtro
    const [fechaHasta, setFechaHasta] = useState('')   // Fecha fin del filtro

    // 2. ESTADOS PARA PAGINACIÓN
    const [paginaActual, setPaginaActual] = useState(1) // Página actual
    const ventasPorPagina = 10                          // Cantidad de ventas por página

    // 3. ESTADOS PARA EL MODAL DE DETALLES
    const [mostrarModal, setMostrarModal] = useState(false)    // Si se muestra el modal
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null) // Venta del modal

    // 3. HOOK PARA MANEJAR LLAMADAS AL BACKEND
    const { cargando, error, ejecutarPeticion, limpiarError } = useApi()

    // 4. FUNCIÓN PARA CARGAR TODAS LAS VENTAS DESDE EL BACKEND
    const cargarVentasYProductos = async () => {
        limpiarError()
        try {
            const [datosVentas, datosProductos] = await Promise.all([
                ejecutarPeticion(() => obtenerVentas()),
                ejecutarPeticion(() => obtenerProductos())
            ])
            setVentas(datosVentas)
            setVentasFiltradas(datosVentas)
            setProductos(datosProductos)
        } catch (error) {
            setVentas([])
            setVentasFiltradas([])
            setProductos([])
        }
    }

    // 5. FUNCIÓN PARA LIMPIAR FILTROS
    const limpiarFiltros = () => {
        setFechaDesde('')
        setFechaHasta('')
        setVentasFiltradas(ventas) // Mostrar todas las ventas
    }

    // 6. FUNCIÓN PARA ABRIR EL MODAL DE DETALLES
    const verDetalles = (venta) => {
        // Clonar la venta y agregar nombre y código a cada item si faltan
        const ventaConNombres = {
            ...venta,
            items: venta.items.map(item => {
                const prod = productos.find(p => p.id === item.productId);
                return {
                    ...item,
                    productName: item.productName || item.name || (prod ? prod.name : 'Producto sin nombre'),
                    barcode: item.barcode || (prod ? prod.barcode : '')
                };
            })
        };
        setVentaSeleccionada(ventaConNombres);
        setMostrarModal(true);
    }

    // 7. FUNCIÓN PARA CERRAR EL MODAL
    const cerrarModal = () => {
        setMostrarModal(false)
        setVentaSeleccionada(null)
    }

    // 8. FUNCIÓN PARA FILTRAR LAS VENTAS POR FECHAS
    const filtrarPorFecha = useCallback(() => {
        if (!fechaDesde && !fechaHasta) {
            setVentasFiltradas(ventas)
        } else {
            // LOG: Mostrar fechaHasta y fechas de ventas
            let hasta = null;
            if (fechaHasta) {
                // Crear fecha hasta usando componentes año, mes, día
                const partes = fechaHasta.split('-');
                // año, mes (0-index), día
                hasta = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]), 23, 59, 59, 999);
                console.log('Filtro hasta (local):', hasta.toLocaleString());
                console.log('Filtro hasta (UTC):', hasta.toISOString());
            }
            ventas.forEach(venta => {
                const fechaVenta = new Date(venta.createdAt);
                console.log('Venta:', venta.id, 'createdAt:', venta.createdAt, '| Local:', fechaVenta.toLocaleString(), '| UTC:', fechaVenta.toISOString());
            });

            const ventasFiltradas = ventas.filter(venta => {
                const fechaVenta = new Date(venta.createdAt);
                let desde = null;
                if (fechaDesde) {
                    const partes = fechaDesde.split('-');
                    desde = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]), 0, 0, 0, 0);
                }
                if (desde && hasta) {
                    return fechaVenta >= desde && fechaVenta <= hasta;
                } else if (desde) {
                    return fechaVenta >= desde;
                } else if (hasta) {
                    return fechaVenta <= hasta;
                }
                return true;
            });

            setVentasFiltradas(ventasFiltradas)
        }

        // Resetear a la primera página cuando se aplican filtros
        setPaginaActual(1)
    }, [fechaDesde, fechaHasta, ventas])

    // 9. CALCULAR VENTAS PARA LA PÁGINA ACTUAL
    const calcularVentasPaginadas = () => {
        const indiceInicio = (paginaActual - 1) * ventasPorPagina
        const indiceFin = indiceInicio + ventasPorPagina
        return ventasFiltradas.slice(indiceInicio, indiceFin)
    }

    // 10. CALCULAR TOTAL DE PÁGINAS
    const totalPaginas = Math.ceil(ventasFiltradas.length / ventasPorPagina)

    // 11. FUNCIÓN PARA CAMBIAR DE PÁGINA
    const cambiarPagina = (nuevaPagina) => {
        if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
            setPaginaActual(nuevaPagina)
        }
    }

    // 9. CARGAR VENTAS AL INICIAR EL COMPONENTE
    useEffect(() => {
        cargarVentasYProductos()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // 10. FILTRAR CUANDO CAMBIEN LAS FECHAS
    useEffect(() => {
        filtrarPorFecha()
    }, [fechaDesde, fechaHasta, ventas, filtrarPorFecha])

    return (
        <div className="historial-container">
            {/* 14. TÍTULO DE LA PÁGINA */}
            <div className="historial-header">
                <h1>Historial de Ventas</h1>
                <p>Consulta todas las ventas realizadas</p>
            </div>
            <div className="header-separator"></div>

            {/* 15. FILTROS POR FECHA */}
            <div className="filtros-container">
                <div className="filtros-fechas">
                    <div className="filtro-fecha">
                        <label>Desde:</label>
                        <input
                            type="date"
                            value={fechaDesde}
                            min="2020-01-01"
                            max="2030-12-31"
                            onChange={(e) => setFechaDesde(e.target.value)}
                        />
                    </div>

                    <div className="filtro-fecha">
                        <label>Hasta:</label>
                        <input
                            type="date"
                            value={fechaHasta}
                            min="2020-01-01"
                            max="2030-12-31"
                            onChange={(e) => setFechaHasta(e.target.value)}
                        />
                    </div>
                </div>

                <div className="filtros-acciones">
                    <button
                        className="btn-limpiar"
                        onClick={limpiarFiltros}
                    >
                        Limpiar Filtros
                    </button>
                </div>
            </div>

            {/* 16. MOSTRAR ERRORES */}
            {error && (
                <div className="error-mensaje">
                    {error}
                </div>
            )}

            {/* 17. MOSTRAR CARGANDO */}
            {cargando && (
                <div className="cargando">
                    Cargando ventas...
                </div>
            )}

            {/* 18. LISTA DE VENTAS */}
            {!cargando && !error && (
                <>
                    <div className="ventas-lista">
                        {ventasFiltradas.length === 0 ? (
                            <div className="sin-ventas">
                                No hay ventas para mostrar
                            </div>
                        ) : (
                            calcularVentasPaginadas().map(venta => (
                                <div key={venta.id} className="venta-card">
                                    <div className="venta-info">
                                        <div className="venta-fecha">
                                            {formatearFechaHora(venta.createdAt)}
                                        </div>
                                        <div className="venta-datos">
                                            <span className="venta-productos">
                                                {contarProductos(venta.items)} productos
                                            </span>
                                            <span className="venta-total">
                                                {formatearDinero(venta.total)}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        className="btn-detalles"
                                        onClick={() => verDetalles(venta)}
                                    >
                                        Ver Detalles
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* 19. PAGINACIÓN */}
                    {ventasFiltradas.length > 0 && totalPaginas > 1 && (
                        <div className="paginacion">
                            <button
                                className="btn-pagina"
                                onClick={() => cambiarPagina(paginaActual - 1)}
                                disabled={paginaActual === 1}
                            >
                                Anterior
                            </button>

                            <span className="info-pagina">
                                Página {paginaActual} de {totalPaginas}
                            </span>

                            <button
                                className="btn-pagina"
                                onClick={() => cambiarPagina(paginaActual + 1)}
                                disabled={paginaActual === totalPaginas}
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* 20. MODAL DE DETALLES */}
            {mostrarModal && ventaSeleccionada && (
                <div className="modal-overlay" onClick={cerrarModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        {/* Encabezado del modal */}
                        <div className="modal-header">
                            <h2>Detalles de la Venta</h2>
                            <button className="btn-cerrar" onClick={cerrarModal}>
                                x
                            </button>
                        </div>

                        {/* Información general de la venta */}
                        <div className="modal-info-general">
                            <div className="info-item">
                                <strong>Fecha y Hora:</strong> {formatearFechaHora(ventaSeleccionada.createdAt)}
                            </div>
                            <div className="info-item">
                                <strong>Total de Productos:</strong> {contarProductos(ventaSeleccionada.items)}
                            </div>
                            <div className="info-item total-venta">
                                <strong>Total de la Venta:</strong> {formatearDinero(ventaSeleccionada.total)}
                            </div>
                        </div>

                        {/* Lista de productos comprados */}
                        <div className="modal-productos">
                            <h3>Productos Comprados:</h3>
                            <div className="productos-lista">
                                {ventaSeleccionada.items.map((item, index) => (
                                    <div key={index} className="producto-item">
                                        <div className="producto-info">
                                            <div className="producto-nombre">
                                                {item.productName || item.name || 'Producto sin nombre'}
                                            </div>
                                            <div className="producto-codigo">
                                                Código: {item.barcode || 'Sin código'}
                                            </div>
                                        </div>
                                        <div className="producto-detalles">
                                            <div className="producto-cantidad">
                                                Cantidad: {item.quantity}
                                            </div>
                                            <div className="producto-precio">
                                                Precio: {formatearDinero(item.price)}
                                            </div>
                                            <div className="producto-subtotal">
                                                Subtotal: {formatearDinero(item.price * item.quantity)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Botón para cerrar */}
                        <div className="modal-footer">
                            <button className="btn-cerrar-modal" onClick={cerrarModal}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
