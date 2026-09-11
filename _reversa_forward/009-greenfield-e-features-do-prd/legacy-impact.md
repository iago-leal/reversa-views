# Impacto no legado: 009-greenfield-e-features-do-prd

**Data:** 2026-09-11
**Feature:** `009-greenfield-e-features-do-prd`
**Cenário:** greenfield.

Feature greenfield, sem legado pré-existente. Âncora: `prd.md` + specs SDD.

Não há extração de `/reversa` neste projeto: `_reversa_sdd/` não tem `architecture.md` nem
`domain.md`, e o contexto vem de `_reversa_sdd/prd.md` com as cinco specs de `_reversa_sdd/sdd/`.
Por isso não há regra 🟢 extraída de código existente para preservar ou quebrar, e as seções
"Preservadas" e "Modificadas" ficam vazias.

O que existe de código anterior foi escrito pelo próprio ciclo forward, nas features 001 a 008.
Como nos rastros anteriores, a tabela distingue arquivo criado (`componente-novo`) de arquivo
anterior que ganhou comportamento (`regra-nova`), arquivo anterior cujo comportamento mudou
(`regra-alterada`) e contrato da ponte (`delta-de-contrato-externo`). Vinte e nove arquivos foram
criados, sete deles fixturas de um mesmo diretório e doze suítes, e vinte e seis foram modificados;
a lista completa, ação por ação, está em `progress.jsonl`.

**Execução.** Quarenta e seis ações concluídas, T045 em segunda passagem. O pacote da tela mede
206.403 B, abaixo do teto de 409.600 B, mas 1.603 B acima da METADE do teto que a guarda de
`tests/webview-build.spec.ts` exigia desde a feature 008. Os dois cartões custaram cerca de 12,1 KiB
depois da compactação; o espaço sob a metade era de 10,8 KiB. A ação pedia "confirmar que os dois
cartões cabem no orçamento em vez de afrouxá-lo", e afrouxar era decisão do usuário: ele decidiu, em
2026-09-11, afrouxar a guarda para 60 % do teto, com a medida escrita ao lado, em vez de subir o teto
ou cortar o bloco do escopo. A guarda vermelha da primeira passagem está registrada em `progress.jsonl`.

**Política de edição do legado no momento da execução.** `.reversa/reversa-config.json` declarava
`"allowLegacyEdits": true` com `"allowedPaths": []`. Liberação irrestrita: todo caminho do projeto
estava gravável, e nenhuma escrita foi recusada por política. O arquivo de configuração não foi
criado nem alterado por esta execução.

