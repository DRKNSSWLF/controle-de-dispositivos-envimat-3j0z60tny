// Serviço de tipos de dispositivo (coleção tipos_dispositivo).
// A escrita é fechada por regras de API; o CRUD passa pelo hook autenticado
// /backend/v1/envimat/tipos-dispositivo (pocketbase/hooks/tipos_dispositivo.pb.js),
// que controla o papel (master/admin; exclusão só master e sem dispositivos em uso).

import pb from '@/lib/pocketbase/client'

export interface TipoDispositivoCadastrado {
  id: string
  nome: string
  usa_imei: boolean
}

// O frontend é estático e NÃO faz proxy de /backend: as rotas do hook só existem
// no host do PocketBase (VITE_POCKETBASE_URL). Caminho relativo devolve o
// index.html da SPA → "Unexpected token '<'" ao tentar parsear JSON.
const BASE = `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/envimat/tipos-dispositivo`

async function request<T>(url: string, opcoes?: RequestInit): Promise<T> {
  const resposta = await fetch(url, opcoes)
  if (!resposta.ok) {
    let mensagem = 'Falha na comunicação com o servidor.'
    try {
      const corpo = await resposta.json()
      if (corpo && typeof corpo.message === 'string') mensagem = corpo.message
    } catch {
      /* corpo não-JSON: mantém mensagem padrão */
    }
    throw new Error(mensagem)
  }
  return (await resposta.json()) as T
}

function autorizacao(): string {
  const token = pb.authStore.token
  if (!token) throw new Error('Sessão expirada. Faça login novamente.')
  return token
}

function jsonPost(metodo: string, corpo: unknown): RequestInit {
  return {
    method: metodo,
    headers: {
      Authorization: autorizacao(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(corpo),
  }
}

export const tiposDispositivoService = {
  async listar(): Promise<TipoDispositivoCadastrado[]> {
    return await request<TipoDispositivoCadastrado[]>(BASE, {
      headers: { Authorization: autorizacao() },
    })
  },

  async criar(nome: string, usaImei: boolean): Promise<TipoDispositivoCadastrado> {
    return await request<TipoDispositivoCadastrado>(
      BASE,
      jsonPost('POST', { nome, usa_imei: usaImei }),
    )
  },

  async renomear(id: string, nome: string, usaImei?: boolean): Promise<TipoDispositivoCadastrado> {
    return await request<TipoDispositivoCadastrado>(
      `${BASE}/${id}`,
      jsonPost('PATCH', { nome, usa_imei: usaImei }),
    )
  },

  /** Exclusão restrita a master e apenas quando nenhum dispositivo usa o tipo. */
  async excluir(id: string): Promise<void> {
    await request<{ ok: boolean }>(`${BASE}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: autorizacao() },
    })
  },
}
