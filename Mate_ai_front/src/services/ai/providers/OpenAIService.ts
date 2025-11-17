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

interface OpenAIConfig {
  primary: string
  fallback?: string
  apiKey?: string
  baseUrl?: string
}

class OpenAIService {
  private config: OpenAIConfig
  private baseUrl: string

  constructor(config: OpenAIConfig) {
    this.config = config
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1'
  }

  private async makeRequest(model: string, prompt: string): Promise<AIResponse<any>> {
    try {
      if (!this.config.apiKey) {
        throw new Error('OpenAI API key not configured')
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'Eres un tutor de matemáticas experto. Responde siempre en formato JSON válido.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4096,
          top_p: 0.9
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`)
      }

      const data = await response.json()
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response from OpenAI API')
      }

      const content = data.choices[0].message.content
      
      // Parsear el JSON de la respuesta
      let parsedData
      try {
        parsedData = JSON.parse(content)
      } catch (parseError) {
        // Si no es JSON válido, intentamos extraer el JSON del texto
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('Could not parse JSON from OpenAI response')
        }
      }
      
      return {
        success: true,
        data: parsedData,
        provider: 'openai',
        model: model,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        }
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'openai',
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

  // Método para verificar si la API está disponible
  async isAvailable(): Promise<boolean> {
    try {
      if (!this.config.apiKey) return false
      
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      })
      
      return response.ok
    } catch (error) {
      return false
    }
  }

  // Método para obtener modelos disponibles
  async getAvailableModels(): Promise<string[]> {
    try {
      if (!this.config.apiKey) return []
      
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      })
      
      if (!response.ok) return []
      
      const data = await response.json()
      return data.data?.map((model: any) => model.id).filter((id: string) => 
        id.includes('gpt') || id.includes('text-davinci')
      ) || []
    } catch (error) {
      console.error('Error fetching OpenAI models:', error)
      return []
    }
  }
}

export default OpenAIService

