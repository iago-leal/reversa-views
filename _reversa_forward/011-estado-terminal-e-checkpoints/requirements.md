# Requirements: estado terminal da extração e conclusão dos checkpoints

> Identificador: `011-estado-terminal-e-checkpoints`
> Data: `2026-09-20`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA
> Cenário: `greenfield` (âncora `prd.md` + specs em `sdd/`, sem `architecture.md` nem `domain.md`)
> Insumo: `_reversa_bugs/painel-do-processo/intake/leitura-med-reversa-2026-09-20.md`

## 1. Resumo executivo

A feature ensina o painel a distinguir duas coisas que hoje ele confunde: o fim da extração, que o
fluxo do Reversa produz sistematicamente e o leitor acusa como anomalia, e a conclusão do
checkpoint, que o leitor reconhece num campo só e por isso desenha como "em andamento", calado, o
que terminou há dias. Quem paga é o Retomador, porque os dois erros incidem exatamente no painel que
ele abre depois da pausa longa, e porque o segundo erra em silêncio, sem o aviso que o RF-07 da
leitura manda dar. A correção não idealiza o framework nem o sanea: reconhece o que ele de fato
escreve, mostra o valor bruto ao lado do reconhecido e declara o que não sabe ler. Nada aqui muda o
que a extensão escreve no disco alheio, que continua sendo nada.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_bugs/painel-do-processo/intake/leitura-med-reversa-2026-09-20.md` | Leitura real do `med-reversa` pela construção 0.10.1: uma anomalia `fase-desconhecida` com o valor `concluido`, e sete de sete checkpoints desenhados como em andamento numa extração encerrada oito dias antes. Seis deles declaram `status: "concluido"`, todos trazem `at`, nenhum traz `completed_at` | 🟢 |
| `_reversa_bugs/painel-do-processo/relatos/relato-20260914-1140.md#problema-3-que-nao-e-bug` | Precedente do `afla`, em 14/09: dez anomalias `fase-desconhecida` com nomes de segundo ciclo. Ficou decidido que o comportamento atual é o especificado e que a mudança entraria como feature forward, não como bug | 🟢 |
| `.claude/skills/reversa/references/state-schema.md#fases-validas` | O esquema do próprio Reversa declara cinco fases válidas e `phase: string \| null`, com `null` para "não iniciado". Não há valor documentado para "terminado", e nenhum skill manda gravar um | 🟢 |
| `.claude/skills/reversa/references/checkpoint-guide.md#o-que-salvar-a-cada-fase` | O guia é normativo e distingue os dois registros: ao concluir um agente gravam-se `completed_at` e `files`; ao marcar tarefa parcial do Archaeologist gravam-se `modules_analyzed` e `modules_pending`, sem `completed_at`. É a assinatura documentada do trabalho em curso | 🟢 |
| Medição de 64 projetos com `.reversa/state.json` em `~/dev`, feita em 2026-09-20 | Dezenove projetos declaram fase fora do canônico, dezessete deles terminal, em cinco grafias. Dos 229 checkpoints, 203 trazem `completed_at`; dos 26 restantes, cerca de 22 declaram conclusão noutro nome e só quatro são parciais de verdade. Os campos de saída aparecem sob ao menos treze nomes distintos | 🟢 |
| `_reversa_sdd/sdd/leitura-do-processo.md#11-edge-cases-e-tratamento-de-erros` | EC-02 manda que fase fora do conjunto canônico vire anomalia, prevendo o caso do agente que "gravou nome novo". É a regra que o achado A contraria e que por isso pede adendo | 🟢 |
| `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais` | RF-07 exige registrar toda degradação nomeando arquivo, código e detalhe; RF-10 manda preservar campo desconhecido em vez de descartá-lo, que é o que hoje salva `status`, `at` e as saídas em `extra` | 🟢 |
| `_reversa_sdd/sdd/leitura-do-processo.md#4-non-goals-fora-do-escopo` | NG-05 proíbe corrigir, normalizar ou sanear os arquivos do Reversa: valor fora do conjunto canônico é preservado e sinalizado, nunca reescrito. G-03 proíbe idealizar o framework | 🟢 |
| `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | RF-04 desenha as cinco fases sempre, com status distinto; RF-05 lista os checkpoints distinguindo o que corre do que concluiu, e é o requisito cujo critério de aceite hoje se cumpre pela letra e falha no efeito | 🟢 |
| `_reversa_sdd/addenda/009-greenfield-e-features-do-prd.md#impacto-por-artefato-da-extracao` | Precedente de forma e de regra: as cinco fases contando história falsa num projeto greenfield foram corrigidas por uma frase acima delas na seção Descoberta, e não por fase extra; e o campo autodeclarado passou a ser lido e comparado, com o disco mandando | 🟢 |
| `_reversa_sdd/addenda/008-cronologia-do-ciclo-bugs.md#impacto-por-artefato-da-extracao` | Precedente arquitetônico: a forma estrutural comum de anomalia substituiu o tipo herdado "sem tocar na união fechada do pacote vendorizado", padrão repetido em `BugAnomalyCode` e `GreenfieldAnomalyCode` | 🟢 |
| `src/heranca/PROCEDENCIA.md#5-adaptacoes` | Dezesseis adaptações declaradas, nove tocando regra de leitura e nascidas de defeito no uso; o caminho para aposentá-las é levar a mudança à origem e ressincronizar | 🟢 |
| `src/heranca/reversa-domain/src/state.ts` | `derivePhases` compara `phase` com as cinco de `PHASES` e registra `fase-desconhecida` fora delas; `readCheckpoints` deriva `inProgress` de `completed_at` apenas, e manda todo o resto para `extra` | 🟢 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| O Retomador | Recuperar o estado do projeto sem repagar o custo de reconstrução do contexto | Abre, depois de semanas, um projeto de extração terminada e precisa ler "acabou" onde hoje lê uma anomalia e sete agentes supostamente em curso |
| O Operador | Confirmar, sem quebrar o ritmo, que o agente que acabou de rodar concluiu | Roda o último agente da descoberta, atualiza o painel e precisa que o checkpoint recém-escrito apareça como concluído, ou, se o agente gravou fora do esquema, que o painel diga isso em vez de afirmar o falso |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** O fim da extração é estado, não defeito. Valor de `phase` cuja forma declara
   encerramento é reconhecido como estado terminal, desenhado como tal e não gera anomalia. O
   reconhecimento é por família, e não por lista literal, porque as grafias observadas já são cinco
   (`concluido`, `concluida`, `concluido-c3`, `concluido-escopado`, `revisao_concluida`) e a sexta
   aparecerá sem aviso. 🟢
   - Origem no legado: `_reversa_sdd/sdd/leitura-do-processo.md#11-edge-cases-e-tratamento-de-erros`, EC-02
   - Tipo: alterada
