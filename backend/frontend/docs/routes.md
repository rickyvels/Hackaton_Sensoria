
# Neuroalianza — Mapa de Páginas, Rutas y Funcionalidades

**Hackatón Niño San Borja 2026 · Desafío 04: Neurodesarrollo**

Versión 1.0 · Especificación funcional de frontend

> Este documento define **qué** se construye. El documento *Estándares de Frontend
> y Reglas de Implementación* define **cómo** se construye. Ambos son de cumplimiento
> obligatorio y deben leerse juntos.

---

## 1. Convenciones

**Prioridad.** Cada página está marcada como:

- **[P1]** — indispensable. Sin ella no existe la demostración.
- **[P2]** — deseable. Se construye si sobra tiempo.

**Zonas.** Cuatro zonas de la aplicación, cada una con su propia configuración de
navegación lateral y color de acento, sobre el mismo AppShell:

| Zona              | Prefijo de ruta | Usuario                        |
| ----------------- | --------------- | ------------------------------ |
| Pública          | `/`           | Visitante, jurado              |
| Personal de salud | `/salud`      | Enfermería CRED, primer nivel |
| Familia           | `/familia`    | Cuidadores                     |
| Especialista      | `/clinico`    | Equipo multidisciplinario      |
| Demostración     | `/demo`       | Operación del pitch           |

**Restricción transversal.** Ninguna pantalla emite ni sugiere un diagnóstico. El
resultado del tamizaje es una recomendación de acción. Esta restricción se refleja
en cada texto de interfaz.

---

## 2. Índice de rutas

| #  | Ruta                                     | Página                              | Prioridad |
| -- | ---------------------------------------- | ------------------------------------ | --------- |
| 1  | `/`                                    | Landing                              | P1        |
| 2  | `/login`                               | Acceso                               | P1        |
| 3  | `/salud`                               | Panel del personal de salud          | P1        |
| 4  | `/salud/tamizaje/nuevo`                | Nueva evaluación                    | P1        |
| 5  | `/salud/tamizaje/:id`                  | Resultado y derivación              | P1        |
| 6  | `/salud/pacientes`                     | Mis pacientes                        | P1        |
| 7  | `/salud/pacientes/:id`                 | Detalle del paciente                 | P1        |
| 8  | `/salud/guia`                          | Guía de señales de alarma          | P2        |
| 9  | `/familia`                             | Inicio de la familia                 | P1        |
| 10 | `/familia/ruta`                        | Mi ruta de atención                 | P1        |
| 11 | `/familia/citas`                       | Citas                                | P1        |
| 12 | `/familia/actividades`                 | Actividades en casa                  | P1        |
| 13 | `/familia/informacion`                 | Información y aprendizaje           | P2        |
| 14 | `/familia/video`                       | Enviar video                         | P2        |
| 15 | `/clinico`                             | Bandeja de casos                     | P1        |
| 16 | `/clinico/referencias`                 | Referencias entrantes                | P1        |
| 17 | `/clinico/casos/:id`                   | Ficha del paciente                   | P1        |
| 18 | `/clinico/agenda`                      | Agenda                               | P1        |
| 19 | `/clinico/casos/:id/evaluacion`        | Registrar evaluación                | P1        |
| 20 | `/clinico/casos/:id/plan`              | Plan terapéutico                    | P2        |
| 21 | `/clinico/casos/:id/contrarreferencia` | Contrarreferencia                    | P2        |
| 22 | `/clinico/metricas`                    | Métricas de gestión                | P1        |
| 23 | `/demo`                                | Panel de control de la demostración | P1        |

---

## 3. Zona pública

### 3.1 Landing — `/` **[P1]**

Es la primera pantalla que ve el jurado. No es marketing: es el argumento del proyecto.

**Secciones:**

- Encabezado con el problema en una sola frase y la cifra clave: el 85,4 % de niños
  menores de cinco años evaluados por otros motivos presentaba alteraciones del
  desarrollo no detectadas previamente
- Comparación visual del recorrido actual frente al recorrido con Neuroalianza
- Tres tarjetas de acceso por rol, cada una con un usuario de demostración precargado
  y acceso de un solo clic
- Bloque «qué no hace este sistema», declarando explícitamente que no diagnostica ni
  reemplaza el criterio profesional
- Pie con equipo y componentes técnicos

**Nota de diseño.** El bloque de limitaciones no es un descargo legal escondido: se
muestra al mismo nivel visual que las capacidades. Nombrar los límites ante un jurado
clínico genera más confianza que prometer de más.

### 3.2 Acceso — `/login` **[P1]**

- Selector de rol con avatares de usuarios de demostración; un clic entra sin escribir
  credenciales
