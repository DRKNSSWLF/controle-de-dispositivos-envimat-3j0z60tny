export type TipoDispositivo = 'celular' | 'notebook' | 'tablet' | 'outro'
export type StatusDispositivo = 'em_uso' | 'backup' | 'manutencao'

export interface Colaborador {
  id: string
  nome: string
  departamento?: string
  cargo?: string
  email?: string
  telefone?: string
  cpf?: string
  matricula?: string
  observacoes?: string
  created: string
  updated: string
}

export interface Dispositivo {
  id: string
  tipo: TipoDispositivo
  fabricante: string
  modelo: string
  numero_serie: string
  imei1?: string
  imei2?: string
  colaborador?: string
  expand?: {
    colaborador?: Colaborador
  }
  status: StatusDispositivo
  data_aquisicao?: string
  data_inicio_manutencao?: string
  observacoes?: string
  is_demo?: boolean
  created: string
  updated: string
}

export interface NovoDispositivoInput {
  tipo: TipoDispositivo
  fabricante: string
  modelo: string
  numero_serie: string
  imei1?: string
  imei2?: string
  colaborador?: string
  status: StatusDispositivo
  data_aquisicao?: string
  data_inicio_manutencao?: string
  observacoes?: string
}

export interface NovoColaboradorInput {
  nome: string
  departamento?: string
  cargo?: string
  email?: string
  telefone?: string
  cpf?: string
  matricula?: string
  observacoes?: string
}

export interface AlertaDispositivo {
  id: string
  dispositivo: Dispositivo
  tipoAlerta: 'manutencao_longa' | 'sem_responsavel' | 'idade_avancada' | 'garantia_atencao'
  severidade: 'critico' | 'atencao' | 'info'
  titulo: string
  mensagem: string
  detalheTempo?: string
}
