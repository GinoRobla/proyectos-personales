/**
 * Validador de variables de entorno
 * Verifica que todas las variables requeridas estén configuradas al iniciar el servidor
 */

const REQUIRED_VARS = [
  'JWT_SECRET',
  'MONGODB_URI',
  'FRONTEND_URL',
  'BACKEND_URL',
  'PORT',
];

const OPTIONAL_VARS = [
  'JWT_EXPIRATION',
  'NODE_ENV',
  'WHATSAPP_API_URL',
  'WHATSAPP_TOKEN',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
];

/**
 * Valida que todas las variables de entorno requeridas estén presentes
 * @throws {Error} Si falta alguna variable requerida
 */
export const validateEnv = () => {
  console.log('🔍 Validando variables de entorno...');

  const missing = [];
  const warnings = [];

  // Verificar variables requeridas
  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Verificar variables opcionales (solo advertencia)
  for (const varName of OPTIONAL_VARS) {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  }

  // Si faltan variables requeridas, lanzar error
  if (missing.length > 0) {
    console.error('❌ Faltan variables de entorno requeridas:');
    missing.forEach((v) => console.error(`   - ${v}`));
    console.error('\n💡 Configura estas variables en tu archivo .env');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Mostrar advertencias de variables opcionales
  if (warnings.length > 0) {
    console.warn('⚠️  Variables de entorno opcionales no configuradas:');
    warnings.forEach((v) => console.warn(`   - ${v}`));
    console.warn('   (Algunas funcionalidades pueden estar limitadas)\n');
  }

  console.log('✅ Variables de entorno validadas correctamente\n');
};

/**
 * Verifica si una variable específica está configurada
 * @param {string} varName - Nombre de la variable
 * @returns {boolean}
 */
export const isEnvVarSet = (varName) => {
  return !!process.env[varName];
};

export default {
  validateEnv,
  isEnvVarSet,
};
