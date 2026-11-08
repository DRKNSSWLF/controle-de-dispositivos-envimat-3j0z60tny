import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dispositivo, Colaborador } from '@/types/inventory'
import { ModalCadastrarDispositivo } from './ModalCadastrarDispositivo'
import {
  Smartphone,
  Laptop,
  Tablet,
  HelpCircle,
  Search,
  Filter,
  User,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { differenceInYears, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { dispositivosService } from '@/services/inventoryService'
import { toast } from '@/hooks/use-toast'

interface ListaDispositivosProps {
  dispositivos: Dispositivo[]
  colaboradores: Colaborador[]
  filtroTipo: string
  setFiltroTipo: (tipo: string) => void
  filtroColaborador: string
  setFiltroColaborador: (colab: string) => void
  filtroStatus: string
  setFiltroStatus: (status: string) => void
  onAtualizar: () => void
}

export function ListaDispositivos({
  dispositivos,
  colaboradores,
  filtroTipo,
  setFiltroTipo,
  filtroColaborador,
  setFiltroColaborador,
  filtroStatus,
  setFiltroStatus,
  onAtualizar,
}: ListaDispositivosProps) {
  const [busca, setBusca] = useState('')

  // Encontra o colaborador vinculado
  const getColaboradorNome = (d: Dispositivo) => {
    if (d.expand?.colaborador?.nome) return d.expand.colaborador.nome
    if (d.colaborador) {
      const c = colaboradores.find((item) => item.id === d.colaborador)
      return c ? c.nome : 'Colaborador não encontrado'
    }
    return null
  }

  const getColaboradorDepto = (d: Dispositivo) => {
    if (d.expand?.colaborador?.departamento) return d.expand.colaborador.departamento
    if (d.colaborador) {
      const c = colaboradores.find((item) => item.id === d.colaborador)
      return c?.departamento || ''
    }
    return ''
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'celular':
        return <Smartphone className="w-4 h-4 text-emerald-700" />
      case 'notebook':
        return <Laptop className="w-4 h-4 text-emerald-700" />
      case 'tablet':
        return <Tablet className="w-4 h-4 text-emerald-700" />
      default:
        return <HelpCircle className="w-4 h-4 text-emerald-700" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'em_uso':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 rounded-full font-medium">
            Em Uso
          </Badge>
        )
      case 'disponivel':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 rounded-full font-medium">
            Disponível
          </Badge>
        )
      case 'manutencao':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 rounded-full font-medium">
            Em Manutenção
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const calcularIdadeAnos = (dataString?: string) => {
    if (!dataString) return null
    const data = new Date(dataString)
    if (isNaN(data.getTime())) return null
    const anos = differenceInYears(new Date(), data)
    return anos
  }

  const handleDelete = async (id: string, modelo: string) => {
    if (confirm(`Excluir permanentemente o dispositivo "${modelo}"?`)) {
      try {
        await dispositivosService.excluir(id)
        toast({ title: 'Dispositivo excluído' })
        onAtualizar()
      } catch (e) {
        toast({
          title: 'Erro ao excluir',
          description: e instanceof Error ? e.message : 'Tente novamente',
          variant: 'destructive',
        })
      }
    }
  }

  // Filtragem completa: Busca textual + Filtro por Tipo + Filtro por Colaborador + Filtro por Status
  const dispositivosFiltrados = useMemo(() => {
    return dispositivos.filter((d) => {
      // Tipo
      if (filtroTipo !== 'todos' && d.tipo !== filtroTipo) {
        return false
      }

      // Colaborador
      if (filtroColaborador !== 'todos') {
        if (filtroColaborador === 'sem_colaborador') {
          if (d.colaborador && d.colaborador.trim() !== '') return false
        } else if (d.colaborador !== filtroColaborador) {
          return false
        }
      }

      // Status
      if (filtroStatus !== 'todos' && d.status !== filtroStatus) {
        return false
      }

      // Busca texto livre (modelo, fabricante, serial, imei, colaborador)
      if (busca.trim()) {
        const query = busca.toLowerCase()
        const colabNome = getColaboradorNome(d)?.toLowerCase() || ''
        const matchText =
          d.modelo.toLowerCase().includes(query) ||
          d.fabricante.toLowerCase().includes(query) ||
          d.numero_serie.toLowerCase().includes(query) ||
          (d.imei1 && d.imei1.toLowerCase().includes(query)) ||
          (d.imei2 && d.imei2.toLowerCase().includes(query)) ||
          colabNome.includes(query) ||
          (d.observacoes && d.observacoes.toLowerCase().includes(query))

        if (!matchText) return false
      }

      return true
    })
  }, [dispositivos, filtroTipo, filtroColaborador, filtroStatus, busca, colaboradores])

  const limparFiltros = () => {
    setFiltroTipo('todos')
    setFiltroColaborador('todos')
    setFiltroStatus('todos')
    setBusca('')
  }

  const temFiltroAtivo =
    filtroTipo !== 'todos' ||
    filtroColaborador !== 'todos' ||
    filtroStatus !== 'todos' ||
    busca.trim() !== ''

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Busca */}
      <Card className="border-emerald-100 bg-white shadow-sm rounded-2xl">
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-700/60" />
              <Input
                placeholder="Buscar por modelo, série, fabricante, IMEI ou colaborador..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 rounded-xl border-emerald-200 focus:ring-emerald-600 bg-emerald-50/20 text-sm"
              />
            </div>
            <ModalCadastrarDispositivo
              colaboradores={colaboradores}
              onDispositivoSalvo={onAtualizar}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
            {/* Filtro 1: Tipo de Dispositivo */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                <Filter className="w-3 h-3 text-emerald-600" />
                Tipo de Dispositivo
              </span>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="rounded-xl border-emerald-200 bg-white text-xs h-9">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="celular">Celulares / Smartphones</SelectItem>
                  <SelectItem value="notebook">Notebooks</SelectItem>
                  <SelectItem value="tablet">Tablets / Rugged</SelectItem>
                  <SelectItem value="outro">Coletores / Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro 2: Colaborador */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                <User className="w-3 h-3 text-emerald-600" />
                Colaborador Responsável
              </span>
              <Select value={filtroColaborador} onValueChange={setFiltroColaborador}>
                <SelectTrigger className="rounded-xl border-emerald-200 bg-white text-xs h-9">
                  <SelectValue placeholder="Todos os colaboradores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os colaboradores</SelectItem>
                  <SelectItem value="sem_colaborador">Sem colaborador atribuído</SelectItem>
                  {colaboradores.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} {c.departamento ? `(${c.departamento})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro 3: Status */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                Status Operacional
              </span>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="rounded-xl border-emerald-200 bg-white text-xs h-9">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="em_uso">Em Uso</SelectItem>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="manutencao">Em Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botão limpar filtros */}
            <div className="flex items-end">
              {temFiltroAtivo ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={limparFiltros}
                  className="w-full text-xs text-emerald-800 hover:bg-emerald-50 rounded-xl h-9 border border-emerald-200/60"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Limpar Filtros
                </Button>
              ) : (
                <div className="hidden lg:flex items-center text-xs text-emerald-700/80 px-2 h-9">
                  Exibindo {dispositivosFiltrados.length} de {dispositivos.length}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listagem de Dispositivos com todos os campos exigidos:
          Tipo, Fabricante, Modelo, Número de Série, IMEI1, IMEI2, Colaborador, Status, Idade */}
      <div className="space-y-3">
        {dispositivosFiltrados.length === 0 ? (
          <div className="bg-white rounded-3xl border border-emerald-100 p-12 text-center">
            <Smartphone className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-base font-semibold text-emerald-950">
              Nenhum dispositivo encontrado
            </h4>
            <p className="text-xs text-emerald-700 mt-1 max-w-sm mx-auto">
              Nenhum item corresponde aos filtros selecionados. Tente ajustar os parâmetros ou
              cadastrar um novo dispositivo.
            </p>
            {temFiltroAtivo && (
              <Button
                variant="outline"
                size="sm"
                onClick={limparFiltros}
                className="mt-4 border-emerald-200 text-emerald-800 rounded-xl"
              >
                Limpar todos os filtros
              </Button>
            )}
          </div>
        ) : (
          dispositivosFiltrados.map((d) => {
            const colabNome = getColaboradorNome(d)
            const colabDepto = getColaboradorDepto(d)
            const idade = calcularIdadeAnos(d.data_aquisicao)
            const isIdadeAvancada = idade !== null && idade >= 3

            return (
              <Card
                key={d.id}
                className="bg-white rounded-2xl border border-emerald-100/90 hover:border-emerald-300 transition-all shadow-sm"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Identificação principal: Tipo, Fabricante, Modelo, Série */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center shrink-0 mt-0.5">
                        {getTipoIcon(d.tipo)}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                            {d.fabricante}
                          </span>
                          <h4 className="font-semibold text-base text-emerald-950 truncate">
                            {d.modelo}
                          </h4>
                          {getStatusBadge(d.status)}
                          {d.is_demo && (
                            <span className="inline-flex items-center text-[10px] bg-emerald-100/60 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Exemplo
                            </span>
                          )}
                        </div>

                        {/* Detalhes técnicos obrigatórios: Série, IMEIs */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-900/80 pt-0.5">
                          <div>
                            <span className="text-emerald-700/80 font-medium">S/N: </span>
                            <code className="font-mono bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-950 font-semibold">
                              {d.numero_serie}
                            </code>
                          </div>

                          {d.imei1 ? (
                            <div>
                              <span className="text-emerald-700/80 font-medium">IMEI 1: </span>
                              <code className="font-mono bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-900">
                                {d.imei1}
                              </code>
                            </div>
                          ) : null}

                          {d.imei2 ? (
                            <div>
                              <span className="text-emerald-700/80 font-medium">IMEI 2: </span>
                              <code className="font-mono bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-900">
                                {d.imei2}
                              </code>
                            </div>
                          ) : null}
                        </div>

                        {/* Observações */}
                        {d.observacoes && (
                          <p className="text-xs text-emerald-800/70 italic line-clamp-1 pt-0.5">
                            "{d.observacoes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Colaborador responsável e Idade do aparelho */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-emerald-100">
                      {/* Responsável */}
                      <div className="min-w-[170px]">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 block mb-0.5">
                          Colaborador / Comodato
                        </span>
                        {colabNome ? (
                          <div>
                            <p className="text-xs font-semibold text-emerald-950 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-emerald-700" />
                              {colabNome}
                            </p>
                            {colabDepto && (
                              <p className="text-[11px] text-emerald-700/80 pl-5">{colabDepto}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-amber-700 italic flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Sem colaborador vinculado
                          </p>
                        )}
                      </div>

                      {/* Idade da Aquisição */}
                      <div className="min-w-[130px]">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 block mb-0.5">
                          Idade do Aparelho
                        </span>
                        {d.data_aquisicao ? (
                          <div>
                            <p className="text-xs font-medium text-emerald-950 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                              {idade !== null ? `${idade} ano${idade > 1 ? 's' : ''}` : 'Recente'}
                              {isIdadeAvancada && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.2 rounded ml-1">
                                  Renovar
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-emerald-700/70 pl-4.5">
                              Comprado em{' '}
                              {format(new Date(d.data_aquisicao), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-600/70">Não informada</span>
                        )}
                      </div>

                      {/* Ações */}
                      <div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(d.id, `${d.fabricante} ${d.modelo}`)}
                          className="h-8 w-8 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg"
                          title="Excluir dispositivo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
