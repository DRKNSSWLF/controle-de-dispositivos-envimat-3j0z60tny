/// <reference path="../pb_data/types.d.ts" />
// Hook: CRUD de tipos de dispositivo (coleção tipos_dispositivo).
// As regras da coleção deixam a escrita FECHADA via API direta (create/update/delete = null),
// então este hook expõe o CRUD autenticado com controle de papel.
// Rotas fora do namespace reservado '/api/' (deploy recusa rotas novas lá):
//   - GET    /backend/v1/envimat/tipos-dispositivo        → lista (qualquer autenticado)
//   - POST   /backend/v1/envimat/tipos-dispositivo        → cria (master OU administrativo)
//   - PATCH  /backend/v1/envimat/tipos-dispositivo/{id}   → renomeia (master OU administrativo)
//   - DELETE /backend/v1/envimat/tipos-dispositivo/{id}   → SOMENTE master, e apenas se nenhum
//     dispositivo estiver usando o tipo (nada de exclusão destrutiva).
// Sem exclusões: DELETE só é permitido a master e apenas se nenhum
// dispositivo estiver usando o tipo.
// NOTA: callbacks do JSVM rodam em pool separado — toda lógica fica inline no callback.

routerAdd(
  'GET',
  '/backend/v1/envimat/tipos-dispositivo',
  (e) => {
    const registros = $app.findRecordsByFilter('tipos_dispositivo', '', 'nome', 0, 0)
    const itens = []
    for (const r of registros) {
      itens.push({ id: r.id, nome: r.getString('nome'), usa_imei: r.getBool('usa_imei') })
    }
    return e.json(200, itens)
  },
  $apis.requireAuth(),
)

routerAdd(
  'POST',
  '/backend/v1/envimat/tipos-dispositivo',
  (e) => {
    const info = e.requestInfo()
    const papel = ((info.auth && info.auth.get('nivel')) || '') + ''
    const nome = String((info.body && info.body.nome) || '').trim()
    const usaImei = !!(info.body && info.body.usa_imei)

    if (papel !== 'master' && papel !== 'admin') {
      throw new ForbiddenError('Somente usuários autorizados podem cadastrar tipos.')
    }
    if (!nome) {
      throw new BadRequestError('Informe o nome do tipo de dispositivo.')
    }

    const colecao = $app.findCollectionByNameOrId('tipos_dispositivo')
    const existente = $app.findRecordsByFilter('tipos_dispositivo', 'nome = {:nome}', '', 1, 0, {
      nome: nome,
    })
    if (existente.length > 0) {
      throw new BadRequestError('Já existe um tipo com esse nome.')
    }

    const rec = new Record(colecao)
    rec.set('nome', nome)
    rec.set('usa_imei', usaImei)
    $app.save(rec)
    return e.json(200, {
      id: rec.id,
      nome: rec.getString('nome'),
      usa_imei: rec.getBool('usa_imei'),
    })
  },
  $apis.requireAuth(),
)

routerAdd(
  'PATCH',
  '/backend/v1/envimat/tipos-dispositivo/{id}',
  (e) => {
    const info = e.requestInfo()
    const papel = ((info.auth && info.auth.get('nivel')) || '') + ''
    if (papel !== 'master' && papel !== 'admin') {
      throw new ForbiddenError('Somente usuários autorizados podem editar tipos.')
    }

    const rec = $app.findRecordById('tipos_dispositivo', e.request.path.param('id'))
    const nome = String((info.body && info.body.nome) || rec.getString('nome')).trim()
    if (!nome) {
      throw new BadRequestError('Informe o nome do tipo de dispositivo.')
    }

    const existente = $app.findRecordsByFilter(
      'tipos_dispositivo',
      'nome = {:nome} && id != {:id}',
      '',
      1,
      0,
      { nome: nome, id: rec.id },
    )
    if (existente.length > 0) {
      throw new BadRequestError('Já existe um tipo com esse nome.')
    }

    if (info.body && typeof info.body.usa_imei !== 'undefined') {
      rec.set('usa_imei', !!info.body.usa_imei)
    }
    rec.set('nome', nome)
    $app.save(rec)
    return e.json(200, {
      id: rec.id,
      nome: rec.getString('nome'),
      usa_imei: rec.getBool('usa_imei'),
    })
  },
  $apis.requireAuth(),
)

routerAdd(
  'DELETE',
  '/backend/v1/envimat/tipos-dispositivo/{id}',
  (e) => {
    const info = e.requestInfo()
    const papel = ((info.auth && info.auth.get('nivel')) || '') + ''
    if (papel !== 'master') {
      throw new ForbiddenError('Somente o nível Master pode excluir tipos de dispositivo.')
    }

    const rec = $app.findRecordById('tipos_dispositivo', e.request.path.param('id'))
    const emUso = $app.countRecords('dispositivos', { tipo: rec.getString('nome') })
    if (emUso > 0) {
      throw new BadRequestError(
        'Este tipo está sendo usado por ' + emUso + ' dispositivo(s) e não pode ser excluído.',
      )
    }
    $app.delete(rec)
    return e.json(200, { ok: true })
  },
  $apis.requireAuth(),
)
