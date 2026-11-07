import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { dispositivosService, colaboradoresService } from '@/services/inventoryService'
import { Dispositivo, Colaborador } from '@/types/inventory'
import { calcularEstatisticas, gerarAlertas } from '@/lib/alertsAndMetrics'
import { VisaoGeralInventario } from '@/components/VisaoGeralInventario'
import { ListaDispositivos } from '@/components/ListaDispositivos'
import { SecaoColaboradores } from '@/components/SecaoColaboradores'
import { ImportarDispositivos } from '@/components/ImportarDispositivos'
import { ImportarColaboradores } from '@/components/ImportarColaboradores'
import { PainelAlertas } from '@/components/PainelAlertas'
import { ModalCadastrarDispositivo } from '@/components/ModalCadastrarDispositivo'
import {
  Smartphone,
  Users,
  UploadCloud,
  BellRing,
  RotateCw,
  Plus,
  Leaf,
  Layers,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function Index() {
  const [abaAtiva, setAbaAtiva] = useState<string>('geral')
  const [subAbaImportacao, setSubAbaImportacao] = useState<'dispositivos' | 'colaboradores'>(
    'dispositivos',
  )

  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [carregando, setCarregando] = useState<boolean>(true)

  // Filtros globais sincronizados
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroColaborador, setFiltroColaborador] = useState<string>('todos')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true)
      const [disps, colabs] = await Promise.all([
        dispositivosService.listar(),
        colaboradoresService.listar(),
      ])
      setDispositivos(disps)
      setColaboradores(colabs)
    } catch (err) {
      toast({
        title: 'Erro ao carregar dados',
        description: err instanceof Error ? err.message : 'Verifique a conexão com o servidor.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Cálculos dinâmicos
  const stats = calcularEstatisticas(dispositivos)
  const alertas = gerarAlertas(dispositivos)
  const temDadosDemo = dispositivos.some((d) => d.is_demo)

  const handleLimparDemo = async () => {
    if (
      confirm(
        'Deseja remover todos os registros de demonstração? Seus dados reais importados serão mantidos.',
      )
    ) {
      try {
        const removidos = await dispositivosService.limparDadosDemo()
        toast({
          title: 'Registros de exemplo removidos',
          description: `${removidos} dispositivos de demonstração foram excluídos.`,
        })
        carregarDados()
      } catch (e) {
        toast({
          title: 'Erro ao remover',
          description: e instanceof Error ? e.message : 'Tente novamente.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleFiltrarPorColaborador = (colaboradorId: string) => {
    setFiltroColaborador(colaboradorId)
    setAbaAtiva('dispositivos')
  }

  const handleFiltrarPorStatus = (status: string) => {
    setFiltroStatus(status)
    setAbaAtiva('dispositivos')
  }

  const handleFiltrarPorTipo = (tipo: string) => {
    setFiltroTipo(tipo)
    setAbaAtiva('dispositivos')
  }

  return (
    <div className="min-h-screen bg-[#fafcf9] text-emerald-950 pb-16 font-sans">
      {/* Topo / Header com Identidade ENVIMAT (Meio ambiente, São Carlos - SP, tecnologia sustentável) */}
      <header className="border-b border-emerald-100 bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-[0_1px_6px_rgba(20,50,30,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center shadow-sm">
              <Leaf className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-xs uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 font-mono">
                  ENVIMAT
                </span>
                <span className="text-xs text-emerald-800/60 hidden sm:inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> São Carlos - SP
                </span>
              </div>
              <h1 className="font-serif italic text-xl font-normal text-emerald-950 leading-tight">
                Controle de Dispositivos e Comodato
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={carregarDados}
              disabled={carregando}
              className="border-emerald-200 text-emerald-800 hover:bg-emerald-50 rounded-xl h-9"
              title="Recarregar dados do banco"
            >
              <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${carregando ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            <ModalCadastrarDispositivo
              colaboradores={colaboradores}
              onDispositivoSalvo={carregarDados}
              triggerButton={
                <Button className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-sm h-9 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Novo Dispositivo
                </Button>
              }
            />
          </div>
        </div>
      </header>

      {/* Conteúdo Principal com Navegação por Abas */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-6">
          {/* Barra de Abas Elegante com cantos arredondados */}
          <div className="flex overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <TabsList className="bg-emerald-100/40 p-1 rounded-2xl border border-emerald-200/50 inline-flex">
              <TabsTrigger
                value="geral"
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-emerald-950 data-[state=active]:shadow-sm px-4 py-2 text-xs font-medium text-emerald-900 transition-all flex items-center gap-2"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Inventário & Visão Geral</span>
              </TabsTrigger>

              <TabsTrigger
                value="dispositivos"
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-emerald-950 data-[state=active]:shadow-sm px-4 py-2 text-xs font-medium text-emerald-900 transition-all flex items-center gap-2"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dispositivos</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-semibold">
                  {dispositivos.length}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="colaboradores"
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-emerald-950 data-[state=active]:shadow-sm px-4 py-2 text-xs font-medium text-emerald-900 transition-all flex items-center gap-2"
              >
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>Colaboradores</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-semibold">
                  {colaboradores.length}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="importacao"
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-emerald-950 data-[state=active]:shadow-sm px-4 py-2 text-xs font-medium text-emerald-900 transition-all flex items-center gap-2"
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>Importar Planilhas</span>
              </TabsTrigger>

              <TabsTrigger
                value="alertas"
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-emerald-950 data-[state=active]:shadow-sm px-4 py-2 text-xs font-medium text-emerald-900 transition-all flex items-center gap-2"
              >
                <BellRing className="w-3.5 h-3.5 text-emerald-600" />
                <span>Alertas</span>
                {alertas.length > 0 && (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-1.5 py-0 rounded-full font-bold">
                    {alertas.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 1. ABA: VISÃO GERAL & INVENTÁRIO */}
          <TabsContent value="geral" className="space-y-6 focus-visible:outline-none">
            <VisaoGeralInventario
              stats={stats}
              temDadosDemo={temDadosDemo}
              onLimparDemo={handleLimparDemo}
              onFiltrarStatus={handleFiltrarPorStatus}
              onFiltrarTipo={handleFiltrarPorTipo}
            />

            {/* Painel resumido de alertas na visão geral */}
            {alertas.length > 0 && (
              <div className="bg-white rounded-3xl border border-emerald-100 p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-serif italic text-xl font-normal text-emerald-950">
                      Indicadores Fora do Esperado
                    </h3>
                    <p className="text-xs text-emerald-700/80">
                      Avisos automáticos de manutenção atrasada, comodatos pendentes e idade de
                      aparelhos.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAbaAtiva('alertas')}
                    className="border-emerald-200 text-emerald-800 rounded-xl text-xs"
                  >
                    Ver todos ({alertas.length})
                  </Button>
                </div>
                <PainelAlertas
                  alertas={alertas.slice(0, 3)}
                  onIrParaInventario={() => setAbaAtiva('dispositivos')}
                />
              </div>
            )}
          </TabsContent>

          {/* 2. ABA: LISTAGEM DE DISPOSITIVOS + FILTROS */}
          <TabsContent value="dispositivos" className="space-y-6 focus-visible:outline-none">
            <ListaDispositivos
              dispositivos={dispositivos}
              colaboradores={colaboradores}
              filtroTipo={filtroTipo}
              setFiltroTipo={setFiltroTipo}
              filtroColaborador={filtroColaborador}
              setFiltroColaborador={setFiltroColaborador}
              filtroStatus={filtroStatus}
              setFiltroStatus={setFiltroStatus}
              onAtualizar={carregarDados}
            />
          </TabsContent>

          {/* 3. ABA: COLABORADORES */}
          <TabsContent value="colaboradores" className="space-y-6 focus-visible:outline-none">
            <SecaoColaboradores
              colaboradores={colaboradores}
              dispositivos={dispositivos}
              onAtualizar={carregarDados}
              onFiltrarPorColaborador={handleFiltrarPorColaborador}
            />
          </TabsContent>

          {/* 4. ABA: IMPORTAÇÃO DE PLANILHAS (DISPOSITIVOS E COLABORADORES) */}
          <TabsContent value="importacao" className="space-y-6 focus-visible:outline-none">
            <div className="flex items-center gap-2 p-1 bg-emerald-100/50 rounded-2xl max-w-md border border-emerald-200/60">
              <button
                type="button"
                onClick={() => setSubAbaImportacao('dispositivos')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                  subAbaImportacao === 'dispositivos'
                    ? 'bg-white text-emerald-950 shadow-sm font-semibold'
                    : 'text-emerald-800/80 hover:text-emerald-950'
                }`}
              >
                1. Planilha de Dispositivos
              </button>
              <button
                type="button"
                onClick={() => setSubAbaImportacao('colaboradores')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                  subAbaImportacao === 'colaboradores'
                    ? 'bg-white text-emerald-950 shadow-sm font-semibold'
                    : 'text-emerald-800/80 hover:text-emerald-950'
                }`}
              >
                2. Planilha de Colaboradores
              </button>
            </div>

            {subAbaImportacao === 'dispositivos' ? (
              <ImportarDispositivos
                colaboradores={colaboradores}
                onImportadoSucesso={() => {
                  carregarDados()
                  setAbaAtiva('dispositivos')
                }}
              />
            ) : (
              <ImportarColaboradores
                onImportadoSucesso={() => {
                  carregarDados()
                  setAbaAtiva('colaboradores')
                }}
              />
            )}
          </TabsContent>

          {/* 5. ABA: ALERTAS SIMPLES E IDADE */}
          <TabsContent value="alertas" className="space-y-6 focus-visible:outline-none">
            <PainelAlertas
              alertas={alertas}
              onIrParaInventario={() => setAbaAtiva('dispositivos')}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
