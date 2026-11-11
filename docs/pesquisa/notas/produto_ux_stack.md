# Produto/UX de referência e stack técnica para o "Mapa do Sangue" (site estático, open source, TP de Teste de Software)

## 1. Como serviços de sangue visualizam estoques (NHSBT, Cruz Vermelha, Lifeblood, CBS, Héma-Québec, EFS, Sanquin, eRaktKosh, hemocentros BR)

### Takeaway
O padrão dominante é **status por tipo sanguíneo (8 tipos) em escala ordinal de 3 a 5 níveis com rótulo em texto**. A métrica é "dias de estoque" (CBS, EFS, Sanquin, Pró-Sangue) ou unidades (Lifeblood). No Brasil, a escala costuma ser "estável / alerta / crítico" (às vezes "emergência"), quase sempre ligada a dias de cobertura. Para o Mapa do Sangue, recomenda-se 4 níveis com texto + ícone + cor, por tipo e por hemocentro.

### Cited Findings
- **Lifeblood (Austrália)**: o "Blood Supply Update" foi lançado em 12/jun/2024. Mostra apenas hemácias, por tipo sanguíneo, com filtro Austrália/estado. A métrica é o número de bolsas mantidas após abastecer os hospitais. Os níveis são **Very low** ("agende agora"), **Low**, **Need more** ("doações necessárias nos próximos 5 dias"), **Ok** e **Good** ("considere doar plasma"). Cada nível vem com uma chamada à ação diferente — [Lifeblood media release](https://www.lifeblood.com.au/news-and-stories/media-centre/media-releases/blood-alert-new-system-allows-people-track-blood-supplies-6500-donors); página: [lifeblood.com.au/blood/blood-supply-levels](https://www.lifeblood.com.au/blood/blood-supply-levels)
- A National Blood Authority avisa que os níveis do site da Lifeblood são "indicativos" e não incluem o estoque dos hospitais — [blood.gov.au](https://blood.gov.au/node/8406)
- **Canadian Blood Services**: o "National blood inventory" aparece na home em **dias de estoque por tipo**, com rótulo "Good supply" (snapshot sem data: AB+ 9, AB− 8, A+ 7, A− 12, B+ 6, B− 6, O+ 5 dias) e um total geral (cerca de 19–20 dias) — [blood.ca](https://www.blood.ca/en), [sang.ca/en/blood](https://www.sang.ca/en/blood). Um gráfico histórico em Datawrapper foi usado pela imprensa — [Datawrapper](https://datawrapper.dwcdn.net/Sd6WH/1)
- A legenda hospitalar canadense (NEBMC) usa **Green > 3 dias, Amber 2–3 dias, Red < 2 dias** — [sang.ca Report Legend](https://sang.ca/sites/default/files/Report-Legend.pdf)
- **EFS (França)**: comunica o estoque em "dias" e em número de bolsas. A meta é de 100.000 bolsas; 75.000 equivalem a cerca de 11 dias. As plaquetas duram 5 dias e as hemácias, 42 — [EFS comunicado 2020](https://www.efs.sante.fr/sites/instit/files/2020-09/CP_Mobilisation_web.pdf); [Le Quotidien du Médecin](https://www.lequotidiendumedecin.fr/specialites/appel-urgent-aux-dons-de-sang-pour-la-fin-dannee)
- **Sanquin (Holanda)**: monitora o estoque diariamente e escala ações (redes sociais, contato direto, sessões extras) perto do nível crítico. O normal é cerca de 7 dias; em 2020 chegou a cerca de 3,5–4 dias — [NOS](https://nos.nl/artikel/2236411-bloedbanken-op-zoek-naar-donoren-vanwege-lage-bloedstand); [Hart van Nederland](https://www.hartvannederland.nl/nieuws/2020/bloedbank-vreest-tekort-aan-bloed-wegens-coronavirus)
- **eRaktKosh (Índia)**: portal governamental com busca de disponibilidade por estado, distrito ou banco de sangue e por componente (sangue total por padrão, ou plaquetas). Mostra "última atualização" ou status "LIVE". O app localiza bancos próximos por GPS. Os bancos licenciados devem atualizar o estoque diariamente — [eRaktKosh FAQ](https://eraktkosh.mohfw.gov.in/BLDAHIMS/bloodbank/eraktkoshfaq.cnt)
- **Pró-Sangue (SP)**: usa os níveis **emergência / crítico / alerta / estável**. "Crítico" significa estoque para no máximo 1 dia, "alerta" até 2 dias, e "emergência" menos de 1 dia — [Gazeta SP](https://www.gazetasp.com.br/cotidiano/fundacao-pro-sangue-de-sao-paulo-tem-estoques-em-nivel-critico/); [Correio Braziliense 2022](https://www.correiobraziliense.com.br/brasil/2022/02/amp/4981735-queda-sem-precedentes-em-doacoes-de-sangue-coloca-bancos-em-alerta-no-brasil-e-no-mundo.html)
- **Hemominas (MG)**: monitora 8 tipos com a escala "estável / alerta / crítico" e expressa a queda em % abaixo do nível adequado (ex.: O+ −55%, O− −42%; em fev/2026, −43% nos negativos e −33% nos positivos) — [Tribuna de Minas, 14/02/2026](https://tribunademinas.com.br/noticias/cidade/14-02-2026/hemominas-estoques.html?amp=1); [Itatiaia](https://www.itatiaia.com.br/saude/hemominas-alerta-para-estoques-criticos-de-sangue-em-minas-gerais/)
- **NHS Blood and Transplant**: a URL do "blood stocks" (`blood.co.uk/why-give-blood/blood-stocks/`) retornou 404 em nov/2026. A home atual não mostra níveis, só o app NHS Give Blood para agendar e gerenciar doações — [blood.co.uk](https://www.blood.co.uk/)
- **Héma-Québec**: a home (redirecionada para hemaquebec.ca) não mostrou indicador de reserva no conteúdo extraído — [hemaquebec.ca](https://www.hemaquebec.ca/)

### Inferences
- Modelo recomendado: um **cartão por tipo (8)** com rótulo textual do nível + ícone de gota preenchida proporcionalmente + cor, mais a data/hora da última atualização (como no eRaktKosh). Cada nível deve ter um CTA próprio (padrão Lifeblood: "Muito baixo → doe agora").
- Escala de 4 níveis compatível com os hemocentros BR: **Crítico (<1–2 dias) / Alerta / Adequado / Estável**. Mapear a nomenclatura de cada hemocentro para essa escala comum numa função pura e testável (bom alvo para os testes unitários).
- "Dias de estoque" é a métrica mais comparável entre instituições, mas os hemocentros BR divulgam majoritariamente categorias ou %. Usar a categoria como dado canônico e os dias ou % como opcionais.

### Gaps
- Não consegui confirmar visualmente a página atual do NHSBT (404), do Héma-Québec, do EFS ("niveau des réserves" / app "Don de sang") nem do Sanquin ("bloedvoorraad"). Também não confirmei se usam gotas/ícones ou cores específicas.
- Não verifiquei quais hemocentros BR publicam estoque em HTML estruturado, imagem ou só em redes sociais (outro pesquisador cobre fontes de dados).
- American Red Cross: não encontrei um painel público de estoque por tipo; só alertas de escassez no app (ver seção 2).

## 2. Funcionalidades que aumentam doações e evidência científica

### Takeaway
A evidência mais sólida (revisão sistemática de 29 estudos) aponta **lembretes e apelos motivacionais/altruístas** como as intervenções mais eficazes. Recursos digitais (apps, gamificação) são comuns, mas têm evidência causal fraca. Para um site estático, os itens viáveis e com melhor evidência são o CTA por nível, a calculadora de "próxima data apta" com lembrete em calendário (.ics) e o compartilhamento.

### Cited Findings
- Godin et al. (2012), *Transfusion Medicine Reviews* 26(3):224-237, doi:10.1016/j.tmrv.2011.10.001: 29 ECRs/quase-experimentos e 36 intervenções. As mais eficazes foram cognições psicossociais (OR ≈ 2,47), motivos altruístas (OR ≈ 3,89, IC largo) e **lembretes (OR ≈ 1,91; 7 amostras)**. Os autores dizem que os achados são "dispersos e às vezes inconsistentes" — [registro bibliográfico](https://searchworks.jioinstitute.edu.in/articles/edo__76610506) (só o resumo foi lido)
- Revisão sobre comunicação interativa (Boult et al.): evidência conflitante para ligações, sessões educativas e entrevistas motivacionais; **pouca pesquisa sobre intervenções web** e recrutamento de primeira vez — [ORA Oxford](https://ora.ox.ac.uk/objects/uuid:6cd04a59-4120-450e-8222-178748da7410/files/r3r074x294)
- Revisão sistemática de apps móveis de doação (2023) — [PMC10563464](https://pmc.ncbi.nlm.nih.gov/articles/PMC10563464)
- Shah et al. (2016), estudo pré-pós sem grupo controle: após promoções por SMS, e-mail e redes sociais, +45,11% de doadores de primeira vez e +37,24% de repetição — [PMC5243155](https://pmc.ncbi.nlm.nih.gov/articles/PMC5243155)
- App da American Red Cross: lembretes de agendamento e **alertas de escassez**, **badges de conquista** compartilháveis, times com leaderboard, "acompanhe a jornada do seu sangue" até o hospital, e RapidPass (questionário pré-doação no celular) — [Red Cross Blood Donor App](https://www.redcrossblood.org/blood-donor-app); [App Store](https://apps.apple.com/us/app/blood-donor-american-red-cross/id911428916)
- NHS: app NHS Give Blood para agendar e gerenciar doações — [blood.co.uk](https://www.blood.co.uk/)
- Lifeblood: CTA atrelado a cada nível de estoque e sazonalidade explícita (maio–setembro é quando o estoque mais tende a "very low") — [Lifeblood](https://www.lifeblood.com.au/blood/blood-supply-levels)

### Inferences
- Funcionalidades prioritárias para o TP, todas sem backend e sem dado pessoal:
  1. CTA por nível ("O− crítico em BH → onde doar");
  2. calculadora de **próxima data apta** (intervalos por sexo, em lógica pura e muito testável) com botão "adicionar ao calendário" (.ics gerado no cliente), que é a forma estática de "lembrete";
  3. compartilhamento via Web Share API / link do WhatsApp com texto do tipo crítico;
  4. filtro "meu tipo sanguíneo" guardado em localStorage.
- Gamificação (badges, times) exige conta ou backend e foge do escopo. A evidência causal é fraca.
- Os intervalos e regras de aptidão devem citar a norma do Ministério da Saúde. Verificar a fonte antes de codificar (não pesquisado aqui).

### Gaps
- Não li o texto completo de Godin 2012 nem da revisão de apps de 2023. Não encontrei ECR isolando o efeito de painéis públicos de estoque sobre a conversão de doadores.

## 3. Acessibilidade da escala vermelha e UX de mapa (coroplético por UF, marcadores por hemocentro; Leaflet vs MapLibre; GeoJSON IBGE)

### Takeaway
Nunca codificar o nível só pela cor (WCAG 1.4.1, nível A). Usar texto + ícone/forma + cor, e uma escala sequencial que varie em **luminância** (não vermelho↔verde). Para coroplético de 27 UFs + marcadores, **Leaflet** é mais simples e suficiente. MapLibre só compensa com vector tiles ou estilos customizados. O GeoJSON vem da API de Malhas v3 do IBGE, baixado no build e versionado (não buscado em runtime).

### Cited Findings
- O WCAG 1.4.1 (Use of Color) não proíbe cor, proíbe cor como **único** diferenciador. A recomendação é adicionar rótulos de texto ou formas (círculo/triângulo/quadrado) — [WCAG 1.4.1 resumo](https://www.disabilityworld.org/toolkit/standards/wcag/1-4-1-use-of-color/); [uxdesign.cc traffic light](https://uxdesign.cc/beautiful-accessible-traffic-light-colors-b2b14a102a38)
- Escalas sequenciais de um só matiz (claro→escuro) sobrevivem à simulação de daltonismo porque a luminância carrega a informação. Evitar gradiente vermelho→verde. ColorBrewer e Okabe-Ito são as paletas testadas mais citadas — [Color blind friendly design](https://wcagkit.pages.dev/blog/color-blind-friendly-design) (fonte secundária)
- Leaflet renderiza em SVG/Canvas e o MapLibre exige WebGL. Leaflet é recomendado para coropléticos e marcadores simples, MapLibre para vector tiles, 3D e estilos — [pkgpulse 2026](https://www.pkgpulse.com/guides/mapbox-vs-leaflet-vs-maplibre-interactive-maps-2026)
- Benchmark acadêmico: até cerca de 10.000 polígonos, Leaflet e OpenLayers foram os mais rápidos; MapLibre/Mapbox GL ganham com volumes maiores — [AGRIS/FAO](https://agris.fao.org/search/fr/records/68caacf6f61e5b80b5e8f917)
- No MapLibre, uma camada GeoJSON exige um source + layer dentro do handler `load`; no Leaflet é uma única chamada `L.geoJSON` — [MapLibre Leaflet migration guide](https://maplibre.org/maplibre-gl-js/docs/guides/leaflet-migration-guide/index.md)
- API de Malhas IBGE v3, GeoJSON do Brasil por UF: `https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo+json&intrarregiao=UF`. A qualidade pode ser máxima (padrão), intermediária ou mínima, configurável no Query Builder — [IBGE API Malhas](https://servicodados.ibge.gov.br/api/docs/malhas?versao=3)

### Inferences
- Para o coroplético, usar uma paleta sequencial de um matiz (ex.: ColorBrewer "Reds", 4 classes) **mais** padrão/rótulo, porque UF é agregado. Nos marcadores de hemocentro, usar o ícone de gota com forma ou símbolo diferente por nível (ex.: "!" no crítico). Incluir uma **tabela alternativa** (lista acessível) ao lado do mapa, que também facilita os e2e no Playwright (seletores por role/texto).
- Baixar o GeoJSON com qualidade mínima ou intermediária e salvar em `public/data/uf.geojson` para reduzir o peso. Tiles do OpenStreetMap exigem atribuição. Como alternativa, renderizar só o GeoJSON, sem tiles de fundo.

### Gaps
- Não confirmei o valor literal do parâmetro `qualidade` nem se `intrarregiao=UF` é o valor exato. Testar a URL no Query Builder do IBGE.
- Não verifiquei a política de uso de tiles do OSM nem os provedores gratuitos de tiles em 2026.

## 4. Git scraping com GitHub Actions cron: padrão, limites e alternativas

### Takeaway
O padrão de Simon Willison (cron → fetch → pretty-print → `git commit || exit 0` → push) é ideal para atualizar um JSON versionado que o site estático consome. Limites: intervalo mínimo de 5 min, atrasos no início de cada hora, execução só no branch padrão, e em repositório público os agendamentos são **desativados após 60 dias sem atividade**. Os commits de bot **poluem a contagem dos ≥50 commits do TP**, então convém usar um branch `data` separado ou mensagens com prefixo claro.

### Cited Findings
- O git scraping consiste em buscar o recurso periodicamente, salvar em arquivo e commitar só se mudou. O exemplo usa um cron em minutos "quebrados" (`6,26,46 * * * *`), `jq .` para gerar diffs legíveis e `git commit -m "Latest data: ${timestamp}" || exit 0` — [Simon Willison, Git scraping](https://simonwillison.net/2020/Oct/9/git-scraping/)
- GitHub Docs: "The shortest interval you can run scheduled workflows is once every 5 minutes". O `schedule` "can be delayed during periods of high loads", com pico no início de cada hora. "Scheduled workflows will only run on the default branch". "In a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days" — [GitHub Docs, events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)

### Inferences
- Como o cron roda só no branch padrão, o workflow de scraping fica em `main`, mas pode fazer push do JSON para um branch `data` (ou `gh-pages`) e o site busca via raw ou no build. Isso separa o histórico de dados dos ≥50 commits "humanos" exigidos pelo TP e evita disparar CI de testes nos 3 SOs a cada atualização de dados. Alternativa: commitar em `main` com `paths-ignore: ['data/**']` no workflow de testes.
- Um push feito com `GITHUB_TOKEN` não dispara outros workflows (comportamento documentado do GitHub, não verificado nesta pesquisa). Se o deploy depender de push, usar a integração Git do Cloudflare/Netlify, que reage a qualquer push, ou disparar o deploy no próprio job.
- Para scrapers de sites renderizados por JS: usar Playwright no job (`npx playwright install --with-deps chromium`) e, sempre que possível, interceptar o XHR/JSON de origem (`page.waitForResponse`) em vez de parsear o DOM.
- Prefira a frequência de 1–4×/dia (estoques mudam diariamente), o que é gentil com sites governamentais.

### Gaps
- Não confirmei na documentação se commits automáticos do bot contam como "atividade" para o limite de 60 dias. Por segurança, assumir que sim, mas monitorar. O botão "Enable workflow" reativa.
- Não pesquisei o uso de minutos de Actions em repositório público (gratuito e ilimitado em runners padrão, segundo o conhecimento geral, não verificado aqui).

## 5. Stack do site estático + CI multi-SO + Codecov + deploy gratuito

### Takeaway
Vite + Vue 3 + TypeScript + **Vitest (v5.x, provider v8, thresholds 80%)** + **Playwright** atende ao TP com baixo atrito. O workflow roda em matriz ubuntu/macos/windows e envia o lcov para o Codecov com `codecov/codecov-action` (a última linha é a **v7.1.1**, de set/2026, e o README ainda exemplifica `@v5`). Para o deploy, a recomendação é **Cloudflare Pages** (500 builds/mês, previews ilimitados) ou Netlify. A Vercel Hobby é restrita a uso não comercial (ok para TP).

### Cited Findings
- Vitest: a versão atual listada é **v5.1.0**. `provider: 'v8'` é o padrão (pacote `@vitest/coverage-v8`). Desde a v3.2 usa remapeamento baseado em AST, com relatórios "idênticos ao Istanbul". Por padrão só os arquivos importados entram no relatório; configurar `coverage.include` (ex.: `src/**/*.{ts,vue}`) para contar arquivos não testados. Os reporters incluem `lcov` e os thresholds ficam na Coverage Config Reference — [vitest.dev/guide/coverage](https://vitest.dev/guide/coverage)
- Playwright CI: o exemplo oficial usa `actions/checkout@v6`, `actions/setup-node@v6` (`node-version: lts/*`), `npx playwright install --with-deps`, `npx playwright test` e `actions/upload-artifact@v5` com `if: ${{ !cancelled() }}`. Recomenda `globalTimeout` no config — [playwright.dev/docs/ci-intro](https://playwright.dev/docs/ci-intro)
- codecov-action: releases v7.1.1 (17/set, Latest), v7.0.0 (07/jun), v6.0.0 (26/mar, suporte a node24, "may cause breaking changes"), v5.5.5 — [releases](https://github.com/codecov/codecov-action/releases)
- Codecov e tokens: **upload sem token não é suportado em geral**. Desde a v4, PRs de forks para repositórios públicos podem enviar sem token. A v5 permite, em repositórios públicos, desligar a exigência do token nas configurações da organização no codecov.io ("Global Upload Token"). Alternativa: `use_oidc: true` com `permissions: id-token: write` (o token é ignorado). `fail_ci_if_error` tem padrão false — [codecov/codecov-action README](https://github.com/codecov/codecov-action)
- Cloudflare Pages Free: 500 builds/mês, 1 build concorrente, 20.000 arquivos, 25 MiB por arquivo, 100 domínios customizados por projeto e **deploys de preview ilimitados**. A Cloudflare indica Workers Static Assets para escala — [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/)
- Vercel Hobby: **só uso não comercial**, cerca de 100 GB de banda/mês (fonte secundária). Netlify Free: uso comercial permitido, com modelo de **300 créditos/mês**; o site é pausado ao esgotar, e as fontes divergem sobre a banda equivalente (cerca de 15 GB vs 100 GB) — [fencode.dev](https://www.fencode.dev/en/blog/vercel-free-vs-pro-2026-official-limits-pricing); [cmaven comparação](https://cmaven.github.io/en/hosting/netlify-vercel-static-hosting-comparison/); [dev.to Netlify alternatives](https://dev.to/devtoolpicks/best-netlify-alternatives-for-indie-hackers-in-2026-ceo)

### Inferences
- Workflow mínimo sugerido (`.github/workflows/ci.yml`; montado a partir das docs acima, não executado):

```yaml
name: CI
on:
  push:
    paths-ignore: ['data/**']   # não roda testes a cada atualização do scraper
  pull_request:
permissions:
  contents: read
  id-token: write              # só se usar use_oidc
jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: lts/*
          cache: npm
      - run: npm ci
      - run: npx vitest run --coverage        # thresholds 80% falham o job se não atingidos
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test              # webServer: vite preview no playwright.config.ts
      - uses: codecov/codecov-action@v5        # ou @v7 (última); fixar major
        with:
          token: ${{ secrets.CODECOV_TOKEN }}  # ou use_oidc: true
          files: ./coverage/lcov.info
          flags: ${{ matrix.os }}
          fail_ci_if_error: true
      - uses: actions/upload-artifact@v5
        if: ${{ !cancelled() }}
        with:
          name: playwright-report-${{ matrix.os }}
          path: playwright-report/
```

- `vitest.config.ts`: `coverage: { provider: 'v8', reporter: ['text','lcov','html'], include: ['src/**/*.{ts,vue}'], exclude: ['src/main.ts','**/*.d.ts'], thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 } }`. O nome da chave `thresholds` vem do conhecimento das versões ≥1. Conferir na Coverage Config Reference da v5.
- Rodar os e2e só em chromium nas 3 OS mantém o CI rápido. O TP exige testes nos 3 SOs, não os 3 browsers.
- Deploy: conectar o repositório ao Cloudflare Pages (build `npm run build`, output `dist`). Os previews por PR saem de graça, e isso evita guardar segredos de deploy no Actions.

### Gaps
- Não li a página oficial de preços de Vercel e Netlify (os números vêm de fontes secundárias e divergem). Não confirmei se o Codecov ainda exige token para pushes no branch padrão de repositórios públicos sem a opção de org desligada. A leitura do README sugere que sim.

## 6. Boas práticas de teste para scrapers + CI no Windows (CRLF, latin1)

### Takeaway
Separar **fetch (I/O)** de **parse (função pura)**. Os testes unitários rodam o parser sobre **fixtures HTML/JSON/CSV salvos no repositório**, sem rede. Um "contract test" agendado (fora da suíte obrigatória) valida o site real e avisa quando o layout muda. Isso gera facilmente mais de 50 testes unitários pequenos e determinísticos.

### Cited Findings
- O git scraping depende de endpoints não documentados que podem mudar e quebrar o job (inferência do autor/resumo) — [Simon Willison](https://simonwillison.net/2020/Oct/9/git-scraping/)
- No Vitest, só arquivos importados entram na cobertura sem `include`. Ou seja, um scraper não importado por nenhum teste "some" do relatório — [vitest.dev](https://vitest.dev/guide/coverage)

### Inferences
- Estrutura sugerida: `scraper/sources/<hemocentro>.ts` exporta `parse(html: string): Estoque[]` (pura) e `fetch()` (I/O), mais `normalizeNivel(texto) → 'critico'|'alerta'|'adequado'|'estavel'`, `normalizeTipo('O neg', 'O-', 'O−') → 'O-'`, `diasParaNivel()`, `proximaDataApta()` e `agregarPorUF()`. Testes com `test.each` por variação de grafia cobrem muitos casos com pouco código.
- Fixtures: `tests/fixtures/<fonte>/<data>.html`, gravadas uma vez do site real. Validar a saída com um schema (ex.: Zod) que é o "contrato" entre scraper e front, testado nos dois lados.
- Windows: adicionar `.gitattributes` com `* text=auto eol=lf` e `*.html -text` / `*.csv -text` nos fixtures, para os snapshots não quebrarem por CRLF. No código, ler fixtures com `fs.readFileSync(p)` e decodificar explicitamente: `new TextDecoder('latin1').decode(buf)` para CSV ISO-8859-1 (em WHATWG, "latin1" é alias de windows-1252). Normalizar com `.replace(/\r\n/g, '\n')` e `.normalize('NFC')` antes de comparar. Usar `path.join`/`fileURLToPath`, nunca caminhos com `/` hardcoded concatenados.
- Mockar a rede nos testes de `fetch()` com `vi.spyOn(globalThis, 'fetch')` ou MSW. Nos e2e, o Playwright consome um `public/data/estoques.json` fixo de teste (ou `page.route`) para ter resultado determinístico.

### Gaps
- Não busquei fontes primárias específicas (docs do Git sobre `.gitattributes`, WHATWG Encoding) nesta rodada. As recomendações acima são práticas padrão sem citação verificada aqui.

## 7. Ética e aspectos legais da raspagem de sites públicos no Brasil (LAI, robots.txt, LGPD)

### Takeaway
Estoque agregado de sangue por tipo e hemocentro **não é dado pessoal**, então a LGPD tem impacto mínimo se o projeto nunca coletar dados de doadores. A LAI (Lei 12.527/2011) consagra a publicidade como regra. Boas práticas: respeitar o robots.txt, baixa frequência, User-Agent identificável com contato, atribuição da fonte e data de coleta em cada dado, e aviso de que "não substitui o canal oficial".

### Cited Findings
- A LAI e a Constituição estabelecem a publicidade como regra, e a LGPD "não veda o acesso público" — [Conjur](https://www.conjur.com.br/?p=370211)
- Estudo Insper/Fiquem Sabendo sobre 1.744 pedidos via LAI que citavam a LGPD aponta o uso indevido da LGPD para negar acesso — [Insper](https://www.insper.edu.br/pt/noticias/2022/5/estudo-avalia-os-impactos-da-lgpd-na-transparencia-publica)
- A ANPD alerta que raspar **dados pessoais** viola a LGPD: o fato de estar público não autoriza qualquer uso. O reuso precisa de base legal (arts. 7º/11) e de finalidade, boa-fé e interesse público — [TabNews/newsletter](https://www.tabnews.com.br/NewsletterOficial/anpd-alerta-que-web-scraping-de-dados-pessoais-viola-lgpd); [Jus.com.br](https://jus.com.br/artigos/87950/web-sscraping-na-lei-geral-protecao-de-dados-pessoais)
- Scraping de dados públicos já foi usado academicamente para transformar dados governamentais em dados abertos — [Revista Informação/UEL](https://ojs.uel.br/revistas/uel/index.php/informacao/article/download/44123/pdf_1/230518)
- Escritório Demarest: scraping exige cautela, sobretudo com informações pessoais — [Demarest PDF](https://www.demarest.com.br/wp-content/uploads/2022/01/Web-scraping-legal-ou-ilegal-1.pdf)

### Inferences
- Checklist do projeto:
  - não armazenar nome, telefone ou e-mail de doador. A calculadora de data apta roda só no navegador, sem envio;
  - checar o robots.txt de cada fonte antes de incluí-la;
  - fazer no máximo algumas requisições por dia por fonte;
  - usar um User-Agent do tipo `MapaDoSangueBot/1.0 (+URL do repositório)`;
  - exibir "Fonte: <hemocentro>, coletado em <data>" e link para o site oficial;
  - incluir um disclaimer: "informação indicativa; confirme com o hemocentro".
- Considerar pedir os dados via LAI ou e-SIC às secretarias estaduais como fonte alternativa ou complementar, e mencionar isso no README e no vídeo.

### Gaps
- Não encontrei decisão judicial brasileira específica sobre scraping de dados não pessoais de órgãos públicos. Não verifiquei os termos de uso nem o robots.txt dos hemocentros específicos.
