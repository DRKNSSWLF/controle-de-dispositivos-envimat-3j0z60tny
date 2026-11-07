migrate(
  (app) => {
    // 1. Coleção de Colaboradores
    const colaboradores = new Collection({
      name: 'colaboradores',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'departamento', type: 'text' },
        { name: 'cargo', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'telefone', type: 'text' },
        { name: 'cpf', type: 'text' },
        { name: 'matricula', type: 'text' },
        { name: 'observacoes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_colaboradores_nome ON colaboradores (nome)'],
    })
    app.save(colaboradores)

    const colabId = app.findCollectionByNameOrId('colaboradores').id

    // 2. Coleção de Dispositivos
    const dispositivos = new Collection({
      name: 'dispositivos',
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
          values: ['celular', 'notebook', 'tablet', 'outro'],
          maxSelect: 1,
        },
        { name: 'fabricante', type: 'text', required: true },
        { name: 'modelo', type: 'text', required: true },
        { name: 'numero_serie', type: 'text', required: true },
        { name: 'imei1', type: 'text' },
        { name: 'imei2', type: 'text' },
        {
          name: 'colaborador',
          type: 'relation',
          collectionId: colabId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['em_uso', 'backup', 'manutencao'],
          maxSelect: 1,
        },
        { name: 'data_aquisicao', type: 'date' },
        { name: 'data_inicio_manutencao', type: 'date' },
        { name: 'observacoes', type: 'text' },
        { name: 'is_demo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_dispositivos_tipo ON dispositivos (tipo)',
        'CREATE INDEX idx_dispositivos_status ON dispositivos (status)',
        'CREATE INDEX idx_dispositivos_numero_serie ON dispositivos (numero_serie)',
      ],
    })
    app.save(dispositivos)
  },
  (app) => {
    try {
      const dispositivos = app.findCollectionByNameOrId('dispositivos')
      app.delete(dispositivos)
    } catch (_) {}

    try {
      const colaboradores = app.findCollectionByNameOrId('colaboradores')
      app.delete(colaboradores)
    } catch (_) {}
  },
)
