# 💈 Backend - Sistema de Gestión de Barbería

Backend del sistema de gestión de barbería con reservas online, construido con Node.js, Express y MongoDB.

## 🚀 Características

- ✅ Sistema de turnos/reservas online
- ✅ Gestión de barberos con horarios personalizados
- ✅ Gestión de servicios (corte, barba, coloración, etc.)
- ✅ Envío automático de emails (confirmación, notificaciones, recordatorios)
- ✅ Recordatorios automáticos 30 minutos antes del turno (con cron jobs)
- ✅ Estadísticas completas (generales y por barbero)
- ✅ API RESTful con Express
- ✅ Base de datos MongoDB con Mongoose

## 📋 Requisitos Previos

- Node.js >= 16.x
- MongoDB >= 5.x (instalado localmente o MongoDB Atlas)
- Una cuenta de Gmail para envío de emails (con contraseña de aplicación)

## 🛠️ Instalación

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar variables de entorno

Editar el archivo `.env` con tus configuraciones:

```env
# Puerto del servidor
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/barberia

# Configuración de Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicacion

# Email del administrador
ADMIN_EMAIL=admin@barberia.com

# Nombre del negocio
BUSINESS_NAME=Barbería Premium

# URL del frontend
FRONTEND_URL=http://localhost:5173
```

**Nota:** Para obtener una contraseña de aplicación de Gmail:
1. Ve a https://myaccount.google.com/apppasswords
2. Crea una nueva contraseña de aplicación
3. Copia la contraseña generada y úsala en `EMAIL_PASS`

### 3. Poblar la base de datos con datos de prueba

```bash
npm run seed
```

Este comando creará:
- 3 barberos de ejemplo
- 5 servicios (Corte, Corte + Barba, Coloración, Fade, Combo Premium)
- 5 clientes de ejemplo
- ~40 turnos de prueba (últimos 7 días + próximos 7 días)

## 🚀 Ejecución

### Modo desarrollo (con nodemon)
```bash
npm run dev
```

### Modo producción
```bash
npm start
```

El servidor estará corriendo en `http://localhost:3000`

## 📚 Endpoints del API

### Barberos
- `GET /api/barberos` - Obtener todos los barberos
- `GET /api/barberos/:id` - Obtener un barbero
- `POST /api/barberos` - Crear barbero
- `PUT /api/barberos/:id` - Actualizar barbero
- `DELETE /api/barberos/:id` - Desactivar barbero

### Servicios
- `GET /api/servicios` - Obtener todos los servicios
- `GET /api/servicios/:id` - Obtener un servicio
- `POST /api/servicios` - Crear servicio
- `PUT /api/servicios/:id` - Actualizar servicio
- `DELETE /api/servicios/:id` - Desactivar servicio

### Turnos
- `GET /api/turnos` - Obtener todos los turnos (con filtros)
- `GET /api/turnos/:id` - Obtener un turno
- `POST /api/turnos` - Crear nuevo turno (reserva)
- `PUT /api/turnos/:id` - Actualizar turno
- `PATCH /api/turnos/:id/cancelar` - Cancelar turno
- `GET /api/turnos/horarios-disponibles` - Obtener horarios disponibles

### Estadísticas
- `GET /api/estadisticas/generales` - Estadísticas generales
- `GET /api/estadisticas/barbero/:id` - Estadísticas de un barbero
- `GET /api/estadisticas/comparativa-barberos` - Comparar barberos
- `GET /api/estadisticas/turnos-por-periodo` - Turnos por día/semana/mes

## 📧 Sistema de Emails

El sistema envía emails automáticamente en los siguientes casos:

1. **Al crear un turno:**
   - ✉️ Confirmación al cliente
   - ✉️ Notificación al barbero asignado
   - ✉️ Notificación al administrador

2. **30 minutos antes del turno:**
   - ⏰ Recordatorio al cliente
   - ⏰ Recordatorio al barbero

El cron job se ejecuta cada 5 minutos verificando turnos próximos.

## 🗂️ Estructura del Proyecto

```
backend/
├── config/
│   └── conexion.js                 # Configuración de MongoDB
├── controllers/                     # Controladores HTTP (manejan req/res)
│   ├── barberoController.js
│   ├── servicioController.js
│   ├── turnoController.js
│   └── estadisticasController.js
├── services/                        # Lógica de negocio
│   ├── barberoService.js           # Lógica de barberos
│   ├── servicioService.js          # Lógica de servicios
│   ├── turnoService.js             # Lógica de turnos/reservas
│   ├── estadisticasService.js      # Lógica de estadísticas
│   ├── emailService.js             # Envío de emails
│   └── cronService.js              # Cron jobs para recordatorios
├── models/                          # Modelos de MongoDB
│   ├── Barbero.js
│   ├── Servicio.js
│   ├── Cliente.js
│   └── Turno.js
├── routes/                          # Rutas del API
│   ├── barberoRoutes.js
│   ├── servicioRoutes.js
│   ├── turnoRoutes.js
│   └── estadisticasRoutes.js
├── seeders/
│   └── index.js                    # Datos de prueba
├── .env                            # Variables de entorno
├── .env.example                    # Ejemplo de variables
├── index.js                        # Punto de entrada
└── package.json
```

## 🏗️ Arquitectura en Capas

El backend sigue una arquitectura en capas bien definida:

**Flujo de datos:**
```
Cliente HTTP → Rutas → Controladores → Servicios → Modelos → MongoDB
```

**Responsabilidades:**

1. **Rutas** (`/routes`): Define los endpoints del API
2. **Controladores** (`/controllers`): Maneja peticiones HTTP, valida entrada, retorna respuestas
3. **Servicios** (`/services`): Contiene toda la lógica de negocio
4. **Modelos** (`/models`): Define esquemas y valida datos de MongoDB

**Ventajas:**
- ✅ Código más organizado y mantenible
- ✅ Lógica de negocio reutilizable
- ✅ Fácil testing unitario
- ✅ Separación clara de responsabilidades

## 🔧 Comandos Útiles

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar en modo producción
npm start

# Poblar base de datos con datos de prueba
npm run seed
```

## 📝 Notas

- Los emails **NO** bloquean las respuestas HTTP (se envían de forma asíncrona)
- El cron job se inicia automáticamente al levantar el servidor
- Los barberos pueden ser "indistintos" (barberoId = null)
- Los turnos se validan para evitar duplicados en el mismo horario

## 🐛 Troubleshooting

### Error de conexión a MongoDB
- Verifica que MongoDB esté corriendo: `mongod --version`
- Verifica la URI en el archivo `.env`

### Los emails no se envían
- Verifica las credenciales de Gmail en `.env`
- Asegúrate de usar una contraseña de aplicación, no tu contraseña normal
- Revisa los logs del servidor para ver errores específicos

## 📄 Licencia

ISC
