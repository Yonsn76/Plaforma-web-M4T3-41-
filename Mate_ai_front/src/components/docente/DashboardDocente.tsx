import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { apiService } from '../../services/api'
import Card from '../common/Card'

interface DashboardDocenteProps {
  onNavigate?: (section: string) => void
}

export default function DashboardDocente({ onNavigate }: DashboardDocenteProps) {
  // onNavigate se puede usar en el futuro para navegación
  console.log('onNavigate disponible:', !!onNavigate)
  const { user } = useAuth()
  const [stats, setStats] = useState({
    alumnosTotal: 0,
    solicitudesPendientes: 0,
    gruposActivos: 0,
    anunciosEnviados: 0
  })
  const [solicitudesRecientes, setSolicitudesRecientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      
      // Obtener datos de la API
      const [alumnosAsignados, solicitudes, grupos, anuncios] = await Promise.all([
        apiService.getMisAlumnos().catch(() => []),
        apiService.getSolicitudesRecibidas().catch(() => []),
        apiService.getGrupos().catch(() => []),
        apiService.getAnunciosEnviados().catch(() => [])
      ])

      setStats({
        alumnosTotal: alumnosAsignados.length,
        solicitudesPendientes: solicitudes.filter((s: any) => s.estado === 'pendiente').length,
        gruposActivos: grupos.length,
        anunciosEnviados: anuncios.length
      })

      setSolicitudesRecientes(solicitudes.slice(0, 5))
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card title="Dashboard">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white/70 mt-4">Cargando...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Bienvenida - Cursor.com style */}
      <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white mb-1">
              Bienvenido, Prof. {user?.nombre?.split(' ')[0]}!
            </h1>
            <p className="text-white/60 text-sm mb-3">
              Panel de gestión docente
            </p>
            {user?.especialidad && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-700/50 border border-slate-600/50">
                <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-slate-300 text-xs font-medium">
                  {user.especialidad}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Estadísticas - Cursor.com style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Alumnos */}
        <Card hover className="cursor-pointer p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center">
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/60 mb-1">Alumnos</p>
              <p className="text-lg font-semibold text-white">{stats.alumnosTotal}</p>
            </div>
          </div>
        </Card>

        {/* Solicitudes */}
        <Card hover className="cursor-pointer p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center">
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/60 mb-1">Solicitudes</p>
              <p className="text-lg font-semibold text-white">{stats.solicitudesPendientes}</p>
            </div>
          </div>
        </Card>

        {/* Grupos */}
        <Card hover className="cursor-pointer p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center">
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/60 mb-1">Grupos</p>
              <p className="text-lg font-semibold text-white">{stats.gruposActivos}</p>
            </div>
          </div>
        </Card>

        {/* Anuncios */}
        <Card hover className="cursor-pointer p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center">
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/60 mb-1">Anuncios</p>
              <p className="text-lg font-semibold text-white">{stats.anunciosEnviados}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Solicitudes Recientes - Cursor style */}
      {stats.solicitudesPendientes > 0 && (
        <Card 
          title="Solicitudes Pendientes" 
          subtitle={`${stats.solicitudesPendientes} solicitud(es) esperando respuesta`}
        >
          <div className="space-y-2">
            {solicitudesRecientes
              .filter(s => s.estado === 'pendiente')
              .slice(0, 3)
              .map((solicitud, idx) => (
                <div key={idx} className="group p-3 rounded-lg bg-slate-700/30 border border-slate-600/30 hover:bg-slate-700/50 hover:border-slate-600/50 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-600/50 flex items-center justify-center text-white font-medium text-sm">
                      {solicitud.alumno.nombre.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{solicitud.alumno.nombre}</p>
                      <p className="text-white/60 text-xs truncate">{solicitud.alumno.grado}</p>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 rounded text-sm font-medium bg-slate-600/50 text-white hover:bg-slate-600/70 transition-all">
                    Ver
                  </button>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Acciones Rápidas - Cursor style */}
      <Card title="Acciones Rápidas" subtitle="Herramientas principales para gestionar tu clase">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <button className="group p-3 rounded-lg bg-slate-700/30 border border-slate-600/30 hover:bg-slate-700/50 hover:border-slate-500/50 transition-all text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-600/50 flex items-center justify-center">
                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="font-medium text-white text-sm group-hover:text-slate-300 transition-colors">Ver Alumnos</span>
            </div>
            <p className="text-xs text-white/60">Gestiona tu lista de estudiantes</p>
          </button>

          <button className="group p-3 rounded-lg bg-slate-700/30 border border-slate-600/30 hover:bg-slate-700/50 hover:border-slate-500/50 transition-all text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-600/50 flex items-center justify-center">
                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="font-medium text-white text-sm group-hover:text-slate-300 transition-colors">Crear Grupo</span>
            </div>
            <p className="text-xs text-white/60">Organiza alumnos en grupos</p>
          </button>

          <button className="group p-3 rounded-lg bg-slate-700/30 border border-slate-600/30 hover:bg-slate-700/50 hover:border-slate-500/50 transition-all text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-600/50 flex items-center justify-center">
                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <span className="font-medium text-white text-sm group-hover:text-slate-300 transition-colors">Nuevo Anuncio</span>
            </div>
            <p className="text-xs text-white/60">Envía mensaje a tus alumnos</p>
          </button>

        </div>
      </Card>

    </div>
  )
}

