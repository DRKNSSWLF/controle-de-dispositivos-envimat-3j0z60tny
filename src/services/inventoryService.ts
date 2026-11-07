import pb from '@/lib/pocketbase/client'
import {
  Dispositivo,
  Colaborador,
  NovoDispositivoInput,
  NovoColaboradorInput,
} from '@/types/inventory'

export const dispositivosService = {
  async listar(filtros?: {
    tipo?: string
    colaborador?: string
    status?: string
  }): Promise<Dispositivo[]> {
    const filterParts: string[] = []
    if (filtros?.tipo && filtros.tipo !== 'todos') {
      filterParts.push(`tipo = "${filtros.tipo}"`)
    }
    if (filtros?.colaborador && filtros.colaborador !== 'todos') {
      if (filtros.colaborador === 'sem_colaborador') {
        filterParts.push(`colaborador = ""`)
      } else {
        filterParts.push(`colaborador = "${filtros.colaborador}"`)
      }
    }
    if (filtros?.status && filtros.status !== 'todos') {
      filterParts.push(`status = "${filtros.status}"`)
    }

    const records = await pb.collection('dispositivos').getFullList<Dispositivo>({
      sort: '-created',
      filter: filterParts.join(' && '),
      expand: 'colaborador',
      requestKey: null,
    })

    return records
  },

  async criar(data: NovoDispositivoInput): Promise<Dispositivo> {
    const payload: Record<string, unknown> = {
      tipo: data.tipo,
      fabricante: data.fabricante.trim(),
      modelo: data.modelo.trim(),
      numero_serie: data.numero_serie.trim(),
      imei1: data.imei1?.trim() || '',
      imei2: data.imei2?.trim() || '',
      colaborador: data.colaborador || '',
      status: data.status,
      data_aquisicao: data.data_aquisicao ? new Date(data.data_aquisicao).toISOString() : '',
      data_inicio_manutencao: data.data_inicio_manutencao
        ? new Date(data.data_inicio_manutencao).toISOString()
        : '',
      observacoes: data.observacoes?.trim() || '',
      is_demo: false,
    }

    return await pb.collection('dispositivos').create<Dispositivo>(payload)
  },

  async criarEmLote(itens: NovoDispositivoInput[]): Promise<{ criados: number; erros: string[] }> {
    let criados = 0
    const erros: string[] = []

    for (let i = 0; i < itens.length; i++) {
      const item = itens[i]
      try {
        await this.criar(item)
        criados++
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido'
        erros.push(`Linha ${i + 1} (${item.modelo || item.numero_serie}): ${msg}`)
      }
    }

    return { criados, erros }
  },

  async atualizar(id: string, data: Partial<NovoDispositivoInput>): Promise<Dispositivo> {
    const payload: Record<string, unknown> = {}
    if (data.tipo !== undefined) payload.tipo = data.tipo
    if (data.fabricante !== undefined) payload.fabricante = data.fabricante.trim()
    if (data.modelo !== undefined) payload.modelo = data.modelo.trim()
    if (data.numero_serie !== undefined) payload.numero_serie = data.numero_serie.trim()
    if (data.imei1 !== undefined) payload.imei1 = data.imei1.trim()
    if (data.imei2 !== undefined) payload.imei2 = data.imei2.trim()
    if (data.colaborador !== undefined) payload.colaborador = data.colaborador
    if (data.status !== undefined) payload.status = data.status
    if (data.data_aquisicao !== undefined) {
      payload.data_aquisicao = data.data_aquisicao
        ? new Date(data.data_aquisicao).toISOString()
        : ''
    }
    if (data.data_inicio_manutencao !== undefined) {
      payload.data_inicio_manutencao = data.data_inicio_manutencao
        ? new Date(data.data_inicio_manutencao).toISOString()
        : ''
    }
    if (data.observacoes !== undefined) payload.observacoes = data.observacoes.trim()

    return await pb.collection('dispositivos').update<Dispositivo>(id, payload)
  },

  async excluir(id: string): Promise<boolean> {
    return await pb.collection('dispositivos').delete(id)
  },

  async limparDadosDemo(): Promise<number> {
    const demos = await pb.collection('dispositivos').getFullList<Dispositivo>({
      filter: 'is_demo = true',
      requestKey: null,
    })
    for (const d of demos) {
      await pb.collection('dispositivos').delete(d.id)
    }
    return demos.length
  },
}

export const colaboradoresService = {
  async listar(): Promise<Colaborador[]> {
    return await pb.collection('colaboradores').getFullList<Colaborador>({
      sort: 'nome',
      requestKey: null,
    })
  },

  async criar(data: NovoColaboradorInput): Promise<Colaborador> {
    const payload: Record<string, unknown> = {
      nome: data.nome.trim(),
      departamento: data.departamento?.trim() || '',
      cargo: data.cargo?.trim() || '',
      email: data.email?.trim() || '',
      telefone: data.telefone?.trim() || '',
      cpf: data.cpf?.trim() || '',
      matricula: data.matricula?.trim() || '',
      observacoes: data.observacoes?.trim() || '',
    }
    return await pb.collection('colaboradores').create<Colaborador>(payload)
  },

  async criarEmLote(itens: NovoColaboradorInput[]): Promise<{ criados: number; erros: string[] }> {
    let criados = 0
    const erros: string[] = []

    for (let i = 0; i < itens.length; i++) {
      const item = itens[i]
      try {
        await this.criar(item)
        criados++
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido'
        erros.push(`Linha ${i + 1} (${item.nome}): ${msg}`)
      }
    }

    return { criados, erros }
  },

  async atualizar(id: string, data: Partial<NovoColaboradorInput>): Promise<Colaborador> {
    return await pb.collection('colaboradores').update<Colaborador>(id, data)
  },

  async excluir(id: string): Promise<boolean> {
    return await pb.collection('colaboradores').delete(id)
  },
}
