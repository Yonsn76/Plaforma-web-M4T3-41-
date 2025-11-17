import { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import Card from '../common/Card'

export default function BuscarDocente() {
  const [docentes, setDocentes] = useState<any[]>([])
  const [filteredDocentes, setFilteredDocentes] = useState<any[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState<string | null>(null)

  useEffect(() => {
    cargarDocentes()
  }, [])

  useEffect(() => {
    if (busqueda.trim()) {
      const filtered = docentes.filter(d => 
        d.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        d.correo.toLowerCase().includes(busqueda.toLowerCase()) ||
        d.especialidad?.toLowerCase().includes(busqueda.toLowerCase())
      )
      setFilteredDocentes(filtered)
    } else {
      setFilteredDocentes(docentes)
    }
  }, [busqueda, docentes])

  const cargarDocentes = async () => {
    try {
      setLoading(true)
      const data = await apiService.getDocentes()
      setDocentes(data)
      setFilteredDocentes(data)
    } catch (error) {
      console.error('Error cargando docentes:', error)
    } finally {
      setLoading(false)
    }
  }

  const enviarSolicitud = async (docenteId: string) => {
    try {
      setEnviando(docenteId)
      await apiService.enviarSolicitud(docenteId)
      alert('Solicitud enviada correctamente')
    } catch (error: any) {
      alert(error.message || 'Error al enviar solicitud')
    } finally {
      setEnviando(null)
    }
  }

  return (
    <Card 
      title="Buscar Docente" 
      subtitle="Encuentra y envía solicitud a tu profesor"
    >
      {/* Buscador */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre, correo o especialidad..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
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

      {/* Lista de docentes */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white/70 mt-4">Cargando docentes...</p>
        </div>
      ) : filteredDocentes.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-white/70">
            {busqueda ? 'No se encontraron docentes con ese criterio' : 'No hay docentes disponibles'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocentes.map((docente) => (
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
      {!loading && filteredDocentes.length > 0 && (
        <div className="mt-6 text-center text-white/60 text-sm">
          {filteredDocentes.length} docente{filteredDocentes.length !== 1 ? 's' : ''} encontrado{filteredDocentes.length !== 1 ? 's' : ''}
        </div>
      )}
    </Card>
  )
}



