import { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../common/Card'
import { useAIAPI } from '../../hooks/useAIAPI'
import PracticaIA from './PracticaIA'
import ResolverTest from './ResolverTest'

interface ConjuntoAsignado {
  id: string
  testId: string
  nombre: string
  categoria: string
  totalPreguntas: number
  preguntasResueltas: number
  fechaLimite: string
  instrucciones: string
  estado: 'activa' | 'completada' | 'vencida'
}

interface ConfiguracionIA {
  grado: string
  tema: string
  cantidad: number
  dificultad: 'basica' | 'media' | 'avanzada'
}

const grados = ['1', '2', '3', '4', '5', '6']
const temas = [
  'Ecuaciones Lineales',
  'Ecuaciones Cuadráticas', 
  'Geometría Básica',
  'Área y Perímetro',
  'Fracciones',
  'Porcentajes',
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

export default function Practicar() {
  const { user } = useAuth()
  const { generateExercises, loading: aiLoading } = useAIAPI()
  const [conjuntosAsignados, setConjuntosAsignados] = useState<ConjuntoAsignado[]>([])
  const [loading, setLoading] = useState(true)
  const [modoSeleccionado, setModoSeleccionado] = useState<'ia' | 'docente'>('ia')
  const [mostrarConfiguracionIA, setMostrarConfiguracionIA] = useState(false)
  const [mostrarPracticaIA, setMostrarPracticaIA] = useState(false)
  const [mostrarResolverTest, setMostrarResolverTest] = useState(false)
  const [testSeleccionado, setTestSeleccionado] = useState<{testId: string, asignacionId: string} | null>(null)
  const [configuracionIA, setConfiguracionIA] = useState<ConfiguracionIA>({
    grado: user?.grado || '3',
    tema: 'Ecuaciones Lineales',
    cantidad: 5,
    dificultad: 'basica'
  })
  const [generandoEjercicios, setGenerandoEjercicios] = useState(false)

  useEffect(() => {
    cargarConjuntosAsignados()
  }, [])

  // Actualizar el grado cuando el usuario cambie
  useEffect(() => {
    if (user?.grado) {
      setConfiguracionIA(prev => ({
        ...prev,
        grado: user.grado
      }))
    }
  }, [user?.grado])

  const cargarConjuntosAsignados = async () => {
    try {
      setLoading(true)
      const asignaciones = await apiService.getAsignacionesAlumno()
      
      const conjuntosConEstadisticas = await Promise.all(
        asignaciones.map(async (asignacion) => {
          try {
            // Obtener información del test
            const testInfo = asignacion.testId
            
            if (!testInfo) return null

            // Obtener preguntas del test
            const preguntas = testInfo.preguntas || []
            
            // Obtener progreso del alumno para este test
            let preguntasResueltas = 0
            try {
              if (user?.id) {
                const progresoData = await apiService.getProgresoTest(asignacion._id, user.id)
                    if (progresoData?.progreso) {
                      const p = progresoData.progreso
                  const intento = p.mejorIntento || p.ultimoIntento
                  if (intento) {
                    preguntasResueltas = intento.respuestasCorrectas || 0
                  }
                }
              }
            } catch (error) {
              console.log('Error cargando progreso:', error)
            }
            
            let estado: 'activa' | 'completada' | 'vencida' = 'activa'
            if (preguntasResueltas === preguntas.length && preguntas.length > 0) {
              estado = 'completada'
            } else if (asignacion.fechaLimite && new Date(asignacion.fechaLimite) < new Date()) {
              estado = 'vencida'
            }

            return {
              id: asignacion._id,
              testId: testInfo._id, // ID real del test
              nombre: testInfo.titulo || 'Test sin título',
              categoria: 'test', // Los tests no tienen categoría específica
              totalPreguntas: preguntas.length,
              preguntasResueltas,
              fechaLimite: asignacion.fechaLimite || '',
              instrucciones: asignacion.instrucciones || 'Sin instrucciones específicas',
              estado
            }
          } catch (error) {
            console.error(`Error cargando test ${asignacion.testId}:`, error)
            return null
          }
        })
      )
      
      setConjuntosAsignados(conjuntosConEstadisticas.filter(Boolean) as ConjuntoAsignado[])
    } catch (error) {
      console.error('Error cargando asignaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const iniciarPracticaIA = () => {
    setMostrarPracticaIA(true)
  }

  const generarEjerciciosIA = async () => {
    try {
      setGenerandoEjercicios(true)
      
      const request = {
        grado: configuracionIA.grado,
        tema: configuracionIA.tema,
        dificultad: configuracionIA.dificultad,
        cantidad: configuracionIA.cantidad
      }

      console.log('Generando ejercicios con configuración:', request)
      const response = await generateExercises(request)
      
      console.log('Respuesta completa:', response)
      
      if (response && response.data && response.data.ejercicios) {
        alert(`Se generaron ${response.data.ejercicios.length} ejercicios de ${configuracionIA.tema} para ${configuracionIA.grado}° grado`)
        setMostrarConfiguracionIA(false)
        // Aquí podrías redirigir a la pantalla de resolución de ejercicios
        // o guardar los ejercicios en el estado para mostrarlos
      } else {
        throw new Error('No se pudieron generar los ejercicios')
      }
    } catch (error) {
      console.error('Error generando ejercicios:', error)
      alert(`Error al generar ejercicios: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setGenerandoEjercicios(false)
    }
  }

  const iniciarPracticaDocente = (conjuntoId: string) => {
    // Encontrar la asignación correspondiente
    const asignacion = conjuntosAsignados.find(c => c.id === conjuntoId)
    if (asignacion) {
      setTestSeleccionado({
        testId: asignacion.testId, // ID real del test
        asignacionId: asignacion.id // ID de la asignación
      })
      setMostrarResolverTest(true)
    }
  }

  const volverAlMenu = () => {
    setMostrarPracticaIA(false)
    setMostrarConfiguracionIA(false)
    setMostrarResolverTest(false)
    setTestSeleccionado(null)
  }

  const getEstadoColor = (estado: ConjuntoAsignado['estado']) => {
    switch (estado) {
      case 'activa': return 'from-green-500 to-emerald-500'
      case 'completada': return 'from-blue-500 to-cyan-500'
      case 'vencida': return 'from-red-500 to-pink-500'
      default: return 'from-gray-500 to-slate-500'
    }
  }

  const getEstadoLabel = (estado: ConjuntoAsignado['estado']) => {
    switch (estado) {
      case 'activa': return 'Activa'
      case 'completada': return 'Completada'
      case 'vencida': return 'Vencida'
      default: return 'Desconocido'
    }
  }

  const getProgresoPorcentaje = (conjunto: ConjuntoAsignado) => {
    return (conjunto.preguntasResueltas / conjunto.totalPreguntas) * 100
  }

  if (loading) {
    return (
      <Card title="Practicar">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </Card>
    )
  }

  if (mostrarPracticaIA) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={volverAlMenu}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            ← Volver al menú
          </button>
          <h1 className="text-2xl font-bold text-white">Práctica con IA</h1>
        </div>
        <PracticaIA />
      </div>
    )
  }

  if (mostrarResolverTest && testSeleccionado) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={volverAlMenu}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            ← Volver al menú
          </button>
          <h1 className="text-2xl font-bold text-white">Resolver Test</h1>
        </div>
        <ResolverTest 
          testId={testSeleccionado.testId}
          asignacionId={testSeleccionado.asignacionId}
          onTestCompletado={() => {
            setMostrarResolverTest(false)
            setTestSeleccionado(null)
            cargarConjuntosAsignados() // Recargar para actualizar progreso
          }}
          onSalir={volverAlMenu}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con modo de práctica */}
      <Card title="Inicio Rápido / Practicar">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">¿Cómo quieres practicar hoy?</h2>
            <p className="text-white/70">Elige entre ejercicios generados por IA o conjuntos asignados por tu docente</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Modo IA */}
            <div className="relative">
              <div className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                modoSeleccionado === 'ia' 
                  ? 'border-purple-500 bg-purple-500/10' 
                  : 'border-white/20 bg-white/5 hover:border-white/30'
              }`}
              onClick={() => setModoSeleccionado('ia')}
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Modo IA</h3>
                  <p className="text-white/70 text-sm">
                    La IA genera ejercicios personalizados según tu grado, tema y dificultad preferida
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs">
                      Personalizado
                    </span>
                    <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs">
                      Instantáneo
                    </span>
                    <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs">
                      Adaptativo
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modo Docente */}
            <div className="relative">
              <div className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                modoSeleccionado === 'docente' 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-white/20 bg-white/5 hover:border-white/30'
              }`}
              onClick={() => setModoSeleccionado('docente')}
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Modo Docente</h3>
                  <p className="text-white/70 text-sm">
                    Practica con tests específicos que tu docente ha asignado para ti
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs">
                      Asignado
                    </span>
                    <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs">
                      Estructurado
                    </span>
                    <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs">
                      Evaluado
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de inicio */}
          <div className="text-center pt-4">
            {modoSeleccionado === 'ia' ? (
              <button
                onClick={iniciarPracticaIA}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold hover:from-purple-400 hover:to-pink-500 transition-all flex items-center space-x-2 shadow-lg hover:shadow-purple-500/25 mx-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Generar Ejercicios con IA</span>
              </button>
            ) : (
              <div className="text-white/60">
                <p>Selecciona un test de la lista de abajo para comenzar</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Configuración de IA */}
      {mostrarConfiguracionIA && (
        <Card title="Configurar Ejercicios con IA">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Personaliza tu práctica</h3>
              <p className="text-white/70 text-sm">La IA generará ejercicios adaptados a tus preferencias</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/90">
                  Grado
                </label>
                <div className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white flex items-center gap-2">
                  <span className="text-lg">🎓</span>
                  <span className="font-medium">{configuracionIA.grado}° Grado</span>
                  <span className="text-white/60 text-sm">(Automático)</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/90">
                  Tema
                </label>
                <select
                  value={configuracionIA.tema}
                  onChange={(e) => setConfiguracionIA({...configuracionIA, tema: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                >
                  {temas.map(tema => (
                    <option key={tema} value={tema} className="text-gray-900">{tema}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/90">
                  Cantidad de Ejercicios
                </label>
                <select
                  value={configuracionIA.cantidad}
                  onChange={(e) => setConfiguracionIA({...configuracionIA, cantidad: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                >
                  <option value={5} className="text-gray-900">5 ejercicios</option>
                  <option value={10} className="text-gray-900">10 ejercicios</option>
                  <option value={15} className="text-gray-900">15 ejercicios</option>
                  <option value={20} className="text-gray-900">20 ejercicios</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/90">
                  Dificultad
                </label>
                <select
                  value={configuracionIA.dificultad}
                  onChange={(e) => setConfiguracionIA({...configuracionIA, dificultad: e.target.value as ConfiguracionIA['dificultad']})}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                >
                  {dificultades.map(dif => (
                    <option key={dif.value} value={dif.value} className="text-gray-900">{dif.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
              <button
                onClick={generarEjerciciosIA}
                disabled={generandoEjercicios || aiLoading}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold hover:from-purple-400 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-purple-500/25"
              >
                {generandoEjercicios || aiLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Generando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Generar Ejercicios</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setMostrarConfiguracionIA(false)}
                className="px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all flex items-center justify-center space-x-2 border border-white/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Tests Asignados */}
      <Card title="Tests Asignados por tu Docente">
        <div className="space-y-4">
          {conjuntosAsignados.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No hay tests asignados</h3>
              <p className="text-white/60">Tu docente aún no ha asignado tests de ejercicios</p>
            </div>
          ) : (
            conjuntosAsignados.map(conjunto => (
              <div key={conjunto.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                        {conjunto.nombre.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{conjunto.nombre}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getEstadoColor(conjunto.estado)} text-white`}>
                            {getEstadoLabel(conjunto.estado)}
                          </span>
                          <span className="text-white/60 text-sm capitalize">{conjunto.categoria}</span>
                          <span className="text-white/60 text-sm">
                            {new Date(conjunto.fechaLimite).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-white font-semibold mb-1">Progreso:</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-white/70">Preguntas resueltas:</span>
                            <span className="text-white">
                              {conjunto.preguntasResueltas} / {conjunto.totalPreguntas}
                            </span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                              style={{ width: `${getProgresoPorcentaje(conjunto)}%` }}
                            ></div>
                          </div>
                          <div className="text-right text-xs text-white/60">
                            {getProgresoPorcentaje(conjunto).toFixed(1)}% completado
                          </div>
                        </div>
                      </div>

                      {conjunto.instrucciones && (
                        <div>
                          <h4 className="text-white font-semibold mb-1">Instrucciones:</h4>
                          <p className="text-white/70 text-sm">{conjunto.instrucciones}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4">
                    <button
                      onClick={() => iniciarPracticaDocente(conjunto.id)}
                      disabled={conjunto.estado === 'vencida'}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
                        conjunto.estado === 'vencida'
                          ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
                          : conjunto.estado === 'completada'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-400 hover:to-emerald-500 shadow-lg hover:shadow-green-500/25'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-400 hover:to-cyan-500 shadow-lg hover:shadow-blue-500/25'
                      }`}
                    >
                      {conjunto.estado === 'completada' ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Ver Resultados</span>
                        </>
                      ) : conjunto.estado === 'vencida' ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span>Vencida</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Practicar</span>
                        </>
                      )}
                    </button>
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
