const mongoose = require('mongoose');

const grupoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true, maxlength: 500 },
  docenteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
  alumnos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', index: true }],
  creadoEn: { type: Date, default: Date.now }
}, { versionKey: false });

grupoSchema.index({ docenteId: 1, nombre: 1 }, { unique: true });

module.exports = mongoose.model('Grupo', grupoSchema);