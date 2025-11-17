import { 
  AIResponse, 
  ExerciseRequest, 
  ExerciseResponse, 
  HintRequest, 
  HintResponse, 
  ExplanationRequest, 
  ExplanationResponse 
} from '../types'
import { generateExercisePrompt, generateHintPrompt, generateExplanationPrompt } from '../prompts'

interface OllamaConfig {
  primary: string
  fallback?: string
  baseUrl?: string
}

class OllamaService {
  private config: OllamaConfig
  private baseUrl: string

  constructor(config: OllamaConfig) {
    this.config = config
    this.baseUrl = config.baseUrl || 'http://localhost:11434'
  }

  private async makeRequest(model: string, prompt: string): Promise<AIResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_k: 40,
            top_p: 0.9,
            num_predict: 4096
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.response) {
        throw new Error('Invalid response from Ollama API')
      }

      // Ollama devuelve texto plano, necesitamos parsearlo como JSON
      let parsedData
      try {
        parsedData = JSON.parse(data.response)
      } catch (parseError) {
        // Si no es JSON válido, intentamos extraer el JSON del texto
        const jsonMatch = data.response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('Could not parse JSON from Ollama response')
        }
      }
      
      return {
        success: true,
        data: parsedData,
        provider: 'ollama',
        model: model,
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
        }
      }
    } catch (error) {
      console.error('Ollama API error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'ollama',
        model: model
      }
    }
  }

  async generateExercises(request: ExerciseRequest): Promise<AIResponse<ExerciseResponse>> {
    const prompt = generateExercisePrompt(request)
    const result = await this.makeRequest(this.config.primary, prompt)
    
    if (result.success && result.data) {
      return {
        ...result,
        data: {
          exercises: result.data.exercises || [],
          metadata: {
            totalGenerated: result.data.exercises?.length || 0,
            estimatedTime: this.calculateEstimatedTime(request.count, request.difficulty),
            difficulty: request.difficulty,
            topic: request.topic
          }
        }
      }
    }

    return result
  }

  async generateHint(request: HintRequest): Promise<AIResponse<HintResponse>> {
    const prompt = generateHintPrompt(request)
    return await this.makeRequest(this.config.primary, prompt)
  }

  async generateExplanation(request: ExplanationRequest): Promise<AIResponse<ExplanationResponse>> {
    const prompt = generateExplanationPrompt(request)
    return await this.makeRequest(this.config.primary, prompt)
  }

  private calculateEstimatedTime(count: number, difficulty: string): string {
    const baseTime = difficulty === 'basica' ? 2 : difficulty === 'media' ? 4 : 6
    const totalMinutes = Math.ceil((baseTime * count) / 60)
    return `${totalMinutes} minutos`
  }

  // Método para verificar si Ollama está disponible
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      return response.ok
    } catch (error) {
      return false
    }
  }

  // Método para obtener modelos disponibles
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      if (!response.ok) return []
      
      const data = await response.json()
      return data.models?.map((model: any) => model.name) || []
    } catch (error) {
      console.error('Error fetching Ollama models:', error)
      return []
    }
  }
}

export default OllamaService

