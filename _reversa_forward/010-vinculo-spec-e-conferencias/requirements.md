# Requirements: vínculo entre spec e entrega, e conferências do onboarding

> Identificador: `010-vinculo-spec-e-conferencias`
> Data: `2026-09-19`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA
> Cenário: `greenfield` (âncora `prd.md` + specs em `sdd/`, sem `architecture.md` nem `domain.md`)
> Insumo: `_reversa_bugs/painel-do-processo/intake/leitura-financas-ali-2026-09-19.md`

## 1. Resumo executivo

A feature 009 deu ao painel o panorama do produto: cada spec de `sdd/` é um componente planejado, e a situação dele vem da pasta de feature que tem o mesmo nome. A regra serve a este repositório, em que as cinco specs viraram, nome a nome, as pastas 001 a 005, e engana num projeto em que as specs têm nome de componente e as pastas têm nome de entrega. A leitura do `financas-ali` em 2026-09-19 mostrou os quatro efeitos: as dez specs aparecem como planejadas, embora duas entregas cubram cinco delas; os três componentes que a 002 criou sem spec não aparecem; a 002 é dada como convergida enquanto dezoito das vinte conferências operacionais do `onboarding.md` estão em branco; e a 001, nascida com a extração greenfield, aparece como entrega esquecida pelo `/reversa-sync`. A feature ensina o painel a ler o vínculo que a própria entrega declara, a mostrar o componente entregue sem spec, e a expor a conferência humana pendente ao lado do veredito, mantendo como entrega sem adendo a feature que nasceu com o projeto, sempre derivando do disco e sem escrever byte algum.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/addenda/009-greenfield-e-features-do-prd.md` | RN-04 a RN-07 da feature 009, vigentes: as specs de `sdd/` são os componentes planejados; o casamento com a pasta é por igualdade exata do nome normalizado (D-07); pasta sem spec homônima é "fora do plano"; a situação do componente é a da pasta casada mais avançada. Esta feature altera a RN-05 e acrescenta fontes à RN-06, sem tocar a RN-04. | 🟢 |
| `_reversa_sdd/addenda/006-cartoes-e-cronologia.md` | O histórico classifica cada pasta em `sem-acoes`, `em-aberto`, `entregue-sem-adendo` ou `convergida`, com a marca `ativa`/`pausada` em eixo separado, até cinquenta pastas por passagem. As conferências entram ao lado dessa situação, e a feature nascida do greenfield toca a terceira. | 🟢 |
| `_reversa_sdd/addenda/bug-BUG-20260914-DTLI-v001.md` | RF-07.1 a RF-07.3: valor canônico com crases ou negrito é o valor; o cabeçalho casa pelo nome da coluna, tolerando artigo e anotação final entre parênteses, e qualquer tolerância além dessas exige caso concreto e adendo novo. A coluna `Componente (spec de origem)` da 001 do `financas-ali` já é reconhecida por essa regra. | 🟢 |
| `_reversa_sdd/addenda/bug-BUG-20260914-5UH7-v001.md` | RF-07.4 e RF-07.5: seção reconhecida pelo começo do título normalizado; o que o leitor não lê, ele diz por anomalia. É o molde de tolerância para a seção de conferências. | 🟢 |
| `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais` | RF-07: toda degradação da leitura vira anomalia com arquivo, código e detalhe. | 🟢 |
| `_reversa_sdd/sdd/leitura-do-processo.md#9-modelo-de-dados` | Ausência e vazio carregam sentido e não se confundem. | 🟡 |
| `_reversa_sdd/sdd/painel-do-processo.md#4-non-goals-fora-do-escopo` | NG-02: nenhuma interpretação de Markdown na tela; o julgamento acontece fora dela. | 🟡 |
| `_reversa_sdd/sdd/ponte-e-host.md#9-modelo-de-dados` | O protocolo cresce por acréscimo, sem renomear nem reordenar campo. | 🟢 |
| `_reversa_sdd/sdd/heranca-e-sincronia.md#6-requisitos-funcionais` | RF-04: toda mudança em `src/heranca/` é adaptação declarada com o trecho. | 🟢 |
| `.claude/skills/reversa-coding/SKILL.md`, seção "Geração do legacy-impact.md" | O `legacy-impact.md` traz a tabela `Arquivo afetado \| Componente \| Tipo \| Severidade \| Justificativa`; no cenário greenfield, cada arquivo é mapeado "ao componente correspondente das specs em `_reversa_sdd/sdd/`". É a única fonte em que o vínculo entre arquivo entregue e spec é prescrito pelo processo. | 🟢 |
| `.claude/skills/reversa-plan/SKILL.md`, linha 61 | O `onboarding.md` é o "passo a passo executável para um humano que vai testar a feature pela primeira vez". A seção de registro de conferências não é prescrita: é prática do agente, presente em 1 de 307 `onboarding.md` de `~/dev`. | 🟢 |
| `.claude/skills/reversa-new/SKILL.md`, "Executando o pipeline" | No modo expresso, o `/reversa-new` abre a primeira feature a partir do "Escopo (in)" do PRD e registra os estágios `forward-*` em `newproject_progress`. No modo guiado, não registra feature alguma. | 🟢 |
| Medição de 2026-09-19 neste repositório e no `financas-ali` | Detalhada abaixo desta tabela. | 🟢 |

