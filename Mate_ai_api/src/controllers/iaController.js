const mongoose = require('mongoose');
const { generateExercises, generateHint, generateExplanation, validateAnswer } = require('../services/aiService');

// Generar ejercicios con IA
const generarEjercicios = async (req, res) => {
  try {
    const { grado, tema, dificultad, cantidad, conjuntoId } = req.body;
    const usuarioId = req.user.id;

    // Generar ejercicios con IA
    const request = {
      grado: grado,
      tema: tema,
      dificultad: dificultad,
      cantidad: cantidad,
      language: 'es'
    };

    const response = await generateExercises(request);
    
    if (!response.success) {
      return res.status(400).json({
        success: false,
        message: response.error || 'Error generando ejercicios',
        details: response.error
      });
    }

    // Los ejercicios se generan dinámicamente y no se guardan en BD
    // Se usan directamente en el frontend para práctica con IA


    res.json({
      success: true,
      data: {
        ejercicios: response.data.ejercicios,
        metadata: response.data.metadata,
        conjuntoId: conjuntoId || null
      }
    });
  } catch (error) {
    console.error('Error generando ejercicios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      details: error.message
    });
  }
};

// Generar pista para un ejercicio (simplificado)
const generarPista = async (req, res) => {
  try {
    // Esta función ahora se maneja desde el frontend
    // Las pistas se generan dinámicamente sin guardar en BD
    res.json({
      success: true,
      message: 'Función de pista manejada desde el frontend',
      data: {
        pista: 'Esta función se maneja desde el frontend con IA directa'
      }
    });
  } catch (error) {
    console.error('Error generando pista:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Generar explicación para un ejercicio (simplificado)
const generarExplicacion = async (req, res) => {
  try {
    // Esta función ahora se maneja desde el frontend
    // Las explicaciones se generan dinámicamente sin guardar en BD
    res.json({
      success: true,
      message: 'Función de explicación manejada desde el frontend',
      data: {
        explicacion: 'Esta función se maneja desde el frontend con IA directa'
      }
    });
  } catch (error) {
    console.error('Error generando explicación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Validar respuesta de un ejercicio (simplificado)
const validarRespuesta = async (req, res) => {
  try {
    // Esta función ahora se maneja desde el frontend
    // La validación se hace dinámicamente sin guardar en BD
    res.json({
      success: true,
      message: 'Función de validación manejada desde el frontend',
      data: {
        esCorrecta: true,
        explicacion: 'Esta función se maneja desde el frontend con IA directa'
      }
    });
  } catch (error) {
    console.error('Error validando respuesta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas de uso de IA
const getEstadisticasIA = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const usuarioId = req.user.id;

    // Construir filtro de fechas
    const filtro = { usuarioId: usuarioId };
    if (fechaInicio && fechaFin) {
      filtro.creadoEn = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    // Estadísticas básicas (sin historial)
    const estadisticas = [];

    res.json({
      success: true,
      data: {
        estadisticas: estadisticas,
        totalActividades: 0
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  generarEjercicios,
  generarPista,
  generarExplicacion,
  validarRespuesta,
  getEstadisticasIA
};