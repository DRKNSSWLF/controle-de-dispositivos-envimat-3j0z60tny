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
import { colaboradoresService } from '@/services/inventoryService'
import { NovoColaboradorInput } from '@/types/inventory'
import { Upload, Users, CheckCircle2, ArrowRight, RefreshCw, Download } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ImportarColaboradoresProps {
  onImportadoSucesso: () => void
}

const TARGET_FIELDS = [
  {
    key: 'nome',
    label: 'Nome do Colaborador *',
    aliases: ['nome', 'colaborador', 'funcionario', 'name', 'full_name'],
  },
  {
    key: 'departamento',
    label: 'Departamento / Setor',
    aliases: ['departamento', 'setor', 'area', 'department'],
  },
  {
    key: 'cargo',
    label: 'Cargo / Função',
    aliases: ['cargo', 'funcao', 'posicao', 'role', 'title'],
  },
  { key: 'email', label: 'E-mail Corporativo', aliases: ['email', 'e-mail', 'mail', 'correio'] },
  {
    key: 'telefone',
    label: 'Telefone / Celular',
    aliases: ['telefone', 'celular', 'fone', 'phone', 'whatsapp'],
  },
  {
    key: 'matricula',
    label: 'Matrícula / ID',
    aliases: ['matricula', 'id', 'registro', 'codigo', 'cracha'],
  },
  { key: 'cpf', label: 'CPF', aliases: ['cpf', 'documento'] },
  { key: 'observacoes', label: 'Observações', aliases: ['observacoes', 'obs', 'notas'] },
]

export function ImportarColaboradores({ onImportadoSucesso }: ImportarColaboradoresProps) {
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
      const suggested = inferMapping(result.headers, TARGET_FIELDS)
      setMapping(suggested)
      toast({
        title: 'Planilha de colaboradores carregada!',
        description: `${result.totalLinhas} colaboradores identificados. Revise o mapeamento.`,
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
      'nome,departamento,cargo,email,telefone,matricula,observacoes\n' +
      'Ana Paula Souza,Recursos Humanos,Analista de RH,ana.souza@envimat.com.br,(16) 99881-1122,ENV-0155,Responsável por termos de comodato\n' +
      'Marcos Vinicius Santos,Operações Florestais,Operador de Triturador,marcos.santos@envimat.com.br,(16) 99773-4455,ENV-0160,Atua em campo na região de São Carlos\n' +
      'Beatriz Vasconcelos,Engenharia Ambiental,Supervisora de Triagem,beatriz.v@envimat.com.br,(16) 99661-8899,ENV-0172,Responsável por projetos de compostagem'

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'modelo_importacao_colaboradores_envimat.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExecutarImportacao = async () => {
    if (!parsed) return

    if (!mapping.nome) {
      toast({
        title: 'Mapeamento obrigatório',
        description: 'Selecione qual coluna contém o Nome do Colaborador.',
        variant: 'destructive',
      })
      return
    }

    setImportando(true)
    const itensParaSalvar: NovoColaboradorInput[] = []

    for (const row of parsed.rows) {
      const nome = mapping.nome ? row[mapping.nome] : ''
      if (!nome || !nome.trim()) continue

      itensParaSalvar.push({
        nome: nome.trim(),
        departamento: mapping.departamento ? row[mapping.departamento] : '',
        cargo: mapping.cargo ? row[mapping.cargo] : '',
        email: mapping.email ? row[mapping.email] : '',
        telefone: mapping.telefone ? row[mapping.telefone] : '',
        matricula: mapping.matricula ? row[mapping.matricula] : '',
        cpf: mapping.cpf ? row[mapping.cpf] : '',
        observacoes: mapping.observacoes
          ? row[mapping.observacoes]
          : `Importado da planilha ${fileName}`,
      })
    }

    try {
      const res = await colaboradoresService.criarEmLote(itensParaSalvar)
      setImportando(false)

      if (res.criados > 0) {
        toast({
          title: 'Colaboradores importados com sucesso!',
          description: `${res.criados} colaboradores foram salvos no banco de dados.`,
        })
        setParsed(null)
        setFileName('')
        onImportadoSucesso()
      } else {
        toast({
          title: 'Erro na importação',
          description: res.erros[0] || 'Nenhum registro pôde ser salvo.',
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
              Importação de Planilha de Colaboradores
            </CardTitle>
            <CardDescription className="text-emerald-800/70">
              Cadastre a lista de funcionários em lote para atribuir os aparelhos com termos de
              comodato e devolução.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBaixarExemplo}
            className="border-emerald-200 text-emerald-800 hover:bg-emerald-50 rounded-xl"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar Modelo CSV Colaboradores
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
              <Users className="w-7 h-7" />
            </div>
            <p className="text-base font-semibold text-emerald-950 mb-1">
              Clique para selecionar a planilha de colaboradores
            </p>
            <p className="text-sm text-emerald-700/80 mb-3">
              Formatos suportados: CSV, TSV e relatórios tabulares de RH
            </p>
            <div className="inline-flex items-center text-xs bg-emerald-100/60 text-emerald-900 px-3 py-1.5 rounded-full font-medium">
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Mapeamento automático de Nome, Setor, E-mail, Matrícula
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
                Os colaboradores importados estarão prontos para vínculo aos dispositivos.
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
                    Confirmar e Importar {parsed.totalLinhas} Colaboradores
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
