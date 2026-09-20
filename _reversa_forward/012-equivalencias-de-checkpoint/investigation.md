# Investigação: equivalências de checkpoint

> Identificador: `012-equivalencias-de-checkpoint`
> Data: `2026-09-20`

## 1. O que foi medido, e como

A medição correu sobre os sessenta e quatro projetos com `.reversa/state.json` em `~/dev`, em
2026-09-20, lendo cada arquivo e contando os checkpoints por presença do campo canônico. Ela
confirma e detalha a medição que abriu a feature 011.

| Fato | Número |
|---|---|
| Projetos com `state.json` | 64 |
| Checkpoints totais | 233 |
| Com `completed_at` | 203 |
| Projetos com ao menos um checkpoint sem o campo | 9 |
| Desses, com trabalho parcial legítimo (`modules_pending` não vazio) | 2 |
| Vocabulários distintos para declarar conclusão | 7 |

Os sete vocabulários, com o projeto onde cada um aparece:

| Vocabulário | Projeto |
|---|---|
| `status: "concluido"` | `med-reversa`, `afla` |
| `concluido_em` | `afla` |
| `done: true` | `capacities` |
| `status: "completed"` | `comentarios-concursos` |
| `status: "completo"` com `updated_at` | `medicina-leal-app` |
| `status: "success"` com `date` | `scrapping` |
| `timestamp` | `ps-iagerasmlk` |

O `med-reversa` é o caso extremo, e é o único com zero de sete. Ele é também o único dos sessenta e
quatro com `autonomous_mode: true`, o que sugere, sem provar, que a sessão sem conferência humana
concentra escritas e propaga a deriva sem correção. Amostra de um não sustenta conclusão, e fica
como observação, não como achado.

## 2. Onde a deriva nasce

A causa está na fonte, e é verificável dentro de qualquer projeto com o Reversa instalado. O
`checkpoint-guide.md` é normativo e manda gravar `completed_at` com `files`. O nome do campo aparece
em dois arquivos de referência, `checkpoint-guide.md` e `state-schema.md`, e em **nenhum** dos mais
de vinte `SKILL.md` que mandam salvar checkpoint. O orquestrador diz "salve checkpoint seguindo
`references/checkpoint-guide.md`", delegando o formato a um arquivo que a sessão pode não abrir, e
mais adiante pede que se confirme que o checkpoint está salvo, sem dizer com que nome.

Isso importa para esta feature por uma razão de desenho: o conjunto de nomes alternativos é **aberto**
por construção, e não fechado. Cada sessão pode inventar o seu. Uma lista de sinônimos escrita à mão
resolveria os sete de hoje e envelheceria no oitavo, que é exatamente a objeção que a feature 011
levantou para recusar a lista.

## 3. Alternativas avaliadas

| Alternativa | Por que foi descartada |
|---|---|
| **Lista fechada de sinônimos**, escrita à mão no código | Resolve o presente e envelhece na próxima grafia. É a objeção original da 011, e permanece válida. A diferença do mapa aprovado é que ele **cresce por processo**, em vez de crescer por alguém lembrar de editar um arquivo |
| **Corrigir na fonte**, com um agente do Reversa reescrevendo os `state.json` | Continua sendo a correção certa do problema certo, e não exclui esta feature. Foi descartada **aqui** porque pertence a outro repositório e a outro ciclo: o Reversa é o único escritor legítimo daquele arquivo, e esta extensão não escreve. Fica registrada como recomendação, não como escopo |
| **Modelo consultado durante a leitura** | Fura três requisitos de uma vez: os 200 ms do RNF-01, a ausência de rede declarada na tabela de integrações, e a verificabilidade por inspeção do RNF-04. Mede-se em segundos o que tem orçamento em milissegundos, e torna a leitura não determinística, o que destruiria o valor da suíte |
| **Aceitar `status` como conclusão, sem mapa** | Foi a inclinação inicial da 011 e foi descartada pela medição: `status` carrega `"concluido"`, `"completed"`, `"completo"`, `"success"` e carregaria `"failed"`. Reconhecer por campo declararia concluído um agente que abortou |
| **Mapa por máquina, fora do repositório** | Recusado na sessão de esclarecimentos. Perderia a auditoria por git e faria o comportamento do painel depender do estado da máquina |
| **Aprovação item a item no terminal, durante o aprendizado** | Recusado na sessão de esclarecimentos. Mistura propor e dispor num gesto só, e obriga a decidir no ritmo do modelo, que leva segundos por item |

