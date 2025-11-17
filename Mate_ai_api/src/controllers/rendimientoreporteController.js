const RendimientoReporte = require('../models/RendimientoReporte');
const mongoose = require('mongoose');

// Crear reporte de rendimiento
const crearRendimientoReporte = async (req, res) => {
  try {
    console.log('🚀 RendimientoReporteController - ===== INICIO CREAR REPORTE =====');
    console.log('📥 RendimientoReporteController - Headers recibidos:', req.headers);
    console.log('📥 RendimientoReporteController - Método:', req.method);
    console.log('📥 RendimientoReporteController - URL:', req.url);
    console.log('📥 RendimientoReporteController - Body completo:', JSON.stringify(req.body, null, 2));
    console.log('📥 RendimientoReporteController - Content-Type:', req.headers['content-type']);
    console.log('📥 RendimientoReporteController - Authorization presente:', !!req.headers.authorization);
    
    const { 
      alumnoId, 
      grado, 
      tema, 
      totalPreguntas, 
      respuestasCorrectas, 
      respuestasIncorrectas, 
      puntuacion, 
      tiempoTotal, 
      duracionSesion, 
      reporte, 
      consejos,
      tipoPractica,
      testId,
      conjuntoId,
      docenteId
    } = req.body;

    console.log('🔍 RendimientoReporteController - Datos extraídos:');
    console.log('  - alumnoId:', alumnoId);
    console.log('  - grado:', grado);
    console.log('  - tema:', tema);
    console.log('  - totalPreguntas:', totalPreguntas);
    console.log('  - respuestasCorrectas:', respuestasCorrectas);
    console.log('  - respuestasIncorrectas:', respuestasIncorrectas);
    console.log('  - puntuacion:', puntuacion);
    console.log('  - tiempoTotal:', tiempoTotal);
    console.log('  - duracionSesion:', duracionSesion);
    console.log('  - reporte (longitud):', reporte ? reporte.length : 'undefined');
    console.log('  - consejos (longitud):', consejos ? consejos.length : 'undefined');

    // Validar datos requeridos
    console.log('🔍 RendimientoReporteController - Validando datos requeridos...');
    if (!alumnoId || !grado || !tema || !reporte || !consejos) {
      console.error('❌ RendimientoReporteController - Datos requeridos faltantes');
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos: alumnoId, grado, tema, reporte, consejos'
      });
    }

    // Validar que alumnoId sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(alumnoId)) {
      console.error('❌ RendimientoReporteController - alumnoId inválido:', alumnoId);
      return res.status(400).json({
        success: false,
        message: 'ID de alumno inválido'
      });
    }

    // Preparar datos para guardar
    const reporteData = {
      alumnoId: new mongoose.Types.ObjectId(alumnoId),
      grado,
      tema,
      totalPreguntas: totalPreguntas || 0,
      respuestasCorrectas: respuestasCorrectas || 0,
      respuestasIncorrectas: respuestasIncorrectas || 0,
      puntuacion: puntuacion || 0,
      tiempoTotal: tiempoTotal || 0,
      duracionSesion: duracionSesion || 5,
      reporte,
      consejos,
      tipoPractica: tipoPractica || 'ia_libre',
      fechaRealizacion: new Date()
    };

    // Agregar referencias opcionales si existen
    if (testId && mongoose.Types.ObjectId.isValid(testId)) {
      reporteData.testId = new mongoose.Types.ObjectId(testId);
    }
    if (conjuntoId && mongoose.Types.ObjectId.isValid(conjuntoId)) {
      reporteData.conjuntoId = new mongoose.Types.ObjectId(conjuntoId);
    }
    if (docenteId && mongoose.Types.ObjectId.isValid(docenteId)) {
      reporteData.docenteId = new mongoose.Types.ObjectId(docenteId);
    }

    console.log('💾 RendimientoReporteController - Datos preparados para guardar:');
    console.log('  - alumnoId:', reporteData.alumnoId);
    console.log('  - tema:', reporteData.tema);
    console.log('  - grado:', reporteData.grado);
    console.log('  - duracionSesion:', reporteData.duracionSesion);
    console.log('  - reporte (primeros 100 chars):', reporteData.reporte ? reporteData.reporte.substring(0, 100) + '...' : 'undefined');
    console.log('  - consejos (primeros 100 chars):', reporteData.consejos ? reporteData.consejos.substring(0, 100) + '...' : 'undefined');

    console.log('💾 RendimientoReporteController - Intentando guardar en base de datos...');
    const reporteGuardado = await RendimientoReporte.create(reporteData);
    console.log('✅ RendimientoReporteController - Reporte guardado exitosamente con ID:', reporteGuardado._id);


    const respuesta = {
      success: true,
      data: {
        reporteId: reporteGuardado._id,
        puntuacion: puntuacion,
        tema: tema,
        grado: grado,
        totalPreguntas: totalPreguntas,
        respuestasCorrectas: respuestasCorrectas,
        respuestasIncorrectas: respuestasIncorrectas,
        tiempoTotal: tiempoTotal,
        duracionSesion: duracionSesion
      }
    };

    console.log('🎉 RendimientoReporteController - ===== FIN CREAR REPORTE =====');
    console.log('📤 RendimientoReporteController - Enviando respuesta al frontend:', JSON.stringify(respuesta, null, 2));
    res.json(respuesta);
  } catch (error) {
    console.error('❌ RendimientoReporteController - ===== ERROR CREAR REPORTE =====');
    console.error('❌ RendimientoReporteController - Error completo:', error);
    console.error('❌ RendimientoReporteController - Error message:', error.message);
    console.error('❌ RendimientoReporteController - Error stack:', error.stack);
    console.error('❌ RendimientoReporteController - ===== FIN ERROR =====');
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear reporte de rendimiento',
      details: error.message
    });
  }
};

