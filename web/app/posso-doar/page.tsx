import type { Metadata } from 'next'
import { PossoDoar } from '@/components/PossoDoar'
import { QuemDoaParaQuem } from '@/components/QuemDoaParaQuem'

export const metadata: Metadata = {
  title: 'Posso doar sangue?',
  description:
    'Confira se você pode doar sangue hoje pela idade, peso e data da última doação, segundo as regras do Ministério da Saúde.',
  alternates: { canonical: '/posso-doar' },
}

export default function PaginaPossoDoar() {
  return (
    <div className="pagina">
      <div className="cabecalho">
        <h1>Posso doar sangue?</h1>
        <p>
          Confira idade, peso e o intervalo desde a última doação pelas regras da Portaria GM/MS nº
          11.685/2026. Nada do que você digitar sai do seu navegador.
        </p>
      </div>
      <PossoDoar />
      <QuemDoaParaQuem />
    </div>
  )
}
