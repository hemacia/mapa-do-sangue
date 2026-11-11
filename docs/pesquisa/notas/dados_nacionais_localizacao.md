# Dados nacionais abertos (Brasil) para o Mapa do Sangue: estatísticas de doação/transfusão e localização dos pontos de coleta

> Pesquisa feita em 05/11/2026. As APIs foram testadas com curl, e os arquivos baixados estão em (pasta local, não versionada). Os números marcados "(cálculo próprio)" saíram do CSV bruto da Anvisa e não são números oficiais publicados.

## 1. Anvisa Hemoprod: existe CSV baixável? Qual o último ano? Quais campos por UF?

### Takeaway
Existe, sim, um CSV nacional bruto (`hemoprod_nacional.csv`) com uma linha por estabelecimento de sangue, por mês, de 2022 até mar/2026. Ele traz coletas, aptos/inaptos, primeira vez/repetição, tipagem ABO/Rh e transfusões, com UF e município. É a melhor fonte nacional para estatística por UF/município. Os dados são "sujos", porém: há duplicatas e retificadoras, e faltam UFs (Maranhão = 0). Para 2010–2021 só há .xlsx consolidado por UF.

### Cited Findings
- **Página de dados brutos (Anvisa):** "A partir de 2022, os dados passaram a ser coletados por formulário eletrônico… disponíveis em formato .csv". A página está marcada como "atualizado em abril de 2026" e foi modificada em 11/05/2026. Ela avisa que os dados "podem conter informações inconsistentes ou duplicadas". De 2010 a 2021 os dados vêm em .xlsx consolidados por UF, e "a Agência não tem disponível os dados por município ou por instituição hemoterápica". Os dicionários são os anexos I e II da RDC 149/2001. — [Anvisa – Dados brutos de produção hemoterápica](https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/sangue-tecidos-celulas-e-orgaos/producao-e-avaliacao-de-servicos-de-hemoterapia/dados-brutos-de-producao-hemoterapica)
- **URL direta do CSV (testada, HTTP 200, cerca de 19 MB, UTF-8 com BOM, separador `;`, CRLF, 273 colunas, 21.049 registros):** `https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/sangue-tecidos-celulas-e-orgaos/producao-e-avaliacao-de-servicos-de-hemoterapia/dados-brutos-de-producao-hemoterapica-1/hemoprod_nacional.csv/@@download/file` — [Anvisa](https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/sangue-tecidos-celulas-e-orgaos/producao-e-avaliacao-de-servicos-de-hemoterapia/dados-brutos-de-producao-hemoterapica)
  - Exemplo: `curl -L -A "Mozilla/5.0" -o hemoprod.csv "<URL acima>"`. Para ler em pandas: `pd.read_csv(f, sep=';', encoding='utf-8-sig')`.
- **XLSX anuais por UF, 2010–2021:** padrão `.../dados-brutos-de-producao-hemoterapica-1/bd-hemoprod-AAAA-sat.xlsx/@@download/file`. Em 2019 o arquivo se chama `bd-hemoprod-2019-sat-1.xlsx`. — [Anvisa](https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/sangue-tecidos-celulas-e-orgaos/producao-e-avaliacao-de-servicos-de-hemoterapia/dados-brutos-de-producao-hemoterapica)
- **Campos do CSV, verificados no cabeçalho:**
  - Identificação: `Tipo de Informação` (ORIGINAL/RETIFICADORA), `Ano de referência`, `Período de referência` (mês ou "Consolidado"), `Município`, `Razão Social - Nome Fantasia`, `CNPJ`, `Tipo de estabelecimento` (Hemocentro Coordenador/Regional, Núcleo de Hemoterapia, Unidade de Coleta e Transfusão, Unidade de Coleta, Agência Transfusional), `Natureza`, `CNES`, `Endereço`, `Unidade Federativa`.
  - Seção 2, triagem clínica: aptos/inaptos por tipo de doação (espontânea, reposição, autóloga), por tipo de doador (primeira vez, repetição, esporádico), por gênero, por faixa etária e por motivo de inaptidão.
  - Seção 3, coleta: `3.3 Total de coletas [Sangue total]` e `[Por aférese]`.
  - Seção 4, exames: sorologia/NAT testadas e reagentes, e `4.2 Imunohematologia [A+..O-][Doador|Receptor]`.
  - Seção 5: descarte.
  - Seção 6, produção: entradas, perdas, `6.1(c) Tranfusões [componente][Hospitalar…]` e distribuição.
  - Seção 7: reações transfusionais.
  - Seção 8: plasma enviado para hemoderivados.
  - Fonte: arquivo baixado, colunas 11–272.
