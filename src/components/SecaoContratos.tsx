import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Colaborador, Contrato, Dispositivo } from '@/types/inventory'
import { gerarPDFContrato } from '@/lib/contratoPDF'
import { LABEL_TIPO_CONTRATO } from '@/lib/labels'
import { formatarData } from '@/lib/format'
import { AnexosContrato } from '@/components/AnexosContrato'
import { FileText, Printer, Search, Stamp } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface SecaoContratosProps {
  contratos: Contrato[]
  dispositivos: Dispositivo[]
  colaboradores: Colaborador[]
}

export function SecaoContratos({ contratos, dispositivos, colaboradores }: SecaoContratosProps) {
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')

  const listaFiltrada = useMemo(() => {
    let lista = contratos
    if (filtroTipo !== 'todos') lista = lista.filter((c) => c.tipo === filtroTipo)
    if (busca.trim()) {
      const q = busca.toLowerCase()
      lista = lista.filter((c) => {
        const colab = c.expand?.colaborador?.nome?.toLowerCase() || ''
        const disp =
          `${c.expand?.dispositivo?.fabricante} ${c.expand?.dispositivo?.modelo} ${c.expand?.dispositivo?.numero_serie}`.toLowerCase()
        return colab.includes(q) || disp.includes(q)
      })
    }
    return lista
  }, [contratos, busca, filtroTipo])

  const baixarPDF = (contrato: Contrato) => {
    const disp = contrato.expand?.dispositivo
    const colab = contrato.expand?.colaborador
    if (!disp || !colab) {
      toast({
        title: 'Dados incompletos',
        description: 'Não foi possível localizar o dispositivo ou o colaborador deste contrato.',
        variant: 'destructive',
      })
      return
    }
    gerarPDFContrato(contrato, disp, colab)
    toast({
      title: 'PDF gerado (2 vias)',
      description: `${LABEL_TIPO_CONTRATO[contrato.tipo]} — ${colab.nome}`,
    })
  }

  return (
    <div className="space-y-4">
      <Card className="border-emerald-100 bg-white shadow-sm rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-700/60" />
            <Input
              placeholder="Buscar por colaborador ou dispositivo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 rounded-xl border-emerald-200 text-sm"
            />
          </div>
          <div className="flex gap-1.5">
            {[
              ['todos', 'Todos'],
              ['comodato', 'Comodato'],
              ['distrato', 'Distrato'],
            ].map(([valor, rotulo]) => (
              <Button
                key={valor}
                size="sm"
                variant={filtroTipo === valor ? 'default' : 'outline'}
                onClick={() => setFiltroTipo(valor)}
                className={
                  filtroTipo === valor
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs h-8'
                    : 'border-emerald-200 text-emerald-800 rounded-lg text-xs h-8'
                }
              >
                {rotulo}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {listaFiltrada.length === 0 ? (
          <div className="bg-white rounded-3xl border border-emerald-100 p-12 text-center">
            <FileText className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-base font-semibold text-emerald-950">Nenhum contrato listado</h4>
            <p className="text-xs text-emerald-700 mt-1">
              Contratos de Comodato e Distratos são gerados automaticamente ao vincular e
              desvincular dispositivos, e ficam disponíveis aqui para impressão em 2 vias.
            </p>
          </div>
        ) : (
          listaFiltrada.map((contrato) => {
            const disp = contrato.expand?.dispositivo
            const colab = contrato.expand?.colaborador
            const ehDistrato = contrato.tipo === 'distrato'
            return (
              <Card
                key={contrato.id}
                className={`rounded-2xl shadow-sm border transition-all ${
                  ehDistrato ? 'bg-amber-50/40 border-amber-200' : 'bg-white border-emerald-200'
                }`}
              >
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        ehDistrato
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {ehDistrato ? (
                        <Stamp className="w-4.5 h-4.5" />
                      ) : (
                        <FileText className="w-4.5 h-4.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-emerald-950">
                          {LABEL_TIPO_CONTRATO[contrato.tipo]}
                        </span>
                        <Badge
                          className={
                            ehDistrato
                              ? 'bg-amber-100 text-amber-800 border-amber-200 rounded-full text-[10px]'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200 rounded-full text-[10px]'
                          }
                        >
                          {contrato.numero_vias || 2} vias
                        </Badge>
                      </div>
                      <p className="text-xs text-emerald-800/80 mt-0.5 truncate">
                        {colab?.nome || 'Colaborador'} ·{' '}
                        {disp ? `${disp.fabricante} ${disp.modelo} (${disp.tipo})` : 'Dispositivo'}
                      </p>
                      <p className="text-[11px] text-emerald-700/70 mt-0.5">
                        Gerado em {formatarData(contrato.created)}
                        {contrato.observacoes ? ` · ${contrato.observacoes}` : ''}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => baixarPDF(contrato)}
                    size="sm"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs h-8 shrink-0"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1" />
                    PDF (2 vias)
                  </Button>
                </CardContent>
                <CardContent className="pt-0 px-4 pb-4">
                  <AnexosContrato contratoId={contrato.id} />
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
