# ⚙️ Guía de Configuración de Variables de Entorno

Esta guía detalla cómo configurar todas las variables de entorno necesarias para el Sistema de Gestión de Barbería.

---

## 📋 Tabla de Contenidos

- [Introducción](#introducción)
- [Backend](#backend)
  - [Variables Requeridas](#variables-requeridas)
  - [Variables Opcionales](#variables-opcionales)
  - [Archivo Completo](#archivo-completo-backendenv)
- [Frontend](#frontend)
- [Obtener Credenciales](#obtener-credenciales)
  - [MongoDB](#1-mongodb)
  - [Twilio](#2-twilio-whatsapp)
  - [MercadoPago](#3-mercadopago)
  - [Gmail](#4-gmail)
  - [Google OAuth](#5-google-oauth-opcional)
- [Ambientes](#ambientes)
- [Troubleshooting](#troubleshooting)

---

## Introducción

El proyecto requiere configurar variables de entorno en dos lugares:
1. **Backend** (`backend/.env`) - Servidor Node.js
2. **Frontend** (`frontend/.env`) - Aplicación React

⚠️ **IMPORTANTE:** Nunca versionar archivos `.env` en git (ya están en `.gitignore`).

---

## Backend

### Variables Requeridas

Estas variables son **obligatorias** para que el sistema funcione:

#### 🔧 Servidor

```env
# Puerto donde corre el servidor backend
PORT=3000

# Ambiente: development | production
NODE_ENV=development
```

- **`PORT`**: Puerto del servidor Express (default: 3000)
- **`NODE_ENV`**: Ambiente de ejecución
  - `development`: Modo desarrollo (logs detallados, sin optimizaciones)
  - `production`: Modo producción (logs mínimos, optimizaciones activadas, cron jobs activos)

---

#### 💾 Base de Datos

```env
# URI de conexión a MongoDB
MONGODB_URI=mongodb://localhost:27017/barberia
```

- **`MONGODB_URI`**: String de conexión a MongoDB

**Ejemplos:**

Conexión local:
```
MONGODB_URI=mongodb://localhost:27017/barberia
```

MongoDB Atlas (cloud):
```
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/barberia?retryWrites=true&w=majority
```

---

#### 🌐 URLs

```env
# URL del frontend (para CORS)
FRONTEND_URL=http://localhost:5173

# URL del backend (para callbacks y emails)
BACKEND_URL=http://localhost:3000
```

- **`FRONTEND_URL`**: Dirección del frontend
  - Desarrollo: `http://localhost:5173`
  - Producción: `https://www.mibarberia.com`
  - **SIN barra al final**

- **`BACKEND_URL`**: Dirección del backend
  - Desarrollo: `http://localhost:3000`
  - Producción: `https://api.mibarberia.com`
  - **SIN barra al final**

---

#### 🔐 JWT (Autenticación)

```env
# Clave secreta para firmar tokens JWT (CAMBIAR EN PRODUCCIÓN)
JWT_SECRET=YOUR_SECRET_KEY_HERE

# Tiempo de expiración de tokens
JWT_EXPIRATION=7d
```

- **`JWT_SECRET`**: Clave secreta para firmar tokens
  - ⚠️ **CRÍTICO**: Debe ser aleatorio y seguro en producción
  - Generar con: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

- **`JWT_EXPIRATION`**: Duración de tokens
  - Ejemplos: `7d` (7 días), `24h` (24 horas), `30m` (30 minutos)

---

#### 📱 Twilio (WhatsApp)

```env
# Credenciales de Twilio
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Minutos de anticipación para recordatorios (default: 30)
ANTICIPACION_RECORDATORIO_MINUTOS=30
```

- **`TWILIO_ACCOUNT_SID`**: Account SID de Twilio
- **`TWILIO_AUTH_TOKEN`**: Auth Token de Twilio
- **`TWILIO_WHATSAPP_FROM`**: Número WhatsApp de Twilio
  - Formato: `whatsapp:+14155238886`
  - **Sandbox**: `whatsapp:+14155238886` (desarrollo)
  - **Producción**: `whatsapp:+5491123456789` (tu número)

- **`ANTICIPACION_RECORDATORIO_MINUTOS`**: Tiempo antes del turno para enviar recordatorio
  - Recomendado: 30 minutos

---

#### 💳 MercadoPago

```env
# Credenciales de MercadoPago
MERCADOPAGO_ACCESS_TOKEN=YOUR_MERCADOPAGO_ACCESS_TOKEN
MERCADOPAGO_PUBLIC_KEY=YOUR_MERCADOPAGO_PUBLIC_KEY
```

- **`MERCADOPAGO_ACCESS_TOKEN`**: Access Token de MercadoPago
  - ⚠️ Usar credenciales de **PRODUCCIÓN** en producción, no TEST

- **`MERCADOPAGO_PUBLIC_KEY`**: Public Key de MercadoPago

---

#### 📧 Email (Gmail)

```env
# Cuenta Gmail para enviar emails
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=YOUR_GMAIL_APP_PASSWORD
```

- **`EMAIL_USER`**: Dirección de Gmail
- **`EMAIL_PASS`**: **App Password** de Gmail (NO contraseña normal)
  - ⚠️ Debe ser App Password de 16 caracteres

---

#### 🏢 Negocio

```env
# Nombre del negocio
NOMBRE_NEGOCIO=Barbería GR
BUSINESS_NAME=Barbería GR
```

- **`NOMBRE_NEGOCIO`**: Nombre que aparece en emails y WhatsApp
- **`BUSINESS_NAME`**: Nombre del negocio (puede ser igual a NOMBRE_NEGOCIO)

---

### Variables Opcionales

Estas variables son **opcionales**. Si no se configuran, ciertas funcionalidades no estarán disponibles:

#### 🔑 Google OAuth

```env
# Credenciales de Google OAuth (opcional)
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

- **`GOOGLE_CLIENT_ID`**: Client ID de Google Cloud Console
- **`GOOGLE_CLIENT_SECRET`**: Client Secret
- **`GOOGLE_CALLBACK_URL`**: URL de callback después de login
  - Desarrollo: `http://localhost:3000/api/auth/google/callback`
  - Producción: `https://api.mibarberia.com/api/auth/google/callback`

Si no se configuran, el botón "Iniciar con Google" no aparecerá.

---

### Archivo Completo `backend/.env`

Ejemplo de archivo `.env` completo para desarrollo:

```env
# ============================================
# SERVIDOR
# ============================================
PORT=3000
NODE_ENV=development

# ============================================
# BASE DE DATOS
# ============================================
MONGODB_URI=mongodb://localhost:27017/barberia

# ============================================
# URLs
# ============================================
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

# ============================================
# JWT
# ============================================
JWT_SECRET=YOUR_SECRET_KEY_HERE
JWT_EXPIRATION=7d

# ============================================
# TWILIO (WhatsApp)
# ============================================
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
ANTICIPACION_RECORDATORIO_MINUTOS=30

# ============================================
# MERCADOPAGO
# ============================================
MERCADOPAGO_ACCESS_TOKEN=YOUR_MERCADOPAGO_ACCESS_TOKEN
MERCADOPAGO_PUBLIC_KEY=YOUR_MERCADOPAGO_PUBLIC_KEY

# ============================================
# EMAIL (Gmail)
# ============================================
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=YOUR_GMAIL_APP_PASSWORD

# ============================================
# NEGOCIO
# ============================================
NOMBRE_NEGOCIO=Barbería GR
BUSINESS_NAME=Barbería GR

# ============================================
# GOOGLE OAUTH (Opcional)
# ============================================
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

---

## Frontend

El frontend solo requiere **1 variable**:

### `frontend/.env`

```env
# URL de la API backend
VITE_API_URL=http://localhost:3000/api
```

- **`VITE_API_URL`**: URL completa de la API
  - Desarrollo: `http://localhost:3000/api`
  - Producción: `https://api.mibarberia.com/api`
  - **CON `/api` al final**
  - **SIN barra al final después de `/api`**

⚠️ **IMPORTANTE:** Las variables en Vite deben empezar con `VITE_`.

---

## Obtener Credenciales

### 1. MongoDB

#### Opción A: MongoDB Local

1. Instalar MongoDB Community:
   - **Windows**: https://www.mongodb.com/try/download/community
   - **Mac**: `brew install mongodb-community`
   - **Linux**: `sudo apt install mongodb`

2. Iniciar MongoDB:
   ```bash
   mongod
   ```

3. Usar:
   ```env
   MONGODB_URI=mongodb://localhost:27017/barberia
   ```

#### Opción B: MongoDB Atlas (Cloud - Recomendado)

1. Ir a [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Crear cuenta (gratis)
3. Crear cluster gratuito:
   - Elegir región más cercana
   - Tier: M0 Sandbox (gratis)
4. Configurar acceso:
   - **Database Access**: Crear usuario y contraseña
   - **Network Access**: Agregar tu IP (o `0.0.0.0/0` para desarrollo)
5. Obtener string de conexión:
   - Click en "Connect"
   - "Connect your application"
   - Copiar string: `mongodb+srv://usuario:password@cluster.mongodb.net/barberia`

Ejemplo:
```env
MONGODB_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/barberia?retryWrites=true&w=majority
```

---

### 2. Twilio (WhatsApp)

1. Ir a [twilio.com](https://www.twilio.com/)
2. Crear cuenta (trial gratuito: $15 de crédito)
3. Verificar número de teléfono
4. Ir a **Messaging** → **Try it out** → **Send a WhatsApp message**
5. Activar **Twilio Sandbox for WhatsApp**:
   - Enviar mensaje desde tu WhatsApp al número indicado
   - Ejemplo: `join <code>` a `+1 415 523 8886`
6. Obtener credenciales:
   - **Account SID**: En el dashboard principal
   - **Auth Token**: Click en "Show" en el dashboard
   - **WhatsApp From**: Sandbox number `whatsapp:+14155238886`

Configurar:
```env
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

#### Para Producción (Twilio número propio)

1. Comprar número Twilio con WhatsApp habilitado (~$2/mes)
2. Solicitar aprobación de WhatsApp Business (1-2 semanas)
3. Usar: `TWILIO_WHATSAPP_FROM=whatsapp:+5491123456789`

---

### 3. MercadoPago

1. Ir a [mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers)
2. Crear cuenta de desarrollador (gratis)
3. Ir a **Tus aplicaciones** → **Crear aplicación**
4. Completar datos de la aplicación
5. Obtener credenciales:
   - **Modo TEST** (para desarrollo):
     - Access Token: `TEST-123456...`
     - Public Key: `TEST-abc123...`
   - **Modo PRODUCCIÓN** (para producción):
     - Access Token: `APP_USR-123456...`
     - Public Key: `APP_USR-abc123...`

Configurar (TEST para desarrollo):
```env
MERCADOPAGO_ACCESS_TOKEN=TEST-YOUR_TEST_ACCESS_TOKEN
MERCADOPAGO_PUBLIC_KEY=TEST-YOUR_TEST_PUBLIC_KEY
```

Configurar (PRODUCCIÓN):
```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-YOUR_PRODUCTION_ACCESS_TOKEN
MERCADOPAGO_PUBLIC_KEY=APP_USR-YOUR_PRODUCTION_PUBLIC_KEY
```

⚠️ **IMPORTANTE:** Siempre usar credenciales de **PRODUCCIÓN** en el servidor de producción.

#### Configurar Webhook (Importante)

1. En panel de MercadoPago → Tu aplicación → **Webhooks**
2. Agregar URL de notificación:
   ```
   https://api.mibarberia.com/api/pagos/webhook
   ```
3. Eventos: Seleccionar **payment**

---

### 4. Gmail

Gmail requiere **App Password** (no contraseña normal) para mayor seguridad.

#### Pasos:

1. Ir a [myaccount.google.com/security](https://myaccount.google.com/security)
2. Activar **Verificación en 2 pasos**:
   - Seguridad → Verificación en 2 pasos → Activar
   - Completar configuración (SMS, app autenticadora, etc.)
3. Generar **App Password**:
   - Volver a Seguridad
   - Buscar "Contraseñas de aplicaciones"
   - Seleccionar app: **Correo**
   - Seleccionar dispositivo: **Otro (Nombre personalizado)**
   - Ingresar: "Sistema Barbería"
   - Click en **Generar**
4. Copiar contraseña de 16 caracteres (sin espacios):
   - Ejemplo: `abcd efgh ijkl mnop`

Configurar:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=YOUR_GMAIL_APP_PASSWORD
```

⚠️ **Nunca usar contraseña normal de Gmail**, solo App Password.

---

### 5. Google OAuth (Opcional)

Solo si quieres habilitar login con Google.

1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear proyecto nuevo
3. Ir a **APIs y servicios** → **Pantalla de consentimiento de OAuth**
   - Tipo: Externo
   - Completar información básica
   - Agregar scopes: `email`, `profile`
4. Ir a **Credenciales** → **Crear credenciales** → **ID de cliente de OAuth 2.0**
   - Tipo: Aplicación web
   - Nombre: Sistema Barbería
   - **URIs de redirección autorizados**:
     - Desarrollo: `http://localhost:3000/api/auth/google/callback`
     - Producción: `https://api.mibarberia.com/api/auth/google/callback`
5. Copiar:
   - **Client ID**: `123456789-xxxxxxxxx.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxxxxxxxxxxxxxx`

Configurar:
```env
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

---

## Ambientes

### Desarrollo Local

```env
# backend/.env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/barberia
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
JWT_SECRET=YOUR_SECRET_KEY_HERE
```

```env
# frontend/.env
VITE_API_URL=http://localhost:3000/api
```

---

### Producción (Vercel + Railway)

#### Railway (Backend)

Configurar en Variables:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/barberia
FRONTEND_URL=https://mibarberia.vercel.app
BACKEND_URL=https://backend-production.up.railway.app
JWT_SECRET=YOUR_SECRET_KEY_HERE
JWT_EXPIRATION=7d

TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_FROM=whatsapp:+5491123456789

MERCADOPAGO_ACCESS_TOKEN=YOUR_MERCADOPAGO_ACCESS_TOKEN  # PRODUCCIÓN
MERCADOPAGO_PUBLIC_KEY=YOUR_MERCADOPAGO_PUBLIC_KEY    # PRODUCCIÓN

EMAIL_USER=your-email@gmail.com
EMAIL_PASS=YOUR_GMAIL_APP_PASSWORD

NOMBRE_NEGOCIO=Barbería GR
BUSINESS_NAME=Barbería GR
ANTICIPACION_RECORDATORIO_MINUTOS=30
```

#### Vercel (Frontend)

Configurar en Environment Variables:

```env
VITE_API_URL=https://backend-production.up.railway.app/api
```

---

## Troubleshooting

### Error: "MONGODB_URI is not defined"

**Causa:** Falta variable `MONGODB_URI` en `.env`

**Solución:**
```bash
cd backend
cp .env.example .env
nano .env  # Configurar MONGODB_URI
```

---

### Error: "Cannot connect to MongoDB"

**Causa:** URI de MongoDB incorrecta o MongoDB no corriendo

**Soluciones:**

1. **MongoDB local:**
   ```bash
   mongod
   ```

2. **MongoDB Atlas:**
   - Verificar que la IP esté en whitelist
   - Verificar usuario y contraseña
   - Verificar formato del URI

---

### Error: "Invalid token" o "jwt malformed"

**Causa:** `JWT_SECRET` cambió o no está configurado

**Solución:**
1. Verificar que `JWT_SECRET` exista en `.env`
2. Hacer logout y login nuevamente
3. En producción, **nunca cambiar** `JWT_SECRET` (invalida todos los tokens)

---

### WhatsApp no llega

**Causa:** Credenciales de Twilio incorrectas o formato de número inválido

**Soluciones:**

1. Verificar credenciales:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxx  # Debe empezar con AC
   TWILIO_AUTH_TOKEN=xxxxxxxx
   ```

2. Verificar formato de número:
   ```env
   # Correcto
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

   # Incorrecto
   TWILIO_WHATSAPP_FROM=+14155238886  # Falta "whatsapp:"
   ```

3. Verificar que el sandbox esté activo (desarrollo)

4. Verificar logs del backend:
   ```bash
   # Local
   npm run dev

   # Railway
   Ver logs en el dashboard
   ```

---

### Emails no llegan

**Causa:** Contraseña de Gmail incorrecta o no es App Password

**Soluciones:**

1. Verificar que sea **App Password**, no contraseña normal:
   ```env
   # Correcto (16 caracteres)
   EMAIL_PASS=abcdefghijklmnop

   # Incorrecto (contraseña normal)
   EMAIL_PASS=MiContraseña123
   ```

2. Regenerar App Password en Google

3. Verificar que verificación en 2 pasos esté activa

---

### MercadoPago webhook no funciona

**Causa:** URL de webhook no configurada o incorrecta

**Soluciones:**

1. Configurar webhook en MercadoPago:
   ```
   https://api.mibarberia.com/api/pagos/webhook
   ```

2. Verificar que `BACKEND_URL` sea accesible públicamente

3. Verificar logs:
   ```bash
   docker-compose logs backend | grep WEBHOOK
   ```

---

### Error: "CORS Error"

**Causa:** `FRONTEND_URL` no coincide con el dominio del frontend

**Solución:**
```env
# Backend .env
FRONTEND_URL=https://mibarberia.vercel.app  # SIN barra al final
```

---

### Cron jobs no se ejecutan

**Causa:** `NODE_ENV` no está en `production`

**Solución:**
```env
NODE_ENV=production
```

Los cron jobs **solo corren en producción** por diseño.

---

## Checklist de Configuración

### Desarrollo Local

- [ ] `backend/.env` creado desde `.env.example`
- [ ] `MONGODB_URI` configurado (local o Atlas)
- [ ] `JWT_SECRET` configurado (cualquier string)
- [ ] Credenciales de Twilio (sandbox)
- [ ] Credenciales de MercadoPago (TEST)
- [ ] Gmail App Password configurado
- [ ] `frontend/.env` creado con `VITE_API_URL`
- [ ] Ejecutado `npm run seed` en backend

### Producción

- [ ] `NODE_ENV=production` configurado
- [ ] `MONGODB_URI` de MongoDB Atlas
- [ ] `JWT_SECRET` aleatorio de 64 caracteres
- [ ] `FRONTEND_URL` y `BACKEND_URL` con dominios reales
- [ ] Credenciales de Twilio (número propio)
- [ ] Credenciales de MercadoPago (**PRODUCCIÓN**)
- [ ] Gmail App Password
- [ ] Webhook de MercadoPago configurado
- [ ] Variables configuradas en plataforma (Railway/Vercel)
- [ ] Ejecutado seed en BD de producción

---

## Recursos

- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **Twilio**: https://www.twilio.com/
- **MercadoPago Developers**: https://www.mercadopago.com.ar/developers
- **Google Cloud Console**: https://console.cloud.google.com
- **Gmail App Passwords**: https://myaccount.google.com/security

---

**Guía actualizada para Sistema de Gestión de Barbería v1.0.0**

Para más información, consulta [README.md](README.md) o [API_DOC.md](API_DOC.md).
