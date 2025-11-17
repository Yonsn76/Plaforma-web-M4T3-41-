import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { apiService } from '../../services/api'
import Card from '../common/Card'

const gradosBase = ['1', '2', '3', '4', '5', '6']

export default function PerfilDocente() {
  const { user, login } = useAuth()
  const [perfil, setPerfil] = useState<any>(null)
  const [editando, setEditando] = useState(false)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [nombre, setNombre] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [gradosAsignados, setGradosAsignados] = useState<string[]>([])
  
  // Para agregar nuevos grados
  const [nuevoGrado, setNuevoGrado] = useState('')
  const [nuevaSeccion, setNuevaSeccion] = useState('')

  useEffect(() => {
    cargarPerfil()
  }, [])

  const cargarPerfil = async () => {
    try {
      setLoading(true)
      const data = await apiService.getMe()
      setPerfil(data)
      setNombre(data.nombre)
      setEspecialidad(data.especialidad || '')
      setGradosAsignados(data.gradosAsignados || [])
    } catch (error) {
      console.error('Error cargando perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  const agregarGrado = () => {
    if (!nuevoGrado || !nuevaSeccion) {
      alert('Selecciona un grado y una sección')
      return
    }

    const gradoCompleto = `${nuevoGrado}°${nuevaSeccion.toUpperCase()}`
    
    if (gradosAsignados.includes(gradoCompleto)) {
      alert('Este grado ya está agregado')
      return
    }

    setGradosAsignados([...gradosAsignados, gradoCompleto])
    setNuevoGrado('')
    setNuevaSeccion('')
  }

  const removerGrado = (index: number) => {
    setGradosAsignados(gradosAsignados.filter((_, i) => i !== index))
  }

  const guardarCambios = async () => {
    try {
      setGuardando(true)
      const data = await apiService.updateProfile({ 
        nombre, 
        especialidad,
        gradosAsignados 
      })
      setPerfil(data)
      login({ ...user!, nombre, especialidad, gradosAsignados })
      setEditando(false)
      alert('Perfil actualizado correctamente')
    } catch (error: any) {
      alert(error.message || 'Error al actualizar perfil')
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <Card title="Mi Perfil">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header con gradiente y avatar mejorado */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10"></div>
        <div className="relative flex items-center space-x-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-2xl">
              {perfil?.nombre?.charAt(0)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-slate-900 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-1">{perfil?.nombre}</h1>
            <p className="text-white/70 mb-2">{perfil?.correo}</p>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium border border-purple-500/30">
                Docente
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-sm border border-white/20">
                {perfil?.especialidad || 'Sin especialidad'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Card title="Información Personal" subtitle="Gestiona tus datos personales">
        <div className="space-y-6">

          {/* Campos mejorados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/90 mb-3">
                Nombre Completo
              </label>
              {editando ? (
                <div className="relative">
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    placeholder="Tu nombre completo"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-white text-lg font-medium">{perfil?.nombre}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/90 mb-3">
                Correo Electrónico
              </label>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/90 text-lg font-medium">{perfil?.correo}</p>
                <p className="text-xs text-white/50 mt-1 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  El correo no se puede cambiar
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/90 mb-3">
                Especialidad
              </label>
              {editando ? (
                <div className="relative">
                  <input
                    type="text"
                    value={especialidad}
                    onChange={(e) => setEspecialidad(e.target.value)}
                    placeholder="Ej: Matemáticas, Ciencias, etc."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-white text-lg font-medium">{perfil?.especialidad || 'No especificado'}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/90 mb-3">
                Cuenta Creada
              </label>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/90 text-lg font-medium">
                  {new Date(perfil?.creadoEn).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-xs text-white/50 mt-1">
                  {Math.floor((Date.now() - new Date(perfil?.creadoEn).getTime()) / (1000 * 60 * 60 * 24))} días de antigüedad
                </p>
              </div>
            </div>
          </div>

          {/* Grados Asignados - Sección separada */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Grados Asignados</h3>
                <p className="text-sm text-white/60">Gestiona los grados que enseñas</p>
              </div>
              {editando && (
                <div className="text-sm text-white/50">
                  {gradosAsignados.length} grado{gradosAsignados.length !== 1 ? 's' : ''} asignado{gradosAsignados.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            
            {editando ? (
              <div className="space-y-4">
                {/* Agregar nuevo grado */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="text-sm font-medium text-white/90 mb-3">Agregar Nuevo Grado</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative">
                      <select
                        value={nuevoGrado}
                        onChange={(e) => setNuevoGrado(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all appearance-none"
                      >
                        <option value="" className="text-gray-900">Seleccionar grado</option>
                        {gradosBase.map((g) => (
                          <option key={g} value={g} className="text-gray-900">{g}°</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Sección (A, B, C...)"
                        value={nuevaSeccion}
                        onChange={(e) => setNuevaSeccion(e.target.value.toUpperCase().slice(0, 1))}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                        maxLength={1}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={agregarGrado}
                      disabled={!nuevoGrado || !nuevaSeccion}
                      className={[
                        'rounded-xl px-4 py-3 font-semibold transition-all flex items-center justify-center space-x-2',
                        !nuevoGrado || !nuevaSeccion
                          ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400 shadow-lg hover:shadow-purple-500/25'
                      ].join(' ')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>

                {/* Lista de grados */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  {gradosAsignados.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <p className="text-white/60 font-medium">No hay grados asignados</p>
                      <p className="text-white/40 text-sm">Agrega al menos un grado para comenzar</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {gradosAsignados.map((grado, idx) => (
                        <div
                          key={idx}
                          className="group flex items-center justify-between rounded-xl px-4 py-3 bg-gradient-to-r from-white/10 to-white/5 border border-white/10 hover:border-white/20 transition-all"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                              {grado.split('°')[0]}
                            </div>
                            <span className="text-white font-medium">{grado}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removerGrado(idx)}
                            className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-all"
                            title="Quitar grado"
                          >
                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                {perfil?.gradosAsignados && perfil.gradosAsignados.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {perfil.gradosAsignados.map((grado: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300"
                      >
                        <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-xs font-bold">
                          {grado.split('°')[0]}
                        </div>
                        <span className="font-medium">{grado}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-white/60">No tienes grados asignados</p>
                    <p className="text-white/40 text-sm mt-1">Edita tu perfil para agregar grados</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botones mejorados */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/10">
            {editando ? (
              <>
                <button
                  onClick={guardarCambios}
                  disabled={guardando}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:from-green-400 hover:to-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg hover:shadow-green-500/25"
                >
                  {guardando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditando(false)
                    setNombre(perfil.nombre)
                    setEspecialidad(perfil.especialidad || '')
                    setGradosAsignados(perfil.gradosAsignados || [])
                    setNuevoGrado('')
                    setNuevaSeccion('')
                  }}
                  disabled={guardando}
                  className="px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all disabled:opacity-50 flex items-center justify-center space-x-2 border border-white/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Cancelar</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditando(true)}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold hover:from-purple-400 hover:to-pink-500 transition-all flex items-center justify-center space-x-2 shadow-lg hover:shadow-purple-500/25"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Editar Perfil</span>
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Sección de seguridad mejorada */}
      <Card title="Seguridad y Privacidad" subtitle="Gestiona tu cuenta y sesión">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">Cambiar Contraseña</h3>
                  <p className="text-white/60 text-sm">Actualiza tu contraseña por seguridad</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">Privacidad</h3>
                  <p className="text-white/60 text-sm">Configura tu privacidad y datos</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          <div 
            onClick={() => {
              if (confirm('¿Estás seguro de cerrar sesión?')) {
                apiService.logout()
                window.location.href = '/'
              }
            }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-red-300 font-medium">Cerrar Sesión</h3>
                  <p className="text-red-400/60 text-sm">Cierra tu sesión actual</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-red-400/60 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

