import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { apiService } from '../../services/api'
import Card from '../common/Card'

interface AlumnoDashboardProps {
  onNavigate?: (section: string) => void
}

export default function AlumnoDashboard({ onNavigate }: AlumnoDashboardProps) {
  const { user, login } = useAuth()
  const [perfil, setPerfil] = useState<any>(null)
  const [anuncios, setAnuncios] = useState<any[]>([])
  const [asignaciones, setAsignaciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [perfilData, anunciosData, asignacionesData] = await Promise.all([
        apiService.getMe(),
        apiService.getAnunciosAlumno().catch(() => []),
        apiService.getAsignacionesAlumno().catch(() => [])
      ])
      setPerfil(perfilData)
      setAnuncios(anunciosData.slice(0, 3)) // Últimos 3
      setAsignaciones(asignacionesData.slice(0, 3)) // Últimas 3
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
    <div className="space-y-6">
      {/* Bienvenida - Cursor.com style */}
      <Card className="animated-gradient">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
              ¡Hola, {user?.nombre?.split(' ')[0]}! 👋
            </h1>
            <p className="text-white/70 text-lg">
              Bienvenido a tu panel de estudiante
            </p>
          </div>
          <div className="text-right px-6 py-4 rounded-2xl glass-card">
            <p className="text-sm text-white/60 uppercase tracking-wide mb-1">Grado y Sección</p>
            <p className="text-3xl font-bold gradient-text">
              {perfil?.grado || 'N/A'}{perfil?.seccion ? `°${perfil.seccion}` : ''}
            </p>
          </div>
        </div>
      </Card>

      {/* Resumen - Cursor.com style cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Docente */}
        <Card hover className="cursor-pointer" onClick={() => onNavigate?.('buscar-docente')}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 blur opacity-30" />
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wide mb-1">Mi Docente</p>
              <p className="font-bold text-white text-lg leading-tight">
                {perfil?.docenteAsignado?.nombre?.split(' ')[0] || 'Sin asignar'}
              </p>
            </div>
          </div>
        </Card>

        {/* Solicitudes */}
        <Card hover className="cursor-pointer" onClick={() => onNavigate?.('mis-solicitudes')}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 blur opacity-30" />
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wide mb-1">Solicitudes</p>
              <p className="font-bold text-white text-lg leading-tight">0 Pendientes</p>
            </div>
          </div>
        </Card>

        {/* Anuncios */}
        <Card hover className="cursor-pointer" onClick={() => onNavigate?.('anuncios')}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 blur opacity-30" />
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wide mb-1">Anuncios</p>
              <p className="font-bold text-white text-lg leading-tight">{anuncios.length} Nuevos</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Nueva sección: Ejercicios y Práctica */}
      <Card title="Ejercicios y Práctica" subtitle="Mejora tus habilidades matemáticas">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Herramientas de Práctica</h3>
            <p className="text-white/70 text-sm">Accede a ejercicios generados por IA y conjuntos de tu docente</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Practicar */}
          <div 
            className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:border-purple-500/50 transition-all cursor-pointer group"
            onClick={() => onNavigate?.('practicar')}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Practicar</h3>
                <p className="text-purple-300 text-sm">Ejercicios con IA</p>
              </div>
            </div>
            <p className="text-white/70 text-sm">Genera ejercicios personalizados según tu nivel</p>
          </div>

          {/* Conjuntos Asignados */}
          <div 
            className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 hover:border-blue-500/50 transition-all cursor-pointer group"
            onClick={() => onNavigate?.('conjuntos-asignados')}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Conjuntos</h3>
                <p className="text-blue-300 text-sm">Asignados por docente</p>
              </div>
            </div>
            <p className="text-white/70 text-sm">Ejercicios preparados por tu profesor</p>
          </div>

          {/* Mi Progreso */}
          <div 
            className="p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 hover:border-green-500/50 transition-all cursor-pointer group"
            onClick={() => onNavigate?.('mi-progreso')}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Mi Progreso</h3>
                <p className="text-green-300 text-sm">Estadísticas</p>
              </div>
            </div>
            <p className="text-white/70 text-sm">Ve tu evolución y rendimiento</p>
          </div>

        </div>
      </Card>

      {/* Información del Docente - Premium style */}
      {perfil?.docenteAsignado && (
        <Card title="Mi Docente" subtitle="Información de tu profesor asignado">
          <div className="flex items-center gap-6 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] transition-all">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-2xl">
                {perfil.docenteAsignado.nombre.charAt(0)}
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 blur-xl opacity-40" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white text-xl mb-1">{perfil.docenteAsignado.nombre}</p>
              <p className="text-white/70 mb-2">{perfil.docenteAsignado.correo}</p>
              {perfil.docenteAsignado.especialidad && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30">
                  <span className="text-violet-300 text-sm font-medium">
                    {perfil.docenteAsignado.especialidad}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Anuncios Recientes - Premium style */}
      {anuncios.length > 0 && (
        <Card title="Anuncios Recientes" subtitle="Últimos mensajes de tu docente">
          <div className="space-y-4">
            {anuncios.map((anuncio, idx) => (
              <div 
                key={idx} 
                className="group p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-white text-lg group-hover:text-violet-300 transition-colors">
                    {anuncio.titulo}
                  </h3>
                  <span className="text-xs text-white/40 bg-white/[0.05] px-3 py-1 rounded-full">
                    {anuncio.fecha}
                  </span>
                </div>
                <p className="text-white/70 leading-relaxed">{anuncio.contenido}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Asignaciones Recientes - Premium style */}
      {asignaciones.length > 0 && (
        <Card title="Asignaciones Recientes" subtitle="Tests y ejercicios asignados por tu docente">
          <div className="space-y-4">
            {asignaciones.map((asignacion, idx) => {
              const diasRestantes = asignacion.fechaLimite 
                ? Math.ceil((new Date(asignacion.fechaLimite).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : null
              
              return (
                <div 
                  key={idx} 
                  className="group p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {asignacion.testId?.titulo?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg group-hover:text-violet-300 transition-colors">
                          {asignacion.testId?.titulo || 'Test sin título'}
                        </h3>
                        <p className="text-white/60 text-sm">
                          Por {asignacion.docenteId?.nombre || 'Docente'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        asignacion.estado === 'activa' ? 'bg-green-500/20 text-green-300' :
                        asignacion.estado === 'completada' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {asignacion.estado === 'activa' ? 'Pendiente' :
                         asignacion.estado === 'completada' ? 'Completada' :
                         'Vencida'}
                      </span>
                      {diasRestantes !== null && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          diasRestantes <= 0 ? 'bg-red-500/20 text-red-300' :
                          diasRestantes <= 3 ? 'bg-orange-500/20 text-orange-300' :
                          diasRestantes <= 7 ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>
                          {diasRestantes <= 0 ? 'Vencida' :
                           diasRestantes === 1 ? 'Vence mañana' :
                           `${diasRestantes} días`}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-white/60">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{asignacion.tiempoLimite} min</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>{asignacion.testId?.preguntas?.length || 0} preguntas</span>
                      </span>
                    </div>
                    
                    {asignacion.estado === 'activa' && (
                      <button 
                        onClick={() => onNavigate?.('conjuntos-asignados')}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm font-medium hover:from-purple-400 hover:to-pink-500 transition-all"
                      >
                        Iniciar Test
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          
          {asignaciones.length >= 3 && (
            <div className="pt-4 border-t border-white/10">
              <button 
                onClick={() => onNavigate?.('conjuntos-asignados')}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all"
              >
                Ver todos los ejercicios
              </button>
            </div>
          )}
        </Card>
      )}

      {/* Sin docente asignado - Premium CTA */}
      {!perfil?.docenteAsignado && (
        <Card className="border-2 border-dashed border-white/[0.15]">
          <div className="text-center py-12">
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto shadow-2xl">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 blur-2xl opacity-30" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Aún no tienes un docente asignado
            </h3>
            <p className="text-white/60 mb-8 max-w-md mx-auto leading-relaxed">
              Busca y envía una solicitud a tu profesor para comenzar tu aprendizaje
            </p>
            <button className="btn-primary">
              Buscar Docente
            </button>
          </div>
        </Card>
      )}

    </div>
  )
}

