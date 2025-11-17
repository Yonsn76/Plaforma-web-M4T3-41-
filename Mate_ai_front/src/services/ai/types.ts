// Tipos e interfaces para el servicio de IA

export interface AIModel {
  id: string
  name: string
  provider: AIProvider
  description: string
  capabilities: string[]
  maxTokens?: number
  costPerToken?: number
  isAvailable: boolean
}

export type AIProvider = 'gemini' | 'ollama' | 'perplexity' | 'openai' | 'anthropic'

export interface AIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  provider: AIProvider
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  cost?: number
}

export interface ExerciseRequest {
  grade: string
  topic: string
  difficulty: 'basica' | 'media' | 'avanzada'
  count: number
  language?: string
  customInstructions?: string
}

export interface ExerciseResponse {
  exercises: Exercise[]
  metadata: {
    totalGenerated: number
    estimatedTime: string
    difficulty: string
    topic: string
  }
}

export interface Exercise {
  id: string
  question: string
  answer: string
  explanation: string
  hints: string[]
  difficulty: 'basica' | 'media' | 'avanzada'
  topic: string
  grade: string
  steps?: string[]
  alternativeAnswers?: string[]
}

export interface HintRequest {
  exerciseId: string
  question: string
  currentAnswer?: string
  previousHints: string[]
  difficulty: 'basica' | 'media' | 'avanzada'
}

export interface HintResponse {
  hint: string
  isLastHint: boolean
  nextStep?: string
  encouragement?: string
}

export interface ExplanationRequest {
  exerciseId: string
  question: string
  answer: string
  studentAnswer?: string
  isCorrect: boolean
  difficulty: 'basica' | 'media' | 'avanzada'
}

export interface ExplanationResponse {
  explanation: string
  steps: string[]
  keyConcepts: string[]
  commonMistakes?: string[]
  similarExercises?: string[]
  encouragement?: string
}

// Tipos para reportes de rendimiento
export interface ReportRequest {
  alumnoId: string
  grado: string
  tema: string
  ejercicios: Exercise[]
  respuestas: RespuestaEstudiante[]
  tiempoTotal: number
  duracionSesion: number
}

export interface RespuestaEstudiante {
  id: string
  ejercicioId: string
  respuesta: string
  esCorrecta: boolean
  pistasUsadas: number
  fechaIntento: string
  tiempoResolucion: number
}

export interface ReportResponse {
  analisisGeneral: {
    nivelRendimiento: 'excelente' | 'bueno' | 'regular' | 'necesita_mejora'
    puntuacion: number
    fortalezas: string[]
    areasMejora: string[]
    patronesComportamiento: string[]
  }
  analisisPorTema: {
    tema: string
    dominio: 'alto' | 'medio' | 'bajo'
    conceptosDominados: string[]
    conceptosDebiles: string[]
    nivelDificultadApropiado: 'básico' | 'intermedio' | 'avanzado'
  }[]
  analisisComportamiento: {
    tiempoPromedioPorEjercicio: number
    usoDePistas: number
    patronesErrores: string[]
    confianzaPromedio: number
  }
  recomendacionesIA: {
    nivelDificultadSugerido: 'básico' | 'intermedio' | 'avanzado'
    temasPrioritarios: string[]
    temasConsolidar: string[]
    estrategiasAprendizaje: string[]
    proximosObjetivos: string[]
  }
}










