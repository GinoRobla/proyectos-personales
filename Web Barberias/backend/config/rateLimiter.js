import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting Global
 * - Desarrollo: 1000 requests por IP cada 15 minutos
 * - Producción: 100 requests por IP cada 15 minutos
 */
export const limiterGlobal = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
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

/**
 * Rate Limiting para Verificación SMS: Máximo 3 códigos cada hora
 */
export const limiterSMS = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 códigos por hora por IP
  message: {
    exito: false,
    mensaje: 'Demasiados intentos de verificación. Intenta en 1 hora.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
