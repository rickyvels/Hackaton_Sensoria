#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const SRC_DIR = path.resolve(process.cwd(), "src")

/**
 * Reglas de auditoría para tokens de diseño y estándares normativos (docs/neuro_estandares.md)
 * Aplica a código de la aplicación (excluyendo src/components/ui que son componentes base de shadcn).
 */
const FORBIDDEN_RULES = [
  {
    category: "Tipografía Prohibida",
    regex: /\btext-md\b/g,
    reason: "text-md (< 14px) está prohibido según docs/DESIGN_SYSTEM_AND_TOKENS.md (mínimo text-md)",
  },
  {
    category: "Tamaños de Fuente Hardcodeados",
    regex: /\btext-\[\s*[^\]]+\]/g,
    reason: "Valores arbitrarios en text-[...] están prohibidos (usar escala oficial text-md, text-lg, text-xl...)",
  },
  {
    category: "Bordes Redondeados Hardcodeados",
    regex: /\brounded-\[\s*[^\]]+\]/g,
    reason: "Valores arbitrarios en rounded-[...] están prohibidos (usar tokens rounded-lg, rounded-xl, rounded-2xl, rounded-full)",
  },
  {
    category: "Espaciados y Gaps Hardcodeados",
    regex: /\b(gap|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|space-x|space-y)-\[\s*[^\]]+\]/g,
    reason: "Valores arbitrarios de padding/margin/gap están prohibidos (usar escala estándar de Tailwind: gap-2, p-4, etc.)",
  },
  {
    category: "Dimensiones Hardcodeadas",
    regex: /\b(w|h|min-w|min-h|max-w|max-h|top|bottom|left|right)-\[\s*\d+px\s*\]/g,
    reason: "Dimensiones en píxeles hardcodeados están prohibidas (usar tokens estándar w-12, h-12, min-h-11, etc.)",
  },
  {
    category: "Colores Hexadecimales Hardcodeados",
    regex: /\b(bg|text|border|ring|fill|stroke)-\[#[0-9a-fA-F]{3,8}\]/g,
    reason: "Colores hexadecimales directos están prohibidos (usar tokens semánticos: bg-primary, text-muted-foreground, etc.)",
  },
]

function scanDirectory(dir, issues = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relPath = path.relative(process.cwd(), fullPath)

    if (entry.isDirectory()) {
      // Excluir node_modules, dist y los componentes base de shadcn (src/components/ui)
      if (
        entry.name !== "node_modules" &&
        entry.name !== "dist" &&
        !relPath.startsWith("src/components/ui")
      ) {
        scanDirectory(fullPath, issues)
      }
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) &&
      !relPath.startsWith("src/components/ui") &&
      !entry.name.includes(".test.")
    ) {
      const content = fs.readFileSync(fullPath, "utf8")
      const lines = content.split("\n")

      lines.forEach((line, lineIndex) => {
        for (const rule of FORBIDDEN_RULES) {
          const matches = line.match(rule.regex)
          if (matches) {
            matches.forEach((match) => {
              issues.push({
                file: relPath,
                line: lineIndex + 1,
                category: rule.category,
                match,
                reason: rule.reason,
                snippet: line.trim(),
              })
            })
          }
        }
      })
    }
  }

  return issues
}

console.log("🔍 [Neuroalianza Linter] Escaneando aplicación (excluyendo src/components/ui/ y tests)...\n")
const issues = scanDirectory(SRC_DIR)

if (issues.length === 0) {
  console.log("✅ ¡Excelente! No se encontraron valores hardcodeados ni tamaños prohibidos en las vistas y componentes del proyecto.")
  process.exit(0)
} else {
  const byCategory = {}
  issues.forEach((issue) => {
    if (!byCategory[issue.category]) byCategory[issue.category] = []
    byCategory[issue.category].push(issue)
  })

  console.log(`⚠️  Se encontraron ${issues.length} infracciones a los estándares de diseño:\n`)

  for (const [category, items] of Object.entries(byCategory)) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`📌 ${category.toUpperCase()} (${items.length} ocurrencias)`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    items.forEach((issue) => {
      console.log(`  📄 ${issue.file}:${issue.line}`)
      console.log(`     Valor detectado: '${issue.match}'`)
      console.log(`     Motivo: ${issue.reason}`)
      console.log(`     Código: ${issue.snippet}\n`)
    })
  }

  console.log(`════════════════════════════════════════════════════════════`)
  console.log(`Total general de infracciones: ${issues.length}`)
  console.log(`════════════════════════════════════════════════════════════\n`)
  process.exit(1)
}
