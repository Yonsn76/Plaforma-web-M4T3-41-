const express = require('express');
const router = express.Router();

// Health check for API routes
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API routes are working',
    timestamp: new Date().toISOString()
  });
});

// M4T3 41 endpoints
router.use('/usuarios', require('./usuarios'));
router.use('/solicitudes', require('./solicitudes'));
router.use('/asignaciones', require('./asignaciones'));
router.use('/grupos', require('./grupos'));
router.use('/anuncios', require('./anuncios'));
router.use('/plantillas', require('./plantillas'));
router.use('/tests', require('./tests'));
router.use('/ia', require('./ia'));
// router.use('/mensajes', require('./mensajes')); // Eliminado - no se usa
router.use('/rendimientoreporte', require('./rendimientoreporte'));

module.exports = router;