## 4. Prova de viabilidade do motor local

Executada nesta máquina em 2026-09-20, contra o motor local já instalado, com temperatura zero,
semente fixa e resposta em JSON.

| Rodada | Vocabulário | Resultado | Tempo |
|---|---|---|---|
| 1 | binário: declara conclusão, sim ou não | 12 de 13 | 75,3 s |
| 2 | quatro valores: `concluido`, `falhou`, `em-andamento`, `nao-e-sinal` | 13 de 13 | 43,4 s |

Os treze casos são os dez reais extraídos dos projetos medidos e três negativos construídos: um
checkpoint em andamento com `modules_pending` povoado, um com `status: "failed"` e um que só tem
campos de conteúdo.

O erro único da primeira rodada é o achado que mais moldou o desenho: o motor marcou
`status: "failed"` como declarando conclusão e escreveu, na própria justificativa, "status indica
falha". Ele localizou o campo certo e errou o veredito, porque o vocabulário que recebeu não tinha
onde pôr "terminou mal". Daí as duas exigências que entraram no requirements: quatro valores em vez
de dois, e mapa por par campo mais valor em vez de por campo.

Vale registrar o que a prova **não** prova. Ela mede o motor sobre treze casos conhecidos, num
único modelo, numa única máquina. Não estabelece taxa de acerto sobre a cauda, que é justamente o
que ninguém viu ainda. O desenho não depende disso: a aprovação humana existe precisamente porque a
classificação é sugestão.

## 5. Padrões aplicáveis

**Compilar o conhecimento em vez de consultá-lo ao vivo.** O modelo roda uma vez por par inédito, e
o produto é dado. É o mesmo movimento que o repositório já faz com o carimbo da construção e com a
revisão da herança: o que se sabe em tempo de construção não se pergunta em tempo de execução.

**Propor e dispor separados.** O padrão é velho e o repositório já o pratica em outro lugar: os
auxiliares `estragar:*` fabricam estado doente sobre cópia, e nunca sobre o original. Aqui, o
aprendizado escreve proposta e nunca mapa.

**Reconhecer sem sanear.** Herdado do NG-05 e exercido pela 011: o valor bruto viaja ao lado do
reconhecido até a tela. A novidade da 012 é que agora o painel diz também **por que** reconheceu, o
que é uma forma de procedência, e não de justificativa.

**Falha segura no padrão.** Mapa ausente, vazio ou com par desconhecido produz o comportamento
anterior, nunca um palpite. O mesmo princípio que faz `allowLegacyEdits` ausente valer como falso.

## 6. Fontes

- `_reversa_forward/011-estado-terminal-e-checkpoints/requirements.md`, seção de decisões, onde a
  recusa de `status` está registrada com a medição que a sustenta
- `_reversa_sdd/addenda/011-estado-terminal-e-checkpoints.md`, adendo vigente
- `.claude/skills/reversa/references/checkpoint-guide.md` e `state-schema.md`, do Reversa instalado
- `src/domain/discovery-state.ts`, `src/domain/types.ts`, `src/host/reading.ts`,
  `src/webview/ui/DiscoverySection.tsx`
- `scripts/gerar-revisao-heranca.js` e `scripts/gerar-carimbo-da-construcao.js`, os dois precedentes
  de módulo gerado, um versionado e outro não
- `.vscodeignore` e `scripts/conteudo-esperado.js`, que decidem o formato do mapa
- Medição dos sessenta e quatro projetos e prova de viabilidade, ambas executadas em 2026-09-20 e
  reproduzíveis pelos passos do `onboarding.md`

Nenhuma fonte externa foi consultada. A feature não depende de biblioteca nova, de especificação de
terceiro nem de serviço remoto.
