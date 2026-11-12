// Serviço de Linhas Telefônicas (mesmas regras de dispositivos/comodato)

import pb from '@/lib/pocketbase/client'
import type {
  Colaborador,
  LinhaTelefonica,
  NovaLinhaInput,
  SituacaoVinculo,
  VinculoLinha,
  NovoVinculoLinhaInput,
} from '@/types/inventory'
import { vinculosService } from './inventoryService'

const EXPAND = 'colaborador'

function mapearLinha(m: any): LinhaTelefonica {
  return {
    id: m.id,
    numero: m.numero || '',
    operadora: m.operadora || '',
    plano: m.plano || '',
    tipo: m.tipo === 'modem' ? 'modem' : 'celular',
    imei: m.imei,
    colaborador: m.colaborador || '',
    status: m.status || 'disponivel',
    observacoes: m.observacoes,
    is_demo: m.is_demo,
    created: m.created,
    updated: m.updated,
    expand: m.expand,
  }
}

function mapearVinculoLinha(m: any): VinculoLinha {
  return {
    id: m.id,
    colaborador: m.colaborador,
    linha: m.linha,
    data_inicio: m.data_inicio,
    data_fim: m.data_fim,
    situacao: (m.situacao === 'encerrado' ? 'encerrado' : 'ativo') as SituacaoVinculo,
    motivo_encerramento: m.motivo_encerramento,
    observacoes: m.observacoes,
    created: m.created,
    updated: m.updated,
    expand: m.expand,
  }
}

export const linhasService = {
  async listar(): Promise<LinhaTelefonica[]> {
    const r = await pb.collection('linhas_telefonicas').getFullList({
      sort: '-created',
      expand: EXPAND,
      requestKey: null,
    })
    return r.map(mapearLinha)
  },

  async criar(input: NovaLinhaInput): Promise<LinhaTelefonica> {
    const r = await pb.collection('linhas_telefonicas').create(input)
    return mapearLinha(r)
  },

  async atualizar(id: string, dados: Partial<NovaLinhaInput>): Promise<void> {
    await pb.collection('linhas_telefonicas').update(id, dados)
  },

  async excluir(id: string): Promise<void> {
    await pb.collection('linhas_telefonicas').delete(id)
  },

  async limparDadosDemo(): Promise<number> {
    const r = await pb
      .collection('linhas_telefonicas')
      .getFullList({ filter: 'is_demo=true', requestKey: null })
    for (const item of r) await pb.collection('linhas_telefonicas').delete(item.id)
    return r.length
  },
}

export const vinculosLinhasService = {
  async listar(): Promise<VinculoLinha[]> {
    const r = await pb.collection('vinculos_linhas').getFullList({
      sort: '-created',
      expand: 'colaborador,linha',
      requestKey: null,
    })
    return r.map(mapearVinculoLinha)
  },

  /** Vincula a linha ao colaborador. A linha fica em uso; histórico preservado. */
  async vincular(input: NovoVinculoLinhaInput): Promise<VinculoLinha> {
    const r = await pb.collection('vinculos_linhas').create({
      colaborador: input.colaborador,
      linha: input.linha,
      data_inicio: input.data_inicio || new Date().toISOString().slice(0, 10),
      situacao: 'ativo',
      observacoes: input.observacoes,
    })
    await pb.collection('linhas_telefonicas').update(input.linha, { status: 'em_uso' })
    return mapearVinculoLinha(r)
  },

  /** Encerra o vínculo (sem exclusão): linha volta para disponivel. */
  async encerrar(vinculo: VinculoLinha, motivo: string): Promise<void> {
    await pb.collection('vinculos_linhas').update(vinculo.id, {
      situacao: 'encerrado',
      data_fim: new Date().toISOString().slice(0, 10),
      motivo_encerramento: motivo,
    })
    await pb.collection('linhas_telefonicas').update(vinculo.linha, { status: 'disponivel' })
  },

  /** Desliga um colaborador: encerra todos os vínculos ativos de linhas dele. */
  async encerrarTodosDoColaborador(colaboradorId: string): Promise<number> {
    const ativos = await pb.collection('vinculos_linhas').getFullList({
      filter: `colaborador="${colaboradorId}" && situacao="ativo"`,
      requestKey: null,
    })
    for (const v of ativos) {
      await this.encerrar(mapearVinculoLinha(v), 'Desligamento do colaborador da empresa')
    }
    return ativos.length
  },
}

export { vinculosService }