- Formulario de acceso convencional debajo, para que el prototipo no se lea como una
  maqueta estática
- Selector de tema claro/oscuro

---

## 4. Zona del personal de salud — `/salud`

Usuario objetivo: personal de enfermería de CRED y del primer nivel. Contexto: celular
de gama media, poco tiempo por consulta, conectividad intermitente.

### 4.1 Panel principal — `/salud` **[P1]**

**Elementos:**

- Tarjetas de resumen: niños evaluados este mes, casos en riesgo detectados,
  derivaciones pendientes de cita
- Indicador de estado de conexión con contador de registros pendientes de sincronizar
- Acción primaria destacada: **Nueva evaluación**
- Lista de pendientes: reevaluaciones cuya fecha ya venció, derivaciones sin respuesta
  del establecimiento receptor

**Estados a contemplar:** carga, vacío (personal sin pacientes registrados aún),
error de red con datos en caché.

### 4.2 Nueva evaluación — `/salud/tamizaje/nuevo` **[P1]**

La pantalla más importante de este rol. Asistente de tres pasos.

**Paso 1 — Identificación del niño**

- Búsqueda por documento de identidad o creación de registro nuevo
- Campos: nombres, fecha de nacimiento, sexo, ubicación, cuidador responsable y
  canal de contacto
- Al ingresar la fecha de nacimiento, el sistema calcula la edad en meses y selecciona
  automáticamente el instrumento de tamizaje aplicable

**Paso 2 — Cuestionario**

- Una pregunta por pantalla en móvil; lista completa en escritorio
- Respuestas binarias con controles de área táctil amplia
- Barra de progreso y guardado automático de cada respuesta
- Navegación libre hacia atrás para corregir

**Paso 3 — Resultado**

- Indicador de nivel de riesgo con icono, color y etiqueta textual
- Acción recomendada: continuar control, reevaluar en plazo, o derivar a atención
  especializada
- Leyenda permanente: orientación, no diagnóstico
- Si el resultado es riesgo alto, acceso directo a generar la derivación

### 4.3 Resultado y derivación — `/salud/tamizaje/:id` **[P1]**

- Detalle del tamizaje aplicado, con las respuestas registradas
- Formulario de derivación: hallazgos estructurados por casillas, prioridad,
  observaciones libres, adjuntos
- Selector de establecimiento receptor
- Vista previa de la ficha completa antes de enviar
- Confirmación con número de referencia generado

### 4.4 Mis pacientes — `/salud/pacientes` **[P1]**

- Tabla con filtros por estado del caso y por nivel de riesgo
- Columna de estado con distintivo de color y etiqueta
- Columna **días en el estado actual** — la que revela dónde se atascan los casos
- Búsqueda por nombre o documento
- Orden por defecto: mayor tiempo en estado actual primero

### 4.5 Detalle del paciente — `/salud/pacientes/:id` **[P1]**

- Línea de tiempo del caso con todas las transiciones registradas
- Historial de tamizajes con comparación entre aplicaciones sucesivas
- **Qué ocurrió después de derivar** — la contrarreferencia del establecimiento
  especializado, con diagnóstico, plan e indicaciones de seguimiento

**Por qué importa.** Hoy el personal que deriva a un niño nunca se entera del
desenlace. Esta sección cierra ese circuito y es de las funciones que el primer nivel
más solicita.

### 4.6 Guía de señales de alarma — `/salud/guia` **[P2]**

- Hitos del desarrollo organizados por rango de edad
- Qué hacer ante cada hallazgo
- Consultable sin conexión

---

## 5. Zona de la familia — `/familia`

Usuario objetivo: madres, padres y cuidadores. Contexto: celular de gama baja,
posible baja alfabetización digital, datos móviles limitados.

**Directrices de diseño para toda la zona:** densidad de información baja, tipografía
grande, lenguaje cotidiano sin tecnicismos, una acción principal por pantalla.

### 5.1 Inicio — `/familia` **[P1]**

- Tarjeta destacada de **próxima cita**: fecha, hora, establecimiento, cómo llegar,
  qué documentos llevar
- Dos acciones directas: confirmar asistencia o indicar que no podrá asistir
- Estado actual del proceso expresado en una frase simple
- Actividades de refuerzo pendientes de la semana

### 5.2 Mi ruta — `/familia/ruta` **[P1]**

- Línea de tiempo vertical con pasos completados, paso actual y pasos siguientes
- Cada paso explicado en lenguaje llano: qué es, cuánto suele durar, qué se necesita
- Los pasos futuros se muestran atenuados pero visibles, para que la familia conozca
  el camino completo desde el principio

