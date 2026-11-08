import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatarData(iso?: string): string {
  if (!iso) return '-'
  try {
    return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return '-'
  }
}

export function formatarDataSimples(iso?: string): string {
  if (!iso) return '-'
  try {
    return format(new Date(iso), 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return '-'
  }
}
