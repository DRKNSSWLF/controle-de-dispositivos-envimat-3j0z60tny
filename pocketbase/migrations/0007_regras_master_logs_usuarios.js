// Corrige regras de acesso reportadas pelo usuário após a Etapa 1:
// 1. logs_acesso estava sem regras (null = só superusers) → Master (nivel = "master")
//    passa a poder listar e visualizar os logs de acesso.
// 2. users list/view estavam restritas a "id = @request.auth.id" → Master passa a poder
//    listar/visualizar todos os usuários; Administrativo continua vendo apenas o próprio
//    registro. Create/update/delete mantêm as regras anteriores (Master gerencia, e o
//    próprio usuário pode atualizar o próprio registro sem alterar o nível).

migrate(
  (app) => {
    const logs = app.findCollectionByNameOrId('logs_acesso')
    logs.listRule = '@request.auth.nivel = "master"'
    logs.viewRule = '@request.auth.nivel = "master"'
    // Criação continua fechada a clientes: o hook grava os logs com privilégios do app.
    logs.createRule = null
    logs.updateRule = null
    logs.deleteRule = null
    app.save(logs)

    const users = app.findCollectionByNameOrId('users')
    users.listRule = '@request.auth.nivel = "master" || id = @request.auth.id'
    users.viewRule = '@request.auth.nivel = "master" || id = @request.auth.id'
    app.save(users)
  },
  (app) => {
    const logs = app.findCollectionByNameOrId('logs_acesso')
    logs.listRule = null
    logs.viewRule = null
    logs.createRule = null
    logs.updateRule = null
    logs.deleteRule = null
    app.save(logs)

    const users = app.findCollectionByNameOrId('users')
    users.listRule = 'id = @request.auth.id'
    users.viewRule = 'id = @request.auth.id'
    app.save(users)
  },
)
