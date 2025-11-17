import { 
  AIResponse, 
  ExerciseRequest, 
  ExerciseResponse, 
  HintRequest, 
  HintResponse, 
  ExplanationRequest, 
  ExplanationResponse,
  ReportRequest,
  ReportResponse
} from '../types'
import { generateExercisePrompt, generateHintPrompt, generateExplanationPrompt } from '../prompts'

interface PerplexityConfig {
  primary: string
  fallback?: string
  apiKey?: string
  baseUrl?: string
}

class PerplexityService {
  private config: PerplexityConfig
  private baseUrl: string

  constructor(config: PerplexityConfig) {
    this.config = config
    this.baseUrl = config.baseUrl || 'https://api.perplexity.ai'
  }

  private async makeRequest(model: string, prompt: string): Promise<AIResponse<any>> {
    try {
      if (!this.config.apiKey) {
        throw new Error('Perplexity API key not configured')
      }

      // Configuración de Perplexity lista

      const requestBody = {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'Eres un tutor de matemáticas experto. Responde SIEMPRE en formato JSON válido. No incluyas texto adicional fuera del JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2048,
        top_p: 0.9
      }
      
      console.log('Perplexity request body:', JSON.stringify(requestBody, null, 2))

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(requestBody)
      })

      console.log('Perplexity response status:', response.status)
      console.log('Perplexity response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Perplexity API error response:', errorText)
        
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: { message: errorText } }
        }
        
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorData.error?.message || errorText}`)
      }

      const data = await response.json()
      console.log('Perplexity response data:', data)
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response from Perplexity API')
      }

      const content = data.choices[0].message.content
      console.log('Raw Perplexity response:', content)
      
      // Parsear el JSON de la respuesta
      let parsedData
      try {
        // Limpiar el contenido de posibles caracteres extra
        const cleanContent = content.trim()
        parsedData = JSON.parse(cleanContent)
        console.log('Perplexity JSON parsed successfully')
      } catch (parseError) {
        console.log('Perplexity content is not valid JSON, attempting extraction...')
        console.log('Parse error:', parseError)
        
        // Si no es JSON válido, intentamos extraer el JSON del texto
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          console.log('Extracted JSON from Perplexity:', jsonMatch[0])
          try {
            parsedData = JSON.parse(jsonMatch[0])
          } catch (extractError) {
            console.error('Failed to parse extracted JSON:', extractError)
            throw new Error('Could not parse JSON from Perplexity response')
          }
        } else {
          // Si no encontramos JSON, intentamos crear una respuesta válida
          console.log('No JSON found, creating fallback response')
          parsedData = {
            exercises: [{
              question: "Error: No se pudo generar el ejercicio",
              options: ["Error", "Error", "Error", "Error"],
              correctAnswer: 0,
              explanation: "Hubo un problema al generar el ejercicio con la IA."
            }]
          }
        }
      }
      
      return {
        success: true,
        data: parsedData,
        provider: 'perplexity',
        model: model,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        }
      }
    } catch (error) {
      console.error('Perplexity API error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'perplexity',
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

  async generateReport(request: ReportRequest): Promise<AIResponse<ReportResponse>> {
    const prompt = this.generateReportPrompt(request)
    return await this.makeRequest(this.config.primary, prompt)
  }

  private generateReportPrompt(request: ReportRequest): string {
    const { grado, tema, ejercicios, respuestas, tiempoTotal, duracionSesion } = request;
    
    const totalEjercicios = ejercicios.length;
    const respuestasCorrectas = respuestas.filter(r => r.esCorrecta).length;
    const respuestasIncorrectas = totalEjercicios - respuestasCorrectas;
    const puntuacion = Math.round((respuestasCorrectas / totalEjercicios) * 100);

    return `Analiza el rendimiento de un estudiante de ${grado}° grado en matemáticas y genera un reporte detallado.

DATOS DE LA PRÁCTICA:
- Tema: ${tema}
- Total de ejercicios: ${totalEjercicios}
- Respuestas correctas: ${respuestasCorrectas}
- Respuestas incorrectas: ${respuestasIncorrectas}
- Puntuación: ${puntuacion}%
- Tiempo total: ${tiempoTotal} segundos
- Duración de sesión: ${duracionSesion} minutos

EJERCICIOS REALIZADOS:
${ejercicios.map((ej, i) => `${i+1}. ${ej.question} (Dificultad: ${ej.difficulty})`).join('\n')}

RESPUESTAS DEL ESTUDIANTE:
${respuestas.map((resp, i) => `${i+1}. Respuesta: "${resp.respuesta}" - ${resp.esCorrecta ? 'Correcta' : 'Incorrecta'} - Tiempo: ${resp.tiempoResolucion}ms - Pistas: ${resp.pistasUsadas || 0}`).join('\n')}

Genera un reporte completo que incluya:

1. ANÁLISIS GENERAL:
   - Nivel de rendimiento (excelente/bueno/regular/necesita_mejora)
   - Fortalezas identificadas
   - Áreas de mejora
   - Patrones de comportamiento

2. ANÁLISIS POR TEMA:
   - Dominio del tema principal
   - Conceptos que domina bien
   - Conceptos que necesita reforzar
   - Nivel de dificultad apropiado

3. ANÁLISIS DE COMPORTAMIENTO:
   - Tiempo promedio por ejercicio
   - Uso de pistas
   - Patrones de errores
   - Confianza en las respuestas

4. RECOMENDACIONES PARA PRÓXIMAS PRÁCTICAS:
   - Nivel de dificultad sugerido
   - Temas prioritarios para practicar
   - Temas que puede consolidar
   - Estrategias de aprendizaje específicas
   - Objetivos para la siguiente sesión

Responde SOLO con un JSON válido en este formato exacto:
{
  "analisisGeneral": {
    "nivelRendimiento": "excelente|bueno|regular|necesita_mejora",
    "puntuacion": ${puntuacion},
    "fortalezas": ["fortaleza1", "fortaleza2"],
    "areasMejora": ["área1", "área2"],
    "patronesComportamiento": ["patrón1", "patrón2"]
  },
  "analisisPorTema": [
    {
      "tema": "${tema}",
      "dominio": "alto|medio|bajo",
      "conceptosDominados": ["concepto1", "concepto2"],
      "conceptosDebiles": ["concepto1", "concepto2"],
      "nivelDificultadApropiado": "básico|intermedio|avanzado"
    }
  ],
  "analisisComportamiento": {
    "tiempoPromedioPorEjercicio": ${Math.round(tiempoTotal / totalEjercicios)},
    "usoDePistas": ${respuestas.reduce((sum, r) => sum + (r.pistasUsadas || 0), 0)},
    "patronesErrores": ["patrón1", "patrón2"],
    "confianzaPromedio": 3
  },
  "recomendacionesIA": {
    "nivelDificultadSugerido": "básico|intermedio|avanzado",
    "temasPrioritarios": ["tema1", "tema2"],
    "temasConsolidar": ["tema1", "tema2"],
    "estrategiasAprendizaje": ["estrategia1", "estrategia2"],
    "proximosObjetivos": ["objetivo1", "objetivo2"]
  }
}`;
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
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.primary,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        })
      })
      
      return response.ok
    } catch (error) {
      return false
    }
  }
}

export default PerplexityService

