'use client'

import Link from 'next/link'
import { type FormEvent, useState } from 'react'
import { dataLocal, parseData } from '@/lib/domain/datas'
import { avaliarCandidato, type ResultadoAvaliacao, type Sexo } from '@/lib/domain/elegibilidade'

export function PossoDoar({ hoje }: { hoje?: Date }) {
  const [resultado, setResultado] = useState<ResultadoAvaliacao | null>(null)
  const [erro, setErro] = useState('')

  function verificar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const dados = new FormData(evento.currentTarget)
    const ultimaDoacao = String(dados.get('ultima-doacao') ?? '')
    setErro('')
    setResultado(null)
    try {
      setResultado(
        avaliarCandidato(
          {
            nascimento: parseData(String(dados.get('nascimento'))),
            sexo: dados.get('sexo') as Sexo,
            pesoKg: Number(dados.get('peso')),
            doacoes: ultimaDoacao ? [parseData(ultimaDoacao)] : [],
          },
          hoje ?? dataLocal(new Date()),
        ),
      )
    } catch {
      setErro('Confira a data de nascimento, o peso e a data da última doação')
    }
  }

  return (
    <div className="posso-doar">
      <form className="formulario caixa" noValidate onSubmit={verificar}>
        <div className="campo">
          <label htmlFor="nascimento">Data de nascimento</label>
          <input id="nascimento" name="nascimento" type="date" required aria-describedby="dica-nascimento" />
          <small id="dica-nascimento">Pode doar de 16 a 69 anos.</small>
        </div>
        <div className="campo">
          <label htmlFor="sexo">Sexo</label>
          <select id="sexo" name="sexo" defaultValue="feminino" aria-describedby="dica-sexo">
            <option value="feminino">Feminino</option>
            <option value="masculino">Masculino</option>
          </select>
          <small id="dica-sexo">Define o intervalo: 3 meses para mulheres, 2 meses para homens.</small>
        </div>
        <div className="campo">
          <label htmlFor="peso">Peso (kg)</label>
          <input
            id="peso"
            name="peso"
            type="number"
            min="1"
            step="0.1"
            inputMode="decimal"
            required
            aria-describedby="dica-peso"
          />
          <small id="dica-peso">A partir de 50 kg.</small>
        </div>
        <div className="campo">
          <label htmlFor="ultima-doacao">Data da última doação</label>
          <input id="ultima-doacao" name="ultima-doacao" type="date" aria-describedby="dica-ultima" />
          <small id="dica-ultima">Deixe em branco se nunca doou.</small>
        </div>
        <button type="submit" className="botao botao-primario">
          Verificar
        </button>
        {erro && (
          <p role="alert" className="erro">
            {erro}
          </p>
        )}
      </form>

      <div className="resultado" aria-live="polite">
        {resultado ? (
          <div role="status" className="secao">
            <span className={`selo-resultado nivel-${resultado.podeDoarHoje ? 'estavel' : 'alerta'}`}>
              {resultado.podeDoarHoje ? 'Pode doar' : 'Ainda não'}
            </span>
            <h2>{resultado.podeDoarHoje ? 'Você pode doar hoje' : 'Hoje você ainda não pode doar'}</h2>
            {resultado.mensagens.length > 0 && (
              <ul>
                {resultado.mensagens.map((mensagem) => (
                  <li key={mensagem}>{mensagem}</li>
                ))}
              </ul>
            )}
            <p className="nota">
              Resultado indicativo. A triagem do hemocentro ainda pergunta sobre saúde, viagens e remédios.
              Leve um documento com foto.
            </p>
            <Link href="/" className="botao botao-contorno" style={{ alignSelf: 'flex-start' }}>
              Ver onde falta sangue
            </Link>
          </div>
        ) : (
          <>
            <h2>Preencha os dados e toque em Verificar</h2>
            <p>A resposta aparece aqui, com a próxima data em que você pode doar.</p>
          </>
        )}
      </div>
    </div>
  )
}
