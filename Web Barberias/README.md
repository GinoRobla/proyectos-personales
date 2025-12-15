# 💈 Sistema de Gestión de Barbería

Sistema completo de gestión para barberías con reservas online, pagos de señas, recordatorios por WhatsApp y panel administrativo.

## 🚀 Características Principales

### Para Clientes
- ✅ Registro y autenticación (Email/Password + Google OAuth)
- ✅ Reserva de turnos online con selección de servicio, barbero, fecha y hora
- ✅ Verificación de teléfono por WhatsApp (código de 6 dígitos)
- ✅ Pago de señas online con MercadoPago
- ✅ Recordatorios automáticos por WhatsApp (30min antes + pago pendiente)
- ✅ Historial completo de turnos
- ✅ Gestión de perfil
- ✅ Cancelación de turnos

### Para Barberos
- ✅ Dashboard personalizado con agenda del día
- ✅ Visualización de turnos asignados
- ✅ Estadísticas de rendimiento
- ✅ Gestión de perfil y disponibilidad

### Para Administradores
- ✅ Panel completo de administración
- ✅ Gestión de barberos (crear, editar, activar/desactivar)
- ✅ Gestión de servicios (precios, duraciones)
- ✅ Gestión de disponibilidad general y horarios
- ✅ Gestión de pagos y señas
- ✅ Configuración de señas (porcentaje, política)
- ✅ Estadísticas completas del negocio
- ✅ Reportes diarios automáticos por WhatsApp

### Automatizaciones
- 🤖 Recordatorios por WhatsApp 30min antes del turno
- 🤖 Recordatorios de pago pendiente 5min después de reservar
- 🤖 Cancelación automática de turnos pendientes sin pago (15min)
- 🤖 Marcado automático de turnos como completados
- 🤖 Reporte diario al admin después del último turno
- 🤖 Sistema de cron jobs cada 5 minutos

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **JWT** para autenticación
- **Passport** (Google OAuth2.0)
- **Bcrypt** para encriptación de contraseñas
- **Twilio** para WhatsApp
- **MercadoPago SDK** para pagos
- **Nodemailer** para emails
- **Node-cron** para tareas programadas

### Frontend
- **React 18**
- **React Router** v6
- **Context API** para estado global
- **CSS3** con diseño responsive
- **Vite** como bundler

## 📦 Instalación

### Prerrequisitos
- Node.js >= 16
- MongoDB instalado y corriendo
- Cuenta de Twilio (WhatsApp)
- Cuenta de MercadoPago
- Cuenta de Google Cloud (OAuth) - opcional

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/sistema-barberia.git
cd sistema-barberia
```

### 2. Backend

```bash
cd backend
npm install
```

Crear archivo `.env` basándote en `.env.example`:

```env
# Base de Datos
MONGODB_URI=mongodb://localhost:27017/barberia

# Puerto
PORT=3000

# JWT
JWT_SECRET=tu-secreto-muy-seguro-aqui
JWT_EXPIRATION=7d

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_FROM=+14155238886

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=tu_access_token
MERCADOPAGO_PUBLIC_KEY=tu_public_key

# Email (Gmail)
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```

### 3. Frontend

```bash
cd frontend
npm install
```

Crear archivo `.env` (opcional, solo si cambias URLs):

```env
VITE_API_URL=http://localhost:3000/api
```

### 4. Poblar Base de Datos (Seed)

```bash
cd backend
npm run seed
```

Esto creará:
- 1 Admin
- 3 Barberos
- 15 Clientes
- 8 Servicios
- 438 Turnos (históricos y futuros)
- 90 Pagos
- Configuración completa

## 🚀 Ejecución

### Desarrollo

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

El frontend estará en `http://localhost:5173`

El backend estará en `http://localhost:3000`

### Producción

```bash
# Backend
cd backend
npm start

# Frontend (build)
cd frontend
npm run build
# Servir la carpeta dist/ con tu servidor web preferido
```

## 🔐 Credenciales de Prueba

Después de ejecutar el seed:

### Admin
- **Email**: `admin@barberia.com`
- **Password**: `123456`

### Barberos
- `carlos@barberia.com` / `123456`
- `diego@barberia.com` / `123456`
- `mateo@barberia.com` / `123456`