// Obtener reportes de un alumno
const getReportesAlumno = async (req, res) => {
  try {
    const { alumnoId } = req.params;
    const { limite = 10, pagina = 1 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(alumnoId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de alumno inválido'
      });
    }

    const skip = (parseInt(pagina) - 1) * parseInt(limite);
    
    const reportes = await RendimientoReporte.find({ alumnoId: new mongoose.Types.ObjectId(alumnoId) })
      .sort({ fechaRealizacion: -1 })
      .skip(skip)
      .limit(parseInt(limite))
      .populate('alumnoId', 'nombre correo grado')
      .populate('docenteId', 'nombre correo')
      .populate('testId', 'titulo descripcion');

    const total = await RendimientoReporte.countDocuments({ alumnoId: new mongoose.Types.ObjectId(alumnoId) });

    res.json({
      success: true,
      data: {
        reportes,
        paginacion: {
          total,
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          totalPaginas: Math.ceil(total / parseInt(limite))
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo reportes del alumno:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      details: error.message
    });
  }
};

// Obtener último reporte de un alumno
const getUltimoReporte = async (req, res) => {
  try {
    const { alumnoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(alumnoId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de alumno inválido'
      });
    }

    const ultimoReporte = await RendimientoReporte.findOne({ alumnoId: new mongoose.Types.ObjectId(alumnoId) })
      .sort({ fechaRealizacion: -1 })
      .populate('alumnoId', 'nombre correo grado')
      .populate('docenteId', 'nombre correo')
      .populate('testId', 'titulo descripcion');

    if (!ultimoReporte) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron reportes para este alumno'
      });
    }

    res.json({
      success: true,
      data: ultimoReporte
    });
  } catch (error) {
    console.error('Error obteniendo último reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      details: error.message
    });
  }
};

// Obtener reportes de rendimiento de todos los alumnos de un docente
const getReportesDocente = async (req, res) => {
  try {
    const docenteId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(docenteId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de docente inválido'
      });
    }

    const { limite = 50, pagina = 1 } = req.query;
    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    // Buscar reportes donde el docenteId coincida
    const reportes = await RendimientoReporte.find({ docenteId: new mongoose.Types.ObjectId(docenteId) })
      .sort({ fechaRealizacion: -1 })
      .skip(skip)
      .limit(parseInt(limite))
      .populate('alumnoId', 'nombre correo grado')
      .populate('docenteId', 'nombre correo')
      .populate('testId', 'titulo descripcion');

    const total = await RendimientoReporte.countDocuments({ docenteId: new mongoose.Types.ObjectId(docenteId) });

    res.json({
      success: true,
      data: {
        reportes,
        paginacion: {
          total,
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          totalPaginas: Math.ceil(total / parseInt(limite))
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo reportes del docente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      details: error.message
    });
  }
};

module.exports = {
  crearRendimientoReporte,
  getReportesAlumno,
  getUltimoReporte,
  getReportesDocente
};
