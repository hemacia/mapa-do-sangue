'use client'

import { type FormEvent, useEffect, useState } from 'react'
import { criarCliente, type Doacao, type NovaDoacao, type TotalDoMes } from '@/lib/api/cliente'
import { TIPOS_SANGUINEOS, type TipoSanguineo } from '@/lib/domain/tipos'
import { NOMES_UF, UFS } from '@/lib/domain/ufs'

interface Props {
  registrar?: (doacao: NovaDoacao) => Promise<Doacao>
  totalDoMes?: () => Promise<TotalDoMes>
}

// O navegador fala direto com a API (CORS liberado só para o site).
const api = criarCliente(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080')

export function EuDoei({ registrar = api.registrarDoacao, totalDoMes = api.totalDoMes }: Props) {
  const [total, setTotal] = useState<number | null>(null)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    totalDoMes()
      .then((t) => setTotal(t.total))
      .catch(() => setTotal(null))
  }, [totalDoMes])

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const dados = new FormData(evento.currentTarget)
    const tipo = (dados.get('tipo') as TipoSanguineo | '') || null
    setMensagem('')
    setErro('')
    setEnviando(true)
    try {
      await registrar({ uf: String(dados.get('uf')), tipo })
      setMensagem('Obrigado por doar! Sua doação entrou no contador do mês.')
      setTotal((t) => (t === null ? t : t + 1))
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível registrar')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="eu-doei" aria-labelledby="titulo-eu-doei">
      <div className="eu-doei-texto">
        <h2 id="titulo-eu-doei">Doou sangue hoje? Conte para o mapa</h2>
        <p>
          Guardamos só o estado e o tipo, sem nome nem e-mail.{' '}
          {total !== null && (
            <span data-testid="total-mes" data-total={total}>
              {total === 0
                ? 'Ninguém registrou doação este mês ainda.'
                : `${total.toLocaleString('pt-BR')} ${total === 1 ? 'doação registrada' : 'doações registradas'} este mês.`}
            </span>
          )}
        </p>
      </div>
      <form onSubmit={enviar}>
        <label className="campo">
          Estado
          <select name="uf" required defaultValue="">
            <option value="" disabled>
              Escolha o estado
            </option>
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {NOMES_UF[uf]}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          Tipo sanguíneo
          <select name="tipo" defaultValue="">
            <option value="">Prefiro não dizer</option>
            {TIPOS_SANGUINEOS.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="botao botao-escuro" disabled={enviando}>
          Registrar minha doação
        </button>
        {mensagem && <p role="status">{mensagem}</p>}
        {erro && (
          <p role="alert" className="erro">
            {erro}
          </p>
        )}
      </form>
    </section>
  )
}
