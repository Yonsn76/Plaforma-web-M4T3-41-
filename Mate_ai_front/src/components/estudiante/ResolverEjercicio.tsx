import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../common/Card'
import { apiService } from '../../services/api'

interface Ejercicio {
  id: string
  enunciado: string
  respuestaCorrecta: string
  dificultad: 'basica' | 'media' | 'avanzada'
  explicacion?: string
  pistas?: string[]
  conjuntoId?: string
}

interface Intento {
  id: string
  ejercicioId: string
  respuesta: string
  esCorrecta: boolean
  pistasUsadas: number
  fechaIntento: string
}

const dificultades = [
  { value: 'basica', label: 'Básica', color: 'from-green-500 to-emerald-500', icon: '🟢' },
  { value: 'media', label: 'Media', color: 'from-yellow-500 to-orange-500', icon: '🟡' },
  { value: 'avanzada', label: 'Avanzada', color: 'from-red-500 to-pink-500', icon: '🔴' }
]

interface ResolverEjercicioProps {
  ejercicioId?: string
  conjuntoId?: string
  onEjercicioCompletado?: () => void
  onSiguienteEjercicio?: () => void
}

export default function ResolverEjercicio({ 
  ejercicioId, 
  conjuntoId, 
  onEjercicioCompletado, 
  onSiguienteEjercicio 
}: ResolverEjercicioProps) {
  const { user } = useAuth()
  const [ejercicio, setEjercicio] = useState<Ejercicio | null>(null)
  const [respuesta, setRespuesta] = useState('')
  const [mostrarPista, setMostrarPista] = useState(false)
  const [pistaActual, setPistaActual] = useState('')
  const [pistasUsadas, setPistasUsadas] = useState(0)
  const [intentos, setIntentos] = useState<Intento[]>([])
  const [ejercicioCompletado, setEjercicioCompletado] = useState(false)
  const [mostrarExplicacion, setMostrarExplicacion] = useState(false)
  const [loading, setLoading] = useState(true)
  const [validando, setValidando] = useState(false)

  useEffect(() => {
    if (ejercicioId) {
      cargarEjercicio()
    }
  }, [ejercicioId])

  const cargarEjercicio = async () => {
    if (!ejercicioId) return
    
    try {
      setLoading(true)
      
      // Obtener ejercicio desde la API
      const preguntas = await apiService.getPreguntasConjunto(conjuntoId || '')
      const pregunta = preguntas.find(p => p._id === ejercicioId)
      
      if (!pregunta) {
        throw new Error('Ejercicio no encontrado')
      }

      const ejercicioData: Ejercicio = {
        id: pregunta._id,
        enunciado: pregunta.enunciado,
        respuestaCorrecta: pregunta.respuesta,
        dificultad: pregunta.dificultad || 'basica',
        explicacion: pregunta.explicacion,
        pistas: pregunta.pistas || [],
        conjuntoId: pregunta.conjuntoId
      }
      
      setEjercicio(ejercicioData)
    } catch (error) {
      console.error('Error cargando ejercicio:', error)
    } finally {
      setLoading(false)
    }
  }

  const solicitarPista = () => {
    if (!ejercicio || !ejercicio.pistas || pistasUsadas >= ejercicio.pistas.length) return

    const nuevaPista = ejercicio.pistas[pistasUsadas]
    setPistaActual(nuevaPista)
    setMostrarPista(true)
    setPistasUsadas(pistasUsadas + 1)
  }

  const validarRespuesta = async () => {
    if (!ejercicio || !respuesta.trim()) {
      alert('Ingresa tu respuesta antes de validar')
      return
    }

    try {
      setValidando(true)
      
      // Validar respuesta comparando con la respuesta correcta
      const esCorrecta = respuesta.trim().toLowerCase() === ejercicio.respuestaCorrecta.toLowerCase()
      
      // Registrar respuesta en la API
      await apiService.registrarRespuesta({
        preguntaId: ejercicio.id,
        respuestaAlumno: respuesta.trim(),
        esCorrecta
      })
      
      const nuevoIntento: Intento = {
        id: Date.now().toString(),
        ejercicioId: ejercicio.id,
        respuesta: respuesta.trim(),
        esCorrecta,
        pistasUsadas,
        fechaIntento: new Date().toISOString()
      }

      setIntentos([...intentos, nuevoIntento])

      if (esCorrecta) {
        setEjercicioCompletado(true)
        setMostrarExplicacion(true)
        alert('¡Correcto! 🎉')
        
        // Actualizar progreso
        if (ejercicio.conjuntoId) {
          await apiService.actualizarProgreso({
            alumnoId: user?.id || '',
            conjuntoId: ejercicio.conjuntoId,
            preguntasResueltas: 1,
            preguntasCorrectas: esCorrecta ? 1 : 0
          })
        }
        
        // Llamar callback si existe
        if (onEjercicioCompletado) {
          onEjercicioCompletado()
        }
      } else {
        alert('Incorrecto. Intenta de nuevo o solicita una pista.')
      }
    } catch (error) {
      console.error('Error validando respuesta:', error)
      alert('Error al validar la respuesta')
    } finally {
      setValidando(false)
    }
  }

  const siguienteEjercicio = () => {
    if (onSiguienteEjercicio) {
      onSiguienteEjercicio()
    } else {
      alert('Siguiente ejercicio')
    }
  }

  const finalizarPractica = () => {
    // Redirigir a la pantalla de progreso o menú principal
    alert('Práctica finalizada')
  }

  const reiniciarEjercicio = () => {
    setRespuesta('')
    setMostrarPista(false)
    setPistaActual('')
    setPistasUsadas(0)
    setEjercicioCompletado(false)
    setMostrarExplicacion(false)
    setIntentos([])
  }

  if (loading) {
    return (
      <Card title="Cargando Ejercicio">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </Card>
    )
  }

  if (!ejercicio) {
    return (
      <Card title="Error">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Error al cargar el ejercicio</h3>
          <p className="text-white/60">No se pudo cargar el ejercicio solicitado</p>
        </div>
      </Card>
    )
  }

  const dificultadInfo = dificultades.find(dif => dif.value === ejercicio.dificultad)

  return (
    <div className="space-y-6">
      {/* Header del ejercicio */}
      <Card title="Resolver Ejercicio">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                1
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Ejercicio de Práctica</h2>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${dificultadInfo?.color} text-white`}>
                    {dificultadInfo?.icon} {dificultadInfo?.label}
                  </span>
                  <span className="text-white/60 text-sm">Matemáticas</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-white/60">Pistas disponibles</div>
              <div className="text-lg font-bold text-white">
                {(ejercicio.pistas?.length || 0) - pistasUsadas} / {ejercicio.pistas?.length || 0}
              </div>
            </div>
          </div>

          {/* Barra de progreso de intentos */}
          {intentos.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Intentos realizados:</span>
                <span className="text-white">{intentos.length}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((intentos.length / 5) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Enunciado del ejercicio */}
      <Card title="Enunciado">
        <div className="space-y-4">
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <p className="text-white text-lg leading-relaxed">{ejercicio.enunciado}</p>
          </div>

          {/* Pista mostrada */}
          {mostrarPista && pistaActual && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-blue-300 font-semibold mb-1">Pista #{pistasUsadas}</h4>
                  <p className="text-white/90">{pistaActual}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Área de respuesta */}
      {!ejercicioCompletado ? (
        <Card title="Tu Respuesta">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/90">
                Escribe tu respuesta:
              </label>
              <textarea
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                placeholder="Escribe aquí tu respuesta..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={validarRespuesta}
                disabled={validando || !respuesta.trim()}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:from-green-400 hover:to-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg hover:shadow-green-500/25"
              >
                {validando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Validando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Validar Respuesta</span>
                  </>
                )}
              </button>

              <button
                onClick={solicitarPista}
                disabled={pistasUsadas >= (ejercicio.pistas?.length || 0)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold hover:from-blue-400 hover:to-cyan-500 transition-all disabled:opacity-50 flex items-center space-x-2 shadow-lg hover:shadow-blue-500/25"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Pedir Pista ({(ejercicio.pistas?.length || 0) - pistasUsadas})</span>
              </button>
            </div>
          </div>
        </Card>
      ) : (
        /* Resultado del ejercicio */
        <Card title="¡Ejercicio Completado!">
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">¡Correcto! 🎉</h3>
              <p className="text-white/70">Has resuelto el ejercicio correctamente</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="text-2xl font-bold text-white">{intentos.length}</div>
                <div className="text-white/60 text-sm">Intentos</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="text-2xl font-bold text-white">{pistasUsadas}</div>
                <div className="text-white/60 text-sm">Pistas usadas</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="text-2xl font-bold text-green-400">100%</div>
                <div className="text-white/60 text-sm">Precisión</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={siguienteEjercicio}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold hover:from-purple-400 hover:to-pink-500 transition-all flex items-center justify-center space-x-2 shadow-lg hover:shadow-purple-500/25"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span>Siguiente Ejercicio</span>
              </button>
              <button
                onClick={finalizarPractica}
                className="px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all flex items-center justify-center space-x-2 border border-white/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Finalizar</span>
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Explicación del ejercicio */}
      {mostrarExplicacion && (
        <Card title="Explicación Paso a Paso">
          <div className="space-y-4">
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="prose prose-invert max-w-none">
                <pre className="text-white/90 whitespace-pre-wrap font-sans leading-relaxed">
                  {ejercicio.explicacion || 'No hay explicación disponible para este ejercicio.'}
                </pre>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setMostrarExplicacion(false)}
                className="px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all flex items-center space-x-2 border border-white/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Cerrar Explicación</span>
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Historial de intentos */}
      {intentos.length > 0 && (
        <Card title="Historial de Intentos">
          <div className="space-y-3">
            {intentos.map((intento, index) => (
              <div key={intento.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    intento.esCorrecta 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {intento.esCorrecta ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="text-white font-medium">Intento #{index + 1}</div>
                    <div className="text-white/60 text-sm">{intento.respuesta}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    intento.esCorrecta ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {intento.esCorrecta ? 'Correcto' : 'Incorrecto'}
                  </div>
                  <div className="text-white/60 text-xs">
                    {intento.pistasUsadas} pista{intento.pistasUsadas !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}




