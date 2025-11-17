const mongoose = require('mongoose');

const solicitudSchema = new mongoose.Schema({
  alumnoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
  docenteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
  mensaje: { type: String, trim: true },
  mensajeRechazo: { type: String, trim: true },
  estado: { type: String, enum: ['pendiente', 'aceptada', 'rechazada'], default: 'pendiente', index: true },
  creadaEn: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model('Solicitud', solicitudSchema);