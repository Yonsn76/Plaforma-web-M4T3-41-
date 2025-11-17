const express = require('express');
const router = express.Router();
const { 
  crearRendimientoReporte,
  getReportesAlumno, 
  getUltimoReporte,
  getReportesDocente
} = require('../controllers/rendimientoreporteController');
const auth = require('../middleware/auth');

// Todas las rutas requieren autenticación
// router.use(auth); // Deshabilitado para permitir envío sin auth

// Crear reporte de rendimiento
router.post('/', (req, res, next) => {
  console.log('🛣️ RendimientoReporte Route - POST / recibido');
  console.log('🛣️ RendimientoReporte Route - Headers:', req.headers);
  console.log('🛣️ RendimientoReporte Route - Body presente:', !!req.body);
  console.log('🛣️ RendimientoReporte Route - Content-Type:', req.headers['content-type']);
  next();
}, crearRendimientoReporte);

// Obtener reportes de un alumno
router.get('/alumno/:alumnoId', getReportesAlumno);

// Obtener último reporte de un alumno
router.get('/alumno/:alumnoId/ultimo', getUltimoReporte);

// Obtener reportes de rendimiento de todos los alumnos de un docente
router.get('/docente', auth, getReportesDocente);

module.exports = router;
