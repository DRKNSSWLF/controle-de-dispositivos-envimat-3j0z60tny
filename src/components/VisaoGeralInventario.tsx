import { Card, CardContent } from '@/components/ui/card'
import { InventarioEstatisticas } from '@/lib/alertsAndMetrics'
import {
  Smartphone,
  Laptop,
  Tablet,
  Archive,
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
  Calendar,
  Sparkles,
} from 'lucide-react'

interface VisaoGeralInventarioProps {
  stats: InventarioEstatisticas
  onFiltrarStatus?: (status: string) => void
  onFiltrarTipo?: (tipo: string) => void
  temDadosDemo?: boolean
  onLimparDemo?: () => void
}

export function VisaoGeralInventario({
  stats,
  onFiltrarStatus,
  onFiltrarTipo,
  temDadosDemo,
  onLimparDemo,
}: VisaoGeralInventarioProps) {
  return (
    <div className="space-y-6">
      {/* Banner de aviso sobre dados de demonstração realistas */}
      {temDadosDemo && (
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-950">
                Dados de demonstração ativos (Samsung, Apple, Lenovo, Dell, Motorola)
              </p>
              <p className="text-xs text-emerald-800/80">
                Inseridos automaticamente para demonstrar filtros, contadores e alertas de
                idade/manutenção. Você pode importar suas próprias planilhas a qualquer momento.
              </p>
            </div>
          </div>
          {onLimparDemo && (
            <button
              onClick={onLimparDemo}
              className="text-xs text-emerald-800 hover:text-emerald-950 font-medium underline underline-offset-4 shrink-0 transition-colors"
            >
              Remover registros de exemplo
            </button>
          )}
        </div>
      )}

      {/* Cartões Principais de Status: Total, Em Uso, Disponível, Manutenção e Idade */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Total */}
        <Card
          onClick={() => onFiltrarStatus?.('todos')}
          className="bg-white border-emerald-100 hover:border-emerald-300 transition-all rounded-2xl cursor-pointer shadow-sm hover:shadow"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-emerald-800/80 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Total Aparelhos
              </span>
              <Smartphone className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-3xl font-sans font-semibold text-emerald-950 tracking-tight">
              {stats.total}
            </div>
            <p className="text-[11px] text-emerald-700/80 mt-1">Inventário geral ENVIMAT</p>
          </CardContent>
        </Card>

        {/* Em Uso */}
        <Card
          onClick={() => onFiltrarStatus?.('em_uso')}
          className="bg-white border-emerald-100 hover:border-emerald-300 transition-all rounded-2xl cursor-pointer shadow-sm hover:shadow"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-emerald-800/80 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Em Uso</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-sans font-semibold text-emerald-950 tracking-tight">
              {stats.emUso}
            </div>
            <p className="text-[11px] text-emerald-700/80 mt-1">Com colaboradores em campo</p>
          </CardContent>
        </Card>

        {/* Disponível */}
        <Card
          onClick={() => onFiltrarStatus?.('disponivel')}
          className="bg-white border-emerald-100 hover:border-emerald-300 transition-all rounded-2xl cursor-pointer shadow-sm hover:shadow"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-emerald-800/80 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Disponível</span>
              <Archive className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-sans font-semibold text-emerald-950 tracking-tight">
              {stats.disponivel}
            </div>
            <p className="text-[11px] text-emerald-700/80 mt-1">Prontos para substituição</p>
          </CardContent>
        </Card>

        {/* Manutenção */}
        <Card
          onClick={() => onFiltrarStatus?.('manutencao')}
          className="bg-white border-emerald-100 hover:border-amber-300 transition-all rounded-2xl cursor-pointer shadow-sm hover:shadow"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-amber-800/80 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Em Manutenção</span>
              <AlertOctagon className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-3xl font-sans font-semibold text-amber-800 tracking-tight">
              {stats.manutencao}
            </div>
            <p className="text-[11px] text-amber-800/80 mt-1">
              {stats.emManutencaoCritica > 0
                ? `${stats.emManutencaoCritica} com atraso (>30d)`
                : 'Acompanhamento de reparos'}
            </p>
          </CardContent>
        </Card>

        {/* Idade Média */}
        <Card className="bg-white border-emerald-100 rounded-2xl shadow-sm col-span-2 md:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-emerald-800/80 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Idade Média</span>
              <Calendar className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-3xl font-sans font-semibold text-emerald-950 tracking-tight">
              {stats.idadeMediaAnos}{' '}
              <span className="text-sm font-sans font-normal text-emerald-700">anos</span>
            </div>
            <p className="text-[11px] text-emerald-700/80 mt-1">
              {stats.antigosMais3Anos} aparelhos com 3+ anos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento por Tipo de Dispositivo */}
      <div className="bg-white rounded-2xl border border-emerald-100 p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-950">
            Distribuição por Categoria de Dispositivo
          </h3>
          <span className="text-xs text-emerald-700 font-medium">Clique para filtrar</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => onFiltrarTipo?.('celular')}
            className="flex items-center gap-3 p-3 rounded-xl border border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-emerald-700">Celulares</p>
              <p className="text-lg font-bold text-emerald-950 font-sans">
                {stats.porTipo.celular}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onFiltrarTipo?.('notebook')}
            className="flex items-center gap-3 p-3 rounded-xl border border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-emerald-700">Notebooks</p>
              <p className="text-lg font-bold text-emerald-950 font-sans">
                {stats.porTipo.notebook}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onFiltrarTipo?.('tablet')}
            className="flex items-center gap-3 p-3 rounded-xl border border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0">
              <Tablet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-emerald-700">Tablets / Rugged</p>
              <p className="text-lg font-bold text-emerald-950 font-sans">{stats.porTipo.tablet}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onFiltrarTipo?.('outro')}
            className="flex items-center gap-3 p-3 rounded-xl border border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-emerald-700">Coletores / Outros</p>
              <p className="text-lg font-bold text-emerald-950 font-sans">{stats.porTipo.outro}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
