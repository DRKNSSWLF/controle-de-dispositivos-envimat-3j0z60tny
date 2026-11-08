import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Colaborador, Dispositivo, Vinculo } from '@/types/inventory'
import { vinculosService } from '@/services/inventoryService'
import { LABEL_SITUACAO_VINCULO } from '@/lib/labels'
import { Link2, Link2Off, Plus, Search, History } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { formatarData } from '@/lib/format'

interface SecaoVinculosProps {
  vinculos: Vinculo[]
  colaboradores: Colaborador[]
  dispositivos: Dispositivo[]
  onAtualizar: () => void
}

export function SecaoVinculos({
  vinculos,
  colaboradores,
  dispositivos,
  onAtualizar,
}: SecaoVinculosProps) {
  const [aberto, setAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState('')
  const [somenteAtivos, setSomenteAtivos] = useState(false)
  const [colaboradorId, setColaboradorId] = useState('')
  const [dispositivoId, setDispositivoId] = useState('')
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0, 10))
  const [observacoes, setObservacoes] = useState('')
  const [encerrando, setEncerrando] = useState<Vinculo | null>(null)
  const [motivoEncerramento, setMotivoEncerramento] = useState('')

  const dispositivosDisponiveis = useMemo(
    () => dispositivos.filter((d) => d.status === 'disponivel'),
    [dispositivos],
  )

  const colaboradoresAtivos = useMemo(
    () => colaboradores.filter((c) => c.status === 'ativo'),
    [colaboradores],
  )

  const listaFiltrada = useMemo(() => {
    let lista = vinculos
    if (somenteAtivos) lista = lista.filter((v) => v.situacao === 'ativo')
    if (busca.trim()) {
      const q = busca.toLowerCase()
      lista = lista.filter((v) => {
        const nomeColab = v.expand?.colaborador?.nome?.toLowerCase() || ''
        const disp =
          `${v.expand?.dispositivo?.fabricante} ${v.expand?.dispositivo?.modelo} ${v.expand?.dispositivo?.numero_serie}`.toLowerCase()
        return nomeColab.includes(q) || disp.includes(q)
      })
    }
    return lista
  }, [vinculos, busca, somenteAtivos])

  const vincular = async () => {
    if (!colaboradorId || !dispositivoId) {
      toast({ title: 'Selecione o colaborador e o dispositivo', variant: 'destructive' })
      return
    }
    setSalvando(true)
    try {
      await vinculosService.criar({
        colaborador: colaboradorId,
        dispositivo: dispositivoId,
        data_inicio: new Date(dataInicio + 'T12:00:00').toISOString(),
        observacoes,
      })
      toast({
        title: 'Dispositivo vinculado',
        description:
          'Status do dispositivo mudou para EM USO e o Contrato de Comodato foi gerado em 2 vias.',
      })
      setAberto(false)
      setColaboradorId('')
      setDispositivoId('')
      setObservacoes('')
      onAtualizar()
    } catch (e) {
      toast({
        title: 'Erro ao vincular',
        description: e instanceof Error ? e.message : 'Tente novamente',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const confirmarEncerramento = async () => {
    if (!encerrando) return
    setSalvando(true)
    try {
      await vinculosService.encerrar(
        encerrando,
        motivoEncerramento.trim() || 'Devolução do dispositivo',
      )
      toast({
        title: 'Vínculo encerrado',
        description: 'Dispositivo voltou para DISPONÍVEL e o Distrato de Comodato foi gerado.',
      })
      setEncerrando(null)
      setMotivoEncerramento('')
      onAtualizar()
    } catch (e) {
      toast({
        title: 'Erro ao encerrar vínculo',
        description: e instanceof Error ? e.message : 'Tente novamente',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-emerald-100 bg-white shadow-sm rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-700/60" />
            <Input
              placeholder="Buscar por colaborador ou dispositivo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 rounded-xl border-emerald-200 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-emerald-800 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={somenteAtivos}
              onChange={(e) => setSomenteAtivos(e.target.checked)}
              className="accent-emerald-700 w-4 h-4 rounded"
            />
            Somente vínculos ativos
          </label>
          <Button
            onClick={() => setAberto(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs h-9"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Novo Vínculo
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {listaFiltrada.length === 0 ? (
          <div className="bg-white rounded-3xl border border-emerald-100 p-12 text-center">
            <Link2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-base font-semibold text-emerald-950">Nenhum vínculo registrado</h4>
            <p className="text-xs text-emerald-700 mt-1">
              Vincule dispositivos DISPONÍVEIS aos colaboradores — o histórico completo é mantido.
            </p>
          </div>
        ) : (
          listaFiltrada.map((v) => {
            const colab = v.expand?.colaborador
            const disp = v.expand?.dispositivo
            const ativo = v.situacao === 'ativo'
            return (
              <Card
                key={v.id}
                className={`rounded-2xl shadow-sm border transition-all ${
                  ativo ? 'bg-white border-emerald-200' : 'bg-stone-50 border-stone-200'
                }`}
              >
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      {ativo ? (
                        <Link2 className="w-4.5 h-4.5" />
                      ) : (
                        <Link2Off className="w-4.5 h-4.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-emerald-950">
                          {colab?.nome || 'Colaborador removido'}
                        </span>
                        <Badge
                          className={
                            ativo
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200 rounded-full text-[10px]'
                              : 'bg-stone-200 text-stone-600 border-stone-300 rounded-full text-[10px]'
                          }
                        >
                          {LABEL_SITUACAO_VINCULO[v.situacao] || v.situacao}
                        </Badge>
                      </div>
                      <p className="text-xs text-emerald-800/80 mt-0.5 truncate">
                        {disp
                          ? `${disp.fabricante} ${disp.modelo} (${disp.tipo}) — Série: ${disp.numero_serie || '-'}`
                          : 'Dispositivo'}
                      </p>
                      <p className="text-[11px] text-emerald-700/70 mt-0.5 flex items-center gap-1">
                        <History className="w-3 h-3" />
                        Início: {formatarData(v.data_inicio)}
                        {v.data_fim && <> · Fim: {formatarData(v.data_fim)}</>}
                        {v.motivo_encerramento && <> · Motivo: {v.motivo_encerramento}</>}
                      </p>
                      {v.observacoes && (
                        <p className="text-[11px] text-emerald-700/60 italic mt-0.5">
                          {v.observacoes}
                        </p>
                      )}
                    </div>
                  </div>

                  {ativo && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEncerrando(v)}
                      className="border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg text-xs h-8 shrink-0"
                    >
                      <Link2Off className="w-3.5 h-3.5 mr-1" />
                      Encerrar vínculo
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Modal de novo vínculo */}
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-md rounded-3xl border-emerald-100">
          <DialogHeader>
            <DialogTitle className="font-serif italic text-xl text-emerald-950">
              Novo Vínculo
            </DialogTitle>
            <DialogDescription className="text-xs text-emerald-700">
              Somente dispositivos DISPONÍVEIS podem ser vinculados. Ao vincular, o dispositivo
              passa automaticamente para EM USO e o Contrato de Comodato é gerado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs text-emerald-800">Colaborador *</Label>
              <Select value={colaboradorId} onValueChange={setColaboradorId}>
                <SelectTrigger className="rounded-xl border-emerald-200 text-sm">
                  <SelectValue placeholder="Selecione o colaborador (pré-cadastrado)" />
                </SelectTrigger>
                <SelectContent>
                  {colaboradoresAtivos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} — {c.cargo || c.departamento || 'Colaborador'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-emerald-800">
                Dispositivo DISPONÍVEL * ({dispositivosDisponiveis.length} disponível(is))
              </Label>
              <Select value={dispositivoId} onValueChange={setDispositivoId}>
                <SelectTrigger className="rounded-xl border-emerald-200 text-sm">
                  <SelectValue placeholder="Selecione o dispositivo" />
                </SelectTrigger>
                <SelectContent>
                  {dispositivosDisponiveis.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.fabricante} {d.modelo} — Série {d.numero_serie || d.id.slice(0, 6)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-emerald-800">Data de início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="rounded-xl border-emerald-200 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-emerald-800">Observações</Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="rounded-xl border-emerald-200 text-sm min-h-[60px]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setAberto(false)}
                className="rounded-xl border-emerald-200 text-emerald-800 text-sm"
              >
                Cancelar
              </Button>
              <Button
                onClick={vincular}
                disabled={salvando}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm"
              >
                {salvando ? 'Vinculando...' : 'Vincular e Gerar Contrato'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de encerramento (gera distrato) */}
      <Dialog open={!!encerrando} onOpenChange={(o) => !o && setEncerrando(null)}>
        <DialogContent className="max-w-md rounded-3xl border-emerald-100">
          <DialogHeader>
            <DialogTitle className="font-serif italic text-xl text-emerald-950">
              Encerrar Vínculo
            </DialogTitle>
            <DialogDescription className="text-xs text-emerald-700">
              O dispositivo voltará para DISPONÍVEL e o Distrato de Comodato será gerado
              automaticamente. O histórico do vínculo será preservado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs text-emerald-800">Motivo do encerramento *</Label>
              <Textarea
                value={motivoEncerramento}
                onChange={(e) => setMotivoEncerramento(e.target.value)}
                placeholder="Ex.: Desligamento do colaborador, devolução voluntária, troca de equipamento..."
                className="rounded-xl border-emerald-200 text-sm min-h-[70px]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setEncerrando(null)}
                className="rounded-xl border-emerald-200 text-emerald-800 text-sm"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmarEncerramento}
                disabled={salvando}
                className="bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-sm"
              >
                {salvando ? 'Encerrando...' : 'Encerrar e Gerar Distrato'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
