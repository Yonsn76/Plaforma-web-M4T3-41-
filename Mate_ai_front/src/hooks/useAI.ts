import { useState, useCallback } from 'react'
import AIService, { 
  ExerciseRequest, 
  AIProvider 
} from '../services/ai'

export const useAI = () => {
  const [aiService] = useState(() => new AIService())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateExercises = useCallback(async (request: ExerciseRequest) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await aiService.generateExercises(request)
      
      if (!response.success) {
        throw new Error(response.error || 'Error generando ejercicios')
      }

      return response.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [aiService])


  const testProvider = useCallback(async (provider: AIProvider) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await aiService.testProvider(provider)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [aiService])

  const getAvailableProviders = useCallback(() => {
    return aiService.getAvailableProviders()
  }, [aiService])

  return {
    generateExercises,
    testProvider,
    getAvailableProviders,
    loading,
    error,
    clearError: () => setError(null)
  }
}

export default useAI

