# 🤝 Guía de Contribución al Frontend — Neuroalianza (PWA)

> ¡Bienvenido al equipo de desarrollo frontend de **Neuroalianza**!  
> Este frontend está construido como una **PWA Mobile-First** utilizando **React 19**, **TypeScript**, **shadcn/ui**, **Radix UI**, **Tailwind CSS** y **Lucide Icons**.  
> Cada componente o integración **DEBE incluir pruebas automatizadas correspondientes** para verificar su funcionamiento y accesibilidad.

---

## 🧭 1. Reglas Esenciales de Contribución

1. **shadcn/ui es la base de componentes:** No inventes botones, modales, pestañas o selectores nativos; instálalos con `npx shadcn@latest add <component>`.
2. **Iconos exclusivamente de `lucide-react`:** Garantiza consistencia visual y de trazo.
3. **Tokens semánticos obligatorios:** Usa `bg-background`, `text-foreground`, `bg-primary`, `border-border`, etc. Prohibido colores hexadecimales hardcodeados.
4. **Layout Mobile-First:** Todo componente debe verse y funcionar a la perfección en dimensiones de dispositivo móvil (`max-w-md` en desktop).
5. **Áreas táctiles $\ge 44\times 44\text{ px}$:** Imprescindible para el uso en dispositivos móviles con pantallas táctiles.
6. **Testing obligatorio:** Toda nueva funcionalidad o formulario debe incluir pruebas con Vitest / Testing Library.

---

## 🛠️ 2. Entorno y Configuración Inicial

### 2.1 Prerrequisitos
* **Node.js $\ge 20$**
* **npm $\ge 10$** o **pnpm**

### 2.2 Instalación
```bash
# 1. Posicionarse en el directorio frontend
cd frontend

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
```

---

## 📦 3. Flujo para Incorporar Componentes shadcn/ui

```bash
# 1. Instalar un componente desde el CLI de shadcn
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add tabs
npx shadcn@latest add badge
npx shadcn@latest add progress
```

### 3.1 Uso de Componentes e Iconos
```tsx
// ✅ Correcto: importación desde @/components/ui/ y lucide-react
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Heart, Activity, AlertCircle } from "lucide-react";

// ❌ Prohibido: botones HTML crudos o estilos directos con colores hardcodeados
<button className="bg-blue-600 text-white p-2">Guardar</button>
```

---

## 🏗️ 4. Estructura de Carpetas del Frontend

```
frontend/src/
├── main.tsx                         # Entrada con providers (BrowserRouter, QueryClientProvider)
├── App.tsx                          # Enrutador principal envuelto en MobileAppShell
├── index.css                        # Variables CSS de tema shadcn/ui (@layer base)
├── components/
│   ├── ui/                          # Componentes base de shadcn/ui (Button, Card, Dialog, Input...)
│   ├── shared/                      # Componentes de dominio (SemaforoRiesgo, TimelineItem...)
│   └── layout/                      # MobileAppShell, BottomNavBar, TopHeader
├── features/                        # Módulos organizados por contexto clínico
│   ├── screening/                   # Cuestionario CRED, cálculo visual de riesgo, alertas
│   ├── referral/                    # Creación y trazabilidad de derivaciones
│   ├── appointments/                # Agendamiento, confirmación y declinación con motivos
│   ├── care-plan/                   # Plan de estimulación en casa para familias
│   └── metrics/                     # Panel de métricas de tiempos de espera
├── pages/                           # Vistas de ruta por actor
│   ├── public/                      # Landing (/), Login (selector demo)
│   ├── health-worker/               # Panel CRED (/salud), Tamizaje (/salud/tamizaje)
│   ├── family/                      # Mi Ruta (/familia/ruta), Citas (/familia/citas)
│   ├── specialist/                  # Bandeja (/clinico), Ficha 360° (/clinico/casos/:id)
│   └── demo/                        # Centro de control del pitch (/demo)
├── hooks/                           # Custom React Hooks
├── services/                        # Cliente API tipado (generado desde openapi.json)
└── utils/                           # Utilidades (cn para combinar clases de Tailwind)
```

---

## 🧪 5. Comandos de Verificación y Testing

```bash
# Ejecutar verificación de tipos de TypeScript
npm run typecheck

# Ejecutar linter
npm run lint

# Ejecutar suite de pruebas de componentes
npm run test
```

---

## 📋 6. Checklist para Pull Requests

Antes de solicitar revisión:
- [ ] Has usado componentes de **shadcn/ui** en `src/components/ui/` sin crear elementos nativos crudos.
- [ ] Los iconos provienen exclusivamente de `lucide-react`.
- [ ] No existen colores en hexadecimal o tamaños de texto menores a `text-md`.
- [ ] Los controles táctiles cumplen con el tamaño mínimo de $44\times 44\text{ px}$.
- [ ] El diseño se adapta perfectamente al contenedor móvil (`MobileAppShell`).
- [ ] Has añadido pruebas unitarias o de integración para el componente o flujo.
- [ ] Los mensajes de commit cumplen con [Conventional Commits](https://www.conventionalcommits.org/).