**Medição das fontes do vínculo, 2026-09-19.** A coluna `Componente` do `legacy-impact.md` assume três formas: nome nu da spec (006 a 009 deste repositório; 002 do `financas-ali`), nome com extensão entre crases, um ou vários por célula (001 do `financas-ali`), e prosa com o caminho da spec entre parênteses (001 a 005 deste repositório). As demais fontes são ruidosas: todo adendo deste repositório cita, na coluna `Artefato`, de quatro a cinco das cinco specs, e todo `requirements.md` cita de uma a cinco, porque tocar uma spec não é entregá-la. No `financas-ali`, a 002 tem seis tabelas de impacto no mesmo `legacy-impact.md`, e o leitor herdado (`findTable`) lê só a primeira; a coluna `Componente` da 002 nomeia seis componentes, três deles sem spec em `sdd/`. A medição também corrige o insumo: o `requirements.md` da 001 cita sete specs, mas adia por escrito `boletos-faturas` (RN-09 daquela feature) e `categorizacao-regras` (RN-14), e a coluna `Componente` do `legacy-impact.md` da 001 nomeia só as cinco entregues. O vínculo verdadeiro cobre cinco das dez specs, e não sete.

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| O Retomador (primária) | Saber quanto do produto planejado existe e o que falta conferir, sem abrir arquivo | Abre o painel do `financas-ali` e lê que cinco das dez specs foram entregues pela 001 ou pela 002, que três componentes existem sem spec e que a 002 convergiu com dezoito conferências operacionais pendentes |
| O Operador | Decidir o próximo passo depois de fechar as ações de uma feature | Fecha a última ação, vê no histórico que a entrega convergiu mas que a conferência do onboarding está em branco, e sabe que o trabalho seguinte é humano, e não de agente |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** O vínculo declarado entre uma pasta de feature e uma spec vem da coluna `Componente` de TODAS as tabelas de impacto do `legacy-impact.md` da pasta. **Tabela de impacto** é toda tabela que tenha, pelas tolerâncias de cabeçalho do RF-07.3, as colunas `Arquivo afetado` e `Componente`, o esquema que o `/reversa-coding` prescreve; tabela de mapeamento sem `Arquivo afetado`, como a `Componente | Spec de origem | Situação` da 002 do `financas-ali`, não é fonte. Uma célula declara a spec `S` quando contém `S` como nome inteiro, delimitado por início, fim ou caractere que não pertença a nome kebab, com ou sem a extensão `.md` e com ou sem o caminho `sdd/`. Uma célula pode declarar mais de uma spec, e célula sem nome de spec não declara nada. O adendo e o `requirements.md` não são fontes de vínculo, porque a medição mostrou que citam specs que a feature não entrega. 🟢
   - Origem no legado: `.claude/skills/reversa-coding/SKILL.md`, "Geração do legacy-impact.md"; medição da seção 2
   - Tipo: nova
