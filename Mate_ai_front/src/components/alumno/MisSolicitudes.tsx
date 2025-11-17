import { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import Card from '../common/Card'

export default function MisSolicitudes() {
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarSolicitudes()
  }, [])

  const cargarSolicitudes = async () => {
    try {
      setLoading(true)
      const data = await apiService.getMisSolicitudes()
      setSolicitudes(data)
    } catch (error) {
      console.error('Error cargando solicitudes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const configs = {
      pendiente: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Pendiente' },
      aceptada: { bg: 'bg-green-500/20', text: 'text-green-300', label: 'Aceptada' },
      rechazada: { bg: 'bg-red-500/20', text: 'text-red-300', label: 'Rechazada' }
    }
    const config = configs[estado as keyof typeof configs] || configs.pendiente
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const cancelarSolicitud = async (solicitudId: string) => {
    if (!confirm('¿Estás seguro de cancelar esta solicitud?')) return
    
    try {
      await apiService.cancelarSolicitud(solicitudId)
      setSolicitudes(solicitudes.filter(s => s._id !== solicitudId))
      alert('Solicitud cancelada')
    } catch (error: any) {
      alert(error.message || 'Error al cancelar solicitud')
    }
  }

  return (
    <Card 
      title="Mis Solicitudes" 
      subtitle="Estado de tus solicitudes de asociación con docentes"
    >
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white/70 mt-4">Cargando solicitudes...</p>
        </div>
      ) : solicitudes.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No tienes solicitudes
          </h3>
          <p className="text-white/70">
            Busca un docente y envía tu primera solicitud
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {solicitudes.map((solicitud) => (
            <div
              key={solicitud._id}
              className="p-5 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                    {solicitud.docente.nombre.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {solicitud.docente.nombre}
                    </h3>
                    <p className="text-white/70 text-sm">
                      {solicitud.docente.correo}
                    </p>
                  </div>
                </div>
                {getEstadoBadge(solicitud.estado)}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="text-sm text-white/60">
                  Enviada: {new Date(solicitud.creadoEn).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>

                {solicitud.estado === 'pendiente' && (
                  <button
                    onClick={() => cancelarSolicitud(solicitud._id)}
                    className="px-4 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-sm font-medium transition-all"
                  >
                    Cancelar
                  </button>
                )}
              </div>

              {solicitud.estado === 'rechazada' && solicitud.mensajeRechazo && (
                <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-red-300 text-sm">
                    <strong>Motivo:</strong> {solicitud.mensajeRechazo}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}



