import jsPDF from 'jspdf'
import { Contrato, Dispositivo, Colaborador } from '@/types/inventory'
import { camposDoDispositivo } from '@/lib/contratoCampos'

// Geração de PDF de Comodato / Distrato de Comodato em 2 vias (client-side, jsPDF).
// Texto real do contrato de comodato da ENVIMAT (modelo enviado pelo usuário),
// com os campos do colaborador e do dispositivo pré-preenchidos nos lugares corretos.
// O LOGO da ENVIMAT é carregado, embutido via canvas (dataURL PNG) e incluído no
// cabeçalho — o PDF continua autocontido, sem referência externa.

// Dados fixos da ENVIMAT — atualizados conforme o Cartão CNPJ da MATRIZ (2026)
const ENVIMAT_RODAPE_1 = 'ENVIMAT ENVIRONMENT & MATERIAL HANDLING LTDA'
const ENVIMAT_RODAPE_2 = 'CNPJ: 13.943.060/0001-80'
const ENVIMAT_RODAPE_3 =
  'ENDEREÇO: ALAMEDA SINLIOKU TANAKA, 170 – EDIF. 21 – PARQUE TECNOLÓGICO DAMHA I – SÃO CARLOS/SP – CEP 13565-261'
const ENVIMAT_RODAPE_4 = 'SITE: www.envimat.com.br'

const COMODANTE_QUALIFICACAO =
  'na qualidade de COMODANTE: ENVIMAT ENVIRONMENT & MATERIAL HANDLING LTDA, ' +
  'com sede em São Carlos, na Alameda Sinlioku Tanaka, nº 170, Edif. 21, Parque Tecnológico Damha I, ' +
  'CEP 13565-261, no Estado de São Paulo, inscrita no CNPJ sob o nº 13.943.060/0001-80, neste ato ' +
  'representada pelo seu diretor VINICIUS CASSELLI, brasileiro, casado, engenheiro agrônomo, ' +
  'Carteira de Identidade nº 24.952.844-7, CPF: 170.515.388-70, residente e ' +
  'domiciliado na Rua João Antônio de Oliveira nº 1228, apto. 12-C, CEP 03111-001, nesta capital, ' +
  'no Estado de São Paulo'

// Logo oficial ENVIMAT (PNG do manual da marca enviado pelo usuário), convertido
// para dataURL em runtime e embutido no PDF — autocontido, sem referência externa.
const LOGO_URL = '/logo-envimat.png'

interface LogoEmbutido {
  dataUrl: string
  altura: number // altura proporcional para largura de 18 mm
}

let logoCache: LogoEmbutido | null = null

async function carregarLogo(): Promise<LogoEmbutido | null> {
  if (logoCache) return logoCache
  try {
    const dataUrl = await new Promise<string | null>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        try {
          const largura = 160
          const altura = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * largura))
          const canvas = document.createElement('canvas')
          canvas.width = largura
          canvas.height = altura
          const ctx = canvas.getContext('2d')
          if (!ctx) return resolve(null)
          ctx.drawImage(img, 0, 0, largura, altura)
          resolve(canvas.toDataURL('image/png'))
        } catch {
          resolve(null)
        }
      }
      img.onerror = () => resolve(null)
      img.src = LOGO_URL
    })
    if (!dataUrl) return null
    // Assinatura completa do logo: proporção real do PNG (~4,6:1) com pequena folga
    const proporcao = 0.22
    logoCache = { dataUrl, altura: 40 * proporcao }
    return logoCache
  } catch {
    return null
  }
}

const dataBR = (iso?: string) => {
  if (!iso) return '___/___/______'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '___/___/______'
  return d.toLocaleDateString('pt-BR')
}

