import { Dispositivo, AlertaDispositivo } from '@/types/inventory'
import { differenceInDays, differenceInYears, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface InventarioEstatisticas {
  total: number
  emUso: number
  disponivel: number
  manutencao: number
  porTipo: {
    celular: number
    notebook: number
    tablet: number
    outro: number
  }
  idadeMediaAnos: number
  antigosMais3Anos: number
  semColaboradorEmUso: number
  emManutencaoCritica: number
}

export function calcularEstatisticas(dispositivos: Dispositivo[]): InventarioEstatisticas {
  const total = dispositivos.length
  let emUso = 0
  let disponivel = 0
  let manutencao = 0

  const porTipo = {
    celular: 0,
    notebook: 0,
    tablet: 0,
    outro: 0,
  }

  let somaIdadesAnos = 0
  let contagemComData = 0
  let antigosMais3Anos = 0
  let semColaboradorEmUso = 0
  let emManutencaoCritica = 0

  const hoje = new Date()

  dispositivos.forEach((d) => {
    // Status
    if (d.status === 'em_uso') emUso++
    else if (d.status === 'disponivel') disponivel++
    else if (d.status === 'manutencao') manutencao++

    // Tipo
    if (d.tipo in porTipo) {
      porTipo[d.tipo]++
    } else {
      porTipo.outro++
    }

    // Idade
    if (d.data_aquisicao) {
      const dataAq = new Date(d.data_aquisicao)
      if (!isNaN(dataAq.getTime())) {
        const anos = differenceInYears(hoje, dataAq)
        somaIdadesAnos += anos
        contagemComData++
        if (anos >= 3) {
          antigosMais3Anos++
        }
      }
    }

    // Sem colaborador mesmo estando "em uso"
    if (d.status === 'em_uso' && (!d.colaborador || d.colaborador.trim() === '')) {
      semColaboradorEmUso++
    }

    // Manutenção longa (> 30 dias)
    if (d.status === 'manutencao') {
      if (d.data_inicio_manutencao) {
        const dataMan = new Date(d.data_inicio_manutencao)
        if (!isNaN(dataMan.getTime())) {
          const dias = differenceInDays(hoje, dataMan)
          if (dias >= 30) emManutencaoCritica++
        }
      } else {
        // Se está em manutenção sem data, também conta como ponto de atenção
        emManutencaoCritica++
      }
    }
  })

  const idadeMediaAnos =
    contagemComData > 0 ? parseFloat((somaIdadesAnos / contagemComData).toFixed(1)) : 0

  return {
    total,
    emUso,
    disponivel,
    manutencao,
    porTipo,
    idadeMediaAnos,
    antigosMais3Anos,
    semColaboradorEmUso,
    emManutencaoCritica,
  }
}

export function gerarAlertas(dispositivos: Dispositivo[]): AlertaDispositivo[] {
  const alertas: AlertaDispositivo[] = []
  const hoje = new Date()

  dispositivos.forEach((d) => {
    // 1. Manutenção há muito tempo (> 30 dias)
    if (d.status === 'manutencao') {
      if (d.data_inicio_manutencao) {
        const dataMan = new Date(d.data_inicio_manutencao)
        if (!isNaN(dataMan.getTime())) {
          const dias = differenceInDays(hoje, dataMan)
          if (dias >= 30) {
            alertas.push({
              id: `manutencao-${d.id}`,
              dispositivo: d,
              tipoAlerta: 'manutencao_longa',
              severidade: dias > 60 ? 'critico' : 'atencao',
              titulo: `Manutenção há ${dias} dias`,
              mensagem: `${d.fabricante} ${d.modelo} (S/N: ${d.numero_serie}) está na oficina/assistência técnica desde ${format(dataMan, 'dd/MM/yyyy', { locale: ptBR })}. Contate a assistência para agilizar o reparo ou substituição.`,
              detalheTempo: `${dias} dias em reparo`,
            })
          }
        }
      } else {
        // Manutenção sem data registrada
        alertas.push({
          id: `manutencao-semdata-${d.id}`,
          dispositivo: d,
          tipoAlerta: 'manutencao_longa',
          severidade: 'atencao',
          titulo: 'Manutenção sem data de início registrada',
          mensagem: `${d.fabricante} ${d.modelo} está marcado em manutenção, mas não tem a data de envio registrada para acompanhamento de SLA.`,
          detalheTempo: 'Sem data de envio',
        })
      }
    }

    // 2. Dispositivo em uso SEM colaborador responsável atribuído
    if (d.status === 'em_uso' && (!d.colaborador || d.colaborador.trim() === '')) {
      alertas.push({
        id: `sem-resp-${d.id}`,
        dispositivo: d,
        tipoAlerta: 'sem_responsavel',
        severidade: 'critico',
        titulo: 'Dispositivo em uso sem termo/responsável',
        mensagem: `${d.fabricante} ${d.modelo} (${d.tipo}) está marcado como "em uso", porém sem nenhum colaborador vinculado no sistema. Risco de perda de rastreabilidade do comodato.`,
        detalheTempo: 'Colaborador não atribuído',
      })
    }

    // 3. Idade acima do esperado (> 3 anos ou > 4 anos para renovação de parque tecnológico)
    if (d.data_aquisicao) {
      const dataAq = new Date(d.data_aquisicao)
      if (!isNaN(dataAq.getTime())) {
        const anos = differenceInYears(hoje, dataAq)
        if (anos >= 3) {
          const severidade = anos >= 4 ? 'critico' : 'atencao'
          alertas.push({
            id: `idade-${d.id}`,
            dispositivo: d,
            tipoAlerta: 'idade_avancada',
            severidade,
            titulo: `Idade avançada: ${anos} anos de uso`,
            mensagem: `${d.fabricante} ${d.modelo} foi adquirido em ${format(dataAq, 'MM/yyyy', { locale: ptBR })} (${anos} anos atrás). Recomenda-se planejar a compra e substituição para evitar paradas na operação ENVIMAT.`,
            detalheTempo: `Adquirido em ${format(dataAq, 'dd/MM/yyyy', { locale: ptBR })}`,
          })
        }
      }
    }
  })

  // Ordenar alertas: primeiro críticos, depois atenção
  return alertas.sort((a, b) => {
    const pesos = { critico: 3, atencao: 2, info: 1 }
    return pesos[b.severidade] - pesos[a.severidade]
  })
}
