import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { dispositivosService, colaboradoresService } from '@/services/inventoryService'
import {
  pessoasJuridicasService,
  vinculosService,
  manutencoesService,
  historicoService,
  contratosService,
} from '@/services/inventoryService'
import {
  Colaborador,
  Contrato,
  Dispositivo,
  HistoricoMovimentacao,
  Manutencao,
  PessoaJuridica,
  Vinculo,
} from '@/types/inventory'
import { calcularEstatisticas, gerarAlertas } from '@/lib/alertsAndMetrics'
import { VisaoGeralInventario } from '@/components/VisaoGeralInventario'
import { ListaDispositivos } from '@/components/ListaDispositivos'
import { SecaoColaboradores } from '@/components/SecaoColaboradores'
import { SecaoPessoasJuridicas } from '@/components/SecaoPessoasJuridicas'
import { SecaoVinculos } from '@/components/SecaoVinculos'
import { SecaoContratos } from '@/components/SecaoContratos'
import { SecaoManutencao } from '@/components/SecaoManutencao'
import { SecaoHistorico } from '@/components/SecaoHistorico'
import { ImportarDispositivos } from '@/components/ImportarDispositivos'
import { ImportarColaboradores } from '@/components/ImportarColaboradores'
import { PainelAlertas } from '@/components/PainelAlertas'
import { ModalCadastrarDispositivo } from '@/components/ModalCadastrarDispositivo'
import { SecaoUsuarios } from '@/components/SecaoUsuarios'
import { SecaoLogs } from '@/components/SecaoLogs'
import { useAuth } from '@/lib/auth'
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
  Building2,
  Link2,
  FileText,
  Wrench,
  History,
  UserCog,
  ScrollText,
  LogOut,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function Index() {
  const { usuario, sair } = useAuth()
  const ehMaster = usuario?.nivel === 'master'
  const [abaAtiva, setAbaAtiva] = useState<string>('geral')
  const [subAbaImportacao, setSubAbaImportacao] = useState<'dispositivos' | 'colaboradores'>(
    'dispositivos',
  )

  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [pessoasJuridicas, setPessoasJuridicas] = useState<PessoaJuridica[]>([])
  const [vinculos, setVinculos] = useState<Vinculo[]>([])
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([])
  const [historico, setHistorico] = useState<HistoricoMovimentacao[]>([])
  const [carregando, setCarregando] = useState<boolean>(true)

  // Filtros globais sincronizados
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroColaborador, setFiltroColaborador] = useState<string>('todos')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true)
      const [disps, colabs, pjs, vinc, contr, mant, hist] = await Promise.all([
        dispositivosService.listar(),
        colaboradoresService.listar(),
        pessoasJuridicasService.listar(),
        vinculosService.listar(),
        contratosService.listar(),
        manutencoesService.listar(),
        historicoService.listar(),
      ])
      setDispositivos(disps)
      setColaboradores(colabs)
      setPessoasJuridicas(pjs)
      setVinculos(vinc)
      setContratos(contr)
      setManutencoes(mant)
      setHistorico(hist)
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

  // Prop comum às seções que mexem no fluxo de vínculos/manutenção/contratos
  const atualizarTudo = carregarDados

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

            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-emerald-200">
              <div className="text-right hidden md:block">
                <p className="text-xs font-semibold text-emerald-950 leading-tight">
                  {usuario?.nome}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-emerald-700/70">
                  {usuario?.nivel === 'master' ? 'Master' : 'Administrativo'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={sair}
                className="border-emerald-200 text-emerald-800 hover:bg-emerald-50 rounded-xl h-9"
                title="Encerrar sessão"
              >
                <LogOut className="w-3.5 h-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal com Navegação por Abas */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-6">
          {/* Barra de Abas */}
          <div className="flex overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <TabsList className="bg-emerald-100/40 p-1 rounded-2xl border border-emerald-200/50 inline-flex">
              <TabsTrigger
                value="geral"
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-emerald-950 data-[state=active]:shadow-sm px-4 py-2 text-xs font-medium text-emerald-900 transition-all flex items-center gap-2"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Visão Geral</span>
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
                value="vinculos"
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-emerald-950 data-[state=active]:shadow-sm px-4 py-2 text-xs font-medium text-emerald-900 transition-all flex items-center gap-2"
              >
                <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Vínculos</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-semibold">
                  {vinculos.filter((v) => v.situacao === 'ativo').length}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="contratos"
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-emerald-950 data-[state=active]:shadow-sm px-4 py-2 text-xs font-medium text-emerald-900 transition-all flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Contratos</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-semibold">
                  {contratos.length}
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
                value="pj"
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-emerald-950 data-[state=active]:shadow-sm px-4 py-2 text-xs font-medium text-emerald-900 transition-all flex items-center gap-2"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pessoas Jurídicas</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-semibold">
                  {pessoasJuridicas.length}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="manutencao"
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-emerald-950 data-[state=active]:shadow-sm px-4 py-2 text-xs font-medium text-emerald-900 transition-all flex items-center gap-2"
              >
                <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                <span>Manutenção</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-semibold">
                  {manutencoes.filter((m) => m.situacao === 'em_manutencao').length}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="historico"
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-emerald-950 data-[state=active]:shadow-sm px-4 py-2 text-xs font-medium text-emerald-900 transition-all flex items-center gap-2"
              >
                <History className="w-3.5 h-3.5 text-emerald-600" />
                <span>Histórico</span>
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

              {ehMaster && (
                <TabsTrigger
                  value="usuarios"
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-emerald-950 data-[state=active]:shadow-sm px-4 py-2 text-xs font-medium text-emerald-900 transition-all flex items-center gap-2"
                >
                  <UserCog className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Usuários</span>
                </TabsTrigger>
              )}

              {ehMaster && (
                <TabsTrigger
                  value="logs"
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-emerald-950 data-[state=active]:shadow-sm px-4 py-2 text-xs font-medium text-emerald-900 transition-all flex items-center gap-2"
                >
                  <ScrollText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Logs de Acesso</span>
                </TabsTrigger>
              )}
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

          {/* 3. ABA: VÍNCULOS */}
          <TabsContent value="vinculos" className="space-y-6 focus-visible:outline-none">
            <SecaoVinculos
              vinculos={vinculos}
              colaboradores={colaboradores}
              dispositivos={dispositivos}
              onAtualizar={atualizarTudo}
            />
          </TabsContent>

          {/* 4. ABA: CONTRATOS */}
          <TabsContent value="contratos" className="space-y-6 focus-visible:outline-none">
            <SecaoContratos
              contratos={contratos}
              dispositivos={dispositivos}
              colaboradores={colaboradores}
            />
          </TabsContent>

          {/* 5. ABA: COLABORADORES */}
          <TabsContent value="colaboradores" className="space-y-6 focus-visible:outline-none">
            <SecaoColaboradores
              colaboradores={colaboradores}
              dispositivos={dispositivos}
              onAtualizar={carregarDados}
              onFiltrarPorColaborador={handleFiltrarPorColaborador}
            />
          </TabsContent>

          {/* 6. ABA: PESSOAS JURÍDICAS */}
          <TabsContent value="pj" className="space-y-6 focus-visible:outline-none">
            <SecaoPessoasJuridicas
              pessoasJuridicas={pessoasJuridicas}
              onAtualizar={carregarDados}
            />
          </TabsContent>

          {/* 7. ABA: MANUTENÇÃO */}
          <TabsContent value="manutencao" className="space-y-6 focus-visible:outline-none">
            <SecaoManutencao
              manutencoes={manutencoes}
              dispositivos={dispositivos}
              colaboradores={colaboradores}
              vinculos={vinculos}
              onAtualizar={atualizarTudo}
            />
          </TabsContent>

          {/* 8. ABA: HISTÓRICO DE MOVIMENTAÇÃO */}
          <TabsContent value="historico" className="space-y-6 focus-visible:outline-none">
            <SecaoHistorico historico={historico} />
          </TabsContent>

          {/* 9. ABA: IMPORTAÇÃO DE PLANILHAS */}
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

          {/* 10. ABA: ALERTAS */}
          <TabsContent value="alertas" className="space-y-6 focus-visible:outline-none">
            <PainelAlertas
              alertas={alertas}
              onIrParaInventario={() => setAbaAtiva('dispositivos')}
            />
          </TabsContent>

          {/* 11. ABA: USUÁRIOS (somente Master) */}
          {ehMaster && (
            <TabsContent value="usuarios" className="space-y-6 focus-visible:outline-none">
              <SecaoUsuarios />
            </TabsContent>
          )}

          {/* 12. ABA: LOGS DE ACESSO (somente Master) */}
          {ehMaster && (
            <TabsContent value="logs" className="space-y-6 focus-visible:outline-none">
              <SecaoLogs />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}
