import { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import Card from '../common/Card'

export default function AnunciosAlumno() {
  const [anuncios, setAnuncios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'nuevos' | 'leidos'>('todos')

  useEffect(() => {
    cargarAnuncios()
  }, [])

  const cargarAnuncios = async () => {
    try {
      setLoading(true)
      const data = await apiService.getAnunciosAlumno()
      setAnuncios(data)
    } catch (error) {
      console.error('Error cargando anuncios:', error)
    } finally {
      setLoading(false)
    }
  }

  const marcarComoLeido = async (anuncioId: string) => {
    try {
      await apiService.marcarAnuncioLeido(anuncioId)
      setAnuncios(anuncios.map(a => 
        a._id === anuncioId ? { ...a, leido: true } : a
      ))
    } catch (error) {
      console.error('Error marcando como leído:', error)
    }
  }

  const anunciosFiltrados = anuncios.filter(a => {
    if (filtro === 'nuevos') return !a.leido
    if (filtro === 'leidos') return a.leido
    return true
  })

  return (
    <Card 
      title="Anuncios" 
      subtitle="Mensajes y notificaciones de tu docente"
    >
      {/* Filtros */}
      <div className="mb-6 flex gap-2">
        {['todos', 'nuevos', 'leidos'].map((f) => (
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
            {f === 'nuevos' && anuncios.filter(a => !a.leido).length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs">
                {anuncios.filter(a => !a.leido).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista de anuncios */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white/70 mt-4">Cargando anuncios...</p>
        </div>
      ) : anunciosFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-white/70">
            {filtro === 'nuevos' ? 'No tienes anuncios nuevos' : 
             filtro === 'leidos' ? 'No tienes anuncios leídos' : 
             'No tienes anuncios'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {anunciosFiltrados.map((anuncio) => (
            <div
              key={anuncio._id}
              className={[
                'p-5 rounded-xl border transition-all cursor-pointer',
                anuncio.leido 
                  ? 'bg-white/5 border-white/10' 
                  : 'bg-indigo-500/10 border-indigo-500/30'
              ].join(' ')}
              onClick={() => !anuncio.leido && marcarComoLeido(anuncio._id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white text-lg">
                      {anuncio.titulo}
                    </h3>
                    {!anuncio.leido && (
                      <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-medium">
                        Nuevo
                      </span>
                    )}
                  </div>
                  <p className="text-white/70 text-sm mb-3">
                    {anuncio.contenido}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-white/60 pt-3 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{anuncio.docente?.nombre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {new Date(anuncio.creadoEn).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {anuncio.tipo === 'grupo' && anuncio.grupo && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-white/5">
                  <span className="text-xs text-white/60">
                    Enviado al grupo: <strong className="text-white/80">{anuncio.grupo.nombre}</strong>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}






