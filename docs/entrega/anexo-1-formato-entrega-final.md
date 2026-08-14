# Anexo 1 — Formato de entrega final

> **Cómo usar este documento.** Es el borrador del Anexo 1 exigido por las bases (§6.2). Todo lo que
> está redactado a continuación se sostiene en lo que realmente existe en este repositorio. Los
> campos marcados con **⟨COMPLETAR⟩** requieren un dato que el equipo debe aportar o verificar antes
> de firmar: enlaces definitivos, cifras con fuente citable y datos personales del representante.
> Al exportar a PDF, elimina esta nota y los recuadros de ayuda.

---

## 1. Datos generales

| Campo | Información |
| --- | --- |
| Nombre del equipo | Sensoria |
| Nombre de la solución | Neuroalianza: Ruta Viva |
| Desafío seleccionado | Desafío 4 — *Neuroalianza: ruta multidisciplinaria para conectar salud, familia y neurodesarrollo* |

---

## 2. Descripción de la solución

### Descripción del desafío

Los niños y adolescentes peruanos con alteraciones del neurodesarrollo requieren atención de varias
especialidades a lo largo del tiempo. Esa ruta se interrumpe con facilidad: un cupo que no aparece,
un horario incompatible con la jornada laboral del cuidador, un documento faltante, un traslado que
la familia no puede costear. Cuando la ruta se interrumpe, la información sobre lo ocurrido queda
repartida entre la familia y distintos servicios, y nadie tiene una vista única del siguiente paso.

El desafío planteado por el INSN San Borja pide fortalecer la intervención temprana, reducir
barreras geográficas y mejorar la adherencia al tratamiento mediante soluciones tecnológicas.

La magnitud del problema en el Perú está documentada:

- **El 97 % de las personas autistas no está diagnosticada** por falta de acceso a servicios de
  salud (Mecanismo Independiente de Discapacidad, 2023, citado por la Defensoría del Pueblo). Frente
  a una población autista estimada de unas **204 818 personas**, el MINSA había certificado **5 328**
  al 2020.
- El país contaba con **28 neuropediatras** y unos 12 neurólogos dedicados a la especialidad, una
  tasa de **0,09 por 100 000 habitantes**, «muy por debajo de Chile, Uruguay, Argentina, México,
  Venezuela y Brasil» (Guillén Pinto, *Rev Neuropsiquiatr* 76(3), 2013).
- Esa misma fuente describe servicios «colapsados», con «tiempos de espera muy prolongados y de
  breve duración», atendiendo a niños que «requieren de mayor seguimiento» y a familias con «bajo
  nivel de información, mucha ansiedad y mayor nivel de pobreza».

Cuando la coordinación de una ruta larga recae sobre una familia en esas condiciones, la ruta se
interrumpe — y la interrupción **no queda registrada en ningún sistema**. Como la gestación y los
primeros tres años concentran la mayor plasticidad neuronal, cada mes perdido es una pérdida que la
intervención posterior solo recupera de forma parcial.

> El sustento completo, con indicadores, viabilidad económica, plan de implementación y fuentes,
> está en [`impacto-y-viabilidad.md`](impacto-y-viabilidad.md).

### Usuario o beneficiario principal

| Usuario | Rol en la ruta | Necesidad que atiende la solución |
| --- | --- | --- |
| Familia o cuidador principal | Sostiene la continuidad del tratamiento en el día a día | Saber en qué punto está la ruta, cuál es el siguiente paso y poder reportar una dificultad sin depender de una llamada telefónica |
| Profesional de salud del equipo tratante | Decide y autoriza los pasos de la ruta | Ver el caso, la dificultad reportada y la evidencia asociada en un solo lugar, y dejar registrada su decisión |
| Equipo de gestión y coordinación asistencial | Observa el funcionamiento del proceso | Datos agregados de trazabilidad, sin identificar familias |

El beneficiario final es el niño, niña o adolescente cuya ruta de atención no se interrumpe.

### Solución propuesta

Ruta Viva es una plataforma de **coordinación y continuidad de atención** compuesta por dos
productos conectados a una misma API:

1. **PWA para familias** (`apps/family-pwa`) — instalable en el teléfono. La familia consulta el
   estado de su ruta, el siguiente paso, los documentos y el equipo tratante, y puede reportar una
   dificultad concreta (horario, transporte, documentos, cupo).
