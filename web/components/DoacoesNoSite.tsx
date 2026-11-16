'use client'

import { useEffect, useState } from 'react'
import { criarCliente, type TotalDoMes } from '@/lib/api/cliente'

const api = criarCliente(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080')
const plural = (n: number) => (n === 1 ? '1 doação' : `${n} doações`)

export function DoacoesNoSite({ totalDoMes = api.totalDoMes }: { totalDoMes?: () => Promise<TotalDoMes> }) {
  const [total, setTotal] = useState<TotalDoMes | null>(null)

  useEffect(() => {
    totalDoMes()
      .then(setTotal)
      .catch(() => setTotal(null))
  }, [totalDoMes])

  if (!total) return null
  return (
    <p className="doacoes-no-site">
      Registradas neste site: {plural(total.hoje)} hoje e {plural(total.total)} neste mês.{' '}
      <a href="#eu-doei">Doou? Conte para o mapa</a>
    </p>
  )
}
