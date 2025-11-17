import { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import Card from '../common/Card'

export default function GruposDocente() {
  const [grupos, setGrupos] = useState<any[]>([])
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mostrarEditar, setMostrarEditar] = useState(false)
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<any>(null)

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

  // Form state
  const [nombreGrupo, setNombreGrupo] = useState('')
  const [descripcionGrupo, setDescripcionGrupo] = useState('')
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<string[]>([])
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState(false)

  // Filtros y búsqueda
  const [busqueda, setBusqueda] = useState('')
  const [filtroGrado, setFiltroGrado] = useState('')
  const [alumnosFiltrados, setAlumnosFiltrados] = useState<any[]>([])

  useEffect(() => {
    cargarDatos()
  }, [])

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

    setAlumnosFiltrados(filtered)
  }, [busqueda, filtroGrado, alumnos])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [gruposData, alumnosData] = await Promise.all([
        apiService.getGrupos(),
        apiService.getUsuarios({ rol: 'alumno' })
      ])
      setGrupos(gruposData)
      setAlumnos(alumnosData)
      setAlumnosFiltrados(alumnosData)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const crearGrupo = async () => {
    if (!nombreGrupo.trim()) {
      alert('El nombre del grupo es requerido')
      return
    }

    if (alumnosSeleccionados.length === 0) {
      alert('Debes seleccionar al menos un alumno')
      return
    }

    try {
      setCreando(true)
      const nuevoGrupo = await apiService.crearGrupo({
        nombre: nombreGrupo,
        descripcion: descripcionGrupo,
        alumnos: alumnosSeleccionados
      })
      
      setGrupos([nuevoGrupo, ...grupos])
      setNombreGrupo('')
      setDescripcionGrupo('')
      setAlumnosSeleccionados([])
      setMostrarFormulario(false)
      
      alert('Grupo creado correctamente')
    } catch (error: any) {
      alert(error.message || 'Error al crear grupo')
    } finally {
      setCreando(false)
    }
  }

  const editarGrupo = (grupo: any) => {
    setGrupoSeleccionado(grupo)
    setNombreGrupo(grupo.nombre)
    setDescripcionGrupo(grupo.descripcion || '')
    setAlumnosSeleccionados(grupo.alumnos?.map((a: any) => a._id || a) || [])
    setMostrarEditar(true)
  }

  const actualizarGrupo = async () => {
    if (!grupoSeleccionado) return

    if (!nombreGrupo.trim()) {
      alert('El nombre del grupo es requerido')
      return
    }

    if (alumnosSeleccionados.length === 0) {
      alert('Debes seleccionar al menos un alumno')
      return
    }

    try {
      setEditando(true)
      const grupoActualizado = await apiService.actualizarGrupo(grupoSeleccionado._id, {
        nombre: nombreGrupo,
        descripcion: descripcionGrupo,
        alumnos: alumnosSeleccionados
      })
      
      setGrupos(grupos.map(g => 
        g._id === grupoSeleccionado._id ? grupoActualizado : g
      ))
      
      setMostrarEditar(false)
      setGrupoSeleccionado(null)
      setNombreGrupo('')
      setDescripcionGrupo('')
      setAlumnosSeleccionados([])
      
      alert('Grupo actualizado correctamente')
    } catch (error: any) {
      alert(error.message || 'Error al actualizar grupo')
    } finally {
      setEditando(false)
    }
  }

  const eliminarGrupo = async (grupoId: string) => {
    if (!confirm('¿Estás seguro de eliminar este grupo?')) return

    try {
      await apiService.eliminarGrupo(grupoId)
      setGrupos(grupos.filter(g => g._id !== grupoId))
      alert('Grupo eliminado correctamente')
    } catch (error: any) {
      alert(error.message || 'Error al eliminar grupo')
    }
  }

  const verDetallesGrupo = (grupo: any) => {
    setGrupoSeleccionado(grupo)
  }

  const toggleAlumno = (alumnoId: string) => {
    setAlumnosSeleccionados(prev => 
      prev.includes(alumnoId) 
        ? prev.filter(id => id !== alumnoId)
        : [...prev, alumnoId]
    )
  }

  const seleccionarTodos = () => {
    setAlumnosSeleccionados(alumnosFiltrados.map(a => a._id))
  }

  const deseleccionarTodos = () => {
    setAlumnosSeleccionados([])
  }

  const limpiarFormulario = () => {
    setNombreGrupo('')
    setDescripcionGrupo('')
    setAlumnosSeleccionados([])
    setMostrarFormulario(false)
    setMostrarEditar(false)
    setGrupoSeleccionado(null)
  }

  const gradosUnicos = [...new Set(alumnos.map(a => a.grado).filter(Boolean))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Gestión de Grupos</h2>
            <p className="text-white/70 text-sm">
              {grupos.length} grupo(s) creado(s) • {alumnos.length} alumno(s) disponible(s)
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setMostrarFormulario(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:from-green-400 hover:to-emerald-500 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Grupo
            </button>
          </div>
        </div>
      </Card>

      {/* Lista de Grupos */}
      <Card title="Grupos Creados" subtitle={`${grupos.length} grupo(s) activo(s)`}>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-white/70 mt-4">Cargando grupos...</p>
          </div>
        ) : grupos.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No hay grupos</h3>
            <p className="text-white/70">Crea tu primer grupo para organizar a tus alumnos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {grupos.map((grupo) => (
              <div
                key={grupo._id}
                className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg mb-2">
                      {grupo.nombre}
                    </h3>
                    {grupo.descripcion && (
                      <p className="text-white/70 text-sm mb-3 line-clamp-2">
                        {grupo.descripcion}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {grupo.alumnos?.length || 0} miembro(s)
                    </div>
                  </div>
                </div>

                {/* Avatares de alumnos */}
                <div className="flex items-center gap-2 mb-4">
                  {grupo.alumnos?.slice(0, 5).map((alumno: any, idx: number) => (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold border-2 border-slate-900"
                      title={alumno?.nombre || 'Alumno'}
                    >
                      {alumno?.nombre?.charAt(0) || '?'}
                    </div>
                  ))}
                  {grupo.alumnos?.length > 5 && (
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                      +{grupo.alumnos.length - 5}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => verDetallesGrupo(grupo)}
                    className="flex-1 px-3 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-sm font-medium transition-all"
                  >
                    Ver Detalles
                  </button>
                  <button
                    onClick={() => editarGrupo(grupo)}
                    className="px-3 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-all"
                    title="Editar grupo"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => eliminarGrupo(grupo._id)}
                    className="px-3 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all"
                    title="Eliminar grupo"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal Crear Grupo */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Crear Nuevo Grupo</h3>
              <button
                onClick={limpiarFormulario}
                className="p-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Nombre del grupo
                </label>
                <input
                  type="text"
                  value={nombreGrupo}
                  onChange={(e) => setNombreGrupo(e.target.value)}
                  placeholder="Ej: Grupo A, Matemáticas Avanzadas..."
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={descripcionGrupo}
                  onChange={(e) => setDescripcionGrupo(e.target.value)}
                  placeholder="Descripción del grupo..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Filtros para seleccionar alumnos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-white">Seleccionar Alumnos</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={seleccionarTodos}
                      className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-sm transition-all"
                    >
                      Seleccionar Todos
                    </button>
                    <button
                      onClick={deseleccionarTodos}
                      className="px-3 py-1 rounded-lg bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 text-sm transition-all"
                    >
                      Deseleccionar
                    </button>
                  </div>
                </div>

                {/* Filtros de búsqueda */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar alumno..."
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <select
                      value={filtroGrado}
                      onChange={(e) => setFiltroGrado(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Todos los grados</option>
                      {gradosUnicos.map(grado => (
                        <option key={grado} value={grado}>{grado}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Lista de alumnos */}
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {alumnosFiltrados.map((alumno) => (
                    <div
                      key={alumno._id}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        alumnosSeleccionados.includes(alumno._id)
                          ? 'bg-blue-500/20 border-blue-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                      onClick={() => toggleAlumno(alumno._id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          alumnosSeleccionados.includes(alumno._id)
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-white/30'
                        }`}>
                          {alumnosSeleccionados.includes(alumno._id) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                          {alumno.nombre?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{alumno.nombre || 'Sin nombre'}</p>
                          <p className="text-white/70 text-sm">{formatearGradoSeccion(alumno)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-sm text-white/70">
                  {alumnosSeleccionados.length} alumno(s) seleccionado(s)
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={limpiarFormulario}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={crearGrupo}
                  disabled={creando}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:from-green-400 hover:to-emerald-500 transition-all disabled:opacity-50"
                >
                  {creando ? 'Creando...' : 'Crear Grupo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Grupo */}
      {mostrarEditar && grupoSeleccionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Editar Grupo</h3>
              <button
                onClick={limpiarFormulario}
                className="p-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Nombre del grupo
                </label>
                <input
                  type="text"
                  value={nombreGrupo}
                  onChange={(e) => setNombreGrupo(e.target.value)}
                  placeholder="Ej: Grupo A, Matemáticas Avanzadas..."
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={descripcionGrupo}
                  onChange={(e) => setDescripcionGrupo(e.target.value)}
                  placeholder="Descripción del grupo..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Filtros para seleccionar alumnos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-white">Seleccionar Alumnos</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={seleccionarTodos}
                      className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-sm transition-all"
                    >
                      Seleccionar Todos
                    </button>
                    <button
                      onClick={deseleccionarTodos}
                      className="px-3 py-1 rounded-lg bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 text-sm transition-all"
                    >
                      Deseleccionar
                    </button>
                  </div>
                </div>

                {/* Filtros de búsqueda */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar alumno..."
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <select
                      value={filtroGrado}
                      onChange={(e) => setFiltroGrado(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Todos los grados</option>
                      {gradosUnicos.map(grado => (
                        <option key={grado} value={grado}>{grado}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Lista de alumnos */}
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {alumnosFiltrados.map((alumno) => (
                    <div
                      key={alumno._id}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        alumnosSeleccionados.includes(alumno._id)
                          ? 'bg-blue-500/20 border-blue-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                      onClick={() => toggleAlumno(alumno._id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          alumnosSeleccionados.includes(alumno._id)
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-white/30'
                        }`}>
                          {alumnosSeleccionados.includes(alumno._id) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                          {alumno.nombre?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{alumno.nombre || 'Sin nombre'}</p>
                          <p className="text-white/70 text-sm">{formatearGradoSeccion(alumno)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-sm text-white/70">
                  {alumnosSeleccionados.length} alumno(s) seleccionado(s)
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={limpiarFormulario}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={actualizarGrupo}
                  disabled={editando}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-400 hover:to-indigo-500 transition-all disabled:opacity-50"
                >
                  {editando ? 'Actualizando...' : 'Actualizar Grupo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Detalles del Grupo */}
      {grupoSeleccionado && !mostrarEditar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Detalles del Grupo</h3>
              <button
                onClick={() => setGrupoSeleccionado(null)}
                className="p-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">{grupoSeleccionado.nombre}</h4>
                {grupoSeleccionado.descripcion && (
                  <p className="text-white/70">{grupoSeleccionado.descripcion}</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-white font-medium">
                    {grupoSeleccionado.alumnos?.length || 0} miembro(s)
                  </span>
                </div>

                <div className="space-y-3">
                  {grupoSeleccionado.alumnos?.map((alumno: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {alumno?.nombre?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{alumno?.nombre || 'Alumno'}</p>
                        <p className="text-white/60 text-sm">{formatearGradoSeccion(alumno)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setGrupoSeleccionado(null)
                    editarGrupo(grupoSeleccionado)
                  }}
                  className="flex-1 px-4 py-2 rounded-xl bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-all"
                >
                  Editar Grupo
                </button>
                <button
                  onClick={() => eliminarGrupo(grupoSeleccionado._id)}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all"
                >
                  Eliminar Grupo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}