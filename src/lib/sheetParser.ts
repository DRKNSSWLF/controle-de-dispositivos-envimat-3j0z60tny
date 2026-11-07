/**
 * Parser leve e robusto para arquivos CSV e planilhas tabulares (com suporte a TSV, ponto e vírgula e vírgula).
 * Converte linhas em arrays de objetos mapeáveis para o formulário de importação.
 */

export interface ParsedSheet {
  headers: string[]
  rows: Record<string, string>[]
  totalLinhas: number
}

export function parseCSVContent(text: string): ParsedSheet {
  // Remove byte order mark (BOM) se existir
  const clean = text.replace(/^\uFEFF/, '').trim()
  if (!clean) {
    return { headers: [], rows: [], totalLinhas: 0 }
  }

  // Detecta se o delimitador é ponto e vírgula (;), tabulação (\t) ou vírgula (,)
  const firstLine = clean.split(/\r\n|\n|\r/)[0] || ''
  let delimiter = ','
  const semicolonCount = (firstLine.match(/;/g) || []).length
  const commaCount = (firstLine.match(/,/g) || []).length
  const tabCount = (firstLine.match(/\t/g) || []).length

  if (semicolonCount > commaCount && semicolonCount >= tabCount) {
    delimiter = ';'
  } else if (tabCount > commaCount) {
    delimiter = '\t'
  }

  const lines = parseCSVRows(clean, delimiter)
  if (lines.length === 0) {
    return { headers: [], rows: [], totalLinhas: 0 }
  }

  const rawHeaders = lines[0].map((h) => h.trim())
  // Garante cabeçalhos únicos e não vazios
  const headers = rawHeaders.map((h, idx) => h || `Coluna_${idx + 1}`)

  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const rowValues = lines[i]
    // Se a linha for completamente vazia, ignora
    const isRowEmpty = rowValues.every((val) => !val || val.trim() === '')
    if (isRowEmpty) continue

    const rowObj: Record<string, string> = {}
    headers.forEach((header, index) => {
      rowObj[header] = (rowValues[index] ?? '').trim()
    })
    rows.push(rowObj)
  }

  return {
    headers,
    rows,
    totalLinhas: rows.length,
  }
}

/**
 * Parser de linhas CSV que lida corretamente com aspas e quebras de linha entre aspas
 */
function parseCSVRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentVal = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"'
        i++ // pula a segunda aspa escapada
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentVal)
      currentVal = ''
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++
      }
      currentRow.push(currentVal)
      rows.push(currentRow)
      currentRow = []
      currentVal = ''
    } else {
      currentVal += char
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal)
    rows.push(currentRow)
  }

  return rows
}

/**
 * Sugere automaticamente o mapeamento de cabeçalho da planilha para o campo do sistema
 */
export function inferMapping(
  headers: string[],
  targetFields: { key: string; label: string; aliases: string[] }[],
): Record<string, string> {
  const mapping: Record<string, string> = {}

  for (const field of targetFields) {
    const matchedHeader = headers.find((header) => {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '')
      return field.aliases.some((alias) => {
        const normalizedAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '')
        return (
          normalizedHeader.includes(normalizedAlias) || normalizedAlias.includes(normalizedHeader)
        )
      })
    })

    if (matchedHeader) {
      mapping[field.key] = matchedHeader
    }
  }

  return mapping
}
