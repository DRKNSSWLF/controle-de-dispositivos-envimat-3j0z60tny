// Serviço de anexos de contratos assinados (comodato/distrato).
// Usa a coleção anexos_contratos (relation → contratos, arquivo file obrigatório),
// com permissão de escrita/leitura para qualquer autenticado (Master/Administrativo).

import pb from '@/lib/pocketbase/client'

export interface AnexoContrato {
  id: string
  contrato: string
  arquivo: string
  nome: string
  enviado_por?: string
  created?: string
  updated?: string
  expand?: {
    enviado_por?: { id: string; name?: string; email?: string }
  }
}

const urlArquivo = (anexo: AnexoContrato) =>
  `${pb.baseUrl}/api/files/anexos_contratos/${anexo.id}/${anexo.arquivo}`

export const anexosContratosService = {
  async listarPorContrato(contratoId: string): Promise<AnexoContrato[]> {
    const r = await pb.collection('anexos_contratos').getFullList({
      filter: `contrato="${contratoId}"`,
      sort: 'created',
      expand: 'enviado_por',
      requestKey: null,
    })
    return r.map((m) => ({
      id: m.id,
      contrato: m.contrato as string,
      arquivo: m.arquivo as string,
      nome: (m.nome as string) || (m.arquivo as string) || 'anexo',
      enviado_por: m.enviado_por as string,
      created: m.created,
      updated: m.updated,
      expand: m.expand,
    }))
  },

  async anexar(contratoId: string, arquivo: File, nomeOpcional?: string): Promise<void> {
    const form = new FormData()
    form.append('contrato', contratoId)
    form.append('arquivo', arquivo)
    if (nomeOpcional) form.append('nome', nomeOpcional)
    await pb.collection('anexos_contratos').create(form)
  },

  async remover(id: string): Promise<void> {
    await pb.collection('anexos_contratos').delete(id)
  },

  urlArquivo,
}
