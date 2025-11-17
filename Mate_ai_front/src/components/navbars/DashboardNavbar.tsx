import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { apiService } from '../../services/api'
import IconComponent from '../common/IconComponent'

interface DashboardNavbarProps {
  activeSection: string
  onNavigate: (section: string) => void
}

interface Notificacion {
  _id: string
  titulo: string
  contenido: string
  docenteId?: {
    nombre: string
    especialidad?: string
  }
  remitenteId?: {
    nombre: string
    correo: string
  }
  creadoEn: string
  leidoPor?: string[]
  leido?: boolean
  tipo: 'anuncio' | 'mensaje'
}

export default function DashboardNavbar({ activeSection, onNavigate }: DashboardNavbarProps) {
  const { user, logout } = useAuth()
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false)
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [cargandoNotificaciones, setCargandoNotificaciones] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cargar notificaciones al abrir el dropdown
  const cargarNotificaciones = async () => {
    if (!user) return
    
    console.log('Cargando notificaciones para usuario:', user.rol)
    
    try {
      setCargandoNotificaciones(true)
      
      // Cargar anuncios y mensajes en paralelo
      console.log('Iniciando carga de notificaciones...')
      
      const anunciosResponse = user.rol === 'alumno' ? await apiService.getAnunciosAlumno() : []
      
      console.log('Respuesta de anuncios:', anunciosResponse)
      
      // Los anuncios pueden venir directamente como array o dentro de .data
      const anuncios = Array.isArray(anunciosResponse) ? anunciosResponse : (anunciosResponse?.data || [])
      
      console.log('Anuncios procesados:', anuncios)
      console.log('Cantidad de anuncios:', anuncios.length)
      
      // Formatear notificaciones (solo anuncios)
      const notificacionesCombinadas: Notificacion[] = [
        // Anuncios
        ...anuncios.map((anuncio: any) => ({
          _id: anuncio._id,
          titulo: anuncio.titulo,
          contenido: anuncio.contenido,
          docenteId: anuncio.docenteId,
          creadoEn: anuncio.creadoEn,
          leidoPor: anuncio.leidoPor,
          tipo: 'anuncio' as const
        }))
      ]
      
      // Ordenar por fecha de creación (más recientes primero)
      notificacionesCombinadas.sort((a, b) => 
        new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()
      )
      
      console.log('Notificaciones combinadas:', notificacionesCombinadas)
      console.log('Total notificaciones:', notificacionesCombinadas.length)
      
      // Asegurar que siempre haya notificaciones si hay datos
      if (notificacionesCombinadas.length > 0) {
        setNotificaciones(notificacionesCombinadas.slice(0, 8))
      } else {
        console.log('No se encontraron notificaciones para mostrar')
        setNotificaciones([])
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
    } finally {
      setCargandoNotificaciones(false)
    }
  }

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMostrarNotificaciones(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Cargar notificaciones cuando se abre el dropdown
  useEffect(() => {
    if (mostrarNotificaciones) {
      cargarNotificaciones()
    }
  }, [mostrarNotificaciones])

  // Secciones principales del navbar (solo las más importantes)
  const mainNavItems = user?.rol === 'alumno' 
    ? [
        { id: 'inicio', label: 'Inicio', icon: 'InicioIcon' },
        { id: 'practicar', label: 'Practicar', icon: 'TargetIcon' },
        { id: 'conjuntos-asignados', label: 'Mis Ejercicios', icon: 'BookOpenIcon' },
        { id: 'mi-progreso', label: 'Mi Progreso', icon: 'ChartBarIcon' }
      ]
    : [
        { id: 'inicio', label: 'Inicio', icon: 'InicioIcon' },
        { id: 'solicitudes', label: 'Solicitudes', icon: 'DocumentTextIcon' },
        { id: 'mis-alumnos', label: 'Mis Alumnos', icon: 'UsersIcon' },
        { id: 'crear-test', label: 'Crear Test', icon: 'PlusIcon' },
        { id: 'reportes', label: 'Reportes', icon: 'ChartBarIcon' }
      ]

  // Secciones secundarias (van al footer) - definidas en FooterNavbar.tsx

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          {/* Logo - Cursor.com inspired */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-lg transition-all group-hover:scale-105 group-hover:shadow-violet-500/50">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 blur opacity-30 group-hover:opacity-50 transition-all" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg tracking-tight">M4T3 41</h1>
              <p className="text-[10px] text-white/60 font-medium tracking-wide uppercase">{user?.rol === 'alumno' ? 'Estudiante' : 'Docente'}</p>
            </div>
          </div>

          {/* Nav Items - Desktop with Cursor.com style (solo elementos principales) */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 backdrop-blur-sm border border-slate-700/50">
            {mainNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={[
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 relative flex items-center gap-2',
                  activeSection === item.id
                    ? 'text-white bg-slate-700'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                ].join(' ')}
              >
                <IconComponent name={item.icon} className="w-4 h-4" />
                <span className="relative z-10">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Nav Items - Tablet (elementos principales + algunos secundarios) */}
          <div className="hidden md:flex lg:hidden items-center gap-1 bg-slate-800/50 rounded-lg p-1 backdrop-blur-sm border border-slate-700/50">
            {mainNavItems.slice(0, 3).map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={[
                  'px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 relative flex items-center gap-1',
                  activeSection === item.id
                    ? 'text-white bg-slate-700'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                ].join(' ')}
              >
                <IconComponent name={item.icon} className="w-4 h-4" />
                <span className="relative z-10 hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>

          {/* User Menu - Cursor.com style */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="w-6 h-6 rounded-md bg-slate-700 flex items-center justify-center text-white text-xs font-medium">
                {user?.nombre?.charAt(0)}
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-white leading-tight">{user?.nombre?.split(' ')[0]}</p>
                <p className="text-[10px] text-slate-400 leading-tight">{user?.correo?.split('@')[0]}</p>
              </div>
              
              {/* Dropdown de notificaciones */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
                  className="relative p-1.5 rounded-md bg-slate-700/50 border border-slate-600/50 hover:bg-slate-700 transition-all duration-200 group"
                >
                  <svg className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                            {/* Indicador de notificaciones no leídas */}
                            {notificaciones.some(n => 
                              n.tipo === 'anuncio' 
                                ? !n.leidoPor?.includes(user?.id || '')
                                : !n.leido
                            ) && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border border-white/20 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                              </div>
                            )}
                </button>

                {/* Dropdown de notificaciones */}
                {mostrarNotificaciones && (
                  <div className="absolute right-0 top-full mt-2 w-96 bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl shadow-2xl z-50">
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
                        <button
                          onClick={() => setMostrarNotificaciones(false)}
                          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                      {cargandoNotificaciones ? (
                        <div className="p-8 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto"></div>
                          <p className="text-gray-500 text-sm mt-2">Cargando notificaciones...</p>
                        </div>
                      ) : notificaciones.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay notificaciones</h3>
                          <p className="text-gray-500 text-sm">No tienes notificaciones nuevas</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {/* Anuncios */}
                          {notificaciones.filter(n => n.tipo === 'anuncio').length > 0 && (
                            <>
                                        <div className="px-4 py-2 bg-violet-50/50 border-b border-violet-200/30">
                                          <h4 className="text-xs font-semibold text-violet-700 uppercase tracking-wide flex items-center">
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                            </svg>
                                            Anuncios
                                          </h4>
                                        </div>
                              {notificaciones.filter(n => n.tipo === 'anuncio').map((notificacion) => {
                                const esLeida = notificacion.leidoPor?.includes(user?.id || '')
                                const fechaCreacion = new Date(notificacion.creadoEn)
                                const tiempoTranscurrido = Date.now() - fechaCreacion.getTime()
                                const horas = Math.floor(tiempoTranscurrido / (1000 * 60 * 60))
                                const dias = Math.floor(horas / 24)
                                
                                let tiempoTexto = ''
                                if (dias > 0) {
                                  tiempoTexto = `Hace ${dias} día${dias > 1 ? 's' : ''}`
                                } else if (horas > 0) {
                                  tiempoTexto = `Hace ${horas} hora${horas > 1 ? 's' : ''}`
                                } else {
                                  tiempoTexto = 'Hace unos minutos'
                                }

                                return (
                                  <div 
                                    key={notificacion._id} 
                                    className={`p-4 border-b border-white/10 hover:bg-violet-50/30 transition-colors cursor-pointer ${
                                      !esLeida ? 'bg-violet-50/50' : ''
                                    }`}
                                    onClick={() => {
                                      if (!esLeida) {
                                        apiService.marcarAnuncioLeido(notificacion._id)
                                      }
                                      onNavigate('anuncios')
                                      setMostrarNotificaciones(false)
                                    }}
                                  >
                                    <div className="flex items-start space-x-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        !esLeida ? 'bg-violet-500' : 'bg-gray-400'
                                      }`}>
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                          <p className={`text-sm font-medium ${
                                            !esLeida ? 'text-gray-900 font-semibold' : 'text-gray-700'
                                          }`}>
                                            {notificacion.titulo}
                                          </p>
                                          {!esLeida && (
                                            <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                                          )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                          {notificacion.contenido}
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                          <p className="text-xs text-gray-400">
                                            Por: {notificacion.docenteId?.nombre || 'Docente'}
                                          </p>
                                          <p className="text-xs text-gray-400">{tiempoTexto}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </>
                          )}

                          {/* Mensajes eliminados - no se usan */}
                        </div>
                      )}
                    </div>
                    
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={logout}
                        className="px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-600/50"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Nav Items - Mobile with improved style (solo elementos principales) */}
        <div className="md:hidden pb-2 flex gap-1 overflow-x-auto scrollbar-hide">
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={[
                'px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1',
                activeSection === item.id
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-700/50'
              ].join(' ')}
            >
              <span className="text-sm">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </nav>
  )
}

