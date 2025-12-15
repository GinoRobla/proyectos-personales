import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import Usuario from '../models/Usuario.js';
import Cliente from '../models/Cliente.js';

/**
 * Configuración de Passport con Google OAuth 2.0
 * IMPORTANTE: Este archivo se ejecuta DESPUÉS de que dotenv.config() se llame en index.js
 */

// Configurar Google OAuth Strategy
passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          console.log('📧 Login con Google - Email:', profile.emails[0].value);

          // Extraer información del perfil de Google
          const email = profile.emails[0].value;
          const nombre = profile.name.givenName;
          const apellido = profile.name.familyName || '';
          const foto = profile.photos[0]?.value || '';

          // Buscar si el usuario ya existe
          let usuario = await Usuario.findOne({ email });

          if (usuario) {
            // Usuario existente - actualizar foto si cambió
            console.log('✅ Usuario existente encontrado:', usuario.email);

            if (foto && usuario.foto !== foto) {
              usuario.foto = foto;
              await usuario.save();
            }

            // Verificar si el usuario tiene un Cliente asociado (si su rol es cliente)
            if (usuario.rol === 'cliente') {
              const clienteExistente = await Cliente.findOne({ usuario: usuario._id });

              if (!clienteExistente) {
                // Crear el Cliente si no existe
                console.log('🆕 Creando perfil de Cliente para usuario existente:', usuario.email);
                await Cliente.create({
                  usuario: usuario._id,
                  nombre: usuario.nombre,
                  apellido: usuario.apellido,
                  email: usuario.email,
                  telefono: usuario.telefono || '0000000000',
                });
                console.log('✅ Cliente creado exitosamente');
              }
            }

            return done(null, usuario);
          }

          // Usuario nuevo - crear cuenta
          console.log('🆕 Creando nuevo usuario desde Google OAuth');

          usuario = await Usuario.create({
            nombre,
            apellido,
            email,
            password: Math.random().toString(36).slice(-12), // Password aleatorio (nunca se usará)
            telefono: '0000000000', // El usuario puede actualizarlo después
            rol: 'cliente',
            foto,
            proveedor: 'google', // Marcar que viene de Google
            googleId: profile.id,
          });

          console.log('✅ Usuario creado exitosamente:', usuario.email);

          // Crear automáticamente el perfil de Cliente para usuarios de Google OAuth
          const nuevoCliente = await Cliente.create({
            usuario: usuario._id,
            nombre,
            apellido,
            email,
            telefono: '0000000000', // El usuario puede actualizarlo después
          });

          console.log('✅ Cliente creado exitosamente para:', nuevoCliente.email);

          return done(null, usuario);
        } catch (error) {
          console.error('❌ Error en Google OAuth:', error);
          return done(error, null);
        }
      }
    )
);

// Serializar usuario (guardar en sesión)
passport.serializeUser((usuario, done) => {
  done(null, usuario._id);
});

// Deserializar usuario (recuperar de sesión)
passport.deserializeUser(async (id, done) => {
  try {
    const usuario = await Usuario.findById(id);
    done(null, usuario);
  } catch (error) {
    done(error, null);
  }
});

export default passport;