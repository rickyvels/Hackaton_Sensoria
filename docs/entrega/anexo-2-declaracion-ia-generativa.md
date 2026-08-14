# Anexo 2 — Declaración de uso de inteligencia artificial generativa

> **Cómo usar este documento.** Es el borrador del Anexo 2 exigido por las bases (§6.2). Este anexo
> **sí corresponde** en nuestro caso, por dos motivos independientes: (a) se usaron herramientas de
> IA generativa como apoyo durante el desarrollo, y (b) la solución **incorpora un modelo de lenguaje
> como componente funcional**. Ambos usos se declaran por separado más abajo.
>
> Los campos marcados con **⟨COMPLETAR⟩** exigen un dato que solo el equipo puede confirmar: nombres
> y versiones exactas de las herramientas, fechas de uso y datos del representante. **No los
> completes de memoria si no estás seguro**: las bases sancionan la información inexacta (§11.5).
> Al exportar a PDF, elimina esta nota.

---

## 1. Datos de identificación

| Campo | Información |
| --- | --- |
| Nombre del equipo | Sensoria |
| Nombre de la solución | Neuroalianza: Ruta Viva |
| Desafío seleccionado | Desafío 4 — *Neuroalianza: ruta multidisciplinaria para conectar salud, familia y neurodesarrollo* |
| Representante del equipo | **⟨COMPLETAR⟩** |

---

## 2. Declaración del uso de IA generativa

El equipo declara que, durante el desarrollo de la solución y la elaboración de sus entregables,
utilizó herramientas de inteligencia artificial generativa en los dos ámbitos que se detallan a
continuación.

### 2.1. Herramientas utilizadas

**A. IA generativa como apoyo al desarrollo**

| Herramienta | Proveedor | Modelo o versión | Fecha aproximada de uso |
| --- | --- | --- | --- |
| **⟨COMPLETAR⟩** | **⟨COMPLETAR⟩** | **⟨COMPLETAR⟩** | **⟨COMPLETAR⟩** |

> Enumera aquí cada asistente de código o de redacción efectivamente usado. El repositorio conserva
> evidencia de un flujo de desarrollo asistido con roles separados de *maker* y *checker*
> (`AGENTS.md`, `docs/project/LOOP.md`, `docs/project/loop-run-log.md`), por lo que este punto no
> puede omitirse.

**B. IA generativa como componente de la solución**

| Herramienta | Proveedor | Modelo o versión | Rol en el producto |
| --- | --- | --- | --- |
| Ollama | Ollama (código abierto) | `qwen3:8b`, ejecución **local** | Genera propuestas de coordinación y responde preguntas abiertas de la familia, siempre como artefacto estructurado sujeto a revisión profesional |
| Proveedor determinista propio | Equipo Sensoria | — | Respaldo sin modelo. Conserva el mismo contrato y permite demostrar el flujo completo sin red |

El modelo se ejecuta de forma local. La solución **no depende de un servicio comercial cerrado**:
si Ollama no está disponible, el sistema opera con el proveedor determinista, identificado
explícitamente en la interfaz.

### 2.2. Uso realizado

**En el desarrollo:** apoyo en conceptualización, organización de información, programación,
redacción de documentación técnica y revisión de código. El repositorio documenta un ciclo de
verificación con revisión independiente (`docs/project/STATE.md`), en el que los hallazgos
detectados fueron corregidos y revalidados antes de cerrar el trabajo.

**En el producto:** el modelo cumple dos funciones acotadas.

1. Producir una **síntesis asistida** del aviso que reporta la familia, que el profesional
   ve **junto al texto original** y puede corregir, devolver o validar.
2. Generar **propuestas de coordinación** de los agentes, entregadas como artefactos estructurados
   con resumen, propuesta y evidencia.

En ambos casos el resultado es **una propuesta, nunca una acción**.

### 2.3. Resultado incorporado y revisión humana

Todo contenido generado con apoyo de IA fue revisado por el equipo antes de incorporarse. El código
fue verificado mediante la suite de pruebas del proyecto y la compilación de ambas aplicaciones, y
sometido a una revisión de código independiente cuyo resultado está registrado en
`docs/project/STATE.md`.

