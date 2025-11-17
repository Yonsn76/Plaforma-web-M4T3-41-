// Test específico para el servicio de IA
console.log('🧪 Probando servicio de IA...\n');

// Cargar variables de entorno
require('./env.js');

// Importar el servicio de IA
const { generateExercises } = require('./src/services/aiService');

async function testAI() {
  try {
    console.log('📋 Configuración actual:');
    console.log('PERPLEXITY_API_KEY:', process.env.PERPLEXITY_API_KEY);
    console.log('Es placeholder:', process.env.PERPLEXITY_API_KEY === 'pplx-1234567890abcdef1234567890abcdef12345678');
    
    console.log('\n🤖 Probando generación de ejercicios...');
    
    const testRequest = {
      grado: '1',
      tema: 'suma básica',
      dificultad: 'basica',
      cantidad: 1,
      language: 'es'
    };
    
    console.log('Request:', testRequest);
    
    const response = await generateExercises(testRequest);
    
    console.log('\n✅ Respuesta recibida:');
    console.log('Success:', response.success);
    console.log('Error:', response.error);
    
    if (response.success) {
      console.log('Data:', JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ Error en test:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAI();





