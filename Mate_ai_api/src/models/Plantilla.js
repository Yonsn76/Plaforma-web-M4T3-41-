const mongoose = require('mongoose');

const plantillaSchema = new mongoose.Schema({
  titulo: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 100
  },
  contenido: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 1000
  },
  categoria: {
    type: String,
    enum: ['general', 'recordatorio', 'bienvenida', 'evaluacion', 'tarea', 'evento'],
    default: 'general'
  },
  docenteId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true, 
    index: true 
  },
  creadoEn: { 
    type: Date, 
    default: Date.now 
  },
  actualizadoEn: { 
    type: Date, 
    default: Date.now 
  }
}, { versionKey: false });

// Actualizar fecha de modificación
plantillaSchema.pre('save', function(next) {
  this.actualizadoEn = new Date();
  next();
});

// Índices para búsquedas eficientes
plantillaSchema.index({ docenteId: 1, categoria: 1 });

module.exports = mongoose.model('Plantilla', plantillaSchema);