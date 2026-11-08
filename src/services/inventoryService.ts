import pb from '@/lib/pocketbase/client'
import {
  Colaborador,
  Contrato,
  Dispositivo,
  HistoricoMovimentacao,
  Manutencao,
  NovaPessoaJuridicaInput,
  NovoColaboradorInput,
  NovoDispositivoInput,
  NovoVinculoInput,
  PessoaJuridica,
  SituacaoManutencao,
  StatusColaborador,
  Vinculo,
} from '@/types/inventory'

const LIMPO = (v?: string) => v?.trim() || ''
const DATA = (v?: string) => (v ? new Date(v).toISOString() : '')

export const pessoasJuridicasService = {
  async listar(): Promise<PessoaJuridica[]> {
    return await pb.collection('pessoas_juridicas').getFullList<PessoaJuridica>({
      sort: '-created',
      requestKey: null,
    })
  },

  async criar(data: NovaPessoaJuridicaInput): Promise<PessoaJuridica> {
    return await pb.collection('pessoas_juridicas').create<PessoaJuridica>({
      cnpj: LIMPO(data.cnpj),
      razao_social: LIMPO(data.razao_social),
      representante: LIMPO(data.representante),
      cpf_representante: LIMPO(data.cpf_representante),
      endereco: LIMPO(data.endereco),
      cidade: LIMPO(data.cidade),
      estado: LIMPO(data.estado),
      uf: LIMPO(data.uf),
      telefone: LIMPO(data.telefone),
      email: LIMPO(data.email),
      observacoes: LIMPO(data.observacoes),
      is_demo: false,
    })
  },

  async atualizar(id: string, data: Partial<NovaPessoaJuridicaInput>): Promise<PessoaJuridica> {
    return await pb.collection('pessoas_juridicas').update<PessoaJuridica>(id, data)
  },
}

export const vinculosService = {
  async listar(): Promise<Vinculo[]> {
    return await pb
      .collection('vinculos')
      .getFullList<Vinculo>({
        sort: '-created',
        expand: 'colaborador,dispositivo',
        requestKey: null,
      })
  },

  async criar(data: NovoVinculoInput): Promise<Vinculo> {
    const dispositivo = await pb.collection('dispositivos').getOne<Dispositivo>(data.dispositivo)
    if (dispositivo.status !== 'disponivel') {
      throw new Error('Somente dispositivos DISPONÍVEIS podem ser vinculados.')
    }

    // 1. Vínculo
    const vinculo = await pb.collection('vinculos').create<Vinculo>({
      colaborador: data.colaborador,
      dispositivo: data.dispositivo,
      data_inicio: DATA(data.data_inicio || new Date().toISOString()),
      situacao: 'ativo',
      observacoes: LIMPO(data.observacoes),
    })

    // 2. Dispositivo passa automaticamente para EM USO, responsável = colaborador
    await pb.collection('dispositivos').update(data.dispositivo, {
      status: 'em_uso',
      colaborador: data.colaborador,
    })

    // 3. Histórico de movimentação
    await pb.collection('historico_movimentacoes').create({
      dispositivo: data.dispositivo,
      colaborador: data.colaborador,
      tipo_evento: 'vinculo',
      descricao: 'Dispositivo vinculado ao colaborador (comodato).',
    })

    // 4. Contrato de comodato (2 vias)
    await pb.collection('contratos').create({
      tipo: 'comodato',
      dispositivo: data.dispositivo,
      colaborador: data.colaborador,
      vinculo: vinculo.id,
      numero_vias: 2,
    })

    return vinculo
  },

  async encerrar(vinculo: Vinculo, motivo: string, gerarDistrato = true): Promise<Vinculo | null> {
    if (vinculo.situacao === 'encerrado') return null

    const agora = new Date().toISOString()
    const atualizado = await pb.collection('vinculos').update<Vinculo>(vinculo.id, {
      situacao: 'encerrado',
      data_fim: agora,
      motivo_encerramento: motivo,
    })

    // Dispositivo volta para DISPONÍVEL (e limpa o responsável direto)
    await pb.collection('dispositivos').update(vinculo.dispositivo, {
      status: 'disponivel',
      colaborador: '',
    })

    await pb.collection('historico_movimentacoes').create({
      dispositivo: vinculo.dispositivo,
      colaborador: vinculo.colaborador,
      tipo_evento: 'desvinculo_desligamento',
      descricao: 'Vínculo encerrado.',
      motivo: motivo,
    })

    if (gerarDistrato) {
      await pb.collection('contratos').create({
        tipo: 'distrato',
        dispositivo: vinculo.dispositivo,
        colaborador: vinculo.colaborador,
        vinculo: vinculo.id,
        numero_vias: 2,
        observacoes: motivo,
      })
    }

    return atualizado
  },
}

