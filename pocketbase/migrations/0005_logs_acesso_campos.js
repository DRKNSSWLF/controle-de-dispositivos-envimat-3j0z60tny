/// <reference path="../pb_data/types.d.ts" />
// 0005 — logs_acesso: garante created/updated (base collection exige explicitamente)
// e cria índice de ordenação por created. Idempotente.

migrate(
  (db) => {
    const logs = db.findCollectionByNameOrId('logs_acesso')

    if (!logs.fields.getByName('created')) {
      logs.fields.add(new Field({ type: 'autodate', name: 'created', onCreate: true }))
    }
    if (!logs.fields.getByName('updated')) {
      logs.fields.add(
        new Field({ type: 'autodate', name: 'updated', onCreate: true, onUpdate: true }),
      )
    }

    logs.addIndex('idx_logs_acesso_created', false, 'created', '')
    db.save(logs)
  },
  (db) => {
    const logs = db.findCollectionByNameOrId('logs_acesso')
    logs.removeIndex('idx_logs_acesso_created')
    db.save(logs)
  },
)
