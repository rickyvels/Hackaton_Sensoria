# Traducción al quechua

## Estado

**Las cadenas en quechua de `apps/family-pwa/src/i18n.ts` están pendientes de revisión por una
persona quechuahablante.** El mecanismo funciona; el contenido no está validado.

Se usó **quechua sureño (chanka/collao)**, la variante con más hablantes en Perú. No es
intercambiable con el quechua central (Áncash, Huánuco) ni con el norteño: una familia de
Huaraz puede no reconocer varios de estos términos.

Publicar una traducción sin revisar en una aplicación de salud tiene un costo asimétrico. Una
familia que no entiende el español confía en lo que lee aquí, y un término mal elegido en una
etapa clínica —«evaluación», «alta», «seguimiento»— no confunde: desinforma. Antes de la entrega,
alguien que hable la variante debe revisar al menos las etapas de la ruta y el aviso de seguridad.

## Qué está traducido

Cabecera, selector de idioma, navegación inferior, pantalla de acceso y pantalla de inicio con
las seis etapas de la ruta.

## Qué sigue en español

- Los formularios de registro y de reporte de dificultad.
- Las pantallas de agenda, documentos, equipo, ayuda y la libreta.
- **Todo el texto que genera la API**: el mensaje de la ruta, los títulos de tarea, las
  propuestas de los agentes y las respuestas del asistente. Traducir esto exige llevar el idioma
  al backend, no basta con el diccionario del frontend.

Esa mezcla se nota: al cambiar a quechua, parte de la pantalla sigue en español. Es una decisión
consciente de alcance, no un olvido.

## Cómo añadir cadenas

1. Añade la clave a `strings` en `apps/family-pwa/src/i18n.ts`, con sus dos idiomas.
2. Usa `t('miClave')` en el componente. `StringKey` obliga a que la clave exista.

El tipo `satisfies Record<string, Copy>` impide olvidar un idioma: si falta `qu`, no compila.