2. **RN-02:** O casamento por nome da RN-05 da feature 009 continua valendo, sem mudança de regra, e tem precedência. A declaração da RN-01 só liga uma pasta a uma spec que **não** tenha pasta homônima; a declaração de spec que já casa pelo nome com alguma pasta é ignorada para o vínculo. Cada ligação guarda a sua origem, `nome` ou `declarada`, para que o painel diga por que a pasta está ali, e a situação do componente continua sendo a da pasta ligada mais avançada (RN-06 da 009). Por consequência, este repositório não muda: as cinco specs têm pasta homônima, e as pastas 006 a 009 continuam "fora do plano", como espera o cenário da 009; no `financas-ali`, onde nenhum nome coincide, todo vínculo vem da declaração. 🟢
   - Origem no legado: `_reversa_sdd/addenda/009-greenfield-e-features-do-prd.md` (RN-05, RN-06); insumo, pergunta 1
   - Tipo: alterada
3. **RN-03:** Uma pasta é **fora do plano** quando não se liga a spec alguma, nem por nome nem por declaração. 🟢
   - Origem no legado: `_reversa_sdd/addenda/009-greenfield-e-features-do-prd.md` (RN-05)
   - Tipo: alterada
4. **RN-04:** Um **componente sem spec** é um nome que a coluna `Componente` de alguma tabela de impacto (RN-01) traz sozinho na célula, com ou sem crases, em forma kebab (letras minúsculas ASCII, dígitos e hífens, em uma palavra ou mais, sem exigência de hífen), e que não é nome de spec em `sdd/`. Ele entra no panorama como linha própria, marcada "sem spec", com as pastas que o declaram e a situação da mais avançada, e nunca conta no denominador de "N de M componentes planejados". Prosa, nome de arquivo com extensão e palavra com maiúscula ou entre parênteses não são componente: "Verificação local", "Tema", `docker-compose.yml` e "(todos)" não geram linha, e `assistente` gera. 🟢
   - Origem no legado: `financas-ali`, `002/legacy-impact.md` (seis componentes, três sem spec) e linha `sdd/ (conjunto)` do adendo da 002; insumo, pergunta 2
   - Tipo: nova
5. **RN-05:** A **conferência** de uma pasta vem da seção de nível 2 do `onboarding.md` cujo título normalizado, sem a numeração inicial, começa por `registro de conferencias`. Dentro dela, a primeira tabela que tenha colunas chamadas `Data` e `Resultado`, em qualquer posição e pelas tolerâncias do RF-07.3, é a tabela de registro; as colunas `Marco`, `Item` e `Observação` são lidas pelo nome quando existem. Cada linha é **registrada** quando `Data` e `Resultado` têm conteúdo, e **pendente** quando um dos dois está vazio ou só com traço. O texto de `Resultado` é exposto como escrito, sem classificação: "10 conferem; 9b divergente" e "não executável" são ambos registros. 🟡
   - Origem no legado: `financas-ali`, `002/onboarding.md#9-registro-de-conferencias`; `_reversa_sdd/addenda/bug-BUG-20260914-5UH7-v001.md` (seção pelo começo do título); insumo, pergunta 3
   - Tipo: nova
6. **RN-06:** Onboarding ausente, ou presente sem a seção de registro, é **sem registro de conferências**: estado nomeado, sem anomalia, porque a seção não é prescrita pelo processo. Seção presente sem tabela reconhecível gera `tabela-nao-reconhecida` com a seção e o cabeçalho encontrado no detalhe, e seção com tabela sem linha alguma é **registro vazio**, distinto dos dois anteriores. 🟢
   - Origem no legado: `_reversa_sdd/sdd/leitura-do-processo.md#9-modelo-de-dados`; `_reversa_sdd/addenda/bug-BUG-20260914-5UH7-v001.md` (RF-07.5)
   - Tipo: nova
7. **RN-07:** A conferência é um eixo ao lado da situação do histórico, e não altera a situação: uma pasta `convergida` com linhas pendentes continua `convergida`, e ganha a contagem "N de M conferências registradas". A conferência pendente fica só como contagem no histórico e no panorama: não gera próxima ação nem razão na faixa de bloqueio, que continua reservada ao que o processo prescreve, porque o registro de conferências é prática do agente, e não etapa do processo. 🟢
   - Origem no legado: `_reversa_sdd/addenda/006-cartoes-e-cronologia.md` (dois eixos, situação e marca); `financas-ali`, `002/actions.md` linha 83 (pronto exige ações em `[X]` e onboarding conferido)
   - Tipo: nova
