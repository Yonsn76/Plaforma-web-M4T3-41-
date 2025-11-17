export default function Footer() {
  return (
    <footer className="relative z-20 py-4 sm:py-6 mt-auto bg-black/20 backdrop-blur-sm border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 sm:gap-4">
          {/* Logo y nombre */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-full border backdrop-blur-md order-1 bg-white/5 border-white/20 hover:bg-white/10 transition-all"
               style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--panel-border)' }}>
            <div
              aria-hidden
              className="h-5 w-5 sm:h-6 sm:w-6 rounded-md"
              style={{ background: `linear-gradient(135deg, rgb(var(--grad-a)), rgb(var(--grad-b)))` }}
            />
            <span className="text-xs sm:text-sm font-bold tracking-wide opacity-90">M4T3 41</span>
          </div>

          {/* Copyright */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-full border backdrop-blur-md order-2 sm:order-2 bg-white/5 border-white/20 hover:bg-white/10 transition-all"
               style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--panel-border)' }}>
            <span className="text-xs sm:text-sm opacity-80 text-center">© 2025 M4T3 41. Todos los derechos reservados.</span>
          </div>

          {/* Links opcionales */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs opacity-70 order-3 px-4 py-3 rounded-full border backdrop-blur-md bg-white/5 border-white/20 hover:bg-white/10 transition-all"
               style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--panel-border)' }}>
            <a href="#" className="hover:opacity-100 transition-opacity hover:text-white">Términos</a>
            <span className="hidden sm:inline">•</span>
            <a href="#" className="hover:opacity-100 transition-opacity hover:text-white">Privacidad</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

