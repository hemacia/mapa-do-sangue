// Ambiente local completo: banco D1 zerado, dados reais coletados agora e API na porta 8788.
// Em outro terminal, `npm run dev` abre o site com hot reload em http://localhost:5173.
// Uso: npm run local            (coleta ao vivo; se nenhuma fonte responder, usa as fixtures)
//      npm run local -- --fixtures
import { execSync } from 'node:child_process'
import { rmSync } from 'node:fs'

const rodar = (comando) => execSync(comando, { stdio: 'inherit' })

rmSync('.wrangler/state', { recursive: true, force: true })
rodar('npm run build')
rodar('npx wrangler d1 migrations apply mapa-do-sangue --local')

let arquivo = 'tests/e2e/seed.sql'
if (!process.argv.includes('--fixtures')) {
  try {
    rodar('npm run coletar -- coleta.sql')
    arquivo = 'coleta.sql'
  } catch {
    console.log('Coleta ao vivo falhou, usando as fixtures')
  }
}
rodar(`npx wrangler d1 execute mapa-do-sangue --local --file ${arquivo}`)
rodar('npx wrangler pages dev --port 8788')
