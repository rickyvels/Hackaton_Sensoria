# Neuroalianza — Estándares de Frontend y Reglas de Implementación (PWA)

**Hackatón Niño San Borja 2026 · Desafío 04: Neurodesarrollo**  
Versión 2.0 · Documento normativo de frontend (shadcn/ui + Mobile-First PWA)

---

## 1. Propósito y Carácter Normativo

Este documento es **normativo y de obligado cumplimiento**. Define la forma oficial y estandarizada de construir la interfaz de usuario en el proyecto Neuroalianza.

Cada regla busca evitar dos fallas recurrentes:
1. **Reinventar componentes que ya existen:** Prohibido crear controles básicos a mano.
2. **Codificar valores en duro:** Prohibido el uso de colores hexadecimales, fuentes ilegibles o espaciados arbitrarios.

---

## 2. Regla Cero

> **shadcn/ui es la única fuente de componentes de interfaz del proyecto.**
>
> No se escribe un componente de interfaz a mano. No se instala otra librería de componentes. Si un componente no existe en `src/components/ui/`, se instala desde el CLI oficial de shadcn:
> ```bash
> npx shadcn@latest add <componente>
> ```

---

## 3. Arquitectura PWA y Layout Mobile-First

1. **`MobileAppShell`:** La aplicación se renderiza optimizada para dispositivos móviles (ancho 100% en móvil; contenedor centrado `max-w-md` en escritorio).
2. **Navegación Ergonómica:** Barra de navegación inferior fija (`BottomNavBar`) con iconos de `lucide-react`.
3. **Áreas Táctiles:** Mínimo $44\times 44\text{ px}$ en todo control interactivo.

---

## 4. Dependencias Permitidas

| Librería | Función Exclusiva |
| :--- | :--- |
| `shadcn/ui` / `@radix-ui/*` | Componentes base y primitivas de interfaz accesibles |
| `lucide-react` | Iconografía del sistema |
| `tailwindcss` + `tailwind-merge` + `clsx` | Estilos y utilidades CSS (`cn(...)`) |
| `@tanstack/react-query` | Estado del servidor y sincronización offline |
| `react-router-dom` | Enrutamiento del lado del cliente |
| `recharts` | Gráficos analíticos de gestión hospitalaria |
| `date-fns` | Manipulación de fechas |

---

## 5. Estructura de Carpetas

```
src/
├── main.tsx                         # Entrada con providers
├── App.tsx                          # Rutas envueltas en MobileAppShell
├── index.css                        # Variables CSS de tema shadcn/ui
├── components/
│   ├── ui/                          # Componentes shadcn (Button, Card, Dialog, Input...)
│   ├── shared/                      # Componentes de dominio (SemaforoRiesgo, TimelineItem...)
│   └── layout/                      # MobileAppShell, BottomNavBar, TopHeader
├── features/                        # Módulos de negocio (screening, referral, appointments...)
├── pages/                           # Vistas por actor (/public, /salud, /familia, /clinico, /demo)
├── hooks/                           # Custom Hooks
├── services/                        # Cliente API generado desde OpenAPI
└── utils/                           # Utilidad cn (clsx + twMerge)
```

---

## 6. Prohibiciones Estrictas

1. **Prohibido:** Colores hexadecimales en clases (`bg-[#3B82F6]`) o estilos inline.
2. **Prohibido:** Fuentes menores a `text-md` (16px).
3. **Prohibido:** Botones, inputs o modales nativos HTML sin encapsular.
4. **Prohibido:** Emitir diagnósticos médicos automáticos en los textos de la interfaz.

---

## 7. Verificación de Calidad

Todo código debe superar:
```bash
npm run typecheck && npm run lint && npm run test
```
