import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata, Viewport } from 'next'
import { SCRIPT_TEMA } from '@/components/BotaoTema'
import { Topo } from '@/components/Topo'
import { SITE } from '@/lib/site'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.nome}: estoque de sangue dos hemocentros do Brasil`,
    template: `%s | ${SITE.nome}`,
  },
  description: SITE.descricao,
  applicationName: SITE.nome,
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'pt_BR', siteName: SITE.nome, url: '/' },
  twitter: { card: 'summary_large_image' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#101216' },
    { media: '(prefers-color-scheme: light)', color: '#f6f7f9' },
  ],
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: script fixo, sem dado do usuário */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body>
        <a href="#conteudo" className="pular">
          Pular para o conteúdo
        </a>
        <Topo />
        <main id="conteudo">{children}</main>
        <footer className="rodape">
          Projeto open source da disciplina de Teste de Software (UFMG). Dados dos sites oficiais dos
          hemocentros, da Anvisa e do IBGE. <a href={SITE.repositorio}>Código no GitHub</a>
        </footer>
      </body>
    </html>
  )
}
