# 🛒 Sistema POS (Punto de Venta) Web

Un sistema completo de Punto de Venta desarrollado como aplicación web full-stack, diseñado para manejar inventarios, ventas y estadísticas de manera eficiente con soporte para escaneo de códigos de barras.

## 📋 Tabla de Contenidos
- [Características](#-características)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [API Endpoints](#-api-endpoints)
- [Integración con Barcode to PC Server](#-integración-con-barcode-to-pc-server)
- [Ventajas](#-ventajas)
- [Limitaciones](#-limitaciones)
- [Base de Datos](#-base-de-datos)
- [Scripts Disponibles](#-scripts-disponibles)
- [Contribución](#-contribución)

## 🌟 Características

### 💼 Gestión de Productos
- ✅ CRUD completo de productos
- ✅ Gestión de inventario con stock
- ✅ Códigos de barras únicos
- ✅ Imágenes de productos
- ✅ Búsqueda por nombre o código
- ✅ Control de productos con poco stock

### 🛍️ Sistema de Ventas
- ✅ Carrito de compras interactivo
- ✅ Escaneo de códigos de barras automático
- ✅ Validación de stock en tiempo real
- ✅ Cálculo automático de totales
- ✅ Generación de tickets de venta
- ✅ Historial completo de ventas

### 📊 Estadísticas y Reportes
- ✅ Dashboard con métricas principales
- ✅ Productos más vendidos
- ✅ Estadísticas por rango de fechas
- ✅ Alertas de stock bajo
- ✅ Análisis de ventas temporales

### 🔍 Funcionalidades Adicionales
- ✅ Interfaz intuitiva y moderna
- ✅ Navegación por pestañas
- ✅ Búsqueda instantánea
- ✅ Modales informativos
- ✅ Validaciones de datos

## 🚀 Tecnologías Utilizadas

### Frontend
- **React 19** - Framework principal
- **React Router DOM** - Navegación
- **Vite** - Bundler y servidor de desarrollo
- **CSS3** - Estilos personalizados

### Backend
- **Node.js** - Entorno de ejecución
- **Express 5** - Framework web
- **Sequelize** - ORM para base de datos
- **SQLite** - Base de datos local
- **CORS** - Manejo de políticas de origen cruzado

### Herramientas
- **dotenv** - Variables de entorno
- **Barcode to PC Server** - App móvil para escaneo

## 📁 Estructura del Proyecto

```
Sistema-ventas/
├── backend/
│   ├── controllers/          # Controladores de lógica de negocio
│   │   ├── productController.js
│   │   └── saleController.js
│   ├── models/              # Modelos de base de datos
│   │   ├── Product.js
│   │   └── Sale.js
│   ├── routes/              # Rutas de la API
│   │   ├── productRoutes.js
│   │   └── saleRoutes.js
│   ├── services/            # Servicios de acceso a datos
│   │   ├── productService.js
│   │   └── saleService.js
│   ├── db/                  # Configuración y seeds de BD
│   │   ├── conexion.js
│   │   ├── seedCompleto.js
│   │   ├── seedProducts.js
│   │   └── seedSales.js
│   ├── data/               # Archivos de base de datos
│   │   └── sistema-pos.db
│   ├── package.json
│   └── index.js            # Servidor principal
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   │   ├── sales/     # Interfaz de ventas
│   │   │   ├── inventory/ # Gestión de productos
│   │   │   ├── historial/ # Historial de ventas
│   │   │   ├── stats/     # Estadísticas
│   │   │   └── sidebar/   # Navegación
│   │   ├── hooks/         # Custom hooks
│   │   │   ├── useApi.js
│   │   │   ├── useCart.js
│   │   │   └── useScanner.js
│   │   ├── helpers/       # Utilidades
│   │   │   ├── apiClient.js
│   │   │   └── utils.js
│   │   ├── router/        # Configuración de rutas
│   │   │   └── routing.jsx
│   │   ├── config/        # Configuración
│   │   │   └── index.js
│   │   └── main.jsx      # Punto de entrada
│   ├── public/           # Archivos estáticos
│   │   └── default.jpg   # Imagen por defecto
│   ├── package.json
│   └── .env             # Variables de entorno
└── README.md
```

## 📋 Requisitos Previos

- **Node.js** (v16 o superior)
- **npm** (v7 o superior)
- **Conexión WiFi** - Requerida para comunicación frontend-backend
- **Barcode to PC Server** (app móvil opcional)

## 🛠️ Instalación

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd Sistema-ventas
```

### 2. Instalar dependencias del backend
```bash
cd backend
npm install
```

### 3. Instalar dependencias del frontend
```bash
cd ../frontend
npm install
```

### 4. Configurar variables de entorno
```bash
# En la carpeta frontend, ajustar el archivo .env
cp .env.example .env
```

## ⚙️ Configuración

### Backend (.env)
```env
PORT=3001
HOST=127.0.0.1
```

### Frontend (.env)
```env
VITE_API_URL=http://127.0.0.1:3001
VITE_DEV_PORT=5173
VITE_APP_NAME=Sistema de ventas
VITE_APP_VERSION=1.0.0
```

## 🚀 Uso

### 1. Iniciar el backend
```bash
cd backend
node index.js
```

### 2. Poblar la base de datos (opcional)
```bash
# Insertar productos y ventas de ejemplo
node db/seedCompleto.js

# O por separado:
node db/seedProducts.js   # Solo productos
node db/seedSales.js     # Solo ventas
```

### 3. Iniciar el frontend
```bash
cd frontend
npm run dev
```

### 4. Acceder a la aplicación
Abrir en el navegador: `http://localhost:5173`

## 🔗 API Endpoints

### Productos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/products` | Obtener todos los productos |
| GET | `/api/products/search?q=` | Buscar productos |
| GET | `/api/products/low-stock` | Productos con poco stock |
| GET | `/api/products/barcode/:barcode` | Buscar por código de barras |
| GET | `/api/products/:id` | Obtener producto por ID |
| POST | `/api/products` | Crear nuevo producto |
| PUT | `/api/products/:id` | Actualizar producto |
| DELETE | `/api/products/:id` | Eliminar producto |

### Ventas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/sales` | Obtener todas las ventas |
| GET | `/api/sales/:id` | Obtener venta por ID |
| POST | `/api/sales` | Crear nueva venta |
| GET | `/api/sales/stats` | Estadísticas generales |
| GET | `/api/sales/stats/top-products` | Productos más vendidos |
| GET | `/api/sales/stats/date-range` | Estadísticas por rango |

## 📱 Integración con Barcode to PC Server

### Configuración
1. **Descargar la app** "Barcode to PC Server" en tu móvil
2. **Conectar ambos dispositivos** a la misma red WiFi
3. **Configurar la app** para enviar códigos a tu PC
4. **Iniciar el servidor** en la app móvil

### Funcionamiento
- Al escanear un código con el celular, se envía automáticamente al input activo
- El sistema detecta automáticamente códigos de barras de 8+ caracteres
- No necesitas hacer clic en los campos de búsqueda
- El producto se busca y agrega al carrito instantáneamente

### Compatibilidad
- ✅ Funciona con cualquier lector de códigos de barras USB/Bluetooth
- ✅ Compatible con la app "Barcode to PC Server"
- ✅ Detección automática de códigos sin configuración adicional

## ✅ Ventajas

### 🎯 Operación Eficiente
- **Escaneo automático**: No necesitas mover el mouse hacia los inputs
- **Búsqueda instantánea**: Los productos se encuentran automáticamente al escanear
- **Workflow fluido**: Escanear → Agregar al carrito → Finalizar venta en segundos
- **Sin interrupciones**: El sistema detecta códigos sin configuración adicional
- **Multitarea**: Puedes escanear mientras navegas por otras secciones

### 🧾 Gestión de Tickets
- **Impresión automática**: Al finalizar una venta, se muestra inmediatamente la opción de imprimir el ticket
- **Ticket detallado**: Incluye todos los productos, cantidades, precios y total de la venta
- **Sin configuración**: Utiliza la impresora predeterminada del sistema
- **Formato profesional**: Diseño limpio y legible para el cliente
- **Impresión instantánea**: Un solo clic para imprimir después de cada venta

### 💡 Funcionalidades Avanzadas
- **Gestión completa**: Productos, ventas, estadísticas en un solo lugar
- **Validación inteligente**: Control de stock en tiempo real previene sobreventa
- **Interfaz intuitiva**: Navegación clara y accesible sin curva de aprendizaje
- **Datos persistentes**: Base de datos local SQLite confiable y rápida
- **Búsqueda flexible**: Por nombre, código o escaneo automático

### 🔧 Técnicas
- **Arquitectura moderna**: React + Express con separación clara de responsabilidades
- **API RESTful**: Endpoints bien estructurados y documentados
- **ORM robusto**: Sequelize para manejo seguro de datos
- **Desarrollo ágil**: Hot reload con Vite para desarrollo rápido
- **Código limpio**: Hooks personalizados y componentes reutilizables

### 📊 Análisis y Reportes
- **Reportes detallados**: Ventas por período, productos más vendidos
- **Métricas útiles**: Alertas de stock bajo, tendencias de venta
- **Historial completo**: Registro detallado de todas las transacciones
- **Dashboard visual**: Estadísticas claras y fáciles de interpretar

## ❌ Limitaciones

### 📱 Compatibilidad y Acceso
- **No responsive**: Diseñado únicamente para escritorio, no funciona bien en móviles
- **Pantalla fija**: Requiere resolución mínima para uso óptimo
- **No móvil nativo**: No hay app móvil dedicada para el sistema

### 🌐 Conectividad (Limitación Principal)
- **⚠️ REQUIERE WiFi OBLIGATORIO**: Al ser una aplicación web, necesita conexión de red para comunicar frontend con backend
- **Dependiente de red local**: Si se cae la WiFi, el sistema no funciona
- **Solo localhost**: Funciona únicamente en la misma máquina o red local
- **Sin modo offline**: No puede operar sin conexión de red

#### 💡 Solución Propuesta para Conectividad
**Empaquetado con Electron**: Se podría resolver la dependencia de WiFi empaquetando toda la aplicación (frontend + backend) en una aplicación de escritorio usando Electron. Esto permitiría:
- ✅ Funcionamiento sin conexión a internet
- ✅ Instalación como aplicación nativa
- ✅ Base de datos local integrada
- ✅ Sin dependencia de navegador web

### 🔒 Seguridad
- **Sin autenticación**: No tiene sistema de usuarios/contraseñas
- **Acceso abierto**: Cualquiera con acceso al servidor puede operar el sistema
- **Sin roles**: No hay permisos diferenciados por usuario
- **Sin auditoría**: No registra quién hizo qué operación

### 💾 Escalabilidad
- **SQLite limits**: Para volúmenes muy altos, requiere migración a base de datos más robusta
- **Sin clustering**: Una sola instancia de servidor
- **Archivos locales**: Las imágenes se almacenan localmente sin CDN
- **Una terminal**: No soporta múltiples puntos de venta simultáneos

### 🔧 Mantenimiento
- **Backups manuales**: No hay sistema automático de respaldo
- **Sin sincronización**: Los datos no se sincronizan con otros dispositivos
- **Actualizaciones manuales**: Requiere actualización manual del código

## 🗄️ Base de Datos

### Modelo Product
```sql
- id: INTEGER PRIMARY KEY
- name: VARCHAR (Nombre del producto)
- price: FLOAT (Precio unitario)
- stock: INTEGER (Cantidad disponible)
- barcode: VARCHAR UNIQUE (Código de barras)
- image: VARCHAR (URL/path de imagen)
```

### Modelo Sale
```sql
- id: INTEGER PRIMARY KEY
- total: FLOAT (Monto total)
- items: TEXT (JSON con productos vendidos)
- createdAt: DATETIME (Fecha y hora de venta)
```

### Ubicación
- **Archivo**: `backend/data/sistema-pos.db`
- **Tipo**: SQLite
- **Auto-creación**: Se crea automáticamente al iniciar el servidor

## 📝 Scripts Disponibles

### Backend
```bash
node index.js              # Iniciar servidor
node db/seedCompleto.js    # Poblar BD completa
node db/seedProducts.js    # Solo productos
node db/seedSales.js      # Solo ventas
```

### Frontend
```bash
npm run dev        # Servidor de desarrollo
npm run build      # Build para producción
npm run preview    # Preview del build
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una branch para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

**⚠️ Nota Importante**: Este sistema requiere conexión WiFi para funcionar, ya que la interfaz web necesita comunicarse con el servidor backend. Para uso sin internet, se recomienda empaquetar la aplicación con Electron.

**Desarrollado con ❤️ para facilitar la gestión de ventas y inventario**

*Sistema POS Web - Versión 1.0.0*