8. **RN-08:** A feature que nasce com a extração greenfield não recebe tratamento próprio: sem adendo, ela é `entregue-sem-adendo` como qualquer outra. O `/reversa-sync` prevê adendo para o cenário greenfield, e a 001 deste repositório, nascida da mesma forma, o recebeu; logo a 001 do `financas-ali` é, de fato, entrega à espera de convergência. A decisão dispensa também sinal que o disco não oferece: `newproject_progress` em modo guiado não registra feature alguma, o id 001 é convenção, e a nota "Feature greenfield, sem legado pré-existente" aparece em toda feature greenfield. 🟢
   - Origem no legado: `.claude/skills/reversa-new/SKILL.md`; `.claude/skills/reversa-sync/SKILL.md`, passo 4.2; `_reversa_sdd/addenda/001-leitura-do-processo.md`; insumo, pergunta 4
   - Tipo: mantida (decisão de não alterar a situação do histórico)
9. **RN-09:** A leitura nova nunca escreve, lê apenas pelas funções que a sonda herdada exporta e respeita os tetos existentes: no máximo cinquenta pastas por passagem, cada `legacy-impact.md` e `onboarding.md` sob o teto de bytes da sonda; o arquivo truncado é dito truncado, e o vínculo ou a conferência dele são declarados parciais. 🟢
   - Origem no legado: `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais` (RF-01); `_reversa_sdd/addenda/006-cartoes-e-cronologia.md`; `_reversa_sdd/addenda/009-greenfield-e-features-do-prd.md` (RN-09, RN-10)
   - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | A sonda local lê, de cada pasta do histórico, o texto do `legacy-impact.md` e do `onboarding.md`, quando existem, reusando as funções de leitura herdadas | Must | Com cinquenta pastas, a leitura abre no máximo cem arquivos novos; nenhum módulo `node:` é importado pela sonda nova | 🟢 |
