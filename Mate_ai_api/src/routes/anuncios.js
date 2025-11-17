const express = require('express');
const { body, query } = require('express-validator');
const Anuncio = require('../models/Anuncio');
const Usuario = require('../models/Usuario');
const validate = require('../middleware/validation');
const auth = require('../middleware/auth');

const router = express.Router();

// Publicar (docente)
router.post('/', [
  body('titulo').notEmpty(),
  body('contenido').notEmpty(),
  body('destinatarios').isArray({ min: 1 }),
  body('destinatarios.*.tipo').isIn(['alumno', 'grupo']),
  body('destinatarios.*.id').isMongoId(),
  validate
], auth(['docente']), async (req, res, next) => {
  try {
    const item = await Anuncio.create({ ...req.body, docenteId: req.user.id });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
});

// Listar
router.get('/', [
  query('docenteId').optional().isMongoId(),
  query('destinatarioId').optional().isMongoId(),
  validate
], auth(), async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.docenteId) filter.docenteId = req.query.docenteId;
    if (req.query.destinatarioId) filter['destinatarios.id'] = req.query.destinatarioId;
    const items = await Anuncio.find(filter).sort({ creadoEn: -1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) { next(err); }
});

// Obtener anuncios enviados por el docente
router.get('/enviados', auth(['docente']), async (req, res, next) => {
  try {
    const anuncios = await Anuncio.find({ docenteId: req.user.id })
      .populate('destinatarios.id', 'nombre grado')
      .sort({ creadoEn: -1 });
    res.json({ success: true, data: anuncios });
  } catch (err) { next(err); }
});

// Obtener anuncios para un alumno
router.get('/alumno', auth(['alumno']), async (req, res, next) => {
  try {
    const alumno = await Usuario.findById(req.user.id).select('creadoEn');
    if (!alumno) {
      return res.status(404).json({ success: false, message: 'Alumno no encontrado' });
    }

    const anuncios = await Anuncio.find({
      creadoEn: { $gte: alumno.creadoEn },
      $or: [
        { 'destinatarios.id': req.user.id },
        { tipo: 'todos' }
      ]
    })
    .populate('docenteId', 'nombre especialidad')
    .sort({ creadoEn: -1 });
    
    res.json({ success: true, data: anuncios });
  } catch (err) { next(err); }
});

// Crear anuncio (versión simplificada para el frontend)
router.post('/crear', [
  body('titulo').notEmpty().withMessage('El título es requerido'),
  body('contenido').notEmpty().withMessage('El contenido es requerido'),
  body('tipo').isIn(['todos', 'alumno', 'grupo']).withMessage('Tipo inválido'),
  body('alumnoId').optional().isMongoId(),
  body('grupoId').optional().isMongoId(),
  validate
], auth(['docente']), async (req, res, next) => {
  try {
    const { titulo, contenido, tipo, alumnoId, grupoId } = req.body;
    
    let destinatarios = [];
    
    if (tipo === 'todos') {
      // Para todos los alumnos del docente
      destinatarios = [{ tipo: 'todos', id: null }];
    } else if (tipo === 'alumno' && alumnoId) {
      destinatarios = [{ tipo: 'alumno', id: alumnoId }];
    } else if (tipo === 'grupo' && grupoId) {
      destinatarios = [{ tipo: 'grupo', id: grupoId }];
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Parámetros de destinatario inválidos' 
      });
    }
    
    const anuncio = await Anuncio.create({
      titulo,
      contenido,
      tipo,
      destinatarios,
      docenteId: req.user.id
    });
    
    res.status(201).json({ success: true, data: anuncio });
  } catch (err) { next(err); }
});

// Marcar anuncio como leído
router.put('/:id/leer', auth(['alumno']), async (req, res, next) => {
  try {
    const anuncio = await Anuncio.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { leidoPor: req.user.id } },
      { new: true }
    );
    
    if (!anuncio) {
      return res.status(404).json({ success: false, message: 'Anuncio no encontrado' });
    }
    
    res.json({ success: true, data: anuncio });
  } catch (err) { next(err); }
});

// Eliminar anuncio
router.delete('/:id', auth(['docente']), async (req, res, next) => {
  try {
    const anuncio = await Anuncio.findOneAndDelete({
      _id: req.params.id,
      docenteId: req.user.id
    });
    
    if (!anuncio) {
      return res.status(404).json({ success: false, message: 'Anuncio no encontrado' });
    }
    
    res.json({ success: true, message: 'Anuncio eliminado' });
  } catch (err) { next(err); }
});

module.exports = router;