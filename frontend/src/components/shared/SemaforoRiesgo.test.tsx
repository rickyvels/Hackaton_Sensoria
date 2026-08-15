import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SemaforoRiesgo } from './SemaforoRiesgo'

describe('SemaforoRiesgo Component', () => {
  it('renderiza correctamente el estado de ALTO RIESGO con recomendaciones', () => {
    render(
      <SemaforoRiesgo
        nivel="ALTO"
        justificacion="2 señales de alerta críticas observadas"
        recomendacion="Derivar de urgencia a INSN San Borja"
      />
    )

    expect(screen.getByRole('heading', { name: /Alerta de Neurodesarrollo/i })).toBeInTheDocument()
    expect(screen.getByText('2 señales de alerta críticas observadas')).toBeInTheDocument()
    expect(screen.getByText('Derivar de urgencia a INSN San Borja')).toBeInTheDocument()
  })

  it('renderiza correctamente el estado de BAJO RIESGO', () => {
    render(
      <SemaforoRiesgo
        nivel="BAJO"
        justificacion="Hitos de desarrollo normales para la edad"
      />
    )

    expect(screen.getByRole('heading', { name: /Desarrollo Acorde a la Edad/i })).toBeInTheDocument()
    expect(screen.getByText('Hitos de desarrollo normales para la edad')).toBeInTheDocument()
  })

  it('renderiza correctamente el estado de RIESGO MODERADO', () => {
    render(
      <SemaforoRiesgo
        nivel="MODERADO"
        justificacion="Requiere seguimiento en 45 días"
      />
    )

    expect(screen.getByRole('heading', { name: /Señales en Observación/i })).toBeInTheDocument()
    expect(screen.getByText('Requiere seguimiento en 45 días')).toBeInTheDocument()
  })
})
