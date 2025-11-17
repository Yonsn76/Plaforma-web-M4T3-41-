import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  title?: string
  subtitle?: string
  className?: string
  hover?: boolean
}

export default function Card({ children, title, subtitle, className = '', hover = false }: CardProps) {
  return (
    <div 
      className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 transition-all duration-200 ${hover ? 'hover:bg-white/10 hover:border-white/20 hover:shadow-lg' : ''} ${className}`}
    >
      {(title || subtitle) && (
        <div className="mb-4 border-b border-white/10 pb-3">
          {title && (
            <h2 className="text-lg font-semibold text-white mb-1">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-white/60 text-sm">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="relative">
        {children}
      </div>
    </div>
  )
}

