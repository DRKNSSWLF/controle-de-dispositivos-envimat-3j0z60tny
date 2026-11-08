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
import { Colaborador, Dispositivo, Manutencao, Vinculo } from '@/types/inventory'
import { manutencoesService, vinculosService } from '@/services/inventoryService'
import { LABEL_SITUACAO_MANUTENCAO } from '@/lib/labels'
import { formatarData } from '@/lib/format'
import { Wrench, Search, WrenchIcon, RotateCcw, UserPlus } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface SecaoManutencaoProps {
  manutencoes: Manutencao[]
  dispositivos: Dispositivo[]
  colaboradores: Colaborador[]
  vinculos: Vinculo[]
  onAtualizar: () => void
}

export function SecaoManutencao({
  manutencoes,
  dispositivos,
  vinculos,
  onAtualizar,
}: SecaoManutencaoProps) {
  const [aberto, setAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState('')
  const [dispositivoId, setDispositivoId] = useState('')
  const [motivo, setMotivo] = useState('')
  const [observacoes, setObservacoes] = useState('')

  // Vínculo substituto: escolhido ao retornar o dispositivo
  const [retornando, setRetornando] = useState<Manutencao | null>(null)
  const [substitutoColaborador, setSubstitutoColaborador] = useState('')

  const dispositivosEmUso = useMemo(
    () => dispositivos.filter((d) => d.status === 'em_uso'),
    [dispositivos],
  )

  const colaboradoresAtivos = useMemo(
    () =>
      colaboradores
        .filter((c) => c.status === 'ativo')
        .filter((c) => !dispositivos.some((d) => d.colaborador === c.id && d.status === 'em_uso')),
    [dispositivos],
  )

  const listaFiltrada = useMemo(() => {
    if (!busca.trim()) return manutencoes
    const q = busca.toLowerCase()
    return manutencoes.filter((m) => {
      const disp = m.expand?.dispositivo
      return (
        `${disp?.fabricante} ${disp?.modelo} ${disp?.numero_serie}`.toLowerCase().includes(q) ||
        (m.motivo || '').toLowerCase().includes(q)
      )
    })
  }, [manutencoes, busca])

  const enviarParaManutencao = async () => {
    if (!dispositivoId || !motivo.trim()) {
      toast({ title: 'Selecione o dispositivo e informe o motivo', variant: 'destructive' })
      return
    }
    setSalvando(true)
    try {
      await manutencoesService.enviar({
        dispositivo: dispositivoId,
        motivo,
        observacoes,
      })
      toast({
        title: 'Dispositivo enviado para manutenção',
        description:
          'O vínculo com o colaborador foi encerrado (distrato gerado) e o histórico foi registrado.',
      })
      setAberto(false)
      setDispositivoId('')
      setMotivo('')
      setObservacoes('')
      onAtualizar()
    } catch (e) {
      toast({
        title: 'Erro ao enviar para manutenção',
        description: e instanceof Error ? e.message : 'Tente novamente',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  // Registro do retorno: dispositivo volta para DISPONÍVEL, e o usuário pode
  // vincular diretamente um colaborador (caso haja vínculo pendente).
  const registrarRetorno = async (vincularColaborador: boolean) => {
    if (!retornando) return
    setSalvando(true)
    try {
      await manutencoesService.registrarRetorno(retornando, 'disponivel')
      if (vincularColaborador && substitutoColaborador) {
        const vinculosDisp = await vinculosService.listar()
        const ativoDoDisp = vinculosDisp.find(
          (v) => v.dispositivo === retornando.dispositivo && v.situacao === 'ativo',
        )
        if (!ativoDoDisp) {
          await vinculosService.criar({
            colaborador: substitutoColaborador,
            dispositivo: retornando.dispositivo,
            data_inicio: new Date().toISOString(),
            observacoes: 'Vínculo direto no retorno da manutenção',
          })
        }
      }
      toast({
        title: 'Retorno registrado',
        description:
          vincularColaborador && substitutoColaborador
            ? 'Dispositivo vinculado novamente ao colaborador selecionado.'
            : 'Dispositivo está DISPONÍVEL novamente.',
      })
      setRetornando(null)
      setSubstitutoColaborador('')
      onAtualizar()
    } catch (e) {
      toast({
        title: 'Erro ao registrar retorno',
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
              placeholder="Buscar por dispositivo ou motivo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 rounded-xl border-emerald-200 text-sm"
            />
          </div>
          <Button
            onClick={() => setAberto(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs h-9"
          >
            <Wrench className="w-3.5 h-3.5 mr-1.5" />
            Enviar para Manutenção
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {listaFiltrada.length === 0 ? (
          <div className="bg-white rounded-3xl border border-emerald-100 p-12 text-center">
            <Wrench className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-base font-semibold text-emerald-950">
              Nenhuma solicitação de manutenção
            </h4>
            <p className="text-xs text-emerald-700 mt-1">
              Todo envio para manutenção desvincula o colaborador e mantém o histórico completo.
            </p>
          </div>
        ) : (
          listaFiltrada.map((m) => {
            const disp = m.expand?.dispositivo
            const emManutencao = m.situacao === 'em_manutencao'
            return (
              <Card
                key={m.id}
                className={`rounded-2xl shadow-sm border transition-all ${
                  emManutencao ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-emerald-100'
                }`}
              >
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        emManutencao
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      <WrenchIcon className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-emerald-950">
                          {disp
                            ? `${disp.fabricante} ${disp.modelo} (${disp.tipo})`
                            : 'Dispositivo'}
                        </span>
                        <Badge
                          className={
                            emManutencao
                              ? 'bg-amber-100 text-amber-800 border-amber-200 rounded-full text-[10px]'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200 rounded-full text-[10px]'
                          }
                        >
                          {LABEL_SITUACAO_MANUTENCAO[m.situacao] || m.situacao}
                        </Badge>
                      </div>
                      <p className="text-xs text-emerald-800/80 mt-0.5">
                        <span className="font-medium">Motivo:</span> {m.motivo || '-'}
                      </p>
                      <p className="text-[11px] text-emerald-700/70 mt-0.5">
                        Enviado em {formatarData(m.data_envio)}
                        {m.data_retorno ? ` · Retorno em ${formatarData(m.data_retorno)}` : ''}
                      </p>
                      {m.observacoes && (
                        <p className="text-[11px] text-emerald-700/60 italic mt-0.5">
                          {m.observacoes}
                        </p>
                      )}
                    </div>
                  </div>

                  {emManutencao && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setRetornando(m)
                        setSubstitutoColaborador('')
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs h-8 shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Registrar Retorno
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Modal de envio para manutenção */}
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-md rounded-3xl border-emerald-100">
          <DialogHeader>
            <DialogTitle className="font-serif italic text-xl text-emerald-950">
              Enviar para Manutenção
            </DialogTitle>
            <DialogDescription className="text-xs text-emerald-700">
              Ao enviar, o dispositivo é desvinculado do colaborador (gerando o Distrato de
              Comodato) e a solicitação é registrada no histórico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs text-emerald-800">
                Dispositivo EM USO * ({dispositivosEmUso.length} em uso)
              </Label>
              <Select value={dispositivoId} onValueChange={setDispositivoId}>
                <SelectTrigger className="rounded-xl border-emerald-200 text-sm">
                  <SelectValue placeholder="Selecione o dispositivo" />
                </SelectTrigger>
                <SelectContent>
                  {dispositivosEmUso.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.fabricante} {d.modelo} — Série {d.numero_serie || d.id.slice(0, 6)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-emerald-800">Motivo / Descrição *</Label>
              <Textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex.: Tela quebrada, não liga, bateria com defeito..."
                className="rounded-xl border-emerald-200 text-sm min-h-[70px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-emerald-800">Observações</Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="rounded-xl border-emerald-200 text-sm min-h-[50px]"
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
                onClick={enviarParaManutencao}
                disabled={salvando}
                className="bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-sm"
              >
                {salvando ? 'Enviando...' : 'Enviar para Manutenção'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de retorno: volta para DISPONÍVEL + vínculo direto opcional */}
      <Dialog open={!!retornando} onOpenChange={(o) => !o && setRetornando(null)}>
        <DialogContent className="max-w-md rounded-3xl border-emerald-100">
          <DialogHeader>
            <DialogTitle className="font-serif italic text-xl text-emerald-950">
              Registrar Retorno da Manutenção
            </DialogTitle>
            <DialogDescription className="text-xs text-emerald-700">
              O dispositivo voltará para DISPONÍVEL. Opcionalmente, vincule-o diretamente a um
              colaborador (passará para EM USO).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs text-emerald-800">
                Vincular diretamente a um colaborador (opcional)
              </Label>
              <Select value={substitutoColaborador} onValueChange={setSubstitutoColaborador}>
                <SelectTrigger className="rounded-xl border-emerald-200 text-sm">
                  <SelectValue placeholder="Deixar DISPONÍVEL (sem vínculo)" />
                </SelectTrigger>
                <SelectContent>
                  {colaboradoresAtivos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-emerald-700/60 flex items-center gap-1 pt-1">
                <UserPlus className="w-3 h-3" />
                Se vinculado, o contrato de comodato será gerado automaticamente.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setRetornando(null)}
                className="rounded-xl border-emerald-200 text-emerald-800 text-sm"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => registrarRetorno(!!substitutoColaborador)}
                disabled={salvando}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm"
              >
                {salvando ? 'Registrando...' : 'Confirmar Retorno'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
