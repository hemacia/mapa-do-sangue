# Estoques de sangue nos hemocentros do Norte e Nordeste: onde e como são publicados (verificação de 05/11/2026)

Método: `curl -sL -A 'Mozilla/5.0'` nas home pages e em subpáginas, grep por estoque/crítico/alerta/estável e pelos tipos sanguíneos, inspeção dos JS, consulta à WP REST API (`/wp-json/wp/v2/search?search=estoque`, `/wp-json/wp/v2/types`) e ao CKAN (`/api/3/action/package_search?q=sangue`). Os arquivos baixados estão em (pasta local, não versionada). "Verificado" quer dizer que a página foi aberta ao vivo em 05/11/2026. "Não verificado" quer dizer que a informação vem de busca, de imprensa ou de memória.

## Quais dos 16 estados expõem estoque de forma legível por máquina ou raspável estaticamente hoje?

### Takeaway
Só dois dos 16 estados publicam estoque por tipo sanguíneo no site oficial, ambos raspáveis sem JS. O **PI (Hemopi)** tem HTML estático e, além disso, um endpoint JSON público na WP REST API, a melhor fonte da região. A **BA (Hemoba)** tem um bloco "Posição de Estoque" em HTML estático (Drupal). Os outros 14 não publicam estoque no site. O estoque deles só aparece em notícias e na imprensa (e provavelmente no Instagram, o que não verifiquei).

### Tabela por estado

