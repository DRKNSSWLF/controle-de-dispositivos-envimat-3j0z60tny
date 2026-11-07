migrate(
  (app) => {
    const colabCol = app.findCollectionByNameOrId('colaboradores')
    const dispCol = app.findCollectionByNameOrId('dispositivos')

    // Idempotência: verificar se já existem colaboradores
    if (app.countRecords('colaboradores') > 0) {
      return
    }

    // 1. Colaboradores da ENVIMAT em São Carlos - SP
    const colaboradoresData = [
      {
        nome: 'Carlos Eduardo Silva',
        departamento: 'Operações e Movimentação',
        cargo: 'Supervisor de Operações Florestais',
        email: 'carlos.silva@envimat.com.br',
        telefone: '(16) 99712-3401',
        matricula: 'ENV-0104',
        observacoes: 'Responsável pelo pátio de movimentação e trituradores Komptech',
      },
      {
        nome: 'Mariana Alencar Ribeiro',
        departamento: 'Engenharia e Projetos',
        cargo: 'Engenheira de Tratamento de Resíduos',
        email: 'mariana.ribeiro@envimat.com.br',
        telefone: '(16) 99823-1188',
        matricula: 'ENV-0082',
        observacoes: 'Coordena projetos de reciclagem e biomassa em clientes de siderurgia',
      },
      {
        nome: 'Rodrigo Mendes Fagundes',
        departamento: 'Assistência Técnica',
        cargo: 'Técnico Sênior de Campo (Sennebogen / CBI)',
        email: 'rodrigo.mendes@envimat.com.br',
        telefone: '(16) 99654-9920',
        matricula: 'ENV-0119',
        observacoes: 'Atendimento externo em campo com celular corporativo e tablet de diagnóstico',
      },
      {
        nome: 'Juliana Castro Nogueira',
        departamento: 'Comercial e Peças',
        cargo: 'Consultora de Vendas e Reposição',
        email: 'juliana.castro@envimat.com.br',
        telefone: '(16) 99145-6677',
        matricula: 'ENV-0143',
        observacoes: 'Contato direto com siderurgias, sucatas e usinas de compostagem',
      },
      {
        nome: 'Fernando Henrique Braga',
        departamento: 'Logística e Suprimentos',
        cargo: 'Analista de Importação e Logística',
        email: 'fernando.braga@envimat.com.br',
        telefone: '(16) 99311-2244',
        matricula: 'ENV-0097',
        observacoes: 'Desembaraço de peças e máquinas importadas',
      },
    ]

    const colabRecords = []
    for (const c of colaboradoresData) {
      const rec = new Record(colabCol)
      rec.set('nome', c.nome)
      rec.set('departamento', c.departamento)
      rec.set('cargo', c.cargo)
      rec.set('email', c.email)
      rec.set('telefone', c.telefone)
      rec.set('matricula', c.matricula)
      rec.set('observacoes', c.observacoes)
      app.save(rec)
      colabRecords.push(rec)
    }

    // 2. Dispositivos realistas cobrindo todos os cenários:
    // - Samsung, Apple, Lenovo, Motorola
    // - Celular, Notebook, Tablet, Outro
    // - Status: em_uso, backup, manutencao
    // - Idades variadas: > 4 anos (2020/2021), média (2022/2023), recente (2024/2025)
    // - Alertas acionáveis:
    //   * Sem colaborador atribuído em_uso ou backup
    //   * Em manutenção há mais de 30 dias (data_inicio_manutencao)
    //   * Idade superior a 3 ou 4 anos (aquisição antiga)

    const dispositivosData = [
      {
        tipo: 'celular',
        fabricante: 'Samsung',
        modelo: 'Galaxy A54 5G',
        numero_serie: 'R58N40AB11M',
        imei1: '354928114920194',
        imei2: '354928114920195',
        colaborador: colabRecords[0].id, // Carlos Eduardo
        status: 'em_uso',
        data_aquisicao: '2023-04-12 00:00:00.000Z',
        observacoes: 'Uso em pátio florestal com capa anti-impacto',
        is_demo: true,
      },
      {
        tipo: 'notebook',
        fabricante: 'Lenovo',
        modelo: 'ThinkPad T14 Gen 3',
        numero_serie: 'PF3Z881K',
        imei1: '',
        imei2: '',
        colaborador: colabRecords[1].id, // Mariana Alencar
        status: 'em_uso',
        data_aquisicao: '2022-08-10 00:00:00.000Z',
        observacoes: 'Notebook de engenharia para projetos CAD e dimensionamento',
        is_demo: true,
      },
      {
        tipo: 'celular',
        fabricante: 'Apple',
        modelo: 'iPhone 13 128GB',
        numero_serie: 'F2LX792MPK',
        imei1: '353841108472911',
        imei2: '353841108472912',
        colaborador: colabRecords[3].id, // Juliana Castro
        status: 'em_uso',
        data_aquisicao: '2021-11-20 00:00:00.000Z', // Antigo (> 3 anos) -> alerta de renovação
        observacoes: 'Aparelho comercial com WhatsApp corporativo',
        is_demo: true,
      },
      {
        tipo: 'tablet',
        fabricante: 'Samsung',
        modelo: 'Galaxy Tab Active4 Pro (Rugged)',
        numero_serie: 'R9PT701988V',
        imei1: '358721098411223',
        imei2: '',
        colaborador: colabRecords[2].id, // Rodrigo Mendes
        status: 'em_uso',
        data_aquisicao: '2023-02-15 00:00:00.000Z',
        observacoes: 'Tablet reforçado para telemetria de guindastes Sennebogen',
        is_demo: true,
      },
      {
        tipo: 'notebook',
        fabricante: 'Dell',
        modelo: 'Latitude 5420',
        numero_serie: '8F9G2Z3',
        imei1: '',
        imei2: '',
        colaborador: '', // Sem colaborador atribuído!
        status: 'backup',
        data_aquisicao: '2021-03-05 00:00:00.000Z', // > 4 anos
        observacoes: 'Notebook de reserva técnica na sede em São Carlos',
        is_demo: true,
      },
      {
        tipo: 'celular',
        fabricante: 'Motorola',
        modelo: 'Moto G84 5G',
        numero_serie: 'ZY22HG9P0L',
        imei1: '356789012345678',
        imei2: '356789012345679',
        colaborador: '', // Sem colaborador
        status: 'backup',
        data_aquisicao: '2024-01-18 00:00:00.000Z',
        observacoes: 'Aparelho reserva pronto para novos operadores ou substituição imediata',
        is_demo: true,
      },
      {
        tipo: 'celular',
        fabricante: 'Samsung',
        modelo: 'Galaxy S20 FE',
        numero_serie: 'RF8N901ZZ4X',
        imei1: '359981023412556',
        imei2: '359981023412557',
        colaborador: colabRecords[4].id, // Fernando Henrique
        status: 'manutencao',
        data_aquisicao: '2020-09-14 00:00:00.000Z', // Antigo (> 4 anos)
        data_inicio_manutencao: '2024-11-10 00:00:00.000Z', // Em manutenção há mais de 100 dias! Alerta crítico
        observacoes:
          'Tela trincada durante vistoria aduaneira; aguardando troca de módulo em assistência',
        is_demo: true,
      },
      {
        tipo: 'tablet',
        fabricante: 'Apple',
        modelo: 'iPad 9ª Geração 64GB Wi-Fi + Cellular',
        numero_serie: 'DMPF8192Q1GC',
        imei1: '354019284719283',
        imei2: '',
        colaborador: '', // Sem colaborador
        status: 'manutencao',
        data_aquisicao: '2022-05-19 00:00:00.000Z',
        data_inicio_manutencao: '2025-01-08 00:00:00.000Z', // Em manutenção há mais de 45 dias
        observacoes: 'Bateria estufada; envio para garantia autorizada',
        is_demo: true,
      },
      {
        tipo: 'notebook',
        fabricante: 'Lenovo',
        modelo: 'IdeaPad 3 15ALC6',
        numero_serie: 'PF29X14M',
        imei1: '',
        imei2: '',
        colaborador: colabRecords[4].id, // Fernando
        status: 'em_uso',
        data_aquisicao: '2023-09-01 00:00:00.000Z',
        observacoes: 'Notebook de logística integrado ao ERP',
        is_demo: true,
      },
      {
        tipo: 'outro',
        fabricante: 'Zebra',
        modelo: 'Coletor TC21 Touch Computer',
        numero_serie: '212855225D0144',
        imei1: '357123984102941',
        imei2: '',
        colaborador: '', // Sem colaborador
        status: 'backup',
        data_aquisicao: '2023-11-25 00:00:00.000Z',
        observacoes: 'Leitor e coletor de código de barras para almoxarifado de peças',
        is_demo: true,
      },
    ]

    for (const d of dispositivosData) {
      const rec = new Record(dispCol)
      rec.set('tipo', d.tipo)
      rec.set('fabricante', d.fabricante)
      rec.set('modelo', d.modelo)
      rec.set('numero_serie', d.numero_serie)
      if (d.imei1) rec.set('imei1', d.imei1)
      if (d.imei2) rec.set('imei2', d.imei2)
      if (d.colaborador) rec.set('colaborador', d.colaborador)
      rec.set('status', d.status)
      if (d.data_aquisicao) rec.set('data_aquisicao', d.data_aquisicao)
      if (d.data_inicio_manutencao) rec.set('data_inicio_manutencao', d.data_inicio_manutencao)
      if (d.observacoes) rec.set('observacoes', d.observacoes)
      rec.set('is_demo', true)
      app.save(rec)
    }
  },
  (app) => {
    try {
      app.db().newQuery('DELETE FROM dispositivos WHERE is_demo = 1').execute()
    } catch (_) {}
  },
)
