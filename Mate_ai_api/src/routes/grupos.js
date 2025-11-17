const express = require('express');
const { body, query } = require('express-validator');
const Grupo = require('../models/Grupo');
const validate = require('../middleware/validation');
const auth = require('../middleware/auth');

const router = express.Router();

// Crear grupo (docente)
router.post('/', [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('descripcion').optional().isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
  body('alumnos').optional().isArray().withMessage('Los alumnos deben ser un array'),
  validate
], auth(['docente']), async (req, res, next) => {
  try {
    const item = await Grupo.create({ 
      nombre: req.body.nombre, 
      descripcion: req.body.descripcion,
      docenteId: req.user.id, 
      alumnos: req.body.alumnos || [] 
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
});

// Listar grupos
router.get('/', [
  query('docenteId').optional().isMongoId(),
  validate
], auth(), async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.docenteId) filter.docenteId = req.query.docenteId;
    
    // Filtrar por usuario actual según rol
    if (req.user.rol === 'docente') {
      filter.docenteId = req.user.id;
    } else if (req.user.rol === 'alumno') {
      filter.alumnos = { $in: [req.user.id] };
    }
    
    const items = await Grupo.find(filter).populate('alumnos', 'nombre correo grado seccion');
    res.json({ success: true, count: items.length, data: items });
  } catch (err) { next(err); }
});

// Actualizar grupo completo
router.put('/:id', [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('alumnos').isArray().withMessage('Los alumnos deben ser un array'),
  validate
], auth(['docente']), async (req, res, next) => {
  try {
    const updateData = {
      nombre: req.body.nombre,
      alumnos: req.body.alumnos || []
    };
    
    if (req.body.descripcion !== undefined) {
      updateData.descripcion = req.body.descripcion;
    }
    
    const item = await Grupo.findOneAndUpdate(
      { _id: req.params.id, docenteId: req.user.id }, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('alumnos', 'nombre correo grado seccion');
    
    if (!item) return res.status(404).json({ success: false, message: 'Grupo no encontrado' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// Gestionar miembros
router.put('/:id/miembros', [
  body('alumnos').isArray(),
  validate
], auth(['docente']), async (req, res, next) => {
  try {
    const item = await Grupo.findOneAndUpdate({ _id: req.params.id, docenteId: req.user.id }, { alumnos: req.body.alumnos }, { new: true }).populate('alumnos', 'nombre correo grado seccion');
    if (!item) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

router.delete('/:id', auth(['docente']), async (req, res, next) => {
  try {
    const item = await Grupo.findOneAndDelete({ _id: req.params.id, docenteId: req.user.id });
    if (!item) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, message: 'Eliminado' });
  } catch (err) { next(err); }
});

module.exports = router;