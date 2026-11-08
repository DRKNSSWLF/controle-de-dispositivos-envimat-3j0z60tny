import { Dispositivo } from '@/types/inventory'

// Modelos de contrato por tipo de dispositivo — cada tipo tem seus campos específicos.
const rotuloDispositivo: Record<string, string> = {
  celular: 'CELULAR / SMARTPHONE',
  tablet: 'TABLET',
  notebook: 'NOTEBOOK',
  outro: 'EQUIPAMENTO ELETRÔNICO',
}

interface CampoContrato {
  rotulo: string
  valor: string
}

function camposDoDispositivo(d: Dispositivo): CampoContrato[] {
  const base: CampoContrato[] = [
    { rotulo: 'Tipo', valor: rotuloDispositivo[d.tipo] || d.tipo },
    { rotulo: 'Fabricante', valor: d.fabricante || '-' },
    { rotulo: 'Modelo', valor: d.modelo || '-' },
    { rotulo: 'RAM', valor: d.ram || '-' },
  ]

  if (d.tipo === 'celular') {
    return [
      ...base,
      { rotulo: 'Armazenamento Interno', valor: d.armazenamento_interno || '-' },
      { rotulo: 'IMEI 1', valor: d.imei1 || '-' },
      { rotulo: 'IMEI 2', valor: d.imei2 || '-' },
      { rotulo: 'Número de Série', valor: d.numero_serie || '-' },
    ]
  }

  if (d.tipo === 'tablet') {
    return [
      ...base,
      { rotulo: 'Armazenamento Interno', valor: d.armazenamento_interno || '-' },
      { rotulo: 'Armazenamento Externo', valor: d.armazenamento_externo || '-' },
      { rotulo: 'Número de Série', valor: d.numero_serie || '-' },
    ]
  }

  if (d.tipo === 'notebook') {
    return [
      ...base,
      { rotulo: 'Processador', valor: d.processador || '-' },
      { rotulo: 'Armazenamento', valor: d.armazenamento_interno || '-' },
      { rotulo: 'IMEI 1', valor: d.imei1 || '-' },
      { rotulo: 'IMEI 2', valor: d.imei2 || '-' },
      { rotulo: 'Número de Série', valor: d.numero_serie || '-' },
    ]
  }

  return [
    ...base,
    { rotulo: 'Armazenamento Interno', valor: d.armazenamento_interno || '-' },
    { rotulo: 'Número de Série', valor: d.numero_serie || '-' },
  ]
}

export { camposDoDispositivo, rotuloDispositivo }