**Fundamento.** El desafío señala que las familias recorren una ruta que no siempre
comprenden, y que esa falta de orientación genera incertidumbre y retrasos. Esta
pantalla existe para resolver exactamente eso.

### 5.3 Citas — `/familia/citas` **[P1]**

- Listado de citas próximas y pasadas, con su estado
- Ventana de «no puedo asistir» con selección de motivo: dinero, distancia, horario,
  trabajo, salud, otro
- Al declinar, ofrecimiento inmediato de reprogramación

**Nota.** El motivo declarado alimenta la métrica de inasistencia por causa, que es
uno de los datos de gestión más valiosos del sistema. La inasistencia no equivale a
falta de compromiso, y capturar el porqué lo demuestra.

### 5.4 Actividades en casa — `/familia/actividades` **[P1]**

- Actividades del plan terapéutico en tarjetas con imagen o video breve
- Marcado de actividad realizada
- Progreso semanal sencillo, sin gamificación excesiva

### 5.5 Información — `/familia/informacion` **[P2]**

- Preguntas frecuentes en lenguaje llano
- Qué significa una derivación, qué esperar de la evaluación, derechos del paciente
- Contactos útiles del establecimiento

### 5.6 Enviar video — `/familia/video` **[P2]**

- Grabación o carga de un video breve del niño
- Guía de qué grabar, según lo solicitado por el especialista
- Confirmación de recepción

---

## 6. Zona del especialista — `/clinico`

Usuario objetivo: neuropediatría, psiquiatría infantil, psicología, terapias.
Contexto: escritorio, muchos casos simultáneos, poco tiempo por caso.

**Directrices de diseño para toda la zona:** densidad alta, tablas con filtros,
accesos rápidos por teclado.

### 6.1 Bandeja de casos — `/clinico` **[P1]**

- **Panel de alertas en la parte superior**: derivaciones sin cita por más del plazo
  definido, inasistencias repetidas, evaluaciones estancadas, casos en riesgo de
  abandono
- Tabla de casos con filtros por estado, nivel de riesgo, procedencia y profesional
  asignado
- Ordenamiento por tiempo en el estado actual
- Búsqueda rápida por atajo de teclado

### 6.2 Referencias entrantes — `/clinico/referencias` **[P1]**

- Cola de derivaciones recibidas, ordenadas por prioridad y antigüedad
- Ficha del tamizaje que originó cada derivación
- Acciones: aceptar y asignar cita, solicitar información adicional, o devolver con
  orientación al establecimiento de origen

### 6.3 Ficha del paciente — `/clinico/casos/:id` **[P1]**

La pantalla más densa del sistema. Disposición en tres columnas.

- **Columna izquierda:** datos del paciente, procedencia, cuidador, canal de contacto
- **Columna central:** pestañas de Línea de tiempo, Tamizajes, Notas por especialidad,
  Plan terapéutico y Adjuntos
- **Columna derecha:** acciones rápidas, próxima cita, equipo asignado

**Detalle que importa.** Cada nota muestra visiblemente su especialidad de origen, de
modo que neurología vea de un vistazo qué registró terapia de lenguaje. El desafío
identifica que cuando la información no está organizada para todo el equipo, cada
profesional conoce solo una parte del recorrido del paciente.

### 6.4 Agenda — `/clinico/agenda` **[P1]**

- Vista semanal de citas por profesional
- Asignación de cita a partir de una referencia aceptada
- **Agrupador de sesiones**: para pacientes procedentes de otras regiones, sugiere
  concentrar las cuatro a siete sesiones de evaluación neuropsicológica en la menor
  cantidad de días posible

**Por qué es un diferenciador.** La evaluación prolongada implica múltiples traslados,
gastos y carga logística y emocional para familias de regiones. Reducir viajes es un
problema concreto, medible y resoluble por software.

### 6.5 Registrar evaluación — `/clinico/casos/:id/evaluacion` **[P1]**

- Formulario de nota clínica con especialidad de origen
- Registro de sesión cumplida
- Al completarse el ciclo de evaluación, formulario de conclusión diagnóstica y
  creación del plan terapéutico

### 6.6 Plan terapéutico — `/clinico/casos/:id/plan` **[P2]**

- Objetivos, sesiones previstas y frecuencia
- Constructor de actividades para el hogar, que la familia verá en su propia zona
- Vista previa de cómo lo verá la familia

### 6.7 Contrarreferencia — `/clinico/casos/:id/contrarreferencia` **[P2]**

- Formulario de devolución al establecimiento de origen
- Resumen del proceso, diagnóstico, plan e indicaciones de seguimiento
- Al enviarse, el caso transiciona a seguimiento y se hace visible en la pantalla 4.5

