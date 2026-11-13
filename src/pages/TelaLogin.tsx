import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Mail, ShieldCheck, AlertCircle, KeyRound, ArrowLeft, MailCheck } from 'lucide-react'
import { useAuth, DOMINIO_EMPRESA } from '@/lib/auth'
import { BotaoAlternarTema, useTema } from '@/hooks/use-tema'
import logoEnvimatClaro from '@/assets/logoenvimat-finalfb05-034a1.jpg'
import logoEnvimatEscuro from '@/assets/logoenvimat-finalfvmodo-escuro-bc529.png'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'

type Visao = 'login' | 'esqueci' | 'esqueci-enviado'

export default function TelaLogin() {
  const { entrar } = useAuth()
  const { tema } = useTema()
  const [visao, setVisao] = useState<Visao>('login')
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

  const pedirRedefinicao = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)

    const emailTrim = email.trim().toLowerCase()
    if (!emailTrim || !emailTrim.endsWith('@' + DOMINIO_EMPRESA)) {
      setErro(`Informe um e-mail corporativo @${DOMINIO_EMPRESA}.`)
      return
    }

    setEnviando(true)
    try {
      await pb.collection('users').requestPasswordReset(emailTrim)
      setVisao('esqueci-enviado')
    } catch {
      // Sem SMTP configurado o backend ainda responde ao pedido (o envio em si
      // falha depois, nos logs) — não revela se o e-mail existe ou não.
      setVisao('esqueci-enviado')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F2F2] dark:bg-[#0b1a12] p-4">
      <div className="w-full max-w-md">
        {/* Seletor de tema claro/escuro (persiste em localStorage) */}
        <div className="flex justify-end mb-3">
          <BotaoAlternarTema />
        </div>
        <div className="bg-white/90 dark:bg-white/90 backdrop-blur rounded-3xl border border-emerald-100 dark:border-emerald-800/60 shadow-[0_8px_30px_rgba(10,68,33,0.08)] p-8">
          <div className="flex flex-col items-center text-center gap-3 mb-8">
            <img
              src={tema === 'escuro' ? logoEnvimatEscuro : logoEnvimatClaro}
              alt="ENVIMAT — Environment & Material Handling"
              className="h-12 w-auto"
            />
            <h1 className="font-sans font-semibold text-2xl text-emerald-950 dark:text-emerald-dark-800 leading-tight tracking-tight">
              Controle de Dispositivos e Comodato
            </h1>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-dark-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Acesso restrito a e-mails corporativos @envimat.com.br
            </p>
          </div>

          {visao === 'esqueci-enviado' ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <MailCheck className="w-7 h-7 text-emerald-700" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-sans font-semibold text-xl text-emerald-950">
                  Verifique seu e-mail
                </h2>
                <p className="text-xs text-emerald-800/80 leading-relaxed">
                  Se existir uma conta para <strong>{email}</strong>, você receberá em instantes um
                  link para definir uma nova senha. O link vale por pouco tempo — se não chegar,
                  verifique a caixa de spam ou tente novamente.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setVisao('login')
                  setErro(null)
                }}
                className="w-full rounded-xl border-emerald-200 text-emerald-800 hover:bg-emerald-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para o login
              </Button>
            </div>
          ) : visao === 'esqueci' ? (
            <form onSubmit={pedirRedefinicao} className="space-y-4">
              <div className="space-y-1.5">
                <h2 className="font-sans font-semibold text-xl text-emerald-950 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-emerald-700" />
                  Esqueci minha senha
                </h2>
                <p className="text-xs text-emerald-700/80 leading-relaxed">
                  Informe o e-mail corporativo e enviaremos um link para você definir uma nova
                  senha.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reset-email" className="text-xs font-medium text-emerald-900">
                  E-mail corporativo
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                  <Input
                    id="reset-email"
                    type="email"
                    autoComplete="username"
                    placeholder={`nome@${DOMINIO_EMPRESA}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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

              <div className="space-y-2 pt-1">
                <Button
                  type="submit"
                  disabled={enviando}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl h-11"
                >
                  {enviando ? 'Enviando...' : 'Enviar link de redefinição'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setVisao('login')
                    setErro(null)
                  }}
                  className="w-full rounded-xl text-emerald-800 hover:bg-emerald-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para o login
                </Button>
              </div>
            </form>
          ) : (
            <>
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

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setVisao('esqueci')
                    setErro(null)
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
                >
                  Esqueci minha senha
                </button>
              </div>
            </>
          )}

          <p className="mt-6 text-center text-[11px] text-emerald-700/60 leading-relaxed">
            Não há auto-cadastro. Para obter acesso, procure um usuário com nível{' '}
            <span className="font-semibold text-emerald-800">Master</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
