# 🎨 Sistema de Diseño y Tokens Semánticos — Neuroalianza Frontend

> **Proyecto:** Neuroalianza (Hackatón INSN San Borja 2026 — Desafío 04: Neurodesarrollo)  
> **Sistema:** **shadcn/ui** + **Tailwind CSS** + **Radix UI** + **Lucide Icons**  
> **Accesibilidad:** WCAG 2.2 Nivel AAA para contraste de color y áreas táctiles mínimas.

---

## 1. Fundamentos y Variables CSS de shadcn/ui

El sistema de diseño utiliza variables CSS semánticas definidas en `src/index.css` (o `src/styles/globals.css`), adaptadas a la identidad de salud pediátrica y con soporte completo para modo claro y oscuro:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 217.2 91.2% 59.8%;

    --radius: 0.75rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}
```

---

## 2. Tokens Semánticos de Color en Clases de Tailwind

| Token Semántico | Clase de Utilidad | Uso en Neuroalianza |
| :--- | :--- | :--- |
| **Fondo Principal** | `bg-background` | Fondo de la vista móvil y pantallas. |
| **Texto Principal** | `text-foreground` | Títulos, nombres de pacientes y textos clave. |
| **Tarjetas** | `bg-card`, `text-card-foreground` | Tarjetas de tamizaje, citas y fichas de caso. |
| **Acción Primaria** | `bg-primary`, `text-primary-foreground` | Botones de envío de derivación, confirmación de cita. |
| **Alertas Críticas** | `bg-destructive`, `text-destructive-foreground` | Señales de alarma críticas, alto riesgo, inasistencia repetida. |
| **Elementos Secundarios** | `bg-muted`, `text-muted-foreground` | Subtítulos, fechas, metadatos y notas complementarias. |
| **Bordes** | `border-border` | Separadores de listas, marcos de tarjeta e inputs. |
| **Anillo de Foco** | `ring-ring`, `focus-visible:ring-2` | Indicador accesible de navegación por teclado. |

---

## 3. Escala Tipográfica Mobile-First

> [!CAUTION]
> **Prohibición de Tamaños Pequeños:**  
> Los tamaños `text-md` y `text-[13px]` están **estrictamente prohibidos**.

| Clase Tailwind | Tamaño (px) | Propósito Clínico y UX |
| :--- | :--- | :--- |
| `text-md` | **16 px** | **Tamaño base mínimo** para párrafos, inputs, botones y cuestionarios. |
| `text-lg` | **18 px** | Subtítulos de sección y encabezados de tarjeta. |
| `text-xl` | **20 px** | Títulos de modales y resultados de tamizaje. |
| `text-2xl` | **24 px** | Títulos principales de páginas móviles. |
| `text-3xl` | **30 px** | Métricas destacadas y títulos de la Landing Page. |

---

## 4. Áreas Táctiles ($\ge 44\times 44\text{ px}$) y Ergonomía Móvil

1. **Botones y Controles:** Todo elemento accionable (`Button`, `Checkbox`, `RadioGroupItem`, pestañas) debe tener un alto/ancho mínimo de 44px o padding suficiente (`min-h-[44px]`).
2. **Navegación al Alcance del Pulgar:** La barra de navegación inferior fija (`BottomNavBar`) sitúa las acciones más frecuentes en la zona de confort ergonómico de la mano.

---

## 5. El Semáforo Clínico de Riesgo

El componente `SemaforoRiesgo` traduce visualmente las recomendaciones del motor de tamizaje utilizando tokens de shadcn y `lucide-react`:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 🟢 BAJO RIESGO                                                         │
│ Clases: bg-emerald-500/10 text-emerald-600 dark:text-emerald-400       │
│ Icono: CheckCircle2                                                    │
│ Mensaje: "Desarrollo acorde a la edad. Reevaluación en próximo CRED"   │
├────────────────────────────────────────────────────────────────────────┤
│ 🟡 RIESGO MODERADO                                                     │
│ Clases: bg-amber-500/10 text-amber-600 dark:text-amber-400             │
│ Icono: AlertTriangle                                                   │
│ Mensaje: "Señales en observación. Control y monitoreo en 30-60 días"   │
├────────────────────────────────────────────────────────────────────────┤
│ 🔴 ALTO RIESGO / ALERTA DE NEURODESARROLLO                             │
│ Clases: bg-destructive/10 text-destructive                             │
│ Icono: AlertOctagon                                                    │
│ Mensaje: "Requiere derivación prioritaria a evaluación especializada"   │
└────────────────────────────────────────────────────────────────────────┘
```
