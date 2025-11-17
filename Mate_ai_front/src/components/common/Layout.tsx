import { ReactNode, useState } from 'react'
import DashboardNavbar from '../navbars/DashboardNavbar'
import Footer from '../Footer'
import FooterNavbar from '../navbars/FooterNavbar'

export type MathNavKey = 'inicio' | 'practicar' | 'conjuntos-asignados' | 'mi-progreso' | 'solicitudes' | 'mis-alumnos' | 'crear-test' | 'gestionar-tests' | 'asignar-conjuntos' | 'reportes' | 'grupos' | 'anuncios'

interface LayoutProps {
  children: ReactNode
  activeSection: string
  onNavigate: (section: string) => void
}

export default function Layout({ children, activeSection, onNavigate }: LayoutProps) {
  const [mathActive, setMathActive] = useState<MathNavKey>('inicio')

  // Mapear secciones matemáticas
  const handleMathNavigation = (key: MathNavKey) => {
    setMathActive(key)
    switch (key) {
      case 'inicio':
        onNavigate('inicio')
        break
      case 'practicar':
        onNavigate('practicar')
        break
      case 'conjuntos-asignados':
        onNavigate('conjuntos-asignados')
        break
      case 'mi-progreso':
        onNavigate('mi-progreso')
        break
      case 'mis-preguntas':
        onNavigate('mis-preguntas')
        break
      case 'crear-preguntas':
        onNavigate('crear-preguntas')
        break
      case 'gestionar-preguntas':
        onNavigate('gestionar-preguntas')
        break
      case 'asignar-conjuntos':
        onNavigate('asignar-conjuntos')
        break
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Cursor.com style artistic background */}
      <div className="fixed inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-[#0a0a0f]" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-30 animate-pulse"
             style={{ 
               background: 'radial-gradient(circle, rgba(124, 58, 237, 0.4), transparent 70%)',
               animation: 'float 20s ease-in-out infinite'
             }} />
        
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full blur-[140px] opacity-25"
             style={{ 
               background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3), transparent 70%)',
               animation: 'float-reverse 25s ease-in-out infinite'
             }} />
        
        <div className="absolute bottom-1/4 left-1/3 w-[550px] h-[550px] rounded-full blur-[130px] opacity-20"
             style={{ 
               background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3), transparent 70%)',
               animation: 'float 30s ease-in-out infinite'
             }} />

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.02]"
             style={{
               backgroundImage: `
                 linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
               `,
               backgroundSize: '50px 50px'
             }} />

        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0f]/50 to-[#0a0a0f]/80" />
      </div>

      {/* Contenido principal */}
      <div className="w-full flex flex-col min-h-screen">
        <DashboardNavbar activeSection={activeSection} onNavigate={onNavigate} />
        
        <main className="flex-1 px-4 py-6 relative z-10">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>

        {/* Footer normal */}
        <Footer />
      </div>

      {/* Navegación secundaria flotante */}
      <FooterNavbar activeSection={activeSection} onNavigate={onNavigate} />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        @keyframes float-reverse {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 30px) scale(0.9); }
          66% { transform: translate(30px, -25px) scale(1.1); }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}