2. **Plataforma profesional** (`apps/platform`) — el profesional revisa el aviso original de la
   familia junto a una síntesis asistida, la corrige o la valida, observa una corrida de agentes
   que propone alternativas de coordinación, y registra su decisión.
3. **API y orquestación** (`api`) — conserva casos, eventos, decisiones y trazabilidad, y aplica las
   reglas de autorización.

El elemento diferencial es el **control humano obligatorio**: la orquestación de agentes se detiene
en una compuerta explícita y **ninguna tarea se crea ni ninguna ruta cambia sin una decisión
profesional registrada**. Los agentes organizan información y proponen artefactos revisables; no
diagnostican, no prescriben, no confirman citas y no escriben en la base de datos.

La solución **no es una historia clínica ni un sistema de diagnóstico**, y así está declarado en el
propio producto y en `docs/safety.md`.

### Valor público esperado

- **Continuidad medible.** Cada interrupción de ruta queda registrada como un evento con causa, y
  cada decisión profesional queda asociada a la evidencia que la sustentó.
- **Trazabilidad auditable.** El grafo de procedencia conecta la barrera reportada, la corrida de
  agentes y la decisión final. Esto permite auditar el proceso, no solo el resultado.
- **Carga administrativa menor para la familia.** El reporte de una dificultad sustituye a la
  gestión telefónica repetida.
- **Uso responsable de IA en salud pública.** El diseño demuestra que se puede incorporar
  orquestación multiagente en un proceso asistencial sin ceder decisiones clínicas al modelo.

Indicadores propuestos para el piloto:

| Indicador | Medición | Línea base | Meta |
| --- | --- | --- | --- |
| Cobertura de causa registrada | % de interrupciones de ruta con causa identificada | ≈ 0 % | > 80 % |
| Rutas sin interrupción a 90 días | % de casos sin brecha > 30 días entre paso previsto y realizado | A medir en piloto | A definir con el INSN |
| Tiempo entre reporte y decisión profesional | Mediana en horas | A medir en piloto | Reducción sostenida |
| Citas no asistidas por causa evitable | % atribuido a documento, horario o transporte | A medir en piloto | Reducción sostenida |

El primer indicador es el más inmediato y verificable: hoy el sistema **no sabe por qué se rompen
las rutas**, y Ruta Viva convierte esa ausencia en un dato desde el primer día. Los tres restantes
son hipótesis a validar en piloto, no efectos ya demostrados.

### Funcionamiento del prototipo

El prototipo es funcional de extremo a extremo sobre datos sintéticos:

1. La familia inicia sesión en la PWA (DNI y contraseña) y consulta su ruta.
2. Reporta una dificultad, por ejemplo falta de horario compatible.
3. El profesional abre el caso en la plataforma y compara el aviso original con la síntesis asistida.
   Puede corregirla, pedir aclaración o validarla. **Sin esa validación no puede continuar.**
4. Recién entonces se habilita «Reproducir caso». El orquestador ejecuta una corrida observable y
   persiste cada evento.
5. Cuatro agentes —Navegador de Ruta, Coordinador de Atención, Seguimiento Personalizado, e
   Inteligencia y Calidad— devuelven artefactos estructurados con resumen, propuesta y evidencia.
6. La corrida se detiene en la compuerta humana. El profesional aprueba, rechaza o devuelve.
7. Solo si aprueba se crea la tarea de coordinación y la PWA familiar refleja el nuevo estado.
8. El historial conserva la cronología, los artefactos y el grafo de trazabilidad.

Cada componente de la interfaz explica **qué está haciendo, qué evidencia utiliza y qué control
requiere**. Los estados combinan siempre texto, icono y color, de modo que el significado nunca
depende únicamente del color. Con `prefers-reduced-motion` activo, la ejecución se comunica mediante
cambios de estado y texto en lugar de desplazamientos animados.

El modelo de lenguaje es **opcional y local**: puede usarse Ollama con `qwen3:8b`, y si no está
disponible el sistema recurre a un proveedor determinista claramente identificado, de modo que la
demostración funciona sin red y sin servicios comerciales. En consultas clínicas, urgentes o fuera
de alcance, el backend devuelve una respuesta de seguridad en lugar de consultar al modelo.

### Componentes abiertos y reutilizables

Todo el repositorio se publica bajo **licencia MIT** (archivo `LICENSE`), que permite consulta, uso,
adaptación y redistribución reconociendo la autoría.

