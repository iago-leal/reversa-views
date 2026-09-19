# Adendo: vínculo entre spec e entrega, e conferências

> Identificador da feature: `010-vinculo-spec-e-conferencias`
> Data: `2026-09-19`
> Cenário: `greenfield`
> Gerado por: `/reversa-sync`

Este adendo é uma ponte. A extração em `_reversa_sdd/` descreve um painel que lê o processo do
Reversa, e os adendos 006, 008 e 009 o levaram a onze cartões, ao registro de bugs e ao panorama do
produto. A entrega da feature 010 não abre território nem cartão: aprofunda dois que existiam. O
panorama deixa de depender de que spec e pasta tenham o mesmo nome e passa a ler o vínculo que a
própria entrega declara no `legacy-impact.md`; o histórico passa a mostrar, ao lado do veredito de
cada pasta, quanto da conferência humana registrada no `onboarding.md` foi feito. Nada do que a
extração afirma deixou de valer, e a extensão continua sem escrever byte algum. O que segue diz como
ler cada artefato da extração enquanto a re-extração não vem.

## Vigência

Vigente desde 2026-09-19.

## Resumo da entrega

A regra da 009, spec ligada à pasta de mesmo nome, servia a este repositório e enganava num projeto
em que as specs têm nome de componente e as pastas têm nome de entrega. A leitura do `financas-ali`
mostrou o efeito: dez specs dadas como planejadas, embora duas entregas cubram cinco delas; três
componentes criados sem spec invisíveis; e uma pasta convergida com dezoito de vinte conferências em
branco. A feature ensina o painel a ler a coluna `Componente` de todas as tabelas de impacto, a
ligar por declaração a spec que não tem pasta homônima, a mostrar o componente entregue sem spec e a
expor a conferência pendente ao lado da situação, sem alterá-la.

Quarenta e quatro ações executadas, todas marcadas `[X]` em `actions.md` e registradas em
`progress.jsonl`, com uma linha `corrected` sobre T044. Dezoito arquivos criados, doze deles fixturas
de um mesmo diretório e três suítes, e trinta e três modificados. A suíte terminou a entrega com 1682
casos verdes em 102 arquivos, em três rodadas seguidas, e o preview ganhou cinco estados doentes,
cada um conferido pela suíte contra a leitura real.

