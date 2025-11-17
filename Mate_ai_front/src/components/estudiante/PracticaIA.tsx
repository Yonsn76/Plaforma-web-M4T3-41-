import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useAIAPI } from '../../hooks/useAIAPI'
import { apiService } from '../../services/api'
import Card from '../common/Card'
import IconComponent from '../common/IconComponent'
import { GraduationCap, Rocket, Sparkles, RotateCcw, Frown, X, CheckCircle } from 'lucide-react'

interface Ejercicio {
  id: string
  enunciado: string
  opciones?: string[]
  respuestaCorrecta: string
  explicacion: string
  dificultad: 'basica' | 'media' | 'avanzada'
  tema: string
  grado: string
}

interface ConfiguracionIA {
  grado: string
  tema: string
  cantidad: number
  dificultad: 'basica' | 'media' | 'avanzada'
}

interface Intento {
  id: string
  ejercicioId: string
  respuesta: string
  esCorrecta: boolean
  pistasUsadas: number
  fechaIntento: string
  tiempoResolucion: number
}

  // const grados = ['1', '2', '3', '4', '5', '6'] // No se usa - se obtiene del usuario
const temas = [
  'Suma y Resta',
  'Multiplicación y División',
  'Fracciones',
  'Decimales',
  'Geometría Básica',
  'Área y Perímetro',
  'Ecuaciones Lineales',
  'Ecuaciones Cuadráticas',
  'Probabilidad',
  'Estadística',
  'Trigonometría',
  'Funciones'
]

const dificultades = [
  { value: 'basica', label: 'Básica', color: 'from-green-500 to-emerald-500', icon: '🟢' },
  { value: 'media', label: 'Media', color: 'from-yellow-500 to-orange-500', icon: '🟡' },
  { value: 'avanzada', label: 'Avanzada', color: 'from-red-500 to-pink-500', icon: '🔴' }
]

