import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/lib/auth'
import { TemaProvider } from '@/hooks/use-tema'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import TelaLogin from './pages/TelaLogin'
import Layout from './components/Layout'
import type { ReactNode } from 'react'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE
// AVOID REMOVING ANY CONTEXT PROVIDERS FROM THIS FILE (e.g. TooltipProvider, Toaster, Sonner)

function RotaProtegida({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth()

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafcf9] dark:bg-[#0b1a12]">
        <p className="text-emerald-700 dark:text-emerald-dark-600 text-sm animate-pulse">
          Carregando...
        </p>
      </div>
    )
  }
  if (!usuario) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RotaLogin() {
  const { usuario, carregando } = useAuth()
  if (carregando) return null
  if (usuario) return <Navigate to="/" replace />
  return <TelaLogin />
}

const App = () => (
  <TemaProvider>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<RotaLogin />} />
            <Route
              element={
                <RotaProtegida>
                  <Layout />
                </RotaProtegida>
              }
            >
              <Route path="/" element={<Index />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  </TemaProvider>
)

export default App