### 6.8 Métricas de gestión — `/clinico/metricas` **[P1]**

El argumento de valor institucional del proyecto.

- Mediana de días en cada tramo: detección a derivación, derivación a cita, cita a
  diagnóstico
- Tasa de inasistencia desagregada por motivo declarado
- Embudo de casos por estado
- Distribución por región de procedencia
- Proporción de casos que alcanzan seguimiento activo

**Por qué gana puntos.** Ningún establecimiento tiene hoy estas cifras sobre su propia
operación. Convierte el prototipo de herramienta asistencial en herramienta de gestión.

---

## 7. Zona de demostración — `/demo`

### 7.1 Panel de control — `/demo` **[P1]**

Esta pantalla no pertenece al producto: existe para el pitch, y su valor es alto.

- **Avance del reloj simulado**: botones de más un día, más siete días, más treinta días
- **Ejecución manual del motor de alertas**
- **Bandeja de notificaciones**: los mensajes que se habrían enviado, presentados como
  burbujas de conversación
- Reinicio del conjunto de datos de demostración

**Momento de pitch.** Poder decir «voy a adelantar el tiempo cuarenta días» y que las
alertas de derivaciones sin cita aparezcan en vivo, sobre datos reales del sistema, es
lo que el jurado recuerda. Depende del puerto de reloj definido en la arquitectura
del backend.

---

## 8. Componentes transversales

Se construyen una sola vez en `src/components/shared/` y se reutilizan en todas las zonas.

| Componente          | Función                                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| `AppShell`        | Estructura base; tres configuraciones de menú según rol, con color de acento distinto por zona   |
| `CaseStatusBadge` | Distintivo de estado del caso; nueve estados, color y etiqueta consistentes en toda la aplicación |
| `RiskIndicator`   | Semáforo de riesgo con icono, color y texto; incluye siempre la leyenda de orientación           |
| `CaseTimeline`    | Línea de tiempo del caso; dos presentaciones sobre el mismo dato, técnica y simplificada         |
| `OfflineBanner`   | Aviso persistente de estado sin conexión con contador de pendientes                               |
| `EmptyState`      | Estado vacío con acción sugerida                                                                 |
| `AppointmentCard` | Tarjeta de cita, reutilizada en las tres zonas con distinto nivel de detalle                       |

**Regla de consistencia.** El estado de un caso se representa con el mismo color y la
misma etiqueta en la tabla del especialista, en la lista del personal de salud y en la
línea de tiempo de la familia. Un único componente lo garantiza.

---

## 9. Orden de construcción

| Etapa | Contenido                                                      | Motivo                                 |
| ----- | -------------------------------------------------------------- | -------------------------------------- |
| 1     | AppShell y navegación de los tres roles                       | Define la estructura de todo lo demás |
| 2     | Páginas 3, 9 y 15 (las tres bandejas principales)             | Fijan el esqueleto de cada zona        |
| 3     | Páginas 4 y 5 (flujo completo de tamizaje y derivación)      | Es el flujo que abre todos los casos   |
| 4     | Páginas 16, 17 y 18 (referencias, ficha y agenda)             | Cierra el recorrido del especialista   |
| 5     | Páginas 10, 11 y 12 (ruta, citas y actividades de la familia) | Completa el tercer rol                 |
| 6     | Página 22 (métricas)                                         | Argumento institucional                |
| 7     | Página 23 (panel de demostración)                            | Herramienta del pitch                  |
| 8     | Página 1 (landing) y páginas P2                              | Presentación y complementos           |

**Si el tiempo se reduce**, se sacrifican las páginas P2 y la landing se comprime a una
sola pantalla. Lo que no puede faltar bajo ninguna circunstancia es el recorrido completo
de un niño atravesando los tres roles: detectado en el primer nivel, derivado, atendido
por el especialista y seguido por la familia.

---

## 10. Criterios de aceptación funcional

1. Existen las veintitrés rutas, o al menos las diecisiete marcadas como P1.
2. Es posible completar el recorrido íntegro de un caso desde el tamizaje inicial hasta
   el seguimiento, cambiando entre los tres roles.
3. Cada zona presenta su propia configuración de navegación lateral.
4. El estado de un caso se representa de forma idéntica en todas las zonas.
5. La zona de la familia es plenamente usable en un viewport de 360 píxeles de ancho.
6. El panel de demostración permite avanzar el reloj y disparar alertas de forma
   observable.
7. Ninguna pantalla presenta una etiqueta diagnóstica generada automáticamente.
8. Todas las pantallas contemplan sus estados de carga, vacío y error.

---

*Especificación funcional de frontend · Neuroalianza · Hackatón Niño San Borja 2026*
