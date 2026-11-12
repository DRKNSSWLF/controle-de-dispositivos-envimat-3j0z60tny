/// <reference path="../pb_data/types.d.ts" />
// 0004 — Login/permissões, logs de acesso, cadastros centrais e linhas telefônicas.

migrate(
  (db) => {
    // ---------- 1. Campo "nivel" na coleção users ----------
    const users = db.findCollectionByNameOrId('users')
    if (!users.fields.getByName('nivel')) {
      const nivel = new Field({
        type: 'select',
        name: 'nivel',
        required: true,
        maxSelect: 1,
        values: ['master', 'admin'],
      })
      users.fields.add(nivel)
      users.listRule = 'id = @request.auth.id'
      users.viewRule = 'id = @request.auth.id'
      // Master gerencia contas (criar/atualizar nível); admin só se vê.
      users.createRule = '@request.auth.nivel = "master"'
      users.updateRule =
        '@request.auth.nivel = "master" || (id = @request.auth.id && @request.body.nivel:isset = false && @request.body.verified:isset = false)'
      users.deleteRule = '@request.auth.nivel = "master" && id != @request.auth.id'
      db.save(users)
    }

    // ---------- 2. logs_acesso (escrita via hook, leitura master) ----------
    const logs = new Collection({
      type: 'base',
      name: 'logs_acesso',
      listRule: '@request.auth.nivel = "master"',
      viewRule: '@request.auth.nivel = "master"',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        new Field({ type: 'text', name: 'email' }),
        new Field({ type: 'relation', name: 'usuario', collectionId: users.id, maxSelect: 1 }),
        new Field({
          type: 'select',
          name: 'resultado',
          required: true,
          maxSelect: 1,
          values: ['sucesso', 'falha'],
        }),
        new Field({ type: 'text', name: 'ip' }),
        new Field({ type: 'text', name: 'origem' }),
      ],
    })
    db.save(logs)

    // ---------- 3. tipos_dispositivo ----------
    const tipos = new Collection({
      type: 'base',
      name: 'tipos_dispositivo',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        new Field({ type: 'text', name: 'nome', required: true }),
        new Field({ type: 'bool', name: 'usa_imei' }),
      ],
    })
    db.save(tipos)
    // Sem exclusões: ninguém apaga tipos via API; CRUD fica no hook admin (master/admin).

    // ---------- 4. linhas_telefonicas ----------
    const linhas = new Collection({
      type: 'base',
      name: 'linhas_telefonicas',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: null,
      fields: [
        new Field({ type: 'text', name: 'numero', required: true }),
        new Field({ type: 'text', name: 'operadora' }),
        new Field({ type: 'text', name: 'plano' }),
        new Field({
          type: 'select',
          name: 'tipo',
          maxSelect: 1,
          values: ['celular', 'modem'],
        }),
        new Field({ type: 'text', name: 'imei' }),
        new Field({
          type: 'relation',
          name: 'colaborador',
          collectionId: db.findCollectionByNameOrId('colaboradores').id,
          maxSelect: 1,
        }),
        new Field({
          type: 'select',
          name: 'status',
          maxSelect: 1,
          values: ['disponivel', 'em_uso', 'cancelada'],
        }),
        new Field({ type: 'text', name: 'observacoes', type: 'text' }),
        new Field({ type: 'bool', name: 'is_demo' }),
      ],
    })
    db.save(linhas)

    // ---------- 5. vinculos_linhas (histórico preservado, sem exclusões) ----------
    const vinculosLinhas = new Collection({
      type: 'base',
      name: 'vinculos_linhas',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: null,
      fields: [
        new Field({
          type: 'relation',
          name: 'colaborador',
          collectionId: db.findCollectionByNameOrId('colaboradores').id,
          required: true,
          maxSelect: 1,
        }),
        new Field({
          type: 'relation',
          name: 'linha',
          collectionId: linhas.id,
          required: true,
          maxSelect: 1,
        }),
        new Field({ type: 'date', name: 'data_inicio' }),
        new Field({ type: 'date', name: 'data_fim' }),
        new Field({
          type: 'select',
          name: 'situacao',
          required: true,
          maxSelect: 1,
          values: ['ativo', 'encerrado'],
        }),
        new Field({ type: 'text', name: 'motivo_encerramento' }),
        new Field({ type: 'text', name: 'observacoes' }),
      ],
    })
    db.save(vinculosLinhas)

    // ---------- 6. anexo_assinado (file, multi) em contratos ----------
    const contratos = db.findCollectionByNameOrId('contratos')
    if (!contratos.fields.getByName('anexo_assinado')) {
      contratos.fields.add(
        new Field({
          type: 'file',
          name: 'anexo_assinado',
          maxSelect: 5,
          maxSize: 10485760,
          mimeTypes: ['application/pdf', 'image/png', 'image/jpeg'],
        }),
      )
      contratos.updateRule = '@request.auth.id != ""'
      db.save(contratos)
    }

    // ---------- 7. Seed dos 3 usuários iniciais ----------
    const senha = 'Envimat@2026'
    const seed = [
      ['Carlos Eduardo Eleutério', 'ce@envimat.com.br', 'master'],
      ['Fábio Oliveira', 'fabio.oliveira@envimat.com.br', 'master'],
      ['Annamaria Maria Maia Guimarães Lima Vieira', 'annamaria@envimat.com.br', 'admin'],
    ]
    for (const [nome, email, nivel] of seed) {
      let existente = null
      try {
        existente = db.findFirstRecordByFilter(users, 'email = {:email}', { email })
      } catch (err) {}
      if (existente) continue
      const rec = new Record(users)
      rec.set('email', email)
      rec.set('name', nome)
      rec.set('nivel', nivel)
      rec.set('password', senha)
      rec.set('passwordConfirm', senha)
      rec.set('verified', true)
      db.save(rec)
    }
  },
  (db) => {
    // Rollback
    try {
      db.deleteCollection('vinculos_linhas')
    } catch (e) {}
    try {
      db.deleteCollection('linhas_telefonicas')
    } catch (e) {}
    try {
      db.deleteCollection('tipos_dispositivo')
    } catch (e) {}
    try {
      db.deleteCollection('logs_acesso')
    } catch (e) {}
    const contratos = db.findCollectionByNameOrId('contratos')
    try {
      contratos.fields.removeByName('anexo_assinado')
      db.save(contratos)
    } catch (e) {}
  },
)
