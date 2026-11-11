// Sobe o site com Pages Functions e um D1 local zerado, populado com tests/e2e/seed.sql.
import { execSync } from 'node:child_process'
import { rmSync } from 'node:fs'

const rodar = (comando) => execSync(comando, { stdio: 'inherit' })

rmSync('.wrangler/state', { recursive: true, force: true })
rodar('npm run build')
rodar('npx wrangler d1 migrations apply mapa-do-sangue --local')
rodar('npx wrangler d1 execute mapa-do-sangue --local --file tests/e2e/seed.sql')
rodar('npx wrangler pages dev --port 4173')