export const manutencoesService = {
  async listar(): Promise<Manutencao[]> {
    return await pb
      .collection('manutencoes')
      .getFullList<Manutencao>({ sort: '-created', expand: 'dispositivo', requestKey: null })
  },

  // Envia para manutenção: desvincula o colaborador (se houver), gera distrato,
  // registra histórico e cria a solicitação com o motivo.
  async enviar(data: {
    dispositivo: string
    motivo: string
    data_envio?: string
    observacoes?: string
  }): Promise<Manutencao> {
    const dispositivo = await pb.collection('dispositivos').getOne<Dispositivo>(data.dispositivo)

    // Desvincula o colaborador atual, se houver vínculo ativo
    const vinculosAtivos = await pb.collection('vinculos').getFullList<Vinculo>({
      filter: `dispositivo = "${data.dispositivo}" && situacao = "ativo"`,
      requestKey: null,
    })
    for (const v of vinculosAtivos) {
      await vinculosService.encerrar(v, 'Dispositivo enviado para manutenção')
    }

    const manutencao = await pb.collection('manutencoes').create<Manutencao>({
      dispositivo: data.dispositivo,
      data_envio: DATA(data.data_envio || new Date().toISOString()),
      motivo: LIMPO(data.motivo),
      situacao: 'em_manutencao',
      observacoes: LIMPO(data.observacoes),
    })

    await pb.collection('dispositivos').update(data.dispositivo, {
      status: 'manutencao',
      data_inicio_manutencao: new Date().toISOString(),
    })

    await pb.collection('historico_movimentacoes').create({
      dispositivo: data.dispositivo,
      colaborador: dispositivo.colaborador || '',
      tipo_evento: 'envio_manutencao',
      descricao: 'Dispositivo enviado para manutenção.',
      motivo: LIMPO(data.motivo),
    })

    return manutencao
  },

  async registrarRetorno(
    manutencao: Manutencao,
    novoStatus: 'disponivel' | 'em_uso' = 'disponivel',
  ): Promise<Manutencao> {
    const atualizada = await pb
      .collection('manutencoes')
      .update<Manutencao>(manutencao.id, {
        situacao: 'retornado',
        data_retorno: new Date().toISOString(),
      })

    await pb.collection('dispositivos').update(manutencao.dispositivo, {
      status: novoStatus,
      data_inicio_manutencao: '',
      ...(novoStatus === 'disponivel' ? { colaborador: '' } : {}),
    })

    await pb.collection('historico_movimentacoes').create({
      dispositivo: manutencao.dispositivo,
      tipo_evento: 'retorno_manutencao',
      descricao: 'Dispositivo retornou da manutenção.',
      motivo: LIMPO(manutencao.motivo),
    })

    return atualizada
  },
}

export const historicoService = {
  async listar(filtroDispositivo?: string): Promise<HistoricoMovimentacao[]> {
    return await pb.collection('historico_movimentacoes').getFullList<HistoricoMovimentacao>({
      sort: '-created',
      filter: filtroDispositivo ? `dispositivo = "${filtroDispositivo}"` : undefined,
      expand: 'dispositivo,colaborador',
      requestKey: null,
    })
  },
}