| RF-02 | O julgamento extrai da coluna `Componente` de todas as tabelas de impacto de cada pasta os nomes de spec declarados (RN-01) e os componentes sem spec (RN-04) | Must | A 002 do `financas-ali`, com seis tabelas, declara `ajustes`, `fundacao-persistencia` e `telas-e-navegacao` e três componentes sem spec; a 001 declara cinco specs, inclusive nas células com várias | 🟢 |
| RF-03 | O panorama liga cada spec às pastas pela RN-02, nome primeiro e declaração só para spec sem pasta homônima, com a origem de cada ligação, e deriva a situação pela RN-06 da 009 | Must | No `financas-ali`, cinco specs deixam de ser `planejada` e cinco continuam, entre elas `boletos-faturas` e `categorizacao-regras`, que a 001 adiou por escrito; neste repositório, o panorama e o grupo "fora do plano" ficam idênticos aos da 009 | 🟢 |
| RF-04 | O panorama ganha o bloco "Entregues sem spec", depois das linhas planejadas e antes de "Fora do plano", com uma linha por componente sem spec, as pastas que o declaram e a situação | Must | O `financas-ali` mostra `acesso-e-identidade`, `assistente` e `operacao-de-producao`; este repositório mostra o bloco declarando por frase que não há componente sem spec | 🟢 |
| RF-05 | A frase de contagem do panorama continua "N de M componentes planejados convergidos", com M igual ao número de specs; os componentes sem spec e as pastas fora do plano têm frases próprias | Must | O `financas-ali` conta cinco das dez specs com pasta ligada, e diz "3 componentes entregues sem spec" em frase separada | 🟢 |
| RF-06 | O julgamento lê o registro de conferências de cada pasta (RN-05, RN-06) e devolve, por pasta, o estado (sem registro, registro vazio, lido, parcial) e as linhas com data, marco, item, resultado, observação e se estão registradas | Must | A 002 do `financas-ali` devolve vinte linhas, duas registradas; a 001 devolve "sem registro de conferências", sem anomalia | 🟡 |
| RF-07 | O histórico mostra, em cada pasta com registro lido, "N de M conferências registradas" ao lado da situação, sem alterar a situação | Must | A 002 continua `convergida` e mostra "2 de 20 conferências registradas" | 🟢 |
| RF-08 | A conferência pendente em pasta convergida não gera próxima ação nem razão na faixa de bloqueio (RN-07) | Should | Com a 002 do `financas-ali` convergida e 18 conferências pendentes, a faixa de bloqueio não nomeia a 002 por causa delas, e a situação da pasta não muda | 🟢 |
| RF-09 | A feature nascida da extração greenfield é classificada como qualquer outra (RN-08), sem regra nem marca própria | Should | A 001 do `financas-ali` continua `entregue-sem-adendo`, e nenhum código distingue a primeira pasta | 🟢 |
| RF-10 | A carga `SetProcessData` ganha os campos novos por acréscimo ao fim das estruturas existentes do histórico e do panorama; as duas declarações do contrato os acompanham, e a suíte que as prende continua verde | Must | Tela nova contra host antigo declara os campos ausentes sem quebrar; tela antiga contra host novo os ignora | 🟢 |
| RF-11 | Toda perda de leitura do eixo novo chega à seção de anomalias pela forma estrutural comum: tabela de conferências não reconhecida, arquivo truncado e leitura acima do teto | Must | Uma seção de registro com colunas sem `Data` produz `tabela-nao-reconhecida` com seção e cabeçalho no detalhe | 🟢 |
| RF-12 | O resumo consultável ganha, no bloco do panorama, as linhas dos componentes sem spec e, no bloco das entregas, a contagem de conferências por pasta, compostos pela mesma função pura | Should | Documento e cópia produzem texto idêntico com as linhas novas | 🟢 |
| RF-13 | Cada ligação entre spec e pasta mostrada no panorama diz a sua origem, `nome` ou `declarada`, em texto, e o `legacy-impact.md` e o `onboarding.md` citados são clicáveis pela mensagem de abertura da ponte | Should | A linha de `ajustes` no `financas-ali` mostra a 002 como `declarada` e abre o `legacy-impact.md` dela | 🟡 |
| RF-14 | O preview alcança por cópia adoecida os estados que este repositório não produz: specs sem pasta homônima ligadas por declaração, componente sem spec, registro de conferências com linhas pendentes e registro não reconhecido | Should | Cada estado tem comando escrito e uma suíte prova que a cópia produz o estado prometido | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Desempenho | A leitura completa do workspace de referência continua abaixo de 200 ms com até cem arquivos novos lidos, com a medida registrada ao lado do teto | `_reversa_sdd/addenda/001-leitura-do-processo.md`, RNF-01; `_reversa_sdd/addenda/009-greenfield-e-features-do-prd.md` | 🟢 |
| Tamanho | O pacote da tela continua dentro do teto de 409.600 bytes e da guarda de 60 % da suíte, com o número medido escrito ao lado | `_reversa_sdd/addenda/009-greenfield-e-features-do-prd.md`, W027 | 🟢 |
| Segurança | Nenhum módulo novo escreve, importa `node:`, rede ou processo; as suítes de somente leitura e de fronteiras do host varrem os módulos novos | `tests/readonly-local.spec.ts`, `tests/host-boundaries.spec.ts` | 🟢 |
| Herança | A leitura das várias tabelas de impacto e do registro de conferências corre ao lado da herdada, reusando o que ela exporta; mudança em `src/heranca/`, se o plano a exigir, só por adaptação declarada | `_reversa_sdd/sdd/heranca-e-sincronia.md#6-requisitos-funcionais`, RF-04 | 🟢 |
| Contrato | O protocolo cresce por acréscimo, com as duas declarações presas por teste | `_reversa_sdd/sdd/ponte-e-host.md#9-modelo-de-dados` | 🟢 |
| Acessibilidade | Origem da ligação, marca "sem spec" e contagem de conferências são texto, nunca só cor | `_reversa_sdd/sdd/painel-do-processo.md#7-requisitos-nao-funcionais` | 🟢 |
| Testabilidade | Extração do vínculo, reconhecimento do componente sem spec e leitura das conferências são funções puras com as formas medidas no `financas-ali` e neste repositório como casos | `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais`, RF-13 | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: specs de componente ligadas a entregas por declaração
  Dado dez specs em sdd/ cujos nomes não coincidem com nenhuma pasta
  E um legacy-impact.md cuja coluna Componente nomeia ajustes, fundacao-persistencia e telas-e-navegacao
  Quando o painel é lido
  Então essas três specs deixam de ser "planejada" e trazem a pasta com a origem "declarada"
  E as specs que nenhuma pasta nomeia continuam "planejada"

