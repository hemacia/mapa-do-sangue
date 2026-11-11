# Estoques de sangue — hemocentros do Centro-Oeste, Sudeste e Sul (onde e como são publicados)

Levantamento feito em 05/11/2026 com `curl -A 'Mozilla/5.0'` direto nos sites oficiais, inspeção de HTML e JS e testes das APIs encontradas. Os arquivos baixados estão em (pasta local, não versionada). O script de teste do Qlik (stdlib, sem dependências) está em (pasta local, não versionada) e `qlik2.py`.

## Quais hemocentros expõem o estoque de forma legível por máquina ou raspável estaticamente hoje (nov/2026)?

### Takeaway
Seis instituições publicam o estoque por tipo sanguíneo de forma raspável sem navegador: HEMOES (API CKAN), Hemosul (motor Qlik anônimo), Pró-Sangue (JSON embutido no PHP), Hemominas, Hemosc e Hemocentro Unicamp (HTML estático), além do Hemocentro de Ribeirão Preto (Google Sheets publicado, com números de bolsas por cidade). A FHB/DF publica apenas uma imagem PNG. Em GO, MT, PR, RS e RJ não encontrei widget de estoque no site: a informação sai em notícias ou não foi localizada.

### Tabela consolidada

| Instituição | URL oficial | Onde aparece o estoque | Formato | Níveis usados | Atualização vista | Dificuldade | Detalhe técnico |
|---|---|---|---|---|---|---|---|
| HEMOES (ES) | https://hemoes.es.gov.br/ | Home (`#estoque-de-sangue`) + https://dados.es.gov.br/dataset/estoque-de-sangue-hemoes | Open data CKAN (API JSON + CSV) | Crítico / Alerta / Estável (texto) | Último registro `Data: 27/10/2026` (_id 117) | Fácil | O widget AngularJS (`/Media/hemoes/scripts/estoque-de-sangue.js`) chama `https://dados.es.gov.br/api/3/action/datastore_search?resource_id=d73f9335-f454-4d1a-bfba-51ed2dac9cb6&limit=1&sort=_id%20desc`. Campos: `A-,A+,B-,B+,AB-,AB+,O-,O+,Data`. Ícones: `/Media/Hemoes/Imagens/Estoque/Icones/{nível}.PNG` |
| Hemosul (MS) | https://www.hemosul.ms.gov.br/ | Botão "ESTOQUE DE SANGUE ATUAL" → https://paineispublicos.saude.ms.gov.br/extensions/EstoqueHemosul/EstoqueHemosul.html | Mashup Qlik Sense (JS) com Engine API anônima por WebSocket | % Real/Estratégico por tipo (bolsa preenchida) + nº de bolsas (hemácias e plaquetas) | `qLastReloadTime 2026-11-05T22:21Z`; campo `ultimadata = 29/10/2026 09:05` | Média (fácil depois de ter o script) | App `2e7b9a90-9431-4bef-90ca-8116ef40f46b`; WS `wss://paineispublicos.saude.ms.gov.br/app/<appId>`, sem login (`userDirectory NONE, mustAuthenticate:false`). Objetos: QV01 `KPJSUJf`(O+), QV02 `Pfgr`(A+), QV03 `vpPEKc`, QV04 `dbPqH`, QV05 `UmhZjz`, QV06 `LAKjX`, QV07 `LcVyD`, QV08 `FgaXunw`, QV09 `UunBPbu`. Tabela `Estoque` (8 linhas): `Tipagem/Fator RH, Estratégico_h, Real_h, Saldo_h, %H, Estratégico_p, Real_p, Saldo_p, %P, Data, Dia da Semana`; tabela `temp_carga.ultimadata` |
| Fundação Pró-Sangue (SP) | https://www.prosangue.sp.gov.br/ (redireciona para https://www.portal.prosangue.sp.gov.br/fps) | iframe na home: https://prosangue.sp.gov.br/reqestoque/posicao_estoque.php (versão mobile: `/fps/posição de estoque mobile`) | HTML gerado por PHP com objeto JS inline (sem XHR) | Nº de bolsas por tipo, classificadas em crítico / emergência ("Alerta") / estável por limiares fixos | Sem data real: `ultima_atualizacao: new Date()` mostra o relógio do visitante | Fácil (regex no `<script>`) | Ver detalhes na seção do Pró-Sangue. Servidor Apache 2.4.34 Win64 / PHP 7.2.9 |
| Hemominas (MG) | https://www.hemominas.mg.gov.br/ | Home, bloco `.container-estoque-de-sangue` | HTML estático renderizado no servidor | Crítico / Alerta / Estável (+ legenda "Adequado") | "Estoque de sangue REDE* - 05/11/2026 12:25" | Fácil | `p.container-estoque-de-sangue-data` traz a data. Cada tipo fica em `.container-estoque-de-sangue-div-*` com `<b>O+</b><img src=".../img/estoque-de-sangue/icone_critico.png" alt="Estoque de sangue do tipo O+ está no nível Critico"><p>Critico</p>`. Só o agregado da REDE; não há dados por unidade regional |
| Hemosc (SC) | https://www.hemosc.org.br/ | Home, bloco `.esqd_home_estq`/`.dirt_home_estq` | HTML estático (ISO-8859-1) | Adequado / Estável / Reduzido / Alerta (4 níveis) | Sem data visível no HTML | Fácil | `div.tudo_home_estq > img[alt="Sangue tipo X"][title="Nível - …"]` + `p > span` com o nível. Imagens `img_bolsa_190123_escuro.jpeg` (Adequado), `_claro.jpeg` (Estável), `img_gota_segu_bols-novo.jpg` (Reduzido), `img_gota_aler_bols-novo.jpg` (Alerta). Só concentrado de hemácias, agregado da Hemorrede. **Corrige a nota anterior: a home do Hemosc TEM widget de estoque** |
| Hemocentro Unicamp (SP) | https://www.hemocentro.unicamp.br/ | Home, seção "Estoque de Sangue" | HTML estático (WordPress) | Estável / Alerta / Crítico | "Última atualização: 05/11/2026" | Fácil | Cards com `img.card__small__icon-img` (`critico.webp`, `Alerta.webp`, `Estavel-Ok.webp` em `/wp-content/uploads/sites/97/2026/06/`) e `span.card__small-text`. Ordem dos tipos: O+, A+, AB+, B+, O-, A-, AB-, B- |
| Hemocentro Ribeirão Preto FMRP-USP (SP) | https://www.hemocentro.fmrp.usp.br/ | https://www.hemocentro.fmrp.usp.br/canal-do-doador/estoque-de-sangue/ (abas por cidade) | Gráficos publicados do Google Sheets (pubchart) com `chartJson` embutido | Nº de bolsas vs. "Estoque mínimo de segurança" por tipo | "Situação do estoque em: 05/11/2026 às 07:30h" (RP); "05/11/2026 às 07:52" (Araçatuba) | Fácil/média | Cada aba é um link `docs.google.com/.../pubchart?oid=…&format=interactive`. O HTML do pubchart traz `'chartJson': '…'` (escape `\xNN`) com `dataTable.rows`. RP: planilha `1-RkpABt6glrJbDM1L10PwzWJafpKYdhN_kufyPGH6_M` oid 366971640. Hemonúcleos: planilha `2PACX-1vQOAjdsqcyzKT16PBOjSGiZsws6AXUTyDTLhKYfmcnDulgWleyIV-1cVveKLCnOM7uuPzGHFc4GMZx_`, oids Araçatuba 1367586318, Fernandópolis 1071427317, Pres. Prudente 2092834388, Taubaté 796405016. Franca não tem link. `pub?output=csv` dá 400 e `gviz` dá 401, então é preciso parsear o pubchart |
| Fundação Hemocentro de Brasília (DF) | https://www.fhb.df.gov.br/ | https://www.fhb.df.gov.br/estoque-de-sangue | Imagem PNG (infográfico) em Liferay | Não dá para ler sem OCR (níveis na imagem) | Página "Atualizado em 04/11/26 às 19h08"; arquivo `Novo+Estoque+de+Sangue_2026_11_04.png` | Difícil (precisa OCR) | `img src="/documents/d/fhb/novo-estoque-de-sangue_2026_1…"`. O nome do arquivo traz a data, o que ajuda a detectar atualização |
| Hemocentro Coordenador de Goiás (Hemogo / Prof. Nion Albernaz) | goias.gov.br/saude (hemogo.org.br e hemocentro.go.gov.br não resolvem DNS) | Não encontrado; só notícias | Notícias / imprensa | Texto livre ("crítico", "déficit de 22%") | Notícia de 23/10/2026 (Jornal Opção) | Impossível como fonte estruturada (não verificado no Instagram) | `https://goias.gov.br/saude/hemocentro/` redireciona para uma notícia de agenda. Agendamento em agenda.hemocentro.org.br |
| MT-Hemocentro (MT) | http://mthemocentro.saude.mt.gov.br/ (citado na imprensa) | Não verificado | — | — | — | Desconhecida | O DNS resolve (201.49.169.196), mas as portas 80 e 443 recusam conexão (ECONNREFUSED, também via WebFetch). A imprensa fala só em "nível crítico", sem painel |
| Hemepar (PR) | https://www.saude.pr.gov.br/ (Rede Hemepar: https://www.saude.pr.gov.br/Pagina/Rede-Hemepar) | Só notícias da SESA/AEN | Press release | Texto ("baixa", "crítico" para O+/O-) | Notícia de 21/09/2026 | Impossível como estruturado | O menu "Posição de Estoque (Lei 14.654/23)" (`/Pagina/RelatorioAF`) é de assistência farmacêutica, não de sangue. Nenhum widget de sangue |
| Hemocentro RS (Hemorgs) | saude.rs.gov.br (hemocentro.rs.gov.br e hemorgs.rs.gov.br não resolvem) | Não encontrado; só notícias em estado.rs.gov.br | Press release | Texto | — | Impossível como estruturado (não verificado) | `saude.rs.gov.br/hemocentro` retorna 404 |
| Hemorio (RJ) | https://www.hemorio.rj.gov.br/ | Nenhum bloco de estoque na home (site ASP legado) | Nenhum | — | — | Impossível | Hoje respondeu HTTP 200 (antes dava 999). Não há "estoque" no HTML; tem só links para Instagram, X e YouTube. Indicadores anuais em `Html/Apresentacoes/Indicadores_Hemorio_2025/Dados.htm` |
| Colsan (SP) | https://colsan.org.br/ | Não encontrado no HTML; `/estoque-de-sangue/` retorna 404 | Imprensa (DGABC, Tribuna de Jundiaí) | Texto ("estoque para 2 dias") | Notícias de 2025 | Impossível como estruturado (não verificado app/Instagram) | — |
| Hemocentro Botucatu (HC-FMB Unesp) | https://www.hcfmb.sp.gov.br/hcfmb | Não encontrado | Imprensa | Texto | Notícias antigas | Não verificado | hemocentrobotucatu.com.br e hemocentro.fmb.unesp.br não resolvem |
| Santa Casa SP (Hemocentro) | https://santacasasp.org.br/ | Não encontrado (a URL antiga redireciona para notícia) | — | — | — | Não verificado | — |

