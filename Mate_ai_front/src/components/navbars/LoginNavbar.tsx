import type { NavKey, ThemeName } from '../../App'

type Props = {
  active: NavKey
  onChange: (key: NavKey) => void
  theme: ThemeName
  setTheme: (t: ThemeName) => void
}

export default function LoginNavbar({ active, onChange, theme, setTheme }: Props) {
  const navItems: { key: NavKey; label: string }[] = [
    { key: 'Inicio', label: 'Inicio' },
    { key: 'Servicios', label: 'Servicios' },
    { key: 'Acerca', label: 'Acerca de' },
    { key: 'Contacto', label: 'Contacto' },
  ]

  const themes: ThemeName[] = ['light','dark','pink','green','red','sky']

  return (
    <header className="sticky top-0 z-40 backdrop-blur-2xl border-b border-white/[0.08]" 
            style={{ 
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}>
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-18">
          {/* Logo responsive */}
          <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer">
            <div className="relative">
              <div
                aria-hidden
                className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg transition-all group-hover:scale-105 group-hover:shadow-violet-500/50"
                style={{ background: `linear-gradient(135deg, rgb(var(--grad-a)), rgb(var(--grad-b)))` }}
              />
              <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 blur opacity-30 group-hover:opacity-50 transition-all" />
            </div>
            <div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-white">M4T3 41</div>
              <div className="text-[10px] sm:text-xs text-white/60 font-medium tracking-wide uppercase hidden sm:block">
                Plataforma Educativa
              </div>
            </div>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            {/* Navbar pills */}
            <nav>
              <ul className="flex items-center gap-1 p-1 rounded-full border backdrop-blur-md"
                  style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--panel-border)' }}>
                {navItems.map((item) => {
                  const isActive = item.key === active
                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        onClick={() => onChange(item.key)}
                        className={[
                          'px-3 lg:px-4 py-2 text-sm lg:text-base font-semibold rounded-full transition-all duration-200 relative',
                          isActive
                            ? 'text-white'
                            : 'text-white/60 hover:text-white'
                        ].join(' ')}
                      >
                        {isActive && (
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-600 to-purple-500 shadow-lg" 
                               style={{ animation: 'fade-in 0.2s ease-out' }} />
                        )}
                        <span className="relative z-10">{item.label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* Theme selector */}
            <div className="flex items-center gap-1.5 lg:gap-2 rounded-full border px-2 lg:px-3 py-1.5 backdrop-blur-md"
                 style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--panel-border)' }}>
              {themes.map((t) => (
                <button
                  key={t}
                  aria-label={`theme-${t}`}
                  onClick={() => setTheme(t)}
                  className={[
                    'w-6 h-6 lg:w-7 lg:h-7 rounded-full border transition-all duration-200 flex-shrink-0',
                    theme === t
                      ? 'ring-2 ring-white/50 scale-110 shadow-lg'
                      : 'hover:scale-105 hover:shadow-md'
                  ].join(' ')}
                  style={{
                    background:
                      t === 'light' ? '#f6f7fb' :
                      t === 'dark' ? '#0b0d12' :
                      t === 'pink' ? 'linear-gradient(135deg,#ec4899,#f43f5e)' :
                      t === 'green' ? 'linear-gradient(135deg,#22c55e,#06b6d4)' :
                      t === 'red' ? 'linear-gradient(135deg,#f43f5e,#fb923c)' :
                      'linear-gradient(135deg,#0ea5e9,#6366f1)',
                    borderColor: 'var(--panel-border)',
                    // Tailwind ring color via CSS var
                    // @ts-ignore
                    '--tw-ring-color': 'rgb(var(--ring))',
                  } as React.CSSProperties}
                />
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Theme selector mobile */}
            <div className="flex items-center gap-1 rounded-full border px-2 py-1 backdrop-blur-md"
                 style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--panel-border)' }}>
              {themes.slice(0, 3).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={[
                    'w-5 h-5 rounded-full transition-all',
                    theme === t
                      ? 'ring-2 ring-white/50 scale-110'
                      : 'hover:scale-105'
                  ].join(' ')}
                  style={{
                    background:
                      t === 'light' ? '#f6f7fb' :
                      t === 'dark' ? '#0b0d12' :
                      t === 'pink' ? 'linear-gradient(135deg,#ec4899,#f43f5e)' :
                      t === 'green' ? 'linear-gradient(135deg,#22c55e,#06b6d4)' :
                      t === 'red' ? 'linear-gradient(135deg,#f43f5e,#fb923c)' :
                      'linear-gradient(135deg,#0ea5e9,#6366f1)',
                    borderColor: 'var(--panel-border)',
                  } as React.CSSProperties}
                  title={t}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden pb-3 sm:pb-4">
          <div className="flex gap-1 p-1 rounded-full border backdrop-blur-md overflow-x-auto scrollbar-hide"
               style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--panel-border)' }}>
            {navItems.map((item) => {
              const isActive = item.key === active
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onChange(item.key)}
                  className={[
                    'px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 whitespace-nowrap relative',
                    isActive
                      ? 'text-white'
                      : 'text-white/60 hover:text-white'
                  ].join(' ')}
                >
                  {isActive && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-600 to-purple-500 shadow-lg" 
                         style={{ animation: 'fade-in 0.2s ease-out' }} />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </button>
              )
            })}
          </div>
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
    </header>
  )
}


