import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Colaborador } from '@/types/inventory'
import { ModalCadastrarDispositivo } from './ModalCadastrarDispositivo'
import { ModalCadastrarColaborador } from './ModalCadastrarColaborador'
import { ModalCadastrarPessoaJuridica } from './ModalCadastrarPessoaJuridica'
import { ModalLinhaTelefonica } from './ModalLinhaTelefonica'
import { SecaoTiposDispositivo } from './SecaoTiposDispositivo'
import { Smartphone, UserPlus, Building2, Phone } from 'lucide-react'

interface AreaCadastrosProps {
  colaboradores: Colaborador[]
  onAtualizar: () => void
}

/** Área "Cadastros" do painel: concentra TODOS os cadastros em um só lugar
 *  (dispositivo, colaborador, pessoa jurídica, tipos de dispositivo e linha
 *  telefônica). Master e Administrativo usam a mesma área. */
export function AreaCadastros({ colaboradores, onAtualizar }: AreaCadastrosProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-emerald-100 p-5 sm:p-6 shadow-sm">
        <h3 className="font-serif italic text-xl font-normal text-emerald-950">Cadastros</h3>
        <p className="text-xs text-emerald-700/80 mt-1">
          Central única de inclusões no inventário. Nada é excluído — registros apenas mudam de
          status e o histórico fica preservado.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white border-emerald-100 rounded-2xl shadow-sm">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-sm text-emerald-950">Novo Dispositivo</h4>
                <p className="text-xs text-emerald-700/80">
                  Celulares, notebooks, tablets e coletores com série e IMEIs.
                </p>
              </div>
            </div>
            <ModalCadastrarDispositivo
              colaboradores={colaboradores}
              onDispositivoSalvo={onAtualizar}
              triggerButton={
                <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm">
                  Abrir cadastro de dispositivo
                </Button>
              }
            />
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-100 rounded-2xl shadow-sm">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-sm text-emerald-950">Novo Colaborador</h4>
                <p className="text-xs text-emerald-700/80">
                  Dados completos exigidos pelo contrato de comodato.
                </p>
              </div>
            </div>
            <ModalCadastrarColaborador
              onColaboradorSalvo={onAtualizar}
              triggerButton={
                <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm">
                  Abrir cadastro de colaborador
                </Button>
              }
            />
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-100 rounded-2xl shadow-sm">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-sm text-emerald-950">Nova Pessoa Jurídica</h4>
                <p className="text-xs text-emerald-700/80">
                  Empresas prestadoras (mão de obra PJ) que usam dispositivos da ENVIMAT.
                </p>
              </div>
            </div>
            <ModalCadastrarPessoaJuridica
              onSalvo={onAtualizar}
              triggerButton={
                <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm">
                  Abrir cadastro de PJ
                </Button>
              }
            />
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-100 rounded-2xl shadow-sm">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-sm text-emerald-950">Nova Linha Telefônica</h4>
                <p className="text-xs text-emerald-700/80">
                  Linhas corporativas (celular ou modem). Vínculos na aba Linhas Telefônicas.
                </p>
              </div>
            </div>
            <ModalLinhaTelefonica
              onLinhaSalva={onAtualizar}
              triggerButton={
                <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm">
                  Abrir cadastro de linha
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>

      <SecaoTiposDispositivo onAtualizado={onAtualizar} />
    </div>
  )
}
