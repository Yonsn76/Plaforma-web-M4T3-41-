// Servicio principal de IA - Punto de entrada unificado
export { default as AIService } from './AIService'
export { default } from './AIService'

// Tipos y interfaces
export type { 
  AIModel, 
  AIProvider, 
  AIResponse, 
  ExerciseRequest, 
  ExerciseResponse,
  HintRequest,
  HintResponse,
  ExplanationRequest,
  ExplanationResponse
} from './types'

// Configuración
export { 
  getActiveProvider, 
  getActiveProviderConfig, 
  getDefaultModel,
  validateConfiguration,
  ACTIVE_PROVIDER,
  API_KEYS
} from './config'

