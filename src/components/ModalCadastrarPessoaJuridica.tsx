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
import { NovaPessoaJuridicaInput } from '@/types/inventory'
import { pessoasJuridicasService } from '@/services/inventoryService'
import { Plus } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ModalCadastrarPessoaJuridicaProps {
  onSalvo: () => void
  triggerButton?: React.ReactNode
}

const VAZIO: NovaPessoaJuridicaInput = {
  cnpj: '',
  razao_social: '',
  representante: '',
  cpf_representante: '',
  endereco: '',
  cidade: '',
  estado: '',
  uf: '',
  telefone: '',
  email: '',
  observacoes: '',
}

/** Dialog de cadastro de Pessoa Jurídica, extraído da SecaoPessoasJuridicas
 *  para a área Cadastros do painel. */
export function ModalCadastrarPessoaJuridica({
  onSalvo,
  triggerButton,
}: ModalCadastrarPessoaJuridicaProps) {
  const [aberto, setAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [formulario, setFormulario] = useState<NovaPessoaJuridicaInput>({ ...VAZIO })

  const set = (campo: keyof NovaPessoaJuridicaInput, valor: string) =>
    setFormulario((f) => ({ ...f, [campo]: valor }))

  const salvar = async () => {
    if (!formulario.cnpj.trim() || !formulario.razao_social.trim()) {
      toast({ title: 'CNPJ e Razão Social são obrigatórios', variant: 'destructive' })
      return
    }
    setSalvando(true)
    try {
      await pessoasJuridicasService.criar(formulario)
      toast({ title: 'Pessoa jurídica cadastrada' })
      setFormulario({ ...VAZIO })
      setAberto(false)
      onSalvo()
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

  const campo = (label: string, key: keyof NovaPessoaJuridicaInput, placeholder = '') => (
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
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Nova Pessoa Jurídica
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border-emerald-100">
        <DialogHeader>
          <DialogTitle className="font-serif italic text-xl text-emerald-950">
            Cadastrar Pessoa Jurídica
          </DialogTitle>
          <DialogDescription className="text-xs text-emerald-700">
            Empresas prestadoras de serviço (mão de obra PJ) que utilizam dispositivos da ENVIMAT.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <section className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Identificação
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {campo('CNPJ *', 'cnpj', '00.000.000/0000-00')}
              {campo('Razão Social *', 'razao_social')}
              {campo('Representante', 'representante', 'Nome do representante legal')}
              {campo('CPF do Representante', 'cpf_representante', '000.000.000-00')}
            </div>
          </section>
          <section className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Endereço e contato
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">{campo('Endereço', 'endereco')}</div>
              {campo('Cidade', 'cidade')}
              {campo('Estado', 'estado', 'São Paulo')}
              {campo('UF', 'uf', 'SP')}
              {campo('Telefone', 'telefone')}
              {campo('E-mail', 'email', 'contato@empresa.com')}
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
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
