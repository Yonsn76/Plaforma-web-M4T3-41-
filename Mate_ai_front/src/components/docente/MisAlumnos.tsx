import { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import Card from '../common/Card'

export default function MisAlumnosDocente() {
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [filteredAlumnos, setFilteredAlumnos] = useState<any[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroGrado, setFiltroGrado] = useState('')
  const [loading, setLoading] = useState(true)

  // Función helper para formatear grado y sección
  const formatearGradoSeccion = (alumno: any) => {
    // Si tiene sección separada, usar esa
    if (alumno.seccion) {
      return `${alumno.grado || 'Sin grado'} • ${alumno.seccion}`
    }
    
    // Si el grado contiene '°' (datos antiguos), extraer grado y sección
    if (alumno.grado && alumno.grado.includes('°')) {
      const partes = alumno.grado.split('°')
      const grado = partes[0]
      const seccion = partes[1] || ''
      return `${grado} • ${seccion || 'Sin sección'}`
    }
    
    // Si solo tiene grado sin sección
    return `${alumno.grado || 'Sin grado'} • Sin sección`
  }
  
  // Estados para modales
  const [mostrarPerfil, setMostrarPerfil] = useState(false)
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null)
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      
      // Obtener mis alumnos asignados directamente del backend
      const alumnosAsignados = await apiService.getMisAlumnos()
      
      setAlumnos(alumnosAsignados)
      setFilteredAlumnos(alumnosAsignados)
    } catch (error) {
      console.error('Error cargando alumnos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = [...alumnos]

    if (busqueda.trim()) {
      filtered = filtered.filter(a => 
        a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.correo.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.grado?.toLowerCase().includes(busqueda.toLowerCase())
      )
    }

    if (filtroGrado) {
      filtered = filtered.filter(a => a.grado === filtroGrado)
    }

    setFilteredAlumnos(filtered)
  }, [busqueda, filtroGrado, alumnos])

  const gradosUnicos = [...new Set(alumnos.map(a => a.grado).filter(Boolean))]

  const verPerfil = (alumno: any) => {
    setAlumnoSeleccionado(alumno)
    setMostrarPerfil(true)
  }

  const removerAlumno = async (alumnoId: string) => {
    if (!confirm('¿Estás seguro de remover este alumno de tu lista?')) return

    try {
      await apiService.removerAlumno(alumnoId)
      setAlumnos(alumnos.filter(a => a._id !== alumnoId))
      alert('Alumno removido correctamente')
    } catch (error: any) {
      alert(error.message || 'Error al remover alumno')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Mis Alumnos</h2>
            <p className="text-white/70 text-sm">
              {alumnos.length} alumno(s) asignado(s) • {filteredAlumnos.length} mostrado(s)
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setMostrarEstadisticas(true)}
              className="px-4 py-2 rounded-xl bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Estadísticas
            </button>
          </div>
        </div>
      </Card>

      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Buscar alumno
            </label>
            <div className="relative">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, correo o grado..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Filtrar por grado
            </label>
            <select
              value={filtroGrado}
              onChange={(e) => setFiltroGrado(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todos los grados</option>
              {gradosUnicos.map(grado => (
                <option key={grado} value={grado}>{grado}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de alumnos - Estilo Twitter */}
      {loading ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-white/70 mt-4">Cargando alumnos...</p>
          </div>
        </Card>
      ) : filteredAlumnos.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No hay alumnos</h3>
            <p className="text-white/70">
              {busqueda || filtroGrado 
                ? 'No se encontraron alumnos con los filtros aplicados'
                : 'No tienes alumnos asignados aún'
              }
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlumnos.map((alumno) => (
            <Card key={alumno._id} className="hover:bg-white/5 transition-all duration-200">
              <div className="flex items-start space-x-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {alumno.nombre?.charAt(0) || '?'}
                  </div>
                </div>

                {/* Contenido principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-white truncate">
                        {alumno.nombre || 'Sin nombre'}
                      </h3>
                      <span className="text-white/60 text-sm">
                        @{alumno.correo?.split('@')[0] || 'usuario'}
                      </span>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => verPerfil(alumno)}
                        className="px-4 py-2 rounded-full bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-sm font-medium transition-all duration-200"
                      >
                        Ver Perfil
                      </button>
                      <button
                        onClick={() => removerAlumno(alumno._id)}
                        className="p-2 rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all duration-200"
                        title="Remover alumno"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Información del alumno */}
                  <div className="mt-2 space-y-1">
                    <p className="text-white/70 text-sm">
                      {formatearGradoSeccion(alumno)}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-white/60">
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate max-w-xs">{alumno.correo || 'Sin correo'}</span>
                      </div>
                      {alumno.telefono && (
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{alumno.telefono}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Estadísticas rápidas (opcional) */}
                  <div className="mt-3 flex items-center space-x-6 text-sm text-white/60">
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Activo</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Última actividad: Hoy</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Ver Perfil */}
      {mostrarPerfil && alumnoSeleccionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Perfil del Alumno</h3>
              <button
                onClick={() => setMostrarPerfil(false)}
                className="p-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                  {alumnoSeleccionado.nombre?.charAt(0) || '?'}
                </div>
                <h4 className="text-xl font-semibold text-white mb-2">
                  {alumnoSeleccionado.nombre || 'Sin nombre'}
                </h4>
                <p className="text-white/70">
                  {formatearGradoSeccion(alumnoSeleccionado)}
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-white/5">
                  <label className="text-sm font-medium text-white/70">Correo electrónico</label>
                  <p className="text-white">{alumnoSeleccionado.correo || 'No especificado'}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <label className="text-sm font-medium text-white/70">Teléfono</label>
                  <p className="text-white">{alumnoSeleccionado.telefono || 'No especificado'}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <label className="text-sm font-medium text-white/70">Grado</label>
                  <p className="text-white">{alumnoSeleccionado.grado || 'No especificado'}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <label className="text-sm font-medium text-white/70">Sección</label>
                  <p className="text-white">{alumnoSeleccionado.seccion || 'No especificado'}</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}


      {/* Modal Estadísticas */}
      {mostrarEstadisticas && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Estadísticas de Alumnos</h3>
              <button
                onClick={() => setMostrarEstadisticas(false)}
                className="p-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="text-2xl font-bold text-blue-300">{alumnos.length}</div>
                <div className="text-blue-200 text-sm">Total Alumnos</div>
              </div>
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="text-2xl font-bold text-green-300">{gradosUnicos.length}</div>
                <div className="text-green-200 text-sm">Grados Diferentes</div>
              </div>
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <div className="text-2xl font-bold text-purple-300">
                  {alumnos.filter(a => a.telefono).length}
                </div>
                <div className="text-purple-200 text-sm">Con Teléfono</div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-semibold text-white mb-4">Distribución por Grado</h4>
              <div className="space-y-2">
                {gradosUnicos.map(grado => {
                  const count = alumnos.filter(a => a.grado === grado).length
                  return (
                    <div key={grado} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <span className="text-white">{grado}</span>
                      <span className="text-white/70">{count} alumno(s)</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}