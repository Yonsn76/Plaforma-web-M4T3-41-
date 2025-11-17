const express = require('express');
const { body, query } = require('express-validator');
const Asignacion = require('../models/Asignacion');
const Test = require('../models/Test');
const validate = require('../middleware/validation');
const auth = require('../middleware/auth');

const router = express.Router();

// Crear asignación (docente)
router.post('/', [
  body('testId').isMongoId(),
  body('destinatarios').isArray({ min: 1 }),
  body('destinatarios.*.tipo').isIn(['alumno', 'grupo']),
  body('destinatarios.*.id').isMongoId(),
  body('fechaInicio').optional().isISO8601(),
  body('fechaLimite').optional().isISO8601(),
  body('tiempoLimite').optional().isInt({ min: 5, max: 300 }),
  validate
], auth(['docente']), async (req, res, next) => {
  try {
    const test = await Test.findOne({ _id: req.body.testId, docenteId: req.user.id });
    if (!test) return res.status(403).json({ success: false, message: 'No autorizado para este test' });

    const data = { ...req.body, docenteId: req.user.id };
    const item = await Asignacion.create(data);
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
});

// Listar por destinatario, test o docente
router.get('/', [
  query('docenteId').optional().isMongoId(),
  query('destinatarioId').optional().isMongoId(),
  query('testId').optional().isMongoId(),
  validate
], auth(), async (req, res, next) => {
  try {
    const filter = {};
    
    // Si es un docente, puede ver sus propias asignaciones
    if (req.user.rol === 'docente') {
      if (req.query.docenteId) filter.docenteId = req.query.docenteId;
      else filter.docenteId = req.user.id;
    }
    
    // Si es un alumno, solo puede ver asignaciones donde él es destinatario individual
    if (req.user.rol === 'alumno') {
      filter['destinatarios'] = {
        $elemMatch: {
          tipo: 'alumno',
          id: req.user.id
        }
      };
    }
    
    if (req.query.testId) filter.testId = req.query.testId;
    if (req.query.destinatarioId) filter['destinatarios.id'] = req.query.destinatarioId;

    const items = await Asignacion.find(filter)
      .populate('testId', 'titulo descripcion preguntas')
      .populate('docenteId', 'nombre correo')
      .sort({ creadaEn: -1 });
    
    res.json({ success: true, count: items.length, data: items });
  } catch (err) { next(err); }
});

// Actualizar (docente)
router.put('/:id', auth(['docente']), async (req, res, next) => {
  try {
    const item = await Asignacion.findOneAndUpdate({ _id: req.params.id, docenteId: req.user.id }, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// Obtener test para resolver
router.get('/:id/test', auth(['alumno', 'docente']), async (req, res, next) => {
  try {
    const asignacion = await Asignacion.findById(req.params.id)
      .populate('testId');
    
    if (!asignacion) {
      return res.status(404).json({ success: false, message: 'Asignación no encontrada' });
    }

    // Verificar que el usuario puede acceder a esta asignación
    if (req.user.rol === 'alumno') {
      const esDestinatario = asignacion.destinatarios.some(d => 
        d.tipo === 'alumno' && d.id.toString() === req.user.id
      );
      if (!esDestinatario) {
        return res.status(403).json({ success: false, message: 'No autorizado' });
      }
    } else if (req.user.rol === 'docente') {
      if (asignacion.docenteId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'No autorizado' });
      }
    }

    const test = asignacion.testId.toObject();

    res.json({ 
      success: true, 
      data: {
        test,
        tiempoLimite: asignacion.tiempoLimite,
        instrucciones: asignacion.instrucciones
      }
    });
  } catch (err) { 
    next(err); 
  }
});

// Eliminar (docente)
router.delete('/:id', auth(['docente']), async (req, res, next) => {
  try {
    const item = await Asignacion.findOneAndDelete({ _id: req.params.id, docenteId: req.user.id });
    if (!item) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, message: 'Eliminado' });
  } catch (err) { next(err); }
});

module.exports = router;