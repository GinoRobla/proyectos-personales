# API Documentation - Red Social

Esta documentación describe todos los endpoints disponibles en la API REST de la Red Social.

## Base URL
```
http://localhost:3900/api
```

## Autenticación

La mayoría de endpoints requieren autenticación JWT. El token debe ser enviado en el header:
```
Authorization: Bearer <jwt_token>
```

## Índice
- [Usuarios](#usuarios)
- [Seguimiento](#seguimiento)
- [Publicaciones](#publicaciones)
- [Códigos de Estado](#códigos-de-estado)
- [Modelos de Datos](#modelos-de-datos)

---

## Usuarios

### Registro de Usuario
Crea una nueva cuenta de usuario.

**Endpoint:** `POST /api/user/register`

**Autenticación:** No requerida

**Body:**
```json
{
  "name": "string",
  "surname": "string (opcional)",
  "nick": "string",
  "email": "string",
  "password": "string",
  "bio": "string (opcional)"
}
```

**Respuesta Exitosa (201):**
```json
{
  "status": "success",
  "message": "Usuario registrado correctamente",
  "user": {
    "_id": "user_id",
    "name": "string",
    "surname": "string",
    "nick": "string",
    "email": "string",
    "bio": "string",
    "role": "role_user",
    "image": "default.png",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Inicio de Sesión
Autentica un usuario y retorna un JWT token.

**Endpoint:** `POST /api/user/login`

**Autenticación:** No requerida

**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Respuesta Exitosa (200):**
```json
{
  "status": "success",
  "message": "Login correcto",
  "user": {
    "_id": "user_id",
    "name": "string",
    "surname": "string",
    "nick": "string",
    "email": "string",
    "bio": "string",
    "role": "role_user",
    "image": "avatar_filename.png",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token_string"
}
```

### Obtener Perfil de Usuario
Obtiene la información de un usuario específico.

**Endpoint:** `GET /api/user/getProfile/:id`

**Autenticación:** Requerida

**Parámetros:**
- `id`: ID del usuario

**Respuesta Exitosa (200):**
```json
{
  "status": "success",
  "user": {
    "_id": "user_id",
    "name": "string",
    "surname": "string",
    "nick": "string",
    "bio": "string",
    "role": "role_user",
    "image": "avatar_filename.png",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "following": "boolean",
  "followers": "number",
  "following_count": "number",
  "publications": "number"
}
```

### Listar Usuarios
Obtiene una lista paginada de usuarios.

**Endpoint:** `GET /api/user/list/:page`

**Autenticación:** Requerida

**Parámetros:**
- `page`: Número de página (empezando en 1)

**Respuesta Exitosa (200):**
```json
{
  "status": "success",
  "users": [
    {
      "_id": "user_id",
      "name": "string",
      "surname": "string",
      "nick": "string",
      "bio": "string",
      "image": "avatar_filename.png",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "page": "number",
  "itemsPerPage": "number",
  "total": "number",
  "pages": "number",
  "users_following": ["user_id1", "user_id2"]
}
```

### Actualizar Usuario
Actualiza la información del usuario autenticado.

**Endpoint:** `PUT /api/user/update/:id`

**Autenticación:** Requerida

**Parámetros:**
- `id`: ID del usuario (debe coincidir con el usuario autenticado)

**Body:**
```json
{
  "name": "string",
  "surname": "string",
  "nick": "string",
  "email": "string",
  "bio": "string",
  "password": "string (opcional)"
}
```

**Respuesta Exitosa (200):**
```json
{
  "status": "success",
  "message": "Usuario actualizado correctamente",
  "user": {
    "_id": "user_id",
    "name": "string",
    "surname": "string",
    "nick": "string",
    "email": "string",
    "bio": "string",
    "image": "avatar_filename.png"
  }
}
```

### Subir Avatar
Sube una imagen de avatar para el usuario.

**Endpoint:** `POST /api/user/upload/:id`

**Autenticación:** Requerida

**Parámetros:**
- `id`: ID del usuario

**Body:** FormData con el campo `file0` conteniendo la imagen

**Respuesta Exitosa (200):**
```json
{
  "status": "success",
  "message": "Avatar subido correctamente",
  "user": "user_object",
  "file": "avatar_filename.png"
}
```

### Obtener Avatar
Obtiene la imagen de avatar de un usuario.

**Endpoint:** `GET /api/user/getAvatar/:file`

**Autenticación:** No requerida

**Parámetros:**
- `file`: Nombre del archivo de avatar

**Respuesta:** Imagen (Content-Type: image/*)

### Obtener Contadores
Obtiene estadísticas del usuario (publicaciones, seguidores, seguidos).

**Endpoint:** `GET /api/user/counters/:id`

**Autenticación:** Requerida

**Parámetros:**
- `id`: ID del usuario

**Respuesta Exitosa (200):**
```json
{
  "status": "success",
  "userId": "user_id",
  "following": "number",
  "followed": "number",
  "publications": "number"
}
```

---

## Seguimiento

### Seguir Usuario
Sigue a otro usuario.

**Endpoint:** `POST /api/follow/save`

**Autenticación:** Requerida

**Body:**
```json
{
  "followed": "user_id"
}
```

**Respuesta Exitosa (200):**
```json
{
  "status": "success",
  "message": "Usuario seguido correctamente",
  "follow": {
    "_id": "follow_id",
    "user": "current_user_id",
    "followed": "followed_user_id",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Dejar de Seguir
Deja de seguir a un usuario.

**Endpoint:** `DELETE /api/follow/unfollow/:id`

**Autenticación:** Requerida

**Parámetros:**
- `id`: ID del usuario a dejar de seguir

**Respuesta Exitosa (200):**
```json
{
  "status": "success",
  "message": "Usuario dejado de seguir correctamente"
}
```

### Obtener Seguidos
Lista los usuarios que sigue un usuario específico.

**Endpoint:** `GET /api/follow/following/:id/:page` o `GET /api/follow/following/:id`

**Autenticación:** Requerida

**Parámetros:**
- `id`: ID del usuario
- `page`: Número de página (opcional, default: 1)

**Respuesta Exitosa (200):**
```json
{
  "status": "success",
  "message": "Lista de usuarios seguidos",
  "follows": [
    {
      "_id": "follow_id",
      "user": "user_id",
      "followed": {
        "_id": "user_id",
        "name": "string",
        "surname": "string",
        "nick": "string",
        "image": "avatar_filename.png"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": "number",
  "page": "number",
  "pages": "number",
  "users_following": ["user_id1", "user_id2"]
}
```

---

## Publicaciones

### Crear Publicación
Crea una nueva publicación.

**Endpoint:** `POST /api/publication/save`

**Autenticación:** Requerida

**Body:**
```json
{
  "text": "string"
}
```

**Respuesta Exitosa (200):**
```json
{
  "status": "success",
  "message": "Publicación guardada correctamente",
  "publicationStored": {
    "_id": "publication_id",
    "user": "user_id",
    "text": "string",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Eliminar Publicación
Elimina una publicación propia.

**Endpoint:** `DELETE /api/publication/remove/:id`

**Autenticación:** Requerida

**Parámetros:**
- `id`: ID de la publicación

**Respuesta Exitosa (200):**
```json
{
  "status": "success",
  "message": "Publicación eliminada correctamente"
}
```

### Obtener Publicaciones de Usuario
Lista las publicaciones de un usuario específico.

**Endpoint:** `GET /api/publication/user/:id/:page`

**Autenticación:** Requerida

**Parámetros:**
- `id`: ID del usuario
- `page`: Número de página

**Respuesta Exitosa (200):**
```json
{
  "status": "success",
  "message": "Publicaciones del perfil de usuario",
  "user": "user_id",
  "page": "number",
  "pages": "number",
  "total": "number",
  "publications": [
    {
      "_id": "publication_id",
      "user": {
        "_id": "user_id",
        "name": "string",
        "surname": "string",
        "nick": "string",
        "image": "avatar_filename.png"
      },
      "text": "string",
      "file": "image_filename.jpg",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Subir Imagen a Publicación
Sube una imagen a una publicación existente.

**Endpoint:** `POST /api/publication/upload/:id`

**Autenticación:** Requerida

**Parámetros:**
- `id`: ID de la publicación

**Body:** FormData con el campo `file0` conteniendo la imagen

**Respuesta Exitosa (200):**
```json
{
  "status": "success",
  "message": "Archivo subido correctamente",
  "publication": "publication_object",
  "file": "image_filename.jpg"
}
```

### Obtener Imagen de Publicación
Obtiene una imagen de publicación.

**Endpoint:** `GET /api/publication/media/:file`

**Autenticación:** No requerida

**Parámetros:**
- `file`: Nombre del archivo de imagen

**Respuesta:** Imagen (Content-Type: image/*)

### Feed de Publicaciones
Obtiene el feed personalizado del usuario (publicaciones de usuarios seguidos).

**Endpoint:** `GET /api/publication/feed/:page`

**Autenticación:** Requerida

**Parámetros:**
- `page`: Número de página

**Respuesta Exitosa (200):**
```json
{
  "status": "success",
  "message": "Feed de publicaciones",
  "following": ["user_id1", "user_id2"],
  "page": "number",
  "pages": "number",
  "total": "number",
  "publications": [
    {
      "_id": "publication_id",
      "user": {
        "_id": "user_id",
        "name": "string",
        "surname": "string",
        "nick": "string",
        "image": "avatar_filename.png"
      },
      "text": "string",
      "file": "image_filename.jpg",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## Códigos de Estado

| Código | Descripción |
|--------|-------------|
| 200 | Operación exitosa |
| 201 | Recurso creado exitosamente |
| 400 | Error en la petición (datos inválidos) |
| 401 | No autorizado (token inválido o expirado) |
| 403 | Prohibido (acceso denegado) |
| 404 | Recurso no encontrado |
| 500 | Error interno del servidor |

## Modelos de Datos

### Usuario
```json
{
  "_id": "ObjectId",
  "name": "string",
  "surname": "string",
  "bio": "string",
  "nick": "string",
  "email": "string",
  "password": "string (hasheada)",
  "role": "string",
  "image": "string",
  "created_at": "Date"
}
```

### Seguimiento
```json
{
  "_id": "ObjectId",
  "user": "ObjectId (ref: User)",
  "followed": "ObjectId (ref: User)",
  "createdAt": "Date"
}
```

### Publicación
```json
{
  "_id": "ObjectId",
  "user": "ObjectId (ref: User)",
  "text": "string",
  "file": "string",
  "created_at": "Date"
}
```

## Paginación

Los endpoints que soportan paginación utilizan los siguientes parámetros:
- `page`: Número de página (empezando en 1)
- `itemsPerPage`: Elementos por página (generalmente 5)

La respuesta incluye:
- `page`: Página actual
- `pages`: Total de páginas
- `total`: Total de elementos

## Validaciones

### Registro de Usuario
- `name`: Requerido, string
- `nick`: Requerido, único, string
- `email`: Requerido, único, formato email válido
- `password`: Requerido, mínimo 6 caracteres

### Publicación
- `text`: Requerido, no vacío

### Archivos
- Formatos soportados: JPG, JPEG, PNG, GIF
- Tamaño máximo: No especificado (configurar según necesidades)

## Notas Importantes

1. **Autenticación**: Los tokens JWT tienen una expiración configurada en el servidor
2. **Autorización**: Los usuarios solo pueden modificar/eliminar sus propios recursos
3. **Archivos**: Las imágenes se almacenan en el sistema de archivos del servidor
4. **CORS**: El servidor está configurado para aceptar peticiones desde el frontend

## Variables de Entorno

```env
PORT=3900
MONGODB_URI=mongodb://localhost:27017/red-social
JWT_SECRET=tu_clave_secreta_jwt
```