// ===== CONFIGURACIÓN SIMPLE DE IA =====
// Cambia solo esta línea para cambiar el proveedor activo

export const ACTIVE_PROVIDER = 'perplexity' // 'gemini', 'ollama', 'perplexity'

// ===== CONFIGURACIÓN DE API KEYS =====
// Solo necesitas configurar la API key del proveedor activo

// Función para obtener variables de entorno de forma segura
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  try {
    // En Vite, las variables de entorno están disponibles como import.meta.env
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const value = (import.meta.env as any)[key]
      if (value) return value
    }
    
    // Fallback para otros entornos
    try {
      // @ts-ignore
      if (typeof process !== 'undefined' && process.env && process.env[key]) {
        // @ts-ignore
        return process.env[key]
      }
    } catch (e) {
      // Ignorar errores de process
    }
  } catch (error) {
    console.warn(`Error accessing environment variable ${key}:`, error)
  }
  
  return defaultValue
}

export const API_KEYS = {
  // Google Gemini (Recomendado - GRATIS)
  GEMINI: getEnvVar('REACT_APP_GEMINI_API_KEY', 'your_gemini_api_key_here'),
  
  // Perplexity (Requiere pago)
  PERPLEXITY: getEnvVar('REACT_APP_PERPLEXITY_API_KEY', 'your_perplexity_api_key_here'),
  
  // Ollama (Local - Opcional)
  OLLAMA_BASE_URL: getEnvVar('REACT_APP_OLLAMA_BASE_URL', 'http://localhost:11434')
}

// ===== CONFIGURACIÓN DE MODELOS =====
// Configuración específica para cada proveedor

export const PROVIDER_CONFIGS = {
  gemini: {
    enabled: true,
    apiKey: API_KEYS.GEMINI,
    models: {
      'gemini-2.0-flash': {
        name: 'Gemini 2.0 Flash',
        description: 'Modelo más avanzado y eficiente (Recomendado)',
        maxTokens: 8192,
        temperature: 0.7,
        recommended: true
      },
      'gemini-2.0-flash-lite': {
        name: 'Gemini 2.0 Flash Lite',
        description: 'Modelo ligero y rápido',
        maxTokens: 8192,
        temperature: 0.6,
        recommended: false
      },
      'gemini-1.5-pro': {
        name: 'Gemini 1.5 Pro',
        description: 'Modelo avanzado (Deprecado)',
        maxTokens: 8192,
        temperature: 0.5,
        recommended: false
      }
    },
    defaultModel: 'gemini-2.0-flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta'
  },

  ollama: {
    enabled: true,
    baseUrl: API_KEYS.OLLAMA_BASE_URL,
    models: {
      'llama3.2:3b': {
        name: 'Llama 3.2 3B',
        description: 'Modelo local rápido y eficiente',
        maxTokens: 2048,
        temperature: 0.7,
        recommended: true
      },
      'mistral:7b': {
        name: 'Mistral 7B',
        description: 'Modelo local optimizado para matemáticas',
        maxTokens: 2048,
        temperature: 0.6,
        recommended: false
      }
    },
    defaultModel: 'llama3.2:3b',
    timeout: 60000
  },

  perplexity: {
    enabled: true,
    apiKey: API_KEYS.PERPLEXITY,
    models: {
      'sonar': {
        name: 'Sonar',
        description: 'Modelo de búsqueda ligero (Recomendado)',
        maxTokens: 8192,
        temperature: 0.7,
        recommended: true
      },
      'sonar-pro': {
        name: 'Sonar Pro',
        description: 'Búsqueda avanzada con mejores resultados',
        maxTokens: 8192,
        temperature: 0.6,
        recommended: false
      }
    },
    defaultModel: 'sonar',
    baseUrl: 'https://api.perplexity.ai'
  }
}

// ===== FUNCIONES DE UTILIDAD =====

export function getActiveProvider() {
  return ACTIVE_PROVIDER
}

export function getActiveProviderConfig() {
  return PROVIDER_CONFIGS[ACTIVE_PROVIDER as keyof typeof PROVIDER_CONFIGS]
}

export function isProviderEnabled(provider: string) {
  return PROVIDER_CONFIGS[provider as keyof typeof PROVIDER_CONFIGS]?.enabled || false
}

export function getDefaultModel() {
  const config = getActiveProviderConfig()
  return config?.defaultModel || 'unknown'
}

// ===== VALIDACIÓN =====

export function validateConfiguration() {
  const provider = getActiveProvider()
  const config = getActiveProviderConfig()
  
  if (!config) {
    throw new Error(`Proveedor '${provider}' no está configurado`)
  }
  
  if (!config.enabled) {
    throw new Error(`Proveedor '${provider}' está deshabilitado`)
  }
  
  if (provider === 'gemini' && !(config as any).apiKey) {
    throw new Error('API Key de Gemini no está configurada. Agrega REACT_APP_GEMINI_API_KEY a tu archivo .env.local')
  }
  
  if (provider === 'perplexity' && !(config as any).apiKey) {
    throw new Error('API Key de Perplexity no está configurada. Agrega REACT_APP_PERPLEXITY_API_KEY a tu archivo .env.local')
  }
  
  if (provider === 'ollama' && !config.baseUrl) {
    throw new Error('URL base de Ollama no está configurada. Agrega REACT_APP_OLLAMA_BASE_URL a tu archivo .env.local')
  }
  
  return true
}

// ===== INSTRUCCIONES DE USO =====

/*
INSTRUCCIONES DE USO:

1. CAMBIAR PROVEEDOR:
   - Cambia la línea: export const ACTIVE_PROVIDER = 'perplexity'
   - Opciones: 'gemini', 'ollama', 'perplexity'

2. CONFIGURAR API KEY:
   - Crea un archivo .env.local en la raíz del proyecto
   - Agrega la variable correspondiente:
     * Para Gemini: REACT_APP_GEMINI_API_KEY=tu_api_key_aqui
     * Para Perplexity: REACT_APP_PERPLEXITY_API_KEY=tu_api_key_aqui
     * Para Ollama: REACT_APP_OLLAMA_BASE_URL=http://localhost:11434

3. OBTENER API KEYS:
   - Gemini: https://makersuite.google.com/app/apikey (GRATIS)
   - Perplexity: https://www.perplexity.ai/settings/api (PAGO)
   - Ollama: https://ollama.ai (LOCAL)

4. REINICIAR SERVIDOR:
   - Después de cambiar la configuración, reinicia el servidor:
     npm start

EJEMPLO DE ARCHIVO .env.local:
REACT_APP_PERPLEXITY_API_KEY=your_perplexity_api_key_here
REACT_APP_API_URL=http://localhost:3001/api
*/
