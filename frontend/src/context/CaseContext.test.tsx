import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import { CaseProvider, useCase } from "./CaseContext"

function ReferralButton() {
  const { submitReferral } = useCase()
  return (
    <button
      type="button"
      onClick={() =>
        submitReferral({
          patientId: "pat-1",
          findings: [],
          priority: "ordinaria",
          notes: "Prueba de vista previa",
          targetCenter: "INSN San Borja",
        })
      }
    >
      Crear derivación
    </button>
  )
}

describe("CaseProvider", () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it("keeps demo referral codes unique after the provider remounts", () => {
    const { unmount } = render(
      <CaseProvider>
        <ReferralButton />
      </CaseProvider>,
    )

    fireEvent.click(screen.getByRole("button", { name: "Crear derivación" }))
    unmount()

    render(
      <CaseProvider>
        <ReferralButton />
      </CaseProvider>,
    )
    fireEvent.click(screen.getByRole("button", { name: "Crear derivación" }))

    expect(window.sessionStorage.getItem("neuroalianza.preview.referral-sequence")).toBe("1002")
  })
})
