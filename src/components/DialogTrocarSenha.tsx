import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { usuariosService } from '@/services/adminService'
import { useAuth } from '@/lib/auth'
import { KeyRound } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface DialogTrocarSenhaProps {
  aberto: boolean
  onAbrir: (aberto: boolean) => void
}

/** Diálogo para o usuário Administrativo trocar a PRÓPRIA senha (exige a senha atual). */
export function DialogTrocarSenha({ aberto, onAbrir }: DialogTrocarSenhaProps) {
  const { usuario } = useAuth()
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [salvando, setSalvando] = useState(false)

  const fechar = () => {
    setSenhaAtual('')
    setNovaSenha('')
    setConfirmacao('')
    onAbrir(false)
  }

  const salvar = async () => {
    if (!senhaAtual || !novaSenha) {
      toast({
        title: 'Preencha os campos',
        description: 'Informe a senha atual e a nova senha.',
        variant: 'destructive',
      })
      return
    }
    if (novaSenha.length < 8) {
      toast({
        title: 'Senha muito curta',
        description: 'A nova senha deve ter pelo menos 8 caracteres.',
        variant: 'destructive',
      })
      return
    }
    if (novaSenha !== confirmacao) {
      toast({
        title: 'As senhas não coincidem',
        description: 'Confirme a nova senha digitando-a novamente.',
        variant: 'destructive',
      })
      return
    }

    setSalvando(true)
    try {
      if (!usuario) throw new Error('Sessão expirada. Faça login novamente.')
      await usuariosService.trocarSenha(usuario.id, novaSenha, senhaAtual)
      toast({
        title: 'Senha alterada com sucesso',
        description: 'Use a nova senha no próximo login.',
      })
      fechar()
    } catch (e) {
      toast({
        title: 'Erro ao trocar a senha',
        description:
          e instanceof Error
            ? e.message.includes('Failed to authenticate') ||
              e.message.includes('oldPassword') ||
              e.message.includes('validate')
              ? 'A senha atual informada não está correta.'
              : e.message
            : 'Verifique a senha atual e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onAbrir}>
      <DialogContent className="max-w-md rounded-3xl border-emerald-100">
        <DialogHeader>
          <DialogTitle className="font-serif italic text-xl text-emerald-950 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-700" />
            Trocar minha senha
          </DialogTitle>
          <DialogDescription className="text-xs text-emerald-700">
            Para sua segurança, informe a senha atual para definir uma nova.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="senha-atual" className="text-xs text-emerald-800">
              Senha atual *
            </Label>
            <Input
              id="senha-atual"
              type="password"
              autoComplete="current-password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              className="rounded-xl border-emerald-200 text-sm"
              disabled={salvando}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nova-senha" className="text-xs text-emerald-800">
              Nova senha *
            </Label>
            <Input
              id="nova-senha"
              type="password"
              autoComplete="new-password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="rounded-xl border-emerald-200 text-sm"
              disabled={salvando}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirmar-senha" className="text-xs text-emerald-800">
              Confirmar nova senha *
            </Label>
            <Input
              id="confirmar-senha"
              type="password"
              autoComplete="new-password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              className="rounded-xl border-emerald-200 text-sm"
              disabled={salvando}
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            onClick={fechar}
            disabled={salvando}
            className="rounded-xl border-emerald-200 text-emerald-800"
          >
            Cancelar
          </Button>
          <Button
            onClick={salvar}
            disabled={salvando}
            className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl"
          >
            {salvando ? 'Salvando...' : 'Trocar senha'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