- **Cobertura temporal no CSV (cálculo próprio):** 2022 = 960 registros, 2023 = 5.432, 2024 = 6.612, 2025 = 6.653, 2026 = 1.392 (até março/2026). O ano de 2022 parece muito incompleto. Os anos completos mais recentes são 2024 e 2025. — [CSV Anvisa](https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/sangue-tecidos-celulas-e-orgaos/producao-e-avaliacao-de-servicos-de-hemoterapia/dados-brutos-de-producao-hemoterapica)
- **Problemas de qualidade (cálculo próprio):**
  - Maranhão tem 0 coletas em 2024 e 2025, embora a imprensa estadual informe 45.728 bolsas só em jan–abr/2026 ([O Imparcial](https://oimparcial.com.br/noticias/2026/05/hemomar-mobiliza-doadores-para-manter-estoques-de-bolsas-de-sangue/)).
  - Piauí aparece com apenas cerca de 7,8 mil coletas em 2024, e o DF com 5,2 mil em 2024.
  - A coluna `CNES` vem quase sempre como "0", então não dá para ligar diretamente ao CNES. A ligação teria de ser feita por nome, município ou CNPJ.
  - Há linhas RETIFICADORA e registros duplicados.
  - SP, RJ e MG usam sistemas próprios e enviam os dados uma vez por ano ([Anvisa – notícia do painel](https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2024/novo-painel-da-anvisa-mostra-producao-hemoterapica-brasileira-1); [página de dados brutos](https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/sangue-tecidos-celulas-e-orgaos/producao-e-avaliacao-de-servicos-de-hemoterapia/dados-brutos-de-producao-hemoterapica)).
- **Painel "Produção Hemoterápica Brasileira" (Power BI):** lançado em julho/2024 com dados a partir de 2023 e "atualização semanal". Tem filtros por período, localidade e tipo de estabelecimento. Não substitui os Boletins, que a Anvisa disse que "em breve voltarão a ser produzidos". — [Anvisa – notícia](https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2024/novo-painel-da-anvisa-mostra-producao-hemoterapica-brasileira-1)
- **Boletins PDF:** o mais recente listado é o 9º Boletim, com data de 2022. Como fonte, está defasado. — [Anvisa – Hemoprod](https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/sangue-tecidos-celulas-e-orgaos/producao-e-avaliacao-de-servicos-de-hemoterapia)
- **Agregados nacionais do CSV, 2024 (cálculo próprio, só linhas não retificadoras, sem deduplicar):**
  - Coletas de sangue total: cerca de 3,52 mi, mais 84 mil por aférese.
  - Candidatos aptos: 3,69 mi. Inaptos: 0,61 mi, cerca de 14%.
  - Aptos de primeira vez: 1,13 mi. Aptos de repetição: 1,63 mi.
  - Transfusões hospitalares de concentrado de hemácias: 852.671. Isto é só uma subcoluna e provavelmente está subestimado.
  - Em 2025 foram cerca de 3,40 mi de coletas de sangue total.
  - Fonte: [CSV Anvisa](https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/sangue-tecidos-celulas-e-orgaos/producao-e-avaliacao-de-servicos-de-hemoterapia/dados-brutos-de-producao-hemoterapica)
- **Coletas (sangue total + aférese) por UF, 2024 (cálculo próprio):**
  - Sudeste: SP 975.956, MG 345.195, RJ 301.385, ES 89.062.
  - Sul: PR 279.145, RS 185.616, SC 122.125.
  - Nordeste: PE 160.992, BA 131.943, PB 111.392, CE 91.605, RN 69.411, SE 46.324, AL 36.714, PI 7.808, MA 0.
  - Norte: PA 114.774, AM 60.851, RO 32.003, TO 24.898, AC 14.335, RR 13.440. O AP não aparece em 2024.
  - Centro-Oeste: GO 105.777, MT 79.718, MS 53.034, DF 5.182.
  - Fonte: [CSV Anvisa](https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/sangue-tecidos-celulas-e-orgaos/producao-e-avaliacao-de-servicos-de-hemoterapia/dados-brutos-de-producao-hemoterapica)

### Inferences
- Para o site, o CSV permite séries mensais por UF e por município (onde fica o estabelecimento). Antes disso é preciso:
  - filtrar `Tipo de Informação`, preferindo RETIFICADORA quando houver a mesma chave (estabelecimento + mês);
  - descartar a linha "Consolidado" quando já existirem os meses;
  - sinalizar as UFs com cobertura evidentemente incompleta (MA, PI, DF, AP e AC em 2025).
- O total do CSV para 2024 (cerca de 3,6 mi, somando a rede privada) é coerente com os 3,31 mi do MS, que considera só o SUS. Ainda assim, o CSV não deve ser publicado como "número oficial" sem ressalva.
- Licença: a página não declara uma licença explícita (não verifiquei). São dados públicos do Governo Federal, publicados como "dados brutos". Na prática, convém citar "Fonte: Anvisa/Hemoprod".

### Gaps
- Não consegui obter a URL direta do painel Power BI nem confirmar que ele ainda atualiza semanalmente em 2026.
- Não há API. A atualização do CSV parece trimestral ou irregular (abr/2026), mas isso não está declarado.
- Não verifiquei o significado exato de todas as subcolunas de transfusão (Hospitalar/Ambulatorial/Total) na RDC 149, anexo II.

## 2. Ministério da Saúde / CGSH: Hemovida, Caderno de Informação, doações por 1.000 habitantes e % da população doadora

### Takeaway
O MS divulga totais nacionais em notícias: 3,31 mi de bolsas em 2024, 1,6% da população doadora, dentro da faixa de 1–3% da OMS. Não encontrei um dataset aberto atual do MS por UF. O "Caderno de Informação Sangue e Hemoderivados" parece descontinuado ou defasado. O monitoramento diário de estoques existe, mas é interno.

### Cited Findings
- **Bolsas coletadas no SUS:** 3.248.737 em 2023, 3.310.025 em 2024 e 831.518 em 2025 até maio. 1,6% da população doou sangue em 2024. — [Agência Gov, jun/2025](https://agenciagov.ebc.com.br/noticias/202506/ministerio-da-saude-lanca-campanha-para-incentivar-doacao-regular-de-sangue) (fonte original: [MS](https://www.gov.br/saude/pt-br/assuntos/noticias/2025/junho/ministerio-da-saude-lanca-campanha-para-incentivar-doacao-regular-de-sangue))
- **2022:** cerca de 1,4% da população (14 por mil hab.) e 3.159.774 doações no SUS, segundo a Fiocruz (busca, PDF não aberto) — [IdeiaSUS/Fiocruz](https://ideiasus.fiocruz.br/wp-content/uploads/2025/04/Contemp058.pdf). Para 2023, outra matéria cita 1,6% — [Agência Gov, jun/2024](https://agenciagov.ebc.com.br/noticias/202406/dia-mundial-do-doador-de-sangue-e-celebrado-nesta-sexta-14).
- **Monitoramento de estoques:** o MS "acompanha diariamente o quantitativo de bolsas de sangue em estoque" nos maiores hemocentros das UFs e aciona o Plano Nacional de Contingência do Sangue para remanejar bolsas. A página não tem painel nem link de dados. — [MS – Atenção hemoterápica](https://www.gov.br/saude/pt-br/composicao/saes/doacao-de-sangue/atencao-hemoterapica)
- **Hemorrede:** cita "27 hemocentros coordenadores e mais de 500 serviços para coleta de sangue" (título de matéria, data não verificada) — [Brasil 61](https://brasil61.com/noticias/saude-brasil-conta-com-27-hemocentros-coordenadores-e-mais-de-500-servicos-para-coleta-de-sangue-pdoa170024)
- **Caderno de Informação Sangue e Hemoderivados:** a única cópia encontrada está hospedada pela SES-MT, edição antiga, e é provavelmente anterior a 2015. — [SES-MT (PDF)](https://www.saude.mt.gov.br/storage/old/files/caderno-de-informacao-sangue-e-hemoderivados-[490-140513-SES-MT].pdf)
- **Taxas por UF publicadas em artigos:** o RS teve 18,19 bolsas por 1.000 hab. em 2022 (artigo acadêmico, apenas na busca, não verificado).

### Inferences
- Para obter "doações por 1.000 hab." por UF, calcular a partir de Hemoprod (coletas) e IBGE (população). O MS não publica isso como dado aberto atualizado.
- O "% da população doadora" (doadores únicos) não sai do Hemoprod, que conta candidatos/coletas e não pessoas distintas. Usar coletas/1.000 hab. como proxy e deixar isso claro no site.

### Gaps
- **Hemovida:** não encontrei documentação pública atual nem dados abertos. Pela literatura, é um sistema de gestão de hemocentros (DATASUS), e não uma fonte de dados aberta (não verificado).
- **Caderno de Informação:** não achei edições de 2020 em diante.
- **App "Doe Sangue" do MS:** não encontrei evidência de um app nacional atual com localização de pontos.
- Não achei o balanço nacional de 2025 do MS.

## 3. DATASUS: SIA/SIH (procedimentos de coleta e transfusão), códigos e granularidade

### Takeaway
No SIGTAP, os procedimentos relevantes estão no subgrupo 03.06 (Hemoterapia) e no 02.12 (exames/processamento). Eles só cobrem a produção faturada ao SUS. A granularidade é por estabelecimento (CNES) e por município, com competência mensal, nos arquivos SIA-PA e SIH-SP do FTP DATASUS (.dbc).

### Cited Findings
Códigos extraídos da tabela unificada SIGTAP de competência 2026-11 (`TabelaUnificada_202611_v2611051737.zip`, `tb_procedimento.txt`, testado) — [FTP DATASUS SIGTAP](ftp://ftp2.datasus.gov.br/pub/sistemas/tup/downloads/):
- **Coleta:**
  - `0306010011` Coleta de sangue p/ transfusão
  - `0306010020` Coleta de sangue p/ transfusão (c/ processadora automática)
  - `0306010038` Triagem clínica de doador(a) de sangue
- **Transfusão:**
  - `0306020068` Concentrado de hemácias
  - `0306020076` Concentrado de plaquetas
  - `0306020084` Crioprecipitado
  - `0306020092` Plaquetas por aférese
  - `0306020106` Plasma fresco
  - `0306020114` Plasma isento de crio
  - `0306020122` Sangue/componentes irradiados
  - `0306020130` Exsanguineotransfusão
  - `0306020149` Sangue total
  - `0306020157` Transfusão fetal intrauterina
  - `0306020050` Granulócitos
- **Outros:**
  - `0306020017` Aférese terapêutica
  - `0306020041` Sangria terapêutica
  - Fatores de coagulação: 0306020025, 0306020033, 0306020165–0306020211
- **Processamento (02.12.02):**
  - `0212020064` Processamento de sangue
  - `0212020030` Irradiação
  - `0212020013` / `0212020021` Deleucocitação
- **Serviço CNES 128, "Serviço de Hemoterapia"** (`tb_servico.txt`). Classificações (`tb_servico_classificacao.txt`):
  - `128001` Procedimentos destinados à obtenção do sangue (coleta)
  - `128002` Diagnóstico em hemoterapia
  - `128003` Procedimentos especiais
  - `128004` Medicina transfusional
  - Fonte: [SIGTAP 202611](ftp://ftp2.datasus.gov.br/pub/sistemas/tup/downloads/)
- **Arquivos SIA (testados):** produção ambulatorial por UF e mês em `ftp://ftp.datasus.gov.br/dissemin/publicos/SIASUS/200801_/Dados/PA{UF}{AA}{MM}[a-d].dbc`. O mais recente listado é PASP2608 (ago/2026), com cerca de 2–3 meses de defasagem. Campos: `PA_CODUNI` (CNES), `PA_UFMUN` (município), `PA_PROC_ID`, `PA_QTDAPR`. — [FTP SIASUS](ftp://ftp.datasus.gov.br/dissemin/publicos/SIASUS/200801_/Dados/)
- **SIH (internação):** procedimentos especiais vão no arquivo SP (`SIHSUS/200801_/Dados/SP{UF}{AA}{MM}.dbc`), e as transfusões em internação aparecem ali como procedimento secundário (padrão do FTP, não testado nesta sessão).
- **Ferramentas:** TabNet (SIA → "Produção Ambulatorial" → filtrar Procedimento 0306…), PySUS (`pysus`, `SIA().download(...)`), microdatasus (R: `fetch_datasus(year_start=2025, month_start=1, uf="SP", information_system="SIA-PA")`) e Base dos Dados (`basedosdados.br_ms_sia.producao_ambulatorial` no BigQuery). Nomes de tabela conforme conhecimento prévio, não testados nesta sessão.

### Inferences
- O SIA mede o que foi pago pelo SUS. A rede privada sem contrato SUS fica de fora, e um dos sites encontrados atribui a ela cerca de 617 mil coletas em 2023 ([PDF umsosangue, Anvisa/Hemoprod](https://umsosangue.com.br/assets/img/2023-coletas-rede-privada.pdf), não verificado). Para "doações por município", o Hemoprod é mais completo. O SIA é útil para transfusões por município e estabelecimento.
- A soma de `PA_QTDAPR` para 0306010011 + 0306010020 por `PA_UFMUN` dá as coletas SUS por município de atendimento.

### Gaps
- Não rodei PySUS, microdatasus nem BigQuery para confirmar os nomes atuais das tabelas da Base dos Dados.

## 4. CNES: listar hemocentros, hemonúcleos, UCT, coleta e agências, com endereço e coordenadas

### Takeaway
A API aberta do CNES funciona sem chave e devolve lat/long. O tipo de unidade 69, "Centro de Atenção Hemoterapia e/ou Hematológica", retorna 796 estabelecimentos, 744 deles com coordenadas. O tipo 69 não cobre agências transfusionais e unidades de coleta que ficam dentro de hospitais. Para isso é preciso cruzar com o serviço especializado 128 (classificação 001 = coleta) nos arquivos CNES-SR do FTP.

### Cited Findings
- **API (testada, HTTP 200):**
  - `GET https://apidadosabertos.saude.gov.br/cnes/estabelecimentos?codigo_tipo_unidade=69&limit=20&offset=0`
  - Paginação por `offset`, com `limit` de até 20 por página (usei 20).
  - Campos: `codigo_cnes`, `nome_fantasia`, `nome_razao_social`, `codigo_tipo_unidade`, `endereco_estabelecimento`, `numero_estabelecimento`, `bairro_estabelecimento`, `codigo_cep_estabelecimento`, `codigo_municipio` (IBGE 6 dígitos), `codigo_uf`, `latitude_estabelecimento_decimo_grau`, `longitude_estabelecimento_decimo_grau`, `numero_telefone_estabelecimento`, `endereco_email_estabelecimento`, `descricao_turno_atendimento`, `descricao_esfera_administrativa`, `estabelecimento_faz_atendimento_ambulatorial_sus`, `data_atualizacao`.
  - Fonte: [API Dados Abertos Saúde](https://apidadosabertos.saude.gov.br/cnes/estabelecimentos)
- **Lista de tipos:** `GET https://apidadosabertos.saude.gov.br/cnes/tipounidades`, onde 69 = "CENTRO DE ATENCAO HEMOTERAPIA E OU HEMATOLOGICA" (testado) — [API](https://apidadosabertos.saude.gov.br/cnes/tipounidades)
- **Resultado da paginação completa do tipo 69 (cálculo próprio, nov/2026):** 796 estabelecimentos, 744 com lat/long. Por UF: SP 258, RJ 98, MG 65, RS 39, BA 38, MT 35, DF 33, PR 32, MA 32, RO 28, GO 22, MS 15, PA 13, ES 11, PB 11, PE 11, CE 9, PI 8, RN 7, SE 6, TO 6, SC 6, AM 5, AC 3, AL 3, AP 1, RR 1. O tipo inclui clínicas de hematologia privadas, e não só pontos de coleta. — [API CNES](https://apidadosabertos.saude.gov.br/cnes/estabelecimentos?codigo_tipo_unidade=69&limit=20&offset=0)
- **Serviço especializado 128 (Hemoterapia):** classificação 128001 = obtenção do sangue (coleta), 128004 = medicina transfusional ([SIGTAP 202611](ftp://ftp2.datasus.gov.br/pub/sistemas/tup/downloads/)). Os arquivos `ftp://ftp.datasus.gov.br/dissemin/publicos/CNES/200508_/Dados/SR/SR{UF}{AAMM}.dbc` vão até SRSP2609, set/2026 (testado). Os campos `SERV_ESP`/`CLASS_SR`/`CNES` seguem o layout DATASUS, que não abri.
- **CSV completo do CNES:** `https://s3.sa-east-1.amazonaws.com/ckan.saude.gov.br/CNES/cnes_estabelecimentos.zip` responde 200, tem cerca de 50 MB e Last-Modified de 11/06/2025. Está defasado em mais de 1 ano. — [teste HEAD]
- O antigo opendatasus.saude.gov.br agora redireciona (302) para `https://dadosabertos.saude.gov.br/`, um portal novo em Next.js. A API CKAN `/api/3/action/package_search` não respondeu JSON (testado).
- A Anvisa define na RDC 151/2001 os níveis de complexidade: Hemocentro Coordenador/Regional, Núcleo de Hemoterapia, Unidade de Coleta e Transfusão (UCT), Unidade de Coleta fixa/móvel, CTLD e Agência Transfusional (AT). — [RDC 151/2001](https://www.hemocentro.fmrp.usp.br/wp-content/uploads/2022/03/RDC-151-de-21-08-01.pdf)

### Inferences
Pipeline recomendado para "todos os pontos de coleta":
1. Baixar o SR mais recente de cada UF e filtrar `SERV_ESP=='128' & CLASS_SR=='001'` para obter a lista de CNES que coletam.
2. Para cada CNES, chamar `GET https://apidadosabertos.saude.gov.br/cnes/estabelecimentos/{codigo_cnes}` e obter endereço e lat/long (endpoint por código no padrão da API, não testado).
3. Geocodificar pelo CEP ou endereço os cerca de 7% sem coordenadas, por exemplo com Nominatim ou com a [BrasilAPI CEP v2](https://brasilapi.com.br/api/cep/v2/{cep}), que pode retornar coordenadas (não testado).
4. Cruzar com o `Tipo de estabelecimento` do Hemoprod pelo nome e município, para rotular hemocentro, UCT etc.

As coordenadas do CNES são autodeclaradas e às vezes caem no centróide do município. Vale validar se o ponto fica dentro da malha municipal do IBGE.

### Gaps
- Não baixei nem decodifiquei o .dbc SR (exige `pyreaddbc`/PySUS), por isso o número exato de CNES com 128/001 não foi apurado.
- Não confirmei o limite máximo de `limit` na API.
- Licença da API do CNES: não encontrei declaração explícita.

## 5. IBGE: população por município/UF e malhas GeoJSON

### Takeaway
As APIs do IBGE funcionam sem chave. A tabela 6579 (estimativas de população) já traz 2026, e a API de malhas devolve GeoJSON das UFs e municípios.

### Cited Findings
- **População estimada por UF (testado, HTTP 200, retorna série "2026"):** `GET https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/-1/variaveis/9324?localidades=N3[all]`. Para municípios, usar `N6[all]` (ex.: RO 2026 = 1.757.338; AC = 887.794). — [IBGE SIDRA API](https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/-1/variaveis/9324?localidades=N3%5Ball%5D)
- **Malha GeoJSON das UFs (testado, HTTP 200):** `GET https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?intrarregiao=UF&formato=application/vnd.geo+json`. Para municípios de uma UF: `.../malhas/estados/{UF}?intrarregiao=municipio&formato=application/vnd.geo+json`. — [IBGE Malhas API](https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?intrarregiao=UF&formato=application/vnd.geo+json)
- **Nomes e códigos de municípios:** `https://servicodados.ibge.gov.br/api/v1/localidades/municipios` (padrão conhecido, não testado nesta sessão).

### Inferences
- O CNES usa o código IBGE de 6 dígitos e o IBGE usa 7. Fazer o join por `str(cod7)[:6]`.
- O Hemoprod traz o nome do município, não o código, então é preciso normalizar nome + UF.

### Gaps
- Licença: o IBGE publica livremente, mas não conferi o termo de uso nesta sessão.

## 6. Distribuição ABO/Rh no Brasil, por região

### Takeaway
Não encontrei um estudo nacional recente revisado por pares. O próprio CSV Hemoprod de 2024, com cerca de 3,6 mi de tipagens de doadores, dá uma distribuição nacional e regional robusta. O+ é o tipo mais comum (44%), seguido de A+ (30%), e o Norte tem a maior proporção de O+ (53%).

### Cited Findings
- **Brasil 2024 (cálculo próprio, colunas `4.2 Imunohematologia [X][Doador]`, n = 3.596.544):** O+ 44,3%, A+ 30,2%, B+ 9,3%, AB+ 2,9%, O− 7,5%, A− 4,1%, B− 1,2%, AB− 0,4%. Os valores de 2025 são praticamente iguais (O+ 44,5%, A+ 29,9%, O− 7,6%). — [CSV Anvisa Hemoprod](https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/sangue-tecidos-celulas-e-orgaos/producao-e-avaliacao-de-servicos-de-hemoterapia/dados-brutos-de-producao-hemoterapica)
- **Por região, 2024 (cálculo próprio):**

| Região | O+ | A+ | B+ | AB+ | O− | A− | B− | AB− | n |
|---|---|---|---|---|---|---|---|---|---|
| Norte | 52,8 | 26,8 | 8,7 | 2,2 | 6,0 | 2,5 | 0,8 | 0,2 | 272.989 |
| Nordeste | 44,4 | 30,7 | 10,4 | 3,1 | 6,3 | 3,6 | 1,1 | 0,4 | 609.193 |
| Sudeste | 43,5 | 30,7 | 9,6 | 3,0 | 7,5 | 4,1 | 1,3 | 0,4 | 1.700.487 |
| Sul | 42,2 | 30,7 | 7,9 | 3,0 | 9,1 | 5,2 | 1,5 | 0,5 | 709.141 |
| Centro-Oeste | 45,7 | 28,7 | 9,2 | 2,8 | 7,8 | 4,0 | 1,3 | 0,4 | 304.734 |

  Fonte: [CSV Anvisa Hemoprod](https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/sangue-tecidos-celulas-e-orgaos/producao-e-avaliacao-de-servicos-de-hemoterapia/dados-brutos-de-producao-hemoterapica)
- **Estudos locais:** os estudos com doadores confirmam a predominância de O e A. Em Rondonópolis-MT, com n = 2.708: O 48,52%, A 36,11%, B 11,74%, AB 3,62%, RhD+ 85,93%. — [UFMT – Biodiversidade](https://periodicoscientificos.ufmt.br/ojs/index.php/biodiversidade/article/view/100/91). Os autores observam que "existem poucos estudos que avaliam a prevalência da distribuição do sistema ABO" no Brasil (mesma fonte, via busca).

### Inferences
- A tipagem conta exames e não doadores únicos. Doadores de repetição contam várias vezes, mas para proporções isso é aceitável.
- O Sul tem mais Rh− (cerca de 16%) e o Norte menos (cerca de 9,5%), o que é coerente com a ancestralidade europeia ou indígena predominante em cada região (inferência).

### Gaps
- Não encontrei nenhum artigo da HTCT/SciELO com amostra nacional para validar esses números.

## 7. Estoque nacional em tempo real (painel do MS, app "Doe Sangue", Hemorrede)

### Takeaway
Não existe painel público nacional de estoque em tempo real. O MS monitora diariamente, mas de forma interna (CGSH), por relatórios dos hemocentros. O estoque público, quando existe, é publicado estado a estado pelos hemocentros (fora do escopo desta nota).

### Cited Findings
- O MS monitora diariamente o estoque dos maiores hemocentros e não publica painel. — [MS – Atenção hemoterápica](https://www.gov.br/saude/pt-br/composicao/saes/doacao-de-sangue/atencao-hemoterapica)
- O remanejamento entre UFs é decidido pela CGSH a partir de relatórios periódicos dos hemocentros. Exemplo: Goiás enviou 300 bolsas a PE e RO em dez/2025. — [Jornal Opção](https://www.jornalopcao.com.br/ultimas-noticias/hemocentro-de-goias-envia-300-bolsas-de-sangue-a-pernambuco-e-rondonia-777571/)
- Há um projeto de lei estadual em MT (2026) para criar um painel unificado de estoque em tempo real, e não está confirmado que tenha sido aprovado. — [ALMT (PDF)](https://www.al.mt.gov.br/storage/webdisco/cp/20260306202321143100.pdf)
- Um artigo acadêmico afirma que o Brasil não tem um sistema nacional unificado que consolide a disponibilidade de sangue em tempo real (fonte secundária). — [RSD Journal](https://rsdjournal.org/rsd/article/download/50932/39937/516104)

### Inferences
- Para o site, o "nível de estoque" teria de ser montado por scraping ou integração com cada hemocentro estadual. As fontes nacionais servem para estatística histórica (Hemoprod, SIA) e localização (CNES).

### Gaps
- Não encontrei um app "Doe Sangue" oficial do MS ativo em 2026, nem uma API pública de estoque.
