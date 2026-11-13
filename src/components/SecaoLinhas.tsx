import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Colaborador, LinhaTelefonica, VinculoLinha } from '@/types/inventory'
import { linhasService, vinculosLinhasService } from '@/services/linhasService'
import {
  ModalLinhaTelefonica,
  formatarNumeroLinha,
  rotuloStatusLinha,
} from './ModalLinhaTelefonica'
import { Smartphone, Pencil, Link2, Unlink, Search, PhoneCall } from 'lucide-react'
import { formatarData } from '@/lib/format'
import { toast } from '@/hooks/use-toast'

interface SecaoLinhasProps {
  linhas: LinhaTelefonica[]
  vinculosLinhas: VinculoLinha[]
  colaboradores: Colaborador[]
  onAtualizar: () => void
}

export function SecaoLinhas({
  linhas,
  vinculosLinhas,
  colaboradores,
  onAtualizar,
}: SecaoLinhasProps) {
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [linhaEditando, setLinhaEditando] = useState<LinhaTelefonica | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [vinculoAlvo, setVinculoAlvo] = useState<LinhaTelefonica | null>(null)
  const [colaboradorVinculo, setColaboradorVinculo] = useState('')
  const [obsVinculo, setObsVinculo] = useState('')
  const [encerrando, setEncerrando] = useState<VinculoLinha | null>(null)
  const [motivoEncerramento, setMotivoEncerramento] = useState('')
  const [processando, setProcessando] = useState(false)

  const ativos = vinculosLinhas.filter((v) => v.situacao === 'ativo')
  const colaboradorAtivoDaLinha = (linhaId: string) => {
    const vinculo = ativos.find((v) => v.linha === linhaId)
    if (!vinculo) return null
    const nome = vinculo.expand?.colaborador?.nome
    if (nome) return { vinculo, nome }
    const c = colaboradores.find((item) => item.id === vinculo.colaborador)
    return c ? { vinculo, nome: c.nome } : null
  }

  const linhasFiltradas = linhas.filter((l) => {
    if (!busca.trim()) return true
    const q = busca.toLowerCase()
    const vinculo = colaboradorAtivoDaLinha(l.id)
    return (
      l.numero.includes(q.replace(/\D/g, '')) ||
      (l.operadora || '').toLowerCase().includes(q) ||
      (l.plano || '').toLowerCase().includes(q) ||
      (l.imei || '').includes(q.replace(/\D/g, '')) ||
      (vinculo?.nome.toLowerCase().includes(q) ?? false)
    )
  })

  const abrirNova = () => {
    setLinhaEditando(null)
    setRefreshKey((k) => k + 1)
    setModalAberto(true)
  }

  const abrirEdicao = (l: LinhaTelefonica) => {
    setLinhaEditando(l)
    setRefreshKey((k) => k + 1)
    setModalAberto(true)
  }

  const salvarVinculo = async () => {
    if (!vinculoAlvo || !colaboradorVinculo) {
      toast({ title: 'Selecione o colaborador', variant: 'destructive' })
      return
    }
    setProcessando(true)
    try {
      await vinculosLinhasService.vincular({
        colaborador: colaboradorVinculo,
        linha: vinculoAlvo.id,
        observacoes: obsVinculo.trim() || undefined,
      })
      toast({
        title: 'Linha vinculada',
        description: 'Histórico registrado em vínculos de linhas.',
      })
      setVinculoAlvo(null)
      setColaboradorVinculo('')
      setObsVinculo('')
      onAtualizar()
    } catch (e) {
      toast({
        title: 'Erro ao vincular',
        description: e instanceof Error ? e.message : 'Tente novamente',
        variant: 'destructive',
      })
    } finally {
      setProcessando(false)
    }
  }

  const confirmarEncerramento = async () => {
    if (!encerrando) return
    if (!motivoEncerramento.trim()) {
      toast({ title: 'Informe o motivo do encerramento', variant: 'destructive' })
      return
    }
    setProcessando(true)
    try {
      await vinculosLinhasService.encerrar(encerrando, motivoEncerramento.trim())
      toast({
        title: 'Vínculo encerrado',
        description: 'A linha voltou para DISPONÍVEL. Histórico preservado.',
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
      setProcessando(false)
    }
  }

  const badgeStatus = (status?: string) => {
    if (status === 'em_uso') {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 rounded-full font-medium">
          Em uso
        </Badge>
      )
    }
    if (status === 'cancelada') {
      return (
        <Badge className="bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100 rounded-full font-medium">
          Cancelada
        </Badge>
      )
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 rounded-full font-medium">
        Disponível
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border-emerald-100 bg-white shadow-sm rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-700/60" />
            <Input
              placeholder="Buscar por número, operadora, plano, IMEI ou colaborador..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 rounded-xl border-emerald-200 focus:ring-emerald-600 bg-emerald-50/20 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {linhasFiltradas.length === 0 ? (
          <div className="md:col-span-2 bg-white rounded-3xl border border-emerald-100 p-12 text-center">
            <PhoneCall className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-base font-semibold text-emerald-950">
              Nenhuma linha telefônica encontrada
            </h4>
            <p className="text-xs text-emerald-700 mt-1">
              Cadastre linhas corporativas (celular ou modem) na aba “Cadastros”.
            </p>
          </div>
        ) : (
          linhasFiltradas.map((l) => {
            const ativo = colaboradorAtivoDaLinha(l.id)
            return (
              <Card
                key={l.id}
                className="bg-white rounded-2xl border border-emerald-100/90 hover:border-emerald-300 transition-all shadow-sm"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-base text-emerald-950 font-mono">
                          {formatarNumeroLinha(l.numero)}
                        </h4>
                        <p className="text-xs text-emerald-700/80">
                          {l.tipo === 'modem' ? 'Modem' : 'Celular'}
                          {l.operadora ? ` • ${l.operadora}` : ''}
                          {l.plano ? ` • ${l.plano}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {badgeStatus(l.status)}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => abrirEdicao(l)}
                        title="Editar linha"
                        className="h-8 w-8 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {l.imei && (
                    <p className="text-xs text-emerald-900/80">
                      <span className="text-emerald-700/80 font-medium">IMEI: </span>
                      <code className="font-mono bg-emerald-50 px-1.5 py-0.5 rounded">
                        {l.imei}
                      </code>
                    </p>
                  )}

                  <div className="pt-2 border-t border-emerald-50 flex items-center justify-between gap-2">
                    {ativo ? (
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                          Vínculo ativo
                        </p>
                        <p className="text-xs font-semibold text-emerald-950 truncate">
                          {ativo.nome}
                        </p>
                        <p className="text-[10px] text-emerald-700/70">
                          desde {formatarData(ativo.vinculo.data_inicio)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-emerald-600/70 italic">
                        {l.status === 'cancelada'
                          ? 'Linha cancelada.'
                          : 'Sem vínculo ativo — disponível para atribuição.'}
                      </p>
                    )}
                    {ativo ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={processando}
                        onClick={() => {
                          setEncerrando(ativo.vinculo)
                          setMotivoEncerramento('')
                        }}
                        className="h-8 rounded-lg text-[11px] font-semibold border-rose-300 text-rose-700 hover:bg-rose-50"
                      >
                        <Unlink className="w-3.5 h-3.5 mr-1" /> ENCERRAR
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={l.status === 'cancelada' || processando}
                        onClick={() => {
                          setVinculoAlvo(l)
                          setColaboradorVinculo('')
                          setObsVinculo('')
                        }}
                        className="h-8 rounded-lg text-[11px] font-semibold border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                      >
                        <Link2 className="w-3.5 h-3.5 mr-1" /> VINCULAR
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Cadastro/edição de linha */}
      <ModalLinhaTelefonica
        key={refreshKey}
        aberto={modalAberto}
        onAbertoChange={setModalAberto}
        onLinhaSalva={() => {
          setRefreshKey((k) => k + 1)
          onAtualizar()
        }}
        linhaEdicao={
          linhaEditando
            ? {
                id: linhaEditando.id,
                numero: linhaEditando.numero,
                operadora: linhaEditando.operadora,
                plano: linhaEditando.plano,
                tipo: linhaEditando.tipo,
                imei: linhaEditando.imei,
                status: linhaEditando.status,
                observacoes: linhaEditando.observacoes,
              }
            : null
        }
      />

      {/* Vínculo de linha a colaborador */}
      <Dialog open={!!vinculoAlvo} onOpenChange={(v) => !v && setVinculoAlvo(null)}>
        <DialogContent className="max-w-md rounded-3xl border-emerald-100">
          <DialogHeader>
            <DialogTitle className="font-sans font-semibold text-xl text-emerald-950">
              Vincular linha {vinculoAlvo ? formatarNumeroLinha(vinculoAlvo.numero) : ''}
            </DialogTitle>
            <DialogDescription className="text-xs text-emerald-700">
              Um colaborador pode ter várias linhas. O vínculo fica registrado e nunca é excluído —
              ao encerrar, informe o motivo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-emerald-800">Colaborador *</Label>
              <Select value={colaboradorVinculo} onValueChange={setColaboradorVinculo}>
                <SelectTrigger className="rounded-xl border-emerald-200 text-sm">
                  <SelectValue placeholder="Selecione o colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {colaboradores.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} {c.departamento ? `(${c.departamento})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-emerald-800">Observações</Label>
              <Input
                value={obsVinculo}
                onChange={(e) => setObsVinculo(e.target.value)}
                placeholder="Ex.: linha do rota 4G do veículo"
                className="rounded-xl border-emerald-200 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setVinculoAlvo(null)}
                className="rounded-xl border-emerald-200 text-emerald-800 text-sm"
              >
                Cancelar
              </Button>
              <Button
                onClick={salvarVinculo}
                disabled={processando}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm"
              >
                {processando ? 'Vinculando...' : 'Vincular Linha'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Encerramento de vínculo (com motivo — nada é excluído) */}
      <Dialog open={!!encerrando} onOpenChange={(v) => !v && setEncerrando(null)}>
        <DialogContent className="max-w-md rounded-3xl border-emerald-100">
          <DialogHeader>
            <DialogTitle className="font-sans font-semibold text-xl text-emerald-950">
              Encerrar vínculo
            </DialogTitle>
            <DialogDescription className="text-xs text-emerald-700">
              O vínculo NÃO é excluído: ele fica marcado como ENCERRADO com o motivo informado e a
              linha volta para DISPONÍVEL.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-emerald-800">Motivo do encerramento *</Label>
              <Input
                value={motivoEncerramento}
                onChange={(e) => setMotivoEncerramento(e.target.value)}
                placeholder="Ex.: devolução do aparelho, troca de setor"
                className="rounded-xl border-emerald-200 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setEncerrando(null)}
                className="rounded-xl border-emerald-200 text-emerald-800 text-sm"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmarEncerramento}
                disabled={processando}
                className="bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-sm"
              >
                {processando ? 'Encerrando...' : 'Encerrar Vínculo'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
