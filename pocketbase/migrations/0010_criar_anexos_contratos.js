migrate(
  (app) => {
    // Coleção de anexos dos contratos assinados (comodato/distrato).
    // Um contrato pode ter vários anexos (ex.: via 1 e via 2 assinadas).
    const regraAuth = '@request.auth.id != ""'

    const collection = new Collection({
      name: 'anexos_contratos',
      type: 'base',
      listRule: regraAuth,
      viewRule: regraAuth,
      createRule: regraAuth,
      updateRule: regraAuth,
      deleteRule: regraAuth,
      fields: [
        {
          name: 'contrato',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('contratos').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'arquivo',
          type: 'file',
          required: true,
          maxSelect: 1,
          maxSize: 20971520,
          mimeTypes: [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/heic',
            'image/heif',
          ],
        },
        { name: 'nome', type: 'text', required: false, max: 200 },
        {
          name: 'enviado_por',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_anexos_contratos_contrato ON anexos_contratos (contrato)'],
    })

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('anexos_contratos')
    app.delete(collection)
  },
)
