import { useState, useEffect, useRef } from 'react'

// 1. HOOK PARA MANEJAR EL SCANNER DE CÓDIGOS DE BARRAS
// Este hook detecta cuando se escanea un código de barras y ejecuta una función
export const useScanner = (alEscanear) => {
    // 2. ESTADOS DEL SCANNER
    const [escaneando, setEscaneando] = useState(false)         // Si está leyendo código
    const [codigoEscaneado, setCodigoEscaneado] = useState('')  // Último código leído
    
    // 3. REFERENCIAS PARA MANEJAR EL BUFFER Y TIMEOUT
    const bufferEscaneo = useRef('')          // Acumula caracteres del scanner
    const timeoutEscaneo = useRef(null)       // Controla timeout de limpieza

    // 4. EFECTO PARA ESCUCHAR EVENTOS DEL TECLADO (SCANNER)
    useEffect(() => {
        const manejarTecla = (evento) => {
            // Ignorar si hay un input de texto enfocado (para no interferir)
            const hayInputEnfocado = document.activeElement?.tagName === 'INPUT' ||
                document.activeElement?.tagName === 'TEXTAREA'

            // Solo ignorar si no es el input del scanner
            if (hayInputEnfocado && document.activeElement?.dataset?.isScanner !== 'true') {
                return
            }

            // Limpiar timeout anterior si existe
            if (timeoutEscaneo.current) {
                clearTimeout(timeoutEscaneo.current)
            }

            // Si presiona Enter, procesar el código acumulado
            if (evento.key === 'Enter' && bufferEscaneo.current.length > 0) {
                evento.preventDefault()
                const codigo = bufferEscaneo.current.trim()

                // Verificar que el código tenga longitud mínima válida
                if (codigo.length >= 8) {
                    setCodigoEscaneado(codigo)
                    setEscaneando(false)
                    alEscanear?.(codigo)  // Ejecutar función cuando se escanea
                }

                bufferEscaneo.current = ''
                return
            }

            // Si es un carácter normal, agregarlo al buffer
            if (evento.key.length === 1) {
                // Si es el primer carácter, indicar que está escaneando
                if (bufferEscaneo.current.length === 0) {
                    setEscaneando(true)
                }

                bufferEscaneo.current += evento.key

                // Establecer timeout para limpiar si no llega Enter pronto
                timeoutEscaneo.current = setTimeout(() => {
                    bufferEscaneo.current = ''
                    setEscaneando(false)
                }, 100) // 100ms de espera
            }
        }

        // 5. AGREGAR Y QUITAR LISTENER DE EVENTOS
        document.addEventListener('keydown', manejarTecla)

        return () => {
            document.removeEventListener('keydown', manejarTecla)
            if (timeoutEscaneo.current) {
                clearTimeout(timeoutEscaneo.current)
            }
        }
    }, [alEscanear])

    // 6. FUNCIÓN PARA LIMPIAR EL CÓDIGO ESCANEADO
    const limpiarCodigo = () => setCodigoEscaneado('')

    // 7. DEVOLVER ESTADO Y FUNCIONES DEL SCANNER
    return {
        escaneando,        // Si está leyendo código en este momento
        codigoEscaneado,   // Último código que se escaneó
        limpiarCodigo      // Función para limpiar el código
    }
}
