import { useState, useEffect, useRef } from 'react'
import { apiService } from '../../services/api'
import { useAIAPI } from '../../hooks/useAIAPI'
import Card from '../common/Card'

// COMPONENTE 1: Header del Chatbot - SIEMPRE VISIBLE Y ESTÁTICO
interface ChatbotHeaderProps {
  onClose: () => void
}

const ChatbotHeader: React.FC<ChatbotHeaderProps> = ({ onClose }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0 bg-slate-800/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 className="text-white font-semibold">Asistente IA</h3>
          <p className="text-white/60 text-xs">Ayuda para crear preguntas</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="lg:hidden p-2 rounded-full hover:bg-white/10 transition-all"
      >
        <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// COMPONENTE 2: Área de Mensajes del Chatbot - SCROLLABLE
interface ChatbotMessagesProps {
  mensajes: Array<{id: string, tipo: 'usuario' | 'ia', mensaje: string, timestamp: Date}>
  enviandoMensaje: boolean
  chatEndRef: React.RefObject<HTMLDivElement>
}

const ChatbotMessages: React.FC<ChatbotMessagesProps> = ({ mensajes, enviandoMensaje, chatEndRef }) => {
  return (
    <div className="p-4 space-y-4">
      {mensajes.length === 0 && (
        <div className="text-center text-white/60 text-sm py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p>¡Hola! Soy tu asistente de matemáticas.</p>
          <p className="mt-2">Pregúntame lo que necesites para crear preguntas.</p>
        </div>
      )}
      
      {mensajes.map((mensaje) => (
        <div
          key={mensaje.id}
          className={`flex ${mensaje.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[75%] p-3 rounded-2xl break-words ${
              mensaje.tipo === 'usuario'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                : 'bg-white/10 text-white/90'
            }`}
          >
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {mensaje.mensaje}
            </div>
            <div className={`text-xs mt-1 ${
              mensaje.tipo === 'usuario' ? 'text-blue-100' : 'text-white/50'
            }`}>
              {mensaje.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}
      
      {enviandoMensaje && (
        <div className="flex justify-start">
          <div className="bg-white/10 text-white/90 p-3 rounded-2xl max-w-[75%]">
            <div className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
              <span className="text-sm">Pensando...</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Referencia para scroll automático */}
      <div ref={chatEndRef} />
    </div>
  )
}

// COMPONENTE 3: Input para Escribir y Enviar - SIEMPRE VISIBLE Y ESTÁTICO
interface ChatbotInputProps {
  mensajeActual: string
  setMensajeActual: (mensaje: string) => void
  enviarMensaje: () => void
  enviandoMensaje: boolean
}

const ChatbotInput: React.FC<ChatbotInputProps> = ({ 
  mensajeActual, 
  setMensajeActual, 
  enviarMensaje, 
  enviandoMensaje 
}) => {
  return (
    <div className="p-4 border-t border-white/10 flex-shrink-0 bg-slate-800/50 backdrop-blur-sm">
      <div className="flex gap-2">
        <input
          type="text"
          value={mensajeActual}
          onChange={(e) => setMensajeActual(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()}
          placeholder="Pregunta al asistente..."
          className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:border-purple-500 focus:bg-white/10 transition-all text-sm focus:outline-none"
          disabled={enviandoMensaje}
        />
        <button
          onClick={enviarMensaje}
          disabled={!mensajeActual.trim() || enviandoMensaje}
          className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center"
        >
          {enviandoMensaje ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

interface PreguntaTest {
  id: string
  enunciado: string
  opciones: string[]
  respuestaCorrecta: string
  explicacion: string
  dificultad: 'basica' | 'media' | 'avanzada'
  puntos: number
  tipoPregunta: 'opcion_multiple' | 'verdadero_falso' | 'respuesta_corta' | 'desarrollo'
}

interface CrearTestProps {
  testExistente?: any
  onTestGuardado?: () => void
  modoEdicion?: boolean
}

export default function CrearTest({ testExistente, onTestGuardado, modoEdicion = false }: CrearTestProps = {}) {
  const { loading: loadingIA, error: errorIA, generateExercises } = useAIAPI()
  
  // Arrays dinámicos - se generan desde la IA (actualmente no se usan en la UI simplificada)
  // const [tiposPregunta, setTiposPregunta] = useState<any[]>([])
  // const [dificultades, setDificultades] = useState<any[]>([])
  // const [temas, setTemas] = useState<string[]>([])
  // const [grados, setGrados] = useState<any[]>([])
  
  // Estados del formulario de test
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  
  // Estados para crear preguntas
  const [preguntas, setPreguntas] = useState<PreguntaTest[]>([])
  const [mostrarFormularioPregunta, setMostrarFormularioPregunta] = useState(false)
  const [mostrarGeneradorIA, setMostrarGeneradorIA] = useState(false)
  
  // Estados del formulario de pregunta manual
  const [enunciado, setEnunciado] = useState('')
  const [tipoPregunta, setTipoPregunta] = useState<'opcion_multiple' | 'verdadero_falso' | 'respuesta_corta' | 'desarrollo'>('opcion_multiple')
  const [opciones, setOpciones] = useState(['', '', '', ''])
  const [respuestaCorrecta, setRespuestaCorrecta] = useState('')
  const [explicacion, setExplicacion] = useState('')
  const [dificultad, setDificultad] = useState<'basica' | 'media' | 'avanzada'>('basica')
  const [puntos, setPuntos] = useState(1)
  const [editandoPregunta, setEditandoPregunta] = useState<string | null>(null)
  
  
  // Estados del generador IA
  const [configuracionIA, setConfiguracionIA] = useState({
    grado: '1',
    tema: '',
    dificultad: 'basica' as 'basica' | 'media' | 'avanzada',
    cantidad: 5
  })
  const [ejerciciosGenerados, setEjerciciosGenerados] = useState<any[]>([])

  // Estados del chatbot
  const [mensajesChat, setMensajesChat] = useState<Array<{id: string, tipo: 'usuario' | 'ia', mensaje: string, timestamp: Date}>>([])
  const [mensajeActual, setMensajeActual] = useState('')
  const [enviandoMensaje, setEnviandoMensaje] = useState(false)

  // Cargar datos del test existente si está en modo edición
  useEffect(() => {
    if (modoEdicion && testExistente) {
      setTitulo(testExistente.titulo || '')
      setDescripcion(testExistente.descripcion || '')
      setPreguntas(testExistente.preguntas || [])
    }
  }, [modoEdicion, testExistente])
  const [mostrarChatbot, setMostrarChatbot] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Scroll automático hacia abajo cuando hay nuevos mensajes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajesChat])

  // Cargar opciones dinámicamente desde la IA
  useEffect(() => {
    cargarOpcionesDinamicas()
  }, [])

  const cargarOpcionesDinamicas = async () => {
    try {
      // Las opciones ahora son dinámicas y se manejan por el usuario
    } catch (error) {
      console.error('Error cargando opciones:', error)
    }
  }

  const enviarMensajeChatbot = async () => {
    if (!mensajeActual.trim() || enviandoMensaje) return

    const nuevoMensaje = {
      id: Date.now().toString(),
      tipo: 'usuario' as const,
      mensaje: mensajeActual.trim(),
      timestamp: new Date()
    }

    setMensajesChat(prev => [...prev, nuevoMensaje])
    setMensajeActual('')
    setEnviandoMensaje(true)

    try {
      // Simular respuesta de IA (aquí podrías integrar con tu API de IA)
      const respuestaIA = await generarRespuestaIA(mensajeActual.trim())
      
      const respuesta = {
        id: (Date.now() + 1).toString(),
        tipo: 'ia' as const,
        mensaje: respuestaIA,
        timestamp: new Date()
      }

      setMensajesChat(prev => [...prev, respuesta])
    } catch (error) {
      console.error('Error generando respuesta:', error)
      const errorRespuesta = {
        id: (Date.now() + 1).toString(),
        tipo: 'ia' as const,
        mensaje: 'Lo siento, hubo un error al procesar tu mensaje. Inténtalo de nuevo.',
        timestamp: new Date()
      }
      setMensajesChat(prev => [...prev, errorRespuesta])
    } finally {
      setEnviandoMensaje(false)
    }
  }

  const generarRespuestaIA = async (mensaje: string): Promise<string> => {
    try {
      // Usar el servicio de IA configurado para generar una respuesta simple
      const { getActiveProvider, getActiveProviderConfig, API_KEYS } = await import('../../services/ai/config')
      const provider = getActiveProvider()
      const config = getActiveProviderConfig()
      
      let apiKey = ''
      if (provider === 'gemini') {
        apiKey = API_KEYS.GEMINI
      } else if (provider === 'perplexity') {
        apiKey = API_KEYS.PERPLEXITY
      } else if (provider === 'openai') {
        apiKey = API_KEYS.OPENAI
      } else if (provider === 'anthropic') {
        apiKey = API_KEYS.ANTHROPIC
      }
      
      if (!apiKey || apiKey.includes('your_')) {
        return 'Por favor, configura una API key de IA en el archivo .env.local'
      }
      
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: config.defaultModel,
          messages: [
            {
              role: 'system',
              content: 'Eres un asistente de IA especializado en matemáticas. Ayudas a crear preguntas, mejorar enunciados, crear opciones de respuesta, sugerir dificultades apropiadas, explicar conceptos matemáticos y crear variaciones de ejercicios. Responde de manera clara y útil.'
            },
            {
              role: 'user',
              content: mensaje
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      })
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }
      
      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      console.error('Error al generar respuesta con IA:', error)
      return 'Lo siento, no pude generar una respuesta. Por favor, intenta de nuevo.'
    }
  }


  // Función para generar una sola pregunta con IA
  const generarPreguntaIA = async () => {
    try {
      if (!configuracionIA.tema.trim()) {
        alert('Por favor, ingresa un tema para la pregunta')
        return
      }

      // Usar el hook useAIAPI para aprovechar el estado de loading
      const response = await generateExercises({
        grado: configuracionIA.grado,
        tema: configuracionIA.tema,
        dificultad: configuracionIA.dificultad as 'basica' | 'media' | 'avanzada',
        cantidad: 1
      })

      if (response && response.data && response.data.ejercicios && response.data.ejercicios.length > 0) {
        const ejercicio = response.data.ejercicios[0]
        const nuevaPregunta: PreguntaTest = {
          id: `pregunta-${Date.now()}`,
          enunciado: ejercicio.enunciado || ejercicio.statement || 'Pregunta generada por IA',
          opciones: ejercicio.opciones || ['A', 'B', 'C', 'D'],
          respuestaCorrecta: ejercicio.respuestaCorrecta || ejercicio.correctAnswer || 'Respuesta correcta',
          explicacion: ejercicio.explicacion || 'Explicación del ejercicio',
          tipoPregunta: 'opcion_multiple',
          dificultad: ejercicio.dificultad || configuracionIA.dificultad,
          puntos: 1
        }
        
        setPreguntas([...preguntas, nuevaPregunta])
        setMostrarGeneradorIA(false)
        alert('Pregunta generada exitosamente')
      } else {
        throw new Error('No se pudo generar la pregunta')
      }
    } catch (error) {
      console.error('Error generando pregunta:', error)
      alert(`Error al generar pregunta: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  // Función para generar preguntas desde el chatbot (actualmente no se usa)
  /*
  const generarPreguntaDesdeChatbot = async (tema: string, dificultad: string) => {
    try {
      const response = await generateExercises({
        grado: '1',
        tema: tema,
        dificultad: dificultad as 'basica' | 'media' | 'avanzada',
        cantidad: 1
      })

      if (response && response.ejercicios && response.ejercicios.length > 0) {
        const ejercicio = response.ejercicios[0]
        const nuevaPregunta: PreguntaTest = {
          id: `chatbot_${Date.now()}`,
          enunciado: ejercicio.enunciado || ejercicio.statement || 'Pregunta generada por IA',
          opciones: ejercicio.opciones || ['A', 'B', 'C', 'D'],
          respuestaCorrecta: ejercicio.respuestaCorrecta || ejercicio.correctAnswer || 'Respuesta correcta',
          explicacion: ejercicio.explicacion || 'Explicación del ejercicio',
          dificultad: ejercicio.dificultad || dificultad as any,
          puntos: 1,
          tipoPregunta: 'opcion_multiple'
        }

        setPreguntas([...preguntas, nuevaPregunta])
        return `Pregunta generada y agregada al test:\n\n"${nuevaPregunta.enunciado}"\n\n¿Necesitas más preguntas o quieres modificar algo?`
      } else {
        return 'No pude generar una pregunta en este momento. Inténtalo de nuevo.'
      }
    } catch (error) {
      console.error('Error generando pregunta:', error)
      return 'Hubo un error al generar la pregunta. Inténtalo de nuevo.'
    }
  }
  */

  const agregarPreguntaManual = () => {
    if (!enunciado.trim() || !respuestaCorrecta.trim()) {
      alert('El enunciado y la respuesta correcta son requeridos')
      return
    }

    const nuevaPregunta: PreguntaTest = {
      id: editandoPregunta || Date.now().toString(),
      enunciado: enunciado.trim(),
      opciones: opciones.filter(op => op.trim()),
      respuestaCorrecta: respuestaCorrecta.trim(),
      explicacion: explicacion.trim(),
      dificultad,
      puntos,
      tipoPregunta
    }

    if (editandoPregunta) {
      // Editar pregunta existente
      setPreguntas(preguntas.map(p => p.id === editandoPregunta ? nuevaPregunta : p))
      setEditandoPregunta(null)
      alert('Pregunta actualizada')
    } else {
      // Agregar nueva pregunta
      setPreguntas([...preguntas, nuevaPregunta])
      alert('Pregunta agregada al test')
    }
    
    // Limpiar formulario
    setEnunciado('')
    setTipoPregunta('opcion_multiple')
    setOpciones(['', '', '', ''])
    setRespuestaCorrecta('')
    setExplicacion('')
    setDificultad('basica')
    setPuntos(1)
    setMostrarFormularioPregunta(false)
  }

  const editarPregunta = (pregunta: PreguntaTest) => {
    setEnunciado(pregunta.enunciado)
    setTipoPregunta(pregunta.tipoPregunta)
    setOpciones([...pregunta.opciones, '', '', ''].slice(0, 4))
    setRespuestaCorrecta(pregunta.respuestaCorrecta)
    setExplicacion(pregunta.explicacion)
    setDificultad(pregunta.dificultad)
    setPuntos(pregunta.puntos)
    setEditandoPregunta(pregunta.id)
    setMostrarFormularioPregunta(true)
  }

  const generarConIA = async () => {
    // Usar la nueva función que genera una sola pregunta
    await generarPreguntaIA()
  }

  const agregarEjerciciosGenerados = () => {
    if (ejerciciosGenerados.length === 0) {
      alert('No hay ejercicios para agregar')
      return
    }

    const nuevasPreguntas: PreguntaTest[] = ejerciciosGenerados.map((ejercicio, index) => ({
      id: `generado_${Date.now()}_${index}`,
      enunciado: ejercicio.enunciado || ejercicio.statement || 'Ejercicio generado',
      opciones: ejercicio.opciones || ['A', 'B', 'C', 'D'],
      respuestaCorrecta: ejercicio.respuestaCorrecta || ejercicio.correctAnswer || 'Respuesta correcta',
      explicacion: ejercicio.explicacion || 'Explicación del ejercicio',
      dificultad: ejercicio.dificultad || configuracionIA.dificultad,
      puntos: 1,
      tipoPregunta: 'opcion_multiple'
    }))

    setPreguntas([...preguntas, ...nuevasPreguntas])
    setEjerciciosGenerados([])
    alert(`${nuevasPreguntas.length} ejercicios agregados al test`)
  }

  const eliminarPregunta = (preguntaId: string) => {
    setPreguntas(preguntas.filter(p => p.id !== preguntaId))
  }

  const crearTest = async () => {
    try {
      if (!titulo.trim()) {
        alert('El título del test es requerido')
        return
      }

      if (preguntas.length === 0) {
        alert('Agrega al menos una pregunta al test')
        return
      }

      // Validar que todas las preguntas tengan los campos mínimos requeridos
      const preguntasInvalidas = preguntas.filter(p => !p.enunciado?.trim() || !p.respuestaCorrecta?.trim())
      if (preguntasInvalidas.length > 0) {
        alert('Todas las preguntas deben tener enunciado y respuesta correcta')
        return
      }

      const testData = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        preguntas: preguntas.map((p, index) => ({
          enunciado: p.enunciado || '',
          opciones: p.opciones || [],
          respuestaCorrecta: p.respuestaCorrecta || '',
          explicacion: p.explicacion || '',
          dificultad: p.dificultad || 'basica',
          tipoPregunta: p.tipoPregunta || 'opcion_multiple',
          orden: index + 1,
          puntos: p.puntos || 1
        }))
      }

      console.log('📝 Datos del test a enviar:', JSON.stringify(testData, null, 2))

      if (modoEdicion && testExistente) {
        // Actualizar test existente
        await apiService.actualizarTest(testExistente._id, testData)
        alert('Test actualizado correctamente')
      } else {
        // Crear nuevo test
        await apiService.crearTest(testData)
        alert('Test creado correctamente')
      }
      
      // Limpiar formulario solo si no está en modo edición
      if (!modoEdicion) {
        setTitulo('')
        setDescripcion('')
        setPreguntas([])
      }
      
      // Llamar callback si existe
      if (onTestGuardado) {
        onTestGuardado()
      }
    } catch (error) {
      console.error('Error guardando test:', error)
      alert('Error al guardar el test')
    }
  }


  return (
    <div className="flex gap-6">
      {/* Contenido principal */}
      <div className="flex-1 space-y-6 pr-0 lg:pr-80 md:pr-80 sm:pr-0">
      {/* Header */}
      <Card className="animated-gradient">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Crear Test
              </h1>
              <p className="text-white/70 text-sm">
                Crea un test completo con múltiples preguntas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <p className="text-xl font-bold text-blue-300">{preguntas.length}</p>
              <p className="text-blue-200 text-xs">Preguntas</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Configuración del Test */}
      <Card title="Configuración del Test" subtitle="Define los detalles básicos">
        <div className="space-y-6">
          {/* Primera fila: Título y estadísticas rápidas */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Campo de título - ocupa 3 columnas en desktop */}
            <div className="lg:col-span-3">
              <label className="flex items-center gap-2 text-white font-medium mb-3 text-sm">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Título del Test *
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Examen de Matemáticas - Unidad 3"
                className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder:text-white/50 focus:border-blue-500 focus:bg-slate-700 transition-all text-sm"
              />
            </div>

            {/* Estadísticas rápidas - ocupa 1 columna */}
            <div className="lg:col-span-1">
              <label className="flex items-center gap-2 text-white font-medium mb-3 text-sm">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Estado
              </label>
              <div className="h-[calc(100%-2rem)] flex items-center justify-center">
                <div className="w-full p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
                  <div className="text-center">
                    <p className="text-green-300 font-bold text-lg">{preguntas.length}</p>
                    <p className="text-green-200 text-xs">Preguntas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Descripción completa */}
          <div>
            <label className="flex items-center gap-2 text-white font-medium mb-3 text-sm">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe el contenido y objetivos del test..."
              className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder:text-white/50 focus:border-blue-500 focus:bg-slate-700 transition-all text-sm resize-none"
              rows={3}
            />
          </div>
        </div>
      </Card>

      {/* Agregar Preguntas */}
      <Card title="Preguntas del Test" subtitle="Agrega preguntas manualmente o genera con IA">
        <div className="space-y-4">
          {/* Barra de acciones compacta */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setMostrarFormularioPregunta(true)}
              className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear Manual
            </button>
            <button
              onClick={() => setMostrarGeneradorIA(true)}
              disabled={loadingIA}
              className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loadingIA ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              )}
              Generar con IA
            </button>
          </div>

        {/* Lista de Preguntas */}
        {preguntas.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Preguntas ({preguntas.length})</h3>
              <span className="text-xs text-white/60 bg-slate-700/50 px-2 py-1 rounded-full">
                {preguntas.reduce((sum, p) => sum + p.puntos, 0)} pts total
              </span>
            </div>
            {preguntas.map((pregunta, index) => (
              <div key={pregunta.id} className="group p-4 rounded-xl bg-slate-700/20 border border-slate-600/30 hover:bg-slate-700/30 hover:border-slate-600/50 transition-all">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-blue-300 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        pregunta.dificultad === 'basica' ? 'bg-green-500/20 text-green-300' :
                        pregunta.dificultad === 'media' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {pregunta.dificultad}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 font-medium">
                        {pregunta.puntos} pts
                      </span>
                      <span className="text-xs text-white/60 capitalize">
                        {pregunta.tipoPregunta?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed mb-2 line-clamp-2">{pregunta.enunciado}</p>
                    {pregunta.opciones?.length > 0 && (
                      <div className="text-white/60 text-xs">
                        <span className="font-medium">Opciones:</span> {pregunta.opciones.slice(0, 2).join(', ')}
                        {pregunta.opciones.length > 2 && ` +${pregunta.opciones.length - 2} más`}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => editarPregunta(pregunta)}
                      className="p-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all"
                      title="Editar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => eliminarPregunta(pregunta.id)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all"
                      title="Eliminar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </Card>

      {/* Formulario de Pregunta Manual */}
      {mostrarFormularioPregunta && (
        <Card title={editandoPregunta ? "Editar Pregunta" : "Crear Pregunta Manual"} subtitle="Diseña tu pregunta">
          <div className="space-y-5">
            {/* Tipo de pregunta y dificultad en fila */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-medium mb-2 text-sm">Tipo de Pregunta *</label>
                <select
                  value={tipoPregunta}
                  onChange={(e) => setTipoPregunta(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white text-sm focus:border-blue-500 focus:bg-slate-700 transition-all"
                >
                  <option value="opcion_multiple" className="bg-slate-800">Opción Múltiple</option>
                  <option value="verdadero_falso" className="bg-slate-800">Verdadero/Falso</option>
                  <option value="respuesta_corta" className="bg-slate-800">Respuesta Corta</option>
                  <option value="desarrollo" className="bg-slate-800">Desarrollo</option>
                </select>
              </div>
              <div>
                <label className="block text-white font-medium mb-2 text-sm">Dificultad</label>
                <select
                  value={dificultad}
                  onChange={(e) => setDificultad(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white text-sm focus:border-blue-500 focus:bg-slate-700 transition-all"
                >
                  <option value="basica" className="bg-slate-800">Básica</option>
                  <option value="media" className="bg-slate-800">Media</option>
                  <option value="avanzada" className="bg-slate-800">Avanzada</option>
                </select>
              </div>
            </div>

            {/* Enunciado */}
            <div>
              <label className="block text-white font-medium mb-2 text-sm">Enunciado *</label>
              <textarea
                value={enunciado}
                onChange={(e) => setEnunciado(e.target.value)}
                placeholder="Escribe aquí el enunciado de tu pregunta..."
                className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder:text-white/50 focus:border-blue-500 focus:bg-slate-700 transition-all text-sm"
                rows={3}
              />
            </div>

            {/* Opciones para opción múltiple */}
            {tipoPregunta === 'opcion_multiple' && (
              <div>
                <label className="block text-white font-medium mb-3 text-sm">Opciones *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {opciones.map((opcion, index) => (
                    <input
                      key={index}
                      type="text"
                      value={opcion}
                      onChange={(e) => {
                        const nuevasOpciones = [...opciones]
                        nuevasOpciones[index] = e.target.value
                        setOpciones(nuevasOpciones)
                      }}
                      placeholder={`Opción ${String.fromCharCode(65 + index)}`}
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/50 focus:border-blue-500 focus:bg-white/10 transition-all text-sm"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Opciones para verdadero/falso */}
            {tipoPregunta === 'verdadero_falso' && (
              <div>
                <label className="block text-white font-medium mb-3 text-sm">Respuesta Correcta</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="radio"
                      name="vf"
                      value="Verdadero"
                      checked={respuestaCorrecta === 'Verdadero'}
                      onChange={(e) => setRespuestaCorrecta(e.target.value)}
                      className="text-blue-500"
                    />
                    Verdadero
                  </label>
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="radio"
                      name="vf"
                      value="Falso"
                      checked={respuestaCorrecta === 'Falso'}
                      onChange={(e) => setRespuestaCorrecta(e.target.value)}
                      className="text-blue-500"
                    />
                    Falso
                  </label>
                </div>
              </div>
            )}

            {/* Respuesta correcta para otros tipos */}
            {tipoPregunta !== 'verdadero_falso' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2 text-sm">Respuesta Correcta *</label>
                  {tipoPregunta === 'opcion_multiple' ? (
                    <select
                      value={respuestaCorrecta}
                      onChange={(e) => setRespuestaCorrecta(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white text-sm focus:border-blue-500 focus:bg-slate-700 transition-all"
                    >
                      <option value="" className="bg-slate-800">Seleccionar respuesta</option>
                      {opciones.map((opcion, index) => (
                        opcion.trim() && (
                          <option key={index} value={opcion} className="bg-slate-800">
                            {String.fromCharCode(65 + index)}. {opcion}
                          </option>
                        )
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={respuestaCorrecta}
                      onChange={(e) => setRespuestaCorrecta(e.target.value)}
                      placeholder="Escribe la respuesta correcta..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white text-sm placeholder:text-white/50 focus:border-blue-500 focus:bg-slate-700 transition-all"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-white font-medium mb-2 text-sm">Puntos</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={puntos}
                    onChange={(e) => setPuntos(parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white text-sm focus:border-blue-500 focus:bg-slate-700 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Explicación */}
            <div>
              <label className="block text-white font-medium mb-2 text-sm">Explicación (opcional)</label>
              <textarea
                value={explicacion}
                onChange={(e) => setExplicacion(e.target.value)}
                placeholder="Explica cómo resolver esta pregunta..."
                className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder:text-white/50 focus:border-blue-500 focus:bg-slate-700 transition-all text-sm"
                rows={2}
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={agregarPreguntaManual}
                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:shadow-lg hover:shadow-green-500/30 transition-all"
              >
                {editandoPregunta ? 'Actualizar Pregunta' : 'Agregar Pregunta'}
              </button>
              <button
                onClick={() => {
                  setMostrarFormularioPregunta(false)
                  setEditandoPregunta(null)
                }}
                className="px-6 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Generador con IA */}
      {mostrarGeneradorIA && (
        <Card title="Generar Pregunta con IA" subtitle="Crea preguntas automáticamente">
          <div className="space-y-4">
            {/* Configuración en fila */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-white font-medium mb-2 text-sm">Grado</label>
                <input
                  type="text"
                  value={configuracionIA.grado}
                  onChange={(e) => setConfiguracionIA({...configuracionIA, grado: e.target.value})}
                  placeholder="Ej: 1, 2, 3..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white text-sm placeholder:text-white/50 focus:border-blue-500 focus:bg-slate-700 transition-all"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2 text-sm">Tema</label>
                <input
                  type="text"
                  value={configuracionIA.tema}
                  onChange={(e) => setConfiguracionIA({...configuracionIA, tema: e.target.value})}
                  placeholder="Ej: Ecuaciones..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white text-sm placeholder:text-white/50 focus:border-blue-500 focus:bg-slate-700 transition-all"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2 text-sm">Dificultad</label>
                <select
                  value={configuracionIA.dificultad}
                  onChange={(e) => setConfiguracionIA({...configuracionIA, dificultad: e.target.value as any})}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white text-sm focus:border-blue-500 focus:bg-slate-700 transition-all"
                >
                  <option value="basica" className="bg-slate-800">Básica</option>
                  <option value="media" className="bg-slate-800">Media</option>
                  <option value="avanzada" className="bg-slate-800">Avanzada</option>
                </select>
              </div>
            </div>

            {errorIA && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                {errorIA}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={generarConIA}
                disabled={loadingIA}
                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingIA ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                )}
                Generar Pregunta
              </button>
              <button
                onClick={() => setMostrarGeneradorIA(false)}
                className="px-4 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Ejercicios Generados */}
      {ejerciciosGenerados.length > 0 && (
        <Card title={`Ejercicios Generados (${ejerciciosGenerados.length})`} subtitle="Preguntas listas para agregar">
          <div className="space-y-3">
            {ejerciciosGenerados.map((ejercicio, index) => (
              <div key={index} className="p-3 rounded-lg bg-slate-700/20 border border-slate-600/30">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-semibold text-xs">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/90 text-sm leading-relaxed mb-2">{ejercicio.enunciado || ejercicio.statement}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-green-300 font-medium">
                        Respuesta: {ejercicio.respuestaCorrecta || ejercicio.correctAnswer}
                      </span>
                      <span className={`px-2 py-1 rounded-full ${
                        (ejercicio.dificultad || configuracionIA.dificultad) === 'basica' ? 'bg-green-500/20 text-green-300' :
                        (ejercicio.dificultad || configuracionIA.dificultad) === 'media' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {(ejercicio.dificultad || configuracionIA.dificultad)?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <button
                onClick={agregarEjerciciosGenerados}
                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:shadow-lg hover:shadow-green-500/30 transition-all"
              >
                Agregar Todas
              </button>
              <button
                onClick={() => setEjerciciosGenerados([])}
                className="px-4 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                Descartar
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Crear Test */}
      {preguntas.length > 0 && (
        <Card title="Finalizar Test" subtitle="Revisa y crea tu test">
          <div className="space-y-4">
            {/* Resumen compacto */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-blue-300 font-bold text-lg">{preguntas.length}</p>
                <p className="text-blue-200 text-xs">Preguntas</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-green-300 font-bold text-lg">{preguntas.reduce((sum, p) => sum + p.puntos, 0)}</p>
                <p className="text-green-200 text-xs">Puntos</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <p className="text-purple-300 font-bold text-lg">{titulo || 'Sin título'}</p>
                <p className="text-purple-200 text-xs">Título</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <p className="text-orange-300 font-bold text-lg">
                  {preguntas.filter(p => p.dificultad === 'avanzada').length}
                </p>
                <p className="text-orange-200 text-xs">Difíciles</p>
              </div>
            </div>

            {/* Botón principal */}
            <div className="pt-2">
              <button
                onClick={crearTest}
                className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:shadow-lg hover:shadow-green-500/30 transition-all text-lg flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {modoEdicion ? 'Actualizar Test' : 'Crear Test'}
              </button>
            </div>
          </div>
        </Card>
      )}
      </div>

      {/* Botón flotante para chatbot en móviles */}
      <button
        onClick={() => setMostrarChatbot(!mostrarChatbot)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-50 flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Chatbot lateral - Responsive */}
      <div className={`${mostrarChatbot ? 'block' : 'hidden'} lg:block fixed right-2 top-20 bottom-20 w-80 max-w-[calc(100vw-1rem)] z-40`}>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl h-full w-full flex flex-col overflow-hidden">
          
          {/* COMPONENTE 1: Header del Chatbot - INMÓVIL */}
          <ChatbotHeader 
            onClose={() => setMostrarChatbot(false)}
          />

          {/* COMPONENTE 2: Área de Mensajes del Chatbot - CON SCROLL */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-red-500/60 scrollbar-track-transparent hover:scrollbar-thumb-red-400/80 scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
            <ChatbotMessages 
              mensajes={mensajesChat}
              enviandoMensaje={enviandoMensaje}
              chatEndRef={chatEndRef}
            />
          </div>

          {/* COMPONENTE 3: Footer del Chatbot (Input) - INMÓVIL */}
          <ChatbotInput 
            mensajeActual={mensajeActual}
            setMensajeActual={setMensajeActual}
            enviarMensaje={enviarMensajeChatbot}
            enviandoMensaje={enviandoMensaje}
          />

            </div>
      </div>

    </div>
  )
}