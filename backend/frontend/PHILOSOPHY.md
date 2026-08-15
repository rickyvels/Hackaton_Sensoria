# 🎨 Filosofía y Principios de Diseño del Frontend — Neuroalianza

> **Proyecto:** Neuroalianza (Hackatón INSN San Borja 2026 — Desafío 04: Neurodesarrollo)  
> **Arquitectura:** Progressive Web App (PWA) Mobile-First con **shadcn/ui**, **Tailwind CSS**, **Radix UI** y **Lucide Icons**.

---

## 1. Misión y Enfoque Humano-Clínico

La interfaz de **Neuroalianza** está concebida para acompañar a las familias peruanas en la detección temprana y seguimiento de trastornos del neurodesarrollo, y para empoderar al personal de salud en el primer nivel de atención (CRED) bajo condiciones reales de conectividad y equipamiento.

El frontend se rige por **cuatro pilares de empatía estructural**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MOBILE-FIRST PWA (MobileAppShell)                    │
├────────────────────┬────────────────────────────┬───────────────────────┤
│  PERSONAL DE SALUD │          FAMILIA           │     ESPECIALISTA      │
│      (/salud)      │         (/familia)         │       (/clinico)      │
├────────────────────┼────────────────────────────┼───────────────────────┤
│ • Teléfono móvil   │ • Móvil de gama de entrada │ • Móvil / Tablet      │
│ • Rápido en CRED   │ • Lenguaje simple y cálido │ • Ficha 360° resumida │
│ • Funciona offline │ • Hoja de ruta visual      │ • Bandeja de alertas  │
│ • Tamizaje guiado  │ • Guías para el hogar      │ • Agenda de citas     │
└────────────────────┴────────────────────────────┴───────────────────────┘
```

### 1.1 Experiencia Mobile-First (PWA)
En el Perú, la inmensa mayoría de cuidadores y enfermeras del primer nivel acceden a herramientas digitales a través de sus **teléfonos inteligentes**:
* **Contenedor Mobile-First:** En navegadores de escritorio, la aplicación se presenta en un marco central centrado tipo dispositivo móvil (`max-w-md`), garantizando una experiencia visual idéntica y consistente entre móvil y desktop.
* **PWA Instalable:** Acceso directo desde la pantalla de inicio del teléfono, sin requerir descargas pesadas desde tiendas de aplicaciones.
* **Navegación Táctil Inferior (*Bottom Navigation*):** Los accesos principales se ubican al alcance del pulgar.

---

## 2. Regla Cero: Adopción de shadcn/ui y Radix UI

> [!IMPORTANT]
> **shadcn/ui es la base oficial de componentes de interfaz del proyecto.**  
> Todos los componentes atómicos (`Button`, `Card`, `Dialog`, `Input`, `Select`, `Tabs`, `Badge`, `Progress`) provienen de shadcn/ui (`src/components/ui/`), construidos sobre primitivas accesibles de **Radix UI** y estilizados con **Tailwind CSS**.

### 2.1 Por qué shadcn/ui
1. **Accesibilidad Universal (a11y):** Radix UI proporciona de forma nativa soporte para lectores de pantalla, manejo de foco, ARIA roles y navegación por teclado.
2. **Propiedad del Código:** Los componentes residen directamente en el repositorio (`src/components/ui/`), permitiendo una adaptación quirúrgica a los requerimientos clínicos y de diseño sin dependencias opacas.
3. **Ecosistema de Iconos `lucide-react`:** Iconografía moderna, consistente y de trazo uniforme para representar conceptos de salud, alertas y familia.

---

## 3. Principios Visuales y Restricciones No Negociables

### 3.1 Tokens Semánticos de shadcn
* **Fondos y Textos:** Uso obligatorio de tokens semánticos: `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`, `bg-primary`, `text-primary-foreground`, `bg-destructive`, `text-destructive-foreground`, `bg-muted`, `text-muted-foreground`, `border-border`, `ring-ring`.
* **Tipografía Mínima:** Tamaño mínimo de texto `text-md` (16px) para garantizar legibilidad bajo luz solar directa o en personas con presbicia.
* **Áreas Táctiles Generosas:** Todo botón o control interactivo debe tener un área mínima de **$44\times 44\text{ px}$**.

### 3.2 Postura Ético-Clínica en la Interfaz
* **El sistema NO diagnostica:** Las pantallas de tamizaje muestran niveles de riesgo (`BAJO`, `MODERADO`, `ALTO`), señales de alerta observadas y recomendaciones de acción asistencial. Ningún texto emite una etiqueta diagnóstica clínica automatizada.
* **Empatía con las inasistencias:** Los motivos de declinación de citas capturan causas estructurales (costos, distancia, trabajo, salud).

---

## 4. Rendimiento y Resiliencia Offline

1. **React 19 + React Compiler:** Compilación optimizada con memoización automática.
2. **Sincronización Offline:** El personal de CRED puede completar tamizajes sin conexión a internet; los datos se almacenan localmente y se sincronizan al recuperar señal.
3. **Modo Oscuro Integrado:** Compatibilidad nativa con tema claro y oscuro mediante clases de Tailwind y variables CSS.
