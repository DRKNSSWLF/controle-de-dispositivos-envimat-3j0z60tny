migrate(
  (app) => {
    // 1. Colaboradores: campos exigidos pelo contrato + status ATIVO/DESLIGADO
    const colab = app.findCollectionByNameOrId('colaboradores')
    colab.fields.add(new TextField({ name: 'nacionalidade' }))
    colab.fields.add(new TextField({ name: 'estado_civil' }))
    colab.fields.add(new TextField({ name: 'documento_identidade' }))
    colab.fields.add(new TextField({ name: 'emissor_documento' }))
    colab.fields.add(new TextField({ name: 'endereco' }))
    colab.fields.add(new TextField({ name: 'cidade' }))
    colab.fields.add(new TextField({ name: 'estado' }))
    colab.fields.add(new TextField({ name: 'uf' }))
    colab.fields.add(
      new SelectField({ name: 'status', values: ['ativo', 'desligado'], maxSelect: 1 }),
    )
    app.save(colab)
    app
      .db()
      .newQuery("UPDATE colaboradores SET status = 'ativo' WHERE status = '' OR status IS NULL")
      .execute()

    // 2. Dispositivos: BACKUP/RESERVA -> DISPONÍVEL + campos técnicos dos contratos
    const disp = app.findCollectionByNameOrId('dispositivos')
    const statusField = disp.fields.getByName('status')
    statusField.values = ['em_uso', 'disponivel', 'backup', 'manutencao']
    app.save(disp)
    app
      .db()
      .newQuery("UPDATE dispositivos SET status = 'disponivel' WHERE status = 'backup'")
      .execute()
    statusField.values = ['em_uso', 'disponivel', 'manutencao']
    disp.fields.add(new TextField({ name: 'ram' }))
    disp.fields.add(new TextField({ name: 'armazenamento_interno' }))
    disp.fields.add(new TextField({ name: 'armazenamento_externo' }))
    disp.fields.add(new TextField({ name: 'processador' }))
    app.save(disp)

    // 3. Pessoas Jurídicas
    const colabId = app.findCollectionByNameOrId('colaboradores').id
    const dispId = app.findCollectionByNameOrId('dispositivos').id

    const pj = new Collection({
      name: 'pessoas_juridicas',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'cnpj', type: 'text', required: true },
        { name: 'razao_social', type: 'text', required: true },
        { name: 'representante', type: 'text' },
        { name: 'cpf_representante', type: 'text' },
        { name: 'endereco', type: 'text' },
        { name: 'cidade', type: 'text' },
        { name: 'estado', type: 'text' },
        { name: 'uf', type: 'text' },
        { name: 'telefone', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'observacoes', type: 'text' },
        { name: 'is_demo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(pj)

    // 4. Vínculos (colaborador x dispositivo) — histórico permanente, sem exclusões
    const vinculos = new Collection({
      name: 'vinculos',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'colaborador',
          type: 'relation',
          collectionId: colabId,
          cascadeDelete: false,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'dispositivo',
          type: 'relation',
          collectionId: dispId,
          cascadeDelete: false,
          maxSelect: 1,
          required: true,
        },
        { name: 'data_inicio', type: 'date', required: true },
        { name: 'data_fim', type: 'date' },
        {
          name: 'situacao',
          type: 'select',
          required: true,
          values: ['ativo', 'encerrado'],
          maxSelect: 1,
        },
        { name: 'motivo_encerramento', type: 'text' },
        { name: 'observacoes', type: 'text' },
        { name: 'is_demo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_vinculos_colaborador ON vinculos (colaborador)',
        'CREATE INDEX idx_vinculos_dispositivo ON vinculos (dispositivo)',
      ],
    })
    app.save(vinculos)

    // 5. Manutenções — solicitações com motivo, sem exclusões
    const manutencoes = new Collection({
      name: 'manutencoes',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'dispositivo',
          type: 'relation',
          collectionId: dispId,
          cascadeDelete: false,
          maxSelect: 1,
          required: true,
        },
        { name: 'data_envio', type: 'date', required: true },
        { name: 'data_retorno', type: 'date' },
        { name: 'motivo', type: 'text', required: true },
        {
          name: 'situacao',
          type: 'select',
          required: true,
          values: ['em_manutencao', 'retornado'],
          maxSelect: 1,
        },
        { name: 'observacoes', type: 'text' },
        { name: 'is_demo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_manutencoes_dispositivo ON manutencoes (dispositivo)'],
    })
    app.save(manutencoes)

    // 6. Histórico de movimentação de dispositivos
    const historico = new Collection({
      name: 'historico_movimentacoes',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'dispositivo',
          type: 'relation',
          collectionId: dispId,
          cascadeDelete: false,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'colaborador',
          type: 'relation',
          collectionId: colabId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'tipo_evento',
          type: 'select',
          required: true,
          values: [
            'vinculo',
            'desvinculo_desligamento',
            'envio_manutencao',
            'retorno_manutencao',
            'alteracao_status',
            'cadastro',
          ],
          maxSelect: 1,
        },
        { name: 'descricao', type: 'text', required: true },
        { name: 'motivo', type: 'text' },
        { name: 'is_demo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_historico_dispositivo ON historico_movimentacoes (dispositivo)',
        'CREATE INDEX idx_historico_tipo ON historico_movimentacoes (tipo_evento)',
      ],
    })
    app.save(historico)

    // 7. Contratos (Comodato / Distrato de Comodato)
    const contratos = new Collection({
      name: 'contratos',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['comodato', 'distrato'],
          maxSelect: 1,
        },
        {
          name: 'dispositivo',
          type: 'relation',
          collectionId: dispId,
          cascadeDelete: false,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'colaborador',
          type: 'relation',
          collectionId: colabId,
          cascadeDelete: false,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'vinculo',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('vinculos').id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'numero_vias', type: 'number' },
        { name: 'observacoes', type: 'text' },
        { name: 'is_demo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_contratos_dispositivo ON contratos (dispositivo)'],
    })
    app.save(contratos)
  },
  (app) => {
    for (const nome of [
      'contratos',
      'historico_movimentacoes',
      'manutencoes',
      'vinculos',
      'pessoas_juridicas',
    ]) {
      try {
        app.delete(app.findCollectionByNameOrId(nome))
      } catch (_) {}
    }
  },
)
