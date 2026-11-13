import { useEffect, useState } from 'react'
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
import { NovaPessoaJuridicaInput, PessoaJuridica } from '@/types/inventory'
import { pessoasJuridicasService } from '@/services/inventoryService'
import {
  mascararCNPJ,
  mascararCPF,
  validarCNPJ,
  validarCPF,
  somenteDigitos,
} from '@/lib/validacoes'
import { Plus } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ModalCadastrarPessoaJuridicaProps {
  onSalvo: () => void
  triggerButton?: React.ReactNode
  /** Quando informado, o modal abre em MODO EDIÇÃO com os campos pré-preenchidos. */
  pessoaEmEdicao?: PessoaJuridica | null
  /** Chamado sempre que o diálogo fecha (salvou ou cancelou) para o pai limpar o modo edição. */
  onFechou?: () => void
}

const VAZIO: NovaPessoaJuridicaInput = {
  cnpj: '',
  razao_social: '',
  representante: '',
  cpf_representante: '',
  endereco: '',
  cidade: '',
  telefone: '',
  email: '',
  observacoes: '',
}

/** Dialog de cadastro/edição de Pessoa Jurídica. Na listagem (aba Pessoas
 *  Jurídicas) é reutilizado em modo edição com os campos pré-preenchidos.
 *  CNPJ e CPF do representante têm máscara de digitação e validação do
 *  dígito verificador (Receita Federal) — cadastro inválido é bloqueado.
 *  O campo Estado/UF foi removido a pedido do usuário (cidade permanece). */
export function ModalCadastrarPessoaJuridica({
  onSalvo,
  triggerButton,
  pessoaEmEdicao,
  onFechou,
}: ModalCadastrarPessoaJuridicaProps) {
  const editando = !!pessoaEmEdicao
  const [abertoNovo, setAbertoNovo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [formulario, setFormulario] = useState<NovaPessoaJuridicaInput>({ ...VAZIO })

  // No modo edição, o diálogo é controlado pelo pai (basta passar pessoaEmEdicao).
  const aberto = editando ? true : abertoNovo

  // Preenche o formulário ao entrar em modo edição.
  useEffect(() => {
    if (pessoaEmEdicao) {
      setFormulario({
        cnpj: mascararCNPJ(pessoaEmEdicao.cnpj || ''),
        razao_social: pessoaEmEdicao.razao_social || '',
        representante: pessoaEmEdicao.representante || '',
        cpf_representante: pessoaEmEdicao.cpf_representante
          ? mascararCPF(pessoaEmEdicao.cpf_representante)
          : '',
        endereco: pessoaEmEdicao.endereco || '',
        cidade: pessoaEmEdicao.cidade || '',
        telefone: pessoaEmEdicao.telefone || '',
        email: pessoaEmEdicao.email || '',
        observacoes: pessoaEmEdicao.observacoes || '',
      })
    } else {
      setFormulario({ ...VAZIO })
    }
  }, [pessoaEmEdicao])

  const fechar = () => {
    if (!editando) setAbertoNovo(false)
    onFechou?.()
  }

  const set = (campo: keyof NovaPessoaJuridicaInput, valor: string) =>
    setFormulario((f) => ({ ...f, [campo]: valor }))

  const salvar = async () => {
    if (!formulario.cnpj.trim() || !formulario.razao_social.trim()) {
      toast({ title: 'CNPJ e Razão Social são obrigatórios', variant: 'destructive' })
      return
    }
    // Validação dos dígitos verificadores — bloqueia o salvamento
    if (!validarCNPJ(formulario.cnpj)) {
      toast({
        title: 'CNPJ inválido',
        description:
          'O CNPJ informado não passa na validação dos dígitos verificadores da Receita Federal. Corrija antes de salvar.',
        variant: 'destructive',
      })
      return
    }
    if (formulario.cpf_representante?.trim() && !validarCPF(formulario.cpf_representante)) {
      toast({
        title: 'CPF do representante inválido',
        description:
          'O CPF informado não passa na validação dos dígitos verificadores da Receita Federal. Corrija antes de salvar.',
        variant: 'destructive',
      })
      return
    }
    setSalvando(true)
    try {
      if (editando && pessoaEmEdicao) {
        await pessoasJuridicasService.atualizar(pessoaEmEdicao.id, formulario)
        toast({
          title: 'Pessoa jurídica atualizada',
          description: `${formulario.razao_social} foi atualizada com sucesso.`,
        })
      } else {
        await pessoasJuridicasService.criar(formulario)
        toast({ title: 'Pessoa jurídica cadastrada' })
      }
      setSalvando(false)
      fechar()
      onSalvo()
    } catch (e) {
      setSalvando(false)
      toast({
        title: 'Erro ao salvar',
        description: e instanceof Error ? e.message : 'Tente novamente',
        variant: 'destructive',
      })
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

  const corpo = (
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border-emerald-100">
      <DialogHeader>
        <DialogTitle className="font-sans font-semibold text-xl text-emerald-950">
          {editando ? 'Editar Pessoa Jurídica' : 'Cadastrar Pessoa Jurídica'}
        </DialogTitle>
        <DialogDescription className="text-xs text-emerald-700">
          {editando
            ? 'Altere os campos necessários e salve. O histórico permanece preservado.'
            : 'Empresas prestadoras de serviço (mão de obra PJ) que utilizam dispositivos da ENVIMAT.'}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-5">
        <section className="space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Identificação
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-emerald-800">CNPJ *</Label>
              <Input
                value={formulario.cnpj || ''}
                onChange={(e) => set('cnpj', mascararCNPJ(e.target.value))}
                placeholder="00.000.000/0000-00"
                className="rounded-xl border-emerald-200 text-sm"
              />
            </div>
            {campo('Razão Social *', 'razao_social')}
            {campo('Representante', 'representante', 'Nome do representante legal')}
            <div className="space-y-1">
              <Label className="text-xs text-emerald-800">CPF do Representante</Label>
              <Input
                value={formulario.cpf_representante || ''}
                onChange={(e) => set('cpf_representante', mascararCPF(e.target.value))}
                placeholder="000.000.000-00"
                className="rounded-xl border-emerald-200 text-sm"
              />
            </div>
          </div>
          {formulario.cnpj &&
            somenteDigitos(formulario.cnpj).length === 14 &&
            !validarCNPJ(formulario.cnpj) && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                CNPJ inválido: os dígitos verificadores não conferem.
              </p>
            )}
          {formulario.cpf_representante &&
            somenteDigitos(formulario.cpf_representante).length === 11 &&
            !validarCPF(formulario.cpf_representante) && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                CPF do representante inválido: os dígitos verificadores não conferem.
              </p>
            )}
        </section>
        <section className="space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Endereço e contato
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">{campo('Endereço', 'endereco')}</div>
            {campo('Cidade', 'cidade')}
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
            onClick={fechar}
            className="rounded-xl border-emerald-200 text-emerald-800 text-sm"
          >
            Cancelar
          </Button>
          <Button
            onClick={salvar}
            disabled={salvando}
            className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm"
          >
            {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Salvar'}
          </Button>
        </div>
      </div>
    </DialogContent>
  )

  // Modo edição: diálogo controlado pelo pai, sem botão de disparo.
  if (editando) {
    return (
      <Dialog open onOpenChange={(v) => !v && fechar()}>
        {corpo}
      </Dialog>
    )
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => (v ? setAbertoNovo(true) : fechar())}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs h-9 w-full">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Nova Pessoa Jurídica
          </Button>
        )}
      </DialogTrigger>
      {corpo}
    </Dialog>
  )
}
