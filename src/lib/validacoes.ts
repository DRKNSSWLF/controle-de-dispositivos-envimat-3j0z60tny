// Máscaras e validações de CNPJ / CPF (dígitos verificadores oficiais)

export const somenteDigitos = (v: string) => (v || '').replace(/\D+/g, '')

/** Aplica máscara 00.000.000/0000-00 conforme o usuário digita. */
export function mascararCNPJ(v: string): string {
  const d = somenteDigitos(v).slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

/** Aplica máscara 000.000.000-00 conforme o usuário digita. */
export function mascararCPF(v: string): string {
  const d = somenteDigitos(v).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** Valida os dígitos verificadores do CNPJ (algoritmo da Receita Federal). */
export function validarCNPJ(valor: string): boolean {
  const cnpj = somenteDigitos(valor)
  if (cnpj.length !== 14) return false
  // Rejeita sequências iguais (000.000.000-00 etc.)
  if (/^(\d)\1{13}$/.test(cnpj)) return false
  const calcular = (base: string) => {
    let peso = base.length - 7 // começa em 5 (9 dígitos) ou 6 (10 dígitos)
    let soma = 0
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * peso--
      if (peso < 2) peso = 9
    }
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }
  const d1 = calcular(cnpj.slice(0, 12))
  if (d1 !== Number(cnpj[12])) return false
  const d2 = calcular(cnpj.slice(0, 13))
  return d2 === Number(cnpj[13])
}

/** Valida os dígitos verificadores do CPF. */
export function validarCPF(valor: string): boolean {
  const cpf = somenteDigitos(valor)
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false
  const calcular = (base: string) => {
    let soma = 0
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (base.length + 1 - i)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }
  return calcular(cpf.slice(0, 9)) === Number(cpf[9]) && calcular(cpf.slice(0, 10)) === Number(cpf[10])
}

/** Válido para submissão: pode ficar em branco (campo opcional). */
export function cnpjOpcionalValido(valor?: string): boolean {
  const d = somenteDigitos(valor)
  return d.length === 0 || validarCNPJ(d)
}

export function cpfOpcionalValido(valor?: string): boolean {
  const d = somenteDigitos(valor)
  return d.length === 0 || validarCPF(d)
}
