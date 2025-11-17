// Servicio de IA independiente para el backend
const axios = require('axios');

// Configuración de IA
const AI_CONFIG = {
  perplexity: {
    apiKey: process.env.PERPLEXITY_API_KEY,
    baseUrl: 'https://api.perplexity.ai/chat/completions',
    model: 'sonar'
  }
};

class AIServiceBackend {
  constructor() {
    this.config = AI_CONFIG.perplexity;
    this.useRealAPI = this.config.apiKey && this.config.apiKey !== 'pplx-1234567890abcdef1234567890abcdef12345678';
  }

  async makeRequest(prompt, maxTokens = 1000) {
    try {
      console.log('Backend AI Service - Haciendo petición a Perplexity...');
      console.log('Modelo:', this.config.model);
      console.log('API Key presente:', !!this.config.apiKey);
      
      if (!this.config.apiKey || this.config.apiKey === 'pplx-1234567890abcdef1234567890abcdef12345678') {
        throw new Error('API Key de Perplexity no configurada. Por favor, configura PERPLEXITY_API_KEY en el archivo .env');
      }
      
      const response = await axios.post(this.config.baseUrl, {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente especializado en matemáticas para estudiantes de primaria y secundaria. Responde siempre en español y en formato JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Backend AI Service - Respuesta recibida:', response.data);
      return response.data;
    } catch (error) {
      console.error('Backend AI Service - Error en petición:', error.response?.data || error.message);
      throw new Error(`Error de IA: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  extractJsonFromContent(content) {
    try {
      // Intentar parsear directamente
      return JSON.parse(content);
    } catch (e1) {
      try {
        // Buscar JSON en bloques de código
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1]);
        }
        
        // Buscar JSON en cualquier bloque de código
        const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          return JSON.parse(codeMatch[1]);
        }
        
        // Buscar JSON entre llaves
        const braceMatch = content.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          return JSON.parse(braceMatch[0]);
        }
        
        throw new Error('No se encontró JSON válido en la respuesta');
      } catch (e2) {
        console.error('Error extrayendo JSON:', e2);
        console.error('Contenido recibido:', content);
        throw new Error('No se pudo extraer JSON de la respuesta de la IA');
      }
    }
  }

  async generateExercises(request) {
    try {
      const { grado, tema, dificultad, cantidad, language = 'es', alumnoId } = request;
      
      // Usar configuración por defecto para ejercicios
      let recomendaciones = null;

      // Construir prompt personalizado basado en reportes
      let prompt = `Genera ${cantidad} ejercicios de matemáticas para ${grado} grado sobre el tema "${tema}"`;
      
      if (recomendaciones) {
        prompt += `\n\nPERSONALIZACIÓN BASADA EN RENDIMIENTO PREVIO:
- Nivel de dificultad sugerido: ${recomendaciones.nivelDificultadSugerido}
- Temas prioritarios: ${recomendaciones.temasPrioritarios.join(', ')}
- Temas a consolidar: ${recomendaciones.temasConsolidar.join(', ')}
- Estrategias de aprendizaje: ${recomendaciones.estrategiasAprendizaje.join(', ')}
- Próximos objetivos: ${recomendaciones.proximosObjetivos.join(', ')}

Adapta los ejercicios considerando estas recomendaciones para maximizar el aprendizaje del estudiante.`;
      } else {
        prompt += ` con dificultad ${dificultad}`;
      }

      prompt += `\n\nResponde SOLO con un JSON válido en este formato exacto:
{
  "ejercicios": [
    {
      "id": "ej_1",
      "enunciado": "Enunciado del ejercicio",
      "opciones": ["opción A", "opción B", "opción C", "opción D"],
      "respuestaCorrecta": "opción correcta",
      "explicacion": "Explicación detallada de la solución",
      "pistas": ["Pista 1", "Pista 2"],
      "dificultad": "${recomendaciones ? recomendaciones.nivelDificultadSugerido : dificultad}",
      "tema": "${tema}",
      "grado": "${grado}"
    }
  ],
  "metadata": {
    "totalGenerados": ${cantidad},
    "tiempoEstimado": "X minutos",
    "dificultad": "${recomendaciones ? recomendaciones.nivelDificultadSugerido : dificultad}",
    "tema": "${tema}",
    "personalizado": ${recomendaciones ? true : false}
  }
}`;

      const response = await this.makeRequest(prompt, 2000);
      const content = response.choices[0].message.content;
      
      console.log('Backend AI Service - Contenido crudo:', content);
      
      const jsonData = this.extractJsonFromContent(content);
      console.log('Backend AI Service - JSON extraído:', jsonData);
      
      return {
        success: true,
        data: jsonData,
        model: this.config.model,
        personalizado: !!recomendaciones,
        usage: {
          prompt: 0,
          completion: 0,
          total: 0
        }
      };
    } catch (error) {
      console.error('Backend AI Service - Error generando ejercicios:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido'
      };
    }
  }

  async generateHint(request) {
    try {
      const { exerciseStatement, difficulty, topic, currentHints = [] } = request;
      
      const prompt = `El estudiante está resolviendo este ejercicio de matemáticas:

"${exerciseStatement}"

Dificultad: ${difficulty}
Tema: ${topic}
Pistas ya dadas: ${currentHints.join(', ') || 'Ninguna'}

Genera una pista útil que ayude al estudiante sin dar la respuesta directamente. La pista debe ser progresiva (más específica si ya hay pistas previas).

Responde SOLO con un JSON válido:
{
  "pista": "Tu pista aquí"
}`;

      const response = await this.makeRequest(prompt, 500);
      const content = response.choices[0].message.content;
      
      const jsonData = this.extractJsonFromContent(content);
      
      return {
        success: true,
        data: { pista: jsonData.pista },
        model: this.config.model,
        usage: {
          prompt: 0,
          completion: 0,
          total: 0
        }
      };
    } catch (error) {
      console.error('Backend AI Service - Error generando pista:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido'
      };
    }
  }

  async generateExplanation(request) {
    try {
      const { exerciseStatement, correctAnswer, studentAnswer, difficulty, topic } = request;
      
      const prompt = `El estudiante resolvió este ejercicio de matemáticas:

Ejercicio: "${exerciseStatement}"
Respuesta correcta: "${correctAnswer}"
Respuesta del estudiante: "${studentAnswer}"
Dificultad: ${difficulty}
Tema: ${topic}

Genera una explicación detallada que:
1. Analice la respuesta del estudiante
2. Explique por qué es correcta o incorrecta
3. Muestre el proceso paso a paso para llegar a la respuesta correcta
4. Proporcione consejos para mejorar

Responde SOLO con un JSON válido:
{
  "explicacion": "Tu explicación detallada aquí"
}`;

      const response = await this.makeRequest(prompt, 1000);
      const content = response.choices[0].message.content;
      
      const jsonData = this.extractJsonFromContent(content);
      
      return {
        success: true,
        data: { explicacion: jsonData.explicacion },
        model: this.config.model,
        usage: {
          prompt: 0,
          completion: 0,
          total: 0
        }
      };
    } catch (error) {
      console.error('Backend AI Service - Error generando explicación:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido'
      };
    }
  }

  async validateAnswer(request) {
    try {
      const { exerciseStatement, correctAnswer, studentAnswer, difficulty, topic } = request;
      
      const prompt = `Valida si la respuesta del estudiante es correcta para este ejercicio:

Ejercicio: "${exerciseStatement}"
Respuesta correcta: "${correctAnswer}"
Respuesta del estudiante: "${studentAnswer}"
Dificultad: ${difficulty}
Tema: ${topic}

Considera variaciones en formato, espacios, y formas equivalentes de escribir la respuesta.

Responde SOLO con un JSON válido:
{
  "esCorrecta": true/false,
  "respuestaCorrecta": "respuesta correcta",
  "explicacion": "breve explicación de por qué es correcta o incorrecta"
}`;

      const response = await this.makeRequest(prompt, 300);
      const content = response.choices[0].message.content;
      
      const jsonData = this.extractJsonFromContent(content);
      
      return {
        success: true,
        data: {
          esCorrecta: jsonData.esCorrecta,
          respuestaCorrecta: jsonData.respuestaCorrecta,
          explicacion: jsonData.explicacion
        },
        model: this.config.model,
        usage: {
          prompt: 0,
          completion: 0,
          total: 0
        }
      };
    } catch (error) {
      console.error('Backend AI Service - Error validando respuesta:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido'
      };
    }
  }
}

// Crear instancia singleton
const aiServiceInstance = new AIServiceBackend();

// Funciones de conveniencia
const generateExercises = (request) => aiServiceInstance.generateExercises(request);
const generateHint = (request) => aiServiceInstance.generateHint(request);
const generateExplanation = (request) => aiServiceInstance.generateExplanation(request);
const validateAnswer = (request) => aiServiceInstance.validateAnswer(request);

module.exports = {
  generateExercises,
  generateHint,
  generateExplanation,
  validateAnswer,
  AIServiceBackend
};