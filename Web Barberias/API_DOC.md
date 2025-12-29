# 📡 Documentación de API - Sistema de Gestión de Barbería

Documentación completa de todos los endpoints de la API REST del sistema de gestión de barbería.

---

## 📋 Tabla de Contenidos

- [Información General](#información-general)
- [Autenticación](#autenticación)
- [Endpoints](#endpoints)
  - [Auth](#auth---autenticación)
  - [Turnos](#turnos---gestión-de-turnos)
  - [Pagos](#pagos---gestión-de-señas)
  - [Barberos](#barberos---gestión-de-barberos)
  - [Servicios](#servicios---gestión-de-servicios)
  - [Disponibilidad](#disponibilidad---horarios-y-bloqueos)
  - [Estadísticas](#estadísticas---métricas-y-reportes)
  - [Configuración](#configuración---configuración-del-negocio)
  - [Verificación](#verificación---verificación-de-teléfono)
- [Modelos de Datos](#modelos-de-datos)
- [Códigos de Estado](#códigos-de-estado)
- [Rate Limiting](#rate-limiting)

---

## Información General

### Base URL

```
http://localhost:3000/api
```

En producción:
```
https://tu-dominio.com/api
```

### Formato de Respuesta

Todas las respuestas siguen este formato estándar:

**Éxito:**
```json
{
  "exito": true,
  "mensaje": "Operación exitosa",
  "datos": { ... }
}
```

**Error:**
```json
{
  "exito": false,
  "mensaje": "Descripción del error",
  "errores": [ ... ]  // opcional
}
```

### Headers Requeridos

```http
Content-Type: application/json
```

Para endpoints protegidos:
```http
Authorization: Bearer <jwt-token>
```

Para endpoints con protección CSRF:
```http
X-Requested-With: XMLHttpRequest
```

---

## Autenticación

El sistema usa **JWT (JSON Web Tokens)** para autenticación.

### Obtener Token

Hacer login con credenciales:

```http
POST /api/auth/login
```

El token se devuelve en la respuesta y debe incluirse en el header `Authorization` de las peticiones subsecuentes:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Expiración

Los tokens expiran después de **7 días** (configurable en `JWT_EXPIRATION`).

### Roles

El sistema tiene 3 roles:
- **cliente**: Usuarios que reservan turnos
- **barbero**: Barberos que atienden clientes
- **admin**: Administradores con acceso completo

---

## Endpoints

## Auth - Autenticación

### Registrar Usuario

Crea una nueva cuenta de usuario.

```http
POST /api/auth/registro
```

**Body:**
```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "telefono": "1123456789",
  "rol": "cliente"  // opcional, default: cliente
}
```

**Respuesta exitosa (201):**
```json
{
  "exito": true,
  "mensaje": "Usuario registrado exitosamente",
  "datos": {
    "usuario": {
      "_id": "655abc123...",
      "nombre": "Juan",
      "apellido": "Pérez",
      "email": "juan@example.com",
      "telefono": "1123456789",
      "rol": "cliente",
      "activo": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Validaciones:**
- Email único
- Teléfono formato argentino (10 dígitos)
- Password mínimo 6 caracteres
- Rate limited: 5 intentos cada 15 minutos

---

### Login

Inicia sesión con email y contraseña.

```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "juan@example.com",
  "password": "password123"
}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Login exitoso",
  "datos": {
    "usuario": {
      "_id": "655abc123...",
      "nombre": "Juan",
      "apellido": "Pérez",
      "email": "juan@example.com",
      "rol": "cliente"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Rate limited:** 10 intentos cada 15 minutos

---

### Login con Google OAuth

Inicia el flujo de autenticación con Google.

```http
GET /api/auth/google
```

Redirige a Google para autenticación. Al completarse, redirige al callback.

---

### Callback de Google

```http
GET /api/auth/google/callback
```

No se llama directamente. Google redirige aquí tras autenticación exitosa.

**Respuesta:** Redirige al frontend con token en query string:
```
http://localhost:5173/auth/google/success?token=eyJhbGci...
```

---

### Verificar Token

Verifica si un token JWT es válido.

```http
GET /api/auth/verificar
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Token válido",
  "datos": {
    "usuario": {
      "_id": "655abc123...",
      "email": "juan@example.com",
      "rol": "cliente"
    }
  }
}
```

---

### Obtener Perfil

Obtiene el perfil del usuario autenticado.

```http
GET /api/auth/perfil
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "_id": "655abc123...",
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@example.com",
    "telefono": "1123456789",
    "telefonoVerificado": true,
    "rol": "cliente",
    "foto": "https://...",
    "activo": true
  }
}
```

---

### Actualizar Perfil

Actualiza datos del usuario autenticado.

```http
PUT /api/auth/perfil
Authorization: Bearer <token>
```

**Body:**
```json
{
  "nombre": "Juan Carlos",
  "email": "juancarlos@example.com",
  "telefono": "1198765432",
  "foto": "https://..."
}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Perfil actualizado exitosamente",
  "datos": { ... }
}
```

---

### Cambiar Contraseña

Cambia la contraseña del usuario autenticado.

```http
PUT /api/auth/cambiar-password
Authorization: Bearer <token>
```

**Body:**
```json
{
  "passwordActual": "password123",
  "passwordNueva": "newpassword456"
}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Contraseña actualizada exitosamente"
}
```

**Rate limited:** 3 intentos cada 15 minutos

---

## Turnos - Gestión de Turnos

### Obtener Horarios Disponibles

Obtiene horarios disponibles para un servicio en una fecha específica.

```http
GET /api/turnos/horarios-disponibles?servicio=<id>&fecha=YYYY-MM-DD&barbero=<id>
```

**Query Params:**
- `servicio` (requerido): ID del servicio
- `fecha` (requerido): Fecha en formato YYYY-MM-DD
- `barbero` (opcional): ID del barbero específico

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "horariosDisponibles": ["09:00", "09:45", "10:30", "11:15", ...],
    "fecha": "2025-01-15"
  }
}
```

---

### Obtener Días Disponibles

Obtiene los días del mes que tienen disponibilidad.

```http
GET /api/turnos/dias-disponibles
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "diasDisponibles": ["2025-01-15", "2025-01-16", "2025-01-17", ...]
  }
}
```

---

### Crear Turno

Crea un nuevo turno.

```http
POST /api/turnos
Authorization: Bearer <token>
X-Requested-With: XMLHttpRequest
```

**Body:**
```json
{
  "cliente": "655abc123...",  // ID del cliente (opcional si autenticado como cliente)
  "barbero": "655def456...",  // ID del barbero (opcional, null = cualquiera)
  "servicio": "655ghi789...", // ID del servicio (requerido)
  "fecha": "2025-01-15",      // Fecha (requerido)
  "hora": "10:30"             // Hora en formato HH:mm (requerido)
}
```

**Respuesta exitosa (201):**
```json
{
  "exito": true,
  "mensaje": "Turno creado exitosamente",
  "datos": {
    "turno": {
      "_id": "655jkl012...",
      "cliente": { ... },
      "barbero": { ... },
      "servicio": { ... },
      "fecha": "2025-01-15T00:00:00.000Z",
      "hora": "10:30",
      "estado": "pendiente",
      "precio": 5000,
      "requiereSena": true,
      "senaPagada": false,
      "tokenCancelacion": "abc123xyz..."
    },
    "pago": {
      "_id": "655mno345...",
      "monto": 1500,
      "montoTotal": 5000,
      "urlPago": "https://mercadopago.com/..."
    }
  }
}
```

**Validaciones:**
- Fecha debe ser futura
- Horario debe estar disponible
- Barbero debe estar activo (si se especifica)
- Servicio debe estar activo

---

### Obtener Mis Turnos

Obtiene los turnos del usuario autenticado.

```http
GET /api/turnos/mis-turnos?page=1&limit=10
Authorization: Bearer <token>
```

**Query Params:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Turnos por página (default: 10)

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "turnos": [ ... ],
    "total": 25,
    "pagina": 1,
    "totalPaginas": 3
  }
}
```

---

### Listar Turnos (Admin/Barbero)

Lista todos los turnos con filtros.

```http
GET /api/turnos?page=1&limit=10&estado=reservado&cliente=<id>&barbero=<id>
Authorization: Bearer <token>
Roles: admin, barbero
```

**Query Params:**
- `page` (opcional): Número de página
- `limit` (opcional): Resultados por página
- `estado` (opcional): pendiente|reservado|completado|cancelado
- `cliente` (opcional): Filtrar por cliente ID
- `barbero` (opcional): Filtrar por barbero ID

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "turnos": [ ... ],
    "total": 150,
    "pagina": 1,
    "totalPaginas": 15
  }
}
```

---

### Obtener Turno por ID

```http
GET /api/turnos/:id
Authorization: Bearer <token>
Roles: admin, barbero, cliente (solo propios)
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "_id": "655jkl012...",
    "cliente": { ... },
    "barbero": { ... },
    "servicio": { ... },
    "fecha": "2025-01-15T00:00:00.000Z",
    "hora": "10:30",
    "estado": "reservado",
    "precio": 5000,
    "pago": { ... }
  }
}
```

---

### Actualizar Turno

Actualiza un turno existente.

```http
PUT /api/turnos/:id
Authorization: Bearer <token>
X-Requested-With: XMLHttpRequest
Roles: admin, barbero
```

**Body:**
```json
{
  "estado": "completado",
  "barbero": "655def456...",
  "fecha": "2025-01-16",
  "hora": "11:00"
}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Turno actualizado exitosamente",
  "datos": { ... }
}
```

---

### Cancelar Turno

Cancela un turno existente.

```http
PATCH /api/turnos/:id/cancelar
Authorization: Bearer <token>
X-Requested-With: XMLHttpRequest
```

**Body:**
```json
{
  "motivo": "No puedo asistir"  // opcional
}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Turno cancelado exitosamente. Se ha procesado la devolución de la seña.",
  "datos": {
    "turno": { ... },
    "devolucion": { ... }  // si aplica
  }
}
```

**Nota:** Si el turno tiene seña pagada, se procesa devolución automática.

---

### Cancelar Turno Público

Cancela un turno sin autenticación usando token de cancelación.

```http
GET /api/turnos/cancelar-publico/:id/:token
```

**Params:**
- `:id`: ID del turno
- `:token`: Token de cancelación (enviado por email/WhatsApp)

**Respuesta:** Página HTML con confirmación de cancelación.

---

## Pagos - Gestión de Señas

### Listar Pagos

Lista todos los pagos con filtros.

```http
GET /api/pagos?estado=aprobado&fechaDesde=2025-01-01&fechaHasta=2025-01-31
Authorization: Bearer <token>
Roles: admin
```

**Query Params:**
- `estado` (opcional): pendiente|aprobado|rechazado|devuelto|expirado
- `fechaDesde` (opcional): Fecha inicio (YYYY-MM-DD)
- `fechaHasta` (opcional): Fecha fin (YYYY-MM-DD)

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "pagos": [
      {
        "_id": "655mno345...",
        "turno": { ... },
        "cliente": { ... },
        "monto": 1500,
        "montoTotal": 5000,
        "estado": "aprobado",
        "fechaPago": "2025-01-15T14:30:00.000Z",
        "aplicado": false
      },
      ...
    ],
    "total": 42
  }
}
```

---

### Crear Pago

Crea un pago/seña para un turno.

```http
POST /api/pagos
Authorization: Bearer <token>
X-Requested-With: XMLHttpRequest
```

**Body:**
```json
{
  "turnoId": "655jkl012..."
}
```

**Respuesta exitosa (201):**
```json
{
  "exito": true,
  "mensaje": "Pago creado exitosamente",
  "datos": {
    "pago": {
      "_id": "655mno345...",
      "turno": "655jkl012...",
      "monto": 1500,
      "montoTotal": 5000,
      "estado": "pendiente",
      "urlPago": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
      "preferenciaId": "12345678-abc..."
    }
  }
}
```

**Nota:** El cliente debe acceder a `urlPago` para completar el pago.

---

### Webhook MercadoPago

Endpoint que recibe notificaciones de MercadoPago.

```http
POST /api/pagos/webhook
```

**Body:** Payload de MercadoPago

Este endpoint procesa automáticamente:
- Confirmación de pagos
- Actualización de estado de turno
- Envío de notificaciones

**No requiere autenticación** (MercadoPago firma las peticiones).

---

### Obtener Pago por ID

```http
GET /api/pagos/:id
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "_id": "655mno345...",
    "turno": { ... },
    "cliente": { ... },
    "monto": 1500,
    "estado": "aprobado",
    "fechaPago": "2025-01-15T14:30:00.000Z",
    "aplicado": false
  }
}
```

---

### Obtener Pago por Turno

```http
GET /api/pagos/turno/:turnoId
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": { ... }
}
```

---

### Aplicar Seña

Aplica la seña al total del servicio (cliente asistió).

```http
POST /api/pagos/:id/aplicar
Authorization: Bearer <token>
X-Requested-With: XMLHttpRequest
Roles: admin, barbero
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Seña aplicada exitosamente",
  "datos": {
    "pago": {
      "_id": "655mno345...",
      "aplicado": true,
      "estado": "aprobado"
    }
  }
}
```

---

### Retener Seña

Retiene la seña (cliente no asistió).

```http
POST /api/pagos/:id/retener
Authorization: Bearer <token>
X-Requested-With: XMLHttpRequest
Roles: admin, barbero
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Seña retenida exitosamente",
  "datos": { ... }
}
```

**Nota:** La seña se queda con el negocio.

---

### Devolver Seña

Devuelve la seña al cliente (cancelación del negocio o excepción).

```http
POST /api/pagos/:id/devolver
Authorization: Bearer <token>
X-Requested-With: XMLHttpRequest
Roles: admin
```

**Body:**
```json
{
  "motivo": "Cancelación por parte del negocio"
}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Seña devuelta exitosamente",
  "datos": {
    "pago": { ... },
    "refund": { ... }
  }
}
```

**Nota:** Se procesa refund en MercadoPago automáticamente.

---

## Barberos - Gestión de Barberos

### Listar Barberos Disponibles

Lista barberos disponibles (activos).

```http
GET /api/barberos/disponibles
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": [
    {
      "_id": "655def456...",
      "nombre": "Carlos",
      "apellido": "Gómez",
      "foto": "https://...",
      "activo": true
    },
    ...
  ]
}
```

---

### Listar Todos los Barberos

```http
GET /api/barberos
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": [ ... ]
}
```

---

### Obtener Barbero por ID

```http
GET /api/barberos/:id
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "_id": "655def456...",
    "nombre": "Carlos",
    "apellido": "Gómez",
    "email": "carlos@barberia.com",
    "telefono": "1123456789",
    "foto": "https://...",
    "objetivoMensual": 50,
    "activo": true
  }
}
```

---

### Crear Barbero

```http
POST /api/barberos
Authorization: Bearer <token>
Roles: admin
```

**Body:**
```json
{
  "nombre": "Carlos",
  "apellido": "Gómez",
  "email": "carlos@barberia.com",
  "password": "password123",
  "telefono": "1123456789",
  "foto": "https://...",
  "objetivoMensual": 50
}
```

**Respuesta exitosa (201):**
```json
{
  "exito": true,
  "mensaje": "Barbero creado exitosamente",
  "datos": { ... }
}
```

---

### Actualizar Barbero

```http
PUT /api/barberos/:id
Authorization: Bearer <token>
Roles: admin
```

**Body:**
```json
{
  "nombre": "Carlos",
  "objetivoMensual": 60,
  "foto": "https://..."
}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Barbero actualizado exitosamente",
  "datos": { ... }
}
```

---

### Eliminar Barbero

Elimina (desactiva) un barbero.

```http
DELETE /api/barberos/:id
Authorization: Bearer <token>
Roles: admin
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Barbero eliminado exitosamente"
}
```

**Nota:** No elimina físicamente, solo marca como `activo: false`.

---

## Servicios - Gestión de Servicios

### Listar Servicios

Lista todos los servicios.

```http
GET /api/servicios
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": [
    {
      "_id": "655ghi789...",
      "nombre": "Corte de cabello",
      "descripcion": "Corte profesional",
      "precioBase": 5000,
      "activo": true
    },
    ...
  ]
}
```

---

### Obtener Servicio por ID

```http
GET /api/servicios/:id
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": { ... }
}
```

---

### Crear Servicio

```http
POST /api/servicios
Authorization: Bearer <token>
Roles: admin
```

**Body:**
```json
{
  "nombre": "Corte y barba",
  "descripcion": "Corte de cabello + arreglo de barba",
  "precioBase": 7000
}
```

**Respuesta exitosa (201):**
```json
{
  "exito": true,
  "mensaje": "Servicio creado exitosamente",
  "datos": { ... }
}
```

---

### Actualizar Servicio

```http
PUT /api/servicios/:id
Authorization: Bearer <token>
Roles: admin
```

**Body:**
```json
{
  "nombre": "Corte premium",
  "precioBase": 8000,
  "activo": true
}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Servicio actualizado exitosamente",
  "datos": { ... }
}
```

---

### Eliminar Servicio

```http
DELETE /api/servicios/:id
Authorization: Bearer <token>
Roles: admin
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Servicio eliminado exitosamente"
}
```

**Nota:** Marca como `activo: false`.

---

## Disponibilidad - Horarios y Bloqueos

### Obtener Slots Disponibles

Obtiene slots de horarios disponibles para una fecha.

```http
GET /api/disponibilidad/slots-disponibles?fecha=2025-01-15&barberoId=<id>
```

**Query Params:**
- `fecha` (requerido): YYYY-MM-DD
- `barberoId` (opcional): ID del barbero

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "slots": [
      { "hora": "09:00", "disponible": true },
      { "hora": "09:45", "disponible": false },
      { "hora": "10:30", "disponible": true },
      ...
    ]
  }
}
```

---

### Crear Horario General

Define horarios generales por día de semana.

```http
POST /api/disponibilidad/general
Authorization: Bearer <token>
Roles: admin
```

**Body:**
```json
{
  "diaSemana": 1,        // 0=Domingo, 6=Sábado
  "horaInicio": "09:00",
  "horaFin": "20:00"
}
```

**Respuesta exitosa (201):**
```json
{
  "exito": true,
  "mensaje": "Horario general creado exitosamente",
  "datos": { ... }
}
```

---

### Obtener Horarios Generales

```http
GET /api/disponibilidad/general
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": [
    { "diaSemana": 1, "horaInicio": "09:00", "horaFin": "20:00" },
    { "diaSemana": 2, "horaInicio": "09:00", "horaFin": "20:00" },
    ...
  ]
}
```

---

### Eliminar Horario General

```http
DELETE /api/disponibilidad/general/:diaSemana
Authorization: Bearer <token>
Roles: admin
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Horario general eliminado exitosamente"
}
```

---

### Crear Horario de Barbero

Define horarios específicos para un barbero.

```http
POST /api/disponibilidad/barbero
Authorization: Bearer <token>
Roles: admin, barbero
```

**Body:**
```json
{
  "barbero": "655def456...",
  "diaSemana": 1,
  "horaInicio": "10:00",
  "horaFin": "18:00"
}
```

**Respuesta exitosa (201):**
```json
{
  "exito": true,
  "mensaje": "Horario de barbero creado exitosamente",
  "datos": { ... }
}
```

---

### Obtener Horarios de Barbero

```http
GET /api/disponibilidad/barbero/:barberoId
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": [ ... ]
}
```

---

### Eliminar Horario de Barbero

```http
DELETE /api/disponibilidad/barbero/:barberoId/:diaSemana
Authorization: Bearer <token>
Roles: admin, barbero
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Horario de barbero eliminado exitosamente"
}
```

---

### Crear Bloqueo

Crea un bloqueo de fechas/horarios.

```http
POST /api/disponibilidad/bloqueo
Authorization: Bearer <token>
Roles: admin
```

**Body (Día completo):**
```json
{
  "barbero": null,  // null = bloqueo general
  "fechaInicio": "2025-01-25",
  "fechaFin": "2025-01-25",
  "tipo": "DIA_COMPLETO",
  "motivo": "Feriado"
}
```

**Body (Rango de horas):**
```json
{
  "barbero": "655def456...",
  "fechaInicio": "2025-01-20",
  "fechaFin": "2025-01-20",
  "horaInicio": "14:00",
  "horaFin": "16:00",
  "tipo": "RANGO_HORAS",
  "motivo": "Reunión"
}
```

**Respuesta exitosa (201):**
```json
{
  "exito": true,
  "mensaje": "Bloqueo creado exitosamente",
  "datos": { ... }
}
```

---

### Listar Bloqueos

```http
GET /api/disponibilidad/bloqueos
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": [ ... ]
}
```

---

### Actualizar Bloqueo

```http
PUT /api/disponibilidad/bloqueo/:id
Authorization: Bearer <token>
Roles: admin
```

**Body:**
```json
{
  "fechaFin": "2025-01-26",
  "motivo": "Feriado largo"
}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Bloqueo actualizado exitosamente",
  "datos": { ... }
}
```

---

### Eliminar Bloqueo

```http
DELETE /api/disponibilidad/bloqueo/:id
Authorization: Bearer <token>
Roles: admin
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Bloqueo eliminado exitosamente"
}
```

---

## Estadísticas - Métricas y Reportes

### Estadísticas de Admin

Estadísticas generales para el panel de administración.

```http
GET /api/estadisticas/admin
Authorization: Bearer <token>
Roles: admin
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "turnosHoy": 12,
    "turnosSemana": 45,
    "turnosMes": 180,
    "ingresosHoy": 60000,
    "ingresosSemana": 225000,
    "ingresosMes": 900000,
    "clientesNuevos": 15,
    "tasaOcupacion": 78.5,
    "barberoMasReservado": { ... },
    "servicioMasSolicitado": { ... }
  }
}
```

---

### Mis Estadísticas (Barbero)

Estadísticas del barbero autenticado.

```http
GET /api/estadisticas/mis-estadisticas
Authorization: Bearer <token>
Roles: barbero
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "turnosCompletados": 42,
    "ingresosGenerados": 210000,
    "clientesAtendidos": 38,
    "objetivoMensual": 50,
    "progresoObjetivo": 84.0,
    "promedioTurnosDia": 2.1,
    "servicioMasSolicitado": { ... }
  }
}
```

---

### Estadísticas Generales

Estadísticas generales del negocio.

```http
GET /api/estadisticas/generales
Authorization: Bearer <token>
Roles: admin
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "totalTurnos": 1250,
    "totalIngresos": 6250000,
    "totalClientes": 342,
    "promedioTurnosDia": 12.5,
    "tasaAsistencia": 92.3,
    "tasaCancelacion": 7.7
  }
}
```

---

### Estadísticas de Barbero Específico

```http
GET /api/estadisticas/barbero/:barberoId
Authorization: Bearer <token>
Roles: admin
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": { ... }
}
```

---

## Configuración - Configuración del Negocio

### Obtener Configuración

Obtiene la configuración actual del negocio.

```http
GET /api/configuracion
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "nombreNegocio": "Barbería GR",
    "direccion": "Av. Corrientes 1234, CABA",
    "telefono": "1123456789",
    "emailContacto": "contacto@barberiagr.com",
    "duracionTurnoMinutos": 45,
    "diasBloqueadosPermanente": [0],
    "horarios": "Lun-Vie: 9:00-20:00, Sab: 9:00-18:00",
    "redesSociales": {
      "instagram": "@barberiagr",
      "facebook": "BarberíaGR",
      "whatsapp": "1123456789"
    },
    "senasActivas": true,
    "porcentajeSena": 30,
    "politicaSenas": "nuevos_clientes",
    "horasAntesCancelacion": 24,
    "permitirDevolucionSena": true
  }
}
```

---

### Actualizar Configuración

```http
PUT /api/configuracion
Authorization: Bearer <token>
Roles: admin
```

**Body:**
```json
{
  "nombreNegocio": "Barbería GR Premium",
  "duracionTurnoMinutos": 60,
  "senasActivas": true,
  "porcentajeSena": 40,
  "politicaSenas": "todos"
}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Configuración actualizada exitosamente",
  "datos": { ... }
}
```

---

### Bloquear Día Permanente

Bloquea un día de la semana permanentemente.

```http
POST /api/configuracion/bloquear-dia
Authorization: Bearer <token>
Roles: admin
```

**Body:**
```json
{
  "diaSemana": 0  // 0=Domingo
}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Día bloqueado exitosamente"
}
```

---

### Desbloquear Día Permanente

```http
DELETE /api/configuracion/bloquear-dia/:diaSemana
Authorization: Bearer <token>
Roles: admin
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Día desbloqueado exitosamente"
}
```

---

## Verificación - Verificación de Teléfono

### Enviar Código de Verificación

Envía código de 6 dígitos por WhatsApp.

```http
POST /api/verificacion/enviar-codigo
```

**Body:**
```json
{
  "telefono": "1123456789"
}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Código enviado exitosamente por WhatsApp"
}
```

**Rate limited:** 3 intentos cada 15 minutos por teléfono

---

### Verificar Código

Verifica el código ingresado.

```http
POST /api/verificacion/verificar-codigo
```

**Body:**
```json
{
  "telefono": "1123456789",
  "codigo": "123456"
}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Teléfono verificado exitosamente"
}
```

**Errores:**
- Código inválido o expirado
- Máximo 3 intentos por código

---

### Obtener Estado de Verificación

```http
GET /api/verificacion/estado/:telefono
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "verificado": true,
    "telefono": "1123456789"
  }
}
```

---

### Estado de Verificación del Usuario

Obtiene el estado de verificación del usuario autenticado.

```http
GET /api/verificacion/estado-usuario
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "verificado": true,
    "telefono": "1123456789"
  }
}
```

---

## Modelos de Datos

### Usuario

```javascript
{
  "_id": ObjectId,
  "nombre": String,
  "apellido": String,
  "email": String,
  "password": String,  // hasheado
  "telefono": String,
  "telefonoVerificado": Boolean,
  "rol": "cliente" | "barbero" | "admin",
  "foto": String,
  "activo": Boolean,
  "proveedor": "local" | "google",
  "googleId": String,
  "createdAt": Date,
  "updatedAt": Date
}
```

### Turno

```javascript
{
  "_id": ObjectId,
  "cliente": ObjectId,  // ref Cliente
  "barbero": ObjectId,  // ref Barbero (nullable)
  "servicio": ObjectId, // ref Servicio
  "fecha": Date,
  "hora": String,       // "HH:mm"
  "estado": "pendiente" | "reservado" | "completado" | "cancelado",
  "precio": Number,
  "requiereSena": Boolean,
  "pago": ObjectId,     // ref Pago (nullable)
  "senaPagada": Boolean,
  "estadoPago": "sin_sena" | "pendiente" | "pagada" | "aplicada" | "retenida",
  "tokenCancelacion": String,
  "recordatorioEnviado": Boolean,
  "recordatorioPagoEnviado": Boolean,
  "createdAt": Date,
  "updatedAt": Date
}
```

### Pago

```javascript
{
  "_id": ObjectId,
  "turno": ObjectId,
  "cliente": ObjectId,
  "monto": Number,
  "montoTotal": Number,
  "porcentajeSena": Number,
  "estado": "pendiente" | "aprobado" | "rechazado" | "devuelto" | "expirado",
  "metodoPago": String,
  "preferenciaId": String,
  "pagoId": String,
  "estadoMP": String,
  "urlPago": String,
  "fechaPago": Date,
  "aplicado": Boolean,
  "devuelto": Boolean,
  "motivoDevolucion": String,
  "createdAt": Date,
  "updatedAt": Date
}
```

---

## Códigos de Estado

| Código | Descripción |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Datos inválidos o faltantes |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - No autorizado (rol insuficiente) |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (ej: horario no disponible) |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Error del servidor |

---

## Rate Limiting

Límites de peticiones para prevenir abuso:

| Endpoint | Límite |
|----------|--------|
| `/api/auth/registro` | 5 peticiones / 15 min |
| `/api/auth/login` | 10 peticiones / 15 min |
| `/api/auth/cambiar-password` | 3 peticiones / 15 min |
| `/api/verificacion/enviar-codigo` | 3 peticiones / 15 min |
| Global `/api/*` | 100 peticiones / 15 min |

---

## Notas Adicionales

### Timezone

El sistema usa **UTC** para almacenar fechas en la base de datos, pero maneja conversiones para **Argentina (UTC-3)**.

### Paginación

Endpoints que retornan listas soportan paginación:
- `page`: Número de página (default: 1)
- `limit`: Resultados por página (default: 10)

### CORS

El backend acepta peticiones de:
- `FRONTEND_URL` configurado en variables de entorno
- `http://localhost:5173` (desarrollo)

### Logs

El backend loguea:
- `[TURNOS]` - Operaciones de turnos
- `[CRON]` - Tareas programadas
- `[RECORDATORIO PAGO]` - Recordatorios de pago
- `[WEBHOOK]` - Notificaciones de MercadoPago

---

**Documentación generada para Sistema de Gestión de Barbería v1.0.0**

Para más información, consulta [README.md](README.md) o [ENV_GUIDE.md](ENV_GUIDE.md).