const dataPorExtenso = (iso?: string) => {
  const d = iso ? new Date(iso) : new Date()
  if (isNaN(d.getTime())) d.setTime(Date.now())
  const meses = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ]
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`
}

function linhasColaborador(c: Colaborador): Array<[string, string]> {
  return [
    ['Nome completo', c.nome || '-'],
    ['Nacionalidade', c.nacionalidade || '-'],
    ['Estado civil', c.estado_civil || '-'],
    ['Documento de identidade', c.documento_identidade || '-'],
    ['Emissor', c.emissor_documento || '-'],
    ['CPF', c.cpf || '-'],
    ['Endereço completo', c.endereco || '-'],
    ['Cidade / Estado / UF', [c.cidade, c.estado, c.uf].filter(Boolean).join(' / ') || '-'],
  ]
}

function quebraTexto(doc: jsPDF, texto: string, largura: number): string[] {
  return doc.splitTextToSize(texto, largura) as string[]
}

function qualificacaoColaborador(c: Colaborador): string {
  const docIdent = c.documento_identidade
    ? `Carteira de Identidade nº ${c.documento_identidade}${c.emissor_documento ? ` ${c.emissor_documento}` : ''}`
    : 'Carteira de Identidade nº —'
  return [
    c.nome || '—',
    c.nacionalidade || 'brasileiro(a)',
    c.estado_civil || '—',
    c.cargo || '',
    `${docIdent},`,
    `CPF nº ${c.cpf || '—'},`,
    'residente e domiciliado na',
    c.endereco || '—',
    c.cidade ? `, na cidade de ${c.cidade}` : '',
    c.estado ? `, no Estado de ${c.estado}` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

// Descrição corrida do objeto (mesmo estilo do contrato real; celular com IMEI 1 E 2)
function descricaoInline(d: Dispositivo): string {
  const marca = d.fabricante || '—'
  const modelo = d.modelo || '—'
  const serie = d.numero_serie || '—'
  if (d.tipo === 'celular') {
    return `Smartphone, marca ${marca}, modelo ${modelo}, IMEI 1: ${d.imei1 || '—'}, IMEI 2: ${d.imei2 || '—'}, nº Série ${serie}.`
  }
  if (d.tipo === 'tablet') {
    return `Tablet, marca ${marca}, modelo ${modelo}, nº Série ${serie}.`
  }
  if (d.tipo === 'notebook') {
    return `Notebook, marca ${marca}, modelo ${modelo}, nº Série ${serie}.`
  }
  return `Equipamento eletrônico, marca ${marca}, modelo ${modelo}, nº Série ${serie}.`
}

function tituloDocumento(tipo: 'comodato' | 'distrato', d: Dispositivo): string {
  const sufixo =
    d.tipo === 'celular'
      ? 'APARELHO CELULAR'
      : d.tipo === 'tablet'
        ? 'TABLET'
        : d.tipo === 'notebook'
          ? 'NOTEBOOK'
          : 'EQUIPAMENTO ELETRÔNICO'
  return tipo === 'distrato'
    ? `DISTRATO DE COMODATO DE ${sufixo}`
    : `CONTRATO DE COMODATO DE ${sufixo}`
}

// Cláusulas do contrato real (modelo de comodato de celular da ENVIMAT).
// Para notebooks/tablets o texto é o mesmo, variando apenas o bloco do
// dispositivo; a cláusula de contas telefônicas só existe no comodato de celular.
function clausulasComodato(d: Dispositivo): string[] {
  const aparelho = d.tipo === 'celular' ? 'telefone celular' : 'equipamento'
  const clausulas: string[] = []
  if (d.tipo === 'celular') {
    clausulas.push(
      'Cláusula 2ª. O COMODANTE é responsável pelo pagamento de todas as contas telefônicas compreendidas no período de vigência deste contrato.',
    )
  }
  clausulas.push(
    `Cláusula ${d.tipo === 'celular' ? '3ª' : '2ª'}. É proibido ao COMODATÁRIO emprestar o ${aparelho}, objeto deste contrato, a terceiros.`,
    `Cláusula ${d.tipo === 'celular' ? '4ª' : '3ª'}. O COMODATÁRIO deverá comunicar imediatamente à COMODANTE os defeitos que surgirem no ${aparelho} e providenciar o conserto do mesmo.`,
    `Cláusula ${d.tipo === 'celular' ? '5ª' : '4ª'}. Em caso de roubo ou furto, o COMODATÁRIO deverá apresentar boletim de ocorrência.`,
    `Cláusula ${d.tipo === 'celular' ? '6ª' : '5ª'}. O COMODATÁRIO deverá devolver o ${aparelho} à COMODANTE quando for por esta solicitado, nas mesmas condições em que estava quando o recebeu, ou seja, em perfeitas condições de uso, respondendo pelos danos ou prejuízos causados.`,
    `Cláusula ${d.tipo === 'celular' ? '7ª' : '6ª'}. A devolução deve se dar no mesmo prazo da contratação dos serviços do COMODATÁRIO, ao término deste, efetuar a devolução do ${aparelho} imediatamente à COMODANTE.`,
    'Cláusula 8ª. É assegurado às partes a rescisão do presente contrato a qualquer momento, devendo, entretanto, comunicar à outra parte com antecedência mínima de 5 dias.',
    'Cláusula 9ª. O descumprimento, pelos contratantes, do disposto nas presentes cláusulas também ensejará a rescisão deste instrumento.',
    'Cláusula 10ª. Este contrato é de prazo indeterminado.',
    'Cláusula 11ª. Este contrato deve ser registrado no Cartório de Registro de Títulos e Documentos.',
    'Cláusula 12ª. O presente instrumento passa a valer a partir da assinatura pelas partes.',
    'Cláusula 13ª. Para dirimir quaisquer controvérsias oriundas do CONTRATO, as partes elegem o foro da comarca de São Paulo.',
  )
  return clausulas
}

function clausulasDistrato(contrato: Contrato): string[] {
  const clausulas = [
    'Cláusula 1ª. As partes resolvem, de comum acordo, DISTRATAR o contrato de comodato do equipamento descrito acima, celebrado entre as partes' +
      (contrato.expand?.vinculo?.data_inicio
        ? ` em ${dataBR(contrato.expand.vinculo.data_inicio)}`
        : '') +
      ', devolvido pelo COMODATÁRIO à COMODANTE na data de ' +
      dataBR(contrato.updated || new Date().toISOString()) +
      '.',
  ]
  const motivo = contrato.observacoes?.trim()
  if (motivo) {
    clausulas.push(`Cláusula 2ª. O presente distrato decorre de: ${motivo}.`)
  }
  clausulas.push(
    `Cláusula ${motivo ? '3ª' : '2ª'}. O COMODATÁRIO declara devolver o equipamento em perfeitas condições de uso, salvo desgaste natural do uso regular, respondendo pelos danos ou prejuízos causados fora do desgaste natural.`,
    `Cláusula ${motivo ? '4ª' : '3ª'}. Ficam encerradas todas as obrigações pactuadas no contrato de comodato objeto deste distrato, nada tendo a reclamar uma parte da outra.`,
    `Cláusula ${motivo ? '5ª' : '4ª'}. Este distrato deve ser registrado no Cartório de Registro de Títulos e Documentos.`,
    `Cláusula ${motivo ? '6ª' : '5ª'}. O presente instrumento passa a valer a partir da assinatura pelas partes.`,
    `Cláusula ${motivo ? '7ª' : '6ª'}. Para dirimir quaisquer controvérsias oriundas do DISTRATO, as partes elegem o foro da comarca de São Paulo.`,
  )
  return clausulas
}

interface CtxVia {
  contrato: Contrato
  dispositivo: Dispositivo
  colaborador: Colaborador
  logo: LogoEmbutido | null
}

function larguraUtil(doc: jsPDF): number {
  return doc.internal.pageSize.getWidth() - 14 * 2
}

function paginaAltura(doc: jsPDF): number {
  return doc.internal.pageSize.getHeight()
}

function rodape(doc: jsPDF) {
  const y = paginaAltura(doc) - 16
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.text(ENVIMAT_RODAPE_1, 105, y, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.text(ENVIMAT_RODAPE_2, 105, y + 3, { align: 'center' })
  doc.text(ENVIMAT_RODAPE_3, 105, y + 6, { align: 'center' })
  doc.text(ENVIMAT_RODAPE_4, 105, y + 9, { align: 'center' })
}

function cabecalho(doc: jsPDF, y: number, logo: LogoEmbutido | null): number {
  const margem = 14
  if (logo) {
    // Logo oficial completo (assinatura ENVIMAT) no topo, à esquerda
    doc.addImage(logo.dataUrl, 'PNG', margem, y - 2, 40, logo.altura)
    doc.setTextColor(0)
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(20, 90, 55)
    doc.text('ENVIMAT', margem, y + 4)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7.5)
    doc.setTextColor(60, 120, 85)
    doc.text('Environment & Material Handling', margem, y + 8)
    doc.setTextColor(0)
  }
  doc.setDrawColor(20, 90, 55)
  doc.setLineWidth(0.5)
  doc.line(margem, y + 11, doc.internal.pageSize.getWidth() - margem, y + 11)
  doc.setLineWidth(0.2)
  return y + 16
}

function garanteEspaco(
  doc: jsPDF,
  y: number,
  necessario: number,
  logo: LogoEmbutido | null,
): number {
  if (y + necessario > paginaAltura(doc) - 24) {
    rodape(doc)
    doc.addPage()
    return cabecalho(doc, 16, logo)
  }
  return y
}

function paragrafo(doc: jsPDF, ctx: CtxVia, y: number, texto: string, negrito = false): number {
  doc.setFont('helvetica', negrito ? 'bold' : 'normal')
  doc.setFontSize(8.2)
  const linhas = quebraTexto(doc, texto, larguraUtil(doc))
  for (const l of linhas) {
    y = garanteEspaco(doc, y, 4, ctx.logo)
    doc.text(l, 14, y)
    y += 3.7
  }
  return y + 1
}

function blocoConfiguracao(doc: jsPDF, ctx: CtxVia, y: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  y = garanteEspaco(doc, y, 6, ctx.logo)
  doc.text('CONFIGURAÇÃO DO DISPOSITIVO', 14, y)
  y += 4.5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  for (const campo of camposDoDispositivo(ctx.dispositivo)) {
    y = garanteEspaco(doc, y, 4, ctx.logo)
    doc.text(`${campo.rotulo}:`, 16, y)
    doc.text(campo.valor, 52, y)
    y += 3.6
  }
  return y + 2
}

function blocoAssinaturas(doc: jsPDF, ctx: CtxVia, y: number): number {
  const margem = 14
  const largura = larguraUtil(doc)

  y = garanteEspaco(doc, y, 34, ctx.logo)
  y += 2
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.2)
  doc.text(
    `São Paulo, ${dataPorExtenso(ctx.contrato.updated || new Date().toISOString())}`,
    margem,
    y,
  )
  y += 14

  // ENVIMAT (comodante) | COMODATÁRIO | TESTEMUNHAS
  const col1 = margem + 32
  const col2 = margem + 100
  const col3 = margem + 152

  doc.line(col1 - 30, y, col1 + 30, y)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('ENVIMAT ENVIRONMENT & MATERIAL', col1, y + 3.2, { align: 'center' })
  doc.text('HANDLING LTDA', col1, y + 6, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.text('Vinícius Casselli', col1, y + 8.8, { align: 'center' })
  doc.text('CPF: 170.515.388-70', col1, y + 11.6, { align: 'center' })

  doc.line(col2 - 30, y, col2 + 30, y)
  doc.setFont('helvetica', 'normal')
  doc.text(ctx.colaborador.nome || 'COMODATÁRIO', col2, y + 6, { align: 'center' })
  doc.text('COMODATÁRIO', col2, y + 8.8, { align: 'center' })

  doc.line(col3 - 20, y, col3 + 20, y)
  doc.setFont('helvetica', 'bold')
  doc.text('TESTEMUNHAS:', col3, y + 3.2, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.text('1. ______________________', col3, y + 8.8, { align: 'center' })
  doc.text('2. ______________________', col3, y + 13.5, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.2)

  return y + 18
}

function renderVia(doc: jsPDF, ctx: CtxVia, via: number, totalVias: number): number {
  const { contrato, dispositivo, colaborador, logo } = ctx
  const ehDistrato = contrato.tipo === 'distrato'

  doc.addPage()
  let y = cabecalho(doc, 16, logo)

  // Título
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  y = garanteEspaco(doc, y, 8, logo)
  doc.text(tituloDocumento(contrato.tipo, dispositivo), 105, y, { align: 'center' })
  y += 7

  // Marcador da via
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(110)
  doc.text(
    `${via}ª VIA — ${via === 1 ? 'COMODANTE (ENVIMAT)' : 'COMODATÁRIO (COLABORADOR)'}${totalVias > 1 ? ' (2 vias de igual teor)' : ''}`,
    105,
    y,
    { align: 'center' },
  )
  doc.setTextColor(0)
  y += 6

  // Preâmbulo com qualificação das partes (texto real do contrato)
  if (ehDistrato) {
    y = paragrafo(
      doc,
      ctx,
      y,
      `Pelo presente instrumento particular de distrato de comodato, de um lado, ${COMODANTE_QUALIFICACAO}; e de outro, na qualidade de COMODATÁRIO: ${qualificacaoColaborador(colaborador)}, têm justo e contratado o DISTRATO do comodato do equipamento descrito a seguir:`,
    )
  } else {
    const aparelho =
      dispositivo.tipo === 'celular'
        ? 'de aparelho de telefone celular'
        : 'de equipamento eletrônico'
    y = paragrafo(
      doc,
      ctx,
      y,
      `Pelo presente instrumento particular de comodato ${aparelho}, de um lado, ${COMODANTE_QUALIFICACAO}; e de outro, na qualidade de COMODATÁRIO: ${qualificacaoColaborador(colaborador)}, têm justo e contratado o que segue:`,
    )
  }

  // DO OBJETO
  y = paragrafo(doc, ctx, y, ehDistrato ? 'DO OBJETO DO DISTRATO' : 'DO OBJETO DO CONTRATO', true)
  y = paragrafo(
    doc,
    ctx,
    y,
    'Cláusula 1ª. O presente contrato tem como OBJETO o comodato do equipamento descrito a seguir:',
  )
  y = paragrafo(doc, ctx, y, descricaoInline(dispositivo))
  y = blocoConfiguracao(doc, ctx, y)

  // Cláusulas
  if (!ehDistrato) {
    y = paragrafo(doc, ctx, y, 'DAS OBRIGAÇÕES DO COMODATÁRIO', true)
    for (const cl of clausulasComodato(dispositivo)) y = paragrafo(doc, ctx, y, cl)
  } else {
    for (const cl of clausulasDistrato(contrato)) y = paragrafo(doc, ctx, y, cl)
  }

  // DO FORO + fechamento
  if (!ehDistrato) {
    y = paragrafo(doc, ctx, y, 'DO FORO', true)
  }
  y = paragrafo(
    doc,
    ctx,
    y,
    'Por estarem assim justos e contratados, firmam o presente instrumento, em duas vias de igual teor, juntamente com 2 (duas) testemunhas.',
  )

  y = blocoAssinaturas(doc, ctx, y)

  // Observações livres (fora do texto do contrato)
  if (contrato.observacoes && !ehDistrato) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7)
    const obs = quebraTexto(doc, `Obs.: ${contrato.observacoes}`, larguraUtil(doc))
    for (const l of obs) {
      y = garanteEspaco(doc, y, 4, logo)
      doc.text(l, 14, y)
      y += 3.3
    }
  }

  rodape(doc)
  return y
}

export async function gerarPDFContrato(
  contrato: Contrato,
  dispositivo: Dispositivo,
  colaborador: Colaborador,
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const logo = await carregarLogo()
  const ctx: CtxVia = { contrato, dispositivo, colaborador, logo }

  // 2 vias do mesmo documento, cada uma começando em página própria
  renderVia(doc, ctx, 1, 2)
  renderVia(doc, ctx, 2, 2)

  // Remove a página em branco inicial criada pelo construtor
  doc.deletePage(1)

  const nome = colaborador.nome?.replace(/\s+/g, '_').toLowerCase() || 'colaborador'
  const tipo = contrato.tipo === 'distrato' ? 'distrato-comodato' : 'contrato-comodato'
  doc.save(`${tipo}_${nome}_${dispositivo.numero_serie || dispositivo.id.slice(0, 6)}.pdf`)
}
