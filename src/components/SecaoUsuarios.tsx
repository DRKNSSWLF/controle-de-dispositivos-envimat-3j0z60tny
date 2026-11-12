import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usuariosService, type ContaUsuario } from '@/services/adminService'
import { useAuth } from '@/lib/auth'
import { UserPlus, ShieldCheck, Shield, RefreshCw, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

const DOMINIO_EMPRESA = '@envimat.com.br'

const emailCorporativoValido = (email: string) =>
  email.trim().toLowerCase().endsWith(DOMINIO_EMPRESA)

const NIVEIS = [
  { valor: 'master', rotulo: 'Master — acesso total' },
  { valor: 'admin', rotulo: 'Administrativo — cadastros e vínculos' },
] as const

export function SecaoUsuarios() {
  const { usuario: usuarioLogado } = useAuth()
  const [usuarios, setUsuarios] = useState<ContaUsuario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [nivel, setNivel] = useState<string>('admin')
  const [senha, setSenha] = useState('')

  const carregar = async () => {
    setCarregando(true)
    try {
      const lista = await usuariosService.listar()
      setUsuarios(lista)
    } catch (e) {
      toast({
        title: 'Erro ao carregar usuários',
        description: e instanceof Error ? e.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const limparFormulario = () => {
    setNome('')
    setEmail('')
    setNivel('admin')
    setSenha('')
  }

  const criarUsuario = async () => {
    const emailLimpo = email.trim().toLowerCase()
    if (!nome.trim()) {
      toast({ title: 'Informe o nome completo', variant: 'destructive' })
      return
    }
    if (!emailCorporativoValido(emailLimpo)) {
      toast({
        title: 'E-mail inválido',
        description: `O acesso é permitido apenas para e-mails corporativos ${DOMINIO_EMPRESA}.`,
        variant: 'destructive',
      })
      return
    }
    if (senha.length < 8) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha inicial deve ter pelo menos 8 caracteres.',
        variant: 'destructive',
      })
      return
    }

    setSalvando(true)
    try {
      await usuariosService.criar(nome.trim(), emailLimpo, nivel as ContaUsuario['nivel'], senha)
      toast({
        title: 'Usuário criado',
        description: `${nome.trim()} já pode acessar com o e-mail ${emailLimpo} e a senha definida. Oriente a troca da senha no primeiro acesso.`,
      })
      limparFormulario()
      setDialogAberto(false)
      carregar()
    } catch (e) {
      toast({
        title: 'Erro ao criar usuário',
        description: e instanceof Error ? e.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const trocarNivel = async (usuario: ContaUsuario, novoNivel: string) => {
    if (novoNivel === usuario.nivel) return
    try {
      await usuariosService.alterarNivel(usuario.id, novoNivel as ContaUsuario['nivel'])
      toast({ title: 'Nível atualizado', description: `${usuario.nome} agora é ${novoNivel}.` })
      carregar()
    } catch (e) {
      toast({
        title: 'Erro ao atualizar nível',
        description: e instanceof Error ? e.message : 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-emerald-100 bg-white shadow-sm rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif italic text-lg text-emerald-950">
              Controle de acesso à ferramenta
            </h3>
            <p className="text-xs text-emerald-700/80 mt-0.5">
              Somente e-mails corporativos {DOMINIO_EMPRESA} podem acessar. Nível Master tem acesso
              total; Administrativo, aos cadastros e vínculos.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={carregar}
              disabled={carregando}
              className="border-emerald-200 text-emerald-800 rounded-xl text-xs h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${carregando ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs h-9">
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl border-emerald-100 sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif italic text-xl text-emerald-950">
                    Incluir pessoa com acesso
                  </DialogTitle>
                  <DialogDescription className="text-xs text-emerald-700/80">
                    Cadastre um novo usuário da ferramenta com e-mail corporativo e nível de
                    permissão.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-emerald-800">Nome completo</Label>
                    <Input
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Nome da pessoa"
                      className="rounded-xl border-emerald-200 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-emerald-800">E-mail corporativo</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={`nome${DOMINIO_EMPRESA}`}
                      className="rounded-xl border-emerald-200 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-emerald-800">Nível de permissão</Label>
                    <Select value={nivel} onValueChange={setNivel}>
                      <SelectTrigger className="rounded-xl border-emerald-200 text-sm">
                        <SelectValue placeholder="Selecione o nível" />
                      </SelectTrigger>
                      <SelectContent>
                        {NIVEIS.map((n) => (
                          <SelectItem key={n.valor} value={n.valor}>
                            {n.rotulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-emerald-800">Senha inicial</Label>
                    <Input
                      type="text"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Mínimo de 8 caracteres"
                      className="rounded-xl border-emerald-200 text-sm"
                    />
                    <p className="text-[11px] text-emerald-700/60">
                      Compartilhe a senha inicial por um canal seguro e oriente a troca.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setDialogAberto(false)}
                      className="rounded-xl border-emerald-200 text-emerald-800 text-sm"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={criarUsuario}
                      disabled={salvando}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm"
                    >
                      {salvando ? 'Salvando...' : 'Criar Usuário'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {carregando && usuarios.length === 0 ? (
          <div className="bg-white rounded-3xl border border-emerald-100 p-12 text-center">
            <p className="text-sm text-emerald-700">Carregando usuários...</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="bg-white rounded-3xl border border-emerald-100 p-12 text-center">
            <AlertCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm text-emerald-700">Nenhum usuário listado.</p>
          </div>
        ) : (
          usuarios.map((u) => {
            const ehProprio = u.id === usuarioLogado?.id
            return (
              <Card key={u.id} className="rounded-2xl shadow-sm border border-emerald-200 bg-white">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        u.nivel === 'master'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {u.nivel === 'master' ? (
                        <ShieldCheck className="w-4.5 h-4.5" />
                      ) : (
                        <Shield className="w-4.5 h-4.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-emerald-950">{u.nome}</span>
                        {ehProprio && (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px]">
                            você
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-emerald-800/80 mt-0.5 truncate">{u.email}</p>
                      <p className="text-[11px] text-emerald-700/60 mt-0.5">
                        {u.created
                          ? `Criado em ${new Date(u.created).toLocaleDateString('pt-BR')}`
                          : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={u.nivel}
                      onValueChange={(v) => trocarNivel(u, v)}
                      disabled={ehProprio}
                    >
                      <SelectTrigger className="w-[220px] h-9 rounded-xl border-emerald-200 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NIVEIS.map((n) => (
                          <SelectItem key={n.valor} value={n.valor}>
                            {n.rotulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
