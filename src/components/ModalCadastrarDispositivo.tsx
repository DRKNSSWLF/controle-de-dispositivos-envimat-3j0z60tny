import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { dispositivosService } from '@/services/inventoryService'
import {
  Colaborador,
  NovoDispositivoInput,
  TipoDispositivo,
  StatusDispositivo,
} from '@/types/inventory'
import { PlusCircle, Smartphone, Laptop, Tablet, HelpCircle, Save } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ModalCadastrarDispositivoProps {
  colaboradores: Colaborador[]
  onDispositivoSalvo: () => void
  triggerButton?: React.ReactNode
}

export function ModalCadastrarDispositivo({
  colaboradores,
  onDispositivoSalvo,
  triggerButton,
}: ModalCadastrarDispositivoProps) {
  const [open, setOpen] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Campos exigidos pelo requisito:
  // Tipo de dispositivo, fabricante, modelo, número de série, IMEI1, IMEI2 (+ colaborador, status, aquisição)
  const [tipo, setTipo] = useState<TipoDispositivo>('celular')
  const [fabricante, setFabricante] = useState('')
  const [modelo, setModelo] = useState('')
  const [numeroSerie, setNumeroSerie] = useState('')
  const [imei1, setImei1] = useState('')
  const [imei2, setImei2] = useState('')
  const [colaboradorId, setColaboradorId] = useState<string>('')
  const [status, setStatus] = useState<StatusDispositivo>('em_uso')
  const [dataAquisicao, setDataAquisicao] = useState('')
  const [dataManutencao, setDataManutencao] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const resetForm = () => {
    setTipo('celular')
    setFabricante('')
    setModelo('')
    setNumeroSerie('')
    setImei1('')
    setImei2('')
    setColaboradorId('')
    setStatus('em_uso')
    setDataAquisicao('')
    setDataManutencao('')
    setObservacoes('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fabricante.trim() || !modelo.trim() || !numeroSerie.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o Fabricante, Modelo e Número de Série do dispositivo.',
        variant: 'destructive',
      })
      return
    }

    setSalvando(true)
    try {
      const payload: NovoDispositivoInput = {
        tipo,
        fabricante: fabricante.trim(),
        modelo: modelo.trim(),
        numero_serie: numeroSerie.trim(),
        imei1: imei1.trim(),
        imei2: imei2.trim(),
        colaborador: colaboradorId && colaboradorId !== 'nenhum' ? colaboradorId : undefined,
        status,
        data_aquisicao: dataAquisicao || undefined,
        data_inicio_manutencao:
          status === 'manutencao' && dataManutencao ? dataManutencao : undefined,
        observacoes: observacoes.trim(),
      }

      await dispositivosService.criar(payload)
      setSalvando(false)
      setOpen(false)
      resetForm()

      toast({
        title: 'Dispositivo cadastrado!',
        description: `${fabricante} ${modelo} foi salvo com sucesso no inventário.`,
      })

      onDispositivoSalvo()
    } catch (err) {
      setSalvando(false)
      toast({
        title: 'Erro ao salvar dispositivo',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-sm">
            <PlusCircle className="w-4 h-4 mr-2" />
            Cadastrar Dispositivo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-emerald-100 p-6">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-4">
            <DialogTitle className="font-serif italic text-2xl text-emerald-950 font-normal">
              Novo Dispositivo Eletrônico
            </DialogTitle>
            <DialogDescription className="text-emerald-800/80">
              Cadastre smartphones, notebooks, tablets ou outros coletores da ENVIMAT com
              identificadores completos (Série e IMEIs).
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            {/* Tipo de dispositivo */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-emerald-950">
                Tipo de Dispositivo *
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: 'celular', label: 'Celular / Smartphone', icon: Smartphone },
                  { value: 'notebook', label: 'Notebook / Laptop', icon: Laptop },
                  { value: 'tablet', label: 'Tablet / Coletor', icon: Tablet },
                  { value: 'outro', label: 'Outro / Acessório', icon: HelpCircle },
                ].map((item) => {
                  const Icon = item.icon
                  const isSelected = tipo === item.value
                  return (
                    <button
                      type="button"
                      key={item.value}
                      onClick={() => setTipo(item.value as TipoDispositivo)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600/30'
                          : 'border-emerald-100 bg-white text-emerald-800/70 hover:border-emerald-300'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-emerald-700' : 'text-emerald-500'}`}
                      />
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Fabricante e Modelo */}
            <div className="space-y-1.5">
              <Label htmlFor="fabricante" className="text-xs font-semibold text-emerald-950">
                Fabricante / Marca *
              </Label>
              <Input
                id="fabricante"
                placeholder="Ex.: Samsung, Apple, Lenovo, Dell"
                value={fabricante}
                onChange={(e) => setFabricante(e.target.value)}
                className="rounded-xl border-emerald-200 focus:ring-emerald-600"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modelo" className="text-xs font-semibold text-emerald-950">
                Modelo do Dispositivo *
              </Label>
              <Input
                id="modelo"
                placeholder="Ex.: Galaxy A54, ThinkPad T14, iPad 9ª"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="rounded-xl border-emerald-200 focus:ring-emerald-600"
                required
              />
            </div>

            {/* Número de Série */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="numeroSerie" className="text-xs font-semibold text-emerald-950">
                Número de Série (S/N) *
              </Label>
              <Input
                id="numeroSerie"
                placeholder="Ex.: R58N40AB11M ou PF3Z881K"
                value={numeroSerie}
                onChange={(e) => setNumeroSerie(e.target.value)}
                className="rounded-xl font-mono text-sm border-emerald-200 focus:ring-emerald-600"
                required
              />
            </div>

            {/* IMEI 1 e IMEI 2 (importante para celulares e tablets) */}
            <div className="space-y-1.5">
              <Label
                htmlFor="imei1"
                className="text-xs font-semibold text-emerald-950 flex items-center justify-between"
              >
                <span>IMEI 1</span>
                <span className="text-[11px] text-emerald-600 font-normal">
                  Celulares/Tablets 4G/5G
                </span>
              </Label>
              <Input
                id="imei1"
                placeholder="Ex.: 354928114920194"
                value={imei1}
                onChange={(e) => setImei1(e.target.value)}
                className="rounded-xl font-mono text-sm border-emerald-200 focus:ring-emerald-600"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="imei2"
                className="text-xs font-semibold text-emerald-950 flex items-center justify-between"
              >
                <span>IMEI 2 (Chip Secundário/eSIM)</span>
                <span className="text-[11px] text-emerald-600/70 font-normal">Opcional</span>
              </Label>
              <Input
                id="imei2"
                placeholder="Ex.: 354928114920195"
                value={imei2}
                onChange={(e) => setImei2(e.target.value)}
                className="rounded-xl font-mono text-sm border-emerald-200 focus:ring-emerald-600"
              />
            </div>

            {/* Status e Colaborador Responsável */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-emerald-950">Status Operacional *</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as StatusDispositivo)}>
                <SelectTrigger className="rounded-xl border-emerald-200 focus:ring-emerald-600 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="em_uso">Em uso (entregue ao colaborador)</SelectItem>
                  <SelectItem value="disponivel">Disponível (reserva técnica / estoque)</SelectItem>
                  <SelectItem value="manutencao">Em Manutenção / Oficina</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-emerald-950">
                Colaborador Responsável (Comodato)
              </Label>
              <Select value={colaboradorId || 'nenhum'} onValueChange={setColaboradorId}>
                <SelectTrigger className="rounded-xl border-emerald-200 focus:ring-emerald-600 bg-white">
                  <SelectValue placeholder="Selecione o colaborador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">— Nenhum colaborador vinculado —</SelectItem>
                  {colaboradores.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} {c.departamento ? `(${c.departamento})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data de Aquisição (para cálculo de idade) */}
            <div className="space-y-1.5">
              <Label htmlFor="dataAquisicao" className="text-xs font-semibold text-emerald-950">
                Data de Aquisição / Compra
              </Label>
              <Input
                id="dataAquisicao"
                type="date"
                value={dataAquisicao}
                onChange={(e) => setDataAquisicao(e.target.value)}
                className="rounded-xl border-emerald-200 focus:ring-emerald-600"
              />
              <p className="text-[11px] text-emerald-700/70">
                Usada para calcular a idade do dispositivo e alertar compras futuras.
              </p>
            </div>

            {/* Data Início Manutenção (se estiver em manutenção) */}
            {status === 'manutencao' ? (
              <div className="space-y-1.5">
                <Label htmlFor="dataManutencao" className="text-xs font-semibold text-amber-900">
                  Data de Envio para Manutenção
                </Label>
                <Input
                  id="dataManutencao"
                  type="date"
                  value={dataManutencao}
                  onChange={(e) => setDataManutencao(e.target.value)}
                  className="rounded-xl border-amber-300 focus:ring-amber-500 bg-amber-50/40"
                />
                <p className="text-[11px] text-amber-800">
                  Disparará alerta caso ultrapasse 30 dias na assistência.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="obs" className="text-xs font-semibold text-emerald-950">
                  Observações / Estado do Aparelho
                </Label>
                <Input
                  id="obs"
                  placeholder="Ex.: Capa antichoque, película aplicada"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="rounded-xl border-emerald-200 focus:ring-emerald-600"
                />
              </div>
            )}

            {status === 'manutencao' && (
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="obs2" className="text-xs font-semibold text-emerald-950">
                  Observações / Defeito Relatado
                </Label>
                <Textarea
                  id="obs2"
                  rows={2}
                  placeholder="Descreva o motivo do envio para reparo..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="rounded-xl border-emerald-200 focus:ring-emerald-600"
                />
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-emerald-100 mt-4 flex items-center justify-between sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-emerald-800 hover:bg-emerald-50 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={salvando}
              className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow px-6"
            >
              <Save className="w-4 h-4 mr-2" />
              {salvando ? 'Salvando...' : 'Salvar no Inventário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
