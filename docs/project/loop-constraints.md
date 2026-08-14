# Restricciones del loop

- No modificar archivos fuera de este proyecto.
- No ejecutar acciones externas, push, merge o despliegue.
- No eliminar ni migrar datos sin una copia recuperable y autorización explícita.
- No cambiar el gate humano, los roles o el aislamiento de casos sin pruebas específicas.
- No incorporar datos clínicos reales ni secretos.
- No aceptar un build exitoso como sustituto de pruebas funcionales.
- Detener el ciclo ante tres fallos consecutivos con la misma causa y registrar el bloqueo en `STATE.md`.
