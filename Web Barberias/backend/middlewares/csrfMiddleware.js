/**
 * Middleware de protección CSRF básica
 * Verifica que las peticiones incluyan el header custom X-Requested-With
 * Esto previene ataques CSRF básicos ya que los navegadores no permiten
 * agregar headers custom en peticiones cross-origin sin CORS
 */

export const requireCustomHeader = (req, res, next) => {
  const customHeader = req.headers['x-requested-with'];

  if (!customHeader || customHeader !== 'XMLHttpRequest') {
    return res.status(403).json({
      exito: false,
      mensaje: 'Petición no autorizada'
    });
  }

  next();
};
