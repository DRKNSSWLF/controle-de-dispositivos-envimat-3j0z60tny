import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PessoaJuridica } from '@/types/inventory'
import { Building2, Search, MapPin, Phone, Mail, User } from 'lucide-react'

interface SecaoPessoasJuridicasProps {
  pessoasJuridicas: PessoaJuridica[]
  onAtualizar: () => void
}

/** Listagem de Pessoas Jurídicas. O cadastro foi movido para a aba
 *  "Cadastros" do painel (ModalCadastrarPessoaJuridica). */
export function SecaoPessoasJuridicas({ pessoasJuridicas }: SecaoPessoasJuridicasProps) {
  const [busca, setBusca] = useState('')

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
        <CardContent className="p-4 sm:p-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-700/60" />
            <Input
              placeholder="Buscar por razão social, CNPJ ou representante..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 rounded-xl border-emerald-200 focus:ring-emerald-600 bg-emerald-50/20 text-sm"
            />
          </div>
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
              Cadastre empresas PJ na aba “Cadastros” do painel.
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
