# Investigação: estado terminal da extração e conclusão dos checkpoints

> Identificador: `011-estado-terminal-e-checkpoints`
> Data: `2026-09-20`
> Roadmap: `_reversa_forward/011-estado-terminal-e-checkpoints/roadmap.md`

## 1. A pergunta de fundo

O painel acusa como anomalia o desfecho mais comum de um projeto de extração, e afirma "em
andamento" sobre agentes que terminaram. A pergunta que precede qualquer código é qual das duas
partes está errada: o leitor, que exige o campo documentado, ou o agente, que gravou outro. A
resposta não é a mesma para os dois achados, e foi isso que a medição estabeleceu.

## 2. O que a documentação do Reversa diz

Duas fontes, ambas instaladas neste repositório e lidas na íntegra.

`.claude/skills/reversa/references/state-schema.md` declara `phase` como `string | null`, com
`null` significando "não iniciado", e lista cinco fases válidas na ordem em que o framework as roda.
Não há valor documentado para "terminado". A busca por `conclu` no `SKILL.md` e em todos os
`references/` do skill não retorna nada: nenhum passo manda gravar o valor que dezessete projetos
têm gravado.

`.claude/skills/reversa/references/checkpoint-guide.md` é mais específico, e é a fonte que decidiu o
achado B. Ele distingue dois registros com nitidez: ao concluir um agente gravam-se `completed_at` e
`files`; ao marcar tarefa parcial do Archaeologist gravam-se `modules_analyzed` e `modules_pending`,
sem `completed_at`. A herança implementa exatamente isso, e o `inProgress` derivado de uma chave só
não é estreiteza: é a assinatura documentada.

## 3. A medição

Sessenta e quatro projetos com `.reversa/state.json` em `~/dev`, lidos em 2026-09-20 sem escrever
em nenhum deles. O procedimento está em `onboarding.md`, seção 5, e é reexecutável.

| Medida | Valor |
|---|---|
| Projetos com nome de fase fora do canônico | 19 de 64 |
| Deles, terminais | 17, em cinco grafias: `concluido` (11), `concluida` (3), `concluido-c3`, `concluido-escopado`, `revisao_concluida` |
| Checkpoints com `completed_at` | 203 de 229, ou 88,6% |
| Checkpoints sem `completed_at` | 26, dos quais cerca de 22 declaram conclusão noutro nome e só 4 são parciais de verdade |
| Nomes alternativos de conclusão observados | `at`, `status`, `concluido_em`, `data`, `date`, `timestamp`, `done` |
| Nomes de campo de saída observados | ao menos treze, de `files` a `arquivos_criados`, `files_re3` e `canonical` |

A leitura que os números permitem é assimétrica, e é o achado central desta investigação. A fase
terminal é comportamento **sistemático**: atravessa as versões 1.2.x e 1.3.3, aparece em mais de um
quarto dos projetos e em cinco grafias, o que descarta erro de digitação. Já o checkpoint sem
`completed_at` é **desvio**: o campo documentado está em quase nove de cada dez registros, e o
`med-reversa` é a exceção, não a norma.

Daí as duas conclusões opostas. No primeiro caso o leitor precisa aprender, porque o framework
mudou de fato e a documentação não acompanhou. No segundo o leitor está certo, e o que falta é o
aviso que o RF-07 já cobra.

## 4. Alternativas avaliadas

### 4.1 Para o vocabulário do estado terminal

| Alternativa | Por que não |
|---|---|
| Igualdade exata com `concluido` | Cobre 11 dos 19 e deixa de fora `concluida`, que é a mesma coisa no feminino |
| Lista literal das cinco grafias | Nasceria desatualizada: as cinco apareceram sem coordenação, e a sexta virá igual |
| Modelar ciclos de re-extração lendo `cycle` e `cycle_2` | Resolve `afla` e `tcr-ana-luisa`, e é feature maior que esta; ficou como `Won't` na seção 8 do requirements |
| Abolir a anomalia de fase desconhecida | Perde a capacidade de acusar erro de digitação, que é o que o EC-02 existe para fazer |

A escolhida foi o reconhecimento por forma, com as cinco fases canônicas testadas antes. É o mesmo
raciocínio que o projeto já aplicou aos outros vocabulários: valor reconhecido e valor bruto lado a
lado, e nada normalizado no disco.

### 4.2 Para o checkpoint sem `completed_at`

