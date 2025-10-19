import axios from 'axios';

// --- 1. Configuración de la URL Base ---

// Lee la URL de tu backend desde las variables de entorno (.env)
// Si no está definida (ej. en desarrollo), usa la URL local por defecto.
const URL_BASE_API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// --- 2. Creación de la Instancia de Axios ---

// Creamos una "instancia" de axios.
// Esto nos permite tener una configuración centralizada para todas las llamadas a la API.
const api = axios.create({
  // 'baseURL' se pondrá automáticamente al inicio de todas las peticiones.
  // Ejemplo: api.get('/turnos') llamará a 'http://localhost:3000/api/turnos'
  baseURL: URL_BASE_API,
  
  // 'headers' por defecto para todas las peticiones
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// INTERCEPTORES
// (Funciones que se "interceptan" o ejecutan en cada petición o respuesta)
// ============================================================================

// --- 3. Interceptor de Petición (Request) ---
// Esta función se ejecuta ANTES de que cada petición sea enviada.

api.interceptors.request.use(
  (config) => {
    // 1. Busca el token guardado en el localStorage del navegador
    const token = localStorage.getItem('token');

    // 2. Si encuentra un token...
    if (token) {
      // 3. ...lo añade a los 'headers' de la petición.
      // Así, el backend sabe quién eres en cada llamada.
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 4. Devuelve la 'config' modificada para que la petición continúe
    return config;
  },
  (error) => {
    // Si hay un error al preparar la petición, lo rechaza
    return Promise.reject(error);
  }
);

// --- 4. Interceptor de Respuesta (Response) ---
// Esta función se ejecuta DESPUÉS de recibir una respuesta del backend.

api.interceptors.response.use(
  // 4a. Si la respuesta fue exitosa (status 2xx), simplemente la devuelve.
  (response) => response,

  // 4b. Si la respuesta tuvo un error...
  (error) => {
    // 5. Verificamos si el error es un 401 (No Autorizado)
    // El '?' (optional chaining) evita un error si 'error.response' no existe.
    if (error.response?.status === 401) {
      
      // Error 401 significa que el token es inválido o expiró.
      console.error('Error 401: No autorizado. Redirigiendo al login...');

      // 6. Limpiamos los datos de sesión del usuario
      localStorage.removeItem('token');
      localStorage.removeItem('usuario'); // O cualquier otra info de sesión

      // 7. Redirigimos al usuario a la página de login
      // Usamos 'window.location.href' para forzar una recarga completa.
      window.location.href = '/login';
    }

    // 8. Para cualquier otro error (ej: 404, 500), lo rechazamos.
    // Esto permite que el código que llamó a la API (ej: un .catch()) maneje el error.
    return Promise.reject(error);
  }
);

// --- 5. Exportación ---

// Exportamos la instancia 'api' para usarla en todo el frontend.
export default api;