Três separações organizam a entrega. A primeira é entre **nome e declaração**: o casamento por nome
da 009 continua valendo e tem precedência, e a declaração só liga spec órfã, o que manteve o panorama
deste repositório idêntico ao da 009. A segunda é entre **planejado e entregue sem spec**: o
componente que a entrega declara e nenhuma spec nomeia ganha linha própria, fora do denominador. A
terceira é entre **veredito e conferência**: a conferência é eixo ao lado da situação, e a pendente
não abre razão na faixa de bloqueio, porque o registro é prática do agente e não etapa do processo.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/prd.md` | `#4-escopo-in` | componente-novo | O eixo do panorama do produto, acrescentado pela 009, passa a ler também a declaração da entrega: leia-o como "cada spec ligada às pastas que têm o seu nome ou, na falta delas, às que a declaram", com o bloco "Entregues sem spec" ao lado. O eixo das entregas anteriores passa a trazer a contagem de conferências registradas por pasta. Nenhum cartão novo; continuam onze. |
| `_reversa_sdd/prd.md` | `#5-nao-objetivos-out` | regra-nova | Nenhum não-objetivo foi reaberto. A conferência é exposta e nunca julgada: o texto de `Resultado` sai como foi escrito, e o painel não classifica o teste. A proibição de escrita sobreviveu: quem fabrica os estados doentes é `scripts/estragar-vinculo.js`, sobre cópia fora do repositório. |
| `_reversa_sdd/prd.md` | `#9-criterios-de-aceite-alto-nivel` | regra-nova | O critério do Retomador ganhou uma resposta que faltava em projeto nomeado por entrega: quanto do produto planejado existe, contado pelas specs ligadas por nome ou por declaração. O critério da auditoria ganhou dois módulos a varrer, `src/domain/delivery-link.ts` e `src/domain/conferences.ts`, e a suíte de fronteiras do host passou a recusar os nomes `legacy-impact.md` e `onboarding.md` no host. |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#8-design-e-interface` | componente-novo | Dois módulos puros novos, na divisão que a seção já fixava. `src/domain/delivery-link.ts` extrai, uma vez por pasta, as células da coluna `Componente` de todas as tabelas com `Arquivo afetado` e `Componente` (RF-01, RF-02, RN-01, RN-04). `src/domain/conferences.ts` lê o registro de conferências (RF-06, RN-05, RN-06). A sonda `src/probe/features.ts` passou a abrir os dois arquivos só quando a listagem da pasta os mostra, pelas funções herdadas. **Registrado como W001, W002, W003 e W007.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#9-modelo-de-dados` | delta-de-dados | Cada entrada do histórico ganhou `vinculo` (estado `lido`, `ausente` ou `nao-lido`, com o arquivo e o número de tabelas) e `conferencias` (seis estados, linhas com data, marco, item, resultado, observação e se estão registradas, e as contagens `registradas` e `total` sobre todas as linhas); o histórico ganhou `anomalias`. O componente planejado ganhou `ligacoes`, cada uma com a pasta, a origem (`nome` ou `declarada`) e o impacto; o panorama ganhou `semSpec` e `vinculoParcial`. **A distinção que mais pesa na leitura:** `semSpec` fica fora de `convergidos` e do denominador, que continua sendo o número de specs (RF-05). **Registrado como W006.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#6-requisitos-funcionais` | regra-alterada | O cruzamento de specs com o histórico, da 009, passou a ter duas passagens: a do nome, com precedência, e a da declaração, só para spec sem pasta homônima (RF-03, RN-02, RN-03). Uma célula declara a spec quando a contém como nome inteiro, delimitado por início, fim, `.md` ou caractere fora de `[a-z0-9-]`, o que impede `painel-do-processo-v2` de declarar `painel-do-processo`. A conferência não muda a situação da pasta (RN-07). **Registrado como W004 e W010.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#11-edge-cases-e-tratamento-de-erros` | regra-nova | Onboarding ausente ou sem a seção de registro é estado nomeado, sem anomalia. Seção sem tabela reconhecível abre `tabela-nao-reconhecida` com a seção e o cabeçalho no detalhe. Arquivo listado e não lido, e registro cortado no teto de cem linhas, abrem `artefato-da-entrega-nao-lido`; no caso do vínculo, o panorama se declara parcial. **Registrado como W012.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#7-requisitos-nao-funcionais` | regra-nova | O teto `CONFERENCE_ROW_CAP`, cem, entrou em `src/domain/limits.ts` ao lado dos nomes dos dois arquivos. A referência de desempenho, no teto de cinquenta pastas com os dois arquivos a mais em cada uma, mede cerca de 50 ms isolada e de 130 a 155 ms sob a suíte paralela, contra 200 ms. A medida pegou um custo evitável antes de ele chegar a um projeto real: a expressão de declaração era compilada por par de spec e célula, e passou a ser compilada uma vez por spec (`declarerOf`). **Registrado como W016.** |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#9-modelo-de-dados` | delta-de-contrato-externo | `SetProcessData` cresceu por acréscimo, e desta vez sem campo novo no topo: todos os campos da 010 são opcionais e entram ao fim de `HistoryEntry`, `ProjectHistory`, `PlannedComponent` e `ProductPanorama` (RF-10). Campo ausente continua significando host anterior, e a tela o diz em frase própria ("conferências não lidas", "vínculo declarado não lido por esta leitura"). **Registrado como W011.** |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#6-requisitos-funcionais` | regra-nova | A sessão extrai o vínculo uma única vez, depois de ler as pastas e dentro do mesmo bloco protegido, e o entrega ao histórico e ao panorama. O host continua sem nomear arquivo do pipeline. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#6-requisitos-funcionais` | regra-nova | O panorama mostra a origem de cada ligação em texto, "pelo nome" ou "declarada", e a declarada abre o `legacy-impact.md` da pasta pela mensagem já existente (RF-13). O bloco "Entregues sem spec" fica entre as linhas planejadas e "Fora do plano" (RF-04). O histórico mostra "N de M conferências registradas" ao lado da situação, abrindo o onboarding (RF-07). A faixa de bloqueio não ganha razão por conferência pendente (RF-08). O resumo consultável ganha as duas informações, pela mesma função pura (RF-12). **Registrado como W005, W008, W009, W013 e W014.** |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#11-edge-cases-e-tratamento-de-erros` | regra-nova | Três frases distintas no bloco dos sem spec, nunca bloco vazio: host anterior ao campo, vínculo parcial por arquivo não lido e nenhum componente sem spec. As anomalias da entrega somam na integridade e entram na seção de anomalias depois das do eixo greenfield. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#7-requisitos-nao-funcionais` | regra-nova | O pacote da tela mede 212.316 B, 51,8 % do teto de 409.600 B e 33.444 B abaixo da guarda de 60 %; a feature custou 5.694 B. Origem da ligação, marca "sem spec" e contagem de conferências são texto, nunca só cor, com quebra de linha a 300 px. **Registrado como W017.** |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#6-requisitos-funcionais` | componente-novo | `scripts/estragar-vinculo.js`, no molde dos auxiliares anteriores: copia o workspace para fora do repositório, adoece a cópia e imprime o caminho. Cinco estados que este projeto, saudável, não produz: `declarada`, `sem-spec`, `conferencias`, `conferencias-sem-tabela` e `impacto-grande` (RF-14). `tests/preview-vinculo.spec.ts` prova que cada caso produz o estado prometido e que a origem sai intocada. **Registrado como W015.** |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#8-design-e-interface` | regra-nova | O README ganhou cinco linhas na tabela de estados do preview, uma por caso do auxiliar. |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#6-requisitos-funcionais` | regra-nova | Nenhum arquivo vendorizado foi tocado. A sonda reutiliza `listNames`, `readText` e `resolveInside`; o julgamento reutiliza `cellsOf` e `normalizeCell`. A chave de coluna das tolerâncias de cabeçalho do RF-07.3 foi redeclarada localmente, com a duplicação declarada em `src/domain/limits.ts`. |