2. **RN-02:** Nome inventado por engano continua anomalia. O que separa RN-01 da regra vigente é
   forma reconhecível, e não tolerância: fora das cinco fases canônicas e fora da família de
   encerramento, o valor segue produzindo `fase-desconhecida` com o nome à vista. 🟢
   - Origem no legado: `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais`, RF-07
   - Tipo: nova
3. **RN-03:** O checkpoint passa a ter três estados, e não dois. Com `completed_at`, está concluído,
   como hoje. Sem `completed_at` e com `modules_pending` não vazio, está em andamento, que é a
   assinatura documentada do trabalho parcial. Sem `completed_at` e sem `modules_pending`, está em
   **conclusão não declarada**: o painel não afirma que terminou, porque o campo canônico não está
   lá, nem que corre, porque nada indica trabalho em curso. 🟢
   - Origem no legado: `.claude/skills/reversa/references/checkpoint-guide.md#o-que-salvar-a-cada-fase`
   - Tipo: alterada
4. **RN-04:** O terceiro estado não passa em silêncio: registra anomalia que nomeia o agente e o
   campo ausente. É o que o RF-07 já cobra, e é o que separa este achado do anterior, porque aqui a
   spec vigente basta e só o adendo do estado terminal é novo. 🟢
   - Origem no legado: `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais`, RF-07
   - Tipo: nova
5. **RN-05:** Reconhecer não é sanear, e sinalizar não é adivinhar. Nenhum valor lido é reescrito,
   normalizado ou descartado; o bruto fica ao lado do reconhecido; e campo de saída sob nome não
   canônico é declarado como existente sem que o painel afirme o que contém. 🟢
   - Origem no legado: `_reversa_sdd/sdd/leitura-do-processo.md#4-non-goals-fora-do-escopo`, NG-05 e G-03
   - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | O sistema deve reconhecer como estado terminal o valor de `phase` cuja forma declara encerramento, sem emitir anomalia de fase para ele | Must | As cinco grafias observadas em `~/dev` são reconhecidas, e nenhuma delas produz anomalia | 🟢 |
