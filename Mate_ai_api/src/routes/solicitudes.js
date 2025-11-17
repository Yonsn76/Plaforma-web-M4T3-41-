const express = require('express');
const { body, query } = require('express-validator');
const Solicitud = require('../models/Solicitud');
const Usuario = require('../models/Usuario');
const validate = require('../middleware/validation');
const auth = require('../middleware/auth');

const router = express.Router();

// Enviar solicitud (alumno)
router.post('/', [
  body('docenteId').isMongoId(),
  body('mensaje').optional().isString(),
  validate
], auth(), async (req, res, next) => {
  try {
    const existe = await Solicitud.findOne({ alumnoId: req.user.id, docenteId: req.body.docenteId, estado: 'pendiente' });
    if (existe) return res.status(400).json({ success: false, message: 'Ya existe una solicitud pendiente' });

    const item = await Solicitud.create({ alumnoId: req.user.id, docenteId: req.body.docenteId, mensaje: req.body.mensaje });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
});

// Ver mis solicitudes (alumno)
router.get('/mis-solicitudes', auth(), async (req, res, next) => {
  try {
    const items = await Solicitud.find({ alumnoId: req.user.id })
      .populate('docenteId', 'nombre correo especialidad')
      .sort({ creadaEn: -1 });

    // Renombrar campos para frontend
    const formatted = items.map(item => ({
      _id: item._id,
      alumno: { _id: req.user.id, nombre: req.user.nombre, correo: req.user.correo },
      docente: item.docenteId,
      estado: item.estado,
      mensaje: item.mensaje,
      mensajeRechazo: item.mensajeRechazo,
      creadoEn: item.creadaEn
    }));

    res.json({ success: true, data: formatted });
  } catch (err) { next(err); }
});

// Ver solicitudes recibidas (docente)
router.get('/recibidas', auth(), async (req, res, next) => {
  try {
    const items = await Solicitud.find({ docenteId: req.user.id })
      .populate('alumnoId', 'nombre correo grado')
      .sort({ creadaEn: -1 });

    // Renombrar campos para frontend
    const formatted = items.map(item => ({
      _id: item._id,
      alumno: item.alumnoId,
      docente: { _id: req.user.id, nombre: req.user.nombre, correo: req.user.correo },
      estado: item.estado,
      mensaje: item.mensaje,
      mensajeRechazo: item.mensajeRechazo,
      creadoEn: item.creadaEn
    }));

    res.json({ success: true, data: formatted });
  } catch (err) { next(err); }
});

// Responder solicitud (docente)
router.put('/:id/responder', [
  body('accion').isIn(['aceptar', 'rechazar']),
  body('mensaje').optional(),
  validate
], auth(), async (req, res, next) => {
  try {
    const { accion, mensaje } = req.body;
    const estado = accion === 'aceptar' ? 'aceptada' : 'rechazada';

    const item = await Solicitud.findOne({ _id: req.params.id, docenteId: req.user.id });
    if (!item) return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });

    if (item.estado !== 'pendiente') {
      return res.status(400).json({ success: false, message: 'Solicitud ya procesada' });
    }

    item.estado = estado;
    if (accion === 'rechazar' && mensaje) {
      item.mensajeRechazo = mensaje;
    }

    // Si se acepta, asignar docente al alumno
    if (accion === 'aceptar') {
      await Usuario.findByIdAndUpdate(item.alumnoId, { docenteAsignado: req.user.id });
    }

    await item.save();

    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// Cancelar solicitud (alumno)
router.delete('/:id', auth(), async (req, res, next) => {
  try {
    const item = await Solicitud.findOneAndDelete({
      _id: req.params.id,
      alumnoId: req.user.id,
      estado: 'pendiente'
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Solicitud no encontrada o ya procesada' });
    }

    res.json({ success: true, message: 'Solicitud cancelada' });
  } catch (err) { next(err); }
});

module.exports = router;