# Plan de Implementaci�n - Funciones Faltantes para Completar el Proyecto al 100%

**Nota para el futuro:** Este documento contiene el plan detallado de las funcionalidades que faltan implementar para convertir este sistema de gesti�n de barber�a en un producto comercial completo y listo para vender.

---

## CATEGOR�A 1: CR�TICAS PARA VENDER (No negociables)

### 1. M�dulo de Gesti�n de Disponibilidad (PRIORIDAD M�XIMA)
**Objetivo:** El Admin debe poder autogestionar horarios sin intervenci�n del desarrollador.

#### Backend a implementar:
- **Modelo `DisponibilidadGeneral`:**
  - Campos: `dia_semana` (0-6), `hora_inicio`, `hora_fin`, `activo`
  - Representa los horarios generales de apertura de la barber�a

- **Modelo `DisponibilidadBarbero`:**
  - Campos: `barbero_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `activo`
  - Permite horarios espec�ficos por barbero

- **Modelo `Bloqueo`:**
  - Campos: `barbero_id` (nullable), `fecha_inicio`, `fecha_fin`, `hora_inicio` (nullable), `hora_fin` (nullable), `motivo`, `tipo` (DIA_COMPLETO, RANGO_HORAS)
  - Para feriados, vacaciones, descansos, etc.

- **Endpoints nuevos:**
  - `POST /api/disponibilidad/general` - Crear/actualizar horarios generales
  - `GET /api/disponibilidad/general` - Obtener horarios generales
  - `POST /api/disponibilidad/barbero` - Asignar horarios por barbero
  - `GET /api/disponibilidad/barbero/:id` - Obtener horarios de un barbero
  - `POST /api/disponibilidad/bloqueo` - Crear bloqueo
  - `GET /api/disponibilidad/bloqueos` - Listar bloqueos activos
  - `DELETE /api/disponibilidad/bloqueo/:id` - Eliminar bloqueo
  - `GET /api/disponibilidad/slots-disponibles` - Endpoint mejorado que calcula slots considerando disponibilidad general, por barbero y bloqueos

#### Frontend a implementar:
- **Nueva secci�n en Dashboard Admin:**
  - `GestionDisponibilidad.jsx` con tabs:
    - Tab 1: "Horarios Generales" - Cuadr�cula Lunes a Domingo con horarios
    - Tab 2: "Horarios por Barbero" - Selector de barbero + su cuadr�cula personalizada
    - Tab 3: "Bloqueos y Excepciones" - Calendario con formulario para crear bloqueos

- **Modificar `paso3_FechaHora.jsx`:**
  - Consumir el nuevo endpoint de slots disponibles
  - Deshabilitar fechas/horas bloqueadas
  - Mostrar claramente por qu� un slot no est� disponible (bloqueado, fuera de horario, etc.)

---

### 2. Flujo de Recuperaci�n de Contrase�a
**Objetivo:** Permitir a los usuarios recuperar acceso sin intervenci�n del desarrollador.

#### Backend a implementar:
- **Instalar dependencia:** `npm install nodemailer`
- **Configurar servicio de email:**
  - Crear `services/emailService.js`
  - Configurar Nodemailer con Gmail o SendGrid
  - Variables de entorno: `EMAIL_USER`, `EMAIL_PASS`

- **Modelo `TokenRecuperacion`:**
  - Campos: `usuario_id`, `token` (hash), `expiracion`, `usado`

- **Endpoints nuevos:**
  - `POST /api/auth/solicitar-recuperacion` - Recibe email, genera token, env�a email
  - `POST /api/auth/validar-token-recuperacion` - Valida si un token es v�lido y no expir�
  - `POST /api/auth/resetear-contrase�a` - Recibe token + nueva contrase�a, actualiza

#### Frontend a implementar:
- **Nueva p�gina:** `SolicitarRecuperacion.jsx`
  - Formulario simple: campo email + bot�n "Enviar"
  - Link desde `Login.jsx`: "�Olvidaste tu contrase�a?"

- **Nueva p�gina:** `ResetearContrase�a.jsx`
  - Recibe el token como query param: `/resetear-contrase�a?token=xxx`
  - Formulario: nueva contrase�a + confirmar contrase�a
  - Bot�n "Restablecer"

#### Email a dise�ar:
- Template HTML con el link de recuperaci�n
- Debe incluir: nombre de la barber�a, instrucciones claras, expiraci�n del link (ej. 1 hora)

---

### 3. Panel de Configuraci�n del Negocio
**Objetivo:** El cliente puede personalizar su instancia sin tocar c�digo.

#### Backend a implementar:
- **Modelo `ConfiguracionNegocio`:**
  - Campos: `nombre_negocio`, `direccion`, `telefono`, `logo_url`, `duracion_turno_minutos`, `email_contacto`
  - Solo habr� 1 registro en esta tabla

- **Endpoints nuevos:**
  - `GET /api/configuracion` - Obtener configuraci�n actual
  - `PUT /api/configuracion` - Actualizar configuraci�n (solo Admin)
  - `POST /api/configuracion/upload-logo` - Subir imagen del logo (usar multer)

#### Frontend a implementar:
- **Nueva secci�n en Dashboard Admin:** `ConfiguracionNegocio.jsx`
  - Formulario con campos:
    - Nombre de la barber�a
    - Direcci�n
    - Tel�fono
    - Email de contacto
    - Duraci�n de turnos (selector: 15, 30, 45, 60 minutos)
    - Upload de logo (preview de la imagen)
  - Bot�n "Guardar Cambios"

- **Usar la configuraci�n en toda la app:**
  - Crear un contexto global `ConfiguracionContext` que cargue la config al inicio
  - Reemplazar nombres hardcodeados por `config.nombre_negocio`
  - Mostrar el logo en el navbar/header

---

## CATEGOR�A 2: PROFESIONALES (Robustez y Seguridad)

### 4. Capa de Seguridad de Producci�n

#### Backend a implementar:

**A. Validaci�n de Entradas:**
- **Instalar:** `npm install joi`
- **Crear carpeta:** `middlewares/validators/`
- **Crear validadores para cada endpoint:**
  - `authValidator.js` - Validar login, registro, recuperaci�n
  - `turnoValidator.js` - Validar creaci�n/modificaci�n de turnos
  - `disponibilidadValidator.js` - Validar horarios y bloqueos
- **Aplicar middleware en routes:**
  ```javascript
  router.post('/turnos', turnoValidator, turnoController.crear)
  ```

**B. Headers de Seguridad:**
- **Instalar:** `npm install helmet`
- **En `backend/index.js`:**
  ```javascript
  const helmet = require('helmet');
  app.use(helmet());
  ```

**C. Rate Limiting:**
- **Instalar:** `npm install express-rate-limit`
- **Crear:** `middlewares/rateLimiter.js`
- **Aplicar a rutas sensibles:**
  - Login: m�x 5 intentos por 15 minutos
  - Registro: m�x 3 por hora por IP
  - Recuperaci�n de contrase�a: m�x 3 por hora
  ```javascript
  router.post('/login', loginLimiter, authController.login)
  ```

**D. Sanitizaci�n de Errores:**
- En producci�n, NO devolver stack traces al cliente
- Crear middleware de manejo de errores centralizado
- Loggear errores en un archivo (usar `winston` o `morgan`)

---

### 5. Pruebas Automatizadas (Testing)

#### Backend a implementar:

**A. Configuraci�n inicial:**
- **Instalar:** `npm install --save-dev jest supertest`
- **Crear:** `backend/jest.config.js`
- **Crear carpeta:** `backend/__tests__/`

**B. Pruebas Unitarias (services):**
- **Archivo:** `__tests__/unit/turnoService.test.js`
  - Test: crear turno con datos v�lidos
  - Test: validar que no se pueda crear turno en horario ocupado
  - Test: calcular slots disponibles correctamente

- **Archivo:** `__tests__/unit/authService.test.js`
  - Test: hash de contrase�a funciona
  - Test: validar contrase�a correcta
  - Test: generar JWT v�lido

**C. Pruebas de Integraci�n (API):**
- **Archivo:** `__tests__/integration/auth.test.js`
  - Test: `POST /api/auth/registro` - registro exitoso
  - Test: `POST /api/auth/login` - login exitoso
  - Test: `POST /api/auth/login` - login con credenciales incorrectas

- **Archivo:** `__tests__/integration/turnos.test.js`
  - Test: `POST /api/turnos` - crear turno autenticado
  - Test: `GET /api/turnos` - listar turnos del usuario
  - Test: `DELETE /api/turnos/:id` - cancelar turno

**D. Base de datos de pruebas:**
- Usar SQLite en memoria para tests (m�s r�pido)
- Crear archivo `testSetup.js` que inicialice DB de pruebas
- Limpiar DB despu�s de cada test

**E. Script en package.json:**
```json
"scripts": {
  "test": "jest --coverage",
  "test:watch": "jest --watch"
}
```

---

## ORDEN DE IMPLEMENTACI�N RECOMENDADO:

1. **Primero:** M�dulo de Gesti�n de Disponibilidad (sin esto, el Admin depende de ti)
2. **Segundo:** Panel de Configuraci�n del Negocio (personalizaci�n b�sica)
3. **Tercero:** Seguridad de Producci�n (helmet, rate limiting, validaci�n)
4. **Cuarto:** Recuperaci�n de Contrase�a (funcionalidad esperada en cualquier app)
5. **Quinto:** Testing (asegura que todo lo anterior funcione correctamente)

---

## NOTAS T�CNICAS IMPORTANTES:

### Para el m�dulo de disponibilidad:
- La l�gica de c�lculo de slots debe considerar:
  1. Horarios generales de la barber�a
  2. Horarios espec�ficos del barbero seleccionado
  3. Bloqueos activos (generales o del barbero)
  4. Turnos ya reservados
- Optimizar consultas para evitar lentitud al cargar el calendario

### Para recuperaci�n de contrase�a:
- El token debe expirar en 1 hora m�ximo
- Hashear el token antes de guardarlo en DB (como las contrase�as)
- Invalidar el token despu�s de usarlo
- No revelar si el email existe o no (por seguridad)

### Para configuraci�n del negocio:
- El logo debe subirse a una carpeta `uploads/` en el servidor
- Validar tama�o m�ximo (ej. 2MB) y tipos de archivo (jpg, png)
- Crear middleware para servir archivos est�ticos de uploads
- Considerar usar Cloudinary para producci�n (escalable)

### Para testing:
- Apuntar a 80% de cobertura m�nimo en funciones cr�ticas
- Mockear servicios externos (email, Twilio) en los tests
- Usar beforeEach/afterEach para limpiar estado entre tests

---

## DEPENDENCIAS ADICIONALES A INSTALAR:

### Backend:
```bash
npm install nodemailer joi helmet express-rate-limit multer
npm install --save-dev jest supertest
```

### Frontend:
```bash
# Posiblemente necesites una librer�a de calendario m�s avanzada
npm install react-big-calendar date-fns
```

---

## CHECKLIST FINAL ANTES DE VENDER:

- [ ] Admin puede definir horarios de apertura de la barber�a
- [ ] Admin puede asignar horarios espec�ficos a cada barbero
- [ ] Admin puede crear bloqueos (vacaciones, feriados, descansos)
- [ ] Sistema de reservas respeta toda la disponibilidad configurada
- [ ] Usuarios pueden recuperar su contrase�a por email
- [ ] Admin puede cambiar nombre, direcci�n, tel�fono, logo de su negocio
- [ ] Todas las rutas de API tienen validaci�n de entradas
- [ ] Helmet est� activado en producci�n
- [ ] Rate limiting est� aplicado en login, registro, recuperaci�n
- [ ] Tests unitarios cubren servicios cr�ticos (turnos, auth)
- [ ] Tests de integraci�n cubren endpoints principales
- [ ] La app funciona sin hardcodear datos del negocio
- [ ] No hay stack traces expuestos al cliente en producci�n

---

**��xito con la implementaci�n! Este plan te guiar� paso a paso hacia un producto comercial completo y profesional.**
