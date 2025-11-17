// Script de prueba para verificar variables de entorno
console.log('🧪 Probando configuración de variables de entorno...\n');

// Cargar variables de entorno
require('./env.js');

console.log('\n📋 Variables cargadas:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅' : '❌');
console.log('PORT:', process.env.PORT || '❌');
console.log('NODE_ENV:', process.env.NODE_ENV || '❌');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅' : '❌');
console.log('PERPLEXITY_API_KEY:', process.env.PERPLEXITY_API_KEY ? '✅' : '❌');

console.log('\n🔍 Detalles de la API Key:');
console.log('Valor:', process.env.PERPLEXITY_API_KEY);
console.log('Es placeholder:', process.env.PERPLEXITY_API_KEY === 'pplx-1234567890abcdef1234567890abcdef12345678');

if (process.env.PERPLEXITY_API_KEY === 'pplx-1234567890abcdef1234567890abcdef12345678') {
  console.log('\n⚠️  ADVERTENCIA: Estás usando la API key de placeholder.');
  console.log('   Para usar la IA, necesitas reemplazarla con una API key real de Perplexity.');
  console.log('   Edita el archivo env.js y cambia la línea de PERPLEXITY_API_KEY.');
} else {
  console.log('\n✅ API Key configurada (no es placeholder)');
}

console.log('\n🚀 Para probar el servidor, ejecuta: npm start');





