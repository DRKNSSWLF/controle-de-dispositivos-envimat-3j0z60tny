import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { logsService, type LogAcesso } from '@/services/adminService'
import { formatarData } from '@/lib/format'
import { ScrollText, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export function SecaoLogs() {
  const [logs, setLogs] = useState<LogAcesso[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')

  const carregar = async () => {
    setCarregando(true)
    try {
      const lista = await logsService.listar()
      setLogs(lista)
    } catch (e) {
      toast({
        title: 'Erro ao carregar logs',
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

  const listaFiltrada = useMemo(() => {
    if (!busca.trim()) return logs
    const q = busca.toLowerCase()
    return logs.filter(
      (l) =>
        l.email.toLowerCase().includes(q) ||
        (l.expand?.usuario?.nome || '').toLowerCase().includes(q),
    )
  }, [logs, busca])

  const totalSucesso = logs.filter((l) => l.resultado === 'sucesso').length
  const totalFalha = logs.filter((l) => l.resultado === 'falha').length

  return (
    <div className="space-y-4">
      <Card className="border-emerald-100 bg-white shadow-sm rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-sans font-semibold text-lg text-emerald-950">Logs de Acesso</h3>
              <p className="text-xs text-emerald-700/80 mt-0.5">
                Registro de cada tentativa de login: usuário, data/hora e resultado.
              </p>
            </div>
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
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar por e-mail ou nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="rounded-xl border-emerald-200 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[11px]">
                <ShieldCheck className="w-3 h-3 mr-1" />
                {totalSucesso} sucesso{totalSucesso === 1 ? '' : 's'}
              </Badge>
              <Badge className="bg-red-100 text-red-800 border border-red-200 rounded-full text-[11px]">
                <ShieldAlert className="w-3 h-3 mr-1" />
                {totalFalha} falha{totalFalha === 1 ? '' : 's'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {carregando && logs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-emerald-100 p-12 text-center">
            <p className="text-sm text-emerald-700">Carregando logs...</p>
          </div>
        ) : listaFiltrada.length === 0 ? (
          <div className="bg-white rounded-3xl border border-emerald-100 p-12 text-center">
            <ScrollText className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm text-emerald-700">Nenhum registro de acesso encontrado.</p>
          </div>
        ) : (
          listaFiltrada.map((log) => {
            const sucesso = log.resultado === 'sucesso'
            return (
              <Card
                key={log.id}
                className={`rounded-2xl shadow-sm border ${
                  sucesso ? 'bg-white border-emerald-100' : 'bg-red-50/50 border-red-200'
                }`}
              >
                <CardContent className="p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-emerald-950 truncate">
                        {log.expand?.usuario?.nome || log.email || '(sem e-mail)'}
                      </span>
                      <Badge
                        className={
                          sucesso
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200 rounded-full text-[10px]'
                            : 'bg-red-100 text-red-800 border-red-200 rounded-full text-[10px]'
                        }
                      >
                        {sucesso ? 'Sucesso' : 'Falha'}
                      </Badge>
                    </div>
                    <p className="text-xs text-emerald-800/80 mt-0.5 truncate">{log.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-emerald-900">{formatarData(log.criado_em)}</p>
                    {log.ip && (
                      <p className="text-[11px] text-emerald-700/60 mt-0.5">IP {log.ip}</p>
                    )}
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
