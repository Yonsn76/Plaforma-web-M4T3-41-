const mongoose = require('mongoose');

const destinatarioSchema = new mongoose.Schema({
  tipo: { type: String, enum: ['alumno', 'grupo'], required: true },
  id: { type: mongoose.Schema.Types.ObjectId, required: true }
}, { _id: false });

const asignacionSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true, index: true },
  destinatarios: { type: [destinatarioSchema], default: [] },
  docenteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
  fechaInicio: { type: Date },
  fechaLimite: { type: Date },
  tiempoLimite: { type: Number, min: 5, max: 300, default: 60 },
  instrucciones: { type: String, trim: true },
  estado: { 
    type: String, 
    enum: ['activa', 'completada', 'vencida'], 
    default: 'activa' 
  },
  creadaEn: { type: Date, default: Date.now }
}, { versionKey: false });

asignacionSchema.index({ 'destinatarios.id': 1 });

module.exports = mongoose.model('Asignacion', asignacionSchema);