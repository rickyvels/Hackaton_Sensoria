/**
 * Identidad de la aplicación en un solo lugar.
 *
 * `Tinkuy` significa "encuentro" en quechua: el encuentro entre la familia, el
 * primer nivel de atención y el equipo especializado.
 *
 * Las claves de almacenamiento siguen usando el prefijo `neuroalianza.` a
 * propósito: renombrarlas dejaría fuera el avance ya guardado en los
 * navegadores que estén probando la demo.
 */

export const BRAND_NAME = "Tinkuy"

/** Se resalta en la segunda mitad del nombre, como hacía la marca anterior. */
export const BRAND_NAME_PARTS = { lead: "Tin", accent: "kuy" } as const

export const BRAND_TAGLINE = "Neurodesarrollo INSN San Borja"

/**
 * Logotipo oficial. Cuando el archivo esté en `src/assets/tinkuy-logo.png`,
 * cambia `LOGO_SRC` por su import y `BrandMark` lo usará en lugar del símbolo
 * provisional.
 */
export const LOGO_SRC: string | null = null
