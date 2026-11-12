// Validação de documentos (CPF/CNPJ) e máscaras — algoritmo oficial da Receita

const DIGITOS = (v: string) => (v || '').replace(/\D/g, '')

// ---- CPF ----

export function validarCPF(valor: string): boolean {
  const cpf = DIGITOS(valor)
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false // sequências iguais são inválidas
  const calcDigito = (base: number) => {
    let soma = 0
    for (let i = 0; i < base; i++) soma += parseInt(cpf[i], 10) * (base + 1 - i)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }
  return calcDigito(9) === parseInt(cpf[9], 10) && calcDigito(10) === parseInt(cpf[10], 10)
}

/** Máscara 000.000.000-00 durante a digitação */
export function mascaraCPF(valor: string): string {
  const d = DIGITOS(valor).slice(0, 11)
  let out = d
  if (d.length > 3) out = `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length > 6) out = `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  if (d.length > 9) out = `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
  return out
}

// ---- CNPJ ----

export function validarCNPJ(valor: string): boolean {
  const cnpj = DIGITOS(valor)
  if (cnpj.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cnpj)) return false // sequências iguais são inválidas
  const calc = (base: number): number => {
    const pesos = base === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let soma = 0
    for (let i = 0; i < base; i++) soma += parseInt(cnpj[i], 10) * pesos[i]
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }
  return calc(12) === parseInt(cnpj[12], 10) && calc(13) === parseInt(cnpj[13], 10)
}

/** Máscara 00.000.000/0000-00 durante a digitação */
export function mascaraCNPJ(valor: string): string {
  const d = DIGITOS(valor).slice(0, 14)
  let out = d
  if (d.length > 2) out = `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length > 5) out = `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length > 8) out = `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  if (d.length > 12)
    out = `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
  return out
}

/** Mensagem para exibição em formulário; null quando válido/preenchido parcialmente */
export function mensagemValidacaoDocumento(
  tipo: 'cpf' | 'cnpj',
  valor: string,
): string | null {
  const d = DIGITOS(valor)
  if (!d) return null
  if (tipo === 'cpf') {
    if (d.length < 11) return null // ainda digitando
    return validarCPF(d) ? null : 'CPF inválido — verifique os números digitados.'
  }
  if (d.length < 14) return null // ainda digitando
  return validarCNPJ(d) ? null : 'CNPJ inválido — verifique os números digitados.'
}

/** Bloqueia o salvamento quando o documento está preenchido e inválido */
export function documentoBloqueiaSalvamento(
  tipo: 'cpf' | 'cnpj',
  valor: string,
): boolean {
  const d = DIGITOS(valor)
  if (!d) return false
  if (tipo === 'cpf') return d.length >= 11 && !validarCPF(d)
  return d.length >= 14 && !validarCNPJ(d)
}
