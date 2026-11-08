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
import { parseCSVContent, inferMapping, ParsedSheet } from '@/lib/sheetParser'
import { dispositivosService } from '@/services/inventoryService'
import {
  Colaborador,
  NovoDispositivoInput,
  TipoDispositivo,
  StatusDispositivo,
} from '@/types/inventory'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Download,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ImportarDispositivosProps {
  colaboradores: Colaborador[]
  onImportadoSucesso: () => void
}

const TARGET_FIELDS = [
  {
    key: 'tipo',
    label: 'Tipo de Dispositivo *',
    aliases: ['tipo', 'categoria', 'equipamento', 'item', 'device_type'],
  },
  {
    key: 'fabricante',
    label: 'Fabricante / Marca *',
    aliases: ['fabricante', 'marca', 'brand', 'maker', 'montadora'],
  },
  { key: 'modelo', label: 'Modelo *', aliases: ['modelo', 'model', 'nome_modelo', 'descricao'] },
  {
    key: 'numero_serie',
    label: 'Número de Série (S/N) *',
    aliases: ['numero_serie', 'serial', 'sn', 'n_serie', 'serie', 'serialnumber'],
  },
  { key: 'imei1', label: 'IMEI 1', aliases: ['imei1', 'imei', 'imei_1', 'primeiro_imei'] },
  { key: 'imei2', label: 'IMEI 2', aliases: ['imei2', 'imei_2', 'segundo_imei'] },
  {
    key: 'colaborador',
    label: 'Colaborador Responsável',
    aliases: [
      'colaborador',
      'responsavel',
      'usuario',
      'nome_colaborador',
      'funcionario',
      'atribuido_a',
    ],
  },
  {
    key: 'status',
    label: 'Status (em_uso, disponivel, manutencao)',
    aliases: ['status', 'situacao', 'estado'],
  },
  {
    key: 'data_aquisicao',
    label: 'Data de Aquisição',
    aliases: ['data_aquisicao', 'aquisicao', 'compra', 'data_compra', 'dt_aquisicao'],
  },
  {
    key: 'observacoes',
    label: 'Observações',
    aliases: ['observacoes', 'obs', 'notas', 'detalhes'],
  },
]

