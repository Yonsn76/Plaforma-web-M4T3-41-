import { useAuth } from '../../contexts/AuthContext'
import IconComponent from '../common/IconComponent'

interface FooterNavbarProps {
  activeSection?: string
  onNavigate?: (section: string) => void
}

export default function FooterNavbar({ activeSection, onNavigate }: FooterNavbarProps) {
  const { user } = useAuth()

  // Elementos secundarios de navegación (van al footer)
  const secondaryNavItems = user?.rol === 'alumno' 
    ? [
        { id: 'buscar-docente', label: 'Buscar Docente', icon: 'SearchIcon' },
        { id: 'mis-solicitudes', label: 'Mis Solicitudes', icon: 'ClipboardListIcon' },
        { id: 'mis-docentes', label: 'Mis Docentes', icon: 'UserGroupIcon' },
        { id: 'anuncios', label: 'Anuncios', icon: 'MegaphoneIcon' },
        { id: 'perfil', label: 'Perfil', icon: 'UserIcon' }
      ]
    : [
        { id: 'grupos', label: 'Grupos', icon: 'UsersIcon' },
        { id: 'gestionar-tests', label: 'Gestionar Tests', icon: 'DocumentTextIcon' },
        { id: 'asignar-conjuntos', label: 'Asignar Ejercicios', icon: 'BookOpenIcon' },
        { id: 'anuncios', label: 'Anuncios', icon: 'MegaphoneIcon' },
        { id: 'perfil', label: 'Perfil', icon: 'UserIcon' }
      ]

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-4xl px-4">
      <div className="backdrop-blur-2xl border border-slate-700/50 rounded-2xl shadow-2xl p-2 bg-slate-900/95 transition-all duration-300">
        <div className="flex items-center justify-center gap-1 flex-wrap">
          {secondaryNavItems.map((item) => {
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? 'text-white bg-slate-700 shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                title={item.label}
              >
                <IconComponent name={item.icon} className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
