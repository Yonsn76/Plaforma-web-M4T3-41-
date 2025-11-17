import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { apiService } from '../../services/api'
import { useAIAPI } from '../../hooks/useAIAPI'
import Card from '../common/Card'
import { X, Lightbulb } from 'lucide-react'

interface Pregunta {
  _id: string
  enunciado: string
  opciones: string[]
  respuestaCorrecta: string
  explicacion: string
  dificultad: 'basica' | 'media' | 'avanzada'
  tipoPregunta: string
  orden: number
  puntos: number
}

interface Test {
  _id: string
  titulo: string
  descripcion: string
  preguntas: Pregunta[]
  tiempoLimite?: number
  instrucciones?: string
}

interface Respuesta {
  preguntaId: string
  respuestaSeleccionada: string
  esCorrecta: boolean
  tiempoRespuesta: number
}

interface ResolverTestProps {
  testId: string
  asignacionId: string
  onTestCompletado?: () => void
  onSalir?: () => void
}

export default function ResolverTest({ 
  testId, 
  asignacionId, 
  onTestCompletado, 
  onSalir 
}: ResolverTestProps) {
  const { user } = useAuth()
  const [test, setTest] = useState<Test | null>(null)
  const [preguntaActual, setPreguntaActual] = useState(0)
  const [respuestas, setRespuestas] = useState<Respuesta[]>([])
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState('')
  const [tiempoInicio, setTiempoInicio] = useState<Date | null>(null)
  const [tiempoRestante, setTiempoRestante] = useState<number | null>(null)
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [loading, setLoading] = useState(true)
  const [resultadoTest, setResultadoTest] = useState<any>(null)
  const [reporteRendimiento, setReporteRendimiento] = useState<any>(null)
  const [generandoReporte, setGenerandoReporte] = useState(false)

  
  // Estados para pistas
  const [mostrarPista, setMostrarPista] = useState(false)
  const [pistaActual, setPistaActual] = useState('')
  const [solicitandoPista, setSolicitandoPista] = useState(false)
  const [pistasUsadas, setPistasUsadas] = useState(0)
  
  // Hook para IA
  const { generateHint, generateReport } = useAIAPI()

  useEffect(() => {
    cargarTest()
  }, [testId])

  useEffect(() => {
    if (tiempoInicio && test?.tiempoLimite) {
      const interval = setInterval(() => {
        const tiempoTranscurrido = Math.floor((Date.now() - tiempoInicio.getTime()) / 1000)
        const tiempoRestanteCalculado = (test.tiempoLimite! * 60) - tiempoTranscurrido
        
        if (tiempoRestanteCalculado <= 0) {
          setTiempoRestante(0)
          finalizarTest()
          clearInterval(interval)
        } else {
          setTiempoRestante(tiempoRestanteCalculado)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [tiempoInicio, test?.tiempoLimite])

  const cargarTest = async () => {
    try {
      setLoading(true)
      
      // Usar el nuevo endpoint que aplica las configuraciones
      const response = await apiService.getTestParaResolver(asignacionId)
      
      if (!response || !response.test) {
        throw new Error('Test no encontrado')
      }

      const testData: Test = {
        _id: response.test._id,
        titulo: response.test.titulo,
        descripcion: response.test.descripcion || '',
        preguntas: response.test.preguntas || [],
        tiempoLimite: response.tiempoLimite,
        instrucciones: response.instrucciones
      }

      setTest(testData)
      setTiempoInicio(new Date())
    } catch (error) {
      console.error('Error cargando test:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatearTiempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)
    const segs = segundos % 60
    
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`
    }
    return `${minutos}:${segs.toString().padStart(2, '0')}`
  }

  const siguientePregunta = () => {
    if (!test) return

    // Guardar respuesta actual
    if (respuestaSeleccionada) {
      const pregunta = test.preguntas[preguntaActual]
      const nuevaRespuesta: Respuesta = {
        preguntaId: pregunta._id,
        respuestaSeleccionada,
        esCorrecta: respuestaSeleccionada === pregunta.respuestaCorrecta,
        tiempoRespuesta: Date.now()
      }

      setRespuestas(prev => {
        const existente = prev.find(r => r.preguntaId === pregunta._id)
        if (existente) {
          return prev.map(r => r.preguntaId === pregunta._id ? nuevaRespuesta : r)
        }
        return [...prev, nuevaRespuesta]
      })
    }

    // Avanzar a la siguiente pregunta
    if (preguntaActual < test.preguntas.length - 1) {
      setPreguntaActual(preguntaActual + 1)
      setRespuestaSeleccionada('')
    } else {
      // Verificar que se haya respondido la última pregunta
      if (!respuestaSeleccionada) {
        alert('Por favor responde la pregunta actual antes de finalizar el test.')
        return
      }
      finalizarTest()
    }
  }

  const preguntaAnterior = () => {
    if (preguntaActual > 0) {
      setPreguntaActual(preguntaActual - 1)
      // Cargar respuesta previa si existe
      const pregunta = test?.preguntas[preguntaActual - 1]
      if (pregunta) {
        const respuestaExistente = respuestas.find(r => r.preguntaId === pregunta._id)
        setRespuestaSeleccionada(respuestaExistente?.respuestaSeleccionada || '')
      }
    }
  }

  const solicitarPista = async () => {
    if (!test || !test.preguntas[preguntaActual]) return
    
    try {
      setSolicitandoPista(true)
      const pregunta = test.preguntas[preguntaActual]
      
      // Crear datos del ejercicio para la pista
      const ejercicioData = {
        enunciado: pregunta.enunciado,
        opciones: pregunta.opciones,
        respuestaCorrecta: pregunta.respuestaCorrecta,
        dificultad: pregunta.dificultad,
        tipoPregunta: pregunta.tipoPregunta
      }
      
      const response = await generateHint({
        preguntaId: pregunta._id
      }, ejercicioData)
      
      if (response && response.data && response.data.pista) {
        setPistaActual(response.data.pista)
        setMostrarPista(true)
        setPistasUsadas(pistasUsadas + 1)
      } else {
        setPistaActual('No se pudo generar una pista en este momento')
        setMostrarPista(true)
      }
    } catch (error) {
      console.error('Error generando pista:', error)
      setPistaActual('No se pudo generar una pista en este momento')
      setMostrarPista(true)
    } finally {
      setSolicitandoPista(false)
    }
  }

  const finalizarTest = async () => {
    try {
      
      // Preparar todas las respuestas incluyendo la actual
      let todasLasRespuestas = [...respuestas]
      
      // Agregar la respuesta actual si existe
      if (respuestaSeleccionada && test) {
        const pregunta = test.preguntas[preguntaActual]
        const nuevaRespuesta: Respuesta = {
          preguntaId: pregunta._id,
          respuestaSeleccionada,
          esCorrecta: respuestaSeleccionada === pregunta.respuestaCorrecta,
          tiempoRespuesta: Date.now()
        }

        // Actualizar el estado para la UI
        setRespuestas(prev => {
          const existente = prev.find(r => r.preguntaId === pregunta._id)
          if (existente) {
            return prev.map(r => r.preguntaId === pregunta._id ? nuevaRespuesta : r)
          }
          return [...prev, nuevaRespuesta]
        })

        // Agregar a la lista local para envío
        const existente = todasLasRespuestas.find(r => r.preguntaId === pregunta._id)
        if (existente) {
          todasLasRespuestas = todasLasRespuestas.map(r => r.preguntaId === pregunta._id ? nuevaRespuesta : r)
        } else {
          todasLasRespuestas.push(nuevaRespuesta)
        }
      }

      // Verificar que se hayan respondido todas las preguntas
      if (test && todasLasRespuestas.length < test.preguntas.length) {
        alert(`Faltan por responder ${test.preguntas.length - todasLasRespuestas.length} pregunta(s). Por favor responde todas las preguntas antes de finalizar.`)
        return
      }

      // Enviar respuestas al backend
      console.log('=== ENVIANDO RESPUESTAS ===');
      console.log('testId:', testId);
      console.log('asignacionId:', asignacionId);
      console.log('respuestas:', todasLasRespuestas);
      
      const datosEnvio = {
        testId,
        asignacionId,
        alumnoId: user?.id,
        respuestas: todasLasRespuestas.map(r => ({
          preguntaId: r.preguntaId,
          respuesta: r.respuestaSeleccionada,
          esCorrecta: r.esCorrecta,
          tiempoRespuesta: r.tiempoRespuesta
        }))
      };
      console.log('Datos que se envían:', datosEnvio);
      
      const resultado = await apiService.enviarRespuestasTest(datosEnvio)

      setResultadoTest(resultado)
      setGenerandoReporte(true)
      setMostrarResultados(true)
      
      // Generar reporte de rendimiento para test de profesor
      try {
        const reporte = await generarReporteTest(resultado, todasLasRespuestas)
        if (reporte) {
          setReporteRendimiento(reporte)
        }
      } catch (error) {
        console.error('Error generando reporte de test:', error)
        // No mostrar error al usuario, es opcional
      } finally {
        setGenerandoReporte(false)
      }
      
      // Notificar al componente padre que se completó el test
      if (onTestCompletado) {
        onTestCompletado()
      }
    } catch (error) {
      console.error('Error enviando respuestas:', error)
      alert('Error al enviar las respuestas. Inténtalo de nuevo.')
    } finally {
      // Finalizar envío
    }
  }

  const generarReporteTest = async (resultado: any, respuestas: Respuesta[]) => {
    if (!test || !user) return

    try {
      console.log('🤖 ResolverTest - Generando reporte de test de profesor...')
      
      // Preparar datos para el reporte
      const ejercicios = test.preguntas.map((pregunta) => ({
        id: `test-${pregunta._id}`,
        question: pregunta.enunciado,
        difficulty: pregunta.dificultad || 'basica',
        answer: pregunta.respuestaCorrecta,
        options: pregunta.opciones,
        explanation: pregunta.explicacion || '',
        hints: [],
        topic: test.titulo,
        grade: user.grado || '2',
        correctAnswer: pregunta.respuestaCorrecta
      }))

      const respuestasFormateadas = respuestas.map((resp, index) => ({
        id: `resp-${index}`,
        ejercicioId: `test-${test.preguntas[index]._id}`,
        respuesta: resp.respuestaSeleccionada,
        esCorrecta: resp.esCorrecta,
        tiempoResolucion: resp.tiempoRespuesta,
        pistasUsadas: 0, // Los tests de profesor no usan pistas
        fechaIntento: new Date().toISOString()
      }))

      // Calcular estadísticas
      const totalPreguntas = test.preguntas.length
      const respuestasCorrectas = respuestas.filter(r => r.esCorrecta).length
      const respuestasIncorrectas = totalPreguntas - respuestasCorrectas
      const puntuacion = Math.round((respuestasCorrectas / totalPreguntas) * 100)
      
      // Calcular tiempo total correctamente (en segundos)
      const tiempoTotalMs = respuestas.reduce((total, r) => total + r.tiempoRespuesta, 0)
      const tiempoTotal = Math.round(tiempoTotalMs / 1000) // Convertir a segundos
      const duracionSesion = Math.round(tiempoTotal / 60) // Convertir a minutos

      // Generar reporte con IA
      const reporteData = {
        alumnoId: user.id,
        grado: user.grado || '2',
        tema: test.titulo,
        ejercicios,
        respuestas: respuestasFormateadas,
        tiempoTotal: tiempoTotal, // Ya está en segundos
        duracionSesion: duracionSesion // Ya está en minutos
      }

      const reporteIA = await generateReport(reporteData)
      
      if (reporteIA.success) {
        // Guardar reporte en la base de datos
        const reporteCompleto = {
          alumnoId: user.id,
          grado: user.grado || '2',
          tema: test.titulo,
          totalPreguntas,
          respuestasCorrectas,
          respuestasIncorrectas,
          puntuacion,
          tiempoTotal: tiempoTotal, // Ya está en segundos
          duracionSesion: duracionSesion, // Ya está en minutos
          reporte: reporteIA.data.reporteDetallado,
          consejos: reporteIA.data.consejos,
          tipoPractica: 'tarea_docente',
          testId: test._id,
          conjuntoId: asignacionId, // Usar asignacionId como conjuntoId
          docenteId: resultado.docenteId || null
        }

        await apiService.rendimientoReporte(reporteCompleto)
        console.log('✅ ResolverTest - Reporte de test guardado exitosamente')
        
        // Retornar el reporte para mostrarlo en la UI
        return {
          reporteDetallado: reporteIA.data.reporteDetallado,
          consejos: reporteIA.data.consejos,
          estadisticas: {
            puntuacion,
            totalPreguntas,
            respuestasCorrectas,
            respuestasIncorrectas,
            tiempoTotal,
            duracionSesion
          }
        }
      }
    } catch (error) {
      console.error('❌ ResolverTest - Error generando reporte:', error)
      return null
    }
  }

  const salirTest = () => {
    if (confirm('¿Estás seguro de que quieres salir? Se perderán las respuestas no guardadas.')) {
      if (onSalir) {
        onSalir()
      }
    }
  }

  if (loading) {
    return (
      <Card title="Cargando Test">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </Card>
    )
  }

  if (!test) {
    return (
      <Card title="Error">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Error al cargar el test</h3>
          <p className="text-white/60">No se pudo cargar el test solicitado</p>
        </div>
      </Card>
    )
  }

  if (mostrarResultados) {
    // Usar datos del backend si están disponibles, sino calcular localmente
    const preguntasCorrectas = resultadoTest?.respuestasCorrectas || respuestas.filter(r => r.esCorrecta).length
    const totalPreguntas = resultadoTest?.totalPreguntas || test.preguntas.length
    const porcentaje = resultadoTest?.porcentaje || (preguntasCorrectas / totalPreguntas) * 100
    const puntuacionTotal = resultadoTest?.puntuacionTotal || 0
    const estado = resultadoTest?.estado || 'activa'

    return (
      <div className="space-y-6">
        <Card title="Test Completado">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">¡Test Completado!</h2>
              <p className="text-white/70 text-lg">{test.titulo}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <div className="text-3xl font-bold text-white mb-2">{preguntasCorrectas}</div>
                <div className="text-white/60">Correctas</div>
              </div>
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <div className="text-3xl font-bold text-white mb-2">{totalPreguntas - preguntasCorrectas}</div>
                <div className="text-white/60">Incorrectas</div>
              </div>
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <div className="text-3xl font-bold text-green-400 mb-2">{porcentaje.toFixed(1)}%</div>
                <div className="text-white/60">Calificación</div>
              </div>
            </div>

            {/* Información adicional del backend */}
            {resultadoTest && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">{puntuacionTotal} puntos</div>
                    <div className="text-white/60">Puntuación Total</div>
                  </div>
                </div>
                
                {estado === 'completada' && (
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-400 mb-1">¡Asignación Completada!</div>
                      <div className="text-green-300/80">Has alcanzado el 70% requerido</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mostrar respuestas detalladas si están disponibles */}
            {resultadoTest?.respuestas && resultadoTest.respuestas.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Revisión de Respuestas</h3>
                <div className="space-y-3">
                  {resultadoTest.respuestas.map((respuesta: any, index: number) => {
                    const pregunta = test.preguntas.find(p => p._id === respuesta.preguntaId)
                    return (
                      <div key={index} className={`p-4 rounded-xl border ${
                        respuesta.esCorrecta 
                          ? 'bg-green-500/10 border-green-500/20' 
                          : 'bg-red-500/10 border-red-500/20'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="text-sm text-white/60 mb-1">Pregunta {index + 1}</div>
                            <div className="text-white font-medium">{pregunta?.enunciado}</div>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-semibold ${
                            respuesta.esCorrecta 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {respuesta.esCorrecta ? 'Correcta' : 'Incorrecta'}
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-white/60">Tu respuesta: </span>
                            <span className="text-white">{respuesta.respuesta}</span>
                          </div>
                          {!respuesta.esCorrecta && (
                            <div>
                              <span className="text-white/60">Respuesta correcta: </span>
                              <span className="text-green-400">{respuesta.respuestaCorrecta}</span>
                            </div>
                          )}
                          {respuesta.explicacion && (
                            <div>
                              <span className="text-white/60">Explicación: </span>
                              <span className="text-white/80">{respuesta.explicacion}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => onTestCompletado?.()}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold hover:from-purple-400 hover:to-pink-500 transition-all flex items-center space-x-2 shadow-lg hover:shadow-purple-500/25"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Volver al Menú</span>
              </button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const pregunta = test.preguntas[preguntaActual]
  const progreso = ((preguntaActual + 1) / test.preguntas.length) * 100

  return (
    <div className="space-y-6">
      {/* Header del test */}
      <Card title={test.titulo}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{test.titulo}</h2>
              <p className="text-white/70">{test.descripcion}</p>
            </div>
            
            <div className="text-right">
              {tiempoRestante !== null && (
                <div className="text-sm text-white/60 mb-1">Tiempo restante</div>
              )}
              <div className={`text-2xl font-bold ${
                tiempoRestante !== null && tiempoRestante < 300 ? 'text-red-400' : 'text-white'
              }`}>
                {tiempoRestante !== null ? formatearTiempo(tiempoRestante) : 'Sin límite'}
              </div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Progreso</span>
              <span className="text-white">{preguntaActual + 1} de {test.preguntas.length}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all"
                style={{ width: `${progreso}%` }}
              ></div>
            </div>
          </div>

          {/* Instrucciones */}
          {test.instrucciones && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-blue-300 font-semibold mb-1">Instrucciones</h4>
                  <p className="text-white/90 text-sm">{test.instrucciones}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Pregunta actual */}
      <Card title={`Pregunta ${preguntaActual + 1}`}>
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <p className="text-white text-lg leading-relaxed">{pregunta.enunciado}</p>
          </div>

          {/* Opciones de respuesta */}
          <div className="space-y-3">
            {pregunta.opciones.map((opcion, index) => (
              <label
                key={index}
                className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  respuestaSeleccionada === opcion
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    respuestaSeleccionada === opcion
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-white/30'
                  }`}>
                    {respuestaSeleccionada === opcion && (
                      <div className="w-3 h-3 rounded-full bg-white"></div>
                    )}
                  </div>
                  <span className="text-white font-medium">{opcion}</span>
                </div>
                <input
                  type="radio"
                  name="respuesta"
                  value={opcion}
                  checked={respuestaSeleccionada === opcion}
                  onChange={(e) => setRespuestaSeleccionada(e.target.value)}
                  className="sr-only"
                />
              </label>
            ))}
          </div>
        </div>
      </Card>

      {/* Botón de pista */}
      <Card>
        <div className="flex justify-center">
          <button
            onClick={solicitarPista}
            disabled={solicitandoPista}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold hover:from-yellow-400 hover:to-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-yellow-500/25"
          >
            {solicitandoPista ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Generando pista...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span><Lightbulb className="w-4 h-4 mr-1" /> Solicitar Pista</span>
              </>
            )}
          </button>
        </div>
      </Card>

      {/* Mostrar pista si está disponible */}
      {mostrarPista && pistaActual && (
        <Card>
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-yellow-300 font-semibold mb-2 flex items-center"><Lightbulb className="w-4 h-4 mr-2" /> Pista</h4>
                <p className="text-yellow-200 text-sm leading-relaxed">{pistaActual}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-yellow-400/70 text-xs">Pistas usadas: {pistasUsadas}</span>
                  <button
                    onClick={() => setMostrarPista(false)}
                    className="text-yellow-400/70 hover:text-yellow-300 text-xs"
                  >
                    <X className="w-3 h-3 mr-1" /> Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Controles de navegación */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex gap-3">
            <button
              onClick={preguntaAnterior}
              disabled={preguntaActual === 0}
              className="px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 border border-white/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Anterior</span>
            </button>

            <button
              onClick={siguientePregunta}
              disabled={!respuestaSeleccionada}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold hover:from-blue-400 hover:to-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-blue-500/25"
            >
              <span>{preguntaActual === test.preguntas.length - 1 ? 'Finalizar' : 'Siguiente'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <button
            onClick={salirTest}
            className="px-6 py-3 rounded-xl bg-red-500/20 text-red-300 font-semibold hover:bg-red-500/30 transition-all flex items-center space-x-2 border border-red-500/30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Salir</span>
          </button>
        </div>
      </Card>

      {/* Sección de resultados */}
      {mostrarResultados && (
        <div className="space-y-6">
          {/* Resultados del test */}
          <Card title="¡Test Completado!">
            <div className="space-y-6">
              {/* Icono de éxito y mensaje principal */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">¡Test Completado!</h2>
                <p className="text-white/70">Has completado todas las preguntas del test</p>
              </div>

              {/* Estadísticas principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {resultadoTest?.respuestasCorrectas || 0}
                  </div>
                  <div className="text-sm text-blue-300">Correctas</div>
                </div>
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {resultadoTest?.respuestasIncorrectas || 0}
                  </div>
                  <div className="text-sm text-red-300">Incorrectas</div>
                </div>
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {resultadoTest?.puntuacion || 0}%
                  </div>
                  <div className="text-sm text-green-300">Calificación</div>
                </div>
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {resultadoTest?.tiempoTotal || 0}s
                  </div>
                  <div className="text-sm text-purple-300">Tiempo</div>
                </div>
              </div>

              {/* Puntuación total */}
              <div className="text-center p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <div className="text-3xl font-bold text-green-400 mb-1">
                  {resultadoTest?.puntuacion || 0} puntos
                </div>
                <div className="text-sm text-green-300">Puntuación Total</div>
              </div>

              {/* Mensaje de asignación completada */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-300 mb-1">¡Asignación Completada!</div>
                  <div className="text-sm text-green-200">
                    Has alcanzado el {resultadoTest?.puntuacion || 0}% de la puntuación
                  </div>
                </div>
              </div>

              {/* Indicador de carga o reporte de rendimiento */}
              {generandoReporte ? (
                <Card title="Generando Reporte de Rendimiento">
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-white/70 text-lg">Generando análisis personalizado...</p>
                    <p className="text-white/50 text-sm mt-2">Esto puede tomar unos segundos</p>
                  </div>
                </Card>
              ) : reporteRendimiento ? (
                <Card title="Reporte de Rendimiento">
                  <div className="space-y-6">
                    {/* Análisis detallado */}
                    <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Análisis Detallado
                      </h4>
                      <p className="text-white/90 leading-relaxed whitespace-pre-line">
                        {reporteRendimiento.reporteDetallado}
                      </p>
                    </div>

                    <div className="p-6 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                      <h4 className="text-lg font-semibold text-yellow-300 mb-3 flex items-center">
                        <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Recomendaciones y Consejos
                      </h4>
                      <p className="text-yellow-200 leading-relaxed whitespace-pre-line">
                        {reporteRendimiento.consejos}
                      </p>
                    </div>
                  </div>
                </Card>
              ) : null}

              {/* Botón para continuar */}
              <div className="text-center pt-4">
                <button
                  onClick={() => {
                    if (onTestCompletado) {
                      onTestCompletado()
                    }
                  }}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold hover:from-purple-400 hover:to-pink-500 transition-all shadow-lg hover:shadow-purple-500/25 flex items-center space-x-2 mx-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                  </svg>
                  <span>Volver al Menú</span>
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}