| UF | Instituição | URL oficial (verificada) | Onde o estoque aparece | Formato | Níveis usados | Atualização vista | Dificuldade | Detalhe técnico |
|---|---|---|---|---|---|---|---|---|
| PI | Hemopi | https://www.hemopi.pi.gov.br/ | Home (bloco "Posição de Estoque") e **https://www.hemopi.pi.gov.br/wp-json/wp/v2/posicao-estoque** | HTML estático + **JSON (WP REST, custom post type JetEngine)** | Adequado / Estável / Regular / Crítico. Inclui hemácias A+…O- e também **plaquetas por tipo** | "ÚLTIMA ATUALIZAÇÃO: 27/10/26, 14h21" (campo `modified` 2026-10-27T14:21:14) | **Fácil** | JSON: `[0].registro_estoque["item-N"]._componente_sanguineo` e `._nivel_estoque`. HTML: `ul.posicao-estoque-list > li.posicao-estoque-item > span.componente-label` + `span.nivel-label`. Data em `span.ultima-atualizacao`. Ícones `/wp-content/themes/hello-elementor-child/svg/estoque/{adequado,estavel,critico}.svg`. robots.txt só bloqueia /wp-admin/. Apache, sem Cloudflare |
| BA | Hemoba | https://www.ba.gov.br/hemoba/ (www.hemoba.ba.gov.br redireciona para cá) | Home, bloco `#block-bagov-base-views-block-view-card-card-estatistico-sup-critico` (h2 "Posição de Estoque") | HTML estático (Drupal Views, cards slick) | Crítico / (outros rótulos não observados: no dia todos os 8 cards estavam "Crítico") | Não há data de atualização visível | **Fácil** | Seletor: `.bagov-card-item__title` (tipo) + `.bagov-card-item__description` (nível). O tipo também aparece em `a[title]`. Ícone `fa-droplet-slash`. robots.txt de ba.gov.br só bloqueia `/assets/json/serverinfo.json`. Não encontrei JSON |
| PE | Hemope | https://www.hemope.pe.gov.br/ | Existe a rota https://www.hemope.pe.gov.br/estoque (HTTP 200), mas está **vazia**: só menu e erros PHP ("Undefined variable $arq") | Nenhum (widget legado desativado) | Na home há JS legado de "animação bolsas de sangue" com classes `.critica/.alerta/.estavel`, mas nenhum elemento usa essas classes | — | Impossível hoje (no site) | PHP próprio ("Pratica Design"). Monitorar /estoque, porque o widget pode voltar |
| CE | Hemoce | https://www.hemoce.ce.gov.br/ | Nenhum widget. Estoque só em notícias (WP search "estoque" retorna só notícias de campanha) | Notícias / imprensa | Texto livre | — | Difícil (NLP em notícias) | WordPress (tema ceara2017). `/wp-json/wp/v2/search` funciona |
| RN | Hemonorte | https://www.hemonorte.rn.gov.br/ | Nenhum widget. Notícias como "Hemonorte está com estoque de sangue em estado crítico" (/materia/...) | Notícias | Texto livre | — | Difícil | WordPress. WP REST search funciona |
| PB | Hemocentro da Paraíba | https://paraiba.pb.gov.br/diretas/saude/hemocentro | Nenhum widget (página Plone sem menção a estoque). Imprensa estadual (A União) noticia estoque crítico, com % de Rh negativo no Hemocentro Regional de Campina Grande | Notícias | Texto livre / % | — | Difícil | dados.pb.gov.br é CKAN: 0 resultados para "sangue" |
| AL | Hemoal | https://www.saude.al.gov.br/hemoal/ (hemoal.al.gov.br não responde) | Nenhum widget. Estoque só na imprensa, com **% do estoque mínimo e nº de bolsas** | Notícias / imprensa | % do mínimo necessário, bolsas por tipo | — | Difícil | WordPress da Sesau-AL. A resposta da WP REST vem com BOM UTF-8 (use `utf-8-sig`) |
| SE | Hemose | https://fsph.se.gov.br/hemose (www.hemose.se.gov.br cai no mesmo SPA) | Nenhum. SPA React da FSPH: o bundle `main.3e298331.js` não contém "estoque". A página do Hemose só traz agenda, agendamento (agendamento.hemose.se.gov.br) e contatos | Nenhum | — | — | Impossível (site) | SPA React com conteúdo hardcoded no bundle |
| MA | Hemomar | www.hemomar.ma.gov.br **não resolve**. www.saude.ma.gov.br/hemomar retorna 404 | Só imprensa (O Imparcial, mar/2026: "negativos e plaquetas em nível crítico") | Notícias | Texto livre | — | Difícil | — |
| AM | Hemoam | https://www.hemoam.am.gov.br/ | Nenhum widget (home, `?secao=doacao_de_sangue` e `?secao=hospital_sangue` sem níveis). Estoque em notícias da SES-AM | Notícias | Texto livre | — | Difícil | PHP próprio atrás de Cloudflare (`/cdn-cgi/`) |
| PA | Hemopa | https://www.hemopa.pa.gov.br/site/ | Nenhum widget. Só notícias ("reforça estoques"…) | Notícias | Texto livre | — | Difícil | WordPress. WP REST search funciona |
| AP | Hemoap | https://hemoap.portal.ap.gov.br/ (www.hemoap.ap.gov.br redireciona para cá) | Nenhum widget. A página mais recente na home é de 18/11/2025. Estoque comunicado pela Agência Amapá | Notícias | Texto livre, por tipo (ex.: "O- em nível crítico") | — | Difícil | Laravel + Livewire (`/livewire/update`, componentes de paginação de notícias). Nenhum componente de estoque |
| RO | Fhemeron | https://rondonia.ro.gov.br/fhemeron/ (www.fhemeron.ro.gov.br não responde) | Nenhum widget. Notícias ("estoques de sangue precisam de reforço em Rondônia", tipos A-, B-, O-) | Notícias | Texto livre | — | Difícil | WordPress do governo de RO. dados.ro.gov.br é CKAN: 0 resultados |
| RR | Hemoraima | https://saude.rr.gov.br/hemoraima/ | Nenhum widget. Notícias da Sesau-RR | Notícias | Texto livre | — | Difícil | WordPress/Elementor |
| TO | Hemocentro TO / Hemorrede | https://www.to.gov.br/saude/ (/saude/hemocentro dá 404) | Nenhum. Imprensa (Conexão TO: "Hemorrede declara situação crítica", out/2025) | Notícias | Texto livre | — | Difícil | Portal to.gov.br |
| AC | Hemoacre | hemoacre.ac.gov.br e www. **não respondem**. Conteúdo em https://saude.ac.gov.br/ (notícias) | Nenhum widget. Imprensa (ac24horas, mai/2025: "estoque crítico O+") | Notícias | Texto livre | — | Difícil | WordPress da Sesacre |