export default function PracticaIA() {
  const { user } = useAuth()
  const { generateExercises, generateHint, validateAnswer, generateReport } = useAIAPI()

  // Estados principales
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([])
  const [ejercicioActual, setEjercicioActual] = useState<Ejercicio | null>(null)
  const [indiceActual, setIndiceActual] = useState(0)
  const [respuesta, setRespuesta] = useState('')
  const [intentos, setIntentos] = useState<Intento[]>([])
  const [pistasUsadas, setPistasUsadas] = useState(0)
  const [pistaActual, setPistaActual] = useState('')
  const [mostrarPista, setMostrarPista] = useState(false)
  const [ejercicioCompletado, setEjercicioCompletado] = useState(false)
  const [ejercicioFallido, setEjercicioFallido] = useState(false)
  const [mostrarExplicacion, setMostrarExplicacion] = useState(false)
  const [tiempoInicio, setTiempoInicio] = useState<number>(0)
  const [intentosEjercicio, setIntentosEjercicio] = useState(0)
  const [maxIntentos] = useState(3)

  // Estados de configuración
  const [mostrarConfiguracion, setMostrarConfiguracion] = useState(true)
  const [configuracion, setConfiguracion] = useState<ConfiguracionIA>({
    grado: user?.grado || '3',
    tema: 'Suma y Resta',
    cantidad: 5,
    dificultad: 'basica'
  })

  // Estados de UI
  // const [loading, setLoading] = useState(false) // No se usa
  const [generando, setGenerando] = useState(false)
  const [validando, setValidando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error' | 'info', texto: string } | null>(null)

  // Actualizar el grado cuando el usuario cambie
  useEffect(() => {
    if (user?.grado) {
      setConfiguracion(prev => ({
        ...prev,
        grado: user.grado || prev.grado
      }))
    }
  }, [user?.grado])

  // Auto-ocultar mensajes después de 5 segundos
  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => {
        setMensaje(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [mensaje])
  const [practicaCompletada, setPracticaCompletada] = useState(false)
  const [reporteGenerado, setReporteGenerado] = useState<any>(null)
  const [generandoReporte, setGenerandoReporte] = useState(false)

  const iniciarPractica = async () => {
    try {
      setGenerando(true)

      const request = {
        grado: configuracion.grado,
        tema: configuracion.tema,
        dificultad: configuracion.dificultad,
        cantidad: configuracion.cantidad,
        alumnoId: user?.id // Incluir ID del estudiante para personalización adaptativa
      }

      console.log('Generando ejercicios con configuración:', request)
      const response = await generateExercises(request)

      console.log('Respuesta completa:', response)

      if (response && response.data && response.data.ejercicios) {
        const ejerciciosGenerados = response.data.ejercicios.map((ej: any, index: number) => ({
          id: `ej-${Date.now()}-${index}`,
          enunciado: ej.statement || ej.enunciado || 'Ejercicio sin enunciado',
          opciones: ej.options || [],
          respuestaCorrecta: ej.correctAnswer || ej.respuestaCorrecta || '',
          explicacion: ej.explanation || ej.explicacion || 'Explicación no disponible',
          dificultad: configuracion.dificultad,
          tema: configuracion.tema,
          grado: configuracion.grado
        }))

        setEjercicios(ejerciciosGenerados)
        setEjercicioActual(ejerciciosGenerados[0])
        setIndiceActual(0)
        setMostrarConfiguracion(false)
        setTiempoInicio(Date.now())
        setIntentosEjercicio(0) // Resetear contador de intentos
        setEjercicioFallido(false) // Resetear estado de ejercicio fallido

        console.log('Ejercicios generados:', ejerciciosGenerados)
      } else {
        throw new Error('No se pudieron generar los ejercicios')
      }
    } catch (error) {
      console.error('Error generando ejercicios:', error)
      setMensaje({ tipo: 'error', texto: `Error al generar ejercicios: ${error instanceof Error ? error.message : 'Error desconocido'}` })
    } finally {
      setGenerando(false)
    }
  }

  const solicitarPista = async () => {
    if (!ejercicioActual) return

    try {
      const response = await generateHint({
        preguntaId: ejercicioActual.id
      }, ejercicioActual)

      if (response && response.data && response.data.pista) {
        setPistaActual(response.data.pista)
        setMostrarPista(true)
        setPistasUsadas(pistasUsadas + 1)
      }
    } catch (error) {
      console.error('Error generando pista:', error)
      setPistaActual('No se pudo generar una pista en este momento')
      setMostrarPista(true)
    }
  }

  const validarRespuesta = async () => {
    if (!ejercicioActual || !respuesta.trim()) {
      setMensaje({ tipo: 'info', texto: 'Ingresa tu respuesta antes de validar' })
      return
    }

    try {
      setValidando(true)

      const tiempoResolucion = Date.now() - tiempoInicio

      // Usar la IA del frontend para validar la respuesta
      const validacion = await validateAnswer(ejercicioActual.id, respuesta.trim(), ejercicioActual)
      const esCorrecta = validacion.data.esCorrecta

      const nuevoIntento: Intento = {
        id: Date.now().toString(),
        ejercicioId: ejercicioActual.id,
        respuesta: respuesta.trim(),
        esCorrecta,
        pistasUsadas,
        fechaIntento: new Date().toISOString(),
        tiempoResolucion
      }

      setIntentos([...intentos, nuevoIntento])
      setIntentosEjercicio(intentosEjercicio + 1)

      if (esCorrecta) {
        setEjercicioCompletado(true)
        setMostrarExplicacion(true)
        setMensaje({ tipo: 'success', texto: '¡Correcto! ¡Bien hecho!' })
      } else if (intentosEjercicio + 1 >= maxIntentos) {
        // Máximo de intentos alcanzado - marcar como fallido, NO como completado
        setEjercicioFallido(true)
        setMostrarExplicacion(true)
        setMensaje({ tipo: 'error', texto: `Incorrecto. Has alcanzado el máximo de ${maxIntentos} intentos. Continúa al siguiente ejercicio.` })
      } else {
        // Aún puede intentar de nuevo
        setMensaje({ tipo: 'error', texto: `Incorrecto. Intento ${intentosEjercicio + 1} de ${maxIntentos}. Intenta de nuevo.` })
        setRespuesta('') // Limpiar respuesta para nuevo intento
      }
    } catch (error) {
      console.error('Error validando respuesta:', error)
      setMensaje({ tipo: 'error', texto: 'Error al validar la respuesta' })
    } finally {
      setValidando(false)
    }
  }

  const siguienteEjercicio = async () => {
    if (indiceActual < ejercicios.length - 1) {
      const nuevoIndice = indiceActual + 1
      setIndiceActual(nuevoIndice)
      setEjercicioActual(ejercicios[nuevoIndice])
      setRespuesta('')
      setMostrarPista(false)
      setPistaActual('')
      setPistasUsadas(0)
      setEjercicioCompletado(false)
      setEjercicioFallido(false)
      setMostrarExplicacion(false)
      setTiempoInicio(Date.now())
      setIntentosEjercicio(0) // Resetear contador de intentos
    } else {
      // Práctica completada - generar reporte con IA del frontend
      await generarReporteFinal()
    }
  }

  // Generar reporte final usando IA del frontend (Perplexity)
  const generarReporteFinal = async () => {
    try {
      setGenerandoReporte(true)

      const tiempoTotal = Date.now() - tiempoInicio
      const duracionSesion = Math.round(tiempoTotal / 60000) // en minutos

      // Convertir ejercicios al formato esperado por la IA
      const ejerciciosIA = ejercicios.map(ej => ({
        id: ej.id,
        question: ej.enunciado,
        answer: ej.respuestaCorrecta,
        explanation: ej.explicacion,
        hints: [],
        difficulty: ej.dificultad,
        topic: ej.tema,
        grade: ej.grado
      }))

      const datosPractica = {
        alumnoId: user?.id || '',
        grado: configuracion.grado,
        tema: configuracion.tema,
        ejercicios: ejerciciosIA,
        respuestas: intentos,
        tiempoTotal: Math.round(tiempoTotal / 1000), // en segundos
        duracionSesion: duracionSesion
      }

      console.log('🤖 PracticaIA - Generando reporte con IA:', datosPractica)

      // Usar el frontend para generar el reporte (funciona mejor que el backend)
      const reporteIA = await generateReport(datosPractica)
      
      console.log('🤖 PracticaIA - Reporte generado por IA:', reporteIA)

      // Usar directamente el formato de la IA (reporteDetallado y consejos como texto plano)
      const reporte = {
        reporteDetallado: reporteIA?.reporteDetallado || 'Reporte no disponible',
        consejos: reporteIA?.consejos || 'Consejos no disponibles'
      }

      // Guardar reporte en la base de datos a través del backend
      try {
        console.log('💾 PracticaIA - Guardando reporte en base de datos...')
        
        const reporteParaBD = {
          alumnoId: user?.id || '',
          grado: configuracion.grado,
          tema: configuracion.tema,
          totalPreguntas: ejercicios.length,
          respuestasCorrectas: intentos.filter(i => i.esCorrecta).length,
          respuestasIncorrectas: intentos.filter(i => !i.esCorrecta).length,
          puntuacion: Math.round((intentos.filter(i => i.esCorrecta).length / ejercicios.length) * 100),
          tiempoTotal: Math.round(tiempoTotal / 1000),
          duracionSesion: duracionSesion,
          reporte: reporte.reporteDetallado,
          consejos: reporte.consejos,
          tipoPractica: 'ia_libre' // Práctica libre con IA
        }

        console.log('💾 PracticaIA - Datos para BD:', reporteParaBD)
        console.log('💾 PracticaIA - Token presente:', !!localStorage.getItem('token'))

        // Usar el nuevo método del servicio de API
        console.log('🌐 PracticaIA - Enviando reporte usando apiService.rendimientoReporte')
        
        const resultadoBD = await apiService.rendimientoReporte(reporteParaBD)
        console.log('✅ PracticaIA - Reporte guardado exitosamente en BD:', resultadoBD)
        console.log('✅ PracticaIA - ID del reporte guardado:', resultadoBD?.reporteId)
        
      } catch (errorBD) {
        console.error('Error guardando reporte en BD:', errorBD)
        // No fallar si no se puede guardar en BD, solo mostrar el reporte
      }

      setReporteGenerado(reporte)
      setPracticaCompletada(true)

    } catch (error) {
      console.error('Error generando reporte:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      console.error('Error details:', errorMessage)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available')
      setMensaje({ tipo: 'error', texto: `Error generando reporte de rendimiento: ${errorMessage}` })
      setPracticaCompletada(true) // Mostrar pantalla de finalización aunque falle el reporte
    } finally {
      setGenerandoReporte(false)
    }
  }

  const reiniciarPractica = () => {
    setEjercicios([])
    setEjercicioActual(null)
    setIndiceActual(0)
    setRespuesta('')
    setIntentos([])
    setPistasUsadas(0)
    setPistaActual('')
    setMostrarPista(false)
    setEjercicioCompletado(false)
    setEjercicioFallido(false)
    setMostrarExplicacion(false)
    setPracticaCompletada(false)
    setMostrarConfiguracion(true)
    setIntentosEjercicio(0) // Resetear contador de intentos
  }

  const getEstadisticas = () => {
    const totalEjercicios = ejercicios.length
    const ejerciciosCorrectos = intentos.filter(i => i.esCorrecta).length
    const totalPistas = intentos.reduce((sum, i) => sum + i.pistasUsadas, 0)
    const tiempoTotal = intentos.reduce((sum, i) => sum + i.tiempoResolucion, 0)

    return {
      totalEjercicios,
      ejerciciosCorrectos,
      porcentajeCorrecto: totalEjercicios > 0 ? (ejerciciosCorrectos / totalEjercicios) * 100 : 0,
      totalPistas,
      tiempoTotal: Math.round(tiempoTotal / 1000) // en segundos
    }
  }

  if (mostrarConfiguracion) {
    return (
      <div className="space-y-6">
        <Card title="Configurar Práctica con IA">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <IconComponent name="TargetIcon" className="w-6 h-6" />
                Práctica Personalizada
              </h2>
              <p className="text-white/70">Configura tus ejercicios y comienza a practicar</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Grado */}
              <div>
                <label className="block text-white font-semibold mb-2">Grado</label>
                <div className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  <span className="font-medium">{configuracion.grado}° Grado</span>
                  <span className="text-white/60 text-sm">(Automático)</span>
                </div>
              </div>

              {/* Tema */}
              <div>
                <label className="block text-white font-semibold mb-2">Tema</label>
                <select
                  value={configuracion.tema}
                  onChange={(e) => setConfiguracion({ ...configuracion, tema: e.target.value })}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
                >
                  {temas.map(tema => (
                    <option key={tema} value={tema} className="text-gray-800">
                      {tema}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-white font-semibold mb-2">Cantidad de Ejercicios</label>
                <select
                  value={configuracion.cantidad}
                  onChange={(e) => setConfiguracion({ ...configuracion, cantidad: parseInt(e.target.value) })}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
                >
                  {[3, 5, 10, 15, 20].map(cant => (
                    <option key={cant} value={cant} className="text-gray-800">
                      {cant} ejercicios
                    </option>
                  ))}
                </select>
              </div>

              {/* Dificultad */}
              <div>
                <label className="block text-white font-semibold mb-2">Dificultad</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {dificultades.map(diff => (
                    <button
                      key={diff.value}
                      onClick={() => setConfiguracion({ ...configuracion, dificultad: diff.value as any })}
                      className={`p-3 rounded-lg border-2 transition-all ${configuracion.dificultad === diff.value
                          ? `border-white bg-gradient-to-r ${diff.color}`
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}
                    >
                      <div className="text-center">
                        <div className="mb-1 flex justify-center">
                          <IconComponent name={diff.icon} className="w-8 h-8" />
                        </div>
                        <div className="text-sm font-medium text-white">{diff.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={iniciarPractica}
                disabled={generando}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generando ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Generando ejercicios...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Rocket className="w-4 h-4" />
                    Iniciar Práctica
                  </div>
                )}
              </button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (practicaCompletada) {
    const stats = getEstadisticas()

    return (
      <div className="space-y-6">
        <Card title="¡Práctica Completada!">
          <div className="space-y-6">
            {generandoReporte ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                <h2 className="text-2xl font-bold text-white mb-2">Generando Reporte de Rendimiento</h2>
                <p className="text-white/70">La IA está analizando tu desempeño...</p>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <div className="mb-6">
                    <IconComponent name="TrophyIcon" className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-1">¡Excelente trabajo!</h2>
                  <p className="text-white/70 text-sm">Has completado todos los ejercicios</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-6">
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-lg p-3 text-center hover:border-blue-400/50 transition-colors">
                    <div className="text-xl font-bold text-white">{stats.totalEjercicios}</div>
                    <div className="text-blue-200 text-xs font-medium">Ejercicios</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-lg p-3 text-center hover:border-green-400/50 transition-colors">
                    <div className="text-xl font-bold text-white">{stats.ejerciciosCorrectos}</div>
                    <div className="text-green-200 text-xs font-medium">Correctos</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-lg p-3 text-center hover:border-purple-400/50 transition-colors">
                    <div className="text-xl font-bold text-white">{stats.porcentajeCorrecto.toFixed(0)}%</div>
                    <div className="text-purple-200 text-xs font-medium">Precisión</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-lg p-3 text-center hover:border-orange-400/50 transition-colors">
                    <div className="text-xl font-bold text-white">{stats.tiempoTotal}s</div>
                    <div className="text-orange-200 text-xs font-medium">Tiempo</div>
                  </div>
                </div>

                {/* Reporte de IA */}
                {reporteGenerado && (
                  <div>
                    {/* Header del Análisis */}
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full backdrop-blur-sm">
                        <IconComponent name="RobotIcon" className="w-6 h-6 text-purple-400" />
                        <div>
                          <h3 className="text-xl font-bold text-white">Análisis Inteligente</h3>
                          <p className="text-purple-300 text-sm">Tu rendimiento analizado por IA avanzada</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Contenedor principal responsive */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Reporte Detallado */}
                      {reporteGenerado.reporteDetallado && (
                        <div className="group">
                          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <IconComponent name="ChartBarIcon" className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="text-white font-semibold text-lg">Análisis de Rendimiento</h4>
                                <p className="text-slate-400 text-sm">Evaluación detallada de tu práctica</p>
                              </div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                              <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-slate-800/20 hover:scrollbar-thumb-purple-400/70 scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
                                <p className="text-slate-200 leading-relaxed whitespace-pre-line text-sm pr-2">
                                  {reporteGenerado.reporteDetallado}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Consejos y Recomendaciones */}
                      {reporteGenerado.consejos && (
                        <div className="group">
                          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <IconComponent name="LightBulbIcon" className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="text-white font-semibold text-lg">Consejos Personalizados</h4>
                                <p className="text-slate-400 text-sm">Recomendaciones para mejorar</p>
                              </div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                              <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-green-500/50 scrollbar-track-slate-800/20 hover:scrollbar-thumb-green-400/70 scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
                                <p className="text-slate-200 leading-relaxed whitespace-pre-line text-sm pr-2">
                                  {reporteGenerado.consejos}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Mensaje motivacional adaptativo */}
                    <div className="mt-6">
                      <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/20 rounded-xl p-4 backdrop-blur-sm">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
                              <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-blue-300 font-medium">¡Genial!</span>
                          </div>
                          <span className="text-blue-200 text-center sm:text-left">
                            Los próximos ejercicios se adaptarán automáticamente a tu nivel de rendimiento
                          </span>
                          <div className="hidden sm:flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{animationDelay: '0s'}}></div>
                            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-center space-x-4">
                  <button
                    onClick={reiniciarPractica}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Nueva Práctica
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    )
  }

  if (!ejercicioActual) {
    return (
      <Card title="Error">
        <div className="text-center py-12">
          <Frown className="w-16 h-16 mx-auto mb-4 text-white/70" />
          <h3 className="text-xl font-bold text-white mb-2">No se pudo cargar el ejercicio</h3>
          <button
            onClick={reiniciarPractica}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            Volver a configurar
          </button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con progreso */}
      <Card title="Practicando">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {configuracion.tema} - {configuracion.grado}° Grado
              </h2>
              <p className="text-white/70 text-sm sm:text-base">
                Ejercicio {indiceActual + 1} de {ejercicios.length}
              </p>
              <p className="text-yellow-400 text-sm font-medium">
                Intentos: {intentosEjercicio}/{maxIntentos}
              </p>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-2xl font-bold text-white">
                {dificultades.find(d => d.value === ejercicioActual.dificultad)?.icon}
              </div>
              <div className="text-white/70 text-sm">
                {dificultades.find(d => d.value === ejercicioActual.dificultad)?.label}
              </div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((indiceActual + 1) / ejercicios.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </Card>

      {/* Ejercicio actual */}
      <Card title="Ejercicio">
        <div className="space-y-6">
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Enunciado:</h3>
            <p className="text-white/90 text-lg leading-relaxed">
              {ejercicioActual.enunciado}
            </p>
          </div>

          {/* Pista */}
          {mostrarPista && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <IconComponent name="LightBulbIcon" className="w-6 h-6" />
                <div>
                  <h4 className="font-semibold text-yellow-200 mb-1">Pista:</h4>
                  <p className="text-yellow-100">{pistaActual}</p>
                </div>
              </div>
            </div>
          )}

          {/* Respuesta */}
          <div>
            <label className="block text-white font-semibold mb-2">Tu respuesta:</label>
            <input
              type="text"
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              placeholder="Ingresa tu respuesta aquí..."
              className="w-full p-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={ejercicioCompletado || ejercicioFallido}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={validarRespuesta}
              disabled={validando || !respuesta.trim() || ejercicioCompletado || ejercicioFallido}
              className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {validando ? 'Validando...' : <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Validar Respuesta</div>}
            </button>

            <button
              onClick={solicitarPista}
              disabled={mostrarPista || ejercicioCompletado || ejercicioFallido}
              className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              <IconComponent name="LightBulbIcon" className="w-4 h-4" />
              Solicitar Pista ({pistasUsadas})
            </button>
          </div>

          {/* Explicación */}
          {mostrarExplicacion && (
            <div className={`${ejercicioCompletado ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'} border rounded-lg p-4`}>
              <div className="flex items-start gap-3">
                {ejercicioCompletado ? (
                  <IconComponent name="CheckCircleIcon" className="w-8 h-8 text-green-500" />
                ) : (
                  <IconComponent name="XCircleIcon" className="w-8 h-8 text-red-500" />
                )}
                <div>
                  <h4 className={`font-semibold mb-1 ${ejercicioCompletado ? 'text-green-200' : 'text-red-200'}`}>
                    {ejercicioCompletado ? '¡Correcto! Explicación:' : 'Ejercicio fallido - Explicación:'}
                  </h4>
                  <p className={ejercicioCompletado ? 'text-green-100' : 'text-red-100'}>
                    {ejercicioActual.explicacion}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botón siguiente */}
          {(ejercicioCompletado || ejercicioFallido) && (
            <div className="text-center">
              <button
                onClick={siguienteEjercicio}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                {indiceActual < ejercicios.length - 1 ? 'Siguiente Ejercicio →' : (
                  <span className="flex items-center gap-2">
                    Finalizar Práctica
                    <IconComponent name="TrophyIcon" className="w-5 h-5" />
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Sistema de mensajes */}
      {mensaje && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${mensaje.tipo === 'success' ? 'bg-green-500/90 text-white' :
            mensaje.tipo === 'error' ? 'bg-red-500/90 text-white' :
              'bg-blue-500/90 text-white'
          }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{mensaje.texto}</span>
            <button
              onClick={() => setMensaje(null)}
              className="ml-3 text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

