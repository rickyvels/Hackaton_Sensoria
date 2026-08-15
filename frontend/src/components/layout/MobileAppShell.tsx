import { MobileAppLayout, type MobileAppLayoutProps } from "./MobileAppLayout"

export type MobileAppShellProps = MobileAppLayoutProps

/**
 * MobileAppShell es un alias y contenedor modular para MobileAppLayout.
 * Proporciona el contenedor PWA Mobile-First con slots configurables.
 */
export function MobileAppShell(props: MobileAppShellProps) {
  return <MobileAppLayout {...props} />
}

export { MobileAppLayout }
