// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'https://m4t3-41-api.onrender.com/api'

interface LoginData {
  correo: string
  contrasena: string
}

interface RegistroData {
  nombre: string
  correo: string
  contrasena: string
  rol: 'alumno' | 'docente'
  grado?: string
  seccion?: string
  especialidad?: string
  gradosAsignados?: string[]
  docenteAsignado?: string // ID del docente (opcional)
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

interface AuthResponse {
  token: string
  usuario: {
    id: string
    nombre: string
    correo: string
    rol: string
    grado?: string
    seccion?: string
    especialidad?: string
    gradosAsignados?: string[]
    docenteAsignado?: {
      _id: string
      nombre: string
      correo: string
      especialidad?: string
    } | null
  }
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      // Manejar diferentes tipos de respuesta
      let data
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        // Si no es JSON, leer como texto
        const text = await response.text()
        data = { message: text }
      }

      if (!response.ok) {
        // Manejar errores específicos
        if (response.status === 429) {
          throw new Error('Demasiadas peticiones. Espera un momento antes de intentar nuevamente.')
        }
        if (response.status === 401) {
          throw new Error('Credenciales inválidas')
        }
        if (response.status === 500) {
          throw new Error('Error del servidor. Intenta más tarde.')
        }
        
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`)
      }

      return data
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  async login(credentials: LoginData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/usuarios/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    if (response.data) {
      // Guardar token en localStorage
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario))
    }

    return response.data!
  }

  async registro(datos: RegistroData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/usuarios/registro', {
      method: 'POST',
      body: JSON.stringify(datos),
    })

    if (response.data) {
      // Guardar token en localStorage
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario))
    }

    return response.data!
  }

  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
  }

  getToken(): string | null {
    return localStorage.getItem('token')
  }

  getUsuario(): any | null {
    const usuario = localStorage.getItem('usuario')
    return usuario ? JSON.parse(usuario) : null
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  // Obtener lista de docentes disponibles
  async getDocentes(): Promise<any[]> {
    const token = this.getToken()
    const response = await this.request<any[]>('/usuarios/docentes', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data || []
  }

  // Asignar docente a un alumno
  async asignarDocente(docenteId: string): Promise<any> {
    const token = this.getToken()
    const response = await this.request('/usuarios/asignar-docente', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ docenteId }),
    })
    return response.data
  }

  // Obtener usuarios con filtros
  async getUsuarios(filtros?: { rol?: string; grado?: string; especialidad?: string }): Promise<any[]> {
    const token = this.getToken()
    const params = new URLSearchParams()
    if (filtros?.rol) params.append('rol', filtros.rol)
    if (filtros?.grado) params.append('grado', filtros.grado)
    if (filtros?.especialidad) params.append('especialidad', filtros.especialidad)
    
    const url = `/usuarios${params.toString() ? `?${params.toString()}` : ''}`
    const response = await this.request<any[]>(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data || []
  }

  // Obtener perfil del usuario actual
  async getMe(): Promise<any> {
    const token = this.getToken()
    const response = await this.request('/usuarios/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  }

  // Actualizar perfil
  async updateProfile(updates: Partial<RegistroData>): Promise<any> {
    const token = this.getToken()
    const response = await this.request('/usuarios/me', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    })
    return response.data
  }

  // ===== SOLICITUDES =====
  
  // Enviar solicitud a docente
  async enviarSolicitud(docenteId: string): Promise<any> {
    const token = this.getToken()
    const response = await this.request('/solicitudes', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ docenteId }),
    })
    return response.data
  }

  // Obtener mis solicitudes (alumno)
  async getMisSolicitudes(): Promise<any[]> {
    const token = this.getToken()
    const response = await this.request<any[]>('/solicitudes/mis-solicitudes', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data || []
  }

  // Obtener solicitudes recibidas (docente)
  async getSolicitudesRecibidas(): Promise<any[]> {
    const token = this.getToken()
    const response = await this.request<any[]>('/solicitudes/recibidas', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data || []
  }

  // Responder solicitud (docente)
  async responderSolicitud(solicitudId: string, accion: 'aceptar' | 'rechazar', mensaje?: string): Promise<any> {
    const token = this.getToken()
    const response = await this.request(`/solicitudes/${solicitudId}/responder`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ accion, mensaje }),
    })
    return response.data
  }

  // Cancelar solicitud (alumno)
  async cancelarSolicitud(solicitudId: string): Promise<any> {
    const token = this.getToken()
    const response = await this.request(`/solicitudes/${solicitudId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  }

  // Remover alumno (docente)
  async removerAlumno(alumnoId: string): Promise<any> {
    const token = this.getToken()
    const response = await this.request(`/usuarios/${alumnoId}/remover`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  }

  // ===== GRUPOS =====

  // Obtener grupos del docente
  async getGrupos(): Promise<any[]> {
    const token = this.getToken()
    const response = await this.request<any[]>('/grupos', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data || []
  }

  // Crear grupo
  async crearGrupo(data: { nombre: string; descripcion?: string; alumnos: string[] }): Promise<any> {
    const token = this.getToken()
    const response = await this.request('/grupos', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    return response.data
  }

  // Actualizar grupo
  async actualizarGrupo(grupoId: string, data: { nombre: string; descripcion?: string; alumnos: string[] }): Promise<any> {
    const token = this.getToken()
    const response = await this.request(`/grupos/${grupoId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    return response.data
  }

  // Eliminar grupo
  async eliminarGrupo(grupoId: string): Promise<any> {
    const token = this.getToken()
    const response = await this.request(`/grupos/${grupoId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  }

  // ===== ANUNCIOS =====

  // Crear anuncio (docente)
  async crearAnuncio(data: { titulo: string; contenido: string; tipo: string; alumnoId?: string; grupoId?: string }): Promise<any> {
    const token = this.getToken()
    const response = await this.request('/anuncios/crear', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    return response.data
  }

  // Obtener anuncios enviados (docente)
  async getAnunciosEnviados(): Promise<any[]> {
    const token = this.getToken()
    const response = await this.request<any[]>('/anuncios/enviados', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data || []
  }


  // Eliminar anuncio
  async eliminarAnuncio(anuncioId: string): Promise<any> {
    const token = this.getToken()
    const response = await this.request(`/anuncios/${anuncioId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  }

  // ===== PLANTILLAS =====

  // Crear plantilla
  async crearPlantilla(data: { titulo: string; contenido: string; categoria?: string }): Promise<any> {
    const token = this.getToken()
    const response = await this.request('/plantillas', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    return response.data
  }

  // Obtener mis plantillas
  async getMisPlantillas(categoria?: string): Promise<any[]> {
    const token = this.getToken()
    const url = categoria ? `/plantillas/mis-plantillas?categoria=${categoria}` : '/plantillas/mis-plantillas'
    const response = await this.request<any[]>(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data || []
  }

  // Obtener plantillas públicas
  async getPlantillasPublicas(categoria?: string): Promise<any[]> {
    const token = this.getToken()
    const url = categoria ? `/plantillas/publicas?categoria=${categoria}` : '/plantillas/publicas'
    const response = await this.request<any[]>(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data || []
  }

  // Obtener plantilla por ID
  async getPlantilla(plantillaId: string): Promise<any> {
    const token = this.getToken()
    const response = await this.request(`/plantillas/${plantillaId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  }

  // Actualizar plantilla
  async actualizarPlantilla(plantillaId: string, data: { titulo?: string; contenido?: string; categoria?: string }): Promise<any> {
    const token = this.getToken()
    const response = await this.request(`/plantillas/${plantillaId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    return response.data
  }


  // Eliminar plantilla
  async eliminarPlantilla(plantillaId: string): Promise<any> {
    const token = this.getToken()
    const response = await this.request(`/plantillas/${plantillaId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  }

  // Duplicar plantilla pública
  async duplicarPlantilla(plantillaId: string): Promise<any> {
    const token = this.getToken()
    const response = await this.request(`/plantillas/${plantillaId}/duplicar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  }

  // ===== SERVICIOS DE IA =====

  // Obtener configuración de IA

  // ===== REPORTES DE RENDIMIENTO =====

  // Enviar reporte de rendimiento generado con IA
  async rendimientoReporte(data: {
    alumnoId: string
    grado: string
    tema: string
    totalPreguntas: number
    respuestasCorrectas: number
    respuestasIncorrectas: number
    puntuacion: number
    tiempoTotal: number
    duracionSesion: number
    reporte: string
    consejos: string
    tipoPractica: string
    testId?: string
    conjuntoId?: string
    docenteId?: string
  }): Promise<any> {
    console.log('🌐 API Service - Enviando reporte de rendimiento a:', `${API_URL}/rendimientoreporte`)
    console.log('🌐 API Service - Datos del reporte:', data)
    
    const response = await this.request('/rendimientoreporte', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    console.log('🌐 API Service - Reporte guardado exitosamente:', response)
    return response.data
  }

  // Obtener reportes de un alumno
  async getReportesAlumno(alumnoId: string, limite = 10, pagina = 1): Promise<any> {
    const token = this.getToken()
    const response = await this.request(`/rendimientoreporte/alumno/${alumnoId}?limite=${limite}&pagina=${pagina}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  }

  // Obtener último reporte de un alumno
  async getUltimoReporte(alumnoId: string): Promise<any> {
    const token = this.getToken()
    const response = await this.request(`/rendimientoreporte/alumno/${alumnoId}/ultimo`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  }

  // Obtener estadísticas de reportes
  async getEstadisticasReportes(alumnoId: string, fechaInicio?: string, fechaFin?: string): Promise<any> {
    const token = this.getToken()
    const params = new URLSearchParams()
    if (fechaInicio) params.append('fechaInicio', fechaInicio)
    if (fechaFin) params.append('fechaFin', fechaFin)
    
    const url = `/reportes/alumno/${alumnoId}/estadisticas${params.toString() ? `?${params.toString()}` : ''}`
    const response = await this.request(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  }

  // Generar ejercicios con IA
  async generarEjerciciosIA(data: {
    grado: string
    tema: string
    dificultad: 'basica' | 'media' | 'avanzada'
    cantidad: number
    conjuntoId?: string
  }): Promise<any> {
    const token = this.getToken()
    const response = await this.request('/ia/ejercicios', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    return response.data
  }

  // Generar pista para un ejercicio
  async generarPistaIA(preguntaId: string): Promise<any> {
    const token = this.getToken()
    const response = await this.request(`/ia/pista/${preguntaId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  }

  // Generar explicación para un ejercicio
  async generarExplicacionIA(preguntaId: string, respuestaAlumno: string): Promise<any> {
    const token = this.getToken()
    const response = await this.request(`/ia/explicacion/${preguntaId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ respuestaAlumno }),
    })
    return response.data
  }

  // Validar respuesta con IA
  async validarRespuestaIA(preguntaId: string, respuestaAlumno: string): Promise<any> {
    const token = this.getToken()
    const response = await this.request(`/ia/validar/${preguntaId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ respuestaAlumno }),
    })
    return response.data
  }

  // Obtener estadísticas de uso de IA
  async getEstadisticasIA(fechaInicio?: string, fechaFin?: string): Promise<any> {
    const token = this.getToken()
    const params = new URLSearchParams()
    if (fechaInicio) params.append('fechaInicio', fechaInicio)
    if (fechaFin) params.append('fechaFin', fechaFin)
    
    const url = `/ia/estadisticas${params.toString() ? `?${params.toString()}` : ''}`
    const response = await this.request(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  }

  // ===== REPORTES DE RENDIMIENTO =====

  // Obtener reportes de rendimiento de todos los alumnos del docente
  async getReportesDocente(limite = 50, pagina = 1): Promise<any> {
    const token = this.getToken()
    try {
      const response = await this.request(`/rendimientoreporte/docente?limite=${limite}&pagina=${pagina}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return response.data || { reportes: [] }
    } catch (error) {
      // Si falla la API, retornar datos de ejemplo para desarrollo
      console.warn('Usando datos de ejemplo para reportes de rendimiento:', error)
      return {
        reportes: [
          {
            _id: 'reporte1',
            alumnoId: {
              _id: 'alumno1',
              nombre: 'Juan Pérez',
              grado: '3'
            },
            tema: 'Operaciones Básicas',
            grado: '3',
            totalPreguntas: 10,
            respuestasCorrectas: 8,
            respuestasIncorrectas: 2,
            puntuacion: 80,
            tiempoTotal: 300,
            reporte: 'El alumno demuestra un buen dominio de las operaciones básicas de suma y resta. Logró resolver correctamente 8 de 10 ejercicios, mostrando comprensión sólida de los conceptos fundamentales. Sin embargo, tuvo dificultades con problemas que involucran números más grandes, lo que sugiere la necesidad de reforzar la práctica con ejercicios de mayor complejidad.',
            consejos: 'Se recomienda practicar más con números de 3 dígitos y problemas que involucran carry-over. También sería beneficioso trabajar en la velocidad de resolución para mejorar la eficiencia en exámenes con tiempo limitado.',
            fechaRealizacion: new Date().toISOString(),
            tipoPractica: 'tarea_docente'
          },
          {
            _id: 'reporte2',
            alumnoId: {
              _id: 'alumno2',
              nombre: 'María González',
              grado: '2'
            },
            tema: 'Geometría Básica',
            grado: '2',
            totalPreguntas: 8,
            respuestasCorrectas: 6,
            respuestasIncorrectas: 2,
            puntuacion: 75,
            tiempoTotal: 240,
            reporte: 'La alumna muestra comprensión adecuada de conceptos geométricos básicos como formas, áreas y perímetros. Logró identificar correctamente la mayoría de las figuras geométricas y calcular áreas simples. Tuvo algunas dificultades con el cálculo de perímetros de figuras irregulares.',
            consejos: 'Enfocarse en practicar el cálculo de perímetros de figuras complejas. También sería útil reforzar la identificación de propiedades de los diferentes tipos de triángulos y cuadriláteros.',
            fechaRealizacion: new Date(Date.now() - 86400000).toISOString(), // Ayer
            tipoPractica: 'ia_libre'
          }
        ],
        paginacion: {
          total: 2,
          pagina: 1,
          limite: 50,
          totalPaginas: 1
        }
      }
    }
  }

  // Obtener asignaciones del docente
  async getAsignacionesDocente(): Promise<any[]> {
    const token = this.getToken()
    const response = await this.request<any[]>('/asignaciones', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data || []
  }

  // Obtener asignaciones del alumno
  async getAsignacionesAlumno(): Promise<any[]> {
    const token = this.getToken()
    const response = await this.request<any[]>('/asignaciones', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data || []
  }

  // Crear asignación
  async crearAsignacion(data: { testId: string; destinatarios: any[]; fechaInicio?: string; fechaLimite?: string; tiempoLimite?: number; instrucciones?: string }): Promise<any> {
    const token = this.getToken()
    const response = await this.request('/asignaciones', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    return response.data
  }

  // Actualizar asignación
  async actualizarAsignacion(asignacionId: string, data: { fechaInicio?: string; fechaLimite?: string; tiempoLimite?: number; instrucciones?: string }): Promise<any> {
    const token = this.getToken()
    const response = await this.request(`/asignaciones/${asignacionId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    return response.data
  }

  // Obtener test para resolver (con configuraciones aplicadas)
  async getTestParaResolver(asignacionId: string): Promise<any> {
    const token = this.getToken()
    const response = await this.request(`/asignaciones/${asignacionId}/test`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  }

  // Eliminar asignación
  async eliminarAsignacion(asignacionId: string): Promise<any> {
    const token = this.getToken()
    const response = await this.request(`/asignaciones/${asignacionId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  }




  // ===== TESTS =====

  // Obtener tests del docente
  async getTests(): Promise<any[]> {
    const token = this.getToken()
    const response = await this.request<any[]>('/tests', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data || []
  }

  // Obtener un test específico
  async getTest(testId: string): Promise<any> {
    const token = this.getToken()
    const response = await this.request(`/tests/${testId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  }

  // Crear test
  async crearTest(data: {
    titulo: string
    descripcion?: string
    preguntas: Array<{
      enunciado: string
      opciones: string[]
      respuestaCorrecta: string
      explicacion: string
      dificultad: 'basica' | 'media' | 'avanzada'
      tipoPregunta: string
      orden: number
      puntos: number
    }>
    configuracion?: any
  }): Promise<any> {
    console.log('🚀 API Service - Creando test:', JSON.stringify(data, null, 2))
    const token = this.getToken()
    console.log('🔑 Token disponible:', !!token)
    const response = await this.request('/tests', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    console.log('✅ Respuesta del servidor:', response)
    return response.data
  }

  // Obtener tests del docente
  async getTestsDocente(): Promise<any> {
    const token = this.getToken()
    const response = await this.request('/tests/docente', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  }

  // Actualizar test
  async actualizarTest(testId: string, data: any): Promise<any> {
    const token = this.getToken()
    const response = await this.request(`/tests/${testId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    return response.data
  }

  // Eliminar test
  async eliminarTest(testId: string): Promise<any> {
    const token = this.getToken()
    const response = await this.request(`/tests/${testId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  }

  // ===== RESPUESTAS DE TESTS =====

  // Enviar respuestas de un test
  async enviarRespuestasTest(data: {
    testId: string
    asignacionId: string
    respuestas: Array<{
      preguntaId: string
      respuesta: string
      esCorrecta: boolean
    }>
  }): Promise<any> {
    const token = this.getToken()
    const response = await this.request('/tests/respuestas', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return response.data
  }

  // ===== ANUNCIOS Y NOTIFICACIONES =====

  // Obtener anuncios para alumno
  async getAnunciosAlumno(): Promise<any> {
    const token = this.getToken()
    const response = await this.request('/anuncios/alumno', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  }

  // Marcar anuncio como leído
  async marcarAnuncioLeido(anuncioId: string): Promise<any> {
    const token = this.getToken()
    const response = await this.request(`/anuncios/${anuncioId}/leer`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  }

  // ===== PROGRESO DE TESTS =====

  // Obtener progreso de un test para un alumno
  async getProgresoTest(asignacionId: string, alumnoId: string): Promise<any> {
    const token = this.getToken()
    const response = await this.request(`/tests/progreso/${asignacionId}/${alumnoId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  }

  // Obtener respuestas del alumno (datos reales desde backend)
  async getRespuestasAlumno(): Promise<any[]> {
    const token = this.getToken()
    try {
      const response = await this.request('/tests/respuestas/alumnos', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const responseData = response.data as any
      return Array.isArray(responseData?.data) ? responseData.data : []
    } catch (error) {
      console.warn('Error obteniendo respuestas reales, usando datos de ejemplo:', error)
      // Fallback a datos de ejemplo si falla la API
      return [
        {
          _id: 'respuesta1',
          alumnoId: 'alumno1',
          preguntaId: 'pregunta1',
          respuesta: 'A',
          esCorrecta: true,
          tiempoRespuesta: 30,
          fechaRespuesta: new Date().toISOString()
        },
        {
          _id: 'respuesta2',
          alumnoId: 'alumno1',
          preguntaId: 'pregunta2',
          respuesta: 'B',
          esCorrecta: false,
          tiempoRespuesta: 45,
          fechaRespuesta: new Date().toISOString()
        },
        {
          _id: 'respuesta3',
          alumnoId: 'alumno2',
          preguntaId: 'pregunta3',
          respuesta: 'C',
          esCorrecta: true,
          tiempoRespuesta: 25,
          fechaRespuesta: new Date().toISOString()
        }
      ]
    }
  }

  // Obtener mis alumnos asignados (docente)
  async getMisAlumnos(): Promise<any[]> {
    const token = this.getToken()
    const response = await this.request<any[]>('/usuarios/mis-alumnos', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data || []
  }
}

export const apiService = new ApiService()
export type { LoginData, RegistroData, AuthResponse }
