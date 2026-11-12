import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import client from '@/lib/pocketbase/client'

export const DOMINIO_EMPRESA = '@envimat.com.br'

export const emailCorporativoValido = (email: string) =>
  email.trim().toLowerCase().endsWith(DOMINIO_EMPRESA)

export type NivelPermissao = 'master' | 'admin'

export interface UsuarioLogado {
  id: string
  nome: string
  email: string
  nivel: NivelPermissao
}

interface AuthContexto {
  usuario: UsuarioLogado | null
  carregando: boolean
  entrar: (email: string, senha: string) => Promise<void>
  sair: () => void
  ehMaster: boolean
}

const AuthContext = createContext<AuthContexto | undefined>(undefined)

function usuarioDoAuthRecord(): UsuarioLogado | null {
  const rec = client.authStore.record
  if (!rec || !rec.id) return null
  return {
    id: rec.id as string,
    nome: (rec.name as string) || (rec.email as string) || '',
    email: (rec.email as string) || '',
    nivel: ((rec.nivel as string) === 'master' ? 'master' : 'admin') as NivelPermissao,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(() => usuarioDoAuthRecord())
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    // Valida a sessão armazenada; se o token expirou, limpa.
    if (client.authStore.isValid) {
      client
        .collection('users')
        .authRefresh()
        .then(() => setUsuario(usuarioDoAuthRecord()))
        .catch(() => {
          client.authStore.clear()
          setUsuario(null)
        })
        .finally(() => setCarregando(false))
    } else {
      client.authStore.clear()
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    const desinscrever = client.authStore.onChange(() => {
      setUsuario(usuarioDoAuthRecord())
    })
    return desinscrever
  }, [])

  const entrar = async (email: string, senha: string) => {
    if (!emailCorporativoValido(email)) {
      throw new Error('Acesso permitido apenas para e-mails corporativos @envimat.com.br.')
    }
    // Em caso de falha o PocketBase lança erro 400 ("Failed to authenticate.")
    // e o hook servidor registra o log de falha.
    await client.collection('users').authWithPassword(email.trim().toLowerCase(), senha)
  }

  const sair = () => {
    client.authStore.clear()
  }

  return (
    <AuthContext.Provider
      value={{ usuario, carregando, entrar, sair, ehMaster: usuario?.nivel === 'master' }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
