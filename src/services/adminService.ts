// Serviço de administração de contas de usuário e logs de acesso (nível Master)

import pb from '@/lib/pocketbase/client'
import type { NivelAcesso } from '@/types/inventory'

export interface ContaUsuario {
  id: string
  email: string
  nome: string
  nivel: NivelAcesso
  created?: string
}

export interface LogAcesso {
  id: string
  email: string
  usuario?: string
  resultado: 'sucesso' | 'falha'
  ip?: string
  origem?: string
  criado_em?: string
  expand?: { usuario?: { nome?: string; email?: string } }
}

function mapearConta(m: any): ContaUsuario {
  return {
    id: m.id,
    email: m.email,
    nome: m.name || m.email,
    nivel: m.nivel === 'admin' ? 'admin' : 'master',
    created: m.created,
  }
}

export const usuariosService = {
  async listar(): Promise<ContaUsuario[]> {
    const r = await pb.collection('users').getFullList({ sort: '-created', requestKey: null })
    return r.map(mapearConta)
  },

  async criar(
    nome: string,
    email: string,
    nivel: NivelAcesso,
    senha: string,
  ): Promise<ContaUsuario> {
    const r = await pb.collection('users').create({
      name: nome,
      email: email.trim().toLowerCase(),
      password: senha,
      passwordConfirm: senha,
      nivel,
    })
    return mapearConta(r)
  },

  async alterarNivel(id: string, nivel: NivelAcesso): Promise<void> {
    await pb.collection('users').update(id, { nivel })
  },

  /**
   * Troca a senha de um usuário.
   * - Master redefinindo a senha de OUTRO usuário: envia apenas a nova senha.
   * - Usuário trocando a PRÓPRIA senha: a API exige a senha atual (oldPassword).
   */
  async trocarSenha(id: string, novaSenha: string, senhaAtual?: string): Promise<void> {
    const dados: Record<string, string> = {
      password: novaSenha,
      passwordConfirm: novaSenha,
    }
    if (senhaAtual) dados.oldPassword = senhaAtual
    await pb.collection('users').update(id, dados)
  },
}

export const logsService = {
  async listar(limit = 300): Promise<LogAcesso[]> {
    const r = await pb.collection('logs_acesso').getList(1, limit, {
      sort: '-created',
      expand: 'usuario',
      requestKey: null,
    })
    return r.items.map((m: any) => ({
      id: m.id,
      email: m.email,
      usuario: m.usuario,
      resultado: m.resultado === 'sucesso' ? 'sucesso' : 'falha',
      ip: m.ip,
      origem: m.origem,
      criado_em: m.created,
      expand: m.expand,
    }))
  },
}
