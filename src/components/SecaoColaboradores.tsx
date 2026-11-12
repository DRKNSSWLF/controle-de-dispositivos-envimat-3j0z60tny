import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Colaborador, Dispositivo } from '@/types/inventory'

import {
  User,
  Smartphone,
  Mail,
  Phone,
  Briefcase,
  Search,
  ArrowRight,
  UserX,
  UserCheck,
} from 'lucide-react'
import { colaboradoresService, vinculosService } from '@/services/inventoryService'
import { vinculosLinhasService } from '@/services/linhasService'
import { LABEL_STATUS_COLABORADOR } from '@/lib/labels'
import { toast } from '@/hooks/use-toast'

interface SecaoColaboradoresProps {
  colaboradores: Colaborador[]
  dispositivos: Dispositivo[]
  onAtualizar: () => void
  onFiltrarPorColaborador: (colaboradorId: string) => void
}

export function SecaoColaboradores({
  colaboradores,
  dispositivos,
  onAtualizar,
  onFiltrarPorColaborador,
}: SecaoColaboradoresProps) {
  const [busca, setBusca] = useState('')
  const [alterandoStatus, setAlterandoStatus] = useState<string | null>(null)

  const dispositivosPorColab = (colaboradorId: string) => {
    return dispositivos.filter((d) => d.colaborador === colaboradorId && d.status === 'em_uso')
  }

  const colaboradoresFiltrados = colaboradores.filter((c) => {
    if (!busca.trim()) return true
    const q = busca.toLowerCase()
    return (
      c.nome.toLowerCase().includes(q) ||
      (c.departamento && c.departamento.toLowerCase().includes(q)) ||
      (c.cargo && c.cargo.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.matricula && c.matricula.toLowerCase().includes(q)) ||
      (c.cpf && c.cpf.toLowerCase().includes(q))
    )
  })

  // Alterna ATIVO <-> DESLIGADO. Ao DESLIGAR, desvincula os dispositivos
  // (voltam para DISPONÍVEL) e gera os distratos — os dados são mantidos.
  const alternarStatus = async (c: Colaborador) => {
    const novoStatus = c.status === 'desligado' ? 'ativo' : 'desligado'
    const vinculados = dispositivosPorColab(c.id)

    if (novoStatus === 'desligado') {
      const msg = vinculados.length
        ? `Desligar "${c.nome}"? Os ${vinculados.length} dispositivo(s) vinculado(s) serão devolvidos (voltam para DISPONÍVEL) e o DISTRATO DE COMODATO será gerado. O histórico e os dados do colaborador serão mantidos.`
        : `Desligar "${c.nome}"? Os dados dele serão mantidos no cadastro, com status DESLIGADO.`
      if (!confirm(msg)) return
    }

    setAlterandoStatus(c.id)
    try {
      if (novoStatus === 'desligado') {
        const vinculosAtivos = await vinculosService.listar()
        const doColab = vinculosAtivos.filter(
          (v) => v.colaborador === c.id && v.situacao === 'ativo',
        )
        for (const v of doColab) {
          await vinculosService.encerrar(v, 'Desligamento do colaborador da empresa')
        }
        // Encerra também os vínculos ATIVOS de LINHAS TELEFÔNICAS (sem exclusão).
        const linhasEncerradas = await vinculosLinhasService.encerrarTodosDoColaborador(c.id)
        if (linhasEncerradas > 0) {
          toast({
            title: `${linhasEncerradas} linha(s) telefônica(s) encerrada(s)`,
            description:
              'Os vínculos de linhas do colaborador foram encerrados (histórico mantido).',
          })
        }
      }
      await colaboradoresService.atualizar(c.id, { status: novoStatus })
      toast({
        title: `Status alterado para ${LABEL_STATUS_COLABORADOR[novoStatus]}`,
        description:
          novoStatus === 'desligado'
            ? 'Dispositivos devolvidos e distratos gerados. Histórico preservado.'
            : 'Colaborador reativado.',
      })
      onAtualizar()
    } catch (e) {
      toast({
        title: 'Erro ao alterar status',
        description: e instanceof Error ? e.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setAlterandoStatus(null)
    }
  }

  const badgeStatus = (status?: string) => {
    if (status === 'desligado') {
      return (
        <Badge className="bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100 rounded-full font-medium">
          Desligado
        </Badge>
      )
    }
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 rounded-full font-medium">
        Ativo
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Topo com busca e botão de cadastro */}
      <Card className="border-emerald-100 bg-white shadow-sm rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-700/60" />
            <Input
              placeholder="Buscar colaborador por nome, CPF, cargo, departamento ou matrícula..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 rounded-xl border-emerald-200 focus:ring-emerald-600 bg-emerald-50/20 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid de colaboradores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {colaboradoresFiltrados.length === 0 ? (
          <div className="md:col-span-2 bg-white rounded-3xl border border-emerald-100 p-12 text-center">
            <User className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-base font-semibold text-emerald-950">
              Nenhum colaborador encontrado
            </h4>
            <p className="text-xs text-emerald-700 mt-1">
              Cadastre novos colaboradores manualmente ou importe via planilha.
            </p>
          </div>
        ) : (
          colaboradoresFiltrados.map((c) => {
            const aparelhos = dispositivosPorColab(c.id)
            const desligado = c.status === 'desligado'

            return (
              <Card
                key={c.id}
                className={`rounded-2xl shadow-sm transition-all border ${
                  desligado
                    ? 'bg-rose-50/40 border-rose-200/70 hover:border-rose-300'
                    : 'bg-white border-emerald-100/90 hover:border-emerald-300'
                }`}
              >
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            desligado
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100/80 text-emerald-800'
                          }`}
                        >
                          {c.nome
                            .split(' ')
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-base text-emerald-950">{c.nome}</h4>
                          <div className="flex flex-wrap items-center gap-x-2 text-xs text-emerald-700/80 mt-0.5">
                            {c.cargo && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3" /> {c.cargo}
                              </span>
                            )}
                            {c.departamento && <span>• {c.departamento}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {badgeStatus(c.status)}
                        {/* BOTÃO DE ALTERAÇÃO DE STATUS (ATIVO <-> DESLIGADO) */}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={alterandoStatus === c.id}
                          onClick={() => alternarStatus(c)}
                          title={
                            desligado
                              ? 'Reativar colaborador (ATIVO)'
                              : 'Desligar colaborador (DESLIGADO)'
                          }
                          className={`h-8 rounded-lg text-[11px] font-semibold border ${
                            desligado
                              ? 'border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                              : 'border-rose-300 text-rose-700 hover:bg-rose-50'
                          }`}
                        >
                          {desligado ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5 mr-1" /> ATIVAR
                            </>
                          ) : (
                            <>
                              <UserX className="w-3.5 h-3.5 mr-1" /> DESLIGAR
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Contatos */}
                    <div className="mt-3.5 space-y-1 text-xs text-emerald-900/80">
                      {c.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      )}
                      {c.telefone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{c.telefone}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-x-4 text-[11px] text-emerald-700/70 pt-0.5">
                        {c.cpf && (
                          <span>
                            CPF: <code className="font-mono">{c.cpf}</code>
                          </span>
                        )}
                        {c.matricula && (
                          <span>
                            Matrícula: <code className="font-mono">{c.matricula}</code>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dispositivos vinculados */}
                  <div className="pt-3 border-t border-emerald-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                        Dispositivos sob Responsabilidade ({aparelhos.length})
                      </span>
                      {aparelhos.length > 0 && (
                        <button
                          onClick={() => onFiltrarPorColaborador(c.id)}
                          className="text-xs text-emerald-700 hover:text-emerald-950 font-medium inline-flex items-center transition-colors"
                        >
                          Ver no inventário
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </button>
                      )}
                    </div>

                    {aparelhos.length === 0 ? (
                      <p className="text-xs text-emerald-600/70 italic">
                        Nenhum dispositivo atribuído no momento.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {aparelhos.map((d) => (
                          <Badge
                            key={d.id}
                            variant="secondary"
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-normal border border-emerald-200/80 rounded-lg px-2 py-0.5"
                          >
                            <span className="capitalize font-semibold mr-1">{d.tipo}:</span>
                            {d.fabricante} {d.modelo}
                          </Badge>
                        ))}
                      </div>
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
