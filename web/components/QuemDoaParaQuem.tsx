'use client'

import { useState } from 'react'
import { doadoresDeHemacias, receptoresDeHemacias } from '@/lib/domain/compatibilidade'
import { TIPOS_SANGUINEOS, type TipoSanguineo } from '@/lib/domain/tipos'

export function QuemDoaParaQuem() {
  const [tipo, setTipo] = useState<TipoSanguineo>('O-')

  return (
    <section aria-labelledby="titulo-compatibilidade" className="compatibilidade">
      <h2 id="titulo-compatibilidade">Quem doa para quem</h2>
      <label className="campo">
        Seu tipo sanguíneo
        <select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoSanguineo)}>
          {TIPOS_SANGUINEOS.map((opcao) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </select>
      </label>
      <dl>
        <dt>Pode doar hemácias para</dt>
        <dd data-testid="doa-para">{receptoresDeHemacias(tipo).join(', ')}</dd>
        <dt>Pode receber hemácias de</dt>
        <dd data-testid="recebe-de">{doadoresDeHemacias(tipo).join(', ')}</dd>
      </dl>
    </section>
  )
}
