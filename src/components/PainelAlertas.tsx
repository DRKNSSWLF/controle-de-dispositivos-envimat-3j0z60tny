import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertaDispositivo } from '@/types/inventory'
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  UserX,
  Calendar,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'

interface PainelAlertasProps {
  alertas: AlertaDispositivo[]
  onSelecionarDispositivo?: (id: string) => void
  onIrParaInventario?: () => void
}

export function PainelAlertas({ alertas, onIrParaInventario }: PainelAlertasProps) {
  const criticos = alertas.filter((a) => a.severidade === 'critico')
  const atencoes = alertas.filter((a) => a.severidade === 'atencao')

  const getIcon = (tipo: AlertaDispositivo['tipoAlerta']) => {
    switch (tipo) {
      case 'manutencao_longa':
        return <Clock className="w-5 h-5 text-amber-600" />
      case 'sem_responsavel':
        return <UserX className="w-5 h-5 text-rose-600" />
      case 'idade_avancada':
        return <Calendar className="w-5 h-5 text-emerald-700" />
      default:
        return <AlertCircle className="w-5 h-5 text-emerald-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Resumo superior dos alertas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-rose-50/70 border border-rose-200/60 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">
              Avisos Críticos
            </span>
            <h3 className="text-2xl font-bold text-rose-950 font-serif italic mt-0.5">
              {criticos.length}
            </h3>
            <p className="text-xs text-rose-800/80 mt-1">
              Dispositivos sem comodato ou manutenção estourada
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Pontos de Atenção
            </span>
            <h3 className="text-2xl font-bold text-amber-950 font-serif italic mt-0.5">
              {atencoes.length}
            </h3>
            <p className="text-xs text-amber-800/80 mt-1">
              Idade superior a 3 anos para planejamento de compra
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Total de Alertas
            </span>
            <h3 className="text-2xl font-bold text-emerald-950 font-serif italic mt-0.5">
              {alertas.length}
            </h3>
            <p className="text-xs text-emerald-800/80 mt-1">
              Dispositivos requerem ação preventiva da ENVIMAT
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Lista de Alertas Ativos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-serif italic font-normal text-emerald-950">
            Alertas Automáticos do Parque Tecnológico
          </h3>
          {onIrParaInventario && (
            <Button
              variant="link"
              size="sm"
              onClick={onIrParaInventario}
              className="text-emerald-700 hover:text-emerald-900 p-0 h-auto font-medium"
            >
              Ver todos no inventário
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
        </div>

        {alertas.length === 0 ? (
          <div className="bg-white rounded-3xl border border-emerald-100 p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-emerald-950">Nenhum alerta pendente</h4>
            <p className="text-sm text-emerald-700/80 max-w-sm mx-auto mt-1">
              Todos os dispositivos em uso possuem responsáveis cadastrados e não há aparelhos com
              manutenção atrasada.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alertas.map((alerta) => {
              const isCritico = alerta.severidade === 'critico'
              const cardBorder = isCritico
                ? 'border-rose-200 hover:border-rose-300'
                : 'border-amber-200 hover:border-amber-300'
              const badgeClass = isCritico
                ? 'bg-rose-100 text-rose-800 border-rose-200'
                : 'bg-amber-100 text-amber-800 border-amber-200'

              return (
                <Card
                  key={alerta.id}
                  className={`bg-white rounded-2xl border transition-all shadow-sm ${cardBorder}`}
                >
                  <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isCritico ? 'bg-rose-50' : 'bg-amber-50'
                        }`}
                      >
                        {getIcon(alerta.tipoAlerta)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-sm sm:text-base text-emerald-950">
                            {alerta.titulo}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`text-[11px] font-medium rounded-full ${badgeClass}`}
                          >
                            {isCritico ? 'Crítico' : 'Atenção'}
                          </Badge>
                          {alerta.detalheTempo && (
                            <span className="text-xs text-emerald-800/70 font-mono">
                              • {alerta.detalheTempo}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-emerald-900/80 leading-relaxed">
                          {alerta.mensagem}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-700/80 pt-1">
                          <span className="font-medium text-emerald-900">
                            {alerta.dispositivo.fabricante} {alerta.dispositivo.modelo}
                          </span>
                          <span>
                            • S/N:{' '}
                            <code className="font-mono">{alerta.dispositivo.numero_serie}</code>
                          </span>
                          {alerta.dispositivo.imei1 && (
                            <span>
                              • IMEI1: <code className="font-mono">{alerta.dispositivo.imei1}</code>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
