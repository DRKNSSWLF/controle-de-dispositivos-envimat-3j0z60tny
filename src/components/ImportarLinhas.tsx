import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { parseCSVContent, inferMapping, type ParsedSheet } from '@/lib/sheetParser'
import { linhasService, vinculosLinhasService } from '@/services/linhasService'
import { type NovaLinhaInput, type StatusLinha, type TipoLinha } from '@/types/inventory'
import { somenteDigitos } from '@/lib/validacoes'
import { Upload, PhoneCall, CheckCircle2, ArrowRight, RefreshCw, Download } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ImportarLinhasProps {
  onImportadoSucesso: () => void
}

const TARGET_FIELDS = [
  {
    key: 'numero',
    label: 'Número da Linha *',
    aliases: ['numero', 'número', 'telefone', 'celular', 'msisdn', 'linha', 'fone', 'phone'],
  },
  {
    key: 'operadora',
    label: 'Operadora',
    aliases: ['operadora', 'carrier', 'vivo', 'claro', 'tim', 'oi', 'empresa_telefonica'],
  },
  { key: 'plano', label: 'Plano', aliases: ['plano', 'plan', 'plano_dados', 'franquia'] },
  {
    key: 'tipo',
    label: 'Tipo (celular / modem)',
    aliases: ['tipo', 'type', 'categoria', 'equipamento', 'modalidade'],
  },
  { key: 'imei', label: 'IMEI', aliases: ['imei', 'serial', 'nserie', 'n_serie'] },
  {
    key: 'colaborador',
    label: 'Colaborador Responsável (opcional)',
    aliases: ['colaborador', 'responsavel', 'usuario', 'funcionario', 'titular', 'nome'],
  },
  { key: 'status', label: 'Status', aliases: ['status', 'situacao', 'estado_linha'] },
  { key: 'observacoes', label: 'Observações', aliases: ['observacoes', 'obs', 'notas'] },
]

const STATUS_VALIDOS: StatusLinha[] = ['disponivel', 'em_uso', 'cancelada']

/** Normaliza o status da planilha para um status válido da coleção. */
function normalizarStatus(valor: string): StatusLinha {
  const v = valor
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
  if (v.includes('uso')) return 'em_uso'
  if (v.includes('canc')) return 'cancelada'
  if (v.includes('disp') || v.includes('livre') || v === '') return 'disponivel'
  return (STATUS_VALIDOS.find((s) => s === v) || 'disponivel') as StatusLinha
}

/** Normaliza o tipo da planilha (celular / modem). */
function normalizarTipo(valor: string): TipoLinha {
  const v = valor
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  return v.includes('modem') || v.includes('roteador') || v.includes('router') ? 'modem' : 'celular'
}

