const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  titulo: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  estado: { 
    type: String, 
    enum: ['borrador', 'activo', 'finalizado'], 
    default: 'borrador' 
  },
  docenteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
  preguntas: [{
    enunciado: { type: String, required: true },
    opciones: [{ type: String }],
    respuestaCorrecta: { type: String, required: true },
    explicacion: { type: String },
    dificultad: { 
      type: String, 
      enum: ['basica', 'media', 'avanzada'], 
      default: 'basica' 
    },
    tipoPregunta: {
      type: String,
      enum: ['opcion_multiple', 'verdadero_falso', 'respuesta_corta', 'desarrollo'],
      default: 'opcion_multiple'
    },
    orden: { type: Number, required: true },
    puntos: { type: Number, default: 1 }
  }],
  creadoEn: { type: Date, default: Date.now },
  actualizadoEn: { type: Date, default: Date.now }
}, { versionKey: false });

testSchema.pre('save', function (next) {
  this.actualizadoEn = new Date();
  next();
});

module.exports = mongoose.model('Test', testSchema);
