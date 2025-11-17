const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  generarEjercicios,
  generarPista,
  generarExplicacion,
  validarRespuesta,
  getEstadisticasIA
} = require('../controllers/iaController');

// Middleware de autenticación para todas las rutas
router.use(auth());


// POST /api/ia/ejercicios - Generar ejercicios con IA
router.post('/ejercicios', generarEjercicios);

// GET /api/ia/pista/:preguntaId - Generar pista para un ejercicio
router.get('/pista/:preguntaId', generarPista);

// POST /api/ia/explicacion/:preguntaId - Generar explicación para un ejercicio
router.post('/explicacion/:preguntaId', generarExplicacion);

// POST /api/ia/validar/:preguntaId - Validar respuesta de un ejercicio
router.post('/validar/:preguntaId', validarRespuesta);

// GET /api/ia/estadisticas - Obtener estadísticas de uso de IA
router.get('/estadisticas', getEstadisticasIA);

// GET /api/ia/test - Probar configuración de IA
router.get('/test', async (req, res) => {
  try {
    const { generateExercises } = require('../services/aiService');
    
    // Test simple
    const testRequest = {
      grado: '1',
      tema: 'suma básica',
      dificultad: 'basica',
      cantidad: 1,
      language: 'es'
    };
    
    const response = await generateExercises(testRequest);
    
    res.json({
      success: true,
      message: 'Configuración de IA verificada',
      testResult: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en configuración de IA',
      error: error.message
    });
  }
});

module.exports = router;