/** Tela de importação de LINHAS TELEFÔNICAS (mesmo padrão de dispositivos/colaboradores). */
export function ImportarLinhas({ onImportadoSucesso }: ImportarLinhasProps) {
  const [parsed, setParsed] = useState<ParsedSheet | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [importando, setImportando] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const processText = (content: string, name: string) => {
    try {
      const result = parseCSVContent(content)
      if (result.headers.length === 0 || result.rows.length === 0) {
        toast({
          title: 'Arquivo sem dados válidos',
          description: 'A planilha ou CSV não contém linhas com dados identificáveis.',
          variant: 'destructive',
        })
        return
      }
      setParsed(result)
      setFileName(name)
      setMapping(inferMapping(result.headers, TARGET_FIELDS))
      toast({
        title: 'Planilha de linhas carregada!',
        description: `${result.totalLinhas} linhas telefônicas identificadas. Revise o mapeamento.`,
      })
    } catch {
      toast({
        title: 'Erro ao ler arquivo',
        description: 'Verifique se o arquivo está no formato CSV ou texto delimitado.',
        variant: 'destructive',
      })
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    processText(text, file.name)
  }

  const handleBaixarExemplo = () => {
    const csvContent =
      'numero,operadora,plano,tipo,imei,status,colaborador,observacoes\n' +
      '(16) 99123-4501,Vivo,Controle corporativo 10GB,celular,356938035643809,em_uso,Marcos Vinicius Santos,Linha atribuída a operador de campo\n' +
      '(16) 99123-4502,Claro,Corporate 5GB,celular,356938035643810,disponivel,,Linha reserva do estoque\n' +
      '(16) 99123-4503,Tim,Modem industrial 20GB,modem,861234051234567,em_uso,Beatriz Vasconcelos,Modem de rastreamento do caminhão\n' +
      '(16) 99123-4504,Vivo,Controle corporativo 10GB,celular,,cancelada,,Cancelada por perda — aguardando reposição'
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'modelo_importacao_linhas_telefonicas_envimat.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExecutarImportacao = async () => {
    if (!parsed) return

    if (!mapping.numero) {
      toast({
        title: 'Mapeamento obrigatório',
        description: 'Selecione qual coluna contém o Número da Linha.',
        variant: 'destructive',
      })
      return
    }

    setImportando(true)
    const itensParaSalvar: (NovaLinhaInput & { colaboradorNomeImportacao?: string })[] = []

    for (const row of parsed.rows) {
      const numero = mapping.numero ? row[mapping.numero] : ''
      if (!numero || !numero.trim()) continue

      const statusPlanilha = mapping.status ? row[mapping.status] : ''
      const status = normalizarStatus(statusPlanilha)
      const nomeColaborador = mapping.colaborador ? row[mapping.colaborador]?.trim() : ''

      const item: NovaLinhaInput & { colaboradorNomeImportacao?: string } = {
        numero: somenteDigitos(numero),
        operadora: mapping.operadora ? row[mapping.operadora] : '',
        plano: mapping.plano ? row[mapping.plano] : '',
        tipo: normalizarTipo(mapping.tipo ? row[mapping.tipo] : ''),
        imei: mapping.imei ? somenteDigitos(row[mapping.imei] || '') : '',
        status,
        observacoes: mapping.observacoes
          ? row[mapping.observacoes]
          : `Importado da planilha ${fileName}`,
      }
      if (nomeColaborador) {
        item.colaboradorNomeImportacao = nomeColaborador
      }
      itensParaSalvar.push(item)
    }

    try {
      let criadas = 0
      const erros: string[] = []

      for (const item of itensParaSalvar) {
        try {
          // colaboradorNomeImportacao não é campo da coleção — resolvido aqui.
          const { colaboradorNomeImportacao, ...dados } = item as NovaLinhaInput & {
            colaboradorNomeImportacao?: string
          }

          const colaboradorId = colaboradorNomeImportacao
            ? await resolverColaborador(colaboradorNomeImportacao)
            : undefined

          const criada = await linhasService.criar({ ...dados, colaborador: colaboradorId })

          if (colaboradorId && dados.status === 'em_uso') {
            await vinculosLinhasService.vincular({
              colaborador: colaboradorId,
              linha: criada.id,
              observacoes: 'Vínculo criado automaticamente na importação de planilha.',
            })
          }
          criadas++
        } catch (e) {
          erros.push(
            e instanceof Error ? e.message : 'Falha desconhecida ao salvar uma das linhas.',
          )
        }
      }

      setImportando(false)

      if (criadas > 0) {
        toast({
          title: 'Linhas telefônicas importadas com sucesso!',
          description: `${criadas} linha(s) foram salvas no banco de dados.`,
        })
        setParsed(null)
        setFileName('')
        onImportadoSucesso()
      } else {
        toast({
          title: 'Erro na importação',
          description: erros[0] || 'Nenhum registro pôde ser salvo.',
          variant: 'destructive',
        })
      }
    } catch (e) {
      setImportando(false)
      toast({
        title: 'Erro inesperado',
        description: e instanceof Error ? e.message : 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card className="border-emerald-100 bg-white shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="font-serif italic text-2xl text-emerald-950 font-normal">
              Importação de Planilha de Linhas Telefônicas
            </CardTitle>
            <CardDescription className="text-emerald-800/70">
              Importe as linhas corporativas (celulares e modems) com operadora, plano, IMEI e
              status. Se a planilha informar o colaborador e o status “em uso”, o vínculo é criado
              automaticamente.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBaixarExemplo}
            className="border-emerald-200 text-emerald-800 hover:bg-emerald-50 rounded-xl"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar Modelo CSV Linhas
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!parsed ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-emerald-200 rounded-2xl p-8 text-center hover:border-emerald-400 hover:bg-emerald-50/50 transition-all cursor-pointer bg-emerald-50/20"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, .txt"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
              <PhoneCall className="w-7 h-7" />
            </div>
            <p className="text-base font-semibold text-emerald-950 mb-1">
              Clique para selecionar a planilha de linhas telefônicas
            </p>
            <p className="text-sm text-emerald-700/80 mb-3">
              Formatos suportados: CSV, TSV e relatórios tabulares das operadoras
            </p>
            <div className="inline-flex items-center text-xs bg-emerald-100/60 text-emerald-900 px-3 py-1.5 rounded-full font-medium">
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Mapeamento automático de Número, Operadora, Plano, IMEI, Status
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200/60 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-emerald-950">{fileName}</h4>
                  <p className="text-xs text-emerald-700">
                    {parsed.totalLinhas} linhas identificadas • {parsed.headers.length} colunas
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setParsed(null)
                  setFileName('')
                }}
                className="text-emerald-800 hover:bg-emerald-100/60 rounded-xl"
              >
                Trocar arquivo
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
              {TARGET_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs font-semibold text-emerald-950 flex items-center justify-between">
                    <span>{field.label}</span>
                    {mapping[field.key] && (
                      <span className="text-[11px] font-normal text-emerald-600">Detectado</span>
                    )}
                  </Label>
                  <Select
                    value={mapping[field.key] || 'nenhum'}
                    onValueChange={(val) =>
                      setMapping((prev) => ({
                        ...prev,
                        [field.key]: val === 'nenhum' ? '' : val,
                      }))
                    }
                  >
                    <SelectTrigger className="bg-white border-emerald-200 focus:ring-emerald-600 rounded-xl text-sm">
                      <SelectValue placeholder="Ignorar campo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhum">— Não importar / Ignorar —</SelectItem>
                      {parsed.headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          Coluna: {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-emerald-700">
                As linhas importadas aparecem na aba “Linhas Telefônicas” para vínculo ou gestão.
              </span>
              <Button
                onClick={handleExecutarImportacao}
                disabled={importando}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow px-6"
              >
                {importando ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    Confirmar e Importar {parsed.totalLinhas} Linhas
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** Resolve o id do colaborador pelo nome exato (case-insensitive). */
async function resolverColaborador(nome: string): Promise<string | undefined> {
  const { colaboradoresService } = await import('@/services/inventoryService')
  const colaboradores = await colaboradoresService.listar()
  const alvo = nome.toLowerCase().trim()
  const encontrado = colaboradores.find(
    (c) => c.nome.toLowerCase().trim() === alvo || c.nome.toLowerCase().includes(alvo),
  )
  return encontrado?.id
}
