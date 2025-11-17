import { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../common/Card'
import ResolverTest from './ResolverTest'

interface ConjuntoAsignado {
  id: string
  testId: string
  nombre: string
  descripcion: string
  categoria: string
  totalPreguntas: number
  preguntasResueltas: number
  preguntasCorrectas: number
  fechaAsignacion: string
  fechaLimite: string
  instrucciones: string
  estado: 'activa' | 'completada' | 'vencida'
  docente: string
  prioridad: 'baja' | 'media' | 'alta'
  tiempoTotal?: number
  puntuacionTotal?: number
  fechaCompletado?: string
}

const categorias = [
  { value: 'test', label: 'Test', color: 'from-blue-500 to-cyan-500', icon: 'test' },
  { value: 'algebra', label: 'Álgebra', color: 'from-blue-500 to-cyan-500', icon: '📐' },
  { value: 'geometria', label: 'Geometría', color: 'from-green-500 to-emerald-500', icon: '📏' },
  { value: 'aritmetica', label: 'Aritmética', color: 'from-purple-500 to-pink-500', icon: '🔢' },
  { value: 'trigonometria', label: 'Trigonometría', color: 'from-orange-500 to-red-500', icon: 'chart' }
]

const prioridades = [
  { value: 'baja', label: 'Baja', color: 'from-green-500 to-emerald-500', icon: '🟢' },
  { value: 'media', label: 'Media', color: 'from-yellow-500 to-orange-500', icon: '🟡' },
  { value: 'alta', label: 'Alta', color: 'from-red-500 to-pink-500', icon: '🔴' }
]

export default function ConjuntosAsignados() {
  const { user } = useAuth()
  const [conjuntos, setConjuntos] = useState<ConjuntoAsignado[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('todas')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todas')
  const [ordenarPor, setOrdenarPor] = useState<'fecha' | 'progreso' | 'prioridad'>('fecha')
  const [mostrarResolverTest, setMostrarResolverTest] = useState(false)
  const [testSeleccionado, setTestSeleccionado] = useState<{testId: string, asignacionId: string} | null>(null)

  useEffect(() => {
    cargarConjuntosAsignados()
  }, [])

  const cargarConjuntosAsignados = async () => {
    try {
      setLoading(true)
      const asignaciones = await apiService.getAsignacionesAlumno()
      
      if (!asignaciones || asignaciones.length === 0) {
        console.log('No hay asignaciones disponibles')
        setConjuntos([])
        return
      }
      
      // Cargar progreso para cada asignación
      const conjuntos = await Promise.all(
        asignaciones.map(async (asignacion: any) => {
          const testInfo = asignacion.testId
          
          if (!testInfo) {
            console.log('Asignación sin test:', asignacion._id)
            return null
          }

          const preguntas = testInfo.preguntas || []
          
          // Obtener progreso del alumno para esta asignación
          let progreso = {
            preguntasResueltas: 0,
            preguntasCorrectas: 0,
            mejorPuntuacion: 0,
            totalIntentos: 0
          }
          
          try {
            if (user?.id) {
              const progresoData = await apiService.getProgresoTest(asignacion._id, user.id)
              if (progresoData?.progreso) {
                const p = progresoData.progreso
                // Usar mejorIntento o ultimoIntento para obtener las estadísticas
                const intento = p.mejorIntento || p.ultimoIntento
                if (intento) {
                  progreso = {
                    preguntasResueltas: intento.respuestasCorrectas || 0,
                    preguntasCorrectas: intento.respuestasCorrectas || 0,
                    mejorPuntuacion: p.mejorPuntuacion || 0,
                    totalIntentos: p.totalIntentos || 0
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error cargando progreso para asignación:', asignacion._id, error)
          }
          
          // Determinar estado
          let estado: 'activa' | 'completada' | 'vencida' = 'activa'
          if (progreso.preguntasResueltas === preguntas.length && preguntas.length > 0) {
            estado = 'completada'
          } else if (asignacion.fechaLimite && new Date(asignacion.fechaLimite) < new Date()) {
            estado = 'vencida'
          }

          return {
            id: asignacion._id,
            testId: testInfo._id, // ID real del test
            nombre: testInfo.titulo || 'Test sin título',
            descripcion: testInfo.descripcion || 'Sin descripción',
            categoria: 'test',
            totalPreguntas: preguntas.length,
            preguntasResueltas: progreso.preguntasResueltas,
            preguntasCorrectas: progreso.preguntasCorrectas,
            fechaAsignacion: asignacion.creadaEn,
            fechaLimite: asignacion.fechaLimite || '',
            instrucciones: asignacion.instrucciones || 'Sin instrucciones específicas',
            estado,
            docente: asignacion.docenteId?.nombre || 'Docente',
            prioridad: 'media' as const
          }
        })
      )
      
      const conjuntosFiltrados = conjuntos.filter(Boolean) as ConjuntoAsignado[]
      setConjuntos(conjuntosFiltrados)
    } catch (error) {
      console.error('Error cargando asignaciones:', error)
      setConjuntos([])
    } finally {
      setLoading(false)
    }
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

  const getPrioridadColor = (prioridad: ConjuntoAsignado['prioridad']) => {
    const prioridadInfo = prioridades.find(p => p.value === prioridad)
    return prioridadInfo?.color || 'from-gray-500 to-slate-500'
  }

  const getPrioridadIcon = (prioridad: ConjuntoAsignado['prioridad']) => {
    const prioridadInfo = prioridades.find(p => p.value === prioridad)
    return prioridadInfo?.icon || '⚪'
  }

  const getDiasRestantes = (fechaLimite: string) => {
    const hoy = new Date()
    const limite = new Date(fechaLimite)
    const diffTime = limite.getTime() - hoy.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getProgresoPorcentaje = (conjunto: ConjuntoAsignado) => {
    return (conjunto.preguntasResueltas / conjunto.totalPreguntas) * 100
  }


  const iniciarPractica = (conjuntoId: string) => {
    // Encontrar la asignación correspondiente
    const asignacion = conjuntos.find(c => c.id === conjuntoId)
    if (asignacion) {
      setTestSeleccionado({
        testId: asignacion.testId, // ID real del test
        asignacionId: asignacion.id // ID de la asignación
      })
      setMostrarResolverTest(true)
    }
  }

  const verResultados = (conjuntoId: string) => {
    // Redirigir a la pantalla de resultados
    alert(`Viendo resultados del conjunto ${conjuntoId}`)
  }

  const conjuntosFiltrados = conjuntos.filter(conjunto => {
    const estadoMatch = filtroEstado === 'todas' || conjunto.estado === filtroEstado
    const categoriaMatch = filtroCategoria === 'todas' || conjunto.categoria === filtroCategoria
    const prioridadMatch = filtroPrioridad === 'todas' || conjunto.prioridad === filtroPrioridad
    return estadoMatch && categoriaMatch && prioridadMatch
  }).sort((a, b) => {
    switch (ordenarPor) {
      case 'fecha':
        return new Date(b.fechaAsignacion).getTime() - new Date(a.fechaAsignacion).getTime()
      case 'progreso':
        return getProgresoPorcentaje(b) - getProgresoPorcentaje(a)
      case 'prioridad':
        const prioridadOrder = { alta: 3, media: 2, baja: 1 }
        return prioridadOrder[b.prioridad] - prioridadOrder[a.prioridad]
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <Card title="Tests Asignados">
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
            onClick={() => {
              setMostrarResolverTest(false)
              setTestSeleccionado(null)
            }}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            ← Volver a Mis Ejercicios
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
          onSalir={() => {
            setMostrarResolverTest(false)
            setTestSeleccionado(null)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-sm font-medium">Total Asignados</p>
              <p className="text-white text-2xl font-bold">{conjuntos.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300 text-sm font-medium">Activas</p>
              <p className="text-white text-2xl font-bold">
                {conjuntos.filter(c => c.estado === 'activa').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-sm font-medium">Completadas</p>
              <p className="text-white text-2xl font-bold">
                {conjuntos.filter(c => c.estado === 'completada').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-300 text-sm font-medium">Vencidas</p>
              <p className="text-white text-2xl font-bold">
                {conjuntos.filter(c => c.estado === 'vencida').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y controles */}
      <Card title="Filtros y Ordenamiento">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-white/90">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            >
              <option value="todas" className="text-gray-900">Todos los estados</option>
              <option value="activa" className="text-gray-900">Activas</option>
              <option value="completada" className="text-gray-900">Completadas</option>
              <option value="vencida" className="text-gray-900">Vencidas</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-white/90">
              Categoría
            </label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            >
              <option value="todas" className="text-gray-900">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat.value} value={cat.value} className="text-gray-900">{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-white/90">
              Prioridad
            </label>
            <select
              value={filtroPrioridad}
              onChange={(e) => setFiltroPrioridad(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            >
              <option value="todas" className="text-gray-900">Todas las prioridades</option>
              {prioridades.map(pri => (
                <option key={pri.value} value={pri.value} className="text-gray-900">{pri.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-white/90">
              Ordenar por
            </label>
            <select
              value={ordenarPor}
              onChange={(e) => setOrdenarPor(e.target.value as any)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            >
              <option value="fecha" className="text-gray-900">Fecha de asignación</option>
              <option value="progreso" className="text-gray-900">Progreso</option>
              <option value="prioridad" className="text-gray-900">Prioridad</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de conjuntos */}
      <div className="space-y-4">
        {conjuntosFiltrados.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No hay tests asignados</h3>
              <p className="text-white/60">Tu docente aún no ha asignado tests de ejercicios</p>
            </div>
          </Card>
        ) : (
          conjuntosFiltrados.map(conjunto => {
            const categoriaInfo = categorias.find(cat => cat.value === conjunto.categoria)
            const diasRestantes = getDiasRestantes(conjunto.fechaLimite)
            const progresoPorcentaje = getProgresoPorcentaje(conjunto)

            return (
              <Card key={conjunto.id}>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoriaInfo?.color} flex items-center justify-center text-white font-bold text-lg`}>
                          {conjunto.nombre.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{conjunto.nombre}</h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getEstadoColor(conjunto.estado)} text-white`}>
                              {getEstadoLabel(conjunto.estado)}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getPrioridadColor(conjunto.prioridad)} text-white`}>
                              {getPrioridadIcon(conjunto.prioridad)} {conjunto.prioridad.toUpperCase()}
                            </span>
                            <span className="text-white/60 text-sm">{categoriaInfo?.label}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h4 className="text-white font-semibold mb-1">Descripción:</h4>
                          <p className="text-white/70 text-sm">{conjunto.descripcion}</p>
                        </div>

                        <div>
                          <h4 className="text-white font-semibold mb-1">Instrucciones:</h4>
                          <p className="text-white/70 text-sm bg-white/5 p-3 rounded-lg border border-white/10">
                            {conjunto.instrucciones}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-white font-semibold mb-2">Progreso:</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-white/70">Preguntas resueltas:</span>
                                <span className="text-white">
                                  {conjunto.preguntasResueltas} / {conjunto.totalPreguntas}
                                </span>
                              </div>
                              <div className="w-full bg-white/10 rounded-full h-2">
                                <div 
                                  className={`bg-gradient-to-r ${categoriaInfo?.color} h-2 rounded-full transition-all`}
                                  style={{ width: `${progresoPorcentaje}%` }}
                                ></div>
                              </div>
                              <div className="text-right text-xs text-white/60">
                                {progresoPorcentaje.toFixed(1)}% completado
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-white font-semibold mb-2">Información:</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-white/70">Docente:</span>
                                <span className="text-white">{conjunto.docente}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/70">Asignado:</span>
                                <span className="text-white">
                                  {new Date(conjunto.fechaAsignacion).toLocaleDateString('es-ES')}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/70">Fecha límite:</span>
                                <span className={`${
                                  diasRestantes < 0 ? 'text-red-400' : 
                                  diasRestantes < 3 ? 'text-orange-400' : 'text-white'
                                }`}>
                                  {new Date(conjunto.fechaLimite).toLocaleDateString('es-ES')}
                                  {diasRestantes >= 0 && ` (${diasRestantes} días)`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {conjunto.preguntasResueltas > 0 && (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-white/70">Puntuación total</div>
                              <div className="text-white font-semibold">
                                {conjunto.puntuacionTotal || conjunto.preguntasCorrectas} pts
                              </div>
                            </div>
                            <div>
                              <div className="text-white/70">Fecha completado</div>
                              <div className="text-white font-semibold">
                                {conjunto.fechaCompletado ? new Date(conjunto.fechaCompletado).toLocaleDateString('es-ES') : 'No completado'}
                              </div>
                            </div>
                          </div>
                        )}

                        {conjunto.tiempoTotal && conjunto.tiempoTotal > 0 && (
                          <div className="text-sm">
                            <div className="text-white/70">Tiempo total</div>
                            <div className="text-white font-semibold">
                              {Math.floor(conjunto.tiempoTotal / 60)}m {conjunto.tiempoTotal % 60}s
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-4">
                      {conjunto.estado === 'activa' ? (
                        <button
                          onClick={() => iniciarPractica(conjunto.id)}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold hover:from-blue-400 hover:to-cyan-500 transition-all flex items-center space-x-2 shadow-lg hover:shadow-blue-500/25"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Practicar</span>
                        </button>
                      ) : conjunto.estado === 'completada' ? (
                        <button
                          onClick={() => verResultados(conjunto.id)}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:from-green-400 hover:to-emerald-500 transition-all flex items-center space-x-2 shadow-lg hover:shadow-green-500/25"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Ver Resultados</span>
                        </button>
                      ) : (
                        <div className="px-6 py-3 rounded-xl bg-white/10 text-white/40 border border-white/10 text-center">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span>Vencida</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
