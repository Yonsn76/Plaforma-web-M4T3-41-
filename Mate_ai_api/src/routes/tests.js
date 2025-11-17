const express = require('express');
const { body, query } = require('express-validator');
const Test = require('../models/Test');
const validate = require('../middleware/validation');
const auth = require('../middleware/auth');

const router = express.Router();

// Crear test (docente)
router.post('/', [
  body('titulo').notEmpty(),
  body('preguntas').isArray({ min: 1 }),
  validate
], auth(['docente']), async (req, res, next) => {
  try {
    console.log('=== CREANDO TEST ===');
    console.log('Body recibido:', JSON.stringify(req.body, null, 2));
    const { titulo, descripcion, preguntas, configuracion } = req.body;
    
    const testData = {
      titulo,
      descripcion,
      docenteId: req.user.id,
      preguntas: preguntas.map((p, index) => {
        console.log(`Pregunta ${index + 1}:`, p);
        return {
          enunciado: p.enunciado,
          opciones: p.opciones || [],
          respuestaCorrecta: p.respuestaCorrecta,
          explicacion: p.explicacion || '',
          dificultad: p.dificultad || 'basica',
          tipoPregunta: p.tipoPregunta || 'opcion_multiple',
          orden: index + 1,
          puntos: p.puntos || 1
        };
      }),
      configuracion: configuracion || {}
    };

    console.log('Datos procesados para crear test:', JSON.stringify(testData, null, 2));
    const test = await Test.create(testData);
    console.log('Test creado exitosamente:', test._id);
    res.status(201).json({ success: true, data: test });
  } catch (err) { 
    console.error('Error creando test:', err);
    console.error('Stack trace:', err.stack);
    next(err); 
  }
});

// Listar tests del docente
router.get('/', auth(['docente']), async (req, res, next) => {
  try {
    const { estado, tipoTest } = req.query;
    const filter = { docenteId: req.user.id };
    
    if (estado) filter.estado = estado;
    if (tipoTest) filter.tipoTest = tipoTest;
    
    const tests = await Test.find(filter)
      .sort({ creadoEn: -1 });
    
    res.json({ success: true, count: tests.length, data: tests });
  } catch (err) { 
    next(err); 
  }
});

// Obtener tests del docente (ruta específica)
router.get('/docente', auth(['docente']), async (req, res, next) => {
  try {
    const { estado } = req.query;
    const filter = { docenteId: req.user.id };
    
    if (estado) filter.estado = estado;
    
    const tests = await Test.find(filter)
      .sort({ creadoEn: -1 });
    
    // Usar estadísticas del modelo Test (ya calculadas)
    const testsConEstadisticas = tests.map(test => ({
      ...test.toObject(),
      estadisticas: test.estadisticas || {
        totalIntentos: 0,
        promedioPuntuacion: 0,
        tiempoPromedio: 0
      }
    }));
    
    res.json({ success: true, count: testsConEstadisticas.length, data: testsConEstadisticas });
  } catch (err) { 
    next(err); 
  }
});

