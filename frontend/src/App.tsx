import { BrowserRouter, Routes, Route } from "react-router-dom"
import { CaseProvider } from "@/context/CaseContext"
import { TinyProgressProvider } from "@/context/TinyProgressContext"
import { AuthProvider } from "@/context/AuthContext"
import { LanguageProvider } from "@/i18n/LanguageContext"
import { RequireFamilySession } from "@/components/auth/RequireFamilySession"
import { FamilyAccessPage } from "@/pages/auth/FamilyAccessPage"
import { LandingPage } from "@/pages/public/LandingPage"
import { NotFoundPage } from "@/pages/public/NotFoundPage"
import { MobileAppLayout } from "@/components/layout/MobileAppLayout"
import { AppIndexPage } from "@/pages/app/AppIndexPage"
import { ResourcesPage } from "@/pages/resources/ResourcesPage"
import { AppointmentsTrackingPage } from "@/pages/tracking/AppointmentsTrackingPage"
import { UserProfilePage } from "@/pages/profile/UserProfilePage"
import { HealthWorkerDashboard } from "@/pages/health-worker/HealthWorkerDashboard"
import { NewScreeningPage } from "@/pages/health-worker/NewScreeningPage"
import { ScreeningResultPage } from "@/pages/health-worker/ScreeningResultPage"
import { FamilyHomePage } from "@/pages/family/FamilyHomePage"
import { FamilyRoadmapPage } from "@/pages/family/FamilyRoadmapPage"
import { ChildProfilePage } from "@/pages/family/ChildProfilePage"
import { SpecialistDashboard } from "@/pages/specialist/SpecialistDashboard"
import { CaseDetailPage } from "@/pages/specialist/CaseDetailPage"
import { ClinicalMetricsPage } from "@/pages/specialist/ClinicalMetricsPage"
import { DemoControlPanelPage } from "@/pages/demo/DemoControlPanelPage"

export function AppRoutes() {
  return (
    <Routes>
      {/* 1. Ruta Principal: Landing Page Responsiva (Desktop + Móvil) */}
      <Route path="/" element={<LandingPage />} />

      {/* 2. Acceso familiar: ingreso y registro antes de entrar a la aplicación */}
      <Route path="/acceso" element={<FamilyAccessPage />} />

      {/* 3. Ruta de Aplicación: Layout Modular PWA Mobile-First */}
      <Route
        path="/app"
        element={
          <RequireFamilySession>
            <MobileAppLayout />
          </RequireFamilySession>
        }
      >
        {/* Rutas Principales de la Barra Inferior (Diseño PWA) */}
        <Route index element={<AppIndexPage />} />
        <Route path="recursos" element={<ResourcesPage />} />
        <Route path="salud" element={<HealthWorkerDashboard />} />
        <Route path="salud/tamizaje/nuevo" element={<NewScreeningPage />} />
        <Route path="salud/tamizaje/:id" element={<ScreeningResultPage />} />
        
        <Route path="citas" element={<AppointmentsTrackingPage />} />
        <Route path="perfil" element={<UserProfilePage />} />

        {/* Módulos Especializados y Familia */}
        <Route path="familia" element={<FamilyHomePage />} />
        <Route path="mi-hijo" element={<ChildProfilePage />} />
        <Route path="familia/ruta" element={<FamilyRoadmapPage />} />
        <Route path="familia/citas" element={<AppointmentsTrackingPage />} />

        {/* Módulos Clínicos para Especialistas */}
        <Route path="clinico" element={<SpecialistDashboard />} />
        <Route path="clinico/casos/:id" element={<CaseDetailPage />} />
        <Route path="clinico/metricas" element={<ClinicalMetricsPage />} />

        {/* Demostración y Pitch */}
        <Route path="demo" element={<DemoControlPanelPage />} />
        
        {/* Alias de conveniencia */}
        <Route path="pacientes" element={<HealthWorkerDashboard />} />
        <Route path="home" element={<AppIndexPage />} />
      </Route>

      {/* 4. Ruta Fallback 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <CaseProvider>
            <TinyProgressProvider>
              <AppRoutes />
            </TinyProgressProvider>
          </CaseProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}
