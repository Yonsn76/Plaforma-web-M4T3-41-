import { useEffect, useState } from 'react'
import LoginNavbar from './components/navbars/LoginNavbar'
import HeroLogin from './components/auth/HeroLogin'
import Footer from './components/Footer'
import Layout from './components/common/Layout'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Componentes de Alumno
import AlumnoDashboard from './components/alumno/Dashboard'
import BuscarDocente from './components/alumno/BuscarDocente'
import MisSolicitudes from './components/alumno/MisSolicitudes'
import MisDocentes from './components/alumno/MisDocentes'
import AnunciosAlumno from './components/alumno/AnunciosAlumno'
import PerfilAlumno from './components/alumno/PerfilAlumno'

// Componentes de Estudiante - Ejercicios y Práctica
import Practicar from './components/estudiante/Practicar'
import ResolverEjercicio from './components/estudiante/ResolverEjercicio'
import MiProgreso from './components/estudiante/MiProgreso'
import ConjuntosAsignados from './components/estudiante/ConjuntosAsignados'
// import Mensajeria from './components/estudiante/Mensajeria' // Eliminado - no se usa

// Componentes de Docente
import DashboardDocente from './components/docente/DashboardDocente'
import SolicitudesDocente from './components/docente/Solicitudes'
import MisAlumnosDocente from './components/docente/MisAlumnos'
import GruposDocente from './components/docente/Grupos'
import AnunciosDocente from './components/docente/AnunciosDocente'
import PerfilDocente from './components/docente/PerfilDocente'

// Componentes de Docente - Tests y Gestión
import CrearTest from './components/docente/CrearTest'
import GestionarTests from './components/docente/GestionarTests'
import Reportes from './components/docente/Reportes'
import AsignarConjuntos from './components/docente/AsignarConjuntos'
// import MensajeriaDocente from './components/docente/MensajeriaDocente' // Eliminado - no se usa

export type NavKey = 'Inicio' | 'Servicios' | 'Acerca' | 'Contacto'
export type ThemeName = 'dark' | 'light' | 'pink' | 'green' | 'red' | 'sky'

function useTheme() {
  const [theme, setTheme] = useState<ThemeName>('dark')

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as ThemeName) || 'dark'
    setTheme(saved)
    document.body.classList.add(`theme-${saved}`)
  }, [])

  useEffect(() => {
    document.body.classList.forEach((cls) => {
      if (cls.startsWith('theme-')) document.body.classList.remove(cls)
    })
    document.body.classList.add(`theme-${theme}`)
    localStorage.setItem('theme', theme)
  }, [theme])

  return { theme, setTheme }
}

function AppContent() {
  const [active, setActive] = useState<NavKey>('Inicio')
  const { theme, setTheme } = useTheme()
  const { isAuthenticated, loading, user } = useAuth()
  const [activeSection, setActiveSection] = useState('inicio')
  

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si está autenticado, mostrar el panel correspondiente
  if (isAuthenticated && user) {
    const renderContent = () => {
      if (user.rol === 'alumno') {
        switch (activeSection) {
          case 'inicio':
            return <AlumnoDashboard onNavigate={setActiveSection} />
          case 'buscar-docente':
            return <BuscarDocente />
          case 'mis-solicitudes':
            return <MisSolicitudes />
          case 'mis-docentes':
            return <MisDocentes />
          case 'anuncios':
            return <AnunciosAlumno />
          case 'perfil':
            return <PerfilAlumno />
          // Nuevas secciones de ejercicios y práctica
          case 'practicar':
            return <Practicar />
          case 'resolver-ejercicio':
            return <ResolverEjercicio />
          case 'mi-progreso':
            return <MiProgreso />
          // case 'mensajeria':
          //   return <Mensajeria /> // Eliminado - no se usa
          case 'conjuntos-asignados':
            return <ConjuntosAsignados />
          default:
            return <AlumnoDashboard onNavigate={setActiveSection} />
        }
      } else {
        switch (activeSection) {
          case 'inicio':
            return <DashboardDocente />
          case 'solicitudes':
            return <SolicitudesDocente />
          case 'mis-alumnos':
            return <MisAlumnosDocente />
          case 'grupos':
            return <GruposDocente />
          case 'anuncios':
            return <AnunciosDocente />
          case 'perfil':
            return <PerfilDocente />
          // Secciones de tests y gestión
          case 'crear-test':
            return <CrearTest />
          case 'gestionar-tests':
            return <GestionarTests />
          case 'asignar-conjuntos':
            return <AsignarConjuntos />
          case 'reportes':
            return <Reportes />
          // case 'mensajeria':
          //   return <MensajeriaDocente /> // Eliminado - no se usa
          default:
            return <DashboardDocente />
        }
      }
    }

    return (
      <Layout activeSection={activeSection} onNavigate={setActiveSection}>
        {renderContent()}
      </Layout>
    )
  }

  // Si no está autenticado, mostrar página de login
  return (
    <div className="min-h-screen relative flex flex-col overflow-x-hidden">
      {/* global background uses theme gradients */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-12 sm:-top-24 -left-12 sm:-left-24 h-64 w-64 sm:h-96 sm:w-[40rem] rounded-full blur-3xl opacity-40 sm:opacity-60 md:opacity-80"
             style={{ background: `radial-gradient(closest-side, rgb(var(--grad-a) / 0.35), transparent)` }} />
        <div className="absolute -bottom-12 sm:-bottom-24 -right-12 sm:-right-24 h-64 w-64 sm:h-96 sm:w-[40rem] rounded-full blur-3xl opacity-40 sm:opacity-60 md:opacity-80"
             style={{ background: `radial-gradient(closest-side, rgb(var(--grad-b) / 0.35), transparent)` }} />
      </div>

      <LoginNavbar active={active} onChange={setActive} theme={theme} setTheme={setTheme} />
      <main className="flex-1 w-full">
        <HeroLogin active={active} onChange={setActive} />
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
