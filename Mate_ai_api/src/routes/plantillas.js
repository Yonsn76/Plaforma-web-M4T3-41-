const express = require('express');
const { body, query } = require('express-validator');
const Plantilla = require('../models/Plantilla');
const validate = require('../middleware/validation');
const auth = require('../middleware/auth');

const router = express.Router();

// Crear plantilla
router.post('/', [
  body('titulo').notEmpty().withMessage('El título es requerido').isLength({ max: 100 }),
  body('contenido').notEmpty().withMessage('El contenido es requerido').isLength({ max: 1000 }),
  body('categoria').optional().isIn(['general', 'recordatorio', 'bienvenida', 'evaluacion', 'tarea', 'evento']),
  validate
], auth(['docente']), async (req, res, next) => {
  try {
    const { titulo, contenido, categoria } = req.body;
    
    const plantilla = await Plantilla.create({
      titulo,
      contenido,
      categoria,
      docenteId: req.user.id
    });
    
    res.status(201).json({ success: true, data: plantilla });
  } catch (err) { next(err); }
});

// Obtener plantillas del docente
router.get('/mis-plantillas', auth(['docente']), async (req, res, next) => {
  try {
    const { categoria } = req.query;
    const filter = { docenteId: req.user.id };
    if (categoria) filter.categoria = categoria;
    
    const plantillas = await Plantilla.find(filter)
      .sort({ actualizadoEn: -1 });
    
    res.json({ success: true, data: plantillas });
  } catch (err) { next(err); }
});

// Obtener plantillas públicas
router.get('/publicas', [
  query('categoria').optional().isIn(['general', 'recordatorio', 'bienvenida', 'evaluacion', 'tarea', 'evento']),
  validate
], auth(), async (req, res, next) => {
  try {
    const { categoria } = req.query;
    const filter = { esPublica: true };
    if (categoria) filter.categoria = categoria;
    
    const plantillas = await Plantilla.find(filter)
      .populate('docenteId', 'nombre especialidad')
      .sort({ usos: -1, creadoEn: -1 });
    
    res.json({ success: true, data: plantillas });
  } catch (err) { next(err); }
});

// Obtener plantilla por ID
router.get('/:id', auth(), async (req, res, next) => {
  try {
    const plantilla = await Plantilla.findOne({
      _id: req.params.id,
      $or: [
        { docenteId: req.user.id },
        { esPublica: true }
      ]
    }).populate('docenteId', 'nombre especialidad');
    
    if (!plantilla) {
      return res.status(404).json({ 
        success: false, 
        message: 'Plantilla no encontrada' 
      });
    }
    
    res.json({ success: true, data: plantilla });
  } catch (err) { next(err); }
});

// Actualizar plantilla
router.put('/:id', [
  body('titulo').optional().isLength({ max: 100 }),
  body('contenido').optional().isLength({ max: 1000 }),
  body('categoria').optional().isIn(['general', 'recordatorio', 'bienvenida', 'evaluacion', 'tarea', 'evento']),
  validate
], auth(['docente']), async (req, res, next) => {
  try {
    const { titulo, contenido, categoria } = req.body;
    
    const updateData = { actualizadoEn: new Date() };
    
    if (titulo !== undefined) updateData.titulo = titulo;
    if (contenido !== undefined) updateData.contenido = contenido;
    if (categoria !== undefined) updateData.categoria = categoria;
    
    const plantilla = await Plantilla.findOneAndUpdate(
      { _id: req.params.id, docenteId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!plantilla) {
      return res.status(404).json({ 
        success: false, 
        message: 'Plantilla no encontrada' 
      });
    }
    
    res.json({ success: true, data: plantilla });
  } catch (err) { next(err); }
});


// Eliminar plantilla
router.delete('/:id', auth(['docente']), async (req, res, next) => {
  try {
    const plantilla = await Plantilla.findOneAndDelete({
      _id: req.params.id,
      docenteId: req.user.id
    });
    
    if (!plantilla) {
      return res.status(404).json({ 
        success: false, 
        message: 'Plantilla no encontrada' 
      });
    }
    
    res.json({ success: true, message: 'Plantilla eliminada' });
  } catch (err) { next(err); }
});

// Duplicar plantilla pública
router.post('/:id/duplicar', auth(['docente']), async (req, res, next) => {
  try {
    const plantillaOriginal = await Plantilla.findOne({
      _id: req.params.id,
      esPublica: true
    });
    
    if (!plantillaOriginal) {
      return res.status(404).json({ 
        success: false, 
        message: 'Plantilla pública no encontrada' 
      });
    }
    
    const plantillaDuplicada = await Plantilla.create({
      titulo: `${plantillaOriginal.titulo} (Copia)`,
      contenido: plantillaOriginal.contenido,
      categoria: plantillaOriginal.categoria,
      docenteId: req.user.id,
      esPublica: false
    });
    
    res.status(201).json({ success: true, data: plantillaDuplicada });
  } catch (err) { next(err); }
});

module.exports = router;