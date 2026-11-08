import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PessoaJuridica, NovaPessoaJuridicaInput } from '@/types/inventory'
import { pessoasJuridicasService } from '@/services/inventoryService'
import { Building2, Plus, Search, MapPin, Phone, Mail, User } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface SecaoPessoasJuridicasProps {
  pessoasJuridicas: PessoaJuridica[]
  onAtualizar: () => void
}

const VAZIO: NovaPessoaJuridicaInput = {
  cnpj: '',
  razao_social: '',
  representante: '',
  cpf_representante: '',
  endereco: '',
  cidade: '',
  estado: '',
  uf: '',
  telefone: '',
  email: '',
  observacoes: '',
}

export function SecaoPessoasJuridicas({
  pessoasJuridicas,
  onAtualizar,
}: SecaoPessoasJuridicasProps) {
  const [aberto, setAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState('')
  const [formulario, setFormulario] = useState<NovaPessoaJuridicaInput>({ ...VAZIO })

  const set = (campo: keyof NovaPessoaJuridicaInput, valor: string) =>
    setFormulario((f) => ({ ...f, [campo]: valor }))

  const salvar = async () => {
    if (!formulario.cnpj.trim() || !formulario.razao_social.trim()) {
      toast({ title: 'CNPJ e Razão Social são obrigatórios', variant: 'destructive' })
      return
    }
    setSalvando(true)
    try {
      await pessoasJuridicasService.criar(formulario)
      toast({ title: 'Pessoa jurídica cadastrada' })
      setFormulario({ ...VAZIO })
      setAberto(false)
      onAtualizar()
    } catch (e) {
      toast({
        title: 'Erro ao salvar',
        description: e instanceof Error ? e.message : 'Tente novamente',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const campo = (label: string, key: keyof NovaPessoaJuridicaInput, placeholder = '') => (
    <div className="space-y-1">
      <Label className="text-xs text-emerald-800">{label}</Label>
      <Input
        value={(formulario[key] as string) || ''}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        className="rounded-xl border-emerald-200 text-sm"
      />
    </div>
  )

  const filtradas = pessoasJuridicas.filter((pj) => {
    if (!busca.trim()) return true
    const q = busca.toLowerCase()
    return (
      pj.razao_social.toLowerCase().includes(q) ||
      pj.cnpj.toLowerCase().includes(q) ||
      (pj.representante && pj.representante.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-4">
      <Card className="border-emerald-100 bg-white shadow-sm rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-700/60" />
            <Input
              placeholder="Buscar por razão social, CNPJ ou representante..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 rounded-xl border-emerald-200 focus:ring-emerald-600 bg-emerald-50/20 text-sm"
            />
          </div>
          <Dialog open={aberto} onOpenChange={setAberto}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs h-9">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Nova Pessoa Jurídica
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border-emerald-100">
              <DialogHeader>
                <DialogTitle className="font-serif italic text-xl text-emerald-950">
                  Cadastrar Pessoa Jurídica
                </DialogTitle>
                <DialogDescription className="text-xs text-emerald-700">
                  Empresas prestadoras de serviço (mão de obra PJ) que utilizam dispositivos da
                  ENVIMAT.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5">
                <section className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    Identificação
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {campo('CNPJ *', 'cnpj', '00.000.000/0000-00')}
                    {campo('Razão Social *', 'razao_social')}
                    {campo('Representante', 'representante', 'Nome do representante legal')}
                    {campo('CPF do Representante', 'cpf_representante', '000.000.000-00')}
                  </div>
                </section>
                <section className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    Endereço e contato
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">{campo('Endereço', 'endereco')}</div>
                    {campo('Cidade', 'cidade')}
                    {campo('Estado', 'estado', 'São Paulo')}
                    {campo('UF', 'uf', 'SP')}
                    {campo('Telefone', 'telefone')}
                    {campo('E-mail', 'email', 'contato@empresa.com')}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-emerald-800">Observações</Label>
                    <Textarea
                      value={formulario.observacoes || ''}
                      onChange={(e) => set('observacoes', e.target.value)}
                      className="rounded-xl border-emerald-200 text-sm min-h-[60px]"
                    />
                  </div>
                </section>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setAberto(false)}
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
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtradas.length === 0 ? (
          <div className="md:col-span-2 bg-white rounded-3xl border border-emerald-100 p-12 text-center">
            <Building2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-base font-semibold text-emerald-950">
              Nenhuma pessoa jurídica cadastrada
            </h4>
            <p className="text-xs text-emerald-700 mt-1">
              Cadastre as empresas PJ que recebem dispositivos da ENVIMAT.
            </p>
          </div>
        ) : (
          filtradas.map((pj) => (
            <Card
              key={pj.id}
              className="bg-white border-emerald-100/90 hover:border-emerald-300 transition-all rounded-2xl shadow-sm"
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-base text-emerald-950">
                        {pj.razao_social}
                      </h4>
                      <p className="text-xs text-emerald-700/80 font-mono">{pj.cnpj}</p>
                    </div>
                  </div>
                  {pj.is_demo && (
                    <Badge className="bg-emerald-100 text-emerald-800 rounded-full text-[10px]">
                      Exemplo
                    </Badge>
                  )}
                </div>

                <div className="space-y-1 text-xs text-emerald-900/80">
                  {pj.representante && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        {pj.representante}
                        {pj.cpf_representante ? ` — CPF ${pj.cpf_representante}` : ''}
                      </span>
                    </div>
                  )}
                  {pj.endereco && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        {pj.endereco}
                        {pj.cidade ? ` — ${pj.cidade}` : ''}
                        {pj.uf ? `/${pj.uf}` : ''}
                      </span>
                    </div>
                  )}
                  {pj.telefone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{pj.telefone}</span>
                    </div>
                  )}
                  {pj.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{pj.email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
