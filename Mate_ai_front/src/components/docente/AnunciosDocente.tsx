import { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import Card from '../common/Card'
import { FileText, Clock, Hand, BarChart, ClipboardList, PartyPopper } from 'lucide-react'

export default function AnunciosDocente() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [anuncios, setAnuncios] = useState<any[]>([])
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [grupos, setGrupos] = useState<any[]>([])
  const [plantillas, setPlantillas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [destinatario, setDestinatario] = useState<'todos' | 'alumno' | 'grupo'>('todos')
  const [alumnoId, setAlumnoId] = useState('')
  const [grupoId, setGrupoId] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Plantillas state
  const [mostrarPlantillas, setMostrarPlantillas] = useState(false)
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<any>(null)
  const [mostrarFormularioPlantilla, setMostrarFormularioPlantilla] = useState(false)
  const [editandoPlantilla, setEditandoPlantilla] = useState<string | null>(null)
  
  // Form state para plantillas
  const [tituloPlantilla, setTituloPlantilla] = useState('')
  const [contenidoPlantilla, setContenidoPlantilla] = useState('')
  const [categoriaPlantilla, setCategoriaPlantilla] = useState('general')
  const [guardandoPlantilla, setGuardandoPlantilla] = useState(false)

  const categoriasPlantillas = [
    { value: 'general', label: 'General', icon: FileText },
    { value: 'recordatorio', label: 'Recordatorio', icon: Clock },
    { value: 'bienvenida', label: 'Bienvenida', icon: Hand },
    { value: 'evaluacion', label: 'Evaluación', icon: BarChart },
    { value: 'tarea', label: 'Tarea', icon: ClipboardList },
    { value: 'evento', label: 'Evento', icon: PartyPopper }
  ]

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [anunciosData, alumnosData, gruposData, plantillasData] = await Promise.all([
        apiService.getAnunciosEnviados(),
        apiService.getUsuarios({ rol: 'alumno' }),
        apiService.getGrupos().catch(() => []),
        apiService.getMisPlantillas().catch(() => [])
      ])
      setAnuncios(anunciosData)
      setAlumnos(alumnosData)
      setGrupos(gruposData)
      setPlantillas(plantillasData)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const enviarAnuncio = async () => {
    if (!titulo.trim() || !contenido.trim()) {
      alert('Título y contenido son requeridos')
      return
    }

    try {
      setEnviando(true)
      const nuevoAnuncio = await apiService.crearAnuncio({
        titulo,
        contenido,
        tipo: destinatario,
        alumnoId: destinatario === 'alumno' ? alumnoId : undefined,
        grupoId: destinatario === 'grupo' ? grupoId : undefined
      })
      
      setAnuncios([nuevoAnuncio, ...anuncios])
      
      
      // Reset form
      setTitulo('')
      setContenido('')
      setDestinatario('todos')
      setAlumnoId('')
      setGrupoId('')
      setPlantillaSeleccionada(null)
      setMostrarFormulario(false)
      
      alert('Anuncio enviado correctamente')
    } catch (error: any) {
      alert(error.message || 'Error al enviar anuncio')
    } finally {
      setEnviando(false)
    }
  }

  const eliminarAnuncio = async (anuncioId: string) => {
    if (!confirm('¿Estás seguro de eliminar este anuncio?')) return

    try {
      await apiService.eliminarAnuncio(anuncioId)
      setAnuncios(anuncios.filter(a => a._id !== anuncioId))
      alert('Anuncio eliminado')
    } catch (error: any) {
      alert(error.message || 'Error al eliminar anuncio')
    }
  }

  const usarPlantilla = (plantilla: any) => {
    setTitulo(plantilla.titulo)
    setContenido(plantilla.contenido)
    setPlantillaSeleccionada(plantilla)
    setMostrarPlantillas(false)
  }

  const limpiarFormulario = () => {
    setTitulo('')
    setContenido('')
    setDestinatario('todos')
    setAlumnoId('')
    setGrupoId('')
    setPlantillaSeleccionada(null)
    setMostrarFormulario(false)
  }

  // Funciones para gestionar plantillas
  const crearPlantilla = async () => {
    if (!tituloPlantilla.trim() || !contenidoPlantilla.trim()) {
      alert('Título y contenido son requeridos')
      return
    }

    try {
      setGuardandoPlantilla(true)
      const nuevaPlantilla = await apiService.crearPlantilla({
        titulo: tituloPlantilla,
        contenido: contenidoPlantilla,
        categoria: categoriaPlantilla
      })
      
      setPlantillas([nuevaPlantilla, ...plantillas])
      limpiarFormularioPlantilla()
      alert('Plantilla creada correctamente')
    } catch (error: any) {
      alert(error.message || 'Error al crear plantilla')
    } finally {
      setGuardandoPlantilla(false)
    }
  }

  const editarPlantilla = async () => {
    if (!editandoPlantilla || !tituloPlantilla.trim() || !contenidoPlantilla.trim()) {
      alert('Título y contenido son requeridos')
      return
    }

    try {
      setGuardandoPlantilla(true)
      const plantillaActualizada = await apiService.actualizarPlantilla(editandoPlantilla, {
        titulo: tituloPlantilla,
        contenido: contenidoPlantilla,
        categoria: categoriaPlantilla
      })
      
      setPlantillas(plantillas.map(p => p._id === editandoPlantilla ? plantillaActualizada : p))
      limpiarFormularioPlantilla()
      alert('Plantilla actualizada correctamente')
    } catch (error: any) {
      alert(error.message || 'Error al actualizar plantilla')
    } finally {
      setGuardandoPlantilla(false)
    }
  }


  const limpiarFormularioPlantilla = () => {
    setTituloPlantilla('')
    setContenidoPlantilla('')
    setCategoriaPlantilla('general')
    setEditandoPlantilla(null)
    setMostrarFormularioPlantilla(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Anuncios</h2>
            <p className="text-white/70 text-sm">Envía mensajes a tus alumnos</p>
          </div>
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:from-green-400 hover:to-emerald-500 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Anuncio
          </button>
        </div>
      </Card>

      {/* Formulario */}
      {mostrarFormulario && (
        <Card title="Crear Nuevo Anuncio">
          <div className="space-y-4">
            {/* Plantilla seleccionada */}
            {plantillaSeleccionada && (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-blue-300 font-medium">Plantilla seleccionada</p>
                      <p className="text-blue-200 text-sm">{plantillaSeleccionada.titulo}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPlantillaSeleccionada(null)}
                    className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all"
                    title="Quitar plantilla"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Botón para usar plantillas */}
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarPlantillas(!mostrarPlantillas)}
                className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {mostrarPlantillas ? 'Ocultar Plantillas' : 'Usar Plantilla'}
              </button>
              <button
                onClick={limpiarFormulario}
                className="px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Limpiar
              </button>
            </div>

            {/* Lista de plantillas */}
            {mostrarPlantillas && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium">Seleccionar Plantilla</h3>
                  <button
                    onClick={() => setMostrarFormularioPlantilla(true)}
                    className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all flex items-center justify-center"
                    title="Agregar nueva plantilla"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                
                {plantillas.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-white/70 text-sm mb-3">No tienes plantillas guardadas</p>
                    <button
                      onClick={() => setMostrarFormularioPlantilla(true)}
                      className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all text-sm"
                    >
                      Crear Primera Plantilla
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {plantillas.map((plantilla) => (
                      <div
                        key={plantilla._id}
                        className="aspect-square p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer flex flex-col items-center justify-center text-center"
                        onClick={() => usarPlantilla(plantilla)}
                      >
                        <div className="text-2xl mb-2">
                          {(() => {
                            const IconComponent = categoriasPlantillas.find(c => c.value === plantilla.categoria)?.icon || FileText
                            return <IconComponent className="w-6 h-6" />
                          })()}
                        </div>
                        <h4 className="text-white font-medium text-xs mb-1 line-clamp-2">
                          {plantilla.titulo}
                        </h4>
                        <p className="text-white/60 text-xs line-clamp-2">
                          {plantilla.contenido}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Título
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Título del anuncio"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Contenido
              </label>
              <textarea
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                placeholder="Contenido del anuncio..."
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Destinatario
              </label>
              <div className="flex gap-3 mb-3">
                {[
                  { value: 'todos', label: 'Todos los alumnos' },
                  { value: 'grupo', label: 'Un grupo' },
                  { value: 'alumno', label: 'Un alumno' }
                ].map((opcion) => (
                  <button
                    key={opcion.value}
                    type="button"
                    onClick={() => setDestinatario(opcion.value as any)}
                    className={[
                      'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      destinatario === opcion.value
                        ? 'bg-white/20 text-white'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    ].join(' ')}
                  >
                    {opcion.label}
                  </button>
                ))}
              </div>

              {destinatario === 'grupo' && (
                <select
                  value={grupoId}
                  onChange={(e) => setGrupoId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Selecciona un grupo</option>
                  {grupos.map((grupo) => (
                    <option key={grupo._id} value={grupo._id}>
                      {grupo.nombre} ({grupo.alumnos?.length || 0} alumnos)
                    </option>
                  ))}
                </select>
              )}

              {destinatario === 'alumno' && (
                <select
                  value={alumnoId}
                  onChange={(e) => setAlumnoId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Selecciona un alumno</option>
                  {alumnos.map((alumno) => (
                    <option key={alumno._id} value={alumno._id}>
                      {alumno.nombre} ({alumno.correo})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              onClick={enviarAnuncio}
              disabled={enviando}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:from-green-400 hover:to-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {enviando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Enviar Anuncio</span>
                </>
              )}
            </button>
          </div>
        </Card>
      )}

      {/* Lista de anuncios */}
      <Card>
        <h3 className="text-xl font-bold text-white mb-4">Anuncios Enviados</h3>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-white/70 mt-4">Cargando anuncios...</p>
          </div>
        ) : anuncios.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No has enviado anuncios
            </h3>
            <p className="text-white/70">
              Crea tu primer anuncio para comunicarte con tus alumnos
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {anuncios.map((anuncio) => (
              <div
                key={anuncio._id}
                className="p-5 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg mb-1">
                      {anuncio.titulo}
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed">
                      {anuncio.contenido}
                    </p>
                  </div>
                  <button
                    onClick={() => eliminarAnuncio(anuncio._id)}
                    className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all ml-4"
                    title="Eliminar anuncio"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center justify-between text-sm text-white/60">
                  <span>
                    {new Date(anuncio.fechaCreacion).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className="px-2 py-1 rounded bg-white/10 text-white/70">
                    {anuncio.tipo === 'todos' ? 'Todos' : 
                     anuncio.tipo === 'grupo' ? `Grupo: ${anuncio.grupo?.nombre}` :
                     `Alumno: ${anuncio.alumno?.nombre}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal de Plantilla */}
      {mostrarFormularioPlantilla && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-800 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  {editandoPlantilla ? "Editar Plantilla" : "Nueva Plantilla"}
                </h2>
                <button
                  onClick={limpiarFormularioPlantilla}
                  className="p-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    value={tituloPlantilla}
                    onChange={(e) => setTituloPlantilla(e.target.value)}
                    placeholder="Título de la plantilla"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Contenido
                  </label>
                  <textarea
                    value={contenidoPlantilla}
                    onChange={(e) => setContenidoPlantilla(e.target.value)}
                    placeholder="Contenido de la plantilla..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Categoría
                    </label>
                    <select
                      value={categoriaPlantilla}
                      onChange={(e) => setCategoriaPlantilla(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {categoriasPlantillas.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={editandoPlantilla ? editarPlantilla : crearPlantilla}
                    disabled={guardandoPlantilla}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-400 hover:to-pink-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {guardandoPlantilla ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{editandoPlantilla ? 'Actualizar' : 'Crear'} Plantilla</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={limpiarFormularioPlantilla}
                    className="px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}