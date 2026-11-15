import type { Metadata, Viewport } from 'next'
import { Barlow, Barlow_Condensed } from 'next/font/google'
import Link from 'next/link'
import { SCRIPT_TEMA } from '@/components/BotaoTema'
import { Topo } from '@/components/Topo'
import { SITE } from '@/lib/site'
import './globals.css'

const barlow = Barlow({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-barlow' })
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-barlow-condensed',
})

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
    { media: '(prefers-color-scheme: dark)', color: '#0a2a40' },
    { media: '(prefers-color-scheme: light)', color: '#0a2a40' },
  ],
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${barlow.variable} ${barlowCondensed.variable}`} suppressHydrationWarning>
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
          Estoque coletado dos sites oficiais dos hemocentros duas vezes por dia. Coletas por habitante:
          Anvisa (Hemoprod) e IBGE. <Link href="/sobre">Como os dados são coletados</Link>
        </footer>
      </body>
    </html>
  )
}
