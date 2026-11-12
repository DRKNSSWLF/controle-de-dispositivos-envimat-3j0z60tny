/// <reference path="../pb_data/types.d.ts" />
// Hook: log de tentativas de login (sucesso/falha) + gate do domínio @envimat.com.br.
// NOTA: callbacks do JSVM rodam em pool separado — toda lógica fica inline no callback.
// Roda para TODA tentativa de auth com senha (mesmo que a senha esteja errada e o
// e.record venha vazio) — por isso o log de falha é gravado ANTES do e.next().

onRecordAuthRequest((e) => {
  const info = e.requestInfo()
  const emailBruto = (info && info.body && info.body.identity) || ''
  const email = String(emailBruto).toLowerCase().trim()
  const autorizado = email.endsWith('@envimat.com.br')

  try {
    const rec = new Record(e.app.findCollectionByNameOrId('logs_acesso'))
    rec.set('email', email)
    if (e.record && e.record.id) rec.set('usuario', e.record.id)
    rec.set('resultado', autorizado ? 'sucesso' : 'falha')
    rec.set('ip', e.realIp || '')
    const ua = (info && info.headers && info.headers.user_agent) || ''
    rec.set('origem', Array.isArray(ua) ? String(ua[0]) : String(ua || ''))
    e.app.save(rec)
  } catch (err) {
    console.warn('logs_acesso: falha ao registrar', err)
  }

  if (!autorizado) {
    throw new BadRequestError('Acesso permitido apenas para e-mails corporativos @envimat.com.br.')
  }
  e.next()
}, 'users')
