/// <reference path="../pb_data/types.d.ts" />
// 0008 — Correção das coleções que ficaram VAZIAS na instância viva (a 0004 definiu os
// campos, mas eles não foram aplicados) e regras de acesso definitivas:
//   - linhas_telefonicas: campos + índice; leitura para qualquer autenticado, escrita
//     para qualquer autenticado (Master e Administrativo usam os cadastros), sem exclusão.
//   - vinculos_linhas: campos + regras idem linhas (histórico sem exclusão destrutiva).
//   - tipos_dispositivo: campos nome/usa_imei; leitura autenticada; escrita fechada
//     (create/update/delete = null) — CRUD fica restrito, segundo definição do usuário.
// Idempotente: só aplica o que está faltando.
migrate(
  (db) => {
    // ---------- linhas_telefonicas ----------
    const colaboradores = db.findCollectionByNameOrId('colaboradores')

    const linhas = db.findCollectionByNameOrId('linhas_telefonicas')
    const camposLinhas = [
      { type: 'text', name: 'numero', required: true },
      { type: 'text', name: 'operadora' },
      { type: 'text', name: 'plano' },
      { type: 'select', name: 'tipo', maxSelect: 1, values: ['celular', 'modem'] },
      { type: 'text', name: 'imei' },
      {
        type: 'relation',
        name: 'colaborador',
        collectionId: colaboradores.id,
        maxSelect: 1,
      },
      {
        type: 'select',
        name: 'status',
        maxSelect: 1,
        values: ['disponivel', 'em_uso', 'cancelada'],
      },
      { type: 'text', name: 'observacoes' },
      { type: 'bool', name: 'is_demo' },
      { type: 'autodate', name: 'created', onCreate: true },
      { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
    ]
    for (const def of camposLinhas) {
      if (!linhas.fields.getByName(def.name)) linhas.fields.add(new Field(def))
    }
    linhas.listRule = '@request.auth.id != ""'
    linhas.viewRule = '@request.auth.id != ""'
    linhas.createRule = '@request.auth.id != ""'
    linhas.updateRule = '@request.auth.id != ""'
    linhas.deleteRule = null
    linhas.addIndex('idx_linhas_numero', false, 'numero', '')
    db.save(linhas)

    // ---------- vinculos_linhas ----------
    const vinculosLinhas = db.findCollectionByNameOrId('vinculos_linhas')
    const camposVinc = [
      {
        type: 'relation',
        name: 'colaborador',
        collectionId: colaboradores.id,
        required: true,
        maxSelect: 1,
      },
      { type: 'relation', name: 'linha', collectionId: linhas.id, required: true, maxSelect: 1 },
      { type: 'date', name: 'data_inicio' },
      { type: 'date', name: 'data_fim' },
      {
        type: 'select',
        name: 'situacao',
        required: true,
        maxSelect: 1,
        values: ['ativo', 'encerrado'],
      },
      { type: 'text', name: 'motivo_encerramento' },
      { type: 'text', name: 'observacoes' },
      { type: 'autodate', name: 'created', onCreate: true },
      { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
    ]
    for (const def of camposVinc) {
      if (!vinculosLinhas.fields.getByName(def.name)) vinculosLinhas.fields.add(new Field(def))
    }
    vinculosLinhas.listRule = '@request.auth.id != ""'
    vinculosLinhas.viewRule = '@request.auth.id != ""'
    vinculosLinhas.createRule = '@request.auth.id != ""'
    vinculosLinhas.updateRule = '@request.auth.id != ""'
    vinculosLinhas.deleteRule = null
    vinculosLinhas.addIndex('idx_vinculos_linhas_colaborador', false, 'colaborador', '')
    vinculosLinhas.addIndex('idx_vinculos_linhas_linha', false, 'linha', '')
    db.save(vinculosLinhas)

    // ---------- tipos_dispositivo ----------
    const tipos = db.findCollectionByNameOrId('tipos_dispositivo')
    if (!tipos.fields.getByName('nome')) {
      tipos.fields.add(new Field({ type: 'text', name: 'nome', required: true }))
    }
    if (!tipos.fields.getByName('usa_imei')) {
      tipos.fields.add(new Field({ type: 'bool', name: 'usa_imei' }))
    }
    if (!tipos.fields.getByName('created')) {
      tipos.fields.add(new Field({ type: 'autodate', name: 'created', onCreate: true }))
    }
    tipos.listRule = '@request.auth.id != ""'
    tipos.viewRule = '@request.auth.id != ""'
    // Escrita fechada via API: sem CRUD público de tipos (definição do usuário).
    tipos.createRule = null
    tipos.updateRule = null
    tipos.deleteRule = null
    db.save(tipos)
  },
  (db) => {
    // Rollback conservador: apenas remove índices; campos/dados são preservados.
    try {
      const linhas = db.findCollectionByNameOrId('linhas_telefonicas')
      linhas.removeIndex('idx_linhas_numero')
      db.save(linhas)
    } catch (e) {}
    try {
      const v = db.findCollectionByNameOrId('vinculos_linhas')
      v.removeIndex('idx_vinculos_linhas_colaborador')
      v.removeIndex('idx_vinculos_linhas_linha')
      db.save(v)
    } catch (e) {}
  },
)
