import { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import Card from '../common/Card'

interface DocenteAsociado {
  id: string
  nombre: string
  correo: string
  especialidad: string
  estado: 'activo' | 'inactivo'
}

export default function MisDocentes() {
  const [docentes, setDocentes] = useState<DocenteAsociado[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'activos' | 'inactivos'>('todos')
  const [busqueda, setBusqueda] = useState('')
  
  // Estados para buscar docentes
  const [mostrarBuscar, setMostrarBuscar] = useState(false)
  const [docentesDisponibles, setDocentesDisponibles] = useState<any[]>([])
  const [busquedaDocente, setBusquedaDocente] = useState('')
  const [enviando, setEnviando] = useState<string | null>(null)
  const [loadingDocentes, setLoadingDocentes] = useState(false)

  useEffect(() => {
    cargarDocentes()
  }, [])

  const cargarDocentes = async () => {
    try {
      setLoading(true)
      const perfil = await apiService.getMe()
      
      if (perfil.docenteAsignado) {
        // Si tiene docente asignado, mostrar solo ese
        const docenteAsociado: DocenteAsociado = {
          id: perfil.docenteAsignado._id,
          nombre: perfil.docenteAsignado.nombre,
          correo: perfil.docenteAsignado.correo,
          especialidad: perfil.docenteAsignado.especialidad || 'Sin especialidad',
          estado: 'activo'
        }
        setDocentes([docenteAsociado])
      } else {
        // Si no tiene docente asignado, mostrar mensaje
        setDocentes([])
      }
    } catch (error) {
      console.error('Error cargando docentes:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarDocentesDisponibles = async () => {
    try {
      setLoadingDocentes(true)
      const data = await apiService.getDocentes()
      setDocentesDisponibles(data)
    } catch (error) {
      console.error('Error cargando docentes disponibles:', error)
    } finally {
      setLoadingDocentes(false)
    }
  }

  const enviarSolicitud = async (docenteId: string) => {
    try {
      setEnviando(docenteId)
      await apiService.enviarSolicitud(docenteId)
      alert('Solicitud enviada correctamente')
      // Recargar docentes para actualizar la lista
      cargarDocentes()
    } catch (error: any) {
      alert(error.message || 'Error al enviar solicitud')
    } finally {
      setEnviando(null)
    }
  }

  const docentesFiltradosDisponibles = docentesDisponibles.filter(docente => 
    !busquedaDocente.trim() || 
    docente.nombre.toLowerCase().includes(busquedaDocente.toLowerCase()) ||
    docente.correo.toLowerCase().includes(busquedaDocente.toLowerCase()) ||
    docente.especialidad?.toLowerCase().includes(busquedaDocente.toLowerCase())
  )

  const docentesFiltrados = docentes.filter(docente => {
    const cumpleFiltro = filtro === 'todos' || 
      (filtro === 'activos' && docente.estado === 'activo') ||
      (filtro === 'inactivos' && docente.estado === 'inactivo')
    const cumpleBusqueda = !busqueda.trim() || 
      docente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      docente.especialidad.toLowerCase().includes(busqueda.toLowerCase())
    return cumpleFiltro && cumpleBusqueda
  })

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'inactivo':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    }
  }


  if (loading) {
    return (
      <Card title="Mis Docentes">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white/70 mt-4">Cargando docentes...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="animated-gradient">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Mis Docentes 👨‍🏫
            </h1>
            <p className="text-white/70">
              Docentes asociados y su información de contacto
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{docentes.length}</p>
              <p className="text-white/60 text-sm">Docentes Asociados</p>
            </div>
            <button
              onClick={() => {
                setMostrarBuscar(!mostrarBuscar)
                if (!mostrarBuscar) {
                  cargarDocentesDisponibles()
                }
              }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-400 hover:to-purple-500 transition-all flex items-center gap-2 shadow-lg hover:shadow-blue-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {mostrarBuscar ? 'Ocultar Búsqueda' : 'Buscar Docente'}
            </button>
          </div>
        </div>
      </Card>

      {/* Filtros y Búsqueda */}
      <Card title="Filtros" subtitle="Busca y filtra tus docentes">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nombre o especialidad..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:border-blue-500 focus:bg-white/10 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {['todos', 'activos', 'inactivos'].map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f as any)}
                className={[
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  filtro === f
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                ].join(' ')}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Sección de Búsqueda de Docentes */}
      {mostrarBuscar && (
        <Card title="Buscar Docente" subtitle="Encuentra y envía solicitud a tu profesor">
          {/* Buscador */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre, correo o especialidad..."
                value={busquedaDocente}
                onChange={(e) => setBusquedaDocente(e.target.value)}
                className="w-full px-4 py-3 pl-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <svg 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Lista de docentes disponibles */}
          {loadingDocentes ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
              <p className="text-white/70 mt-4">Cargando docentes...</p>
            </div>
          ) : docentesFiltradosDisponibles.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-white/70">
                {busquedaDocente ? 'No se encontraron docentes con ese criterio' : 'No hay docentes disponibles'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {docentesFiltradosDisponibles.map((docente) => (
                <div
                  key={docente._id}
                  className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      {docente.nombre.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-lg mb-1 truncate">
                        {docente.nombre}
                      </h3>
                      <p className="text-white/70 text-sm mb-1 truncate">
                        {docente.correo}
                      </p>
                      {docente.especialidad && (
                        <p className="text-white/60 text-xs mb-3">
                          📚 {docente.especialidad}
                        </p>
                      )}

                      {/* Grados asignados */}
                      {docente.gradosAsignados && docente.gradosAsignados.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {docente.gradosAsignados.map((grado: string, idx: number) => (
                            <span 
                              key={idx}
                              className="px-2 py-1 rounded-md bg-white/10 text-white/80 text-xs"
                            >
                              {grado}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Botón */}
                      <button
                        onClick={() => enviarSolicitud(docente._id)}
                        disabled={enviando === docente._id}
                        className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:from-indigo-400 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {enviando === docente._id ? 'Enviando...' : 'Enviar Solicitud'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Contador */}
          {!loadingDocentes && docentesFiltradosDisponibles.length > 0 && (
            <div className="mt-6 text-center text-white/60 text-sm">
              {docentesFiltradosDisponibles.length} docente{docentesFiltradosDisponibles.length !== 1 ? 's' : ''} encontrado{docentesFiltradosDisponibles.length !== 1 ? 's' : ''}
            </div>
          )}
        </Card>
      )}

      {/* Lista de Docentes */}
      {docentesFiltrados.length === 0 ? (
        <Card title="Sin Resultados">
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-white/70">
              {busqueda ? 'No se encontraron docentes con ese criterio' : 'No tienes docentes asociados'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {docentesFiltrados.map((docente) => (
            <Card key={docente.id} className="hover:scale-[1.02] transition-all">
              <div className="space-y-4">
                {/* Header del Docente */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                        {docente.nombre.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-slate-900 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{docente.nombre}</h3>
                      <p className="text-white/70 text-sm">{docente.especialidad}</p>
                      <p className="text-white/50 text-xs">{docente.correo}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(docente.estado)}`}>
                      {docente.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                {/* Información de Contacto */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{docente.correo}</span>
                  </div>
                </div>

              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