| RF-02 | O sistema deve distinguir, no processo tipado, a extração não iniciada, a em curso e a encerrada, carregando o valor bruto ao lado do reconhecido | Must | Os três estados produzem valores distintos e nomeados, legíveis pelo painel sem inspecionar `phase` | 🟢 |
| RF-03 | O sistema deve continuar registrando `fase-desconhecida` para valor que não seja canônico nem de encerramento, nomeando o valor encontrado | Must | Um `phase` com erro de digitação sobre um nome canônico produz a anomalia com o nome à vista | 🟢 |
| RF-04 | O painel deve declarar o encerramento por uma frase na seção Descoberta, acima das cinco fases, com o nome bruto ao lado, no molde da frase de projeto greenfield da feature 009 | Must | A frase aparece só quando a extração está encerrada, as cinco fases seguem desenhadas na ordem do framework, e nenhuma sexta fase é inventada | 🟢 |
| RF-05 | O sistema deve derivar o estado do checkpoint em três valores, na precedência: `completed_at` presente, `modules_pending` não vazio, e conclusão não declarada | Must | Os sete checkpoints do `med-reversa` saem em conclusão não declarada; um checkpoint com `modules_pending` sai em andamento; um com `completed_at` sai concluído | 🟢 |
| RF-06 | O painel deve mostrar instante ao lado do checkpoint apenas quando ele vier do campo canônico, e passar pela conversão de fuso já vigente | Must | Nenhum instante universal cru aparece na tela, e o checkpoint em conclusão não declarada não exibe instante como se fosse de conclusão | 🟢 |
| RF-07 | O sistema deve registrar anomalia para o checkpoint em conclusão não declarada, nomeando o agente e o campo que falta | Must | Um checkpoint sem `completed_at` e sem `modules_pending` produz uma anomalia que o nomeia | 🟢 |
| RF-08 | O sistema deve preservar, em `extra`, todo campo do checkpoint que não participe da decisão de estado | Must | As saídas de nome variável sobrevivem à leitura e continuam disponíveis ao consumidor | 🟢 |
| RF-09 | A leitura de projeto cujo `phase` é nulo ou canônico, e cujos checkpoints trazem `completed_at`, deve permanecer idêntica à atual | Must | O panorama deste repositório não muda, e as suítes herdadas passam sem reescrita | 🟢 |
| RF-10 | A verificação deve incluir fixtura derivada do estado real do `med-reversa`, e não apenas caso sintético | Should | Existe fixtura com os sete checkpoints e o `phase` terminal observados em 20/09, e uma suíte que os lê | 🟢 |
| RF-11 | O painel deve declarar que o checkpoint traz saídas sob nome não canônico, nomeando o campo, sem afirmar o que ele contém nem promovê-lo a lista de arquivos | Should | Um checkpoint com saídas em campo de nome não canônico mostra que elas existem, e a lista de arquivos continua vindo só do campo canônico | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Desempenho | A leitura completa permanece abaixo de 200 ms num workspace típico | RNF-01 de `_reversa_sdd/sdd/leitura-do-processo.md#7-requisitos-nao-funcionais`; a mudança é de classificação, sem leitura adicional de disco | 🟢 |
| Manutenibilidade | A regra mora na camada local, reclassificando o que a herança devolve, sem tocar em `src/heranca/` | Precedente de `BugAnomalyCode` e `GreenfieldAnomalyCode` em `src/domain/types.ts`; as nove adaptações de regra já declaradas são a dívida que o projeto quer aposentar, não ampliar | 🟢 |
| Manutenibilidade | A pendência de levar a mudança à origem fica registrada, e o caminho do clone em `heranca.origens.yml` é corrigido para `~/HARNESS/scrum-harness`, onde ele de fato está | `src/heranca/PROCEDENCIA.md#5-adaptacoes`, que define levar à origem como caminho de aposentadoria; o arquivo é local e ignorado pelo git | 🟢 |
| Compatibilidade | As vinte suítes herdadas continuam passando sem reescrita | RNF-05 de `_reversa_sdd/sdd/leitura-do-processo.md#7-requisitos-nao-funcionais`, que as declara contrato herdado | 🟢 |
| Observabilidade | Toda reclassificação é observável pela lista de anomalias ou pelo estado nomeado, sem que o painel afirme algo que não possa mostrar de onde veio | RF-07 e RF-08 de `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | 🟢 |
| Segurança | Nenhuma escrita no workspace lido durante a leitura | NG-01 e RNF-04 de `_reversa_sdd/sdd/leitura-do-processo.md` | 🟢 |
| Concorrência | Não aplicável por construção: a leitura é síncrona, local e sem rede, logo não há retentativa, tempo limite nem disputa a tratar | `_reversa_sdd/sdd/leitura-do-processo.md#10-integracoes-e-dependencias`, que declara ausência de rede e de serviço remoto | 🟢 |
| Acessibilidade | A frase de encerramento e a marca do terceiro estado do checkpoint são distinguíveis sem cor e alcançáveis por teclado | RNF-03 de `_reversa_sdd/sdd/painel-do-processo.md#7-requisitos-nao-funcionais` | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: extração terminada deixa de ser anomalia
  Dado um workspace cuja fase declara encerramento e cujas cinco fases estão concluídas
  Quando o painel lê o processo
  Então as cinco fases aparecem como concluídas
  E a seção Descoberta declara o encerramento, com o nome bruto ao lado
  E nenhuma anomalia de fase é registrada

