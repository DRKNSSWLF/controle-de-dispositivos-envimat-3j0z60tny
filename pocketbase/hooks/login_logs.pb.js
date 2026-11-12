/// <reference path="../pb_data/types.d.ts" />
// Hook: log de tentativas de login (sucesso/falha) + gate do domínio @envimat.com.br.
// NOTA: callbacks do JSVM rodam em pool separado — toda lógica fica inline no callback.

onRecordAuthRequest((e) => {
  const email = (e.record?.email?.() || '').toLowerCase()
  const autorizado = email.endsWith('@envimat.com.br')

  try {
    const rec = new Record(e.app.findCollectionByNameOrId('logs_acesso'))
    rec.set('email', email || '')
    if (e.record?.id) rec.set('usuario', e.record.id)
    rec.set('resultado', autorizado ? 'sucesso' : 'falha')
    rec.set('ip', e.realIp || '')
    const ua = e.requestInfo()?.headers?.user_agent || ''
    rec.set('origem', Array.isArray(ua) ? ua[0] : String(ua || ''))
    e.app.save(rec)
  } catch (err) {
    console.warn('logs_acesso: falha ao registrar', err)
  }

  if (!autorizado) {
    throw new BadRequestError('Acesso permitido apenas para e-mails corporativos @envimat.com.br.')
  }
  e.next()
}, 'users')