Cenário: célula com várias specs e extensão entre crases
  Dado a célula "`fundacao-persistencia.md`, `acerto-mensal.md`" na coluna Componente (spec de origem)
  Quando o vínculo é extraído
  Então a pasta declara fundacao-persistencia e acerto-mensal

Cenário: todas as tabelas de impacto do arquivo são lidas
  Dado um legacy-impact.md com seis tabelas de impacto
  Quando o vínculo é extraído
  Então os componentes das seis tabelas são considerados, e não só os da primeira

Cenário: prosa na coluna Componente não vira componente
  Dado células "Verificação local (`_reversa_sdd/sdd/leitura-do-processo.md#7`)" e "Tema (`#8`, RF-11)"
  Quando o vínculo é extraído
  Então a primeira declara leitura-do-processo
  E nenhuma das duas gera componente sem spec

Cenário: componente entregue sem spec
  Dado uma coluna Componente com "acesso-e-identidade" e nenhuma spec com esse nome
  Quando o painel é lido
  Então o bloco "Entregues sem spec" lista acesso-e-identidade com a pasta que o declara
  E o denominador de componentes planejados não muda

Cenário: declaração de spec com pasta homônima não liga
  Dado a spec painel-do-processo e a pasta 003-painel-do-processo
  E a pasta 006 cuja coluna Componente declara painel-do-processo
  Quando o painel é lido
  Então painel-do-processo liga-se só à 003, com a origem "nome"
  E a 006 continua em "Fora do plano"

Cenário: tabela de mapeamento não é tabela de impacto
  Dado um legacy-impact.md com a tabela "Componente | Spec de origem | Situação" e tabelas com "Arquivo afetado" e "Componente"
  Quando o vínculo é extraído
  Então só as tabelas com "Arquivo afetado" são lidas

Cenário: componente sem spec de uma palavra só
  Dado a célula "assistente" numa tabela de impacto e nenhuma spec com esse nome
  Quando o painel é lido
  Então assistente aparece em "Entregues sem spec"

Cenário: feature nascida da extração greenfield sem adendo
  Dado a pasta 001 de um projeto greenfield, com ações fechadas e sem adendo
  Quando o painel é lido
  Então a pasta é "entregue-sem-adendo", como qualquer outra

Cenário: pasta que não se liga a spec alguma
  Dado uma pasta sem spec homônima e sem legacy-impact.md
  Quando o painel é lido
  Então a pasta aparece em "Fora do plano"

Cenário: convergida com conferência pendente
  Dado uma pasta convergida cujo onboarding.md tem a seção "9. Registro de conferências"
  E a tabela tem vinte linhas, duas com Data e Resultado preenchidos
  Quando o painel é lido
  Então a situação continua "convergida"
  E o histórico mostra "2 de 20 conferências registradas"
  E a faixa de bloqueio não traz razão por causa das conferências pendentes

Cenário: resultado negativo também é registro
  Dado uma linha com Data preenchida e Resultado "não executável"
  Quando o registro é lido
  Então a linha conta como registrada e o resultado aparece como escrito

Cenário: onboarding sem seção de registro
  Dado um onboarding.md com o roteiro de conferência em prosa e sem a seção de registro
  Quando o painel é lido
  Então a pasta é dita "sem registro de conferências"
  E nenhuma anomalia é registrada

Cenário: seção de registro sem tabela reconhecível
  Dado a seção "Registro de conferências" com uma tabela sem coluna Data
  Quando o painel é lido
  Então uma anomalia "tabela-nao-reconhecida" traz a seção e o cabeçalho no detalhe