Cenário: a família de encerramento cobre as grafias observadas
  Dado um workspace cuja fase declara encerramento em qualquer das grafias vistas em campo
  Quando o painel lê o processo
  Então todas são reconhecidas como encerramento
  E nenhuma delas produz anomalia

Cenário: nome estranho continua sendo nome estranho
  Dado um workspace cuja fase não é canônica nem declara encerramento
  Quando o painel lê o processo
  Então as cinco fases canônicas aparecem na ordem do framework
  E uma anomalia registra o nome encontrado

Cenário: checkpoint que declara conclusão fora do campo canônico
  Dado um checkpoint sem o campo canônico de conclusão e sem tarefa pendente
  Quando o painel lê o processo
  Então o checkpoint aparece em conclusão não declarada
  E não é afirmado que ele terminou, nem que ele corre
  E uma anomalia nomeia o agente e o campo que falta

Cenário: trabalho parcial continua sendo trabalho parcial
  Dado um checkpoint sem o campo canônico de conclusão e com tarefa pendente declarada
  Quando o painel lê o processo
  Então o checkpoint aparece como em andamento
  E nenhuma anomalia é registrada por isso

Cenário: saída sob nome não canônico é declarada, não interpretada
  Dado um checkpoint que declara suas saídas num campo de nome não canônico
  Quando o painel lê o processo
  Então o painel mostra que há saídas nesse campo, nomeando-o
  E a lista de arquivos do checkpoint continua vindo só do campo canônico
  E nenhum valor lido é reescrito nem descartado

Cenário: projeto no formato canônico não muda
  Dado um workspace cuja fase é canônica e cujos checkpoints trazem o campo canônico
  Quando o painel lê o processo
  Então o resultado é idêntico ao da construção anterior à feature

Cenário: o encerramento se distingue sem depender de cor
  Dado um workspace com a extração encerrada
  Quando o painel é desenhado em tema de alto contraste
  Então a frase de encerramento continua legível por texto, e não só por cor

