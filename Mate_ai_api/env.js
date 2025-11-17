// Configuración de variables de entorno
// Este archivo reemplaza temporalmente el .env

// Configuración de base de datos
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/database_name';

// Configuración del servidor
process.env.PORT = process.env.PORT || '2025';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Configuración de autenticación
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

// Configuración de IA - Perplexity
process.env.PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || 'your_perplexity_api_key_here';

console.log('🔧 Variables de entorno cargadas desde env.js');
console.log('📊 MongoDB URI:', process.env.MONGODB_URI ? '✅ Configurado' : '❌ No configurado');
console.log('🔑 JWT Secret:', process.env.JWT_SECRET ? '✅ Configurado' : '❌ No configurado');
console.log('🤖 Perplexity API Key:', process.env.PERPLEXITY_API_KEY ? '✅ Configurado' : '❌ No configurado');

module.exports = {
  MONGODB_URI: process.env.MONGODB_URI,
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET,
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY
};
