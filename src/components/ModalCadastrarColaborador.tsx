import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { colaboradoresService } from '@/services/inventoryService'
import { NovoColaboradorInput } from '@/types/inventory'
import { UserPlus, Save } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ModalCadastrarColaboradorProps {
  onColaboradorSalvo: () => void
  triggerButton?: React.ReactNode
}

export function ModalCadastrarColaborador({
  onColaboradorSalvo,
  triggerButton,
}: ModalCadastrarColaboradorProps) {
  const [open, setOpen] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const [nome, setNome] = useState('')
  const [departamento, setDepartamento] = useState('')
  const [cargo, setCargo] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [matricula, setMatricula] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const resetForm = () => {
    setNome('')
    setDepartamento('')
    setCargo('')
    setEmail('')
    setTelefone('')
    setMatricula('')
    setObservacoes('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite o nome completo do colaborador.',
        variant: 'destructive',
      })
      return
    }

    setSalvando(true)
    try {
      const payload: NovoColaboradorInput = {
        nome: nome.trim(),
        departamento: departamento.trim(),
        cargo: cargo.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        matricula: matricula.trim(),
        observacoes: observacoes.trim(),
      }

      await colaboradoresService.criar(payload)
      setSalvando(false)
      setOpen(false)
      resetForm()

      toast({
        title: 'Colaborador cadastrado!',
        description: `${nome} foi adicionado à base de colaboradores da ENVIMAT.`,
      })

      onColaboradorSalvo()
    } catch (err) {
      setSalvando(false)
      toast({
        title: 'Erro ao cadastrar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button
            variant="outline"
            className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-xl"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Colaborador
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-3xl border-emerald-100 p-6">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-4">
            <DialogTitle className="font-serif italic text-2xl text-emerald-950 font-normal">
              Cadastrar Colaborador
            </DialogTitle>
            <DialogDescription className="text-emerald-800/80">
              Adicione o colaborador para vinculação de comodatos na ENVIMAT.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nomeColab" className="text-xs font-semibold text-emerald-950">
                Nome Completo *
              </Label>
              <Input
                id="nomeColab"
                placeholder="Ex.: Carlos Eduardo Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="rounded-xl border-emerald-200 focus:ring-emerald-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="depto" className="text-xs font-semibold text-emerald-950">
                  Departamento / Área
                </Label>
                <Input
                  id="depto"
                  placeholder="Ex.: Operações"
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                  className="rounded-xl border-emerald-200 focus:ring-emerald-600"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cargo" className="text-xs font-semibold text-emerald-950">
                  Cargo / Função
                </Label>
                <Input
                  id="cargo"
                  placeholder="Ex.: Supervisor"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className="rounded-xl border-emerald-200 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-emerald-950">
                  E-mail Corporativo
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="carlos@envimat.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-emerald-200 focus:ring-emerald-600"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefone" className="text-xs font-semibold text-emerald-950">
                  Telefone / WhatsApp
                </Label>
                <Input
                  id="telefone"
                  placeholder="(16) 99712-3401"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="rounded-xl border-emerald-200 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="matricula" className="text-xs font-semibold text-emerald-950">
                Matrícula / Código Interno
              </Label>
              <Input
                id="matricula"
                placeholder="Ex.: ENV-0104"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                className="rounded-xl border-emerald-200 focus:ring-emerald-600 font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="obs" className="text-xs font-semibold text-emerald-950">
                Observações
              </Label>
              <Textarea
                id="obs"
                rows={2}
                placeholder="Unidade, ponto de contato..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="rounded-xl border-emerald-200 focus:ring-emerald-600"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-emerald-100 flex items-center justify-between sm:justify-between">
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
              {salvando ? 'Salvando...' : 'Salvar Colaborador'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
