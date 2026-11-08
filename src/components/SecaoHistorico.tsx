import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { HistoricoMovimentacao } from '@/types/inventory'
import { LABEL_TIPO_EVENTO } from '@/lib/labels'
import { formatarData } from '@/lib/format'
import { ArrowLeftRight, Search, Filter } from 'lucide-react'

interface SecaoHistoricoProps {
  historico: HistoricoMovimentacao[]
}

export function SecaoHistorico({ historico }: SecaoHistoricoProps) {
  const [busca, setBusca] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos')

  const tiposPresentes = useMemo(() => {
    const set = new Set(historico.map((h) => h.tipo_evento))
    return Array.from(set)
  }, [historico])

  const listaFiltrada = useMemo(() => {
    let lista = historico
    if (tipoFiltro !== 'todos') lista = lista.filter((h) => h.tipo_evento === tipoFiltro)
    if (busca.trim()) {
      const q = busca.toLowerCase()
      lista = lista.filter((h) => {
        const disp = h.expand?.dispositivo
        const colab = h.expand?.colaborador
        return (
          `${disp?.fabricante} ${disp?.modelo} ${disp?.numero_serie}`.toLowerCase().includes(q) ||
          (colab?.nome || '').toLowerCase().includes(q) ||
          (h.descricao || '').toLowerCase().includes(q) ||
          (h.motivo || '').toLowerCase().includes(q)
        )
      })
    }
    return lista
  }, [historico, busca, tipoFiltro])

  const iconeCor = (tipo: string) => {
    if (tipo === 'vinculo') return 'bg-emerald-100 text-emerald-800'
    if (tipo === 'desvinculo_desligamento') return 'bg-rose-100 text-rose-800'
    if (tipo === 'envio_manutencao') return 'bg-amber-100 text-amber-800'
    if (tipo === 'retorno_manutencao') return 'bg-sky-100 text-sky-800'
    return 'bg-stone-100 text-stone-700'
  }

  return (
    <div className="space-y-4">
      <Card className="border-emerald-100 bg-white shadow-sm rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-700/60" />
            <Input
              placeholder="Buscar por dispositivo, colaborador, motivo ou descrição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 rounded-xl border-emerald-200 text-sm"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-emerald-700" />
            <button
              onClick={() => setTipoFiltro('todos')}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                tipoFiltro === 'todos'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'text-emerald-800 border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              Todos
            </button>
            {tiposPresentes.map((t) => (
              <button
                key={t}
                onClick={() => setTipoFiltro(t)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  tipoFiltro === t
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                {LABEL_TIPO_EVENTO[t] || t}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {listaFiltrada.length === 0 ? (
          <div className="bg-white rounded-3xl border border-emerald-100 p-12 text-center">
            <ArrowLeftRight className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-base font-semibold text-emerald-950">
              Nenhum registro no histórico
            </h4>
            <p className="text-xs text-emerald-700 mt-1">
              Toda movimentação — vínculo, devolução, manutenção e cadastro — aparece aqui
              automaticamente e nunca é apagada.
            </p>
          </div>
        ) : (
          listaFiltrada.map((h) => {
            const disp = h.expand?.dispositivo
            const colab = h.expand?.colaborador
            return (
              <Card key={h.id} className="rounded-2xl shadow-sm border bg-white border-emerald-100">
                <CardContent className="p-4 flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconeCor(h.tipo_evento)}`}
                  >
                    <ArrowLeftRight className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-emerald-950">
                        {LABEL_TIPO_EVENTO[h.tipo_evento] || h.tipo_evento}
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full text-[10px]"
                      >
                        {disp ? `${disp.fabricante} ${disp.modelo}` : 'Dispositivo'}
                      </Badge>
                      {colab && (
                        <Badge
                          variant="secondary"
                          className="bg-stone-50 text-stone-700 border border-stone-200 rounded-full text-[10px]"
                        >
                          {colab.nome}
                        </Badge>
                      )}
                    </div>
                    {h.descricao && (
                      <p className="text-xs text-emerald-800/80 mt-0.5">{h.descricao}</p>
                    )}
                    {h.motivo && (
                      <p className="text-[11px] text-emerald-700/70 mt-0.5">
                        <span className="font-medium">Motivo:</span> {h.motivo}
                      </p>
                    )}
                    <p className="text-[11px] text-emerald-600/70 mt-0.5">
                      {formatarData(h.created)}
                    </p>
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