### Cited Findings
- Hemopi: bloco "Posição de Estoque" na home, com "ÚLTIMA ATUALIZAÇÃO: 27/10/26, 14h21". Valores no dia: A+ Adequado, A- Adequado, B+ Estável, B- Estável, AB+ Regular, AB- Crítico, O+ Crítico, O- Crítico. A marcação é `li.posicao-estoque-item` / `span.componente-label` / `span.nivel-label` — [Hemopi](https://www.hemopi.pi.gov.br/) (verificado)
- Hemopi expõe o custom post type `posicao-estoque` na WP REST API. O post id 815 traz o campo `registro_estoque` com pares `_componente_sanguineo`/`_nivel_estoque`, incluindo "Plaquetas A+", "Plaquetas A-" etc. — [WP REST Hemopi](https://www.hemopi.pi.gov.br/wp-json/wp/v2/posicao-estoque) (verificado). A lista de tipos está em [/wp-json/wp/v2/types](https://www.hemopi.pi.gov.br/wp-json/wp/v2/types)
- Há também os templates Elementor "View Posição de Estoque" e "Listar Posição de Estoque" — [Hemopi](https://www.hemopi.pi.gov.br/?elementor_library=listar-posicao-de-estoque) (encontrado via WP search)
- Hemoba: bloco Drupal `view-card / card_estatistico_sup_critico` com h2 "Posição de Estoque". Em 05/11/2026 os 8 cards de nível estavam "Crítico" (A+, A-, B+, AB+, AB- confirmados pelo atributo title) — [Hemoba](https://www.ba.gov.br/hemoba/) (verificado)
- Hemope: /estoque responde 200 sem conteúdo de estoque e com erros PHP. A home tem JS `$('.critica').animate…` ("animação bolsas de sangue"), mas sem os elementos correspondentes — [Hemope /estoque](https://www.hemope.pe.gov.br/estoque) (verificado)
- Hemoal comunica estoque só pela imprensa, com números: em jul/2026 eram 97 bolsas contra demanda diária de 350 (27,71% do mínimo), e em mai/2026 apenas ~10% do necessário — [TNH1](https://www.tnh1.com.br/noticia/nid/hemoal-dispoe-de-apenas-2771-do-estoque-minimo-necessario-e-apela-por-doacoes-de-sangue/); [Tribuna do Sertão](https://www.tribunadosertao.com.br/alagoas/2026/05/27/909243-hemoal-opera-com-apenas-10-do-estoque-de-sangue-necessario-em-alagoas)
- Hemomar: em mar/2026, tipos negativos e plaquetas em nível crítico (só imprensa) — [O Imparcial](https://oimparcial.com.br/brasil/2026/03/hemomar-alerta-para-queda-nos-estoques-e-convoca-populacao-para-doacao-de-sangue/)
- Hemoap: alertas por tipo (O- crítico) via agência estadual — [Agência Amapá](https://agenciaamapa.com.br/noticia/34193/estoque-de-sangue-o-esta-em-nivel-critico-e-hemoap-reforca-chamado-por-doadores)
- Hemoam: alertas via SES-AM — [SES-AM](https://www.saude.am.gov.br/estoque-de-sangue-no-hemoam-volta-a-ficar-critico-e-hemocentro-convoca-doadores/)
- Hemoacre: alerta de O+ crítico em mai/2025 — [ac24horas](https://ac24horas.com/2025/05/14/com-estoque-critico-de-sangue-tipo-o-hemoacre-faz-apelo-por-doacoes/)
- Paraíba: Hemocentro Regional de Campina Grande com Rh negativo ~5% e O- praticamente zerado (out/2026) — [A União](https://auniao.pb.gov.br/noticias/caderno_paraiba/hemocentro-esta-com-estoque-critico)
- Tocantins: Hemorrede declarou situação crítica em out/2025 — [Conexão TO](https://conexaoto.com.br/2025/10/17/hemorrede-declara-situacao-critica-e-pede-que-doadores-comparecam-as-unidades)
- Hemonorte: notícias "estoque em estado crítico" no próprio site — [Hemonorte](https://www.hemonorte.rn.gov.br/materia/hemonorte-esta-com-estoque-de-sangue-em-estado-critico/)
- Rondônia: notícia "estoques de sangue precisam de reforço em Rondônia" na página da Fhemeron — [Fhemeron](https://rondonia.ro.gov.br/fhemeron/) (verificado)
- Núcleo de Hemoterapia de Parintins (AM, rede Hemoam) pediu doadores com estoque crítico — [marioadolfo.com](https://marioadolfo.com/nucleo-de-hemoterapia-pede-mobilizacao-de-doadores-em-parintins) (não verificado: só snippet de busca)

### Inferences
- Para um "Mapa do Sangue", os coletores viáveis já são PI (JSON) e BA (HTML). Os outros 14 precisariam de monitoramento de notícias, extraindo nível e tipos do texto, ou de Instagram. Isso é frágil e intermitente: as notícias só saem quando o estoque está crítico, o que enviesa os dados.
- As escalas não batem entre estados. A Hemopi usa 4 níveis (Adequado/Estável/Regular/Crítico). A Hemoba usa pelo menos "Crítico", e é provável que tenha outros níveis, não observados no dia porque tudo estava crítico. Será preciso mapear para uma escala comum.
- O Hemope já teve um widget de bolsas (o JS com as classes critica/alerta/estavel e a rota /estoque continuam lá) e pode reativá-lo. Vale um check periódico.

### Gaps
- Não verifiquei o Instagram de nenhum hemocentro: login wall, e a busca não retornou posts. Não sei, portanto, quais publicam estoque diário em stories ou posts. A hipótese de que a maioria comunica por lá não está verificada.
- A escala completa da Hemoba (rótulos além de "Crítico") e a frequência de atualização dela não puderam ser confirmadas: não há data na página.
- Os sites do Hemoacre, Hemomar, Hemoal (domínio próprio) e Fhemeron (domínio próprio) não responderam. Não sei se estão fora do ar temporariamente ou se foram desativados.
- Número e cidades dos hemonúcleos/unidades de coleta: não levantei, por limite de tempo. Nenhum dos sites com estoque (PI, BA) separa o estoque por hemonúcleo. O widget da Hemopi parece valer para a rede estadual inteira ou só para a sede, não ficou claro.
- Bancos de sangue municipais e universitários (ex.: HUs/Ebserh) da região: não encontrei nenhum publicando estoque. A busca não foi exaustiva.

## Há endpoints JSON/XHR ocultos por trás dos widgets?

### Takeaway
Sim, um só: o da Hemopi (`/wp-json/wp/v2/posicao-estoque`), público e sem autenticação. A Hemoba renderiza no servidor (Drupal) e não tem XHR. O Hemoap usa Livewire, mas não tem componente de estoque. O Hemose é um SPA React com conteúdo hardcoded e sem dados de estoque.

### Cited Findings
- O JSON da Hemopi devolve uma lista com 1 post (a posição vigente), com `modified` e `registro_estoque` — [endpoint](https://www.hemopi.pi.gov.br/wp-json/wp/v2/posicao-estoque) (verificado)
- O Hemoap carrega `/livewire/livewire.min.js` e os componentes `wire:click="gotoPage(...)"` (paginação de notícias). Não há componente de estoque — [Hemoap](https://hemoap.portal.ap.gov.br/) (verificado)
- O bundle `https://fsph.se.gov.br/static/js/main.3e298331.js` define a página do Hemose (sigla, telefone, agendamento) sem nenhuma ocorrência de "estoque" — [FSPH/Hemose](https://fsph.se.gov.br/hemose) (verificado)
- Os sites WordPress (Hemoce, Hemonorte, Hemopa, Sesau-RR, Hemopi) expõem `/wp-json/wp/v2/search`, útil para monitorar notícias com "estoque" — ex.: [Hemoce search](https://www.hemoce.ce.gov.br/wp-json/wp/v2/search?search=estoque) (verificado)

### Inferences
- Usar a REST API da Hemopi é mais robusto que raspar o HTML, e o campo `modified` permite detectar atualizações. Também é possível montar um histórico se o post for editado em vez de recriado. Ainda não sei se versões antigas ficam disponíveis: como `per_page=20` retornou 1 item, parece que um único post é sobrescrito.

### Gaps
- Não usei navegador headless para capturar XHR em runtime. Por isso não posso descartar endpoints que só aparecem após interação, mas nenhum widget de estoque existe no HTML ou no JS dos 14 sites sem estoque.

## Quais publicam estoque só no Instagram ou em releases?

### Takeaway
Na prática, 14 dos 16: AC, AP, AM, PA, RO, RR, TO, AL, CE, MA, PB, PE, RN e SE comunicam estoque só por releases ou notícias (site próprio, agências estaduais, imprensa) e, possivelmente, pelo Instagram, que não verifiquei. O padrão das notícias é alerta pontual ("estoque crítico", tipos em falta). Hemoal e PB às vezes dão números (bolsas, %).

### Cited Findings
- Veja a tabela e as fontes acima: Agência Amapá, SES-AM, ac24horas, TNH1, O Imparcial, A União, Conexão TO e as notícias nos sites do Hemonorte, Hemopa, Hemoce, Sesau-RR e Fhemeron.

### Gaps
- Não confirmei a cadência nem o formato do Instagram (infográfico diário? stories?) de nenhum estado.

## Algum estado publica no portal de dados abertos (CKAN etc.)?

### Takeaway
Não. Os portais CKAN que responderam (dados.pb, dados.pe, dados.rn, dados.ro, dados.ac) retornaram 0 datasets para "sangue". Os demais domínios `dados.<uf>.gov.br` não responderam como CKAN.

### Cited Findings
- `package_search?q=sangue` retornou count=0 em dados.pb.gov.br, dados.pe.gov.br, dados.rn.gov.br, dados.ro.gov.br e dados.ac.gov.br. Não houve resposta CKAN válida de dados.ce, dados.ba, dados.al, dados.pa, dados.ma, dados.to, dados.am, dados.se, dados.pi, dados.rr, dados.ap nem dados.gov.br (sem CKAN nesse path ou fora do ar) — consultas feitas em 05/11/2026 (ex.: [dados.pb.gov.br](https://dados.pb.gov.br/api/3/action/package_search?q=sangue))

### Gaps
- Não testei portais não-CKAN (ex.: dados.ce.gov.br pode usar outra plataforma). Também não procurei dados de produção hemoterápica (HEMOPROD/ANVISA) em dados.gov.br, que medem produção e não estoque.
