# Projetos open source (GitHub/GitLab) sobre doação e estoque de sangue no Brasil + referências internacionais

Data da pesquisa: 2026-11-05. Método: ~65 buscas `gh search repos` e ~45 `gh search code` (PT/EN, nomes de hemocentros e domínios-fonte como `hemoba.ba.gov.br`, `hemosc.org.br`, seletores CSS como `dirt_home_estq`), leitura do código via raw.githubusercontent.com, teste ao vivo (curl, 2026-11-05) das URLs-fonte e seletores, busca na API do GitLab e 2 buscas web. Estrelas/datas/licenças vêm da API do GitHub (`gh api repos/OWNER/REPO`).

Observação geral: a grande maioria dos ~450 repositórios encontrados com "hemocentro", "doação de sangue", "banco de sangue" são CRUDs acadêmicos (cadastro de doador/estoque local) sem coleta de dados reais. Apenas ~8 repositórios brasileiros raspam estoques reais de hemocentros. Nenhum tem mais de 4 estrelas.

## 1. Quais repositórios raspam estoques de hemocentros brasileiros, com quais URLs/seletores?

### Takeaway
Existem só um punhado de raspadores reais, todos pequenos. Os de seletor estruturado (não heurística de texto) são: SangueJá (HEMOBA via HTML + **HEMOES via API CKAN de dados abertos, funcionando**), sanguine-scrapy (HEMOPE, HEMATO-Recife, IHEBE-Belém, HEMOBA), dois crawlers HEMOSC (`div.dirt_home_estq`), RastreadorSangue (Hemocentro Unicamp) e o antigo crawler da Pró-Sangue. O repositório da Letícia, apesar de cobrir 8 hemocentros, usa majoritariamente **busca de palavras-chave em texto/notícias**, o que não mede o estoque real; só o de Hemominas tenta ler cards.

### Cited Findings

