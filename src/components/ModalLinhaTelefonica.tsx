import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { NovaLinhaInput, StatusLinha, TipoLinha } from '@/types/inventory'
import { linhasService } from '@/services/linhasService'
import { Save, Phone } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

// Mascara o número enquanto digita: (DD) NNNNN-NNNN
export function formatarNumeroLinha(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

interface ModalLinhaTelefonicaProps {
  onLinhaSalva: () => void
  /** Quando informado, o modal abre já em modo de edição. */
  linhaEdicao?: {
    id: string
    numero: string
    operadora?: string
    plano?: string
    tipo?: TipoLinha
    imei?: string
    status?: StatusLinha
    observacoes?: string
  } | null
  /** Modo controlado (aba Linhas). Em modo não controlado, use triggerButton. */
  aberto?: boolean
  onAbertoChange?: (aberto: boolean) => void
  triggerButton?: React.ReactNode
}

export function ModalLinhaTelefonica({
  onLinhaSalva,
  linhaEdicao = null,
  aberto: abertoProp,
  onAbertoChange: onAbertoChangeProp,
  triggerButton,
}: ModalLinhaTelefonicaProps) {
  const [abertoInterno, setAbertoInterno] = useState(false)
  const aberto = abertoProp !== undefined ? abertoProp : abertoInterno
  const onAbertoChange = (v: boolean) => {
    onAbertoChangeProp?.(v)
    setAbertoInterno(v)
  }
  const [salvando, setSalvando] = useState(false)
  const [formulario, setFormulario] = useState<NovaLinhaInput>(formularioVazio())

  function formularioVazio(): NovaLinhaInput {
    return {
      numero: '',
      operadora: '',
      plano: '',
      tipo: 'celular',
      imei: '',
      status: 'disponivel',
      observacoes: '',
    }
  }

  useEffect(() => {
    if (aberto) {
      setFormulario(
        linhaEdicao
          ? {
              numero: formatarNumeroLinha(linhaEdicao.numero),
              operadora: linhaEdicao.operadora || '',
              plano: linhaEdicao.plano || '',
              tipo: linhaEdicao.tipo || 'celular',
              imei: linhaEdicao.imei || '',
              status: linhaEdicao.status || 'disponivel',
              observacoes: linhaEdicao.observacoes || '',
            }
          : formularioVazio(),
      )
    }
  }, [aberto, linhaEdicao])

  const set = (campo: keyof NovaLinhaInput, valor: string) =>
    setFormulario((f) => ({ ...f, [campo]: valor }))

  const salvar = async () => {
    const digitos = formulario.numero.replace(/\D/g, '')
    if (digitos.length < 10 || digitos.length > 11) {
      toast({
        title: 'Número inválido',
        description: 'Informe o número com DDD (10 ou 11 dígitos).',
        variant: 'destructive',
      })
      return
    }
    setSalvando(true)
    try {
      const payload: NovaLinhaInput = {
        ...formulario,
        numero: digitos,
      }
      if (linhaEdicao) {
        await linhasService.atualizar(linhaEdicao.id, payload)
        toast({ title: 'Linha atualizada', description: `Linha ${formatarNumeroLinha(digitos)}` })
      } else {
        await linhasService.criar(payload)
        toast({ title: 'Linha telefônica cadastrada' })
      }
      onAbertoChange(false)
      onLinhaSalva()
    } catch (e) {
      toast({
        title: linhaEdicao ? 'Erro ao atualizar linha' : 'Erro ao salvar linha',
        description: e instanceof Error ? e.message : 'Tente novamente',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogTrigger asChild>{triggerButton || <span />}</DialogTrigger>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl border-emerald-100">
        <DialogHeader>
          <DialogTitle className="font-sans font-semibold text-xl text-emerald-950 flex items-center gap-2">
            <Phone className="w-5 h-5 text-emerald-700" />
            {linhaEdicao ? 'Editar Linha Telefônica' : 'Nova Linha Telefônica'}
          </DialogTitle>
          <DialogDescription className="text-xs text-emerald-700">
            Linhas corporativas (celular ou modem). O vínculo a colaboradores é feito na aba Linhas
            Telefônicas; nada é excluído — linhas só mudam de status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-emerald-800">Número (com DDD) *</Label>
              <Input
                value={formatarNumeroLinha(formulario.numero || '')}
                onChange={(e) => set('numero', e.target.value)}
                placeholder="(16) 99999-9999"
                inputMode="numeric"
                className="rounded-xl border-emerald-200 text-sm font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-emerald-800">Operadora</Label>
              <Input
                value={formulario.operadora || ''}
                onChange={(e) => set('operadora', e.target.value)}
                placeholder="Vivo, Claro, TIM..."
                className="rounded-xl border-emerald-200 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-emerald-800">Plano</Label>
              <Input
                value={formulario.plano || ''}
                onChange={(e) => set('plano', e.target.value)}
                placeholder="Ex.: Controle 10GB"
                className="rounded-xl border-emerald-200 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-emerald-800">Tipo</Label>
              <Select value={formulario.tipo || 'celular'} onValueChange={(v) => set('tipo', v)}>
                <SelectTrigger className="rounded-xl border-emerald-200 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="celular">Celular (linha de aparelho)</SelectItem>
                  <SelectItem value="modem">Modem (rota 4G/5G)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-emerald-800">IMEI</Label>
              <Input
                value={formulario.imei || ''}
                onChange={(e) => set('imei', e.target.value)}
                placeholder="15 dígitos"
                inputMode="numeric"
                className="rounded-xl border-emerald-200 text-sm font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-emerald-800">Status</Label>
              <Select
                value={formulario.status || 'disponivel'}
                onValueChange={(v) => set('status', v)}
              >
                <SelectTrigger className="rounded-xl border-emerald-200 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="em_uso">Em uso</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-emerald-800">Observações</Label>
            <Textarea
              value={formulario.observacoes || ''}
              onChange={(e) => set('observacoes', e.target.value)}
              className="rounded-xl border-emerald-200 text-sm min-h-[60px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onAbertoChange(false)}
              className="rounded-xl border-emerald-200 text-emerald-800 text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={salvar}
              disabled={salvando}
              className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm"
            >
              <Save className="w-4 h-4 mr-2" />
              {salvando ? 'Salvando...' : linhaEdicao ? 'Salvar Alterações' : 'Salvar Linha'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Rótulos usados na listagem da aba.
export const rotuloStatusLinha: Record<string, string> = {
  disponivel: 'Disponível',
  em_uso: 'Em uso',
  cancelada: 'Cancelada',
}