export function ImportarDispositivos({
  colaboradores,
  onImportadoSucesso,
}: ImportarDispositivosProps) {
  const [parsed, setParsed] = useState<ParsedSheet | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [importando, setImportando] = useState(false)
  const [progresso, setProgresso] = useState<{ total: number; concluidos: number } | null>(null)
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
      const suggested = inferMapping(result.headers, TARGET_FIELDS)
      setMapping(suggested)
      toast({
        title: 'Planilha carregada!',
        description: `${result.totalLinhas} linhas identificadas. Revise as colunas mapeadas abaixo.`,
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

    // Se for CSV ou texto
    if (
      file.name.endsWith('.csv') ||
      file.name.endsWith('.txt') ||
      file.type.includes('csv') ||
      file.type.includes('text')
    ) {
      const text = await file.text()
      processText(text, file.name)
    } else {
      // Para outros arquivos de planilha (ex: .xlsx/.xls salvos como csv ou lidos via FileReader)
      const text = await file.text()
      processText(text, file.name)
    }
  }

  const handleBaixarExemplo = () => {
    const csvContent =
      'tipo,fabricante,modelo,numero_serie,imei1,imei2,colaborador,status,data_aquisicao,observacoes\n' +
      'celular,Samsung,Galaxy A55 5G,R58N4099XYZ,354928114999901,354928114999902,Carlos Eduardo Silva,em_uso,2023-05-15,Uso operacional no pátio\n' +
      'notebook,Lenovo,ThinkPad L14,PF4A992X,,,Mariana Alencar Ribeiro,em_uso,2022-09-10,Notebook Engenharia\n' +
      'tablet,Apple,iPad 10ª Geração,DMPG7731XYZ,354019284999111,,,disponivel,2024-02-01,Reserva técnica sede São Carlos\n' +
      'celular,Motorola,Moto G54 5G,ZY22HG9P99,356789012999777,356789012999778,,manutencao,2021-06-20,Aguardando troca de tela'

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'modelo_importacao_dispositivos_envimat.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExecutarImportacao = async () => {
    if (!parsed) return

    // Validação mínima: modelo e numero_serie precisam estar mapeados ou o tipo
    if (!mapping.modelo && !mapping.numero_serie) {
      toast({
        title: 'Mapeamento incompleto',
        description: 'Mapeie pelo menos as colunas de "Modelo" e "Número de Série".',
        variant: 'destructive',
      })
      return
    }

    setImportando(true)
    setProgresso({ total: parsed.rows.length, concluidos: 0 })

    const itensParaSalvar: NovoDispositivoInput[] = []

    // Map auxiliar de colaboradores por nome em minúsculas
    const colabPorNome = new Map<string, string>()
    colaboradores.forEach((c) => {
      colabPorNome.set(c.nome.trim().toLowerCase(), c.id)
    })

    for (const row of parsed.rows) {
      const rawTipo = (mapping.tipo ? row[mapping.tipo] : '').toLowerCase()
      let tipo: TipoDispositivo = 'outro'
      if (rawTipo.includes('cel') || rawTipo.includes('smart') || rawTipo.includes('phone'))
        tipo = 'celular'
      else if (
        rawTipo.includes('note') ||
        rawTipo.includes('laptop') ||
        rawTipo.includes('computador')
      )
        tipo = 'notebook'
      else if (rawTipo.includes('tab') || rawTipo.includes('ipad')) tipo = 'tablet'

      const fabricante = (mapping.fabricante ? row[mapping.fabricante] : '') || 'Não informado'
      const modelo = (mapping.modelo ? row[mapping.modelo] : '') || 'Dispositivo Importado'
      const numero_serie =
        (mapping.numero_serie ? row[mapping.numero_serie] : '') ||
        `S/N-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      const imei1 = mapping.imei1 ? row[mapping.imei1] : ''
      const imei2 = mapping.imei2 ? row[mapping.imei2] : ''

      // Tenta achar ID de colaborador pelo nome
      const rawColab = mapping.colaborador ? row[mapping.colaborador] : ''
      let colaboradorId = ''
      if (rawColab) {
        const foundId = colabPorNome.get(rawColab.trim().toLowerCase())
        if (foundId) {
          colaboradorId = foundId
        } else {
          // Busca parcial se não for id exato
          for (const [nome, id] of colabPorNome.entries()) {
            if (
              nome.includes(rawColab.trim().toLowerCase()) ||
              rawColab.trim().toLowerCase().includes(nome)
            ) {
              colaboradorId = id
              break
            }
          }
        }
      }

      // Status
      const rawStatus = (mapping.status ? row[mapping.status] : '').toLowerCase()
      let status: StatusDispositivo = 'disponivel'
      if (rawStatus.includes('uso') || colaboradorId) status = 'em_uso'
      else if (
        rawStatus.includes('manut') ||
        rawStatus.includes('conserto') ||
        rawStatus.includes('oficina')
      )
        status = 'manutencao'
      else if (
        rawStatus.includes('backup') ||
        rawStatus.includes('reserva') ||
        rawStatus.includes('estoque') ||
        rawStatus.includes('disponivel')
      )
        status = 'disponivel'

      const dataAquisicao = mapping.data_aquisicao ? row[mapping.data_aquisicao] : ''
      const observacoes = mapping.observacoes
        ? row[mapping.observacoes]
        : `Importado via planilha ${fileName}`

      itensParaSalvar.push({
        tipo,
        fabricante,
        modelo,
        numero_serie,
        imei1,
        imei2,
        colaborador: colaboradorId,
        status,
        data_aquisicao: dataAquisicao || undefined,
        observacoes,
      })
    }

    try {
      const res = await dispositivosService.criarEmLote(itensParaSalvar)
      setImportando(false)
      setProgresso(null)

      if (res.criados > 0) {
        toast({
          title: 'Importação concluída com sucesso!',
          description: `${res.criados} dispositivos foram cadastrados e persistidos no banco de dados.`,
        })
        setParsed(null)
        setFileName('')
        onImportadoSucesso()
      } else {
        toast({
          title: 'Falha ao importar',
          description: res.erros[0] || 'Nenhum registro pôde ser salvo.',
          variant: 'destructive',
        })
      }
    } catch (e) {
      setImportando(false)
      setProgresso(null)
      toast({
        title: 'Erro inesperado na importação',
        description: e instanceof Error ? e.message : 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-emerald-100 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="font-serif italic text-2xl text-emerald-950 font-normal">
                Importação de Planilha de Dispositivos
              </CardTitle>
              <CardDescription className="text-emerald-800/70">
                Conecte a planilha existente de celulares, notebooks e tablets para migrar o
                inventário em lote para o PocketBase.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBaixarExemplo}
              className="border-emerald-200 text-emerald-800 hover:bg-emerald-50 rounded-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar Modelo CSV Exemplo
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
                accept=".csv, .txt, .xlsx, .xls"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <p className="text-base font-semibold text-emerald-950 mb-1">
                Clique para selecionar a planilha de dispositivos
              </p>
              <p className="text-sm text-emerald-700/80 mb-3">
                Formatos suportados: CSV, TSV e arquivos de texto exportados do Excel
              </p>
              <div className="inline-flex items-center text-xs bg-emerald-100/60 text-emerald-900 px-3 py-1.5 rounded-full font-medium">
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Mapeamento inteligente de colunas (S/N, Marca, Modelo, IMEI, etc.)
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
                      {parsed.totalLinhas} linhas detectadas • {parsed.headers.length} colunas
                      encontradas
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

              {/* Mapeamento de colunas */}
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-emerald-900 mb-3 flex items-center gap-2">
                  <span>Mapeamento dos Campos da ENVIMAT</span>
                  <span className="text-xs font-normal normal-case text-emerald-700">
                    (Confirme qual coluna da sua planilha corresponde a cada campo)
                  </span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
                  {TARGET_FIELDS.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label className="text-xs font-semibold text-emerald-950 flex items-center justify-between">
                        <span>{field.label}</span>
                        {mapping[field.key] && (
                          <span className="text-[11px] font-normal text-emerald-600">
                            Detectado
                          </span>
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
                          <SelectValue placeholder="Ignorar campo / Não importar" />
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
              </div>

              {/* Prévia dos primeiros dados */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-2">
                  Prévia da Importação (Primeiras 3 Linhas)
                </h4>
                <div className="overflow-x-auto border border-emerald-100 rounded-xl bg-white shadow-sm">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-emerald-50/60 text-emerald-900 font-semibold border-b border-emerald-100">
                      <tr>
                        <th className="p-2.5">Linha</th>
                        <th className="p-2.5">Tipo</th>
                        <th className="p-2.5">Fabricante</th>
                        <th className="p-2.5">Modelo</th>
                        <th className="p-2.5">Nº de Série</th>
                        <th className="p-2.5">IMEI1</th>
                        <th className="p-2.5">Colaborador Planilha</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50 text-emerald-950">
                      {parsed.rows.slice(0, 3).map((row, idx) => (
                        <tr key={idx} className="hover:bg-emerald-50/30">
                          <td className="p-2.5 font-mono text-emerald-700">#{idx + 1}</td>
                          <td className="p-2.5">{mapping.tipo ? row[mapping.tipo] || '—' : '—'}</td>
                          <td className="p-2.5 font-medium">
                            {mapping.fabricante ? row[mapping.fabricante] || '—' : '—'}
                          </td>
                          <td className="p-2.5">
                            {mapping.modelo ? row[mapping.modelo] || '—' : '—'}
                          </td>
                          <td className="p-2.5 font-mono">
                            {mapping.numero_serie ? row[mapping.numero_serie] || '—' : '—'}
                          </td>
                          <td className="p-2.5 font-mono text-xs">
                            {mapping.imei1 ? row[mapping.imei1] || '—' : '—'}
                          </td>
                          <td className="p-2.5">
                            {mapping.colaborador ? row[mapping.colaborador] || '—' : '—'}
                          </td>
                          <td className="p-2.5">
                            {mapping.status ? row[mapping.status] || '—' : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Botão de ação */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-emerald-700/80 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-emerald-600" />
                  Os registros serão salvos no banco de dados e ficarão visíveis na listagem de
                  inventário.
                </p>
                <Button
                  onClick={handleExecutarImportacao}
                  disabled={importando}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow px-6"
                >
                  {importando ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Importando {progresso?.total} dispositivos...
                    </>
                  ) : (
                    <>
                      Confirmar e Importar {parsed.totalLinhas} Dispositivos
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
