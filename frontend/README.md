# 📱 Neuroalianza — Frontend PWA (Mobile-First)

> **Hackatón Instituto Nacional de Salud del Niño San Borja (INSN SB) 2026**  
> *Desafío 04: Neurodesarrollo — Neurología Pediátrica · Psiquiatría Infantil · Psicología · Genética · Medicina Física y Rehabilitación*

Aplicación web progresiva (**PWA**) Mobile-First para la plataforma **Neuroalianza**, construida con **React 19**, **TypeScript**, **Vite 8**, **React Compiler**, **shadcn/ui**, **Radix UI**, **Tailwind CSS** y **Lucide Icons**.

---

## 📚 Índice de Documentación del Frontend

| Documento | Enlace | Contenido Principal |
| :--- | :--- | :--- |
| **Arquitectura Backend & Firebase** | [docs/FIREBASE_BACKEND_SERVICES.md](file:///home/techatlasdev/Proyectos/Sensoria/hackatones/neuroalianza-v1/frontend/docs/FIREBASE_BACKEND_SERVICES.md) | **[CRÍTICO]** Arquitectura escalable de backend con Firebase (Auth, Firestore, Buckets, Rules) bajo patrón estricto de Servicios desacoplados. |
| **Filosofía y Principios UX** | [PHILOSOPHY.md](file:///home/techatlasdev/Proyectos/Sensoria/hackatones/neuroalianza-v1/frontend/PHILOSOPHY.md) | Enfoque humano para 3 realidades (CRED, Familias, Especialistas), PWA Mobile-First, accesibilidad y ética clínica. |
| **Guía de Contribución** | [CONTRIBUTING.md](file:///home/techatlasdev/Proyectos/Sensoria/hackatones/neuroalianza-v1/frontend/CONTRIBUTING.md) | Instalación de shadcn/ui por CLI (`npx shadcn@latest add`), tokens semánticos, tipografía $\ge 16\text{px}$ y PRs. |
| **Reglas para Asistentes AI** | [agents.md](file:///home/techatlasdev/Proyectos/Sensoria/hackatones/neuroalianza-v1/frontend/agents.md) | Reglas normativas: adopción de shadcn/ui, `MobileAppShell`, tokens semánticos y prohibiciones estrictas. |
| **Arquitectura de Interfaz** | [docs/ARCHITECTURE.md](file:///home/techatlasdev/Proyectos/Sensoria/hackatones/neuroalianza-v1/frontend/docs/ARCHITECTURE.md) | Layout `MobileAppShell`, enrutado por zonas (`/salud`, `/familia`, `/clinico`, `/demo`), React Query y offline queue. |
| **Estándares Normativos** | [docs/neuro_estandares.md](file:///home/techatlasdev/Proyectos/Sensoria/hackatones/neuroalianza-v1/frontend/docs/neuro_estandares.md) | Documento normativo sobre tokens shadcn, linters, `MobileAppShell` y buenas prácticas. |
| **Mapa de Rutas y Páginas** | [docs/routes.md](file:///home/techatlasdev/Proyectos/Sensoria/hackatones/neuroalianza-v1/frontend/docs/routes.md) | Especificación funcional de las 23 pantallas priorizadas por `[P1]` y `[P2]`. |
| **Sistema de Diseño y Tokens** | [docs/DESIGN_SYSTEM_AND_TOKENS.md](file:///home/techatlasdev/Proyectos/Sensoria/hackatones/neuroalianza-v1/frontend/docs/DESIGN_SYSTEM_AND_TOKENS.md) | Variables CSS de shadcn/ui, escala tipográfica, áreas táctiles $\ge 44\text{px}$ y WCAG AAA. |
| **Estrategia de Testing** | [docs/TESTING_STRATEGY.md](file:///home/techatlasdev/Proyectos/Sensoria/hackatones/neuroalianza-v1/frontend/docs/TESTING_STRATEGY.md) | Pirámide de pruebas con Vitest, Testing Library, auditoría axe y MSW. |

---

## ⚡ 1. Características Destacadas

* **PWA Mobile-First (`MobileAppShell`):** Diseñado específicamente para pantallas táctiles de teléfonos móviles, con barra inferior ergonómica (*Bottom Navigation*) y vista contenida elegante en escritorio.
* **Componentes shadcn/ui + Radix UI:** Accesibilidad universal nativa (WCAG AAA), navegación por teclado y lectores de pantalla.
* **Tres Experiencias Adaptadas:**
  * **Personal de Salud (`/salud`):** Optimizado para uso móvil ágil en postas y controles CRED con soporte offline.
  * **Familias (`/familia`):** Lenguaje simple, tipografía grande, hoja de ruta clara y ejercicios prácticos en casa.
  * **Especialistas (`/clinico`):** Ficha Multidisciplinaria 360°, agenda interactiva y panel analítico de tiempos de espera.
* **Iconografía con `lucide-react`:** Set de iconos limpio y consistente.
* **React 19 + React Compiler:** Máximo rendimiento y memoización automática.

---

## 🚀 2. Inicio Rápido

### 2.1 Prerrequisitos
* **Node.js $\ge 20$**
* **npm $\ge 10$** o **pnpm**

### 2.2 Instalación y Ejecución
```bash
# 1. Posicionarse en el directorio frontend
cd frontend

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo Vite
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

---

## 🧪 3. Comandos de Calidad y Testing

```bash
# Ejecutar verificación estricta de TypeScript
npm run typecheck

# Ejecutar ESLint
npm run lint

# Ejecutar pruebas automatizadas
npm run test
```

---

## 🏗️ 4. Estructura del Código

```
src/
├── main.tsx                         # Composición de BrowserRouter y QueryProvider
├── App.tsx                          # Enrutador principal envuelto en MobileAppShell
├── index.css                        # Variables CSS del tema shadcn/ui
├── components/
│   ├── ui/                          # Componentes shadcn (Button, Card, Dialog, Input, Select...)
│   ├── shared/                      # Componentes de dominio (SemaforoRiesgo, TimelineItem...)
│   └── layout/                      # MobileAppShell, BottomNavBar, TopHeader
├── features/                        # Módulos de negocio (screening, referral, appointments, metrics)
├── pages/                           # Vistas por zona (/public, /health-worker, /family, /specialist, /demo)
├── hooks/                           # Custom Hooks
├── services/                        # Capa desacoplada de Firebase y API
└── utils/                           # Utilidad cn (clsx + twMerge)
```

---

## ☁️ 5. Arquitectura de Backend Serverless (Firebase)

La plataforma utiliza la suite de **Firebase** como backend serverless, implementando un patrón estricto de **Capa de Servicios Desacoplada** (`src/services/`):

* **Firebase Authentication:** Manejo de sesiones y roles (`health_worker`, `family`, `specialist`).
* **Cloud Firestore:** Almacén documental NoSQL en tiempo real con soporte offline nativo (`patients`, `screenings`, `referrals`, `appointments`).
* **Cloud Storage (Buckets):** Almacenamiento de evidencias y videos caseros de interacción familiar.
* **Seguridad (Security Rules):** Control de acceso basado en roles (RBAC) conforme a la Ley de Protección de Datos Personales en salud.
* 📖 *Consulta la guía completa de integración en [docs/FIREBASE_BACKEND_SERVICES.md](file:///home/techatlasdev/Proyectos/Sensoria/hackatones/neuroalianza-v1/frontend/docs/FIREBASE_BACKEND_SERVICES.md).*

---

## 📄 6. Licencia y Créditos
Desarrollado para el **Hackatón INSN San Borja 2026** por el equipo Neuroalianza.
