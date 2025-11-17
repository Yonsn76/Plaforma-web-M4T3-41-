import { useState, useCallback } from 'react'
import { apiService } from '../services/api'
// import { AIService } from '../services/ai' // Ya no se usa - llamadas directas a Perplexity
import { ReportRequest } from '../services/ai/types'

interface ExerciseRequest {
  grado: string
  tema: string
  dificultad: 'basica' | 'media' | 'avanzada'
  cantidad: number
  conjuntoId?: string
  alumnoId?: string // Para personalización adaptativa
}

interface HintRequest {
  preguntaId: string
}

interface ExplanationRequest {
  preguntaId: string
  respuestaAlumno: string
}

export const useAIAPI = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // const aiService = new AIService() // Ya no se usa - llamadas directas a Perplexity

  // Función para obtener consejos de rendimiento previos del estudiante
  const obtenerConsejosPrevios = useCallback(async (alumnoId: string, tema?: string) => {
    try {
      console.log('useAIAPI - Obteniendo consejos previos para alumno:', alumnoId)
      
      // Obtener los últimos reportes del estudiante
      const response = await apiService.getReportesAlumno(alumnoId, 5, 1) // Últimos 5 reportes
      
      console.log('useAIAPI - Respuesta completa de API:', response)
      
      // Verificar diferentes estructuras posibles de respuesta
      let reportes = null
      if (response && response.data && response.data.reportes) {
        reportes = response.data.reportes
        console.log('useAIAPI - Reportes encontrados en response.data.reportes:', reportes.length)
      } else if (response && response.reportes) {
        reportes = response.reportes
        console.log('useAIAPI - Reportes encontrados en response.reportes:', reportes.length)
      } else if (Array.isArray(response)) {
        reportes = response
        console.log('useAIAPI - Reportes encontrados como array directo:', reportes.length)
      } else {
        console.log('useAIAPI - No se encontraron reportes en la respuesta')
        return []
      }
      
      if (reportes && reportes.length > 0) {
        // Filtrar por tema si se especifica
        const reportesRelevantes = tema 
          ? reportes.filter((reporte: any) => 
              reporte.tema.toLowerCase().includes(tema.toLowerCase()) || 
              tema.toLowerCase().includes(reporte.tema.toLowerCase())
            )
          : reportes
        
        console.log('useAIAPI - Reportes relevantes después del filtro:', reportesRelevantes.length)
        
        // Extraer consejos de los reportes
        const consejosPrevios = reportesRelevantes.map((reporte: any) => ({
          fecha: reporte.fechaRealizacion,
          tema: reporte.tema,
          puntuacion: reporte.puntuacion,
          consejos: reporte.consejos,
          reporte: reporte.reporte
        }))
        
        console.log('useAIAPI - Consejos previos procesados:', consejosPrevios.length)
        console.log('useAIAPI - Primer consejo:', consejosPrevios[0])
        return consejosPrevios
      }
      
      console.log('useAIAPI - No hay reportes disponibles')
      return []
    } catch (error) {
      console.error('useAIAPI - Error obteniendo consejos previos:', error)
      return []
    }
  }, [])

  const generateExercises = useCallback(async (request: ExerciseRequest) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('useAIAPI - Generando ejercicios:', request)
      
      // Obtener consejos previos si se proporciona alumnoId
      let consejosPrevios: any[] = []
      if (request.alumnoId) {
        consejosPrevios = await obtenerConsejosPrevios(request.alumnoId, request.tema)
        console.log('useAIAPI - Consejos previos encontrados:', consejosPrevios.length)
      }
      
      // Usar directamente la API de Perplexity desde el frontend (igual que el chatbot)
      const { API_KEYS } = await import('../services/ai/config')
      const API_KEY = API_KEYS.PERPLEXITY
      
      // Construir prompt personalizado basado en consejos previos
      let prompt = `Genera ${request.cantidad} ejercicios de matemáticas para ${request.grado} grado sobre el tema "${request.tema}" con dificultad ${request.dificultad}.`

      // Agregar personalización si hay consejos previos
      if (consejosPrevios.length > 0) {
        prompt += `\n\nPERSONALIZACIÓN BASADA EN RENDIMIENTO PREVIO DEL ESTUDIANTE:`
        
        consejosPrevios.forEach((consejo, index) => {
          prompt += `\n\nREPORTE ${index + 1} (${new Date(consejo.fecha).toLocaleDateString()}):`
          prompt += `\n- Tema: ${consejo.tema}`
          prompt += `\n- Puntuación: ${consejo.puntuacion}%`
          prompt += `\n- Consejos previos: ${consejo.consejos}`
          prompt += `\n- Análisis: ${consejo.reporte.substring(0, 200)}...`
        })
        
        prompt += `\n\nINSTRUCCIONES DE PERSONALIZACIÓN:`
        prompt += `\n- Adapta la dificultad considerando el rendimiento previo`
        prompt += `\n- Incluye ejercicios que refuercen áreas identificadas como débiles`
        prompt += `\n- Prioriza ejercicios que ayuden con los consejos específicos dados`
        prompt += `\n- Considera el progreso del estudiante en sesiones anteriores`
      }

      prompt += `\n\nIMPORTANTE: 
- NO uses caracteres LaTeX como \\(, \\), \\times, \\div en las explicaciones
- Usa texto simple: "6 dividido entre 2 = 3" en lugar de "6 \\div 2 = 3"
- Evita caracteres especiales que puedan romper el JSON

Responde SOLO con un JSON válido en este formato exacto:
{
  "ejercicios": [
    {
      "id": "ej_1",
      "enunciado": "Enunciado del ejercicio",
      "opciones": ["opción A", "opción B", "opción C", "opción D"],
      "respuestaCorrecta": "opción correcta",
      "explicacion": "Explicación detallada de la solución usando solo texto simple",
      "pistas": ["Pista 1", "Pista 2"],
      "dificultad": "${request.dificultad}",
      "tema": "${request.tema}",
      "grado": "${request.grado}"
    }
  ],
  "metadata": {
    "totalGenerados": ${request.cantidad},
    "tiempoEstimado": "X minutos",
    "dificultad": "${request.dificultad}",
    "tema": "${request.tema}"
  }
}`;
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'Eres un asistente especializado en matemáticas para estudiantes de primaria y secundaria. Responde siempre en español y en formato JSON válido. IMPORTANTE: NO uses caracteres LaTeX como \\(, \\), \\times, \\div en las explicaciones. Usa solo texto simple para evitar errores de JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content
      
      console.log('useAIAPI - Contenido crudo:', content)
      
      // Extraer JSON del contenido
      let jsonData
      try {
        // Intentar parsear directamente
        jsonData = JSON.parse(content)
      } catch (e1) {
        try {
          // Buscar JSON en bloques de código
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
          if (jsonMatch) {
            jsonData = JSON.parse(jsonMatch[1])
          } else {
            // Buscar JSON en cualquier bloque de código
            const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/)
            if (codeMatch) {
              jsonData = JSON.parse(codeMatch[1])
            } else {
              // Buscar JSON entre llaves
              const braceMatch = content.match(/\{[\s\S]*\}/)
              if (braceMatch) {
                jsonData = JSON.parse(braceMatch[0])
              } else {
                throw new Error('No se encontró JSON válido en la respuesta')
              }
            }
          }
        } catch (e2) {
          console.error('Error extrayendo JSON:', e2)
          console.error('Contenido recibido:', content)
          throw new Error('No se pudo extraer JSON de la respuesta de la IA')
        }
      }
      
      console.log('useAIAPI - JSON extraído:', jsonData)
      
      return {
        success: true,
        data: jsonData,
        model: 'sonar',
        usage: {
          prompt: 0,
          completion: 0,
          total: 0
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('useAIAPI - Error generando ejercicios:', err)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const generateHint = useCallback(async (request: HintRequest, ejercicioData?: any) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('useAIAPI - Generando pista:', request)
      
      // Usar directamente la API de Perplexity desde el frontend (igual que el chatbot)
      const API_KEY = API_KEY
      
      const prompt = `Genera una pista útil para el siguiente ejercicio de matemáticas:

EJERCICIO: ${ejercicioData?.enunciado || 'Ejercicio no disponible'}
DIFICULTAD: ${ejercicioData?.dificultad || 'básica'}
TEMA: ${ejercicioData?.tema || 'matemáticas'}

La pista debe ser:
- Clara y comprensible para el nivel del estudiante
- Que guíe hacia la solución sin dar la respuesta directamente
- Que ayude a entender el concepto matemático

Responde SOLO con un JSON válido en este formato exacto:
{
  "pista": "Pista útil para el estudiante"
}`;
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'Eres un profesor de matemáticas especializado en dar pistas educativas. Responde siempre en español y en formato JSON válido.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.5,
          max_tokens: 500
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content
      
      console.log('useAIAPI - Contenido crudo pista:', content)
      
      // Extraer JSON del contenido
      let jsonData
      try {
        jsonData = JSON.parse(content)
      } catch (e1) {
        try {
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
          if (jsonMatch) {
            jsonData = JSON.parse(jsonMatch[1])
          } else {
            const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/)
            if (codeMatch) {
              jsonData = JSON.parse(codeMatch[1])
            } else {
              const braceMatch = content.match(/\{[\s\S]*\}/)
              if (braceMatch) {
                jsonData = JSON.parse(braceMatch[0])
              } else {
                throw new Error('No se encontró JSON válido en la respuesta')
              }
            }
          }
        } catch (e2) {
          console.error('Error extrayendo JSON:', e2)
          throw new Error('No se pudo extraer JSON de la respuesta de la IA')
        }
      }
      
      console.log('useAIAPI - JSON extraído pista:', jsonData)
      
      return {
        success: true,
        data: {
          pista: jsonData.pista || 'Pista no disponible'
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('useAIAPI - Error generando pista:', err)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const generateExplanation = useCallback(async (request: ExplanationRequest, ejercicioData?: any) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('useAIAPI - Generando explicación:', request)
      
      // Usar directamente la API de Perplexity desde el frontend (igual que el chatbot)
      const API_KEY = API_KEY
      
      const prompt = `Genera una explicación detallada para el siguiente ejercicio de matemáticas:

EJERCICIO: ${ejercicioData?.enunciado || 'Ejercicio no disponible'}
RESPUESTA CORRECTA: ${ejercicioData?.respuestaCorrecta || 'No disponible'}
RESPUESTA DEL ESTUDIANTE: ${request.respuestaAlumno}
DIFICULTAD: ${ejercicioData?.dificultad || 'básica'}
TEMA: ${ejercicioData?.tema || 'matemáticas'}

La explicación debe:
- Mostrar paso a paso cómo resolver el ejercicio
- Explicar los conceptos matemáticos involucrados
- Ser clara y comprensible para el nivel del estudiante
- Incluir por qué la respuesta es correcta o incorrecta

Responde SOLO con un JSON válido en este formato exacto:
{
  "explicacion": "Explicación detallada paso a paso"
}`;
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'Eres un profesor de matemáticas especializado en explicar conceptos de manera clara y didáctica. Responde siempre en español y en formato JSON válido.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.4,
          max_tokens: 1500
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content
      
      console.log('useAIAPI - Contenido crudo explicación:', content)
      
      // Extraer JSON del contenido
      let jsonData
      try {
        jsonData = JSON.parse(content)
      } catch (e1) {
        try {
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
          if (jsonMatch) {
            jsonData = JSON.parse(jsonMatch[1])
          } else {
            const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/)
            if (codeMatch) {
              jsonData = JSON.parse(codeMatch[1])
            } else {
              const braceMatch = content.match(/\{[\s\S]*\}/)
              if (braceMatch) {
                jsonData = JSON.parse(braceMatch[0])
              } else {
                throw new Error('No se encontró JSON válido en la respuesta')
              }
            }
          }
        } catch (e2) {
          console.error('Error extrayendo JSON:', e2)
          throw new Error('No se pudo extraer JSON de la respuesta de la IA')
        }
      }
      
      console.log('useAIAPI - JSON extraído explicación:', jsonData)
      
      return {
        success: true,
        data: {
          explicacion: jsonData.explicacion || 'Explicación no disponible'
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('useAIAPI - Error generando explicación:', err)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const validateAnswer = useCallback(async (preguntaId: string, respuestaAlumno: string, ejercicioData?: any) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('useAIAPI - Validando respuesta:', { preguntaId, respuestaAlumno })
      console.log('useAIAPI - Datos del ejercicio:', ejercicioData)
      
      // Usar directamente la API de Perplexity desde el frontend (igual que el chatbot)
      const API_KEY = API_KEY
      
      const prompt = `Evalúa la siguiente respuesta de un estudiante:

EJERCICIO: ${ejercicioData?.enunciado || 'Ejercicio no disponible'}
RESPUESTA CORRECTA: ${ejercicioData?.respuestaCorrecta || 'No disponible'}
RESPUESTA DEL ESTUDIANTE: ${respuestaAlumno}

INSTRUCCIONES IMPORTANTES:
- Compara EXACTAMENTE la respuesta del estudiante con la respuesta correcta
- Si la respuesta del estudiante es EXACTAMENTE igual a la respuesta correcta, marca "esCorrecta": true
- Si la respuesta del estudiante es numéricamente equivalente a la respuesta correcta (ej: "7" = 7, "12" = 12), marca "esCorrecta": true
- Si la respuesta del estudiante es conceptualmente correcta pero expresada de forma diferente, marca "esCorrecta": true
- Solo marca "esCorrecta": false si la respuesta es claramente incorrecta
- NO interpretes el ejercicio, solo compara las respuestas

Responde SOLO con un JSON válido en este formato exacto:
{
  "esCorrecta": true/false,
  "explicacion": "Explicación detallada de por qué la respuesta es correcta o incorrecta",
  "sugerencias": ["Sugerencia 1", "Sugerencia 2"]
}`;
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'Eres un profesor de matemáticas especializado en evaluar respuestas de estudiantes. Debes ser GENEROSO al evaluar respuestas correctas. Si la respuesta del estudiante es correcta (exacta, numéricamente equivalente, o conceptualmente correcta), SIEMPRE marca "esCorrecta": true. Solo marca false si la respuesta es claramente incorrecta. Responde siempre en español y en formato JSON válido.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content
      
      console.log('useAIAPI - Contenido crudo validación:', content)
      
      // Extraer JSON del contenido
      let jsonData
      try {
        jsonData = JSON.parse(content)
      } catch (e1) {
        try {
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
          if (jsonMatch) {
            jsonData = JSON.parse(jsonMatch[1])
          } else {
            const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/)
            if (codeMatch) {
              jsonData = JSON.parse(codeMatch[1])
            } else {
              const braceMatch = content.match(/\{[\s\S]*\}/)
              if (braceMatch) {
                jsonData = JSON.parse(braceMatch[0])
              } else {
                throw new Error('No se encontró JSON válido en la respuesta')
              }
            }
          }
        } catch (e2) {
          console.error('Error extrayendo JSON:', e2)
          throw new Error('No se pudo extraer JSON de la respuesta de la IA')
        }
      }
      
      console.log('useAIAPI - JSON extraído validación:', jsonData)
      
      return {
        success: true,
        data: {
          esCorrecta: jsonData.esCorrecta || false,
          explicacion: jsonData.explicacion || 'Sin explicación disponible',
          sugerencias: jsonData.sugerencias || []
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('useAIAPI - Error validando respuesta:', err)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])


  const getEstadisticasIA = useCallback(async (fechaInicio?: string, fechaFin?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.getEstadisticasIA(fechaInicio, fechaFin)
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const generateReport = useCallback(async (request: ReportRequest) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🤖 useAIAPI - Generando reporte con IA:', request)
      
      // Usar directamente la API de Perplexity desde el frontend (igual que generateExercises)
      const { API_KEYS } = await import('../services/ai/config')
      const API_KEY = API_KEYS.PERPLEXITY
      
      const { grado, tema, ejercicios, respuestas, tiempoTotal, duracionSesion } = request;
      
      const totalEjercicios = ejercicios.length;
      const respuestasCorrectas = respuestas.filter(r => r.esCorrecta).length;
      const respuestasIncorrectas = totalEjercicios - respuestasCorrectas;
      const puntuacion = Math.round((respuestasCorrectas / totalEjercicios) * 100);

      // Detectar si es test de profesor o práctica libre
      const esTestProfesor = ejercicios.some(ej => (ej as any).correctAnswer) // Los tests de profesor tienen respuesta correcta definida
      
      const prompt = `Analiza el rendimiento de un estudiante de ${grado}° grado en matemáticas y genera un reporte detallado.

DATOS DE LA ${esTestProfesor ? 'EVALUACIÓN' : 'PRÁCTICA'}:
- Tema: ${tema}
- Total de ${esTestProfesor ? 'preguntas' : 'ejercicios'}: ${totalEjercicios}
- Respuestas correctas: ${respuestasCorrectas}
- Respuestas incorrectas: ${respuestasIncorrectas}
- Puntuación: ${puntuacion}%
- Tiempo total: ${tiempoTotal} segundos
- Duración de sesión: ${duracionSesion} minutos
- Tipo: ${esTestProfesor ? 'Test asignado por profesor' : 'Práctica libre con IA'}

${esTestProfesor ? 'PREGUNTAS DEL TEST:' : 'EJERCICIOS REALIZADOS:'}
${ejercicios.map((ej, i) => `${i+1}. ${ej.question} (Dificultad: ${ej.difficulty})`).join('\n')}

RESPUESTAS DEL ESTUDIANTE:
${respuestas.map((resp, i) => `${i+1}. Respuesta: "${resp.respuesta}" - ${resp.esCorrecta ? 'Correcta' : 'Incorrecta'} - Tiempo: ${resp.tiempoResolucion}ms${esTestProfesor ? '' : ` - Pistas: ${resp.pistasUsadas || 0}`}`).join('\n')}

Genera un reporte estructurado y comparativo que sirva como base para futuros análisis:

1. REPORTE DETALLADO (MÁXIMO 1800 caracteres):
   - RENDIMIENTO GENERAL: Puntuación, tiempo promedio por ${esTestProfesor ? 'pregunta' : 'ejercicio'}, efectividad general
   - ANÁLISIS POR ${esTestProfesor ? 'PREGUNTA' : 'EJERCICIO'}: Dificultad vs rendimiento, patrones de error específicos
   - COMPORTAMIENTO: ${esTestProfesor ? 'Tiempo de resolución, consistencia en respuestas' : 'Uso de pistas, tiempo de resolución, consistencia en respuestas'}
   - FORTALEZAS IDENTIFICADAS: Áreas donde el estudiante demuestra dominio
   - ÁREAS DE MEJORA: Conceptos específicos que requieren refuerzo
   - NIVEL ACTUAL: Evaluación del grado de comprensión y preparación
   - PROGRESO OBSERVADO: Comparación con expectativas del grado
   ${esTestProfesor ? '- EVALUACIÓN DOCENTE: Recomendaciones específicas para el profesor sobre el progreso del estudiante' : ''}

2. CONSEJOS PERSONALIZADOS (MÁXIMO 1200 caracteres):
   - PRÓXIMOS OBJETIVOS: Metas específicas para la siguiente ${esTestProfesor ? 'evaluación' : 'sesión'}
   - ESTRATEGIAS DE ESTUDIO: Métodos recomendados basados en el rendimiento
   - ${esTestProfesor ? 'ACTIVIDADES DE REFUERZO' : 'EJERCICIOS SUGERIDOS'}: Tipo y dificultad recomendada para práctica
   - PRÓXIMOS EJERCICIOS DE PRÁCTICA: Recomendaciones específicas para la IA sobre qué tipos de ejercicios generar, temas a reforzar y niveles de dificultad adaptados al progreso del estudiante
   - APOYO FAMILIAR: Cómo pueden ayudar los padres/educadores
   - SEGUIMIENTO: Qué observar en futuras ${esTestProfesor ? 'evaluaciones' : 'sesiones'} para medir progreso
   ${esTestProfesor ? '- COMUNICACIÓN CON DOCENTE: Aspectos importantes para discutir con el profesor' : ''}

IMPORTANTE: Estructura el reporte para facilitar comparaciones futuras. Incluye métricas específicas y observaciones objetivas que permitan evaluar progreso en sesiones posteriores. ${esTestProfesor ? 'Enfócate en el rendimiento académico formal y las recomendaciones pedagógicas.' : ''}

Responde SOLO con un JSON válido en este formato exacto:
{
  "reporteDetallado": "Análisis completo del rendimiento del estudiante basado en todos los logs detallados...",
  "consejos": "Recomendaciones específicas y personalizadas para mejorar el aprendizaje..."
}`;
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'Eres un experto en análisis educativo y psicología del aprendizaje. Analiza el rendimiento de estudiantes y genera reportes detallados con recomendaciones personalizadas. Responde siempre en español y en formato JSON válido.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 3000
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content
      
      console.log('🤖 useAIAPI - Contenido crudo del reporte:', content)
      
      // Extraer JSON del contenido
      let jsonData
      try {
        // Intentar parsear directamente
        jsonData = JSON.parse(content)
      } catch (e1) {
        try {
          // Buscar JSON en bloques de código
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
          if (jsonMatch) {
            jsonData = JSON.parse(jsonMatch[1])
          } else {
            // Buscar JSON en cualquier bloque de código
            const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/)
            if (codeMatch) {
              jsonData = JSON.parse(codeMatch[1])
            } else {
              // Buscar JSON entre llaves
              const braceMatch = content.match(/\{[\s\S]*\}/)
              if (braceMatch) {
                jsonData = JSON.parse(braceMatch[0])
              } else {
                throw new Error('No se encontró JSON válido en la respuesta')
              }
            }
          }
        } catch (e2) {
          console.error('Error extrayendo JSON:', e2)
          console.error('Contenido recibido:', content)
          throw new Error('No se pudo extraer JSON de la respuesta de la IA')
        }
      }
      
      console.log('🤖 useAIAPI - Reporte generado exitosamente:', jsonData)
      return jsonData
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    generateExercises,
    generateHint,
    generateExplanation,
    validateAnswer,
    getEstadisticasIA,
    generateReport,
    obtenerConsejosPrevios,
    loading,
    error,
    clearError: () => setError(null)
  }
}

export default useAIAPI