## Existem endpoints JSON/XHR escondidos atrás dos widgets do Pró-Sangue, da Hemominas e do Qlik do Hemosul?

### Takeaway
Pró-Sangue não usa XHR: os números estão hardcoded num objeto JS dentro do PHP do iframe. A Hemominas hoje renderiza no servidor, então não precisa de API. O Hemosul expõe o Qlik Engine anonimamente por WebSocket, o que permite consultar a tabela de estoque inteira com números absolutos de bolsas, e não só o percentual.

### Cited Findings
- **Pró-Sangue:** a home (portal IBM WCM em `portal.prosangue.sp.gov.br/fps`) embute `<iframe src="https://prosangue.sp.gov.br/reqestoque/posicao_estoque.php" title="Posição de Estoque Site">` — [prosangue.sp.gov.br](https://www.prosangue.sp.gov.br/)
- O PHP traz `const dadosEstoquePadrao = { ultima_atualizacao: new Date().toLocaleString('pt-BR'), tipos_sanguineos: { "A-": { quantidade: 24 }, "A+": {1325}, "AB-": {06}, "AB+": {210}, "B-": {15}, "B+": {440}, "O-": {32}, "O+": {385} } }`. Não há `fetch`, `XMLHttpRequest` ou `$.ajax`. Os dados também podem vir de `?estoque=<json>` na URL ou do `localStorage` (painel admin oculto) — [posicao_estoque.php](https://prosangue.sp.gov.br/reqestoque/posicao_estoque.php)
- Limiares fixos em `referenciaEstoque` (bolsas): A- crítico≤32/alerta≤48; A+ 242/363; AB- 3/6; AB+ 18/27; B- 26/30; B+ 84/126; O- 68/102; O+ 372/558. `classificarStatus()` retorna "critico", "emergencia" (exibido como Alerta) ou "estavel" — [posicao_estoque.php](https://prosangue.sp.gov.br/reqestoque/posicao_estoque.php)
- Observação: o "AB-": 06 é um literal JS com zero à esquerda, válido fora do strict mode. Para extrair, trate como JS, não como JSON.
- **Hemominas:** o HTML do servidor já traz data/hora e os 8 níveis (`icone_critico.png`, `icone_alerta.png`, `icone_estavel.png`). Scripts: `build/assets/app2/3/4.js`, chatbot e VLibras. Nenhum XHR é necessário para o estoque — [hemominas.mg.gov.br](https://www.hemominas.mg.gov.br/)
- **Hemosul:** `EstoqueHemosul.js` faz `qlik.openApp('2e7b9a90-9431-4bef-90ca-8116ef40f46b', config)` com host = mesmo domínio, e os objetos `getObject('QV01','KPJSUJf')`… são do tipo `blood-bag` com a medida `SUM({<[Tipagem/Fator RH]={'O+'}>}Real_h) / SUM(... [Estratégico_h])` — [EstoqueHemosul.js](https://paineispublicos.saude.ms.gov.br/extensions/EstoqueHemosul/EstoqueHemosul.js)
- Teste real em 05/11/2026: handshake WS 101, `OnAuthenticationInformation userId=anonymous…, mustAuthenticate:false`. `OpenDoc`, `GetTablesAndKeys` e `CreateSessionObject` (hypercube) funcionaram. Resultado (Real_h / Estratégico_h / Real_p / Estratégico_p): O+ 245/245/26/125; O- 15/42/1/16; A+ 143/143/10/57; A- 22/22/4/7; B+ 50/50/4/15; B- 8/8/0/2; AB+ 15/15/2/3; AB- 3/3/0/1 — [painel Qlik](https://paineispublicos.saude.ms.gov.br/extensions/EstoqueHemosul/EstoqueHemosul.html)
- O endpoint REST `/qrs/about` devolve 302 (exige login); só a Engine via WS é anônima — [painel Qlik](https://paineispublicos.saude.ms.gov.br/)
- **Ribeirão Preto:** não usa XHR próprio. Os dados ficam no `chartJson` do pubchart do Google, com o rótulo da coluna trazendo a hora da medição (ex. "Situação do estoque em: 05/11/2026 às 07:30h"; RP O+ 252 bolsas vs. mínimo 302; O- 28 vs. 61) — [estoque-de-sangue RP](https://www.hemocentro.fmrp.usp.br/canal-do-doador/estoque-de-sangue/)

### Inferences
- Pró-Sangue: como a data mostrada é `new Date()`, não há como saber quando os números foram atualizados. Um coletor diário precisa comparar com o valor anterior e registrar a data da coleta.
- Hemosul: `Real_h` parece limitado ao estratégico (7 de 8 tipos com Real = Estratégico, saldo 0), então o "100%" do painel pode esconder excesso. `Saldo_h` negativo indica déficit (O-: -27). A data da carga (`ultimadata` 29/10) é diferente do reload (05/11). Vale gravar as duas.
- O WS do Qlik pode ser bloqueado ou mudar de appId sem aviso. Convém ter fallback (por exemplo, Playwright no mashup).

### Gaps
- Não testei o Hemosul com Python sem a lib do repositório: usei um cliente WS escrito à mão (stdlib). Em produção, prefira uma lib de WebSocket.
- Não confirmei a cadência de atualização do Pró-Sangue (seria preciso observar por vários dias).

## Há histórico disponível?

### Takeaway
Só o ES tem histórico público estruturado (CKAN). Os demais publicam apenas o estado atual, então o histórico precisa ser construído por coleta periódica.

### Cited Findings
- O DataStore do HEMOES tem 117 registros (`_id` 117 = 27/10/2026, `_id` 116 = 26/10/2026), com níveis textuais por tipo. O dataset foi modificado em 2026-10-29 — [CKAN dados.es.gov.br](https://dados.es.gov.br/api/3/action/datastore_search?resource_id=d73f9335-f454-4d1a-bfba-51ed2dac9cb6&limit=2&sort=_id%20desc)
- O `package_search?q=sangue` retornou 0 datasets em dados.mg.gov.br, dados.rs.gov.br e dados.sc.gov.br, e 1 em dados.es.gov.br. Os portais dados.sp, dados.rj, dados.pr, dados.df, GO, MT, MS e dados.gov.br não responderam JSON CKAN no endpoint padrão (HTML ou erro) — teste direto em 05/11/2026 ([dados.es.gov.br](https://dados.es.gov.br/dataset/estoque-de-sangue-hemoes))
- O modelo Qlik do Hemosul tem os campos `Data` e `Dia da Semana`, mas a tabela `Estoque` tem só 8 linhas (snapshot atual, sem série) — [painel Qlik](https://paineispublicos.saude.ms.gov.br/extensions/EstoqueHemosul/EstoqueHemosul.html)
- As planilhas do Google de Ribeirão Preto talvez tenham histórico em outras abas, mas `pubhtml` não listou abas e `pub?output=csv` retornou 400 — [pubchart RP](https://docs.google.com/spreadsheets/d/1-RkpABt6glrJbDM1L10PwzWJafpKYdhN_kufyPGH6_M/pubchart?oid=366971640&format=interactive)

### Inferences
- A FHB guarda PNGs datados no Liferay (`Novo+Estoque+de+Sangue_2026_11_04.png`). Talvez dê para reconstruir histórico listando versões antigas em `/documents/d/fhb/`, mas isso não foi verificado.
- O histórico do ES tem a lacuna conhecida (datas mistas MM/DD e DD/MM). A API devolve `Data` como texto `dd/mm/aaaa` nos registros recentes.

### Gaps
- Não verifiquei o Wayback Machine como fonte de histórico para Hemominas, Hemosc, Unicamp e Pró-Sangue.

## Quais publicam o estoque só no Instagram ou em notícias?

### Takeaway
Hemepar (PR), Hemocentro GO, MT-Hemocentro, Hemorgs (RS), Hemorio (RJ), Colsan e Botucatu não têm widget de estoque nos sites verificados. A informação aparece em notícias dos governos e da imprensa, com texto livre, quase sempre sobre O+ e O- ou "Rh negativo".

### Cited Findings
- Hemepar: série de notícias da SESA-PR em 2026 (05/01, 07/05, 02/06, 15/07, 25/08, 21/09) pedindo O+ e O- — [SESA-PR 21/09/2026](https://www.saude.pr.gov.br/Noticia/Hemepar-reforca-chamado-para-doacoes-de-sangue-dos-tipos-O-positivo-e-O-negativo); [SESA-PR 15/07/2026](https://www.saude.pr.gov.br/Noticia/Hemepar-alerta-para-queda-no-estoque-de-sangue-durante-ferias-escolares)
- Goiás: estoque crítico noticiado em 23/10/2026 — [Jornal Opção](https://www.jornalopcao.com.br/ultimas-noticias/estoques-de-sangue-chegam-a-nivel-critico-em-goias-apos-queda-nas-doacoes-881749/); alerta oficial — [goias.gov.br](https://goias.gov.br/saude/?p=1019302)
- MT: diretora relata estoque "bastante crítico" para Rh negativo, em 04/2026 — [TJMT](https://www.tjmt.jus.br/noticias/2026/4/estoque-mt-hemocentro-esta-critico-e-voce-pode-ajudar-doando-qualquer-tipo-sanguineo)
- RS: notas do governo estadual pedindo O+ e O- — [estado.rs.gov.br](https://www.estado.rs.gov.br/hemocentro-precisa-de-doacoes-de-sangue-neste-fim-de-ano)
- Colsan: alertas regionais pela imprensa (ABC, Jundiaí) — [DGABC](https://www.dgabc.com.br/Noticia/4268611/com-estoque-para-apenas-dois-dias-colsan-alerta-para-baixo-nivel-de-bancos-de-sangue)
- Hemorio: a home só tem links para redes sociais (instagram.com/hemorio, X, Facebook, YouTube) e não tem bloco de estoque — [hemorio.rj.gov.br](https://www.hemorio.rj.gov.br/)

### Inferences
- Para esses estados, a única via automatizável seria monitorar as notícias (RSS ou HTML dos portais de governo) com extração de texto, ou o Instagram, que é frágil e exige login. Não recomendo para um mapa automatizado sem revisão humana.

### Gaps
- Não verifiquei o Instagram de nenhuma instituição (exige login).
- MT-Hemocentro: o site recusa conexão, então não foi possível confirmar se existe widget.
- Não identifiquei os sites oficiais atuais de Hemogo, Hemorgs e Hemocentro de Botucatu (os domínios testados não resolvem DNS). Não pesquisei bancos municipais ou hospitalares grandes além dos listados (HemoPel/UFPel, HC Porto Alegre e HC-UFPR não verificados).
- O número de seis/sete instituições "raspáveis" vale para o que foi verificado em 05/11/2026. Os seletores podem mudar.