## Arquivos afetados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/probe/greenfield.ts` | leitura-do-processo | componente-novo | HIGH | A sonda do eixo, gêmea de `probe/features.ts`: UMA listagem da pasta de saída decide a presença dos seis nomes, uma de `sdd/` lista as specs, e só DOIS corpos são lidos, o brief e o PRD (D-11, RF-22). Corpo acima do teto vem nulo e declarado em `truncados`, nunca lido pela metade. Pasta que escapa da raiz é recusada como ausente. |
| `src/domain/greenfield.ts` | leitura-do-processo | componente-novo | CRITICAL | O que o disco SIGNIFICA: estágio pelo maior contíguo presente, com buraco declarado e sem avanço (D-02); cenário pela regra da âncora (D-05); metadado lido com tolerância, ausente sem anomalia e malformado com ela (D-03); divergência declarada com os dois valores e o disco mandando (RN-02); resumo em três passos (D-12); cruzamento das specs com o histórico por nome exato normalizado, projeção de situação em tabela de quatro linhas, pasta mais avançada representando o componente (D-07, D-08); contagem sobre as specs lidas e nunca sobre as pastas fora do plano (RN-07). |
| `src/domain/prd-scope.ts` | leitura-do-processo | componente-novo | HIGH | Leitor de UMA seção do PRD, apartado do julgamento para ser dirigido por fixtures: primeira seção de nível dois cujo título normalizado contém "escopo" e não "nao objetivos", "fora do" nem "out"; item de topo por traço ou asterisco na coluna zero; selo retirado das duas pontas; negrito retirado; nome antes do primeiro dois-pontos ou primeira frase; quebra dura desfeita; subitem recuado ignorado; teto de cinquenta itens declarado (RN-14, RF-23). Medido contra o PRD real deste projeto: onze itens em três grupos. |
| `src/domain/limits.ts` | leitura-do-processo | regra-nova | LOW | Sete nomes de arquivo e pasta do pipeline e dois tetos, `SPEC_CAP` e `SCOPE_ITEM_CAP`, escritos num lugar só e fora do host. |
| `src/domain/types.ts` | leitura-do-processo | regra-nova | MEDIUM | Os vocabulários fechados do eixo (seis estágios, quatro cenários, quatro situações de componente), o metadado, o componente planejado com TODAS as pastas casadas, a feature fora do plano, o item de escopo com detalhe e selo, o panorama com `escopoEncontrado`, os seis códigos de anomalia e o eixo vazio. |
| `src/host/reading.ts` | leitura-do-processo | regra-nova | MEDIUM | A sonda entra por parâmetro como as demais e corre DENTRO do mesmo `try`, DEPOIS do histórico, porque o julgamento cruza as entradas já julgadas: uma caminhada que lance vira o estado de erro nomeado. A pasta de saída vem do processo e o `state.json` cru do retrato; nenhum caminho do Reversa é escrito no host, e a suíte de fronteiras ganhou dois guardas para isso. |
| `src/host/protocol.ts` | ponte-e-host | delta-de-contrato-externo | HIGH | `SetProcessData` ganhou `greenfield`, por acréscimo e ao fim (RF-08). O campo AUSENTE significa host anterior ao campo, e a tela o distingue por `=== undefined`, nunca por cenário: um painel que lesse a ausência como "projeto legado" afirmaria o que ninguém leu. Os corpos do brief, do PRD e das specs nunca atravessam o canal. |
| `src/host/session.ts` | ponte-e-host | regra-nova | LOW | O eixo entra na carga ao lado dos demais, sem tocar no que já viajava. |
| `src/webview/domain/types.ts` | painel-do-processo | regra-alterada | MEDIUM | A lista única de seções passou de nove para onze nomes, `panorama` depois da decomposição e `origem` depois da descoberta; a origem entra no recolhimento padrão e o panorama nasce aberto (RF-13, RF-14). Quem conta seções conta a partir daqui. |
| `src/webview/domain/panorama-view.ts` | painel-do-processo | componente-novo | HIGH | Ordem, agrupamento e contagem conferida numa passagem só (D-15): grupos em andamento, planejada, entregue, convergida; a ativa à frente; nome dentro; e a divergência entre a contagem da leitura e a lista DECLARADA em vez de resolvida. |
| `src/webview/domain/origin-view.ts` | painel-do-processo | componente-novo | HIGH | As quatro etapas com estado (concluída pelo artefato, corrente a primeira ausente após as presentes quando a pipeline começou, pendente o resto), o próximo agente por estágio (`redigido` → `spec-sdd`, RF-16), o último artefato presente e a regra de "pipeline começou", partilhada pela faixa, pelos cartões e pelo resumo. |
| `src/webview/domain/blocking.ts` | painel-do-processo | regra-alterada | HIGH | Terceiro argumento opcional, o eixo (D-17, RN-11). Razão só quando a pipeline começou, o cenário não tem âncora de legado e o estágio está antes de `especificado`; texto com o estágio e o agente, comando `/reversa-<agente>`, artefato o último presente. Entra DEPOIS de todas as razões anteriores, que não mudam. |
| `src/webview/domain/labels.ts` | painel-do-processo | regra-nova | LOW | Seis tabelas novas pela mesma função total: estágio, cenário, modo, situação do componente, estado da etapa e nome da etapa. "em andamento" e não "em aberto", de propósito, para que situação de componente não se leia como situação de pasta. |
| `src/webview/domain/integrity.ts` | painel-do-processo | regra-alterada | MEDIUM | As anomalias do eixo entram na integridade da leitura, contadas e não fundidas; host sem o campo contribui com nada (RF-19). |
| `src/webview/domain/summary.ts` | painel-do-processo | regra-nova | MEDIUM | Bloco "Panorama do produto" DEPOIS das entregas anteriores, pela mesma função pura que ordena o cartão: origem e estágio, contagem, componentes, fora do plano, itens do escopo; eixo ausente e projeto sem `/reversa-new` viram frase, nunca rótulo pendurado (RF-18). |
| `src/webview/ui/PanoramaSection.tsx` | painel-do-processo | componente-novo | HIGH | O cartão, que não decide nada: contagem com barra, grupos com o rótulo por extenso, linha por componente com spec e adendo clicáveis e pasta só escrita, fora do plano à parte, escopo do PRD recolhido dentro do cartão com estado do painel (D-16), e os TRÊS vazios de RN-08 como três frases (RF-11, RF-15). Compactado depois da medição do pacote: lista do escopo plana com o rótulo do grupo na primeira linha de cada grupo. |
| `src/webview/ui/OriginSection.tsx` | painel-do-processo | componente-novo | HIGH | O cartão da origem: cenário, modo com marca de não reconhecido, resumo com o brief clicável, instantes em horário de Brasília com o cru no atributo, agentes concluídos crus, as quatro etapas SEMPRE com estado em palavra e artefato clicável, e o lugar reservado e vazio do brainstorm depois delas (RF-10, RF-24, RN-13). O estágio vai no título, porque o cartão nasce recolhido. |
| `src/webview/ui/OpenFile.tsx` | painel-do-processo | componente-novo | LOW | O botão que pede a abertura de arquivo, escrito uma vez para os dois cartões; nasceu na compactação do pacote. `HistorySection` e `BugsSection` seguem com o botão próprio, intocados. |
| `src/webview/ui/App.tsx` | painel-do-processo | regra-nova | MEDIUM | Desestrutura os onze nomes, monta os dois cartões em fronteira de erro própria, guarda a revelação do escopo como estado do painel, passa o eixo à faixa, à descoberta e à lista de anomalias. |
| `src/webview/ui/DiscoverySection.tsx` | painel-do-processo | regra-nova | LOW | Propriedade opcional `greenfield` e a frase de RN-12 quando o cenário é greenfield e nenhuma fase terminou; sem o eixo, o cartão é o de antes caractere por caractere (RF-17). |
| `src/webview/theme/theme.css` | painel-do-processo | regra-nova | LOW | Os grupos do panorama repetem a forma de `.bug-group` numa regra só, com seletor duplo; um rótulo de grupo do escopo. Nenhum token novo, para que o podador nada mude. |
| `scripts/estragar-greenfield.js` | empacotamento-e-verificacao | componente-novo | MEDIUM | Seis estados que este projeto, saudável, não produz: `sem-ancora`, `parcial`, `divergente`, `sdd-vazio`, `sem-escopo`, `teto`; copia o workspace, adoece a cópia, e é o único que escreve no `state.json` da CÓPIA (RF-21). |
| `package.json` | empacotamento-e-verificacao | regra-nova | LOW | `estragar:greenfield` entra na lista; dezenove scripts. Fora do plano, pelo precedente de `estragar:registro`. |
| `README.md` | empacotamento-e-verificacao | regra-nova | LOW | Seis linhas novas na tabela do portão visual, uma por estado doente do eixo. |
| `tests/helpers/reversa-fixtures.ts` | leitura-do-processo | regra-nova | LOW | Fixturas do eixo: componente, fora do plano, item de escopo, panorama deste projeto, eixo completo e os quatro eixos doentes (legado, sem âncora, parcial, sem decomposição). A carga de fixture passa a trazer o eixo. |
| `tests/fixtures/prd/` | leitura-do-processo | componente-novo | MEDIUM | O PRD real deste projeto transcrito e seis fixturas sintéticas, uma por desvio da mecânica do leitor de escopo. |
| Suítes novas: `tests/probe-greenfield.spec.ts`, `tests/domain-greenfield.spec.ts`, `tests/domain-greenfield-panorama.spec.ts`, `tests/domain-prd-scope.spec.ts`, `tests/webview-panorama-view.spec.ts`, `tests/webview-labels-greenfield.spec.ts`, `tests/webview-blocking-greenfield.spec.ts`, `tests/webview-panorama-section.spec.tsx`, `tests/webview-origin-section.spec.tsx`, `tests/webview-integrity.spec.ts`, `tests/webview-discovery-section.spec.tsx`, `tests/preview-greenfield.spec.ts` | (todos) | componente-novo | LOW | Doze suítes, 164 casos. |
| `tests/webview-build.spec.ts` | empacotamento-e-verificacao | regra-alterada | MEDIUM | A guarda de folga passou de metade para 60 % do teto, por decisão do usuário, com a medida (206.403 B) e a razão escritas no próprio caso. |
| Suítes estendidas: `tests/readonly-local.spec.ts`, `tests/host-boundaries.spec.ts`, `tests/webview-sections.spec.ts`, `tests/host-protocol.spec.ts`, `tests/webview-preferences.spec.ts`, `tests/webview-summary.spec.ts`, `tests/host-reading.spec.ts`, `tests/host-manifest.spec.ts`, `tests/desempenho-referencia.spec.ts` | (todos) | regra-nova | LOW | Fronteiras dos módulos novos e dois guardas do host, onze seções, décimo campo da carga, eixo nos dublês da leitura, décimo nono script, referência de desempenho com o eixo no teto: cinquenta specs e cinquenta itens de escopo, leitura e pintura dentro dos tetos de 200 e 100 ms. |

