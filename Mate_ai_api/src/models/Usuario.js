const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  correo: { type: String, required: true, unique: true, lowercase: true, trim: true },
  contrasena: { type: String, required: true, select: false },
  rol: { type: String, enum: ['docente', 'alumno'], required: true },
  especialidad: { type: String, trim: true }, // solo docentes
  gradosAsignados: { type: [String], default: [] }, // solo docentes - ej: ["4°A", "5°B"]
  grado: { type: String, trim: true }, // solo alumnos - ej: "4"
  seccion: { type: String, trim: true }, // solo alumnos - ej: "A"
  docenteAsignado: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario',
    default: null 
  }, // solo alumnos - referencia al docente
  creadoEn: { type: Date, default: Date.now }
}, { versionKey: false });

//usuarioSchema.index({ correo: 1 }, { unique: true });

usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('contrasena')) return next();
  const salt = await bcrypt.genSalt(10);
  this.contrasena = await bcrypt.hash(this.contrasena, salt);
  next();
});

usuarioSchema.methods.compararContrasena = async function (plain) {
  return bcrypt.compare(plain, this.contrasena);
};

module.exports = mongoose.model('Usuario', usuarioSchema);