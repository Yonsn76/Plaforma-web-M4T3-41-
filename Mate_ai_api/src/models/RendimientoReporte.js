const mongoose = require('mongoose');

const rendimientoReporteSchema = new mongoose.Schema({
  // Identificación básica
  alumnoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true, 
    index: true 
  },
  
  // Estadísticas básicas
  totalPreguntas: { type: Number, required: true },
  respuestasCorrectas: { type: Number, required: true },
  respuestasIncorrectas: { type: Number, required: true },
  puntuacion: { type: Number, required: true }, // porcentaje
  tiempoTotal: { type: Number, default: 0 }, // en segundos
  
  // Reporte en texto plano (análisis del rendimiento)
  reporte: { 
    type: String, 
    required: true,
    maxlength: 10000 // Aumentado para contenido generado por IA
  },
  
  // Consejos en texto plano (recomendaciones para mejorar)
  consejos: { 
    type: String, 
    required: true,
    maxlength: 5000 // Aumentado para contenido generado por IA
  },
  
  // Metadatos
  fechaRealizacion: { type: Date, default: Date.now },
  tema: { type: String, required: true }, // tema de la práctica
  grado: { type: String, required: true }, // grado del estudiante
  duracionSesion: { type: Number, default: 5 }, // en minutos
  
  // Tipo de práctica
  tipoPractica: { 
    type: String, 
    enum: ['ia_libre', 'tarea_docente'], 
    default: 'ia_libre' 
  }, // 'ia_libre' = práctica libre con IA, 'tarea_docente' = tarea asignada por docente
  
  // Referencias para tareas de docente
  testId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Test', 
    required: function() { return this.tipoPractica === 'tarea_docente' }
  },
  conjuntoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Conjunto', 
    required: function() { return this.tipoPractica === 'tarea_docente' }
  },
  docenteId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: function() { return this.tipoPractica === 'tarea_docente' }
  }
}, { 
  versionKey: false,
  timestamps: true 
});

// Índices para consultas eficientes
rendimientoReporteSchema.index({ alumnoId: 1, fechaRealizacion: -1 });
rendimientoReporteSchema.index({ tema: 1, fechaRealizacion: -1 });

// Método para calcular estadísticas básicas
rendimientoReporteSchema.methods.calcularEstadisticas = function() {
  const total = this.totalPreguntas;
  const correctas = this.respuestasCorrectas;
  
  return {
    porcentajeCorrectas: Math.round((correctas / total) * 100),
    porcentajeIncorrectas: Math.round(((total - correctas) / total) * 100),
    tiempoPromedioPorPregunta: Math.round(this.tiempoTotal / total),
    nivelRendimiento: this.puntuacion >= 80 ? 'excelente' : 
                     this.puntuacion >= 60 ? 'bueno' : 
                     this.puntuacion >= 40 ? 'regular' : 'necesita_mejora'
  };
};

module.exports = mongoose.model('RendimientoReporte', rendimientoReporteSchema);