## Diff conceitual por componente

### leitura-do-processo

O componente ganhou um terceiro território de leitura, e o ganhou pela mesma divisão que já
praticava duas vezes: uma sonda que olha e um julgamento que decide, com o sistema de arquivos
confinado ao único arquivo herdado que o importa. O que este território tem de próprio é a regra
de autoridade: o DISCO manda sobre o estágio, e o metadado que o pipeline escreve é lido, mostrado
e comparado, nunca obedecido. Onde os dois discordam, a discordância é declarada como anomalia com
os dois valores, e o painel não escolhe.

O leitor de escopo foi o que mais exigiu apuração. Foi escrito contra o PRD real deste projeto,
transcrito como fixture, e contra seis fixtures sintéticas, uma por desvio: selo nas duas pontas,
nome em negrito, item sem dois-pontos, asterisco como marcador, subitem recuado, lista acima do
teto. A regra de escolha da seção exclui por nome os "Não-objetivos (out)" e o "Fora do escopo",
porque os dois contêm a palavra e significam o contrário.

### ponte-e-host

O contrato cresceu por acréscimo, como cresce desde a feature 002: um décimo campo ao fim, nada
renomeado, nada reordenado, e o campo ausente significando leitura não realizada. O host continua
sem saber onde o Reversa guarda um arquivo: os nomes dos artefatos são literais de
`src/domain/limits.ts`, e a suíte de fronteiras do host ganhou dois guardas que recusam tanto os
nomes de arquivo do pipeline quanto os tokens de agente e de estágio.

