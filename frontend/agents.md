# AGENTS.md — Neuroalianza Frontend (PWA Mobile-First)

Reglas obligatorias para cualquier asistente de código o desarrollador que trabaje en este repositorio.  
Estas reglas no son sugerencias. El código que las incumpla no pasa la puerta de calidad.

---

## 🛑 REGLA CERO

**shadcn/ui (Tailwind CSS + Radix UI Primitives + Lucide Icons) es la única librería de componentes de interfaz del proyecto.**

No escribas componentes de interfaz básicos a mano (botones, inputs, dialogs, selects, dropdowns, etc.). Si necesitas un componente, instálalo vía el CLI oficial:

```bash
npx shadcn@latest add <componente>
# Ejemplos:
# npx shadcn@latest add button
# npx shadcn@latest add input
# npx shadcn@latest add card
# npx shadcn@latest add dialog
# npx shadcn@latest add tabs
```

Los componentes de shadcn se ubican en `src/components/ui/`. Nunca improvises componentes primitivos.

---

## 📱 ARQUITECTURA MOBILE-FIRST Y LAYOUT PWA

**Neuroalianza es una Progressive Web App (PWA) pensada prioritariamente para dispositivos móviles.**

1. **Layout Móvil Global (`MobileAppShell`):**
   * En pantallas móviles: la aplicación ocupa el $100\%$ del ancho de pantalla con manejo de *safe areas* (notch, barras de navegación táctiles).
   * En pantallas de escritorio: la aplicación se renderiza contenida en un marco central tipo dispositivo móvil (`max-w-md w-full mx-auto shadow-2xl min-h-screen bg-background border-x border-border`) sobre un fondo neutro elegante (`bg-muted/40`).
2. **Navegación Inferior (*Bottom Navigation Bar*):**
   * El acceso a las secciones principales del rol activo (CRED, Familia, Especialista) se ubica en la barra de navegación inferior fija para acceso ergonómico con una sola mano.
3. **Áreas Táctiles Mínimas:**
   * Todo botón o control interactivo debe tener un área de pulsación de al menos **$44\times 44\text{ px}$**.

---

## 🚫 PROHIBICIONES ABSOLUTAS

Aplican a `src/pages/`, `src/features/`, `src/components/shared/` y `src/components/layout/`.

### 1. Colores y Tokens
- ❌ `#F04438`, `#fff`, `rgb(16,24,40)`, `hsl(...)` en línea
- ❌ `bg-blue-500`, `text-gray-600`, `border-red-400` (escala directa de Tailwind sin token semántico)
- ✅ `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`, `bg-primary`, `text-primary-foreground`, `bg-destructive`, `text-destructive-foreground`, `bg-muted`, `text-muted-foreground`, `border-border`, `ring-ring`

### 2. Tipografía y Legibilidad
- ❌ `text-md`, `text-md`, `text-[13px]`, `style={{ fontSize: 12 }}`
- ❌ `font-thin`, `font-extralight`
- ✅ Mínimo `text-md` (16px) para textos de lectura y formularios. Escala: `text-md`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`.
- *Justificación:* Los usuarios son personal de salud en postas bajo luz solar y familias con celulares económicos o presbicia.

### 3. Espaciado y Dimensiones
- ❌ `p-[13px]`, `gap-[7px]`, `w-[247px]`, `h-[38px]`, `rounded-[9px]`
- ✅ Escala oficial de Tailwind: `p-2`, `p-4`, `p-6`, `gap-3`, `gap-4`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full`.

### 4. Estilos Inline
- ❌ `style={{ marginTop: 12, backgroundColor: 'red' }}`
- ✅ Única excepción permitida: valores calculados dinámicamente en runtime (ej. porcentaje de barra de progreso):
```tsx
<div style={{ width: `${porcentaje}%` }} className="h-2 rounded-full bg-primary" />
```

### 5. Elementos Crudos e Iconos
- ❌ `<button>`, `<input>`, `<select>`, `<textarea>` nativos sin encapsular.
- ❌ `heroicons`, `react-icons`, `@untitledui/icons`.
- ✅ `import { Button } from "@/components/ui/button"`
- ✅ `import { Input } from "@/components/ui/input"`
- ✅ Iconos exclusivamente de: `import { Heart, Activity, AlertTriangle } from "lucide-react"`

---

## 🩺 CONTEXTO CLÍNICO Y ÉTICO

1. **El sistema NUNCA emite un diagnóstico clínico automatizado.**
2. El resultado del motor de tamizaje muestra **nivel de riesgo** (`BAJO`, `MODERADO`, `ALTO`), **señales de alerta observadas** y **recomendaciones de acción asistencial**.
3. Las declinaciones de citas familiares exigen capturar motivos estructurales tipados (económico, distancia, cruce laboral, salud).

---

## ✅ CHECKLIST ANTES DE ENTREGAR CÓDIGO

1. ¿El componente base existe en `src/components/ui/` o se instaló con `npx shadcn@latest add`?
2. ¿Se usó `lucide-react` para iconografía?
3. ¿Se verificó que ningún texto esté por debajo de `text-md` (16px)?
4. ¿Los botones y campos cumplen con el área táctil mínima de 44px?
5. ¿La pantalla responde adecuadamente dentro del layout PWA mobile-first?
6. ¿Se ejecutan las pruebas automatizadas de componentes sin errores?
