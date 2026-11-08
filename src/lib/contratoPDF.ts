import jsPDF from 'jspdf'
import { Contrato, Dispositivo, Colaborador } from '@/types/inventory'
import { camposDoDispositivo } from '@/lib/contratoCampos'

// Geração de PDF de Comodato / Distrato de Comodato em 2 vias (client-side, jsPDF).

const ENVIMAT = 'ENVIMAT - Controle de Dispositivos'
const CIDADE_PADRAO = 'São Carlos/SP'

const dataBR = (iso?: string) => {
  if (!iso) return '___/___/______'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '___/___/______'
  return d.toLocaleDateString('pt-BR')
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

function renderVia(
  doc: jsPDF,
  contrato: Contrato,
  dispositivo: Dispositivo,
  colaborador: Colaborador,
  offsetY: number,
): number {
  const margem = 14
  const largura = doc.internal.pageSize.getWidth() - margem * 2
  const ehDistrato = contrato.tipo === 'distrato'
  let y = offsetY

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(ehDistrato ? 'DISTRATO DE COMODATO' : 'CONTRATO DE COMODATO', 105, y, {
    align: 'center',
  })
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text(ENVIMAT, 105, y, { align: 'center' })
  y += 4

  doc.setFontSize(8)
  const intro = ehDistrato
    ? `Pelo presente instrumento, as partes resolvem DISTRATAR o comodato do equipamento eletrônico descrito abaixo, devolvido pelo COMODATÁRIO à ENVIMAT na data de ${dataBR(contrato.updated || new Date().toISOString())}.`
    : `Pelo presente instrumento, a ENVIMAT concede em COMODATO ao COMODATÁRIO o equipamento eletrônico descrito abaixo, para uso exclusivo no exercício de suas funções contratadas, sendo vedado o empréstimo a terceiros.`

  const introLinhas = quebraTexto(doc, intro, largura)
  introLinhas.forEach((l) => {
    doc.text(l, margem, y)
    y += 3.6
  })
  y += 2

  // COMODATÁRIO
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text('COMODATÁRIO (COLABORADOR)', margem, y)
  y += 4.5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  for (const [rotulo, valor] of linhasColaborador(colaborador)) {
    doc.text(`${rotulo}:`, margem + 2, y)
    const linhas = quebraTexto(doc, valor || '-', largura - 45)
    doc.text(linhas, margem + 42, y)
    y += 3.6 * linhas.length
  }
  y += 2

  // EQUIPAMENTO
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text('EQUIPAMENTO OBJETO DO COMODATO', margem, y)
  y += 4.5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  for (const campo of camposDoDispositivo(dispositivo)) {
    doc.text(`${campo.rotulo}:`, margem + 2, y)
    doc.text(campo.valor, margem + 42, y)
    y += 3.6
  }
  y += 2

  // CLÁUSULAS + ASSINATURAS
  const clausulas = ehDistrato
    ? `O COMODATÁRIO declara devolver o equipamento em perfeito estado de conservação, salvo desgaste natural do uso regular, ficando encerradas as obrigações do comodato firmado em ${dataBR(contrato.expand?.vinculo?.data_inicio)}.`
    : `O COMODATÁRIO declara-se ciente de que o equipamento é propriedade da ENVIMAT, comprometendo-se a devolvê-lo ao término de suas funções ou mediante solicitação, respondendo por perdas e danos em caso de extravio ou dano.`
  doc.setFontSize(7.5)
  const clausulasLinhas = quebraTexto(doc, clausulas, largura)
  clausulasLinhas.forEach((l) => {
    doc.text(l, margem, y)
    y += 3.4
  })
  y += 6

  doc.setFontSize(8)
  doc.text('São Carlos/SP, ' + dataBR(new Date().toISOString()), margem, y)
  y += 12

  doc.line(margem, y, margem + 70, y)
  doc.setFontSize(7.5)
  doc.text(colaborador.nome || 'COMODATÁRIO', margem + 35, y + 3.5, { align: 'center' })
  doc.text('COMODATÁRIO', margem + 35, y + 6.5, { align: 'center' })

  doc.line(105, y, 175, y)
  doc.text('ENVIMAT', 140, y + 3.5, { align: 'center' })
  doc.text('COMODANTE', 140, y + 6.5, { align: 'center' })

  if (contrato.observacoes) {
    y += 12
    doc.setFontSize(7)
    doc.text(`Obs.: ${contrato.observacoes}`, margem, y, { maxWidth: largura })
  }

  return y
}

export function gerarPDFContrato(
  contrato: Contrato,
  dispositivo: Dispositivo,
  colaborador: Colaborador,
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  // VIA 1
  const yFinal = renderVia(doc, contrato, dispositivo, colaborador, 16)
  // Linha de corte + VIA 2 (duas vias do mesmo documento no mesmo PDF)
  doc.setDrawColor(150)
  doc.setLineWidth(0.3)
  doc.setLineDashPattern([2, 2], 0)
  doc.line(10, yFinal + 12, 200, yFinal + 12)
  doc.setLineDashPattern([], 0)
  doc.setFontSize(7)
  doc.setTextColor(120)
  doc.text('1ª VIA — COMODANTE (ENVIMAT)', 105, yFinal + 15, { align: 'center' })
  doc.setTextColor(0)
  renderVia(doc, contrato, dispositivo, colaborador, yFinal + 20)
  doc.text('2ª VIA — COMODATÁRIO (COLABORADOR)', 105, yFinal + 17, { align: 'center' })

  const nome = colaborador.nome?.replace(/\s+/g, '_').toLowerCase() || 'colaborador'
  const tipo = contrato.tipo === 'distrato' ? 'distrato-comodato' : 'contrato-comodato'
  doc.save(`${tipo}_${nome}_${dispositivo.numero_serie || dispositivo.id.slice(0, 6)}.pdf`)
}