Cenário: a regra é verificada contra o estado real observado
  Dado o estado do `med-reversa` lido em 20/09, com sete checkpoints e a fase terminal
  Quando a suíte o executa como fixtura
  Então a fase terminal é reconhecida sem anomalia
  E os sete checkpoints saem em conclusão não declarada, cada um com sua anomalia
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01, RF-02, RF-03 | Must | São o achado A inteiro, e sem os três o painel continua chamando de anomalia o desfecho que dezessete dos sessenta e quatro projetos já alcançaram |
| RF-04 | Must | Reconhecer sem desenhar deixaria a correção invisível para quem abre o painel, que é a única pessoa que ela serve |
| RF-05, RF-06, RF-07 | Must | São o achado B, e o RF-07 é o que o converte de correção cosmética em cumprimento de regra já vigente |
| RF-08, RF-09 | Must | Garantem que a feature não cobre o preço de regressão em leitura que hoje está correta |
| RF-10 | Should | A fixtura real é o que impede a regra de nascer ajustada ao caso imaginado em vez do observado, mas a entrega é verificável sem ela |
| RF-11 | Should | Torna visível o desvio de formato sem adivinhar treze nomes de campo, e o painel segue útil sem isso |
| RNF de manutenibilidade | Must | A dívida de adaptação na herança custou os bugs nº 8 e nº 9, e a decisão de mantê-la fora de `src/heranca/` é o que impede a décima |
| RNF de desempenho | Should | A mudança é de classificação sobre dados já lidos, e o risco de regressão de tempo é baixo |
| Modelar ciclos de re-extração | Won't | O `afla` e o `tcr-ana-luisa` pedem ler `cycle` e `cycle_2` e derivar fases por ciclo. É feature própria, maior que esta, e sem caso de uso além desses dois projetos |
| Conter o ruído de anomalia em `completed` e `pending` | Won't | O `DelphiSga` usa `pending` como lista de tarefas em prosa, e produziria dezesseis anomalias de parágrafo inteiro. É problema distinto, de volume e não de vocabulário, e cabe como bug próprio |
| Promover campo de saída a lista de arquivos | Won't | Os nomes observados já são treze, e a heurística por forma pegaria `perguntas`, `lacunas` e `units` junto, produzindo saída falsa |

## 9. Esclarecimentos

### Sessão 2026-09-20

Antes de responder, foram lidos o `state-schema.md` e o `checkpoint-guide.md` do próprio Reversa e
medidos os 64 projetos com `.reversa/state.json` em `~/dev`. A medição sustenta as cinco respostas:
19 projetos declaram fase fora do canônico, 17 deles terminal, em 5 grafias; dos 229 checkpoints,
203 trazem `completed_at`, e dos 26 restantes cerca de 22 declaram conclusão noutro nome, com apenas
4 genuinamente parciais; os campos de saída aparecem sob ao menos 13 nomes distintos.

- **Q:** Qual é o vocabulário do estado terminal, o literal observado, a família de encerramento, os
  ciclos modelados ou a abolição da anomalia?
  **R:** A família de encerramento, reconhecida por forma e não por lista literal, com o valor bruto
  ao lado do reconhecido. Cobre as cinco grafias observadas e as que virão, e preserva a capacidade
  de acusar erro de digitação, que a abolição perderia. Os ciclos de re-extração ficam de fora, como
  feature própria.
- **Q:** Como tratar o checkpoint sem `completed_at`, reconhecendo campos alternativos ou avisando?
  **R:** Três estados em vez de dois, com a conclusão não declarada como terceiro. A inclinação
  anterior, de aceitar `status` com `at` como conclusão, foi descartada pela medição: `completed_at`
  está em 88,6% dos checkpoints, o `med-reversa` é o desviante, e criar regra sobre campo que
  nenhuma documentação declara resolveria um projeto em 64 ao custo de vocabulário inventado.
- **Q:** As saídas de nome variável viram fonte de arquivos?
  **R:** Não. Ficam preservadas em `extra`, e o painel declara que existem, nomeando o campo, sem
  afirmar o que ele contém. Lista fechada nasceria desatualizada, e heurística por forma produziria
  saída falsa.
- **Q:** Onde a regra mora, na camada herdada ou na local?
  **R:** Na camada local, pelo precedente já repetido duas vezes neste repositório, com a pendência
  de levar a mudança à origem registrada e o caminho do clone corrigido no `heranca.origens.yml`.
  Fica anotado que a lacuna original afirmava, por erro de fato, que o clone não existia nesta
  máquina: ele está em `~/HARNESS/scrum-harness`, e só o caminho declarado estava errado.
- **Q:** Onde o encerramento aparece na tela?
  **R:** Numa frase na seção Descoberta, acima das cinco fases, com o nome bruto ao lado, no molde
  que a feature 009 já usa para o projeto greenfield. Sexta fase não se inventa, porque não existe.

## 10. Lacunas

Nenhuma lacuna aberta. As três registradas na versão inicial foram fechadas na sessão de 2026-09-20
e estão acima, na seção 9. O que ficou deliberadamente fora do escopo não é lacuna, e está na
seção 8, nas três linhas `Won't`.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-20 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-09-20 | Cinco respostas integradas por `/reversa-clarify`, com as três lacunas fechadas; RN-03 e RF-05 reescritos pela medição de 64 projetos, e o erro de fato sobre o clone da origem corrigido | reversa |
