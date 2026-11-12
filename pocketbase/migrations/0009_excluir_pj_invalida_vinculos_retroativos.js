// 0009 — Correções de dados solicitadas pelo usuário:
// (a) Excluir o registro de Pessoa Jurídica com CNPJ/CPF inválidos
//     (id h98z95h1yckjo0q, CNPJ 13943060000180, CPF 26238843785).
// (b) Criar vínculos retroativos para os dispositivos já existentes em
//     status "em_uso" que chegaram a esse status pela importação de planilha,
//     sem registro em `vinculos` — é o que deixava a aba Vínculos zerada.
//
// NOTA SOBRE IDEMPOTÊNCIA: o item (a) é um delete pontual de um registro que o
// próprio usuário criou errado no banco live. O código abaixo é idempotente
// (procura o registro por CNPJ; se não existir, não faz nada) e seguro para
// replay em cópias do projeto — em uma cópia nova a coleção está vazia e a
// migração simplesmente não encontra nada a excluir. O (b) é idempotente por
// construção: só cria vínculo se o dispositivo em_uso ainda não tiver nenhum
// vínculo ativo.
migrate(
  (app) => {
    // ---------- (a) Excluir PJ com dados inválidos ----------
    const pjs = app.findRecordsByFilter('pessoas_juridicas', 'cnpj = "13943060000180"', '', 10, 0)
    for (const pj of pjs) {
      // Confirma que é o registro correto antes de apagar (defesa extra)
      if (pj.id === 'h98z95h1yckjo0q' || pj.getString('cpf_representante') === '26238843785') {
        app.delete(pj)
        console.log('[0009] PJ excluída:', pj.id)
      }
    }

    // ---------- (b) Vínculos retroativos dos dispositivos em_uso ----------
    const dispositivos = app.findRecordsByFilter('dispositivos', 'status = "em_uso"', '', 500, 0)

    const hoje = new Date()
    let criados = 0

    for (const disp of dispositivos) {
      const colaboradorId = disp.getString('colaborador')
      if (!colaboradorId) continue // em_uso sem responsável: nada a vincular

      // Já existe vínculo (ativo ou encerrado) para este dispositivo?
      const existentes = app.findRecordsByFilter('vinculos', `dispositivo = "${disp.id}"`, '', 1, 0)
      if (existentes.length > 0) continue

      // Data retroativa plausível: usa a data de aquisição se houver,
      // senão 6 meses antes de hoje. Nunca depois de hoje.
      let dataInicio = new Date(hoje)
      dataInicio.setMonth(dataInicio.getMonth() - 6)
      const aquisicao = disp.getDateTime('data_aquisicao')
      if (aquisicao && String(aquisicao).trim() !== '') {
        const ts = new Date(String(aquisicao))
        if (!isNaN(ts.getTime()) && ts < hoje) {
          // começa na aquisição, mas ao menos 1 dia depois dela
          dataInicio = new Date(ts.getTime() + 24 * 60 * 60 * 1000)
        }
      }

      const vincCol = app.findCollectionByNameOrId('vinculos')
      const vinculo = new Record(vincCol)
      vinculo.set('colaborador', colaboradorId)
      vinculo.set('dispositivo', disp.id)
      vinculo.set('data_inicio', dataInicio.toISOString().replace('T', ' ').slice(0, 19) + '.000Z')
      vinculo.set('situacao', 'ativo')
      vinculo.set(
        'observacoes',
        'Vínculo retroativo criado pela migração 0009 (registro vindo de importação de planilha sem vínculo).',
      )
      app.save(vinculo)

      // Comodato correspondente (mesma regra do fluxo manual de vínculo)
      const contratosCol = app.findCollectionByNameOrId('contratos')
      const contrato = new Record(contratosCol)
      contrato.set('tipo', 'comodato')
      contrato.set('dispositivo', disp.id)
      contrato.set('colaborador', colaboradorId)
      contrato.set('vinculo', vinculo.id)
      contrato.set('numero_vias', 2)
      contrato.set('observacoes', 'Comodato retroativo (migração 0009).')
      app.save(contrato)

      criados++
    }

    console.log('[0009] Vínculos retroativos criados:', criados)
  },
  (app) => {
    // down: não apaga dados — a exclusão da PJ e os vínculos criados aqui
    // permanecem (histórico nunca destrutivo, mesma decisão das etapas anteriores).
  },
)
