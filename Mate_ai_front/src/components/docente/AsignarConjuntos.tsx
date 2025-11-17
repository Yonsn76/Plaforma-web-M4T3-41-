import { useState, useEffect } from 'react'
import Card from '../common/Card'
import { apiService } from '../../services/api'

interface Test {
  _id: string
  titulo: string
  descripcion: string
  estado: 'borrador' | 'activo' | 'finalizado'
  preguntas: Array<{
    enunciado: string
    opciones: string[]
    respuestaCorrecta: string
    explicacion: string
    dificultad: 'basica' | 'media' | 'avanzada'
    tipoPregunta: string
    orden: number
    puntos: number
  }>
  creadoEn: string
}

interface Alumno {
  _id: string
  nombre: string
  correo: string
  grado: string
}

interface Grupo {
  _id: string
  nombre: string
  grado: string
  totalAlumnos: number
}

interface Asignacion {
  _id: string
  testId: string
  testTitulo: string
  tipo: 'individual' | 'grupal'
  destinatarioId: string
  destinatarioNombre: string
  fechaInicio: string
  fechaLimite: string
  tiempoLimite: number
  instrucciones: string
  estado: 'activa' | 'completada' | 'vencida'
  fechaCreacion: string
  progreso?: {
    totalPreguntas: number
    preguntasResueltas: number
    preguntasCorrectas: number
  }
}

