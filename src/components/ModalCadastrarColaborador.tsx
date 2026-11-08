import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NovoColaboradorInput } from '@/types/inventory'
import { colaboradoresService } from '@/services/inventoryService'
import { LABEL_ESTADO_CIVIL, LABEL_UFS } from '@/lib/labels'
import { UserPlus } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ModalCadastrarColaboradorProps {
  onColaboradorSalvo: () => void
  triggerButton?: React.ReactNode
}

export function ModalCadastrarColaborador({
  onColaboradorSalvo,
  triggerButton,
}: ModalCadastrarColaboradorProps) {
  const [aberto, setAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [formulario, setFormulario] = useState<NovoColaboradorInput>(formularioVazio())

  function formularioVazio(): NovoColaboradorInput {
    return {
      nome: '',
      nacionalidade: 'Brasileiro(a)',
      estado_civil: '',
      documento_identidade: '',
      emissor_documento: '',
      cpf: '',
      endereco: '',
      cidade: '',
      estado: '',
      uf: '',
      departamento: '',
      cargo: '',
      email: '',
      telefone: '',
      matricula: '',
      observacoes: '',
      status: 'ativo',
    }
  }

  const set = (campo: keyof NovoColaboradorInput, valor: string) =>
    setFormulario((f) => ({ ...f, [campo]: valor }))

  const salvar = async () => {
    if (!formulario.nome.trim()) {
      toast({ title: 'Informe o nome completo', variant: 'destructive' })
      return
    }
    setSalvando(true)
    try {
      await colaboradoresService.criar(formulario)
      toast({ title: 'Colaborador cadastrado', description: 'Status inicial: ATIVO' })
      setFormulario(formularioVazio())
      setAberto(false)
      onColaboradorSalvo()
    } catch (e) {
      toast({
        title: 'Erro ao salvar',
        description: e instanceof Error ? e.message : 'Tente novamente',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const campo = (label: string, key: keyof NovoColaboradorInput, placeholder = '') => (
    <div className="space-y-1">
      <Label className="text-xs text-emerald-800">{label}</Label>
      <Input
        value={(formulario[key] as string) || ''}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        className="rounded-xl border-emerald-200 text-sm"
      />
    </div>
  )

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs h-9">
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            Novo Colaborador
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border-emerald-100">
        <DialogHeader>
          <DialogTitle className="font-serif italic text-xl text-emerald-950">
            Cadastrar Colaborador
          </DialogTitle>
          <DialogDescription className="text-xs text-emerald-700">
            Dados completos exigidos pelo contrato de comodato. Todo colaborador começa como ATIVO.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <section className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Identificação (contrato)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {campo('Nome completo *', 'nome')}
              {campo('CPF', 'cpf')}
              {campo('Nacionalidade', 'nacionalidade', 'Brasileiro(a)')}
              <div className="space-y-1">
                <Label className="text-xs text-emerald-800">Estado civil</Label>
                <Select
                  value={formulario.estado_civil || ''}
                  onValueChange={(v) => set('estado_civil', v)}
                >
                  <SelectTrigger className="rounded-xl border-emerald-200 text-sm">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {LABEL_ESTADO_CIVIL.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {campo('Documento de identidade (RG)', 'documento_identidade')}
              {campo('Emissor do documento', 'emissor_documento', 'SSP/SP')}
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Endereço
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">{campo('Endereço completo', 'endereco')}</div>
              {campo('Cidade', 'cidade')}
              {campo('Estado', 'estado', 'São Paulo')}
              <div className="space-y-1">
                <Label className="text-xs text-emerald-800">UF</Label>
                <Select value={formulario.uf || ''} onValueChange={(v) => set('uf', v)}>
                  <SelectTrigger className="rounded-xl border-emerald-200 text-sm">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {LABEL_UFS.map((uf) => (
                      <SelectItem key={uf} value={uf}>
                        {uf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Dados da empresa
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {campo('Departamento', 'departamento')}
              {campo('Cargo', 'cargo')}
              {campo('E-mail', 'email', 'nome@envimat.com')}
              {campo('Telefone', 'telefone')}
              {campo('Matrícula', 'matricula')}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-emerald-800">Observações</Label>
              <Textarea
                value={formulario.observacoes || ''}
                onChange={(e) => set('observacoes', e.target.value)}
                className="rounded-xl border-emerald-200 text-sm min-h-[60px]"
              />
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setAberto(false)}
              className="rounded-xl border-emerald-200 text-emerald-800 text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={salvar}
              disabled={salvando}
              className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm"
            >
              {salvando ? 'Salvando...' : 'Salvar Colaborador'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