Cenário: host anterior a esta feature
  Dado uma carga SetProcessData sem os campos novos
  Quando o painel desenha
  Então o panorama e o histórico declaram por frase que o vínculo declarado e a conferência não foram lidos
  E nenhum bloco vazio é desenhado

Cenário: arquivo acima do teto de bytes
  Dado um legacy-impact.md maior que o teto da sonda
  Quando o painel é lido
  Então o vínculo da pasta é declarado parcial e o relatório da sonda o nomeia truncado

Cenário: nenhum módulo novo escreve
  Dado o código completo da extensão
  Quando as suítes de somente leitura e de fronteiras rodam
  Então a sonda e o julgamento novos não importam módulo "node:" algum

Cenário: a origem da ligação é dita em texto
  Dado uma spec ligada a uma pasta pelo nome e a outra por declaração
  Quando o panorama desenha
  Então cada pasta traz a origem "nome" ou "declarada" em texto
  E o legacy-impact.md da pasta declarada é clicável

Cenário: o resumo consultável ganha as linhas novas
  Dado uma carga com componente sem spec e conferências lidas
  Quando o usuário pede o resumo em documento e depois em cópia
  Então os dois textos são idênticos e trazem as linhas dos componentes sem spec e a contagem de conferências

Cenário: o preview alcança os estados novos por cópia adoecida
  Dado o auxiliar que copia o workspace para pasta temporária
  Quando ele adoece a cópia com spec ligada só por declaração, componente sem spec e registro com linhas pendentes
  Então o preview desenha cada estado prometido sem escrever no workspace observado
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01 a RF-03, RF-05 | Must | Sem o vínculo declarado, o panorama de um projeto com specs de componente diz que nada foi entregue, que é o engano central do insumo |
| RF-06, RF-07 | Must | A conferência em branco é o trabalho que falta de fato na 002 do `financas-ali`, e hoje fica em lugar que o painel não lê |
| RF-04 | Must | Componente entregue sem spec é lacuna que o próprio adendo declara; omiti-lo repete o engano da extração |
| RF-10, RF-11 | Must | Contrato por acréscimo e anomalia nomeada são invariantes do produto |
| RF-08 | Should | Fixa por teste que a conferência não invade a faixa de bloqueio |
| RF-09 | Should | Fixa por teste que a feature greenfield não ganha exceção |
| RF-12 a RF-14 | Should | Refinam leitura e verificação, no precedente das features 006 a 009 |
| RNF de segurança, herança e contrato | Must | Invariantes não negociáveis |
| RNF de desempenho, tamanho, acessibilidade e testabilidade | Should | Tetos já medidos pelas features anteriores, verificados por suíte |

## 9. Esclarecimentos

### Sessão 2026-09-19

- **Q:** RN-02: como o vínculo declarado se soma ao casamento por nome?
  **R:** A declaração vale só para specs sem pasta homônima; o casamento por nome tem precedência, e este repositório não muda.
- **Q:** RN-08: como tratar a feature nascida da extração greenfield?
  **R:** Continua `entregue-sem-adendo`, porque o `/reversa-sync` prevê adendo para o greenfield e a 001 deste repositório o recebeu.
- **Q:** RN-04: o hífen obrigatório exclui `assistente`, que o RF-04 espera ver listado; qual regra vale?
  **R:** Retira-se a exigência do hífen: uma palavra ou mais em kebab, sozinha na célula, com ou sem crases; maiúscula e parênteses continuam excluindo.
- **Q:** RN-01 e RN-04: o que conta como tabela de impacto?
  **R:** Toda tabela com as colunas `Arquivo afetado` e `Componente`, o esquema do `/reversa-coding`; a tabela de mapeamento fica de fora.
- **Q:** RN-07: as conferências em branco numa feature convergida também aparecem na faixa de bloqueio?
  **R:** Não. Ficam só como contagem no histórico e no panorama; a faixa continua reservada ao que o processo prescreve.

## 10. Lacunas

Nenhuma lacuna aberta: as cinco dúvidas da versão inicial foram decididas na sessão de 2026-09-19.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-19 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-09-19 | `/reversa-clarify`: RN-01, RN-02, RN-04, RN-07 e RN-08 decididas | reversa |
