import { useState, useEffect, createContext, useContext, type ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import type { NivelAcesso } from '@/types/inventory'

export interface UsuarioLogado {
  id: string
  email: string
  nome: string
  nivel: NivelAcesso
}

interface AuthContexto {
  usuario: UsuarioLogado | null
  ehMaster: boolean
  carregando: boolean
  entrar: (email: string, senha: string) => Promise<void>
  sair: () => void
  trocarSenha: (senhaAtual: string, novaSenha: string) => Promise<void>
  recarregar: () => Promise<void>
}

const AuthContext = createContext<AuthContexto | null>(null)

export const DOMINIO_EMPRESA = '@envimat.com.br'

export const emailCorporativoValido = (email: string) =>
  email.trim().toLowerCase().endsWith(DOMINIO_EMPRESA)

function mapearUsuario(model: any): UsuarioLogado {
  return {
    id: model.id,
    email: model.email,
    nome: model.name || model.email,
    nivel: model.nivel === 'admin' ? 'admin' : 'master',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (pb.authStore.isValid) {
      setUsuario(mapearUsuario(pb.authStore.record))
    }
    setCarregando(false)
    const unsubscribe = pb.authStore.onChange(() => {
      setUsuario(pb.authStore.isValid ? mapearUsuario(pb.authStore.record) : null)
    })
    return unsubscribe
  }, [])

  const entrar = async (email: string, senha: string) => {
    if (!emailCorporativoValido(email)) {
      throw new Error(
        `Acesso permitido apenas para e-mails corporativos ${DOMINIO_EMPRESA}. Não há auto-cadastro: procure o nível Master.`,
      )
    }
    await pb.collection('users').authWithPassword(email.trim().toLowerCase(), senha)
  }

  const sair = () => pb.authStore.clear()

  const trocarSenha = async (senhaAtual: string, novaSenha: string) => {
    if (!usuario) throw new Error('Usuário não autenticado.')
    await pb.collection('users').update(usuario.id, {
      password: novaSenha,
      oldPassword: senhaAtual,
      passwordConfirm: novaSenha,
    })
  }

  const recarregar = async () => {
    if (!usuario) return
    try {
      const r = await pb.collection('users').getOne(usuario.id)
      setUsuario(mapearUsuario(r))
    } catch {
      /* sessão ainda válida; ignora falha de leitura */
    }
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        ehMaster: usuario?.nivel === 'master',
        carregando,
        entrar,
        sair,
        trocarSenha,
        recarregar,
      }}
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
