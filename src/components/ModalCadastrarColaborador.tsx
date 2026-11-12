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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Colaborador, NovoColaboradorInput } from '@/types/inventory'
import { colaboradoresService } from '@/services/inventoryService'
import { LABEL_ESTADO_CIVIL } from '@/lib/labels'
import { mascararCPF, validarCPF, somenteDigitos } from '@/lib/validacoes'
import { UserPlus } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ModalCadastrarColaboradorProps {
  onColaboradorSalvo: () => void
  triggerButton?: React.ReactNode
  /** Quando informado, o modal abre em MODO EDIÇÃO com os campos pré-preenchidos. */
  colaboradorEmEdicao?: Colaborador | null
  /** Chamado quando o diálogo fecha (salvou ou cancelou) para o pai limpar o modo edição. */
  onFechou?: () => void
}

const VAZIO: NovoColaboradorInput = {
  nome: '',
  nacionalidade: 'Brasileiro(a)',
  estado_civil: '',
  documento_identidade: '',
  emissor_documento: '',
  cpf: '',
  endereco: '',
  cidade: '',
  departamento: '',
  cargo: '',
  email: '',
  telefone: '',
  matricula: '',
  observacoes: '',
  status: 'ativo',
}

/** Dialog de cadastro/edição de Colaborador. Na listagem (aba Colaboradores)
 *  é reutilizado em modo edição com os campos pré-preenchidos. O CPF tem
 *  máscara de digitação e validação do dígito verificador (Receita Federal).
 *  O campo Estado/UF foi removido a pedido do usuário (cidade permanece). */
export function ModalCadastrarColaborador({
  onColaboradorSalvo,
  triggerButton,
  colaboradorEmEdicao,
  onFechou,
}: ModalCadastrarColaboradorProps) {
  const editando = !!colaboradorEmEdicao
  const [abertoNovo, setAbertoNovo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [formulario, setFormulario] = useState<NovoColaboradorInput>({ ...VAZIO })

  // No modo edição, o diálogo é controlado pelo pai (basta passar colaboradorEmEdicao).
  const aberto = editando ? true : abertoNovo

  // Preenche o formulário ao entrar em modo edição.
  useEffect(() => {
    if (colaboradorEmEdicao) {
      setFormulario({
        nome: colaboradorEmEdicao.nome || '',
        nacionalidade: colaboradorEmEdicao.nacionalidade || 'Brasileiro(a)',
        estado_civil: colaboradorEmEdicao.estado_civil || '',
        documento_identidade: colaboradorEmEdicao.documento_identidade || '',
        emissor_documento: colaboradorEmEdicao.emissor_documento || '',
        cpf: colaboradorEmEdicao.cpf ? mascararCPF(colaboradorEmEdicao.cpf) : '',
        endereco: colaboradorEmEdicao.endereco || '',
        cidade: colaboradorEmEdicao.cidade || '',
        departamento: colaboradorEmEdicao.departamento || '',
        cargo: colaboradorEmEdicao.cargo || '',
        email: colaboradorEmEdicao.email || '',
        telefone: colaboradorEmEdicao.telefone || '',
        matricula: colaboradorEmEdicao.matricula || '',
        observacoes: colaboradorEmEdicao.observacoes || '',
        status: colaboradorEmEdicao.status || 'ativo',
      })
    } else {
      setFormulario({ ...VAZIO })
    }
  }, [colaboradorEmEdicao])

  const fechar = () => {
    if (!editando) setAbertoNovo(false)
    onFechou?.()
  }

  const set = (campo: keyof NovoColaboradorInput, valor: string) =>
    setFormulario((f) => ({ ...f, [campo]: valor }))

  const salvar = async () => {
    if (!formulario.nome.trim()) {
      toast({ title: 'Informe o nome completo', variant: 'destructive' })
      return
    }
    // Validação do dígito verificador do CPF — bloqueia o salvamento
    if (formulario.cpf?.trim() && !validarCPF(formulario.cpf)) {
      toast({
        title: 'CPF inválido',
        description:
          'O CPF informado não passa na validação dos dígitos verificadores da Receita Federal. Corrija antes de salvar.',
        variant: 'destructive',
      })
      return
    }
    setSalvando(true)
    try {
      if (editando && colaboradorEmEdicao) {
        await colaboradoresService.atualizar(colaboradorEmEdicao.id, formulario)
        toast({
          title: 'Colaborador atualizado',
          description: `${formulario.nome} foi atualizado com sucesso.`,
        })
      } else {
        await colaboradoresService.criar(formulario)
        toast({ title: 'Colaborador cadastrado', description: 'Status inicial: ATIVO' })
      }
      setSalvando(false)
      fechar()
      onColaboradorSalvo()
    } catch (e) {
      setSalvando(false)
      toast({
        title: 'Erro ao salvar',
        description: e instanceof Error ? e.message : 'Tente novamente',
        variant: 'destructive',
      })
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

  const corpo = (
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border-emerald-100">
      <DialogHeader>
        <DialogTitle className="font-serif italic text-xl text-emerald-950">
          {editando ? 'Editar Colaborador' : 'Cadastrar Colaborador'}
        </DialogTitle>
        <DialogDescription className="text-xs text-emerald-700">
          {editando
            ? 'Altere os campos necessários e salve. O histórico permanece preservado.'
            : 'Dados completos exigidos pelo contrato de comodato. Todo colaborador começa como ATIVO.'}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5">
        <section className="space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Identificação (contrato)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {campo('Nome completo *', 'nome')}
            <div className="space-y-1">
              <Label className="text-xs text-emerald-800">CPF</Label>
              <Input
                value={formulario.cpf || ''}
                onChange={(e) => set('cpf', mascararCPF(e.target.value))}
                placeholder="000.000.000-00"
                className="rounded-xl border-emerald-200 text-sm"
              />
            </div>
            {formulario.cpf &&
              somenteDigitos(formulario.cpf).length === 11 &&
              !validarCPF(formulario.cpf) && (
                <p className="sm:col-span-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                  CPF inválido: os dígitos verificadores não conferem.
                </p>
              )}
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
            {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Salvar Colaborador'}
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
          <Button className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs h-9">
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            Novo Colaborador
          </Button>
        )}
      </DialogTrigger>
      {corpo}
    </Dialog>
  )
}
