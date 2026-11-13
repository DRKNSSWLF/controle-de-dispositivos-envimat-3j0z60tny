// Teste isolado (não faz parte do app): gera um PDF de comodato de celular com
// 2 IMEIs usando a MESMA rotina src/lib/contratoPDF.ts, para validar texto real,
// logo e campos pré-preenchidos. Roda com: npx tsx scripts/teste-pdf-comodato.ts

import { gerarPDFContrato } from '../src/lib/contratoPDF'
import type { Contrato, Dispositivo, Colaborador } from '../src/types/inventory'
import { writeFileSync } from 'fs'

const colaborador: Colaborador = {
  id: 'x1',
  nome: 'Alessandro Siquara Amaral',
  nacionalidade: 'brasileiro',
  estado_civil: 'casado',
  documento_identidade: '24.952.844-7',
  emissor_documento: 'SSP-SP',
  cpf: '170.515.388-70',
  endereco: 'Rua João Antônio de Oliveira, 1228, apto. 12-C',
  cidade: 'São Paulo',
  estado: 'São Paulo',
  uf: 'SP',
}

const dispositivo: Dispositivo = {
  id: 'd1',
  tipo: 'celular',
  fabricante: 'Samsung',
  modelo: 'Galaxy A54 5G',
  numero_serie: 'RZ8T30ABCD',
  imei1: '351122334455661',
  imei2: '351122334455679',
  status: 'em_uso',
  ram: '8 GB',
  armazenamento_interno: '256 GB',
}

const contrato: Contrato = {
  id: 'c1',
  tipo: 'comodato',
  dispositivo: 'd1',
  colaborador: 'x1',
  numero_vias: 2,
  observacoes: 'Contrato de teste',
}

// jsPDF "doc.save" funciona em Node? Ele usa blob/save — em Node pode não salvar
// em disco. Interceptamos save e escrevemos o buffer manualmente.
;(async () => {
  // monkey-patch: troca doc.save por escrita em disco durante o teste
  const modulo = await import('jspdf')
  const jsPDF = modulo.jsPDF
  const proto = jsPDF.AcroForm as never // noop, apenas garantir import
  void proto
  const originalSave = (jsPDF.prototype as unknown as { save: (n: string) => void }).save
  ;(jsPDF.prototype as unknown as { save: (n: string) => void }).save = function (nome: string) {
    const saida = (this as unknown as { output: (t: string) => ArrayBuffer }).output('arraybuffer')
    writeFileSync(`/tmp/${nome}`, Buffer.from(saida))
    console.log('PDF gerado em /tmp/' + nome)
  }
  await gerarPDFContrato(contrato, dispositivo, colaborador)
  void originalSave
})()