// ===== ENVIAR RESPUESTAS DE TEST =====
router.post('/respuestas', async (req, res, next) => {
  try {
    console.log('=== ENDPOINT /respuestas LLAMADO ===');
    console.log('Body recibido:', req.body);
    const { testId, asignacionId, respuestas, alumnoId } = req.body;
    
    // Validar datos requeridos
    if (!testId || !asignacionId || !respuestas || !Array.isArray(respuestas) || !alumnoId) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos: testId, asignacionId, respuestas, alumnoId'
      });
    }

    // Buscar el test
    console.log('Buscando test con ID:', testId);
    const test = await Test.findById(testId);
    console.log('Test encontrado:', test ? 'SÍ' : 'NO');
    if (!test) {
      console.log('ERROR: Test no encontrado');
      return res.status(404).json({
        success: false,
        message: 'Test no encontrado'
      });
    }

    // Buscar la asignación
    const Asignacion = require('../models/Asignacion');
    const asignacion = await Asignacion.findById(asignacionId);
    if (!asignacion) {
      return res.status(404).json({
        success: false,
        message: 'Asignación no encontrada'
      });
    }

    // Procesar respuestas y calcular puntuación
    console.log('=== PROCESANDO RESPUESTAS ===');
    console.log('Respuestas recibidas:', respuestas);
    console.log('Preguntas del test:', test.preguntas);
    
    let puntuacionTotal = 0;
    let respuestasCorrectas = 0;
    const respuestasProcesadas = [];

    for (const respuesta of respuestas) {
      console.log('Procesando respuesta:', respuesta);
      const pregunta = test.preguntas.find(p => p._id.toString() === respuesta.preguntaId);
      console.log('Pregunta encontrada:', pregunta);
      
      if (!pregunta) {
        console.log('Pregunta no encontrada, saltando...');
        continue; // Saltar si no se encuentra la pregunta
      }

      const esCorrecta = pregunta.respuestaCorrecta === respuesta.respuesta;
      const puntos = esCorrecta ? (pregunta.puntos || 1) : 0;
      
      console.log('Comparación:', {
        respuestaAlumno: respuesta.respuesta,
        respuestaCorrecta: pregunta.respuestaCorrecta,
        esCorrecta,
        puntos
      });
      
      puntuacionTotal += puntos;
      if (esCorrecta) respuestasCorrectas++;

      respuestasProcesadas.push({
        preguntaId: respuesta.preguntaId,
        respuesta: respuesta.respuesta,
        esCorrecta,
        puntos,
        respuestaCorrecta: pregunta.respuestaCorrecta,
        explicacion: pregunta.explicacion,
        tiempoRespuesta: respuesta.tiempoRespuesta || 0
      });
    }
    
    console.log('=== RESULTADO FINAL ===');
    console.log('Puntuación total:', puntuacionTotal);
    console.log('Respuestas correctas:', respuestasCorrectas);
    console.log('Total preguntas:', test.preguntas.length);

    // Calcular porcentaje
    const totalPreguntas = test.preguntas.length;
    const porcentaje = Math.round((respuestasCorrectas / totalPreguntas) * 100);

    // Buscar o crear registro de progreso (solo 1 por alumno y test)
    const ProgresoTest = require('../models/ProgresoTest');
    
    // Buscar progreso existente
    let progresoExistente = await ProgresoTest.findOne({
      testId,
      asignacionId,
      alumnoId
    });

    if (progresoExistente) {
      // Actualizar progreso existente (sin guardar respuestas)
      progresoExistente.puntuacionTotal = puntuacionTotal;
      progresoExistente.respuestasCorrectas = respuestasCorrectas;
      progresoExistente.totalPreguntas = totalPreguntas;
      progresoExistente.porcentaje = porcentaje;
      progresoExistente.tiempoInicio = new Date(Date.now() - (respuestas[0]?.tiempoRespuesta || 0));
      progresoExistente.tiempoFinalizacion = new Date();
      progresoExistente.estado = 'completado';
      
      // Calcular estadísticas
      progresoExistente.calcularEstadisticas();
      
      console.log('💾 Actualizando progreso existente:', {
        puntuacionTotal: progresoExistente.puntuacionTotal,
        respuestasCorrectas: progresoExistente.respuestasCorrectas,
        totalPreguntas: progresoExistente.totalPreguntas,
        porcentaje: progresoExistente.porcentaje
      });
      
      await progresoExistente.save();
    } else {
      // Crear nuevo progreso (sin guardar respuestas)
      const nuevoProgreso = new ProgresoTest({
        testId,
        asignacionId,
        alumnoId,
        puntuacionTotal,
        respuestasCorrectas,
        totalPreguntas,
        porcentaje,
        tiempoInicio: new Date(Date.now() - (respuestas[0]?.tiempoRespuesta || 0)),
        tiempoFinalizacion: new Date(),
        estado: 'completado',
        esMejorIntento: true
      });

      // Calcular estadísticas
      nuevoProgreso.calcularEstadisticas();
      
      console.log('💾 Creando nuevo progreso:', {
        puntuacionTotal: nuevoProgreso.puntuacionTotal,
        respuestasCorrectas: nuevoProgreso.respuestasCorrectas,
        totalPreguntas: nuevoProgreso.totalPreguntas,
        porcentaje: nuevoProgreso.porcentaje
      });
      
      await nuevoProgreso.save();
    }

    // Actualizar estadísticas de la asignación
    const progresoActual = await ProgresoTest.findOne({
      testId,
      asignacionId,
      alumnoId
    });
    
    asignacion.estadisticas = {
      totalIntentos: 1, // Solo 1 intento por alumno
      mejorPuntuacion: progresoActual.porcentaje,
      tiempoPromedio: progresoActual.tiempoTotal
    };

    // Marcar como completada si se alcanza el 70% o más
    if (porcentaje >= 70) {
      asignacion.estado = 'completada';
    }

    await asignacion.save();

    res.json({
      success: true,
      message: 'Respuestas enviadas correctamente',
      data: {
        puntuacionTotal,
        respuestasCorrectas,
        totalPreguntas,
        porcentaje,
        estado: asignacion.estado,
        tiempoTotal: progresoActual.tiempoTotal
      }
    });

  } catch (err) {
    console.error('Error enviando respuestas:', err);
    next(err);
  }
});

// Obtener un test específico
router.get('/:id', auth(['docente']), async (req, res, next) => {
  try {
    const test = await Test.findOne({ 
      _id: req.params.id, 
      docenteId: req.user.id 
    });
    
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test no encontrado'
      });
    }
    
    res.json({ success: true, data: test });
  } catch (err) { 
    next(err); 
  }
});

