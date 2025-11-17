# Mate AI

## Descripción

Mate AI es una plataforma web innovadora diseñada para facilitar el aprendizaje de matemáticas de manera interactiva y personalizada. Conecta a docentes y alumnos en un entorno educativo moderno, utilizando inteligencia artificial para generar ejercicios adaptados y mejorar la experiencia de aprendizaje.

La plataforma permite a los docentes crear y gestionar contenido educativo, asignar tareas, formar grupos de estudio y monitorear el progreso de sus estudiantes. Los alumnos, por su parte, acceden a ejercicios generados por IA, realizan pruebas y reciben retroalimentación instantánea, todo desde una interfaz intuitiva y atractiva.

## Características Principales

- **Gestión de Usuarios:** Sistema de roles para docentes y alumnos, con perfiles personalizados y asignaciones específicas.
- **Asignaciones y Tareas:** Los docentes pueden crear y distribuir tareas matemáticas adaptadas al nivel de cada alumno.
- **Generación de Ejercicios con IA:** Utiliza inteligencia artificial para crear ejercicios únicos y desafiantes, basados en el progreso del estudiante.
- **Grupos de Estudio:** Formación de grupos colaborativos para fomentar el aprendizaje en equipo.
- **Anuncios y Comunicaciones:** Espacio para que docentes publiquen anuncios importantes y mantengan a los alumnos informados.
- **Plantillas Educativas:** Biblioteca de plantillas reutilizables para acelerar la creación de contenido.
- **Pruebas y Evaluaciones:** Herramientas para crear y calificar tests, con análisis detallados del rendimiento.
- **Reportes de Rendimiento:** Dashboards con estadísticas y gráficos para visualizar el progreso individual y grupal.
- **Interfaz Moderna:** Diseño responsivo y amigable, optimizado para dispositivos móviles y desktop.

2. **Instala dependencias del backend:**
   ```
   cd Mate_ai_api
   npm install
   ```

3. **Instala dependencias del frontend:**
   ```
   cd ../Mate_ai
   npm install
   ```

4. **Configura el entorno:**
   - Copia el archivo `env.txt` a `.env` en la carpeta `Mate_ai_api`.
   - Actualiza las variables de entorno con tus credenciales de MongoDB y otras configuraciones necesarias.

5. **Inicia la base de datos:**
   Asegúrate de que MongoDB esté corriendo en tu sistema.

6. **Ejecuta el backend:**
   ```
   cd Mate_ai_api
   npm run dev
   ```

7. **Ejecuta el frontend:**
   En una nueva terminal:
   ```
   cd Mate_ai_front
   npm run dev
   ```

8. **Accede a la aplicación:**
   Abre tu navegador y ve a `http://localhost:5173` (o el puerto configurado para el frontend).

## Uso

### Para Docentes
- Regístrate como docente y configura tu perfil con especialidad y grados asignados.
- Crea grupos de alumnos y asigna tareas personalizadas.
- Utiliza la IA para generar ejercicios adaptados al nivel de tus estudiantes.
- Publica anuncios y monitorea el progreso a través de reportes detallados.

### Para Alumnos
- Regístrate como alumno y selecciona tu grado y sección.
- Accede a tus asignaciones y ejercicios generados por IA.
- Realiza pruebas y recibe retroalimentación inmediata.
- Participa en grupos de estudio y colabora con compañeros.

### Funcionalidades Clave
- **Aprendizaje Personalizado:** La plataforma se adapta al ritmo de cada estudiante.
- **Colaboración:** Espacios para trabajo en equipo y discusiones.
- **Seguimiento en Tiempo Real:** Estadísticas actualizadas del rendimiento académico.
- **Acceso Móvil:** Compatible con tablets y smartphones para aprendizaje en cualquier lugar.

## Contribución

Si deseas contribuir al proyecto, por favor contacta al desarrollador principal o abre un issue en el repositorio.

## Licencia

Este proyecto está bajo la Licencia MIT.

---

¡Bienvenido a Mate AI, donde las matemáticas se hacen accesibles y divertidas!
