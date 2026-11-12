import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Leaf, Lock, Mail, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth'

export default function TelaLogin() {
  const { entrar } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const submeter = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (!email.trim() || !senha) {
      setErro('Informe o e-mail corporativo e a senha.')
      return
    }

    setEnviando(true)
    try {
      await entrar(email, senha)
      // Se chegou aqui, o authStore foi atualizado e o App re-renderiza a área logada.
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Não foi possível entrar. Verifique seus dados.'
      setErro(msg)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fafcf9] via-emerald-50 to-emerald-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur rounded-3xl border border-emerald-100 shadow-[0_8px_30px_rgba(20,50,30,0.08)] p-8">
          <div className="flex flex-col items-center text-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center shadow-sm">
              <Leaf className="w-7 h-7 text-emerald-200" />
            </div>
            <span className="font-extrabold tracking-wider text-xs uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 font-mono">
              ENVIMAT
            </span>
            <h1 className="font-serif italic text-2xl text-emerald-950 leading-tight">
              Controle de Dispositivos e Comodato
            </h1>
            <p className="text-xs text-emerald-700/80 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Acesso restrito a e-mails corporativos @envimat.com.br
            </p>
          </div>

          <form onSubmit={submeter} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-xs font-medium text-emerald-900">
                E-mail corporativo
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  placeholder="nome@envimat.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 rounded-xl border-emerald-200 focus-visible:ring-emerald-600"
                  disabled={enviando}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-senha" className="text-xs font-medium text-emerald-900">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                <Input
                  id="login-senha"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="pl-9 rounded-xl border-emerald-200 focus-visible:ring-emerald-600"
                  disabled={enviando}
                />
              </div>
            </div>

            {erro && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700 leading-relaxed">{erro}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={enviando}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl h-11"
            >
              {enviando ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <p className="mt-6 text-center text-[11px] text-emerald-700/60 leading-relaxed">
            Não há auto-cadastro. Para obter acesso, procure um usuário com nível{' '}
            <span className="font-semibold text-emerald-800">Master</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