## Achado da leitura real: RF-09 não se cumpre no `financas-ali`

O critério de RF-09 (RN-08) pede que a 001 do `financas-ali` apareça como `entregue-sem-adendo`. Ela
aparece como `sem-acoes`. A causa não está na 010: o `actions.md` dessa pasta mede 275.630 B, acima
do teto de 262.144 B da sonda herdada, e a sonda o devolve como não lido. O julgamento da situação,
escrito na 006, trata o texto nulo como pasta sem ações, e por isso a pasta é descrita como vazia
quando, na verdade, não foi lida. A regra da RN-08 está implementada e coberta pelas suítes; o que
falta é distinguir, na situação, o `actions.md` ausente do `actions.md` presente e não lido. O
defeito merece registro próprio por `/reversa-bugs`, e esta entrega não o corrigiu.

## Regras sob vigilância

O watch principal de `regression-watch.md` continua **vazio**, pelo mesmo motivo das features 001 a
009: sem extração `/reversa` sobre este repositório não há regras 🟢 a vigiar. Na seção
"Observações", sem peso de regressão, os identificadores **W001 a W015** cobrem os requisitos
funcionais `RF-01` a `RF-14`, e **W016** e **W017** cobrem os requisitos de desempenho e de tamanho.
Os que mais pesam sobre a leitura da entrega aparecem nomeados na tabela acima.

Como nas features anteriores, a numeração recomeça em W001, e o identificador só é legível junto do
nome da feature que o escreveu.

Conteúdo integral em `_reversa_forward/010-vinculo-spec-e-conferencias/regression-watch.md`.

## Fontes

- `_reversa_forward/010-vinculo-spec-e-conferencias/legacy-impact.md`
- `_reversa_forward/010-vinculo-spec-e-conferencias/regression-watch.md`
- `_reversa_forward/010-vinculo-spec-e-conferencias/requirements.md`
- `_reversa_forward/010-vinculo-spec-e-conferencias/actions.md`
- `_reversa_forward/010-vinculo-spec-e-conferencias/progress.jsonl`