export default function AsignarConjuntos() {
  const [tests, setTests] = useState<Test[]>([])
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState<Asignacion | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string>('todas')
  const [filtroTipo, setFiltroTipo] = useState<string>('todas')

  // Estados del formulario
  const [testSeleccionado, setTestSeleccionado] = useState('')
  const [tipoAsignacion, setTipoAsignacion] = useState<'individual' | 'grupal'>('individual')
  const [destinatarioSeleccionado, setDestinatarioSeleccionado] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaLimite, setFechaLimite] = useState('')
  const [tiempoLimite, setTiempoLimite] = useState(60)
  const [instrucciones, setInstrucciones] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      
      // Obtener datos desde la API
      const [testsData, alumnosData, gruposData, asignacionesData] = await Promise.all([
        apiService.getTestsDocente().catch(() => []),
        apiService.getMisAlumnos().catch(() => []),
        apiService.getGrupos().catch(() => []),
        apiService.getAsignacionesDocente().catch(() => [])
      ])

      // Procesar tests
      const tests: Test[] = testsData.map((test: any) => ({
        _id: test._id,
        titulo: test.titulo,
        descripcion: test.descripcion || '',
        estado: test.estado,
        preguntas: test.preguntas || [],
        creadoEn: test.creadoEn
      }))

      // Procesar alumnos
      const alumnos: Alumno[] = alumnosData.map(alumno => ({
        _id: alumno._id,
        nombre: alumno.nombre,
        correo: alumno.correo,
        grado: alumno.grado || 'Sin grado'
      }))

      // Procesar grupos
      const grupos: Grupo[] = gruposData.map(grupo => ({
        _id: grupo._id,
        nombre: grupo.nombre,
        grado: grupo.grado || 'Sin grado',
        totalAlumnos: grupo.alumnos?.length || 0
      }))

      // Procesar asignaciones
      const asignaciones: Asignacion[] = asignacionesData.map(asignacion => {
        const test = asignacion.testId || testsData.find((t: any) => t._id === asignacion.testId)
        
        // Procesar destinatarios (puede ser individual o grupal)
        const destinatarios = asignacion.destinatarios || []
        const primerDestinatario = destinatarios[0]
        
        let destinatario = null
        let tipo = 'individual'
        
        if (primerDestinatario) {
          tipo = primerDestinatario.tipo
          if (primerDestinatario.tipo === 'alumno') {
            destinatario = alumnosData.find(a => a._id === primerDestinatario.id)
          } else if (primerDestinatario.tipo === 'grupo') {
            destinatario = gruposData.find(g => g._id === primerDestinatario.id)
          }
        }

        return {
          _id: asignacion._id,
          testId: asignacion.testId?._id || asignacion.testId,
          testTitulo: test?.titulo || 'Test no encontrado',
          tipo: tipo as 'individual' | 'grupal',
          destinatarioId: primerDestinatario?.id || '',
          destinatarioNombre: destinatario?.nombre || 'Destinatario no encontrado',
          fechaInicio: asignacion.fechaInicio || '',
          fechaLimite: asignacion.fechaLimite || '',
          tiempoLimite: asignacion.tiempoLimite || 60,
          instrucciones: asignacion.instrucciones || '',
          estado: asignacion.estado || 'activa',
          fechaCreacion: asignacion.creadaEn || new Date().toISOString(),
        }
      })

      setTests(tests)
      setAlumnos(alumnos)
      setGrupos(grupos)
      setAsignaciones(asignaciones)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const guardarAsignacion = async () => {
    try {
      if (!testSeleccionado || !destinatarioSeleccionado || !fechaLimite) {
        alert('Completa todos los campos requeridos')
        return
      }

      const test = tests.find(t => t._id === testSeleccionado)
      const destinatario = tipoAsignacion === 'individual' 
        ? alumnos.find(a => a._id === destinatarioSeleccionado)
        : grupos.find(g => g._id === destinatarioSeleccionado)

      if (!test || !destinatario) {
        alert('Error: test o destinatario no encontrado')
        return
      }

      if (editando) {
        // Actualizar asignación existente
        await apiService.actualizarAsignacion(editando._id, {
          fechaInicio,
          fechaLimite,
          tiempoLimite,
          instrucciones: instrucciones.trim()
        })
        
        setAsignaciones(asignaciones.map(a => 
          a._id === editando._id 
            ? { ...a, fechaInicio, fechaLimite, tiempoLimite, instrucciones: instrucciones.trim() }
            : a
        ))
        
        alert('Asignación actualizada correctamente')
      } else {
        // Crear nueva asignación
        await apiService.crearAsignacion({
          testId: testSeleccionado,
          destinatarios: [{
            tipo: tipoAsignacion === 'individual' ? 'alumno' : 'grupo',
            id: destinatarioSeleccionado
          }],
          fechaInicio,
          fechaLimite,
          tiempoLimite,
          instrucciones: instrucciones.trim()
        })
        
        // Recargar datos para obtener la nueva asignación
        cargarDatos()
        alert('Asignación creada correctamente')
      }

      // Limpiar formulario
      setTestSeleccionado('')
      setTipoAsignacion('individual')
      setDestinatarioSeleccionado('')
      setFechaInicio('')
      setFechaLimite('')
      setTiempoLimite(60)
      setInstrucciones('')
      setMostrarFormulario(false)
      setEditando(null)
    } catch (error) {
      console.error('Error guardando asignación:', error)
      alert('Error al guardar la asignación')
    }
  }

  const eliminarAsignacion = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta asignación?')) {
      return
    }

    try {
        await apiService.eliminarAsignacion(id)
        setAsignaciones(asignaciones.filter(a => a._id !== id))
      alert('Asignación eliminada correctamente')
    } catch (error) {
      console.error('Error eliminando asignación:', error)
      alert('Error al eliminar la asignación')
    }
  }

  const editarAsignacion = (asignacion: Asignacion) => {
    setEditando(asignacion)
    setTestSeleccionado(asignacion.testId)
    setTipoAsignacion(asignacion.tipo)
    setDestinatarioSeleccionado(asignacion.destinatarioId)
    setFechaInicio(asignacion.fechaInicio)
    setFechaLimite(asignacion.fechaLimite)
    setTiempoLimite(asignacion.tiempoLimite)
    setInstrucciones(asignacion.instrucciones)
    setMostrarFormulario(true)
  }

  const cancelarFormulario = () => {
    setMostrarFormulario(false)
    setEditando(null)
    setTestSeleccionado('')
    setTipoAsignacion('individual')
    setDestinatarioSeleccionado('')
    setFechaInicio('')
    setFechaLimite('')
    setTiempoLimite(60)
    setInstrucciones('')
  }

  const getEstadoLabel = (estado: Asignacion['estado']) => {
    switch (estado) {
      case 'activa': return 'Activa'
      case 'completada': return 'Completada'
      case 'vencida': return 'Vencida'
      default: return 'Desconocido'
    }
  }

  const asignacionesFiltradas = asignaciones.filter(a => {
    const estadoMatch = filtroEstado === 'todas' || a.estado === filtroEstado
    const tipoMatch = filtroTipo === 'todas' || a.tipo === filtroTipo
    return estadoMatch && tipoMatch
  })

  const destinatarios = tipoAsignacion === 'individual' ? alumnos : grupos

  if (loading) {
    return (
      <Card title="Asignar Tests">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header mejorado */}
      <Card className="animated-gradient">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Asignar Tests 📋
              </h1>
              <p className="text-white/70 text-sm">
                Gestiona las asignaciones de tests a tus alumnos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <p className="text-xl font-bold text-blue-300">{asignaciones.length}</p>
              <p className="text-blue-200 text-xs">Total</p>
            </div>
          </div>
        </div>
      </Card>
      {/* Estadísticas mejoradas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-blue-300 text-xs font-medium uppercase tracking-wide">Total</p>
              <p className="text-white text-xl font-bold mt-1">{asignaciones.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 hover:border-green-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-green-300 text-xs font-medium uppercase tracking-wide">Activas</p>
              <p className="text-white text-xl font-bold mt-1">
                {asignaciones.filter(a => a.estado === 'activa').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-purple-300 text-xs font-medium uppercase tracking-wide">Completadas</p>
              <p className="text-white text-xl font-bold mt-1">
                {asignaciones.filter(a => a.estado === 'completada').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30 hover:border-red-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-red-300 text-xs font-medium uppercase tracking-wide">Vencidas</p>
              <p className="text-white text-xl font-bold mt-1">
                {asignaciones.filter(a => a.estado === 'vencida').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Controles mejorados */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <button
              onClick={() => setMostrarFormulario(true)}
              className="flex-1 sm:flex-initial px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium hover:from-purple-400 hover:to-pink-500 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/25"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nueva Asignación
            </button>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial">
                <label className="block text-white font-medium mb-2 text-sm">Estado</label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm"
                >
                  <option value="todas" className="text-gray-900">Todos los estados</option>
                  <option value="activa" className="text-gray-900">Activas</option>
                  <option value="completada" className="text-gray-900">Completadas</option>
                  <option value="vencida" className="text-gray-900">Vencidas</option>
                </select>
              </div>

              <div className="flex-1 sm:flex-initial">
                <label className="block text-white font-medium mb-2 text-sm">Tipo</label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm"
                >
                  <option value="todas" className="text-gray-900">Todos los tipos</option>
                  <option value="individual" className="text-gray-900">Individual</option>
                  <option value="grupal" className="text-gray-900">Grupal</option>
                </select>
              </div>
            </div>
          </div>

          <div className="text-sm text-white/60 bg-slate-700/30 px-3 py-2 rounded-lg border border-slate-600/30">
            <span className="font-medium">{asignacionesFiltradas.length}</span> asignación{asignacionesFiltradas.length !== 1 ? 'es' : ''} encontrada{asignacionesFiltradas.length !== 1 ? 's' : ''}
          </div>
        </div>
      </Card>

      {/* Formulario de asignación mejorado */}
      {mostrarFormulario && (
        <Card title={editando ? 'Editar Asignación' : 'Nueva Asignación'}>
          <div className="space-y-6">
            {/* Primera fila: Test y Tipo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-white font-medium mb-3 text-sm">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Test *
                </label>
                <select
                  value={testSeleccionado}
                  onChange={(e) => setTestSeleccionado(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
                >
                  <option value="" className="text-gray-900">Selecciona un test</option>
                  {tests.map(test => (
                    <option key={test._id} value={test._id} className="text-gray-900">
                      {test.titulo} ({test.preguntas.length} preguntas)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-white font-medium mb-3 text-sm">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Tipo de Asignación *
                </label>
                <select
                  value={tipoAsignacion}
                  onChange={(e) => {
                    setTipoAsignacion(e.target.value as 'individual' | 'grupal')
                    setDestinatarioSeleccionado('')
                  }}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm"
                >
                  <option value="individual" className="text-gray-900">Individual</option>
                  <option value="grupal" className="text-gray-900">Grupal</option>
                </select>
              </div>
            </div>

            {/* Destinatario */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-3 text-sm">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {tipoAsignacion === 'individual' ? 'Alumno' : 'Grupo'} *
              </label>
              <select
                value={destinatarioSeleccionado}
                onChange={(e) => setDestinatarioSeleccionado(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all text-sm"
              >
                <option value="" className="text-gray-900">
                  Selecciona {tipoAsignacion === 'individual' ? 'un alumno' : 'un grupo'}
                </option>
                {destinatarios.map(destinatario => (
                  <option key={destinatario._id} value={destinatario._id} className="text-gray-900">
                    {destinatario.nombre}
                    {tipoAsignacion === 'grupal' && ` (${(destinatario as Grupo).totalAlumnos} alumnos)`}
                  </option>
                ))}
              </select>
            </div>

            {/* Fechas en fila */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-white font-medium mb-3 text-sm">
                  <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-white font-medium mb-3 text-sm">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Fecha Límite *
                </label>
                <input
                  type="date"
                  value={fechaLimite}
                  onChange={(e) => setFechaLimite(e.target.value)}
                  min={fechaInicio || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all text-sm"
                />
              </div>
            </div>

            {/* Tiempo límite e instrucciones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-white font-medium mb-3 text-sm">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tiempo Límite (minutos) *
                </label>
                <input
                  type="number"
                  value={tiempoLimite}
                  onChange={(e) => setTiempoLimite(Number(e.target.value))}
                  min="5"
                  max="300"
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all text-sm"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-white font-medium mb-3 text-sm">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Instrucciones
                </label>
                <textarea
                  value={instrucciones}
                  onChange={(e) => setInstrucciones(e.target.value)}
                  placeholder="Instrucciones específicas..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all text-sm resize-none"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
              <button
                onClick={guardarAsignacion}
                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:from-green-400 hover:to-emerald-500 transition-all flex items-center justify-center space-x-2 shadow-lg hover:shadow-green-500/25"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{editando ? 'Actualizar' : 'Crear'} Asignación</span>
              </button>
              <button
                onClick={cancelarFormulario}
                className="px-6 py-3 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-all flex items-center justify-center space-x-2 border border-white/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de asignaciones mejorada */}
      <div className="space-y-4">
        {asignacionesFiltradas.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-600/20 to-slate-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No hay asignaciones</h3>
              <p className="text-white/60 mb-4">Crea tu primera asignación para comenzar</p>
              <button
                onClick={() => setMostrarFormulario(true)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold hover:from-purple-400 hover:to-pink-500 transition-all"
              >
                Crear Primera Asignación
              </button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {asignacionesFiltradas.map(asignacion => (
              <Card key={asignacion._id} className="h-full hover:shadow-lg hover:shadow-purple-500/10 transition-all border border-slate-600/30 hover:border-purple-500/30">
                <div className="h-full flex flex-col">
                  {/* Header con icono, título y estado */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                        asignacion.tipo === 'individual'
                          ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                          : 'bg-gradient-to-br from-purple-500 to-pink-500'
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                            asignacion.tipo === 'individual'
                              ? "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              : "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          } />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white truncate mb-1" title={asignacion.testTitulo}>
                          {asignacion.testTitulo}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            asignacion.estado === 'activa' ? 'bg-green-500/20 text-green-300' :
                            asignacion.estado === 'completada' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {getEstadoLabel(asignacion.estado)}
                          </span>
                          <span className="text-xs text-white/60 capitalize">
                            {asignacion.tipo}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => editarAsignacion(asignacion)}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all"
                        title="Editar asignación"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => eliminarAsignacion(asignacion._id)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all"
                        title="Eliminar asignación"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Información principal */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/90 text-sm truncate" title={asignacion.destinatarioNombre}>
                          {asignacion.destinatarioNombre}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-white/90 text-sm">
                        {new Date(asignacion.fechaLimite).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-white/90 text-sm">
                        {asignacion.tiempoLimite} minutos
                      </p>
                    </div>

                    {asignacion.instrucciones && (
                      <div className="pt-2 border-t border-white/10">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-white/70 text-xs leading-relaxed line-clamp-2">
                            {asignacion.instrucciones}
                          </p>
                        </div>
                      </div>
                    )}

                    {asignacion.progreso && (
                      <div className="pt-2 border-t border-white/10">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-white/70">Progreso:</span>
                            <span className="text-white">
                              {asignacion.progreso.preguntasResueltas}/{asignacion.progreso.totalPreguntas}
                            </span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-1.5">
                            <div
                              className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full transition-all"
                              style={{
                                width: `${(asignacion.progreso.preguntasResueltas / asignacion.progreso.totalPreguntas) * 100}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer con fecha de creación */}
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <p className="text-white/60 text-xs flex items-center gap-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Creado: {new Date(asignacion.fechaCreacion).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}



