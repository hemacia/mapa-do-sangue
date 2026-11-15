'use client'

import { useState } from 'react'
import { doadoresDeHemacias, podeDoarHemacias, receptoresDeHemacias } from '@/lib/domain/compatibilidade'
import { TIPOS_SANGUINEOS, type TipoSanguineo } from '@/lib/domain/tipos'

export function QuemDoaParaQuem() {
  const [tipo, setTipo] = useState<TipoSanguineo>('O-')

  return (
    <section aria-labelledby="titulo-compatibilidade" className="secao">
      <div className="compatibilidade-topo">
        <div className="cabecalho">
          <h2 id="titulo-compatibilidade" className="titulo" style={{ fontSize: '2.25rem' }}>
            Quem doa para quem
          </h2>
          <p>Compatibilidade de hemácias. Cada linha é quem doa; cada coluna, quem recebe.</p>
        </div>
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
      </div>
      <div className="compatibilidade-corpo caixa">
        <div className="matriz-rolagem">
          <table className="matriz">
            <caption className="visualmente-oculto">Quem pode doar hemácias para quem</caption>
            <thead>
              <tr>
                <th scope="col">doador / receptor</th>
                {TIPOS_SANGUINEOS.map((receptor) => (
                  <th key={receptor} scope="col">
                    {receptor}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIPOS_SANGUINEOS.map((doador) => (
                <tr key={doador} className={doador === tipo ? 'selecionado' : undefined}>
                  <th scope="row">{doador}</th>
                  {TIPOS_SANGUINEOS.map((receptor) => {
                    const pode = podeDoarHemacias(doador, receptor)
                    return (
                      <td key={receptor} className={pode ? 'pode' : undefined}>
                        <span className="visualmente-oculto">{pode ? 'pode doar' : 'não pode'}</span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="compatibilidade-texto">
          <dl>
            <dt>{tipo} pode doar hemácias para</dt>
            <dd data-testid="doa-para">{receptoresDeHemacias(tipo).join(', ')}</dd>
            <dt>{tipo} pode receber hemácias de</dt>
            <dd data-testid="recebe-de">{doadoresDeHemacias(tipo).join(', ')}</dd>
          </dl>
          <p className="nota">
            Verde-azulado: pode doar. Cinza: não pode. Plaquetas e plasma seguem outras regras.
          </p>
        </div>
      </div>
    </section>
  )
}
