import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Tema claro/escuro da ferramenta — estratégia "class" no Tailwind (classe "dark"
// no <html>), persistido em localStorage. O seletor vive na tela de login (pedido
// do usuário) e também no cabeçalho da ferramenta, para trocar depois de logar.

export type Tema = 'claro' | 'escuro'

const CHAVE_TEMA = 'envimat-tema'

function temaInicial(): Tema {
  try {
    const salvo = localStorage.getItem(CHAVE_TEMA)
    if (salvo === 'claro' || salvo === 'escuro') return salvo
  } catch {
    // localStorage indisponível (ex.: modo privado restrito) — usa o padrão.
  }
  return 'claro'
}

function aplicarTema(tema: Tema) {
  const raiz = document.documentElement
  raiz.classList.toggle('dark', tema === 'escuro')
  raiz.style.colorScheme = tema === 'escuro' ? 'dark' : 'light'
}

interface TemaContexto {
  tema: Tema
  alternar: () => void
}

const TemaContext = createContext<TemaContexto | undefined>(undefined)

export function TemaProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(temaInicial)

  useEffect(() => {
    aplicarTema(tema)
    try {
      localStorage.setItem(CHAVE_TEMA, tema)
    } catch {
      // Sem persistência disponível — o tema vale só para a sessão atual.
    }
  }, [tema])

  const alternar = () => setTema((t) => (t === 'escuro' ? 'claro' : 'escuro'))

  return <TemaContext.Provider value={{ tema, alternar }}>{children}</TemaContext.Provider>
}

export function useTema() {
  const ctx = useContext(TemaContext)
  if (!ctx) throw new Error('useTema deve ser usado dentro de TemaProvider')
  return ctx
}

/** Botão de alternância claro/escuro (usado na tela de login e no cabeçalho). */
export function BotaoAlternarTema({ className = '' }: { className?: string }) {
  const { tema, alternar } = useTema()
  const escuro = tema === 'escuro'
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={alternar}
      className={`rounded-xl h-9 border-emerald-200 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-900/50 ${className}`}
      title={escuro ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
      aria-label={escuro ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
    >
      {escuro ? <Sun className="w-4 h-4 sm:mr-1.5" /> : <Moon className="w-4 h-4 sm:mr-1.5" />}
      <span className="hidden sm:inline">{escuro ? 'Claro' : 'Escuro'}</span>
    </Button>
  )
}
