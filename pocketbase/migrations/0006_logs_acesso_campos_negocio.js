/// <reference path="../pb_data/types.d.ts" />
// 0006 — logs_acesso: garante os campos de negócio (correção — 0004 não os aplicou
// na coleção viva). Idempotente; created/updated já garantidos na 0005.

migrate(
  (db) => {
    const logs = db.findCollectionByNameOrId('logs_acesso')

    const campos = [
      { type: 'text', name: 'email' },
      {
        type: 'relation',
        name: 'usuario',
        collectionId: '_pb_users_auth_',
        maxSelect: 1,
      },
      {
        type: 'select',
        name: 'resultado',
        required: true,
        maxSelect: 1,
        values: ['sucesso', 'falha'],
      },
      { type: 'text', name: 'ip' },
      { type: 'text', name: 'origem' },
    ]

    for (const def of campos) {
      if (!logs.fields.getByName(def.name)) {
        logs.fields.add(new Field(def))
      }
    }

    db.save(logs)
  },
  (db) => {
    // Rollback: sem remoção de campos (mantém dados); no-op seguro.
  },
)
