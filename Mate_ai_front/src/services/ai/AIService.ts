import { 
  AIProvider, 
  AIResponse, 
  ExerciseRequest, 
  ExerciseResponse, 
  HintRequest, 
  HintResponse, 
  ExplanationRequest, 
  ExplanationResponse,
  ReportRequest,
  ReportResponse
} from './types'
import { 
  getActiveProvider,
  getActiveProviderConfig,
  validateConfiguration
} from './config'
import GeminiService from './providers/GeminiService'
import OllamaService from './providers/OllamaService'
import PerplexityService from './providers/PerplexityService'
import OpenAIService from './providers/OpenAIService'

class AIService {
  private providers: Map<AIProvider, any>
  private activeProvider: AIProvider

  constructor() {
    this.providers = new Map()
    this.activeProvider = getActiveProvider() as AIProvider
    this.initializeProviders()
  }

  private initializeProviders() {
    // Solo inicializar el proveedor activo
    const config = getActiveProviderConfig()
    
    if (this.activeProvider === 'gemini') {
      const geminiConfig = {
        primary: config.defaultModel,
        apiKey: (config as any).apiKey,
        baseUrl: config.baseUrl
      }
      this.providers.set('gemini', new GeminiService(geminiConfig))
    } else if (this.activeProvider === 'ollama') {
      this.providers.set('ollama', new OllamaService(config as any))
    } else if (this.activeProvider === 'perplexity') {
      const perplexityConfig = {
        primary: config.defaultModel,
        apiKey: (config as any).apiKey,
        baseUrl: config.baseUrl
      }
      this.providers.set('perplexity', new PerplexityService(perplexityConfig))
    } else if (this.activeProvider === 'openai') {
      this.providers.set('openai', new OpenAIService(config as any))
    }
  }

  private async executeWithActiveProvider<T>(
    operation: (provider: any) => Promise<AIResponse<T>>
  ): Promise<AIResponse<T>> {
    try {
      // Validar que el proveedor activo esté configurado
      validateConfiguration()
      
      const provider = this.providers.get(this.activeProvider)
      if (!provider) {
        throw new Error(`Proveedor activo '${this.activeProvider}' no está disponible`)
      }

      const result = await operation(provider)
      return result
    } catch (error) {
      console.error(`Error with active provider ${this.activeProvider}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        provider: this.activeProvider,
        model: 'unknown'
      }
    }
  }

  async generateExercises(request: ExerciseRequest): Promise<AIResponse<ExerciseResponse>> {
    return this.executeWithActiveProvider(async (provider) => {
      return await provider.generateExercises(request)
    })
  }

  async generateHint(request: HintRequest): Promise<AIResponse<HintResponse>> {
    return this.executeWithActiveProvider(async (provider) => {
      return await provider.generateHint(request)
    })
  }

  async generateExplanation(request: ExplanationRequest): Promise<AIResponse<ExplanationResponse>> {
    return this.executeWithActiveProvider(async (provider) => {
      return await provider.generateExplanation(request)
    })
  }

  async generateReport(request: ReportRequest): Promise<AIResponse<ReportResponse>> {
    return this.executeWithActiveProvider(async (provider) => {
      return await provider.generateReport(request)
    })
  }

  async testProvider(providerName: AIProvider): Promise<boolean> {
    try {
      // Solo probar el proveedor activo
      if (providerName !== this.activeProvider) {
        return false
      }

      const provider = this.providers.get(providerName)
      if (!provider) return false

      const testRequest: ExerciseRequest = {
        grade: '3',
        topic: 'Suma básica',
        difficulty: 'basica',
        count: 1
      }

      const result = await provider.generateExercises(testRequest)
      return result.success
    } catch (error) {
      console.error(`Error testing provider ${providerName}:`, error)
      return false
    }
  }

  getAvailableProviders(): AIProvider[] {
    return [this.activeProvider]
  }

  getProviderStatus(): Record<AIProvider, boolean> {
    const status: Record<AIProvider, boolean> = {
      gemini: false,
      ollama: false,
      perplexity: false,
      openai: false,
      anthropic: false
    }
    
    status[this.activeProvider] = this.providers.has(this.activeProvider)
    return status
  }

  getActiveProvider(): AIProvider {
    return this.activeProvider
  }

  getActiveProviderConfig() {
    return getActiveProviderConfig()
  }
}

export default AIService

