import { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../common/Card'
import ResolverTest from './ResolverTest'

interface ProgresoTest {
  id: string
  testId: string
  nombre: string
  descripcion: string
  docente: string
  totalPreguntas: number
  preguntasResueltas: number
  preguntasCorrectas: number
  porcentaje: number
  fechaInicio: string
  fechaCompletado?: string
  estado: 'activa' | 'completada' | 'vencida'
  tiempoLimite?: number
  instrucciones?: string
  tiempoTotal?: number
  puntuacionTotal?: number
}

interface EstadisticasGenerales {
  totalEjercicios: number
  ejerciciosCompletados: number
  respuestasCorrectas: number
}

interface ActividadReciente {
  id: string
  tipo: 'test'
  nombre: string
  resultado: 'completado'
  fecha: string
  puntuacion: number
}


export default function MiProgreso() {
  const { user } = useAuth()
  const [progresoTests, setProgresoTests] = useState<ProgresoTest[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasGenerales | null>(null)
  const [actividadReciente, setActividadReciente] = useState<ActividadReciente[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarResolverTest, setMostrarResolverTest] = useState(false)
  const [testSeleccionado, setTestSeleccionado] = useState<{testId: string, asignacionId: string} | null>(null)

  useEffect(() => {
    cargarProgreso()
  }, [])

  const cargarProgreso = async () => {
    try {
      setLoading(true)
      
      // Obtener asignaciones del alumno
      const asignaciones = await apiService.getAsignacionesAlumno()
      
      // Procesar datos de tests
      const testsConProgreso = await Promise.all(
        asignaciones.map(async (asignacion: any) => {
          try {
            const testInfo = asignacion.testId
            if (!testInfo) return null

            const preguntas = testInfo.preguntas || []
            
            // Obtener progreso real del alumno para este test
            let preguntasResueltas = 0
            let preguntasCorrectas = 0
            let porcentaje = 0
            let tiempoTotal = 0
            let puntuacionTotal = 0
            
            if (user?.id) {
              try {
                const progresoData = await apiService.getProgresoTest(asignacion._id, user.id)
                if (progresoData?.progreso?.mejorIntento) {
                  const intento = progresoData.progreso.mejorIntento
                  preguntasResueltas = intento.respuestasCorrectas || 0  // Total de respuestas correctas
                  preguntasCorrectas = intento.respuestasCorrectas || 0  // Mismo valor (respuestas correctas)
                  porcentaje = intento.porcentaje || 0
                  tiempoTotal = intento.tiempoTotal || 0
                  puntuacionTotal = intento.puntuacionTotal || 0
                  
                  console.log('📊 Datos obtenidos de la DB:', {
                    respuestasCorrectas: intento.respuestasCorrectas,
                    totalPreguntas: intento.totalPreguntas,
                    porcentaje: intento.porcentaje,
                    puntuacionTotal: intento.puntuacionTotal
                  })
                }
              } catch (error) {
                console.error('Error cargando progreso:', error)
              }
            }
            
            // Determinar estado basado en datos reales
            let estado: 'activa' | 'completada' | 'vencida' = 'activa'
            if (preguntasResueltas === preguntas.length && preguntas.length > 0) {
              estado = 'completada'
            } else if (asignacion.fechaLimite && new Date() > new Date(asignacion.fechaLimite)) {
              estado = 'vencida'
            }

            return {
              id: asignacion._id,
              testId: testInfo._id,
              nombre: testInfo.titulo,
              descripcion: testInfo.descripcion || '',
              docente: asignacion.docenteId?.nombre || 'Docente',
              totalPreguntas: preguntas.length,
              preguntasResueltas,
              preguntasCorrectas,
              porcentaje,
              fechaInicio: asignacion.fechaInicio,
              fechaCompletado: estado === 'completada' ? new Date().toISOString() : undefined,
              estado,
              tiempoLimite: asignacion.tiempoLimite,
              instrucciones: asignacion.instrucciones,
              tiempoTotal,
              puntuacionTotal
            }
          } catch (error) {
            console.error('Error procesando test:', error)
            return null
          }
        })
      )
      
      const testsValidos = testsConProgreso.filter(t => t !== null) as ProgresoTest[]
      setProgresoTests(testsValidos)
      
      // Calcular estadísticas generales basadas en datos reales
      const totalEjercicios = testsValidos.reduce((sum, t) => sum + t.totalPreguntas, 0)
      const ejerciciosCompletados = testsValidos.reduce((sum, t) => sum + t.preguntasCorrectas, 0)
      const respuestasCorrectas = testsValidos.reduce((sum, t) => sum + t.preguntasCorrectas, 0)
      
      setEstadisticas({
        totalEjercicios,
        ejerciciosCompletados,
        respuestasCorrectas
      })
      
      // Generar actividad reciente basada en tests completados
      const testsCompletados = testsValidos.filter(t => t.estado === 'completada')
      const actividadData: ActividadReciente[] = testsCompletados.slice(0, 5).map((test) => ({
        id: test.id,
        tipo: 'test' as const,
        nombre: test.nombre,
        resultado: 'completado' as const,
        fecha: test.fechaCompletado || test.fechaInicio,
        puntuacion: test.porcentaje
      }))
      
      setActividadReciente(actividadData)
      
    } catch (error) {
      console.error('Error cargando progreso:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEstadoColor = (estado: ProgresoTest['estado']) => {
    switch (estado) {
      case 'completada': return 'from-green-500 to-emerald-500'
      case 'activa': return 'from-blue-500 to-cyan-500'
      case 'vencida': return 'from-red-500 to-pink-500'
      default: return 'from-gray-500 to-slate-500'
    }
  }

  const iniciarTest = (testId: string) => {
    // Encontrar el test correspondiente para obtener el asignacionId
    const test = progresoTests.find(t => t.testId === testId)
    if (test) {
      setTestSeleccionado({
        testId: test.testId,
        asignacionId: test.id
      })
      setMostrarResolverTest(true)
    }
  }

  const volverAlProgreso = () => {
    setMostrarResolverTest(false)
    setTestSeleccionado(null)
    cargarProgreso() // Recargar para actualizar progreso
  }

  const getEstadoLabel = (estado: ProgresoTest['estado']) => {
    switch (estado) {
      case 'completada': return 'Completada'
      case 'activa': return 'Activa'
      case 'vencida': return 'Vencida'
      default: return 'Desconocido'
    }
  }

  const getResultadoColor = () => {
    return 'text-blue-400'
  }

  const getResultadoIcon = () => {
    return '✓'
  }

  if (loading) {
    return (
      <Card title="Mi Progreso">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </Card>
    )
  }

  if (mostrarResolverTest && testSeleccionado) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={volverAlProgreso}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            ← Volver a Mi Progreso
          </button>
          <h1 className="text-2xl font-bold text-white">Resolver Test</h1>
        </div>
        <ResolverTest 
          testId={testSeleccionado.testId}
          asignacionId={testSeleccionado.asignacionId}
          onTestCompletado={volverAlProgreso}
          onSalir={volverAlProgreso}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mi Progreso</h1>
          <p className="text-white/70">Sigue tu evolución en el aprendizaje de matemáticas</p>
        </div>
      </div>

      {/* Estadísticas generales */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Respuestas Correctas</p>
                <p className="text-white text-2xl font-bold">{estadisticas.ejerciciosCompletados}</p>
                <p className="text-white/60 text-xs">de {estadisticas.totalEjercicios} total</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Precisión</p>
                <p className="text-white text-2xl font-bold">
                  {((estadisticas.respuestasCorrectas / estadisticas.ejerciciosCompletados) * 100).toFixed(1)}%
                </p>
                <p className="text-white/60 text-xs">{estadisticas.respuestasCorrectas} correctas</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

        </div>
      )}


      {/* Progreso de tests */}
      <Card title="Progreso de Tests">
        <div className="space-y-4">
          {progresoTests.map(test => {
            // Usar el porcentaje que viene de la base de datos
            const porcentajeCompletado = test.porcentaje || 0

            return (
              <div key={test.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{test.nombre}</h3>
                        <p className="text-white/70 text-sm mb-2">{test.descripcion}</p>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getEstadoColor(test.estado)} text-white`}>
                            {getEstadoLabel(test.estado)}
                          </span>
                          <span className="text-white/60 text-sm">Por: {test.docente}</span>
                          <span className="text-white/60 text-sm">
                            {new Date(test.fechaInicio).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white/70">Progreso general</span>
                          <span className="text-white">{porcentajeCompletado.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                            style={{ width: `${porcentajeCompletado}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-white/70">Preguntas resueltas</div>
                          <div className="text-white font-semibold">
                            {test.preguntasResueltas} / {test.totalPreguntas}
                          </div>
                        </div>
                        <div>
                          <div className="text-white/70">Puntuación total</div>
                          <div className="text-white font-semibold">
                            {test.puntuacionTotal || test.preguntasCorrectas} pts
                          </div>
                        </div>
                      </div>

                      {test.tiempoTotal && test.tiempoTotal > 0 && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-white/70">Tiempo total</div>
                            <div className="text-white font-semibold">
                              {Math.floor(test.tiempoTotal / 60)}m {test.tiempoTotal % 60}s
                            </div>
                          </div>
                          <div>
                            <div className="text-white/70">Fecha completado</div>
                            <div className="text-white font-semibold">
                              {test.fechaCompletado ? new Date(test.fechaCompletado).toLocaleDateString('es-ES') : 'No completado'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    {test.estado === 'activa' && (
                      <button
                        onClick={() => iniciarTest(test.id)}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-sm font-medium hover:from-blue-400 hover:to-cyan-500 transition-all flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Resolver Test</span>
                      </button>
                    )}
                    
                    {test.estado === 'completada' && (
                      <button
                        onClick={() => iniciarTest(test.id)}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium hover:from-green-400 hover:to-emerald-500 transition-all flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Repetir Test</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Actividad reciente */}
      <Card title="Actividad Reciente">
        <div className="space-y-3">
          {actividadReciente.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No hay actividad reciente</h3>
              <p className="text-white/60">Comienza a practicar para ver tu actividad aquí</p>
            </div>
          ) : (
            actividadReciente.map(actividad => (
              <div key={actividad.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-500/20 text-green-400">
                    <span className="text-lg">{getResultadoIcon()}</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">{actividad.nombre}</div>
                    <div className="text-white/60 text-sm">
                      {new Date(actividad.fecha).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${getResultadoColor()}`}>
                    Completado
                  </div>
                  <div className="text-white/60 text-xs">
                    {actividad.puntuacion}%
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}




