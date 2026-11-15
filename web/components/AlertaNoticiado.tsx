import type { AlertaNoticiado as Alerta } from '@/lib/api/cliente'

const dia = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'America/Sao_Paulo',
})

// Notícia não é leitura do estoque: o texto diz isso e leva para a fonte.
export function AlertaNoticiado({ alertas }: { alertas: Alerta[] }) {
  const [alerta] = alertas
  if (!alerta) return null
  return (
    <aside className="alerta-noticiado" aria-labelledby="alerta-noticiado">
      <p id="alerta-noticiado">
        <strong>Alerta noticiado em {dia.format(new Date(alerta.publicadoEm))}:</strong>{' '}
        <a href={alerta.url}>{alerta.titulo}</a>
      </p>
      <small>Notícia do site oficial do estado, não uma leitura do estoque.</small>
    </aside>
  )
}
