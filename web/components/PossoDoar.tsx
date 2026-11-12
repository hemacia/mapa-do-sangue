'use client'

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
    <>
      <form className="formulario" noValidate onSubmit={verificar}>
        <label className="campo">
          Data de nascimento
          <input name="nascimento" type="date" required />
        </label>
        <label className="campo">
          Sexo
          <select name="sexo" defaultValue="feminino">
            <option value="feminino">Feminino</option>
            <option value="masculino">Masculino</option>
          </select>
        </label>
        <label className="campo">
          Peso (kg)
          <input name="peso" type="number" min="1" step="0.1" inputMode="decimal" required />
        </label>
        <label className="campo">
          Data da última doação (deixe vazio se nunca doou)
          <input name="ultima-doacao" type="date" />
        </label>
        <button type="submit" className="botao">
          Verificar
        </button>
      </form>

      {erro && (
        <p role="alert" className="erro" style={{ marginTop: 'var(--space-4)' }}>
          {erro}
        </p>
      )}
      {resultado && (
        <div role="status" className={`resultado nivel-${resultado.podeDoarHoje ? 'adequado' : 'alerta'}`}>
          <p>
            <strong>
              {resultado.podeDoarHoje ? 'Você pode doar hoje' : 'Hoje você ainda não pode doar'}
            </strong>
          </p>
          {resultado.mensagens.length > 0 && (
            <ul>
              {resultado.mensagens.map((mensagem) => (
                <li key={mensagem}>{mensagem}</li>
              ))}
            </ul>
          )}
          <p className="nota" style={{ marginTop: 'var(--space-3)' }}>
            Resultado indicativo. A triagem no hemocentro é quem confirma.
          </p>
        </div>
      )}
    </>
  )
}
