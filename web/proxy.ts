import { type NextRequest, NextResponse } from 'next/server'
import { UFS } from '@/lib/domain/ufs'

export const config = { matcher: '/estado/:uf' }

// A página do estado transmite em streaming (status 200 já enviado). Checar a UF aqui,
// antes de começar a resposta, é o que garante o 404 de verdade para /estado/xx.
export function proxy(request: NextRequest) {
  const parametro = request.nextUrl.pathname.split('/')[2] ?? ''
  if (!(UFS as string[]).includes(parametro.toUpperCase())) {
    return NextResponse.rewrite(new URL('/estado-inexistente', request.url))
  }
  // Uma URL só por estado (a canônica, em minúsculas).
  if (parametro !== parametro.toLowerCase()) {
    return NextResponse.redirect(new URL(`/estado/${parametro.toLowerCase()}`, request.url), 308)
  }
}