### painel-do-processo

Dois cartões, cada um no lugar que a pergunta do Retomador pede: o panorama ao lado do que a
feature ativa é feita, a origem ao lado da outra narrativa de como o projeto nasceu. A decisão de
ordem, agrupamento e contagem conferida vive em função pura, e o cartão só a chama, o que é o
remédio de D-14 da feature 007 aplicado antes de o defeito nascer. Os três vazios de RN-08 são
três frases, e a distinção entre "não lido" e "não nasceu por /reversa-new" é a que impede o painel
de afirmar o que não leu.

O pacote da tela foi a promessa que exigiu decisão. Os dois cartões, a função pura, os rótulos, a
faixa e o resumo custaram cerca de 12,1 KiB depois de uma rodada de compactação (botão de abrir
arquivo compartilhado, lista de escopo plana, sumário enxuto, seletor duplo no tema), e o espaço
sob a metade do teto era de 10,8 KiB. A guarda passou de metade para 60 % por decisão do usuário; o
teto propriamente dito, de 400 KiB, está a 198 KiB de distância.

### empacotamento-e-verificacao

O auxiliar que adoece o eixo segue o molde do que adoece o registro, com uma diferença declarada:
ele escreve também no `state.json` da cópia, porque metade dos estados doentes é sobre o metadado.
A suíte que o acompanha prova, por caso, que a cópia produz o estado que o nome promete.

## Preservadas

Vazia. Não há regra 🟢 extraída de código existente neste projeto.

## Modificadas

Vazia. Não há regra 🟢 extraída de código existente neste projeto.
