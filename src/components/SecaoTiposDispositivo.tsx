import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  TipoDispositivoCadastrado,
  tiposDispositivoService,
} from '@/services/tiposDispositivoService'
import { useAuth } from '@/lib/auth'
import { Plus, Pencil, Trash2, Tags } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface SecaoTiposDispositivoProps {
  onAtualizado?: () => void
}

/** CRUD de tipos de dispositivo — escrita via hook /backend/v1/envimat/tipos-dispositivo
 *  (coleção com regras de API fechadas para escrita). Exclusão só para master e apenas
 *  quando nenhum dispositivo usa o tipo. */
export function SecaoTiposDispositivo({ onAtualizado }: SecaoTiposDispositivoProps) {
  const { usuario } = useAuth()
  const ehMaster = usuario?.nivel === 'master'

  const [tipos, setTipos] = useState<TipoDispositivoCadastrado[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<TipoDispositivoCadastrado | null>(null)
  const [nome, setNome] = useState('')
  const [usaImei, setUsaImei] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState<TipoDispositivoCadastrado | null>(null)

  const carregar = async () => {
    setCarregando(true)
    try {
      setTipos(await tiposDispositivoService.listar())
    } catch (e) {
      toast({
        title: 'Erro ao carregar tipos',
        description: e instanceof Error ? e.message : 'Tente novamente',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const abrirNova = () => {
    setEditando(null)
    setNome('')
    setUsaImei(true)
    setModalAberto(true)
  }

  const abrirEdicao = (t: TipoDispositivoCadastrado) => {
    setEditando(t)
    setNome(t.nome)
    setUsaImei(t.usa_imei)
    setModalAberto(true)
  }

  const salvar = async () => {
    if (!nome.trim()) {
      toast({ title: 'Informe o nome do tipo', variant: 'destructive' })
      return
    }
    setSalvando(true)
    try {
      if (editando) {
        await tiposDispositivoService.renomear(editando.id, nome.trim(), usaImei)
        toast({ title: 'Tipo atualizado' })
      } else {
        await tiposDispositivoService.criar(nome.trim(), usaImei)
        toast({ title: 'Tipo cadastrado' })
      }
      setModalAberto(false)
      carregar()
      onAtualizado?.()
    } catch (e) {
      toast({
        title: 'Erro ao salvar tipo',
        description: e instanceof Error ? e.message : 'Tente novamente',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const confirmarExclusao = async () => {
    if (!excluindo) return
    try {
      await tiposDispositivoService.excluir(excluindo.id)
      toast({ title: 'Tipo removido' })
      carregar()
      onAtualizado?.()
    } catch (e) {
      toast({
        title: 'Não foi possível excluir',
        description: e instanceof Error ? e.message : 'Tente novamente',
        variant: 'destructive',
      })
    } finally {
      setExcluindo(null)
    }
  }

  return (
    <Card className="border-emerald-100 bg-white shadow-sm rounded-2xl">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0">
              <Tags className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-emerald-950">Tipos de Dispositivo</h4>
              <p className="text-[11px] text-emerald-700/80">
                Categorias usadas no cadastro de dispositivos (celular, notebook, tablet...).
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={abrirNova}
            className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs h-9"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Novo Tipo
          </Button>
        </div>

        {carregando ? (
          <p className="text-xs text-emerald-700/70 py-2">Carregando tipos...</p>
        ) : tipos.length === 0 ? (
          <p className="text-xs text-emerald-700/70 py-2">
            Nenhum tipo cadastrado ainda. Use “Novo Tipo” para criar o primeiro.
          </p>
        ) : (
          <ul className="divide-y divide-emerald-50">
            {tipos.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-emerald-950 truncate">{t.nome}</p>
                  <p className="text-[11px] text-emerald-700/70">
                    {t.usa_imei ? 'Possui IMEI' : 'Sem IMEI'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => abrirEdicao(t)}
                    title="Editar tipo"
                    className="h-8 w-8 text-emerald-700 hover:bg-emerald-50 rounded-lg"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {ehMaster && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setExcluindo(t)}
                      title="Excluir tipo"
                      className="h-8 w-8 text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {/* Modal criar/editar tipo */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent className="max-w-md rounded-3xl border-emerald-100">
          <DialogHeader>
            <DialogTitle className="font-serif italic text-xl text-emerald-950">
              {editando ? 'Editar Tipo de Dispositivo' : 'Novo Tipo de Dispositivo'}
            </DialogTitle>
            <DialogDescription className="text-xs text-emerald-700">
              Tipos aparecem como categoria ao cadastrar dispositivos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs text-emerald-800">Nome do tipo *</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Smartphone, Notebook, Coletor de dados"
                className="rounded-xl border-emerald-200 text-sm"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 py-2.5">
              <div>
                <Label className="text-xs text-emerald-900">Possui IMEI</Label>
                <p className="text-[11px] text-emerald-700/80">
                  Notebooks e acessórios normalmente não têm.
                </p>
              </div>
              <Switch checked={usaImei} onCheckedChange={setUsaImei} />
            </div>
            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                onClick={() => setModalAberto(false)}
                className="rounded-xl border-emerald-200 text-emerald-800 text-sm"
              >
                Cancelar
              </Button>
              <Button
                onClick={salvar}
                disabled={salvando}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão (bloqueada pelo servidor se o tipo estiver em uso) */}
      <AlertDialog open={!!excluindo} onOpenChange={(v) => !v && setExcluindo(null)}>
        <AlertDialogContent className="rounded-3xl border-emerald-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif italic text-xl text-emerald-950">
              Excluir tipo “{excluindo?.nome}”?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-emerald-800">
              A exclusão falha se algum dispositivo estiver usando este tipo — nada é removido em
              cascata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-emerald-200 text-emerald-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              className="bg-rose-700 hover:bg-rose-800 text-white rounded-xl"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
