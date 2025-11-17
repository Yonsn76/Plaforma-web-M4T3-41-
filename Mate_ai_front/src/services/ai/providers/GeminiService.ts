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

interface GeminiConfig {
  primary: string
  fallback?: string
  apiKey?: string
  baseUrl?: string
}

class GeminiService {
  private config: GeminiConfig
  private baseUrl: string

  constructor(config: GeminiConfig) {
    this.config = config
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta'
  }

  private async makeRequest(model: string, prompt: string): Promise<AIResponse<any>> {
    try {
      if (!this.config.apiKey) {
        throw new Error('Gemini API key not configured')
      }

      const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.config.apiKey}`
      // Configuración de Gemini lista

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from Gemini API')
      }

      const content = data.candidates[0].content.parts[0].text
      console.log('Raw Gemini response:', content)
      
      // Extraer JSON del contenido que puede venir en formato Markdown
      const jsonContent = this.extractJsonFromContent(content)
      console.log('Extracted JSON:', jsonContent)
      
      let parsedData
      try {
        parsedData = JSON.parse(jsonContent)
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError)
        console.error('Content that failed to parse:', jsonContent)
        throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
      }
      
      return {
        success: true,
        data: parsedData,
        provider: 'gemini',
        model: model,
        usage: {
          promptTokens: data.usageMetadata?.promptTokenCount || 0,
          completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata?.totalTokenCount || 0
        }
      }
    } catch (error) {
      console.error('Gemini API error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'gemini',
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

  private extractJsonFromContent(content: string): string {
    console.log('Extracting JSON from content:', content)
    
    try {
      // Si el contenido ya es JSON válido, devolverlo directamente
      JSON.parse(content)
      console.log('Content is already valid JSON')
      return content
    } catch {
      console.log('Content is not valid JSON, attempting extraction...')
      
      // Intentar extraer de bloques de código Markdown
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (jsonMatch && jsonMatch[1]) {
        const extracted = jsonMatch[1].trim()
        console.log('Extracted from markdown block:', extracted)
        try {
          JSON.parse(extracted)
          return extracted
        } catch {
          console.log('Extracted content is not valid JSON')
        }
      }
      
      // Buscar contenido JSON entre llaves (más específico)
      const jsonObjectMatch = content.match(/\{[\s\S]*?\}/)
      if (jsonObjectMatch && jsonObjectMatch[0]) {
        const extracted = jsonObjectMatch[0]
        console.log('Extracted from object match:', extracted)
        try {
          JSON.parse(extracted)
          return extracted
        } catch {
          console.log('Object match is not valid JSON')
        }
      }
      
      // Buscar múltiples líneas que contengan JSON
      const lines = content.split('\n')
      let jsonLines = []
      let inJsonBlock = false
      
      for (const line of lines) {
        if (line.trim().startsWith('{') || inJsonBlock) {
          inJsonBlock = true
          jsonLines.push(line)
          if (line.trim().endsWith('}')) {
            break
          }
        }
      }
      
      if (jsonLines.length > 0) {
        const extracted = jsonLines.join('\n')
        console.log('Extracted from line-by-line:', extracted)
        try {
          JSON.parse(extracted)
          return extracted
        } catch {
          console.log('Line-by-line extraction is not valid JSON')
        }
      }
      
      // Si no se encuentra JSON válido, devolver el contenido original
      console.warn('No se pudo extraer JSON válido del contenido:', content)
      return content
    }
  }

  private calculateEstimatedTime(count: number, difficulty: string): string {
    const baseTime = difficulty === 'basica' ? 2 : difficulty === 'media' ? 4 : 6
    const totalMinutes = Math.ceil((baseTime * count) / 60)
    return `${totalMinutes} minutos`
  }
}

export default GeminiService