// Actualizar test
router.put('/:id', auth(['docente']), async (req, res, next) => {
  try {
    const { titulo, descripcion, preguntas, configuracion, estado } = req.body;
    
    const updateData = {};
    if (titulo) updateData.titulo = titulo;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (estado) updateData.estado = estado;
    if (configuracion) updateData.configuracion = configuracion;
    
    if (preguntas) {
      updateData.preguntas = preguntas.map((p, index) => ({
        enunciado: p.enunciado,
        opciones: p.opciones || [],
        respuestaCorrecta: p.respuestaCorrecta,
        explicacion: p.explicacion || '',
        dificultad: p.dificultad || 'basica',
        tipoPregunta: p.tipoPregunta || 'opcion_multiple',
        orden: index + 1,
        puntos: p.puntos || 1
      }));
    }
    
    const test = await Test.findOneAndUpdate(
      { _id: req.params.id, docenteId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test no encontrado'
      });
    }
    
    res.json({ success: true, data: test });
  } catch (err) { 
    next(err); 
  }
});

// Eliminar test
router.delete('/:id', auth(['docente']), async (req, res, next) => {
  try {
    const test = await Test.findOneAndDelete({ 
      _id: req.params.id, 
      docenteId: req.user.id 
    });
    
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test no encontrado'
      });
    }
    
    res.json({ success: true, message: 'Test eliminado correctamente' });
  } catch (err) { 
    next(err); 
  }
});

// ===== OBTENER PROGRESO DE ALUMNO =====
router.get('/progreso/:asignacionId/:alumnoId', async (req, res, next) => {
  try {
    console.log('=== ENDPOINT /progreso LLAMADO ===')
    const { asignacionId, alumnoId } = req.params;
    console.log('Parámetros recibidos:', { asignacionId, alumnoId })
    
    const ProgresoTest = require('../models/ProgresoTest');
    const Asignacion = require('../models/Asignacion');
    
    // Obtener la asignación
    const asignacion = await Asignacion.findById(asignacionId);
    console.log('Asignación encontrada:', asignacion ? 'SÍ' : 'NO')
    if (!asignacion) {
      console.log('ERROR: Asignación no encontrada')
      return res.status(404).json({
        success: false,
        message: 'Asignación no encontrada'
      });
    }
    
    // Obtener el progreso del alumno para esta asignación (solo 1 registro)
    const progreso = await ProgresoTest.findOne({
      asignacionId,
      alumnoId
    });
    console.log('Progreso encontrado:', progreso ? 'SÍ' : 'NO')
    if (progreso) {
      console.log('Datos del progreso:', {
        puntuacionTotal: progreso.puntuacionTotal,
        respuestasCorrectas: progreso.respuestasCorrectas,
        totalPreguntas: progreso.totalPreguntas,
        porcentaje: progreso.porcentaje
      })
    }
    
    // Calcular estadísticas
    const totalIntentos = progreso ? 1 : 0;
    const mejorPuntuacion = progreso ? progreso.porcentaje : 0;
    
    const respuesta = {
      success: true,
      data: {
        asignacion: {
          id: asignacion._id,
          testId: asignacion.testId,
          estado: asignacion.estado,
          fechaLimite: asignacion.fechaLimite
        },
        progreso: {
          totalIntentos,
          mejorPuntuacion,
          ultimoIntento: progreso,
          mejorIntento: progreso,
          todosLosIntentos: progreso ? [progreso] : []
        }
      }
    };
    
    console.log('Respuesta enviada:', JSON.stringify(respuesta, null, 2))
    res.json(respuesta);
    
  } catch (err) {
    console.error('Error obteniendo progreso:', err);
    next(err);
  }
});

// Obtener reportes de rendimiento de todos los alumnos del docente
router.get('/respuestas/alumnos', auth(['docente']), async (req, res, next) => {
  try {
    const docenteId = req.user.id;
    const { limite = 50, pagina = 1 } = req.query;
    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    const RendimientoReporte = require('../models/RendimientoReporte');

    // Obtener todos los reportes de rendimiento de los alumnos del docente
    const reportes = await RendimientoReporte.find({ docenteId })
      .populate('alumnoId', 'nombre correo grado')
      .sort({ fechaRealizacion: -1 })
      .skip(skip)
      .limit(parseInt(limite));

    const total = await RendimientoReporte.countDocuments({ docenteId });

    res.json({
      success: true,
      data: reportes,
      paginacion: {
        total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        totalPaginas: Math.ceil(total / parseInt(limite))
      }
    });

  } catch (error) {
    console.error('Error obteniendo reportes de rendimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      details: error.message
    });
  }
});

module.exports = router;
