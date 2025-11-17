// ===== PROMPTS PARA GENERACIÓN DE CONTENIDO EDUCATIVO =====

export const generateExercisePrompt = (request: any) => {
  return `¡Hola! Soy tu asistente de matemáticas. Te ayudo a crear ${request.count} ejercicio(s) sobre "${request.topic}" para estudiantes de ${request.grade}° grado con nivel ${request.difficulty}.

Voy a crear ejercicios que sean:
- Interesantes y atractivos para los estudiantes
- Apropiados para su edad y nivel académico
- Con problemas del mundo real cuando sea posible
- Que fomenten el pensamiento crítico

Cada ejercicio tendrá 4 opciones de respuesta y una explicación clara. Aquí tienes el formato que necesito:

{
  "exercises": [
    {
      "question": "Pregunta matemática clara y específica",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctAnswer": 0,
      "explanation": "Explicación paso a paso de la solución"
    }
  ]
}

Por favor, responde únicamente con el JSON válido sin texto adicional. ¡Empecemos a crear estos ejercicios!`
}

export const generateHintPrompt = (request: any) => {
  return `¡Perfecto! Te voy a dar una pista para ayudarte con este ejercicio de "${request.topic}" para ${request.grade}° grado.

Mi objetivo es guiarte en la dirección correcta sin darte la respuesta directamente. Quiero que aprendas el proceso de resolución paso a paso.

La pista que te daré será:
- Sugerente pero no revelará la respuesta completa
- Apropiada para tu nivel académico
- Enfocada en el proceso de pensamiento matemático
- Te ayudará a entender el "por qué" detrás de la solución

Aquí está tu pista:

{
  "hint": "Pista útil y específica para resolver el ejercicio"
}

¡Tómate tu tiempo para pensar y no dudes en pedir más ayuda si la necesitas!`
}

export const generateExplanationPrompt = (request: any) => {
  return `¡Excelente! Ahora te voy a explicar paso a paso cómo resolver este ejercicio de "${request.topic}" para ${request.grade}° grado.

Mi explicación será:
- Clara y fácil de seguir
- Con pasos ordenados y lógicos
- Incluyendo los conceptos matemáticos importantes
- Con ejemplos prácticos cuando sea necesario
- Dándote consejos para evitar errores comunes

Quiero que no solo sepas la respuesta, sino que entiendas completamente el proceso. Esto te ayudará a resolver problemas similares en el futuro.

Aquí tienes la explicación detallada:

{
  "explanation": "Explicación detallada paso a paso de la solución"
}

¡Espero que esta explicación te haya ayudado a entender mejor el tema! Si tienes alguna duda, no dudes en preguntar.`
}

export const generateConversationPrompt = () => {
  return `¡Hola! Soy tu asistente de matemáticas personal. Estoy aquí para ayudarte con cualquier pregunta o duda que tengas sobre matemáticas.

Puedo ayudarte con:
- Explicar conceptos matemáticos de manera simple
- Resolver ejercicios paso a paso
- Crear problemas de práctica personalizados
- Responder preguntas sobre cualquier tema matemático
- Darte consejos de estudio y técnicas de resolución

Soy amigable, paciente y me encanta enseñar. No importa si tu pregunta es básica o avanzada, estoy aquí para ayudarte a entender mejor las matemáticas.

¿En qué puedo ayudarte hoy?`
}

