import { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import Card from '../common/Card'
import CrearTest from './CrearTest'

interface Test {
  _id: string
  titulo: string
  descripcion: string
  estado: 'borrador' | 'activo' | 'finalizado'
  preguntas: Array<{
    enunciado: string
    opciones: string[]
    respuestaCorrecta: string
    explicacion: string
    dificultad: 'basica' | 'media' | 'avanzada'
    tipoPregunta: string
    orden: number
    puntos: number
  }>
  estadisticas: {
    totalIntentos: number
    promedioPuntuacion: number
    tiempoPromedio: number
  }
  creadoEn: string
  actualizadoEn: string
}

export default function GestionarTests() {
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'borrador' | 'activo' | 'finalizado'>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [testSeleccionado, setTestSeleccionado] = useState<Test | null>(null)
  const [mostrarDetalles, setMostrarDetalles] = useState(false)
  const [mostrarEditarTest, setMostrarEditarTest] = useState(false)
  const [testAEditar, setTestAEditar] = useState<Test | null>(null)

  useEffect(() => {
    cargarTests()
  }, [])

  const cargarTests = async () => {
    try {
      setLoading(true)
      const response = await apiService.getTestsDocente()
      setTests(response)
    } catch (error) {
      console.error('Error cargando tests:', error)
      alert('Error cargando tests')
    } finally {
      setLoading(false)
    }
  }

  const cambiarEstadoTest = async (testId: string, nuevoEstado: 'borrador' | 'activo' | 'finalizado') => {
    try {
      await apiService.actualizarTest(testId, { estado: nuevoEstado })
      setTests(tests.map(test => 
        test._id === testId ? { ...test, estado: nuevoEstado } : test
      ))
      alert(`Test ${nuevoEstado === 'activo' ? 'activado' : nuevoEstado === 'finalizado' ? 'finalizado' : 'marcado como borrador'}`)
    } catch (error) {
      console.error('Error cambiando estado:', error)
      alert('Error cambiando estado del test')
    }
  }


  const eliminarTest = async (testId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este test?')) return
    
    try {
      await apiService.eliminarTest(testId)
      setTests(tests.filter(test => test._id !== testId))
      alert('Test eliminado exitosamente')
    } catch (error) {
      console.error('Error eliminando test:', error)
      alert('Error eliminando test')
    }
  }

  const editarTest = (test: Test) => {
    setTestAEditar(test)
    setMostrarEditarTest(true)
  }

  const onTestActualizado = () => {
    setMostrarEditarTest(false)
    setTestAEditar(null)
    cargarTests() // Recargar la lista de tests
  }

  const testsFiltrados = tests.filter(test => {
    const cumpleFiltro = filtroEstado === 'todos' || test.estado === filtroEstado
    const cumpleBusqueda = test.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
                          test.descripcion.toLowerCase().includes(busqueda.toLowerCase())
    return cumpleFiltro && cumpleBusqueda
  })

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'borrador': return 'bg-yellow-500/20 text-yellow-300'
      case 'activo': return 'bg-green-500/20 text-green-300'
      case 'finalizado': return 'bg-gray-500/20 text-gray-300'
      default: return 'bg-gray-500/20 text-gray-300'
    }
  }

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'borrador': return 'Borrador'
      case 'activo': return 'Activo'
      case 'finalizado': return 'Finalizado'
      default: return estado
    }
  }

  if (loading) {
    return (
      <div className="text-white text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        Cargando tests...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="animated-gradient">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Gestionar Tests</h1>
          <p className="text-white/80">Administra todos tus tests creados</p>
        </div>
      </Card>

      {/* Filtros y búsqueda */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por título o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:border-blue-500 focus:bg-white/10 transition-all"
            />
          </div>
          <div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as any)}
              className="p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500 focus:bg-white/10 transition-all"
            >
              <option value="todos" className="bg-gray-800">Todos los estados</option>
              <option value="borrador" className="bg-gray-800">Borrador</option>
              <option value="activo" className="bg-gray-800">Activo</option>
              <option value="finalizado" className="bg-gray-800">Finalizado</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de tests */}
      <div className="grid gap-4">
        {testsFiltrados.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No hay tests</h3>
              <p className="text-white/60">Crea tu primer test para comenzar</p>
            </div>
          </Card>
        ) : (
          testsFiltrados.map((test) => (
            <Card key={test._id}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{test.titulo}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(test.estado)}`}>
                      {getEstadoLabel(test.estado)}
                    </span>
                  </div>
                  
                  {test.descripcion && (
                    <p className="text-white/70 mb-2">{test.descripcion}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm text-white/60">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{test.preguntas.length} preguntas</span>
                    </div>
                    {test.estadisticas.totalIntentos > 0 ? (
                      <>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span>{test.estadisticas.totalIntentos} intentos</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span>{test.estadisticas.promedioPuntuacion}% promedio</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>Sin intentos aún</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{new Date(test.creadoEn).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setTestSeleccionado(test)
                      setMostrarDetalles(true)
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Ver Detalles
                  </button>

                  <button
                    onClick={() => editarTest(test)}
                    className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                  </button>
                  
                  {test.estado === 'borrador' && (
                    <button
                      onClick={() => cambiarEstadoTest(test._id, 'activo')}
                      className="px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-all text-sm flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Activar
                    </button>
                  )}
                  
                  {test.estado === 'activo' && (
                    <button
                      onClick={() => cambiarEstadoTest(test._id, 'finalizado')}
                      className="px-4 py-2 rounded-lg bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 transition-all text-sm flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Finalizar
                    </button>
                  )}
                  
                  <button
                    onClick={() => eliminarTest(test._id)}
                    className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal de detalles */}
      {mostrarDetalles && testSeleccionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">{testSeleccionado.titulo}</h2>
                <button
                  onClick={() => setMostrarDetalles(false)}
                  className="text-white/60 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Información general */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl">
                    <h3 className="font-semibold text-white mb-2">Preguntas</h3>
                    <p className="text-white/70">{testSeleccionado.preguntas.length}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl">
                    <h3 className="font-semibold text-white mb-2">Estado</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(testSeleccionado.estado)}`}>
                      {getEstadoLabel(testSeleccionado.estado)}
                    </span>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl">
                    <h3 className="font-semibold text-white mb-2">Intentos</h3>
                    <p className="text-white/70">{testSeleccionado.estadisticas.totalIntentos || 0}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl">
                    <h3 className="font-semibold text-white mb-2">Promedio</h3>
                    <p className="text-white/70">{testSeleccionado.estadisticas.promedioPuntuacion || 0}%</p>
                  </div>
                </div>


                {/* Preguntas */}
                <div>
                  <h3 className="font-semibold text-white mb-4">Preguntas ({testSeleccionado.preguntas.length})</h3>
                  <div className="space-y-4">
                    {testSeleccionado.preguntas.map((pregunta, index) => (
                      <div key={index} className="bg-white/5 p-4 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-white">Pregunta {index + 1}</h4>
                          <span className="text-sm text-white/60 bg-white/10 px-2 py-1 rounded">
                            {pregunta.tipoPregunta.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-white/80 mb-3">{pregunta.enunciado}</p>
                        
                        {pregunta.opciones && pregunta.opciones.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-sm font-medium text-white/70 mb-2">Opciones:</h5>
                            <div className="grid grid-cols-2 gap-2">
                              {pregunta.opciones.map((opcion, i) => (
                                <div key={i} className="text-sm text-white/60">
                                  {String.fromCharCode(65 + i)}. {opcion}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="text-sm text-white/60">
                          <span className="font-medium">Respuesta correcta:</span> {pregunta.respuestaCorrecta}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar test */}
      {mostrarEditarTest && testAEditar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Editar Test: {testAEditar.titulo}</h2>
                <button
                  onClick={() => {
                    setMostrarEditarTest(false)
                    setTestAEditar(null)
                  }}
                  className="text-white/60 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
              <CrearTest 
                testExistente={testAEditar}
                onTestGuardado={onTestActualizado}
                modoEdicion={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}