export const contratosService = {
  async listar(): Promise<Contrato[]> {
    return await pb.collection('contratos').getFullList<Contrato>({
      sort: '-created',
      expand: 'dispositivo,colaborador,vinculo',
      requestKey: null,
    })
  },

  async criar(data: {
    tipo: 'comodato' | 'distrato'
    dispositivo: string
    colaborador: string
    vinculo?: string
    observacoes?: string
  }): Promise<Contrato> {
    return await pb.collection('contratos').create<Contrato>({
      tipo: data.tipo,
      dispositivo: data.dispositivo,
      colaborador: data.colaborador,
      vinculo: data.vinculo || '',
      numero_vias: 2,
      observacoes: LIMPO(data.observacoes),
    })
  },
}

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
      fabricante: LIMPO(data.fabricante),
      modelo: LIMPO(data.modelo),
      numero_serie: LIMPO(data.numero_serie),
      imei1: LIMPO(data.imei1),
      imei2: LIMPO(data.imei2),
      ram: LIMPO(data.ram),
      armazenamento_interno: LIMPO(data.armazenamento_interno),
      armazenamento_externo: LIMPO(data.armazenamento_externo),
      processador: LIMPO(data.processador),
      colaborador: data.colaborador || '',
      status: data.status,
      data_aquisicao: DATA(data.data_aquisicao),
      data_inicio_manutencao: DATA(data.data_inicio_manutencao),
      observacoes: LIMPO(data.observacoes),
      is_demo: false,
    }

    const criado = await pb.collection('dispositivos').create<Dispositivo>(payload)

    await pb.collection('historico_movimentacoes').create({
      dispositivo: criado.id,
      tipo_evento: 'cadastro',
      descricao: 'Dispositivo cadastrado no inventário.',
    })

    return criado
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
    if (data.fabricante !== undefined) payload.fabricante = LIMPO(data.fabricante)
    if (data.modelo !== undefined) payload.modelo = LIMPO(data.modelo)
    if (data.numero_serie !== undefined) payload.numero_serie = LIMPO(data.numero_serie)
    if (data.imei1 !== undefined) payload.imei1 = LIMPO(data.imei1)
    if (data.imei2 !== undefined) payload.imei2 = LIMPO(data.imei2)
    if (data.ram !== undefined) payload.ram = LIMPO(data.ram)
    if (data.armazenamento_interno !== undefined)
      payload.armazenamento_interno = LIMPO(data.armazenamento_interno)
    if (data.armazenamento_externo !== undefined)
      payload.armazenamento_externo = LIMPO(data.armazenamento_externo)
    if (data.processador !== undefined) payload.processador = LIMPO(data.processador)
    if (data.colaborador !== undefined) payload.colaborador = data.colaborador
    if (data.status !== undefined) payload.status = data.status
    if (data.data_aquisicao !== undefined) payload.data_aquisicao = DATA(data.data_aquisicao)
    if (data.data_inicio_manutencao !== undefined)
      payload.data_inicio_manutencao = DATA(data.data_inicio_manutencao)
    if (data.observacoes !== undefined) payload.observacoes = LIMPO(data.observacoes)

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
      nome: LIMPO(data.nome),
      departamento: LIMPO(data.departamento),
      cargo: LIMPO(data.cargo),
      email: LIMPO(data.email),
      telefone: LIMPO(data.telefone),
      cpf: LIMPO(data.cpf),
      matricula: LIMPO(data.matricula),
      nacionalidade: LIMPO(data.nacionalidade),
      estado_civil: LIMPO(data.estado_civil),
      documento_identidade: LIMPO(data.documento_identidade),
      emissor_documento: LIMPO(data.emissor_documento),
      endereco: LIMPO(data.endereco),
      cidade: LIMPO(data.cidade),
      estado: LIMPO(data.estado),
      uf: LIMPO(data.uf),
      status: data.status || 'ativo',
      observacoes: LIMPO(data.observacoes),
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

export type { StatusColaborador }