**LeticiaVicenteTeodoro/API_aberta-EstoquesdeSangueBR** — ★0, criado e último push 2026-11-05, **sem licença** (sem arquivo LICENSE, o README não menciona licença), Python/FastAPI + SQLAlchemy + APScheduler — [repo](https://github.com/LeticiaVicenteTeodoro/API_aberta-EstoquesdeSangueBR)
- Rotas: `/estoques`, `/hemocentros`, `/cidades`, `/campanhas`, `/fontes`, `/integracoes`, `/compatibilidade/{tipo}` — [tree](https://github.com/LeticiaVicenteTeodoro/API_aberta-EstoquesdeSangueBR/tree/HEAD/api_doacao_sangue)
- `services/scraper.py` diz literalmente: "Nesta versão inicial, os dados são demonstrativos." — [scraper.py](https://raw.githubusercontent.com/LeticiaVicenteTeodoro/API_aberta-EstoquesdeSangueBR/HEAD/api_doacao_sangue/services/scraper.py)
- O scheduler só agenda Hemominas (09h), HEMOSC (10h) e HEMEPAR (11h); os outros 5 serviços não estão agendados — [scheduler.py](https://raw.githubusercontent.com/LeticiaVicenteTeodoro/API_aberta-EstoquesdeSangueBR/HEAD/api_doacao_sangue/scheduler.py)
- Abordagem por fonte, com o código lido em [services/](https://github.com/LeticiaVicenteTeodoro/API_aberta-EstoquesdeSangueBR/tree/HEAD/api_doacao_sangue/services):
  - **Hemominas**: Selenium com Chrome headless em `https://hemominas.mg.gov.br`, `sleep(5)`, percorre **todos** os `div` e em cada um lê `b` (tipo) e `p` (status), aceitando só quando o `<b>` é um dos 8 tipos. É genérico (não usa uma classe específica) e por isso frágil/lento, mas é o único que lê o estado real.
  - **HEMOSC**: `requests` na **notícia fixa** `https://www.saude.sc.gov.br/index.php/pt/component/content/article/com-aumento-na-demanda-hemosc-chama-populacao-para-repor-estoques-de-sangue?Itemid=101&catid=84`. Se o texto contém "a e o, positivo e negativo", marca A±/O± como "Alerta" e B/AB como "Adequado". **Resultado sempre igual**, não é o estoque.
  - **HEMEPAR**: `requests` na notícia fixa `https://www.parana.pr.gov.br/aen/Noticia/Com-queda-nos-estoques-Hemepar-convoca-doadores-de-sangue-tipos-O-e-O`. Tudo "Adequado" e O+/O- viram "Alerta" se aparecerem "o+"/"o-" no texto. Também estático.
  - **HEMOES** `https://hemoes.es.gov.br/`, **HEMOCE** `https://www.hemoce.ce.gov.br/`, **HEMOPA** `https://www.hemopa.pa.gov.br/`, **HEMOBA** `https://www.hemoba.ba.gov.br/`, **HEMOSUL** `https://www.hemosul.ms.gov.br/`: `requests` + BeautifulSoup `get_text().lower()`. Começa tudo "Adequado" e marca "Alerta" se aparecem substrings como "o negativo"/"o-"/"a+" (por exemplo "a+" casa com qualquer texto). Também marca tudo "Alerta" se aparecem "todos os tipos" e "baixo/crítico". **Heurística com muitos falsos positivos**, sem seletor.
- Tabela de compatibilidade ABO/Rh (recebe_de/doa_para) para os 8 tipos — [compatibilidade.py](https://raw.githubusercontent.com/LeticiaVicenteTeodoro/API_aberta-EstoquesdeSangueBR/HEAD/api_doacao_sangue/routes/compatibilidade.py)
- `docs/fontes-dados.md` lista só MG (Selenium), SC e PR (notícias) e "Próximas integrações: SP, RJ, BA, CE, PE" — [fontes-dados.md](https://raw.githubusercontent.com/LeticiaVicenteTeodoro/API_aberta-EstoquesdeSangueBR/HEAD/docs/fontes-dados.md)

**marcuxyz/sangueja (SangueJá)** — ★1, criado 2026-07-27, push 2026-09-22, **MIT**, Python (uv, httpx, BeautifulSoup, Jinja2, Postgres), site sangueja.com.br — [repo](https://github.com/marcuxyz/sangueja)
- **HEMOES via dados abertos (CKAN)**: `https://dados.es.gov.br/api/action/datastore_search?resource_id=d73f9335-f454-4d1a-bfba-51ed2dac9cb6&limit=1&sort=_id+desc`. O parser lê `result.records`, remove `_id`/`Data` e cada coluna (`A-`, `A+`, ..., `O+`) traz o status — [hemoes/crawler.py](https://raw.githubusercontent.com/marcuxyz/sangueja/HEAD/app/crawlers/hemoes/crawler.py), [hemoes/parser.py](https://raw.githubusercontent.com/marcuxyz/sangueja/HEAD/app/crawlers/hemoes/parser.py)
  - **Testado ao vivo em 2026-11-05: funciona.** O último registro é `_id 117`, `Data "27/10/2026"`, com `A- Crítico, A+ Estável, B- Crítico, B+ Estável, AB- Crítico, AB+ Alerta, O- Crítico, O+ Crítico`. Os níveis usados são Estável/Alerta/Crítico. A série é diária, mas tinha ~9 dias de atraso na data do teste — [API CKAN](https://dados.es.gov.br/api/action/datastore_search?resource_id=d73f9335-f454-4d1a-bfba-51ed2dac9cb6&limit=2&sort=_id+desc)
- **HEMOBA via HTML**: `http://www.hemoba.ba.gov.br/`, `find(id="block-bagov-base-views-block-view-card-card-estatistico-sup-critico")`, cards `div.class_="p-0 p-lg-1 p-md-1 card-footer w-100 border-0 text-center text-uppercase"`, tipo em `h1`, status em `p`, data em `<time datetime>` — [hemoba/parser.py](https://raw.githubusercontent.com/marcuxyz/sangueja/HEAD/app/crawlers/hemoba/parser.py)
  - **Testado em 2026-11-05: com requests simples, `www.hemoba.ba.gov.br` redireciona para `https://www.ba.gov.br/hemoba/` e devolve uma página de desafio anti-bot (JS ofuscado com `eval`, cookie `cookiesession...`, ~2,2 KB)**. Sem um navegador real, o seletor não é alcançado. Há fixtures HTML em `tests/fixtures/hemoba/` que servem de referência do DOM — [fixtures](https://github.com/marcuxyz/sangueja/tree/HEAD/tests/fixtures/hemoba)
- Endereço de "onde doar" HEMOBA: `https://www.ba.gov.br/hemoba/onde-doar`. HEMOES: `https://hemoes.es.gov.br/enderecos-dos-hemocentros` — [crawlers](https://github.com/marcuxyz/sangueja/tree/HEAD/app/crawlers)
- Cron no GitHub Actions `0 12 * * 1-5` (America/Sao_Paulo), em matriz [hemoba, hemoes]. Grava um snapshot e só alerta se o snapshot for novo — [crawler_cron.yml](https://raw.githubusercontent.com/marcuxyz/sangueja/HEAD/.github/workflows/crawler_cron.yml), [base.py](https://raw.githubusercontent.com/marcuxyz/sangueja/HEAD/app/crawlers/base.py)
- **Bot WhatsApp**: POST JSON `{number, text}` com header `token` para `WHATSAPP_URL` (gateway genérico, ao estilo Evolution API). Só envia os tipos com status "crítico"/"alerta" e usa um template Jinja com emojis — [whatsapp.py](https://raw.githubusercontent.com/marcuxyz/sangueja/HEAD/app/services/whatsapp.py), [alert.jinja2](https://raw.githubusercontent.com/marcuxyz/sangueja/HEAD/app/templates/alert.jinja2)

**davidpalves/sanguine-scrapy** — ★4, criado 2018-12-22, push 2023-05-01, **MIT**, Python/Scrapy + MongoDB + API Flask — [repo](https://github.com/davidpalves/sanguine-scrapy)
- Todos os XPaths ficam centralizados em `constants.py` — [constants.py](https://raw.githubusercontent.com/davidpalves/sanguine-scrapy/HEAD/doe_sangue/spiders/constants.py):
  - **HEMOPE** `http://www.hemope.pe.gov.br/`: itens `//ul[contains(@class,'list-estoque')]/li`, tipo `.//strong/text()`, nível pela regex `sangue\s*(.*)` sobre `.//div[contains(@class,'bolsa')]/div[2]/@class`, endereço `//address/text()`
  - **HEMATO (Grupo GSH, Recife)** `https://www.doesanguedoevida.com.br/banco-de-sangue-hemato`: segue as páginas de unidades em `.//li[a[@title='Unidades']]/ul[contains(@class,'dropdown-menu')]/li/a`, itens `//div[contains(@class,'item-estoque')]`, nível numérico em `.//div[contains(@class,'knob')]/@data-val`
  - **IHEBE (Belém)** `https://www.ihebe.com.br/`: itens `//div[contains(@class,'bolsa-sangue')]`, nível `./@data-sangue` (percentual × 0,01), tipo `./following-sibling::div/text()`
  - **HEMOBA** (layout antigo): `//div[contains(@id,'box-estoque')]/div`, tipo `./h4/strong/text()`
- **Teste ao vivo em 2026-11-05**: `item-estoque` ainda aparece na página HEMATO e `bolsa-sangue` ainda aparece no IHEBE, então esses seletores provavelmente ainda funcionam (não executei o spider). Na página atual do HEMOPE (`https://www.hemope.pe.gov.br/`, 200), `list-estoque` **não aparece**: seletor quebrado ou conteúdo via JS. O HEMOBA está atrás do anti-bot (ver acima).

**PGuardini/banco_de_sangue_hemosc** — ★1, criado 2026-09-07, push 2026-11-05, **sem licença**, Python (requests, BS4, SQLModel/SQLite, chart.py) — [repo](https://github.com/PGuardini/banco_de_sangue_hemosc)
- `https://www.hemosc.org.br/` (com `verify=False`, porque o certificado do site falha na verificação TLS). Seletor `soup.find_all('div', class_='dirt_home_estq')[0].find_all('div')`. Em cada `img`, o tipo vem de `alt.split('tipo ')[-1]` e o status de `title.split(' - ')[0]`. Escala: `Adequado 5, Estável 4, Reduzido 3, Alerta 2, Crítico 1` — [crawler.py](https://raw.githubusercontent.com/PGuardini/banco_de_sangue_hemosc/HEAD/crawler.py)
- **Ativo**: há commits diários "chore: atualiza estoque HEMOSC AAAA-MM-DD" de 2026-11-01 a 2026-11-05, e o `hemosc.db` (SQLite) é versionado no repositório, ou seja, **é uma série histórica diária do HEMOSC** — [commits](https://github.com/PGuardini/banco_de_sangue_hemosc/commits)
- No meu teste, curl com verificação TLS ligada falhou (código 000), o que confirma o problema de certificado do hemosc.org.br.

**bentoluizv/HEMOSC-Crawler** — ★0, push 2026-08-12, sem licença, Python + Playwright (Firefox headless) + GitHub Actions diário (`cron 0 23 * * *`). Usa o mesmo seletor `dirt_home_estq` + `img@alt/@title` e a mesma escala de 5 níveis. Ao final, comenta as frases de status do site ("O estoque está ideal...", "Venha doar sangue, precisamos de você.") — [main.py](https://raw.githubusercontent.com/bentoluizv/HEMOSC-Crawler/HEAD/main.py)

**AlexandreOkita/RastreadorSangueAPI** — ★0, criado 2023-01-14, push 2024-09-27, sem licença, Python em AWS Lambda/SAM — [repo](https://github.com/AlexandreOkita/RastreadorSangueAPI)
- **Hemocentro Unicamp** `https://www.hemocentro.unicamp.br/`: `div` com classes `lista-estoque__item estado-critico|estado-alerta|estado-estavel` e tipo em `h3` — [crawler](https://raw.githubusercontent.com/AlexandreOkita/RastreadorSangueAPI/HEAD/hospitals/hc_unicamp/hc_unicamp_crawler_function/hc_unicamp_blood_status/unicamp_blood_center_crawler.py)
- **Teste em 2026-11-05**: a página da Unicamp responde 200, mas a string `lista-estoque__item` **não aparece** no HTML estático. Seletor provavelmente quebrado (layout mudou ou o conteúdo é renderizado via JS).

**edersoncorbari/blood-donation** — ★2, criado 2019-10-07, push 2023-05-22, **arquivado**, sem licença, Python + Apache NiFi — [repo](https://github.com/edersoncorbari/blood-donation)
- Pró-Sangue `http://www.prosangue.sp.gov.br/home/Default.html`: `class_='estoque'`, ids `cphConteudo_Estoque1_Repeater1_lblO_0..7` na ordem `O+, A+, AB+, B+, O-, A-, AB-, B-`, status pela classe CSS (`critico`/`emergencia`/`estavel`), data em `class_='caixa pt-BR'` — [scraping.py](https://raw.githubusercontent.com/edersoncorbari/blood-donation/HEAD/web-scraping/scraping.py)
- **Quebrado**: em 2026-11-05 a URL redireciona para `https://www.portal.prosangue.sp.gov.br/fps` (novo portal).
- A página atual da Pró-Sangue, `https://prosangue.sp.gov.br/reqestoque/posicao_estoque.php` (citada pelo HemoAtlas), traz no JS inline um objeto `dadosEstoquePadrao` com **quantidades de bolsas** por tipo (por exemplo `"A+": {quantidade: 1325}`, `"O+": 385`, `"O-": 32`) e uma tabela `referenciaEstoque` de limiares por tipo (por exemplo `O_positivo: {critico: 372, alerta: 558, estavel: 559}`, `O_negativo: {68, 102, 103}`). Porém, `ultima_atualizacao` é `new Date()` (a data do navegador, não a da coleta). Os dados podem ainda ser sobrescritos por `?estoque=` na URL ou por localStorage, então é preciso validar se os números são realmente atualizados — [página](https://prosangue.sp.gov.br/reqestoque/posicao_estoque.php)

**Outros encontrados (sem raspagem real ou só conceito):**
- Brennohz/HemoAtlas — ★0, criado 2026-11-05, só README (projeto FMU, "mapa interativo"). Lista as fontes planejadas: CNES/DATASUS, a lista de hemocentros do Ministério da Saúde (PDF), malhas do IBGE, Hemominas, HEMOSC `https://www.hemosc.org.br/index.php`, Pró-Sangue `posicao_estoque.php` e Hemoba onde-doar. Também define a regra "estoque não informado" quando não houver divulgação — [README](https://github.com/Brennohz/HemoAtlas)
- FelipeLDaSilv/Hemocentro (2021, "simulação de api do hemocentro"), afgermano/projeto-hemoconecta (MIT, HTML, estoques fictícios), Leonardo-Bonanno/HemoAlerta e hemoalertaAPI (2026, alertas regionais), jppedro/HemoAlert (2024): sem raspagem de fonte oficial identificada nas buscas — [busca GitHub](https://github.com/search?q=hemoalerta&type=repositories)
- dadomingues/escarlate (2014, "Governança coletiva para estoque de sangue"), vazio/conceitual — [repo](https://github.com/dadomingues/escarlate)
- ArgoCrew/hematopy — ★4, push 2022, licença própria "Copyright (c) 2018, GustavoRPS, All rights reserved" (estilo BSD, NOASSERTION na API). Gera banners de campanha (SVG → PNG/PDF), menciona Hemoes como exemplo e **não raspa estoque** — [repo](https://github.com/ArgoCrew/hematopy)
- GitLab: a busca por "hemocentro", "estoque sangue", "doacao sangue" e "blood stock" retornou só projetos acadêmicos (por exemplo andremedsil/hemotech, agendamentos SP, 2021) e **nenhum raspador brasileiro** — [GitLab API search](https://gitlab.com/api/v4/projects?search=hemocentro)

### Inferences
- A fonte mais robusta encontrada é a **API CKAN do ES (dados.es.gov.br)**: JSON estruturado, histórico desde `_id 1` e nenhum risco de quebra de HTML. Vale procurar datasets equivalentes em outros portais CKAN estaduais.
- O HEMOSC (`div.dirt_home_estq img[alt,title]`) é a fonte HTML mais estável e já tem série histórica pronta no repo do PGuardini. Atenção: o repositório não tem licença, então os dados/código não podem ser copiados formalmente sem permissão. Precisa de `verify=False` ou do bundle de CA intermediária.
- A escala de status varia por hemocentro: HEMOSC tem 5 níveis (Adequado/Estável/Reduzido/Alerta/Crítico), HEMOES e Unicamp têm 3 (Estável/Alerta/Crítico), Pró-Sangue antiga tinha 3 (estavel/emergencia/critico), IHEBE e HEMATO dão percentual numérico. Um Mapa do Sangue precisa de uma normalização.
- Os scrapers da Letícia (exceto Hemominas) **não devem ser reaproveitados como fonte de verdade**, porque produzem status fixo ou falsos positivos.
- HEMOBA (ba.gov.br) agora exige navegador real (Playwright) por causa do desafio anti-bot.

### Gaps
- Não executei os spiders de ponta a ponta. A conclusão "funciona/quebrado" baseia-se em presença/ausência do seletor no HTML estático baixado em 2026-11-05.
- Não verifiquei se o seletor genérico `div > b + p` da Hemominas ainda casa (precisa de JS/Selenium).
- Não encontrei raspadores públicos para HEMORIO, HEMOAM, HEMOGO, HEMORGS, Hemocentro RP, Fundação Hemocentro de Brasília, HEMONORTE, HEMOPI, HEMOAL, HEMOSE, HEMOTO, HEMOAP, HEMORAIMA, HEMOACRE e HEMERON. A busca de código pelos domínios desses hemocentros retornou só sites estáticos e listas de domínios.
- Parte das buscas `gh search repos` (hemoron, hemoraima, hemoacre, hemoto) bateu em rate limit e teve resultado vazio/incompleto.

## 2. Existem datasets de hemocentros/hemonúcleos com endereço e lat/long?

### Takeaway
Não encontrei nenhum dataset nacional completo e mantido com coordenadas. O melhor com lat/long é antigo (2013, 21 unidades, MIT). Há listas maiores sem coordenadas (76 unidades por UF; 54 bancos de sangue em SP) e coordenadas "aproximadas para demonstração". A fonte primária recomendada pelos próprios projetos é o CNES/DATASUS + o PDF do Ministério da Saúde.

### Cited Findings
- **henvic/thin.gs `www/api/centers.json`** — MIT, 2013. Tem **21 hemocentros com `location.lat/lng`**, endereço estruturado (street, neighborhood, postalCode, locality, region), telefone, link e horário. UFs cobertas: AL, AM, CE, DF, ES, GO, MG, MS, PB, PE, PR, PI, RJ, SC, SP, TO. Exemplo: Hemope -8.05259, -34.89783 — [centers.json](https://raw.githubusercontent.com/henvic/thin.gs/HEAD/www/api/centers.json)
- **BeatrizS97/Projeto-Doe-Vida `public/data/hemocentros.json`** — 76 unidades em 27 UFs (city, name, address, phone, district), **sem coordenadas**. Gerado pelo script `scripts/atualizar-hemocentros.js`, que diz "Dados corrigidos com base em fontes oficiais". A API marca a licença como "Other" (NOASSERTION) e não há arquivo LICENSE em HEAD (404) — [hemocentros.json](https://raw.githubusercontent.com/BeatrizS97/Projeto-Doe-Vida/HEAD/public/data/hemocentros.json), [script](https://raw.githubusercontent.com/BeatrizS97/Projeto-Doe-Vida/HEAD/scripts/atualizar-hemocentros.js)
- **Henrique-CR0/Hemare `backend/db/atualizar-coordenadas.js`** — 20 hemocentros-sede com lat/lng que o próprio arquivo chama de "coordenadas aproximadas p/ demonstracao". Sem licença. O projeto também tem coluna CNES e regras (elegibilidade, compatibilidade, distância, triagem, raros) com testes — [coords](https://raw.githubusercontent.com/Henrique-CR0/Hemare/HEAD/backend/db/atualizar-coordenadas.js), [repo](https://github.com/Henrique-CR0/Hemare)
- **YuriLima66/sboot-doe-aqui-monolith-main `inserir_hemocentros_completo.sql`** — MIT, 23 hemocentros (os endereços ficam num script MongoDB à parte) — [SQL](https://raw.githubusercontent.com/YuriLima66/sboot-doe-aqui-monolith-main/HEAD/inserir_hemocentros_completo.sql)
- **gabriel-vitebo/HemoMap-FrontEnd `data/hemocentros.js`** — 54 bancos de sangue do estado de SP (nome, endereço, cidade, telefone, site, horário, estacionamento), sem coordenadas e sem licença — [hemocentros.js](https://raw.githubusercontent.com/gabriel-vitebo/HemoMap-FrontEnd/HEAD/data/hemocentros.js)
- **tms-5/Projeto-ES `Hemocentros.json`** — MIT, poucas entradas (HEMOPE etc.) com CEP, e-mail e horário por dia — [json](https://raw.githubusercontent.com/tms-5/Projeto-ES/HEAD/src/Assets/JSON/Hemocentros.json)
- **sanguine-scrapy** extrai endereço/cidade/UF de cada unidade HEMATO junto com o estoque (XPaths `XPATH_ADDRESS`/`XPATH_CITY`) — [constants.py](https://raw.githubusercontent.com/davidpalves/sanguine-scrapy/HEAD/doe_sangue/spiders/constants.py)
- Fontes primárias citadas pelo HemoAtlas: o Portal CNES/DATASUS e a "lista-de-hemocentros.pdf" do Ministério da Saúde — [HemoAtlas README](https://github.com/Brennohz/HemoAtlas), [PDF MS](https://www.gov.br/saude/pt-br/composicao/saes/doacao-de-sangue/arquivos/lista-de-hemocentros.pdf/view)
- O mapa de HEMOES e HEMOBA tem páginas oficiais de endereços: `https://hemoes.es.gov.br/enderecos-dos-hemocentros` e `https://www.ba.gov.br/hemoba/onde-doar` — [sangueja crawlers](https://github.com/marcuxyz/sangueja/tree/HEAD/app/crawlers)

### Inferences
- Para um Mapa do Sangue com licença MIT, o caminho mais seguro é gerar o próprio dataset a partir do CNES (dado público), geocodificado, e usar o henvic/thin.gs (MIT) só como semente/validação das coordenadas de sedes.
- Os demais JSONs sem licença servem apenas como checklist manual de unidades.

### Gaps
- Não baixei nem analisei o CNES nem o PDF do MS. Não sei quantos hemonúcleos existem nem qual código de tipo de estabelecimento usar.
- O arquivo `01shane89-jpg/AXIOM-APSAP data/medfac/*.json` aparece nas buscas pelos domínios hemoce/hemorio/hemoam (parece uma base de "medical facilities" por tile). Não verifiquei origem nem licença.

## 3. Existem bots (Twitter/X, Telegram, WhatsApp) que publicam alertas de estoque no Brasil?

### Takeaway
O único bot brasileiro com código aberto encontrado é o alerta via **WhatsApp do SangueJá** (MIT, HEMOBA + HEMOES, cron de dias úteis). Não achei bots abertos no Twitter/X ou no Telegram para hemocentros brasileiros. A referência internacional mais madura é o bot Telegram de Singapura.

### Cited Findings
- SangueJá: alerta WhatsApp por gateway HTTP genérico (`WHATSAPP_URL`, header `token`, body `{number, text}`), disparado só quando muda o snapshot e só para os tipos "crítico"/"alerta" — [whatsapp.py](https://raw.githubusercontent.com/marcuxyz/sangueja/HEAD/app/services/whatsapp.py), [base.py](https://raw.githubusercontent.com/marcuxyz/sangueja/HEAD/app/crawlers/base.py)
- As buscas de código por "estoque sangue telegram", "estoque sangue tweepy" e "hemocentro twitter bot" retornaram **zero** resultados — (gh search code, 2026-11-05)
- Uma busca web achou apenas uma petição change.org por um bot de Telegram de doação de sangue no Brasil, sem código aberto indicado — [change.org](https://www.change.org/p/apoie-a-implementação-do-bot-de-doação-de-sangue-no-telegram)
- Referência: frizensami/singapore-bloodstocks-bot — ★3, MIT, Python, push 2023-10-11. Raspa `https://www.redcross.sg/` e roda como bot Telegram — [repo](https://github.com/frizensami/singapore-bloodstocks-bot)
- O alerta "Estoque em atenção" do SangueJá é um template Jinja reutilizável (🔴 crítico / 🟡 alerta + endereço) — [alert.jinja2](https://raw.githubusercontent.com/marcuxyz/sangueja/HEAD/app/templates/alert.jinja2)

### Inferences
- A arquitetura do SangueJá (snapshot em BD, diff, notificação só na mudança, cron no GitHub Actions) é um padrão simples e com licença MIT, que pode ser copiado.

### Gaps
- Contas no X/Instagram de hemocentros que publicam manualmente não foram pesquisadas (fora do escopo de código aberto).
- Bots fechados (sem repositório) não são detectáveis por estas buscas.

## 4. Referências internacionais (dashboards de estoque e apps de doador)

### Takeaway
Os padrões úteis são o "git scraping" (Singapura: dados versionados em repo via Flat Data), a API global de estoques (OpenBloodStocks, abandonada em 2014), a integração Home Assistant para a Lifeblood (Austrália) e vários raspadores do eRaktKosh (Índia), que expõe endpoints `.cnt` com estoque por banco de sangue.

### Cited Findings
- **datascapesg/red-cross-blood-stocks** — ★6, push 2026-09-23, sem licença. Usa um workflow GitHub Flat Data (`flat.yml`) que puxa `https://datascapesg-scrapers.netlify.app/.netlify/functions/redcross-bloodstocks` e versiona o histórico, visualizável em flatgithub.com — [repo](https://github.com/datascapesg/red-cross-blood-stocks)
- **frizensami/bloodstock_analysis** — análise histórica do estoque de Singapura a partir do histórico de commits do repo de dados (sem licença, 2023) — [repo](https://github.com/frizensami/bloodstock_analysis)
- **halfwhole/blood-levels** — puxa os níveis de Singapura (Python, 2020, sem licença) — [repo](https://github.com/halfwhole/blood-levels)
- **maxehmookau/BloodStocks ("OpenBloodStocks")** — ★7, Ruby, 2014, sem licença. Pretendia ser uma "Worldwide Automatically Updated Blood Stocks API" com scrape diário por autoridade, começando pelo Welsh Blood Service — [repo](https://github.com/maxehmookau/BloodStocks)
- **gurrier/lifeblood** — GPL-3.0, Python, push 2026-11-05. É uma integração Home Assistant que lê `https://www.lifeblood.com.au/donors/blood-plasma-platelets/blood-supply-levels` e inclui um blueprint de automação "blood type in demand" — [repo](https://github.com/gurrier/lifeblood)
- **SCOTPAUL/scotblood-levels** (GitLab, 2018) — CLI/site com os níveis atuais do Scottish National Blood Transfusion Service — [GitLab](https://gitlab.com/SCOTPAUL/scotblood-levels)
- **honzasp/vampire** — Unlicense, arquivado em 2021. Raspa centros de transfusão tchecos e exporta para CSV ou Google Sheet. O autor avisa que quebra se as páginas mudarem — [repo](https://github.com/honzasp/vampire)
- **eRaktKosh (Índia)**:
  - hemanttank8888/eraktkosh (Scrapy, 2024, sem licença) usa os endpoints `https://www.eraktkosh.in/BLDAHIMS/bloodbank/nearbyBB.cnt?hmode=GETSTATELIST`, `...?hmode=GETDISTRICTLIST&selectedStateCode=` e `...?hmode=GETNEARBYSTOCKDETAILS&stateCode=` — [spider](https://github.com/hemanttank8888/eraktkosh)
  - parthmadlani/Hemzo (2026, "ML-powered shortage forecasting", site hemzo.vercel.app) usa `https://eraktkosh.mohfw.gov.in/BLDAHIMS/bloodbank/nearbyBB.cnt` — [repo](https://github.com/parthmadlani/Hemzo)
  - tanmayyenpure/BloodSync (MIT, 2026) raspa `https://eraktkosh.mohfw.gov.in/eraktkoshPortal/` com Node/Python — [repo](https://github.com/tanmayyenpure/BloodSync)
- **visdesignlab/Sanguine** — ★10, BSD-3-Clause, TypeScript, push 2026-10-26. Visualiza o uso hospitalar de sangue (patient blood management) e é referência de dashboard/UX, não de estoque público — [repo](https://github.com/visdesignlab/Sanguine)
- **Indonésia (PMI "stok darah")**: só projetos acadêmicos de app/servidor de estoque (por exemplo rahmanpsg/ci3-pmi-server, MIT, 2021; adiprasetyaxyz/satu-darah, 2024). Nenhum raspador de dashboard nacional encontrado — [busca](https://github.com/search?q=stok+darah&type=repositories)
- Não encontrei repositórios abertos para o NHS Blood Stocks (Inglaterra) nem para a American Red Cross. Busca web: "The search did not surface a UK Red Cross scraper or an NHS Blood and Transplant dashboard" — (WebSearch 2026-11-05)

### Inferences
- O padrão "Flat Data / git scraping" (Singapura) é o mais barato para um projeto MIT: GitHub Actions + JSON versionado = histórico grátis. Foi o que o PGuardini fez, de forma ad hoc, com o SQLite do HEMOSC.

### Gaps
- Não verifiquei Malásia (PDN) nem dashboards oficiais (NHSBT, Lifeblood, eRaktKosh) diretamente, só via código de terceiros.
- Apps de doador open source de alto porte (muitas estrelas) não apareceram: as buscas "blood donation app open source" e "blood donor app flutter" voltaram vazias ou com rate limit.

## 5. Compatibilidade de licenças para reuso em projeto MIT

### Takeaway
Pode reusar código livremente (com aviso de copyright) de: SangueJá (MIT), sanguine-scrapy (MIT), henvic/thin.gs (MIT), YuriLima66 (MIT), tms-5 (MIT), BloodSync (MIT), singapore-bloodstocks-bot (MIT), vampire (Unlicense) e Sanguine (BSD-3, compatível). **Não copie código** de GPL-3.0 (gurrier/lifeblood, rslgp/mapafome_sangue*) nem de repos sem licença (Letícia, PGuardini, bentoluizv, RastreadorSangue, edersoncorbari, Hemare, HemoMap, datascapesg, Hemzo, OpenBloodStocks). Deles só dá para reaproveitar **fatos**: URLs, nomes de seletores, endpoints, que não são protegidos por si.

### Cited Findings
- Licenças conforme a API do GitHub: marcuxyz/sangueja MIT; davidpalves/sanguine-scrapy MIT; henvic/thin.gs MIT; YuriLima66/sboot-doe-aqui MIT; tms-5/Projeto-ES MIT; tanmayyenpure/BloodSync MIT; frizensami/singapore-bloodstocks-bot MIT; afgermano/projeto-hemoconecta MIT; honzasp/vampire Unlicense; visdesignlab/Sanguine BSD-3-Clause; anabiene/help-life CC-BY-4.0; gurrier/lifeblood GPL-3.0; rslgp/mapafome_sangue e mapafome_sangue_donor GPL-3.0; ArgoCrew/hematopy e BeatrizS97/Projeto-Doe-Vida NOASSERTION. Sem licença: LeticiaVicenteTeodoro, PGuardini, bentoluizv, AlexandreOkita, edersoncorbari (arquivado), Henrique-CR0/Hemare, gabriel-vitebo/HemoMap, Brennohz/HemoAtlas, datascapesg, halfwhole, maxehmookau, parthmadlani, hemanttank8888 — [GitHub API repos/*](https://docs.github.com/en/rest/repos/repos#get-a-repository)
- rslgp/mapafome_sangue (GPL-3.0, JS, 2024-12/2025-01) é um projeto tipo "mapa" de sangue derivado do "mapafome". Não li o código — [repo](https://github.com/rslgp/mapafome_sangue)

### Inferences
- Itens reaproveitáveis com segurança:
  1. o endpoint CKAN do HEMOES (dado público);
  2. os XPaths do sanguine-scrapy (MIT) para HEMATO/IHEBE;
  3. o padrão crawler/parser + fixtures + WhatsApp do SangueJá (MIT);
  4. o JSON de 21 hemocentros com lat/lng do thin.gs (MIT);
  5. a tabela de compatibilidade ABO/Rh, que é conhecimento médico padrão e pode ser reescrita;
  6. a regra de intervalo entre doações do Hemare (homens 60 dias, mulheres 90 dias), que é um fato normativo. Convém conferir na Portaria de Consolidação nº 5/2017 do MS — [elegibilidade.js](https://raw.githubusercontent.com/Henrique-CR0/Hemare/HEAD/backend/regras/elegibilidade.js)
- Projetos "Mapa"/dashboard: HemoAtlas (só README), HemoMap-FrontEnd (Vue, SP), rslgp/mapafome_sangue (GPL), help-life (CC-BY, script para encontrar hemocentros), PGuardini `chart.py` (gráfico histórico do HEMOSC), Hemzo (Índia), datascapesg via flatgithub (Singapura).

### Gaps
- Não confirmei o texto integral das licenças NOASSERTION (hematopy parece BSD com "All rights reserved"; Projeto-Doe-Vida não tem LICENSE em HEAD).
- Os termos de uso dos portais dos hemocentros (permissão para raspagem) não foram verificados.