| Componente | Ruta | Qué puede reutilizar un tercero |
| --- | --- | --- |
| Motor de orquestación supervisada | `api/app/orchestration/` | Máquina de estados, cola, pausa/reanudación, recuperación y eventos persistidos, con la compuerta humana como parte del contrato |
| Adaptadores de proveedor de IA | `api/app/orchestration/providers.py` | Contrato de artefacto estructurado con adaptador para Ollama y proveedor determinista de respaldo |
| Reglas de negocio y autorización | `api/app/services.py`, `api/app/dependencies.py` | Lógica de casos, barreras, validación y creación de tareas condicionada a decisión humana |
| Contratos de datos | `api/app/models.py`, `api/app/schemas.py` | Modelo de caso, barrera, decisión, tarea, evento y corrida |
| PWA familiar accesible | `apps/family-pwa/` | Patrones de accesibilidad, objetivos táctiles ≥ 44 px, service worker que excluye `/api/` y peticiones autenticadas |
| Visualización de procedencia | `apps/platform/src/ProvenanceGraph.tsx` | Grafo que conecta entrada, regla, herramienta, salida y decisión humana |
| Documentación de arquitectura y límites | `docs/` | Modelo de agentes, contratos, límites éticos y de seguridad |

### Próximos pasos sugeridos

1. **Tamizaje y detección temprana.** Incorporar instrumentos validados de cribado del
   neurodesarrollo al inicio de la ruta, para atender de forma directa los ejes de «diagnóstico
   oportuno» e «intervención temprana» del enunciado.
2. **Barrera geográfica.** Modo de baja conectividad con sincronización diferida y derivación
   territorial, para regiones con acceso intermitente.
3. **Validación con usuarios reales.** Sesiones con cuidadores y con profesionales del INSN San
   Borja para contrastar el flujo y el lenguaje de la interfaz.
4. **Interoperabilidad.** Evaluación de estándares de intercambio (por ejemplo HL7 FHIR) para
   conectar con sistemas de información existentes.
5. **Gobernanza para uso real.** Autorización institucional, minimización de datos, control de
   accesos, auditoría y evaluación de impacto en protección de datos personales.

---

## 3. Enlaces o archivos entregados

| Entregable | Enlace de acceso público (verificar) | Observaciones |
| --- | --- | --- |
| Presentación en PDF | **⟨COMPLETAR⟩** | Pitch final |
| Demo o prototipo funcional | **⟨COMPLETAR⟩** | Debe ser accesible sin instalación local. Ver nota abajo. |
| Repositorio de código o componentes reutilizables | https://github.com/miguel-isidro05/neuroalianza-ruta-viva-mvp | Público, licencia MIT |
| Declaración de uso de IA generativa | `docs/entrega/anexo-2-declaracion-ia-generativa.md` | Ver Anexo 2 |
| Otros anexos o evidencias | `docs/` | Arquitectura, límites éticos y de seguridad, bitácora de verificación |

> **Nota sobre la demo.** Hoy el prototipo se ejecuta localmente siguiendo el `README.md`. Las bases
> piden un enlace de acceso público verificable. Pendiente publicar un despliegue con datos
> sintéticos o, como alternativa mínima, un video de recorrido con enlace público.

---

## 4. Declaraciones finales del equipo

- [x] La solución entregada tiene carácter prototípico, experimental y demostrativo.
- [x] El equipo declara que la solución es original o cuenta con autorizaciones suficientes para el
      uso de componentes de terceros.
- [x] El equipo declara que la solución no depende exclusivamente de software propietario
      restrictivo, servicios comerciales cerrados o infraestructura privada no replicable.
      *(La solución se ejecuta con software de código abierto —FastAPI, SQLite, React, Vite— y el
      modelo de lenguaje es local y opcional, con proveedor determinista de respaldo.)*
- [x] El equipo declara que no utilizó datos personales reales, información confidencial, sistemas
      no autorizados ni credenciales institucionales no autorizadas.
      *(Todos los casos, identidades y documentos del prototipo son sintéticos.)*
- [x] El equipo acepta que la entrega no genera derecho a pago, contratación, implementación,
      financiamiento ni continuidad obligatoria.

| Campo | Información |
| --- | --- |
| Nombres y apellidos | **⟨COMPLETAR⟩** |
| DNI / CE | **⟨COMPLETAR⟩** |
| Firma del representante del equipo | **⟨COMPLETAR⟩** |
| Fecha | **⟨COMPLETAR⟩** |
