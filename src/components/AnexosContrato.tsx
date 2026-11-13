// Anexos de contrato assinado: upload, listagem, download e remoção.
// Usado dentro de cada cartão de contrato na aba Contratos.

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { anexosContratosService, type AnexoContrato } from '@/services/anexosContratosService'
import { useAuth } from '@/lib/auth'
import { formatarData } from '@/lib/format'
import { Loader2, Paperclip, Trash2, Upload, Download } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface AnexosContratoProps {
  contratoId: string
}

const MAX_MB = 20
const TIPOS_ACEITOS = 'application/pdf,image/jpeg,image/png,image/webp'

export function AnexosContrato({ contratoId }: AnexosContratoProps) {
  const { usuario } = useAuth()
  const [anexos, setAnexos] = useState<AnexoContrato[]>([])
  const [carregando, setCarregando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const carregar = async () => {
    setCarregando(true)
    try {
      setAnexos(await anexosContratosService.listarPorContrato(contratoId))
    } catch (e) {
      toast({
        title: 'Erro ao carregar anexos',
        description: e instanceof Error ? e.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contratoId])

  const enviar = async (file: File) => {
    if (file.size > MAX_MB * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: `O limite é de ${MAX_MB} MB por anexo.`,
        variant: 'destructive',
      })
      return
    }
    setEnviando(true)
    try {
      await anexosContratosService.anexar(contratoId, file, file.name)
      toast({ title: 'Anexo enviado', description: file.name })
      await carregar()
    } catch (e) {
      toast({
        title: 'Erro ao enviar anexo',
        description: e instanceof Error ? e.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setEnviando(false)
    }
  }

  const remover = async (anexo: AnexoContrato) => {
    try {
      await anexosContratosService.remover(anexo.id)
      toast({ title: 'Anexo removido', description: anexo.nome })
      await carregar()
    } catch (e) {
      toast({
        title: 'Erro ao remover anexo',
        description: e instanceof Error ? e.message : 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  const baixar = (anexo: AnexoContrato) => {
    const url = anexosContratosService.urlArquivo(anexo)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="mt-2 pt-2 border-t border-emerald-100/80">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800/80 flex items-center gap-1.5">
          <Paperclip className="w-3 h-3" /> Contrato assinado
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={TIPOS_ACEITOS}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) enviar(f)
            e.target.value = ''
          }}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={enviando}
          onClick={() => inputRef.current?.click()}
          className="border-emerald-200 text-emerald-800 hover:bg-emerald-50 rounded-lg text-[11px] h-7"
        >
          {enviando ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Upload className="w-3 h-3 mr-1" />
          )}
          {enviando ? 'Enviando…' : 'Anexar arquivo'}
        </Button>
      </div>

      {carregando && (
        <p className="text-[11px] text-emerald-700/60 mt-1 flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin" /> Carregando anexos…
        </p>
      )}

      {anexos.length > 0 && (
        <ul className="mt-1.5 space-y-1">
          {anexos.map((anexo) => (
            <li
              key={anexo.id}
              className="flex items-center justify-between gap-2 bg-emerald-50/50 rounded-lg px-2.5 py-1.5"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-emerald-950 truncate">{anexo.nome}</p>
                <p className="text-[10px] text-emerald-700/70">
                  Enviado em {formatarData(anexo.created)}
                  {anexo.expand?.enviado_por?.name
                    ? ` · ${anexo.expand.enviado_por.name}`
                    : anexo.expand?.enviado_por?.email
                      ? ` · ${anexo.expand.enviado_por.email}`
                      : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => baixar(anexo)}
                  title="Baixar / visualizar anexo"
                  className="h-6 w-6 p-0 text-emerald-700 hover:bg-emerald-100"
                >
                  <Download className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remover(anexo)}
                  title="Remover anexo"
                  className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {usuario && anexos.length === 0 && !carregando && (
        <p className="text-[10px] text-emerald-700/60 mt-1">
          Nenhum anexo ainda. Você pode anexar a via 1 e a via 2 assinadas (PDF ou imagem, até{' '}
          {MAX_MB} MB).
        </p>
      )}
    </div>
  )
}
