import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting Global: Máximo 1000 requests por IP cada 15 minutos (ajustado para desarrollo)
 * PRODUCCIÓN: Reducir a 100 requests
 */
export const limiterGlobal = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Máximo 1000 requests por ventana (desarrollo)
  message: {
    exito: false,
    mensaje: 'Demasiadas peticiones desde esta IP. Intenta de nuevo en 15 minutos.',
  },
  standardHeaders: true, // Retorna info en los headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
});

/**
 * Rate Limiting Estricto para Autenticación: Máximo 5 intentos cada 15 minutos
 */
export const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true, // No contar requests exitosos
  message: {
    exito: false,
    mensaje: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
