# Plan de Implementación - Funciones Faltantes para Completar el Proyecto al 100%

**Nota para el futuro:** Este documento contiene el plan detallado de las funcionalidades que faltan implementar para convertir este sistema de gestión de barbería en un producto comercial completo y listo para vender.

---

## CATEGORÍA 1: CRÍTICAS PARA VENDER (No negociables)

### 1. Módulo de Gestión de Disponibilidad (PRIORIDAD MÁXIMA)
**Objetivo:** El Admin debe poder autogestionar horarios sin intervención del desarrollador.

#### Backend a implementar:
- **Modelo `DisponibilidadGeneral`:**
  - Campos: `dia_semana` (0-6), `hora_inicio`, `hora_fin`, `activo`
  - Representa los horarios generales de apertura de la barbería

- **Modelo `DisponibilidadBarbero`:**
  - Campos: `barbero_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `activo`
  - Permite horarios específicos por barbero

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
- **Nueva sección en Dashboard Admin:**
  - `GestionDisponibilidad.jsx` con tabs:
    - Tab 1: "Horarios Generales" - Cuadrícula Lunes a Domingo con horarios
    - Tab 2: "Horarios por Barbero" - Selector de barbero + su cuadrícula personalizada
    - Tab 3: "Bloqueos y Excepciones" - Calendario con formulario para crear bloqueos

- **Modificar `paso3_FechaHora.jsx`:**
  - Consumir el nuevo endpoint de slots disponibles
  - Deshabilitar fechas/horas bloqueadas
  - Mostrar claramente por qué un slot no está disponible (bloqueado, fuera de horario, etc.)

---

### 2. Flujo de Recuperación de Contraseña
**Objetivo:** Permitir a los usuarios recuperar acceso sin intervención del desarrollador.

#### Backend a implementar:
- **Instalar dependencia:** `npm install nodemailer`
- **Configurar servicio de email:**
  - Crear `services/emailService.js`
  - Configurar Nodemailer con Gmail o SendGrid
  - Variables de entorno: `EMAIL_USER`, `EMAIL_PASS`

- **Modelo `TokenRecuperacion`:**
  - Campos: `usuario_id`, `token` (hash), `expiracion`, `usado`

- **Endpoints nuevos:**
  - `POST /api/auth/solicitar-recuperacion` - Recibe email, genera token, envía email
  - `POST /api/auth/validar-token-recuperacion` - Valida si un token es válido y no expiró
  - `POST /api/auth/resetear-contraseña` - Recibe token + nueva contraseña, actualiza

#### Frontend a implementar:
- **Nueva página:** `SolicitarRecuperacion.jsx`
  - Formulario simple: campo email + botón "Enviar"
  - Link desde `Login.jsx`: "¿Olvidaste tu contraseña?"

- **Nueva página:** `ResetearContraseña.jsx`
  - Recibe el token como query param: `/resetear-contraseña?token=xxx`
  - Formulario: nueva contraseña + confirmar contraseña
  - Botón "Restablecer"

#### Email a diseñar:
- Template HTML con el link de recuperación
- Debe incluir: nombre de la barbería, instrucciones claras, expiración del link (ej. 1 hora)

---

### 3. Panel de Configuración del Negocio
**Objetivo:** El cliente puede personalizar su instancia sin tocar código.

#### Backend a implementar:
- **Modelo `ConfiguracionNegocio`:**
  - Campos: `nombre_negocio`, `direccion`, `telefono`, `logo_url`, `duracion_turno_minutos`, `email_contacto`
  - Solo habrá 1 registro en esta tabla

- **Endpoints nuevos:**
  - `GET /api/configuracion` - Obtener configuración actual
  - `PUT /api/configuracion` - Actualizar configuración (solo Admin)
  - `POST /api/configuracion/upload-logo` - Subir imagen del logo (usar multer)

#### Frontend a implementar:
- **Nueva sección en Dashboard Admin:** `ConfiguracionNegocio.jsx`
  - Formulario con campos:
    - Nombre de la barbería
    - Dirección
    - Teléfono
    - Email de contacto
    - Duración de turnos (selector: 15, 30, 45, 60 minutos)
    - Upload de logo (preview de la imagen)
  - Botón "Guardar Cambios"

- **Usar la configuración en toda la app:**
  - Crear un contexto global `ConfiguracionContext` que cargue la config al inicio
  - Reemplazar nombres hardcodeados por `config.nombre_negocio`
  - Mostrar el logo en el navbar/header

---

## CATEGORÍA 2: PROFESIONALES (Robustez y Seguridad)

### 4. Capa de Seguridad de Producción

#### Backend a implementar:

**A. Validación de Entradas:**
- **Instalar:** `npm install joi`
- **Crear carpeta:** `middlewares/validators/`
- **Crear validadores para cada endpoint:**
  - `authValidator.js` - Validar login, registro, recuperación
  - `turnoValidator.js` - Validar creación/modificación de turnos
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
  - Login: máx 5 intentos por 15 minutos
  - Registro: máx 3 por hora por IP
  - Recuperación de contraseña: máx 3 por hora
  ```javascript
  router.post('/login', loginLimiter, authController.login)
  ```

**D. Sanitización de Errores:**
- En producción, NO devolver stack traces al cliente
- Crear middleware de manejo de errores centralizado
- Loggear errores en un archivo (usar `winston` o `morgan`)

---

### 5. Pruebas Automatizadas (Testing)

#### Backend a implementar:

**A. Configuración inicial:**
- **Instalar:** `npm install --save-dev jest supertest`
- **Crear:** `backend/jest.config.js`
- **Crear carpeta:** `backend/__tests__/`

**B. Pruebas Unitarias (services):**
- **Archivo:** `__tests__/unit/turnoService.test.js`
  - Test: crear turno con datos válidos
  - Test: validar que no se pueda crear turno en horario ocupado
  - Test: calcular slots disponibles correctamente

- **Archivo:** `__tests__/unit/authService.test.js`
  - Test: hash de contraseña funciona
  - Test: validar contraseña correcta
  - Test: generar JWT válido

**C. Pruebas de Integración (API):**
- **Archivo:** `__tests__/integration/auth.test.js`
  - Test: `POST /api/auth/registro` - registro exitoso
  - Test: `POST /api/auth/login` - login exitoso
  - Test: `POST /api/auth/login` - login con credenciales incorrectas

- **Archivo:** `__tests__/integration/turnos.test.js`
  - Test: `POST /api/turnos` - crear turno autenticado
  - Test: `GET /api/turnos` - listar turnos del usuario
  - Test: `DELETE /api/turnos/:id` - cancelar turno

**D. Base de datos de pruebas:**
- Usar SQLite en memoria para tests (más rápido)
- Crear archivo `testSetup.js` que inicialice DB de pruebas
- Limpiar DB después de cada test

**E. Script en package.json:**
```json
"scripts": {
  "test": "jest --coverage",
  "test:watch": "jest --watch"
}
```

---

## ORDEN DE IMPLEMENTACIÓN RECOMENDADO:

1. **Primero:** Módulo de Gestión de Disponibilidad (sin esto, el Admin depende de ti)
2. **Segundo:** Panel de Configuración del Negocio (personalización básica)
3. **Tercero:** Seguridad de Producción (helmet, rate limiting, validación)
4. **Cuarto:** Recuperación de Contraseña (funcionalidad esperada en cualquier app)
5. **Quinto:** Testing (asegura que todo lo anterior funcione correctamente)

---

## NOTAS TÉCNICAS IMPORTANTES:

### Para el módulo de disponibilidad:
- La lógica de cálculo de slots debe considerar:
  1. Horarios generales de la barbería
  2. Horarios específicos del barbero seleccionado
  3. Bloqueos activos (generales o del barbero)
  4. Turnos ya reservados
- Optimizar consultas para evitar lentitud al cargar el calendario

### Para recuperación de contraseña:
- El token debe expirar en 1 hora máximo
- Hashear el token antes de guardarlo en DB (como las contraseñas)
- Invalidar el token después de usarlo
- No revelar si el email existe o no (por seguridad)

### Para configuración del negocio:
- El logo debe subirse a una carpeta `uploads/` en el servidor
- Validar tamaño máximo (ej. 2MB) y tipos de archivo (jpg, png)
- Crear middleware para servir archivos estáticos de uploads
- Considerar usar Cloudinary para producción (escalable)

### Para testing:
- Apuntar a 80% de cobertura mínimo en funciones críticas
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
# Posiblemente necesites una librería de calendario más avanzada
npm install react-big-calendar date-fns
```

---

## CHECKLIST FINAL ANTES DE VENDER:

- [ ] Admin puede definir horarios de apertura de la barbería
- [ ] Admin puede asignar horarios específicos a cada barbero
- [ ] Admin puede crear bloqueos (vacaciones, feriados, descansos)
- [ ] Sistema de reservas respeta toda la disponibilidad configurada
- [ ] Usuarios pueden recuperar su contraseña por email
- [ ] Admin puede cambiar nombre, dirección, teléfono, logo de su negocio
- [ ] Todas las rutas de API tienen validación de entradas
- [ ] Helmet está activado en producción
- [ ] Rate limiting está aplicado en login, registro, recuperación
- [ ] Tests unitarios cubren servicios críticos (turnos, auth)
- [ ] Tests de integración cubren endpoints principales
- [ ] La app funciona sin hardcodear datos del negocio
- [ ] No hay stack traces expuestos al cliente en producción

---

**¡Éxito con la implementación! Este plan te guiará paso a paso hacia un producto comercial completo y profesional.**
