const express = require('express');
const { body, query } = require('express-validator');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const validate = require('../middleware/validation');
const auth = require('../middleware/auth');

const router = express.Router();

const signToken = (user) => {
  return jwt.sign(
    { id: user._id, rol: user.rol, nombre: user.nombre, correo: user.correo },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Registro
router.post('/registro', [
  body('nombre').notEmpty(),
  body('correo').isEmail(),
  body('contrasena').isLength({ min: 6 }),
  body('rol').isIn(['docente', 'alumno']),
  body('grado').optional().isString(),
  body('seccion').optional().isString(),
  body('docenteAsignado').optional().isMongoId(),
  validate
], async (req, res, next) => {
  try {
    const existe = await Usuario.findOne({ correo: req.body.correo });
    if (existe) return res.status(400).json({ success: false, message: 'Correo ya registrado' });

    // Si es alumno, validar grado y sección
    if (req.body.rol === 'alumno') {
      if (!req.body.grado || !req.body.grado.trim()) {
        return res.status(400).json({ success: false, message: 'El grado es requerido para alumnos' });
      }
      if (!req.body.seccion || !req.body.seccion.trim()) {
        return res.status(400).json({ success: false, message: 'La sección es requerida para alumnos' });
      }

      // Asignar docente automáticamente basado en grado y sección
      const classString = `${req.body.grado}°${req.body.seccion}`;
      const docente = await Usuario.findOne({ rol: 'docente', gradosAsignados: { $in: [classString] } });
      if (docente) {
        req.body.docenteAsignado = docente._id;
      }
    }

    // Si es alumno y se envió docenteAsignado, verificar que el docente existe
    if (req.body.rol === 'alumno' && req.body.docenteAsignado) {
      const docente = await Usuario.findOne({ _id: req.body.docenteAsignado, rol: 'docente' });
      if (!docente) {
        return res.status(400).json({ success: false, message: 'Docente no encontrado' });
      }
    }

    const user = await Usuario.create(req.body);
    const token = signToken(user);
    res.status(201).json({ 
      success: true, 
      data: { 
        token, 
        usuario: { 
          id: user._id, 
          nombre: user.nombre, 
          correo: user.correo, 
          rol: user.rol,
          grado: user.grado,
          seccion: user.seccion,
          especialidad: user.especialidad,
          gradosAsignados: user.gradosAsignados
        } 
      } 
    });
  } catch (err) { next(err); }
});

// Login
router.post('/login', [
  body('correo').isEmail(),
  body('contrasena').notEmpty(),
  validate
], async (req, res, next) => {
  try {
    const user = await Usuario.findOne({ correo: req.body.correo }).select('+contrasena');
    if (!user) return res.status(400).json({ success: false, message: 'Credenciales inválidas' });

    const ok = await user.compararContrasena(req.body.contrasena);
    if (!ok) return res.status(400).json({ success: false, message: 'Credenciales inválidas' });

    const token = signToken(user);
    res.json({ 
      success: true, 
      data: { 
        token, 
        usuario: { 
          id: user._id, 
          nombre: user.nombre, 
          correo: user.correo, 
          rol: user.rol,
          grado: user.grado,
          seccion: user.seccion,
          especialidad: user.especialidad,
          gradosAsignados: user.gradosAsignados
        } 
      } 
    });
  } catch (err) { next(err); }
});

// Perfil
router.get('/me', auth(), async (req, res, next) => {
  try {
    const user = await Usuario.findById(req.user.id).populate('docenteAsignado', 'nombre correo especialidad');
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// Actualizar perfil
router.put('/me', auth(), async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.rol;
    delete updates.correo;
    delete updates.contrasena;
    
    // Si es alumno actualizando docenteAsignado, verificar que el docente existe
    if (updates.docenteAsignado) {
      const docente = await Usuario.findOne({ _id: updates.docenteAsignado, rol: 'docente' });
      if (!docente) {
        return res.status(400).json({ success: false, message: 'Docente no encontrado' });
      }
    }
    
    const user = await Usuario.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).populate('docenteAsignado', 'nombre correo especialidad');
    
    // Auto-asignar estudiantes si el docente actualizó gradosAsignados
    if (req.user.rol === 'docente' && updates.gradosAsignados) {
      for (const classString of user.gradosAsignados) {
        const [grado, seccion] = classString.split('°');
        if (grado && seccion) {
          await Usuario.updateMany(
            { rol: 'alumno', grado, seccion, docenteAsignado: null },
            { docenteAsignado: req.user.id }
          );
        }
      }
    }
    
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// Listado y filtrado
router.get('/', [
  query('rol').optional().isIn(['docente', 'alumno']),
  validate
], auth(), async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.rol) filter.rol = req.query.rol;
    if (req.query.grado) filter.grado = req.query.grado;
    if (req.query.especialidad) filter.especialidad = req.query.especialidad;
    const users = await Usuario.find(filter).limit(100).populate('docenteAsignado', 'nombre correo especialidad');
    res.json({ success: true, count: users.length, data: users });
  } catch (err) { next(err); }
});

// Listar solo docentes disponibles (para que los alumnos puedan seleccionar)
router.get('/docentes', auth(), async (req, res, next) => {
  try {
    const docentes = await Usuario.find({ rol: 'docente' })
      .select('nombre correo especialidad gradosAsignados')
      .limit(100);
    res.json({ success: true, count: docentes.length, data: docentes });
  } catch (err) { next(err); }
});

// Asignar docente a un alumno (puede ser usado por el alumno o por un admin)
router.put('/asignar-docente', [
  body('docenteId').isMongoId(),
  validate
], auth(), async (req, res, next) => {
  try {
    const { docenteId } = req.body;
    
    // Verificar que el docente existe
    const docente = await Usuario.findOne({ _id: docenteId, rol: 'docente' });
    if (!docente) {
      return res.status(400).json({ success: false, message: 'Docente no encontrado' });
    }
    
    // Actualizar el alumno
    const user = await Usuario.findByIdAndUpdate(
      req.user.id,
      { docenteAsignado: docenteId },
      { new: true, runValidators: true }
    ).populate('docenteAsignado', 'nombre correo especialidad');
    
    res.json({ success: true, data: user, message: 'Docente asignado correctamente' });
  } catch (err) { next(err); }
});

// Obtener alumnos de un docente
router.get('/mis-alumnos', auth(), async (req, res, next) => {
  try {
    if (req.user.rol !== 'docente') {
      return res.status(403).json({ success: false, message: 'Solo los docentes pueden ver sus alumnos' });
    }
    
    const alumnos = await Usuario.find({ 
      rol: 'alumno', 
      docenteAsignado: req.user.id 
    }).select('nombre correo grado').limit(100);
    
    res.json({ success: true, count: alumnos.length, data: alumnos });
  } catch (err) { next(err); }
});

// Remover alumno (docente)
router.put('/:id/remover', auth(), async (req, res, next) => {
  try {
    if (req.user.rol !== 'docente') {
      return res.status(403).json({ success: false, message: 'Solo docentes pueden remover alumnos' });
    }

    const alumno = await Usuario.findByIdAndUpdate(
      req.params.id,
      { docenteAsignado: null },
      { new: true }
    );

    if (!alumno) {
      return res.status(404).json({ success: false, message: 'Alumno no encontrado' });
    }

    res.json({ success: true, data: alumno, message: 'Alumno removido correctamente' });
  } catch (err) { next(err); }
});

module.exports = router;