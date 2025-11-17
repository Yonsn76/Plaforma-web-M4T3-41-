const mongoose = require('mongoose');

const progresoTestSchema = new mongoose.Schema({
  // Referencias
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  asignacionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asignacion',
    required: true
  },
  alumnoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  
  // Datos del intento (sin guardar respuestas individuales)
  // respuestas: [] - No se guardan las respuestas individuales
  
  // Estadísticas del intento
  puntuacionTotal: {
    type: Number,
    default: 0
  },
  respuestasCorrectas: {
    type: Number,
    default: 0
  },
  totalPreguntas: {
    type: Number,
    required: true
  },
  porcentaje: {
    type: Number,
    default: 0
  },
  
  // Tiempo y estado
  tiempoInicio: {
    type: Date,
    default: Date.now
  },
  tiempoFinalizacion: {
    type: Date,
    default: Date.now
  },
  tiempoTotal: {
    type: Number, // en segundos
    default: 0
  },
  
  // Estado del intento
  estado: {
    type: String,
    enum: ['en_progreso', 'completado', 'abandonado'],
    default: 'en_progreso'
  },
  
  // Si es el mejor intento
  esMejorIntento: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Índices para consultas eficientes
progresoTestSchema.index({ alumnoId: 1, testId: 1 });
progresoTestSchema.index({ asignacionId: 1, alumnoId: 1 });
progresoTestSchema.index({ esMejorIntento: 1, alumnoId: 1 });

// Índice único para asegurar solo 1 registro por alumno y test
progresoTestSchema.index({ testId: 1, asignacionId: 1, alumnoId: 1 }, { unique: true });

// Método para calcular estadísticas
progresoTestSchema.methods.calcularEstadisticas = function() {
  // Las estadísticas se calculan en el endpoint, no aquí
  this.tiempoTotal = Math.round((this.tiempoFinalizacion - this.tiempoInicio) / 1000);
  return this;
};

// Método estático para obtener el mejor intento de un alumno para un test
progresoTestSchema.statics.obtenerMejorIntento = async function(alumnoId, testId) {
  return await this.findOne({
    alumnoId,
    testId,
    esMejorIntento: true
  });
};

// Método estático para obtener todos los intentos de un alumno para una asignación
progresoTestSchema.statics.obtenerIntentosAsignacion = async function(alumnoId, asignacionId) {
  return await this.find({
    alumnoId,
    asignacionId
  }).sort({ tiempoInicio: -1 });
};

module.exports = mongoose.model('ProgresoTest', progresoTestSchema);