### Clientes
- `juan1@mail.com` / `123456`
- `pedro2@mail.com` / `123456`
- ... (15 clientes en total)

## 📱 Funcionalidades Detalladas

### Sistema de Señas
- Configuración flexible: todos los clientes, solo nuevos, o servicios premium
- Porcentaje configurable (10-100%)
- Pago online con MercadoPago
- Estados: pendiente, aprobado, rechazado, devuelto, expirado
- Aplicación automática al completar turno
- Devolución automática si el turno se cancela

### Sistema de Recordatorios
- **30 minutos antes**: Solo para turnos reservados/confirmados
- **Pago pendiente**: 5 minutos después de crear turno pendiente
- **Turno cancelado**: Notificación inmediata
- Todos los mensajes por WhatsApp vía Twilio

### Sistema de Disponibilidad
- Configuración de horarios por día de la semana
- Horarios específicos por barbero
- Bloqueos de fechas especiales
- Cálculo automático de slots disponibles

### Estadísticas
- **Para Barberos**: Turnos del día, completados, pendientes
- **Para Admin**:
  - Resumen diario, semanal, mensual
  - Ingresos totales y proyectados
  - Top servicios y barberos
  - Tasa de cancelación
  - Gráficos interactivos

## 🗂️ Estructura del Proyecto

```
sistema-barberia/
├── backend/
│   ├── config/           # Configuraciones (passport, rate limiter, etc.)
│   ├── controllers/      # Controladores de rutas
│   ├── middlewares/      # Middlewares personalizados
│   ├── models/           # Modelos de Mongoose
│   ├── routes/           # Definición de rutas
│   ├── services/         # Lógica de negocio
│   │   ├── turnos/       # Servicios de turnos (modularizado)
│   │   └── estadisticas/ # Servicios de estadísticas
│   ├── utils/            # Utilidades y helpers
│   ├── validators/       # Validadores de datos
│   ├── seed.js           # Script de seed
│   ├── index.js          # Punto de entrada
│   └── .env.example      # Ejemplo de variables de entorno
│
└── frontend/
    ├── src/
    │   ├── components/   # Componentes reutilizables
    │   ├── context/      # Contextos de React
    │   ├── hooks/        # Custom hooks
    │   ├── pages/        # Páginas/vistas
    │   │   ├── admin/    # Páginas del admin
    │   │   ├── barbero/  # Páginas del barbero
    │   │   └── cliente/  # Páginas del cliente
    │   ├── services/     # Servicios de API
    │   ├── utils/        # Utilidades
    │   ├── App.jsx       # Componente principal
    │   └── main.jsx      # Punto de entrada
    └── public/           # Assets estáticos
```

## 🔄 Flujos Principales

### Reserva de Turno (Cliente)
1. Selecciona servicio
2. Selecciona barbero (o indistinto)
3. Elige fecha y hora
4. Confirma reserva
5. Si requiere seña → Paga con MercadoPago
6. Recibe confirmación por WhatsApp

### Gestión de Turno (Admin/Barbero)
1. Ve turnos en dashboard
2. Marca como completado
3. Sistema aplica seña automáticamente
4. Cliente recibe notificación

## 📊 Modelos de Datos

- **Usuario**: Datos de autenticación y perfil
- **Cliente**: Información del cliente
- **Barbero**: Información y disponibilidad del barbero
- **Servicio**: Servicios ofrecidos
- **Turno**: Reservas y citas
- **Pago**: Señas y pagos
- **DisponibilidadGeneral**: Horarios por día de semana
- **DisponibilidadBarbero**: Excepciones de horario por barbero
- **Bloqueo**: Fechas bloqueadas
- **ConfiguracionNegocio**: Configuración general
- **CodigoVerificacion**: Códigos de verificación de teléfono
- **TokenRecuperacion**: Tokens de recuperación de contraseña

## 🐛 Debugging

Los logs del backend se muestran en la consola con prefijos:
- `[TURNOS]`: Operaciones de turnos
- `[RECORDATORIO PAGO]`: Recordatorios de pago
- `[CRON]`: Tareas programadas
- `[DEBUG]`: Información de debugging

## 📝 Licencia

MIT

## 👨‍💻 Autor

Gino Roblabel Leggia

## 🙏 Agradecimientos

- Twilio por la API de WhatsApp
- MercadoPago por la API de pagos
- Todos los contribuidores y testers