Dentro del producto, la revisión humana no es una recomendación sino una **restricción arquitectónica
verificable**:

- Un aviso de la familia puede generar una propuesta, pero **nunca una tarea**.
- La corrida de agentes solo puede iniciarse **después** de que un profesional valide la síntesis.
- La corrida se detiene en una compuerta explícita y **ningún agente puede saltarla**.
- Una tarea de coordinación se crea **únicamente** tras una decisión profesional registrada, que
  queda asociada a la propuesta autorizada y a su hash.
- El modelo **no tiene permiso de escritura** sobre la base de datos ni control del orquestador.
- En consultas clínicas, urgentes o fuera de alcance, el backend devuelve una respuesta de seguridad
  **sin consultar al modelo**.

La solución no diagnostica, no prescribe, no prioriza clínicamente, no confirma citas ni sustituye
la decisión de un profesional. Estos límites están documentados en `docs/safety.md` y
`docs/project/ETHICS.md`, y declarados en la propia interfaz.

### 2.4. Privacidad y seguridad

Medidas adoptadas para evitar el ingreso o la exposición de datos personales, datos sensibles,
información confidencial, credenciales o información institucional restringida:

- **Datos exclusivamente sintéticos.** Todos los casos, identidades, documentos y eventos del
  prototipo fueron construidos por el equipo. No se utilizó información de pacientes reales en
  ninguna etapa, ni en el desarrollo ni en las pruebas.
- **Modelo local.** El componente de IA del producto se ejecuta en la máquina local mediante Ollama;
  los datos del caso no se envían a un servicio externo de terceros.
- **Sin credenciales institucionales.** No se emplearon sistemas, accesos ni credenciales del INSN
  San Borja ni de ninguna otra institución.
- **Sin secretos en el repositorio.** Las credenciales de demostración son sintéticas y solo se
  precargan en desarrollo o mediante una variable explícita; no aparecen en el bundle de producción.
- **Caché restringida.** El service worker de la PWA excluye `/api/`, las peticiones con cabecera
  `Authorization` y cualquier recurso que no sea un activo estático explícito.
- **Datos agregados.** Los indicadores de calidad del sistema son agregados y no identifican
  personas.
- **Sin despliegues automáticos.** El proyecto no realiza auto-merge, despliegue ni modificaciones
  en servicios de terceros sin decisión humana explícita.

---

## 3. Declaración responsable

El equipo declara que las herramientas de inteligencia artificial generativa fueron utilizadas
únicamente como apoyo y que su uso no sustituyó el análisis, el criterio ni la responsabilidad de
sus integrantes.

Asimismo, declara que los contenidos, resultados, recomendaciones, textos, imágenes, código u otros
materiales generados con apoyo de dichas herramientas fueron revisados y, cuando correspondió,
corregidos, validados o adaptados antes de su incorporación en la solución o en los entregables
presentados.

El equipo declara que no utilizó inteligencia artificial generativa para fabricar datos, evidencias,
fuentes, pruebas, resultados o afirmaciones inexistentes, ni para presentar como propios contenidos
de terceros. También declara haber respetado los derechos de autor, las licencias y las condiciones
de uso aplicables. Los patrones de arquitectura tomados como referencia (Eigent /
Multi-Agent-Orchestrator) están identificados en `docs/research/manifest.md` y `README.md`, y fueron
adaptados mediante implementación propia, no copiados.

El equipo declara que no ingresó datos personales, datos sensibles, información confidencial,
credenciales o información institucional restringida en herramientas de inteligencia artificial
generativa.

Finalmente, el equipo reconoce que mantiene plena responsabilidad por la originalidad, veracidad,
seguridad, calidad, pertinencia y cumplimiento ético de la solución presentada, con independencia
del uso de herramientas de inteligencia artificial generativa durante su desarrollo.

En señal de conformidad, el representante del equipo suscribe la presente declaración y manifiesta
que la información consignada es completa y veraz, y que ha sido comunicada a los demás integrantes
del equipo.

---

Nombres y apellidos del representante: **⟨COMPLETAR⟩**

DNI / CE: **⟨COMPLETAR⟩**

Firma del representante del equipo: ______________________________________

Lugar y fecha: **⟨COMPLETAR⟩**
