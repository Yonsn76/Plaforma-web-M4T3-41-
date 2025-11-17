const mongoose = require('mongoose');

const anuncioSchema = new mongoose.Schema({
  titulo: { type: String, required: true, trim: true },
  contenido: { type: String, required: true, trim: true },
  tipo: { 
    type: String, 
    enum: ['todos', 'alumno', 'grupo'], 
    required: true,
    default: 'todos'
  },
  docenteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
  destinatarios: [{
    tipo: { type: String, enum: ['todos', 'alumno', 'grupo'], required: true },
    id: { type: mongoose.Schema.Types.ObjectId, required: false } // Opcional para 'todos'
  }],
  leidoPor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }],
  creadoEn: { type: Date, default: Date.now }
}, { versionKey: false });

anuncioSchema.index({ 'destinatarios.id': 1 });

module.exports = mongoose.model('Anuncio', anuncioSchema);