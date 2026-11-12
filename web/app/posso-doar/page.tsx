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
          A conta usa as regras da Portaria GM/MS nº 11.685/2026: idade de 16 a 69 anos, peso a partir de 50
          kg e intervalo de 2 meses (homens) ou 3 meses (mulheres) desde a última doação. Nada do que você
          digitar sai do seu navegador.
        </p>
      </div>
      <PossoDoar />
      <QuemDoaParaQuem />
    </div>
  )
}
