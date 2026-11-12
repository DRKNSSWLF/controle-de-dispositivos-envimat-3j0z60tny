// Tipos do domínio de Controle de Dispositivos da ENVIMAT

export type TipoDispositivo = 'celular' | 'notebook' | 'tablet' | 'outro'

// ---- Contas de usuário (login / permissões) ----

export type NivelAcesso = 'master' | 'admin'

// "disponivel" substitui o antigo "backup / reserva"
export type StatusDispositivo = 'em_uso' | 'disponivel' | 'manutencao'

export type StatusColaborador = 'ativo' | 'desligado'

export interface Colaborador {
  id: string
  nome: string
  departamento?: string
  cargo?: string
  email?: string
  telefone?: string
  cpf?: string
  matricula?: string
  // Campos exigidos pelo contrato de comodato
  nacionalidade?: string
  estado_civil?: string
  documento_identidade?: string
  emissor_documento?: string
  endereco?: string
  cidade?: string
  estado?: string
  uf?: string
  status?: StatusColaborador
  observacoes?: string
  created?: string
  updated?: string
}

export interface NovoColaboradorInput {
  nome: string
  departamento?: string
  cargo?: string
  email?: string
  telefone?: string
  cpf?: string
  matricula?: string
  nacionalidade?: string
  estado_civil?: string
  documento_identidade?: string
  emissor_documento?: string
  endereco?: string
  cidade?: string
  estado?: string
  uf?: string
  status?: StatusColaborador
  observacoes?: string
}

export interface Dispositivo {
  id: string
  tipo: TipoDispositivo
  fabricante: string
  modelo: string
  numero_serie: string
  imei1?: string
  imei2?: string
  // Campos técnicos usados nos contratos por tipo de dispositivo
  ram?: string
  armazenamento_interno?: string
  armazenamento_externo?: string
  processador?: string
  colaborador?: string
  status: StatusDispositivo
  data_aquisicao?: string
  data_inicio_manutencao?: string
  observacoes?: string
  is_demo?: boolean
  created?: string
  updated?: string
  expand?: {
    colaborador?: Colaborador
  }
}

export interface NovoDispositivoInput {
  tipo: TipoDispositivo
  fabricante: string
  modelo: string
  numero_serie: string
  imei1?: string
  imei2?: string
  ram?: string
  armazenamento_interno?: string
  armazenamento_externo?: string
  processador?: string
  colaborador?: string
  status: StatusDispositivo
  data_aquisicao?: string
  data_inicio_manutencao?: string
  observacoes?: string
}

// ---- Pessoas Jurídicas ----

export interface PessoaJuridica {
  id: string
  cnpj: string
  razao_social: string
  representante?: string
  cpf_representante?: string
  endereco?: string
  cidade?: string
  estado?: string
  uf?: string
  telefone?: string
  email?: string
  observacoes?: string
  is_demo?: boolean
  created?: string
  updated?: string
}

export interface NovaPessoaJuridicaInput {
  cnpj: string
  razao_social: string
  representante?: string
  cpf_representante?: string
  endereco?: string
  cidade?: string
  estado?: string
  uf?: string
  telefone?: string
  email?: string
  observacoes?: string
}

// ---- Vínculos (comodato) ----

export type SituacaoVinculo = 'ativo' | 'encerrado'

export interface Vinculo {
  id: string
  colaborador: string
  dispositivo: string
  data_inicio: string
  data_fim?: string
  situacao: SituacaoVinculo
  motivo_encerramento?: string
  observacoes?: string
  is_demo?: boolean
  created?: string
  updated?: string
  expand?: {
    colaborador?: Colaborador
    dispositivo?: Dispositivo
  }
}

export interface NovoVinculoInput {
  colaborador: string
  dispositivo: string
  data_inicio?: string
  observacoes?: string
}

// ---- Manutenções ----

export type SituacaoManutencao = 'em_manutencao' | 'retornado'

export interface Manutencao {
  id: string
  dispositivo: string
  data_envio: string
  data_retorno?: string
  motivo: string
  situacao: SituacaoManutencao
  observacoes?: string
  is_demo?: boolean
  created?: string
  updated?: string
  expand?: {
    dispositivo?: Dispositivo
  }
}

// ---- Histórico de movimentação ----

export type TipoEventoHistorico =
  | 'vinculo'
  | 'desvinculo_desligamento'
  | 'envio_manutencao'
  | 'retorno_manutencao'
  | 'alteracao_status'
  | 'cadastro'

export interface HistoricoMovimentacao {
  id: string
  dispositivo: string
  colaborador?: string
  tipo_evento: TipoEventoHistorico
  descricao: string
  motivo?: string
  is_demo?: boolean
  created?: string
  updated?: string
  expand?: {
    dispositivo?: Dispositivo
    colaborador?: Colaborador
  }
}

// ---- Contratos ----

export type TipoContrato = 'comodato' | 'distrato'

export interface Contrato {
  id: string
  tipo: TipoContrato
  dispositivo: string
  colaborador: string
  vinculo?: string
  numero_vias?: number
  observacoes?: string
  anexo_assinado?: string[]
  is_demo?: boolean
  created?: string
  updated?: string
  expand?: {
    dispositivo?: Dispositivo
    colaborador?: Colaborador
    vinculo?: Vinculo
  }
}

// ---- Tipos de dispositivos (cadastro dinâmico) ----

export interface TipoDispositivoConfig {
  id: string
  nome: string
  usa_imei: boolean
  created?: string
}

// ---- Linhas telefônicas ----

export type TipoLinha = 'celular' | 'modem'

export type StatusLinha = 'disponivel' | 'em_uso' | 'cancelada'

export interface LinhaTelefonica {
  id: string
  numero: string
  operadora?: string
  plano?: string
  tipo?: TipoLinha
  imei?: string
  colaborador?: string
  status?: StatusLinha
  observacoes?: string
  is_demo?: boolean
  created?: string
  updated?: string
  expand?: {
    colaborador?: Colaborador
  }
}

export interface NovaLinhaInput {
  numero: string
  operadora?: string
  plano?: string
  tipo?: TipoLinha
  imei?: string
  colaborador?: string
  status?: StatusLinha
  observacoes?: string
}

export interface VinculoLinha {
  id: string
  colaborador: string
  linha: string
  data_inicio: string
  data_fim?: string
  situacao: SituacaoVinculo
  motivo_encerramento?: string
  observacoes?: string
  created?: string
  updated?: string
  expand?: {
    colaborador?: Colaborador
    linha?: LinhaTelefonica
  }
}

export interface NovoVinculoLinhaInput {
  colaborador: string
  linha: string
  data_inicio?: string
  observacoes?: string
}

export interface AlertaDispositivo {
  id: string
  dispositivo: Dispositivo
  tipoAlerta: 'manutencao_longa' | 'sem_responsavel' | 'idade_avancada'
  severidade: 'critico' | 'atencao'
  titulo: string
  mensagem: string
  detalheTempo?: string
}
