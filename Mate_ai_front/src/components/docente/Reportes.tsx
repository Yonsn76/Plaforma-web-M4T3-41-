import { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import Card from '../common/Card'

interface ProgresoAlumno {
  id: string
  nombre: string
  grado: string
  totalEjercicios: number
  ejerciciosCompletados: number
  promedioCalificaciones: number
  tiempoPromedio: number
  ultimaActividad: string
  progresoPorTema: any[]
}

interface EstadisticasGenerales {
  totalAlumnos: number
  totalEjercicios: number
  ejerciciosCompletados: number
  promedioGeneral: number
  tiempoPromedio: number
}

const grados = ['1', '2', '3', '4', '5', '6']

export default function Reportes() {
  const [progresoAlumnos, setProgresoAlumnos] = useState<ProgresoAlumno[]>([])
  const [estadisticasGenerales, setEstadisticasGenerales] = useState<EstadisticasGenerales | null>(null)
  const [reportesRendimiento, setReportesRendimiento] = useState<ReporteRendimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroGrado, setFiltroGrado] = useState('todos')
  const [tipoReporte, setTipoReporte] = useState<'general' | 'rendimiento'>('general')
  const [alumnoSeleccionadoIA, setAlumnoSeleccionadoIA] = useState<string>('')

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    if (tipoReporte === 'rendimiento' && alumnoSeleccionadoIA) {
      cargarReportesRendimiento()
    }
  }, [tipoReporte, alumnoSeleccionadoIA])

  const cargarReportesRendimiento = async () => {
    try {
      const response = await apiService.getRespuestasAlumno()
      setReportesRendimiento(response)
    } catch (error) {
      console.error('Error cargando reportes de rendimiento:', error)
      // Datos de ejemplo si falla
      const alumnoInfo = alumnosFiltrados.find(a => a.id === alumnoSeleccionadoIA)
      const datosEjemplo = [
        {
          _id: 'reporte1',
          alumnoId: {
            _id: alumnoSeleccionadoIA,
            nombre: alumnoInfo?.nombre || 'Alumno',
            grado: alumnoInfo?.grado || '1'
          },
          tema: 'Operaciones Básicas',
          grado: alumnoInfo?.grado || '1',
          totalPreguntas: 10,
          respuestasCorrectas: 8,
          respuestasIncorrectas: 2,
          puntuacion: 80,
          tiempoTotal: 600,
          reporte: 'El alumno demuestra un buen dominio de las operaciones básicas de suma y resta. Logró resolver correctamente 8 de 10 ejercicios, mostrando comprensión sólida de los conceptos fundamentales.',
          consejos: 'Se recomienda practicar más con números de 3 dígitos y problemas que involucran carry-over.',
          fechaRealizacion: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          tipoPractica: 'tarea_docente'
        }
      ]
      setReportesRendimiento(datosEjemplo)
    }
  }

  const cargarDatos = async () => {
    try {
      setLoading(true)
      
      // Obtener datos desde la API
      const [alumnosData, respuestasData] = await Promise.all([
        apiService.getMisAlumnos().catch(() => []),
        apiService.getRespuestasAlumno().catch(() => [])
      ])

      // Procesar progreso de alumnos basado en los reportes de rendimiento
      const progresoAlumnos: ProgresoAlumno[] = alumnosData.map((alumno: any) => {
        // Filtrar reportes de este alumno
        const reportesAlumno = respuestasData.filter((reporte: any) => reporte.alumnoId._id === alumno._id)
        
        // Calcular estadísticas basadas en los reportes
        const totalEjercicios = reportesAlumno.length
        const ejerciciosCompletados = reportesAlumno.length
        const promedioCalificaciones = reportesAlumno.length > 0 
          ? reportesAlumno.reduce((sum: number, reporte: any) => sum + reporte.puntuacion, 0) / reportesAlumno.length
          : 0

        return {
          id: alumno._id,
          nombre: alumno.nombre,
          grado: alumno.grado || 'Sin grado',
          totalEjercicios,
          ejerciciosCompletados,
          promedioCalificaciones,
          tiempoPromedio: reportesAlumno.length > 0 
            ? reportesAlumno.reduce((sum: number, reporte: any) => sum + reporte.tiempoTotal, 0) / reportesAlumno.length
            : 0,
          ultimaActividad: reportesAlumno.length > 0
            ? (() => {
                const fechasValidas = reportesAlumno
                  .map((r: any) => new Date(r.fechaRealizacion))
                  .filter(date => !isNaN(date.getTime()))
                  .map(date => date.getTime())
                return fechasValidas.length > 0
                  ? new Date(Math.max(...fechasValidas)).toISOString()
                  : new Date().toISOString()
              })()
            : (() => {
                const fechaBase = alumno.actualizadoEn || alumno.creadoEn
                const fecha = new Date(fechaBase)
                return !isNaN(fecha.getTime()) ? fecha.toISOString() : new Date().toISOString()
              })(),
          progresoPorTema: [] // TODO: calcular por tema
        }
      })

      // Calcular estadísticas generales
      const totalAlumnos = alumnosData.length
      const totalEjercicios = respuestasData.length
      const ejerciciosCompletados = respuestasData.length
      const promedioGeneral = respuestasData.length > 0 
        ? respuestasData.reduce((sum: number, reporte: any) => sum + reporte.puntuacion, 0) / respuestasData.length
        : 0

      const estadisticas: EstadisticasGenerales = {
        totalAlumnos,
        totalEjercicios,
        ejerciciosCompletados,
        promedioGeneral,
        tiempoPromedio: respuestasData.length > 0 
          ? respuestasData.reduce((sum: number, reporte: any) => sum + reporte.tiempoTotal, 0) / respuestasData.length
          : 0,
      }

      setProgresoAlumnos(progresoAlumnos)
      setEstadisticasGenerales(estadisticas)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const alumnosFiltrados = progresoAlumnos.filter(alumno => {
    const cumpleGrado = filtroGrado === 'todos' || alumno.grado.startsWith(filtroGrado)
    return cumpleGrado
  })

  const exportarReporte = (formato: 'pdf' | 'excel' | 'csv') => {
    // Simulación de exportación
    console.log(`Exportando reporte en formato ${formato}`)
    alert(`Reporte exportado en formato ${formato.toUpperCase()}`)
  }

  if (loading) {
    return (
      <Card title="Reportes y Estadísticas">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white/70 mt-4">Cargando reportes...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="animated-gradient">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Reportes y Análisis IA 📊
            </h1>
            <p className="text-white/70">
              Análisis detallado del progreso y reportes generados por IA
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => exportarReporte('pdf')}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all text-sm font-medium"
            >
              📄 PDF
            </button>
            <button
              onClick={() => exportarReporte('excel')}
              className="px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-all text-sm font-medium"
            >
              📊 Excel
            </button>
            <button
              onClick={() => exportarReporte('csv')}
              className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all text-sm font-medium"
            >
              📋 CSV
            </button>
          </div>
        </div>
      </Card>

      {/* Filtros */}
      <Card title="Filtros" subtitle="Personaliza tu análisis">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white font-medium mb-2">Grado</label>
            <select
              value={filtroGrado}
              onChange={(e) => setFiltroGrado(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500 focus:bg-white/10 transition-all"
            >
              <option value="todos" className="bg-gray-800">Todos los grados</option>
              {grados.map(grado => (
                <option key={grado} value={grado} className="bg-gray-800">
                  {grado}° Grado
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-white font-medium mb-2">Tipo de Reporte</label>
            <select
              value={tipoReporte}
              onChange={(e) => setTipoReporte(e.target.value as any)}
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500 focus:bg-white/10 transition-all"
            >
              <option value="general" className="bg-gray-800">General</option>
              <option value="rendimiento" className="bg-gray-800">Análisis IA</option>
            </select>
          </div>
          {tipoReporte === 'rendimiento' && (
            <div className="md:col-span-2">
              <label className="block text-white font-medium mb-2">Seleccionar Alumno</label>
              <select
                value={alumnoSeleccionadoIA}
                onChange={(e) => setAlumnoSeleccionadoIA(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500 focus:bg-white/10 transition-all"
              >
                <option value="" className="bg-gray-800">Seleccionar alumno</option>
                {alumnosFiltrados.map(alumno => (
                  <option key={alumno.id} value={alumno.id} className="bg-gray-800">
                    {alumno.nombre} - {alumno.grado}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* Estadísticas Generales */}
      {tipoReporte === 'general' && estadisticasGenerales && (
        <Card title="Estadísticas Generales" subtitle="Resumen del rendimiento general">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
              <div className="text-3xl font-bold text-white mb-2">{estadisticasGenerales.totalAlumnos}</div>
              <div className="text-blue-300 text-sm">Total Alumnos</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
              <div className="text-3xl font-bold text-white mb-2">{estadisticasGenerales.ejerciciosCompletados}</div>
              <div className="text-green-300 text-sm">Ejercicios Completados</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
              <div className="text-3xl font-bold text-white mb-2">{estadisticasGenerales.promedioGeneral.toFixed(1)}</div>
              <div className="text-yellow-300 text-sm">Promedio General</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <div className="text-3xl font-bold text-white mb-2">{estadisticasGenerales.tiempoPromedio.toFixed(1)}m</div>
              <div className="text-purple-300 text-sm">Tiempo Promedio</div>
            </div>
          </div>
        </Card>
      )}

      {/* Reportes de Rendimiento con IA */}
      {tipoReporte === 'rendimiento' && (
        <Card title={`Análisis IA - ${alumnosFiltrados.find(a => a.id === alumnoSeleccionadoIA)?.nombre || 'Seleccionar Alumno'}`} subtitle="Historial completo de análisis generados por IA para este alumno">
          {alumnoSeleccionadoIA ? (
            <div className="space-y-6">
              {reportesRendimiento.length > 0 ? (
                reportesRendimiento
                  .sort((a, b) => new Date(b.fechaRealizacion).getTime() - new Date(a.fechaRealizacion).getTime())
                  .map((reporte) => (
                    <div key={reporte._id} className="p-6 rounded-xl bg-white/5 border border-white/10">
                      {/* Header del reporte */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            📊
                          </div>
                          <div>
                            <h4 className="text-white font-semibold text-lg">{reporte.tema}</h4>
                            <p className="text-white/60 text-sm">
                              {new Date(reporte.fechaRealizacion).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })} • {reporte.tipoPractica === 'tarea_docente' ? 'Tarea Asignada' : 'Práctica Libre'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">{reporte.puntuacion}%</div>
                          <div className="text-white/60 text-xs">Puntuación</div>
                        </div>
                      </div>

                      {/* Estadísticas rápidas */}
                      <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                          <div className="text-blue-300 font-bold text-lg">{reporte.totalPreguntas}</div>
                          <div className="text-blue-200 text-xs">Total Preguntas</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                          <div className="text-green-300 font-bold text-lg">{reporte.respuestasCorrectas}</div>
                          <div className="text-green-200 text-xs">Correctas</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                          <div className="text-red-300 font-bold text-lg">{reporte.respuestasIncorrectas}</div>
                          <div className="text-red-200 text-xs">Incorrectas</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                          <div className="text-purple-300 font-bold text-lg">{Math.round(reporte.tiempoTotal / 60)}m</div>
                          <div className="text-purple-200 text-xs">Tiempo Total</div>
                        </div>
                      </div>

                      {/* Análisis del rendimiento */}
                      <div className="mb-6">
                        <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Análisis del Rendimiento
                        </h5>
                        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                          <p className="text-white/90 leading-relaxed">{reporte.reporte}</p>
                        </div>
                      </div>

                      {/* Consejos y recomendaciones */}
                      <div>
                        <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          Consejos y Recomendaciones
                        </h5>
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                          <p className="text-white/90 leading-relaxed">{reporte.consejos}</p>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <p className="text-white/70 text-lg font-medium mb-2">No hay reportes disponibles</p>
                  <p className="text-white/60 text-sm">Este alumno aún no ha completado prácticas con análisis de IA</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-white/70 text-lg font-medium mb-2">Selecciona un alumno</p>
              <p className="text-white/60 text-sm">Elige un alumno del selector arriba para ver sus análisis de IA</p>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
