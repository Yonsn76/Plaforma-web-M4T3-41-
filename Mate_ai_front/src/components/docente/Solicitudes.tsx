import { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import Card from '../common/Card'

export default function SolicitudesDocente() {
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState<string | null>(null)

  useEffect(() => {
    cargarSolicitudes()
  }, [])

  const cargarSolicitudes = async () => {
    try {
      setLoading(true)
      const data = await apiService.getSolicitudesRecibidas()
      setSolicitudes(data)
    } catch (error) {
      console.error('Error cargando solicitudes:', error)
    } finally {
      setLoading(false)
    }
  }

  const responderSolicitud = async (solicitudId: string, accion: 'aceptar' | 'rechazar', mensaje?: string) => {
    try {
      setProcesando(solicitudId)
      await apiService.responderSolicitud(solicitudId, accion, mensaje)
      
      // Actualizar lista
      setSolicitudes(solicitudes.map(s => 
        s._id === solicitudId 
          ? { ...s, estado: accion === 'aceptar' ? 'aceptada' : 'rechazada' }
          : s
      ))
      
      alert(`Solicitud ${accion === 'aceptar' ? 'aceptada' : 'rechazada'} correctamente`)
    } catch (error: any) {
      alert(error.message || 'Error al procesar solicitud')
    } finally {
      setProcesando(null)
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

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente')
  const procesadas = solicitudes.filter(s => s.estado !== 'pendiente')

  return (
    <div className="space-y-6">
      {/* Solicitudes Pendientes */}
      <Card 
        title="Solicitudes Pendientes" 
        subtitle={`${pendientes.length} solicitud(es) esperando tu respuesta`}
      >
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-white/70 mt-4">Cargando solicitudes...</p>
          </div>
        ) : pendientes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-white/70">No tienes solicitudes pendientes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendientes.map((solicitud) => (
              <div
                key={solicitud._id}
                className="p-5 rounded-xl bg-white/5 border border-yellow-500/30"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                      {solicitud.alumno.nombre.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">
                        {solicitud.alumno.nombre}
                      </h3>
                      <p className="text-white/70 text-sm">{solicitud.alumno.correo}</p>
                      {solicitud.alumno.grado && (
                        <p className="text-white/60 text-xs mt-1">Grado: {solicitud.alumno.grado}</p>
                      )}
                    </div>
                  </div>
                  {getEstadoBadge(solicitud.estado)}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="text-sm text-white/60">
                    Enviada: {new Date(solicitud.creadoEn).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const mensaje = prompt('Motivo del rechazo (opcional):')
                        if (mensaje !== null) {
                          responderSolicitud(solicitud._id, 'rechazar', mensaje)
                        }
                      }}
                      disabled={procesando === solicitud._id}
                      className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-sm font-medium transition-all disabled:opacity-50"
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() => responderSolicitud(solicitud._id, 'aceptar')}
                      disabled={procesando === solicitud._id}
                      className="px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 text-sm font-medium transition-all disabled:opacity-50"
                    >
                      {procesando === solicitud._id ? 'Procesando...' : 'Aceptar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Historial */}
      {procesadas.length > 0 && (
        <Card 
          title="Historial" 
          subtitle="Solicitudes procesadas"
        >
          <div className="space-y-3">
            {procesadas.map((solicitud) => (
              <div
                key={solicitud._id}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {solicitud.alumno.nombre.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{solicitud.alumno.nombre}</p>
                      <p className="text-white/60 text-sm">
                        {new Date(solicitud.creadoEn).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  {getEstadoBadge(solicitud.estado)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}