| Alternativa | Por que não |
|---|---|
| Reconhecer `status` com `at` como conclusão | Era a inclinação inicial do requirements, e a medição a derrubou: resolveria um projeto em 64 ao custo de vocabulário que nenhuma documentação declara |
| Lista fechada dos sete nomes alternativos | Mesma fragilidade da lista de grafias, com sete entradas em vez de cinco e sem fonte normativa nenhuma |
| Manter o binário e só acrescentar a anomalia | Avisa, e continua afirmando o falso ao lado do aviso |

A escolhida foi o terceiro estado. Ele tem a virtude de não afirmar nada que não se saiba: nem que
terminou, porque o campo canônico não está lá, nem que corre, porque nada indica trabalho em curso.
E a fronteira entre o segundo e o terceiro estado não foi inventada aqui: é a assinatura do
`checkpoint-guide`.

### 4.3 Para onde a regra mora

O projeto tem dois caminhos com precedente, e ambos funcionam.

Adaptar a herança é o que as nove adaptações de regra de `src/heranca/PROCEDENCIA.md#5-adaptacoes`
fizeram, todas nascidas de defeito no uso, e a própria procedência declara o custo: reaplicá-las a
cada ressincronização, dívida que cobrou os bugs nº 8 e nº 9. Reclassificar na camada local é o que
as features 008 e 009 fizeram duas vezes, com uniões locais de anomalia que não tocaram na união
fechada do pacote vendorizado.

O que desempata não é o precedente, e sim a natureza da mudança. O NG-03 da spec da leitura diz que
decidir o que a tela mostra pertence ao componente do painel, e a supressão de uma anomalia
reconhecida é exatamente isso. A herança continua descrevendo o disco com fidelidade; o painel
decide o que disso merece a atenção de quem lê. Não há, portanto, adaptação a declarar.

Fica registrado o que a decisão não resolve: quem mais herda do `scrum-harness` continua vendo os
dois defeitos. Por isso a pendência de levar a regra à origem entra na `PROCEDENCIA.md`, em seção
própria, e o caminho do clone em `heranca.origens.yml` é corrigido de `/workspaces/iagoleal/dev/...`
para `~/HARNESS/scrum-harness`, que é onde ele está nesta máquina.

## 5. Padrões aplicáveis já presentes no repositório

| Padrão | Onde já existe | Como esta feature o usa |
|---|---|---|
| Eixo local puro, alimentado pelo que a sonda trouxe | `src/domain/greenfield.ts`, `history.ts`, `bugs.ts`, todos chamados em `src/host/reading.ts` | O eixo novo entra no mesmo `try`, lendo `snapshot.stateJson` e o processo já julgado |
| União local de anomalia, sem tocar na união fechada herdada | `BugAnomalyCode` e `GreenfieldAnomalyCode` em `src/domain/types.ts` | Terceira união local, com a mesma forma comum de exibição |
| Campo opcional ao fim da carga, por acréscimo | `SetProcessData`, desde a feature 004 | O eixo viaja num campo opcional, e a webview anterior o ignora |
| Frase explicativa acima das cinco fases | `discovery-greenfield`, feature 009, em `DiscoverySection.tsx:62` | Molde literal da frase de encerramento |
| Contagem de um fato num lugar só | `readingIntegrity`, que documenta por que não se conta duas vezes | A composição da lista de anomalias sai de `App.tsx` e vira função única |
| Valor reconhecido ao lado do valor bruto | `BugEntry`, feature 008 | A situação da extração carrega o `phase` cru |

## 6. Fontes

Todas locais. A feature não consultou fonte externa, e não há dependência nova.

- `.claude/skills/reversa/references/state-schema.md` e `checkpoint-guide.md`
- `_reversa_bugs/painel-do-processo/intake/leitura-med-reversa-2026-09-20.md`
- `_reversa_bugs/painel-do-processo/relatos/relato-20260914-1140.md`, seção "Problema 3, que não é bug"
- `_reversa_sdd/sdd/leitura-do-processo.md` e `painel-do-processo.md`
- `_reversa_sdd/addenda/008-cronologia-do-ciclo-bugs.md` e `009-greenfield-e-features-do-prd.md`
- `src/heranca/PROCEDENCIA.md`, seções 3 e 5
- `src/heranca/reversa-domain/src/state.ts`, `src/host/reading.ts`, `src/webview/domain/integrity.ts`,
  `src/webview/ui/App.tsx` e `src/webview/ui/DiscoverySection.tsx`
