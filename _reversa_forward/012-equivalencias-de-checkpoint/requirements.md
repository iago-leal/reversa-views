# Requirements: equivalências de checkpoint reconhecidas por aprovação

> Identificador: `012-equivalencias-de-checkpoint`
> Data: `2026-09-20`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

A feature dá ao painel um vocabulário que ele não inventou nem adivinhou: um mapa de equivalências
que o mantenedor aprovou, par a par, e que traduz o campo fora do esquema no estado que ele de fato
declara. Um agente local propõe a leitura de cada par novo, e nada chega à tela sem assinatura
humana. O painel continua determinístico, continua sem escrever em disco e continua sem falar com
serviço algum: o modelo roda no tempo do aprendizado, jamais no tempo da leitura.

Ela resolve o resíduo que a feature 011 deixou à vista, e que a leitura real do `med-reversa` mostra
em números: sete de sete checkpoints acusados de não declarar conclusão, num projeto cuja extração
terminou e cujos agentes gravaram `status: "concluido"` com o instante ao lado.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/addenda/011-estado-terminal-e-checkpoints.md#impacto-por-artefato-da-extração` | Adendo vigente desde 2026-09-20. Fixa o terceiro estado do checkpoint e a regra de que o instante vem **apenas** de `completed_at`. É a regra que esta feature emenda, e não revoga: a precedência do campo canônico permanece intocada | 🟢 |
| `_reversa_sdd/sdd/leitura-do-processo.md#4-non-goals-fora-do-escopo` | NG-05 proíbe corrigir, normalizar ou sanear os arquivos do Reversa; NG-01 e NG-04 proíbem escrever e observar o disco por conta própria; NG-03 reserva ao painel a decisão do que a tela mostra | 🟢 |
| `_reversa_sdd/sdd/leitura-do-processo.md#7-requisitos-não-funcionais` | RNF-01 fixa a leitura completa abaixo de 200 ms; RNF-04 exige que a camada não tenha **nenhuma** função capaz de escrever, criar, remover ou executar, verificável por inspeção | 🟢 |
| `_reversa_sdd/sdd/leitura-do-processo.md#10-integrações-e-dependências` | A tabela declara "Rede, serviço remoto ou API: Nenhuma" para a camada de leitura, que por isso não tem tempo-limite nem indisponibilidade externa a tratar | 🟢 |
| `_reversa_sdd/sdd/leitura-do-processo.md#12-segurança-e-privacidade` | "Nada é transmitido, armazenado fora da memória do processo, nem enviado a serviço algum." É a promessa que a ferramenta nova não pode diluir, por morar fora da camada que a fez | 🟢 |
| `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | O RF-05 desenha o checkpoint com `data-situacao` de três valores, e o instante só aparece quando vem do campo canônico; o RF-08 desenha a lista composta de anomalias | 🟢 |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md#6-requisitos-funcionais` | O repositório já abriga ferramentas de manutenção fora do build, com os quatro `estragar:*` e o preview, e o RF-04 mantém fonte, testes e scripts fora do pacote da extensão, o arquivo `.vsix` | 🟢 |
| `src/domain/discovery-state.ts` | O módulo puro da 011: `lerCheckpoint` decide por `completed_at` e depois por `modules_pending`, e `anomaliasDosCheckpoints` produz uma anomalia por checkpoint no terceiro estado | 🟢 |
| Medição dos 64 projetos com `.reversa/state.json` em `~/dev`, refeita em 2026-09-20 | 9 projetos desviantes, 30 checkpoints sem `completed_at` em 233, e **7 vocabulários distintos** para declarar conclusão: `status:"concluido"`, `concluido_em`, `done:true`, `status:"completed"`, `status:"completo"`, `status:"success"` e `timestamp`. Dois dos nove são trabalho parcial legítimo, com `modules_pending` não vazio | 🟢 |
| Prova de viabilidade do motor local, executada em 2026-09-20 | `qwen2.5:7b` via Ollama, temperatura 0, `format: json`, vocabulário de quatro valores: 13 acertos em 13 casos, sendo 10 reais e 3 negativos, em 43 s. Com vocabulário binário, 12 em 13: `status:"failed"` foi lido como conclusão, com o campo certo e o veredito errado | 🟢 |
| `.claude/skills/reversa/references/checkpoint-guide.md#o-que-salvar-a-cada-fase` do `med-reversa` | O guia é normativo e manda gravar `completed_at` e `files`. Nenhum dos mais de vinte `SKILL.md` que mandam salvar checkpoint repete o nome do campo, o que explica a deriva na fonte | 🟢 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| O Retomador (`_reversa_sdd/personas.md#persona-1-o-retomador`) | Recuperar o estado de um projeto parado sem repagar o custo do contexto | Abre o painel num projeto antigo e vê os agentes como concluídos, com a ressalva de que a conclusão veio de campo fora do esquema, em vez de uma parede de sete anomalias que ele precisaria interpretar uma a uma |
| O Operador (`_reversa_sdd/personas.md#persona-2-o-operador`) | Manter o ritmo do pipeline sem inspecionar disco a cada troca de agente | Roda o aprendizado quando um projeto novo acusa par desconhecido, lê a proposta, aprova ou recusa, e segue. A decisão custa minutos e vale para sempre |
| O Mantenedor da extensão | Decidir o vocabulário sem herdar palpite de modelo | Lê a proposta com a justificativa do agente e a evidência de onde o par foi visto, e é dele a assinatura que entra no mapa |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** O par aprovado é a unidade de reconhecimento, e ele é sempre **campo mais valor**,
   nunca campo sozinho. 🟢
   - Origem no legado: emenda `_reversa_sdd/addenda/011-estado-terminal-e-checkpoints.md`, tabela de
     `#6-requisitos-funcionais` da leitura
   - Tipo: nova
   - Justificativa medida: `status` carrega `"concluido"`, `"completed"`, `"completo"` e `"success"`
     nos projetos medidos, e carregaria `"failed"` num projeto que falhasse. Reconhecer por campo
     faria o painel declarar concluído um agente que abortou, que é precisamente o erro que o motor
     local cometeu quando o vocabulário do teste era binário.

2. **RN-02:** A precedência da 011 permanece, e o mapa entra **depois** dela. `completed_at` decide
   primeiro; na ausência dele, `modules_pending` não vazio decide em seguida; só então o mapa é
   consultado. Um projeto aderente ao esquema lê exatamente como lia antes. 🟢
   - Origem no legado: `_reversa_sdd/addenda/011-estado-terminal-e-checkpoints.md`, precedência do
     `checkpoint-guide.md`
   - Tipo: alterada

3. **RN-03:** Reconhecer não é sanear. Nenhum `state.json` é reescrito, e o campo bruto que
   sustentou o reconhecimento viaja até a tela ao lado do estado reconhecido. 🟢
   - Origem no legado: `_reversa_sdd/sdd/leitura-do-processo.md#4-non-goals-fora-do-escopo`, NG-05
   - Tipo: nova, por exercício de não-objetivo já vigente

4. **RN-04:** O checkpoint reconhecido por equivalência **não** fica indistinguível do canônico. Ele
   declara a procedência: o campo e o valor que o sustentaram, e o fato de estarem fora do esquema.
   Silenciar a origem seria o painel afirmar, com a mesma confiança, uma leitura provada e uma
   leitura convencionada. 🟢
   - Origem no legado: `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais`, RF-05
   - Tipo: nova

5. **RN-05:** O par aprovado cala a anomalia daquele checkpoint. Depois que o mantenedor decidiu, o
   aviso perdeu o destinatário, e repeti-lo é ruído. A decisão continua auditável pela procedência
   na linha do checkpoint e pelo próprio mapa. 🟡
   - Origem no legado: `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais`, RF-08, e o
     precedente da absorção da 011, que também desconta na composição da tela e não na leitura
   - Tipo: alterada

6. **RN-06:** O instante da conclusão continua vindo **apenas** de `completed_at`. Um par aprovado
   estabelece *que* o agente concluiu, nunca *quando*: o campo de instante ao lado, `at`, `date` ou
   `timestamp`, registra quando algo aconteceu, e não afirma fim de trabalho. 🟢
   - Origem no legado: `src/domain/discovery-state.ts`, `lerCheckpoint`, e o adendo da 011
   - Tipo: preservada, declarada aqui porque é o ponto onde a tentação de afrouxar é maior

7. **RN-07:** O agente **propõe** e nunca dispõe. A saída do aprendizado é uma proposta legível, em
   arquivo separado; o mapa só muda por ato do mantenedor. Um par jamais transita de proposto a
   vigente sem passar por essa mão. 🟢
   - Tipo: nova

8. **RN-08:** A classificação usa quatro valores, e não dois: `concluido`, `falhou`, `em-andamento`
   e `nao-e-sinal`. Os três primeiros reconhecem a situação do checkpoint, cada um na sua; o quarto
   não reconhece nada e deixa a leitura como estava. 🟢
   - Justificativa medida: com dois valores o motor local errou o único caso de falha, acertando o
     campo e errando o veredito; com quatro, acertou os treze
   - Tipo: nova
   - Consequência decidida na sessão de esclarecimentos: `falhou` ganha situação própria na tela, e
     o checkpoint passa a ter quatro situações em vez de três

9. **RN-09:** O que é enviado ao modelo é o checkpoint com o **conteúdo elidido**: as chaves são
   preservadas, os valores escalares curtos também, e toda lista, texto longo e caminho de sistema
   viram marcador de forma. O agente precisa ver `status: "concluido"`, e não precisa ver `achados`,
   `outputs`, `omissao_deliberada` nem o caminho do scratchpad. 🟢
   - Origem no legado: `_reversa_sdd/sdd/leitura-do-processo.md#12-segurança-e-privacidade`
   - Tipo: nova

10. **RN-10:** Uma entrada do mapa de checkpoints que não nomeia agente algum é decidida pelo mesmo
    rito, uma a uma, e o que se aprova nela é a **chave**, não um par campo mais valor, porque ela
    não traz campo de estado nenhum a traduzir. Aprovada como registro que não é agente, ela deixa
    de ser cobrada por conclusão e não gera anomalia. 🟡
    - Origem: medição de 2026-09-20, que achou `plano_aprovado` no `med-reversa`, `redator_progress`
      no `TECH+` e `decisoes_autor` no `afla`
    - Tipo: nova

11. **RN-11:** O par aprovado vale para todo projeto, e não apenas para aquele onde apareceu. O
    vocabulário pertence ao Reversa, e não ao repositório observado; a evidência registrada no par
    diz onde ele foi visto pela primeira vez, sem restringir onde vale. 🟢
    - Tipo: nova

12. **RN-12:** Propor e promover são atos separados, e o segundo é sempre humano. O aprendizado
    escreve a proposta; a promoção lê o que foi marcado e escreve no mapa, sem consultar modelo
    algum. Nenhum comando faz as duas coisas. 🟢
    - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | O sistema deve manter um mapa de equivalências aprovadas, com um registro por par campo mais valor, contendo a leitura decidida, a data da aprovação e a evidência dos projetos onde o par foi visto | Must | O mapa existe como arquivo versionado, e cada registro nomeia campo, valor, leitura, data e evidência | 🟢 |
| RF-02 | A leitura do checkpoint deve consultar o mapa **após** `completed_at` e `modules_pending`, e só então decidir | Must | Um checkpoint com `completed_at` e com par aprovado sai concluído pelo campo canônico, e a procedência declara o canônico | 🟢 |
| RF-03 | O checkpoint reconhecido por equivalência deve sair na situação que o par declara, entre concluído, falhou e em andamento, com a procedência do par que o sustentou | Must | O checkpoint do `scout` do `med-reversa` sai concluído, nomeando `status: "concluido"` como origem | 🟢 |
| RF-04 | O checkpoint reconhecido por equivalência não deve produzir a anomalia `checkpoint-sem-conclusao-declarada`, qualquer que seja a situação reconhecida | Must | A leitura do `med-reversa` com o mapa povoado devolve uma anomalia, e não sete | 🟢 |
| RF-05 | O checkpoint sem `completed_at`, sem `modules_pending` e sem par aprovado deve continuar em conclusão não declarada, com a anomalia da 011 intacta | Must | O checkpoint `plano_aprovado` do `med-reversa`, que só traz `at`, continua em anomalia | 🟢 |
| RF-06 | O instante do checkpoint deve permanecer nulo quando a conclusão veio de par aprovado | Must | Um checkpoint reconhecido por `status` não exibe instante algum, mesmo trazendo `at` | 🟢 |
| RF-07 | A camada de leitura não deve ganhar nenhuma capacidade de escrever, executar processo ou falar em rede | Must | A inspeção dos módulos de leitura continua sem `node:fs` de escrita, sem `child_process` e sem cliente de rede | 🟢 |
| RF-08 | O painel deve desenhar a procedência do reconhecimento em texto, nunca apenas em cor | Must | A linha do checkpoint reconhecido nomeia o campo e o valor, legível sem distinguir cores | 🟢 |
| RF-09 | O sistema deve oferecer um comando de aprendizado fora do build, que varre `state.json` de uma raiz e isola os pares fora do esquema ainda não decididos | Must | O comando roda sem alterar o build, e o `npm run build` não o invoca | 🟢 |
| RF-10 | O comando de aprendizado deve consultar um motor de inferência local, acessado por HTTP no próprio computador, com o modelo configurável por argumento e um padrão declarado | Must | O comando aceita o nome do modelo por argumento e usa o padrão quando ele é omitido | 🟢 |
| RF-11 | O comando de aprendizado deve elidir o conteúdo do checkpoint antes de enviá-lo ao modelo, preservando chaves e escalares curtos | Must | A carga enviada não contém listas, textos longos nem caminhos de sistema, verificável por suíte sobre a função de elisão | 🟢 |
| RF-12 | O comando de aprendizado deve escrever uma proposta legível, com o par, a leitura sugerida, a justificativa do modelo e os projetos onde o par apareceu, e **nunca** escrever no mapa | Must | Rodar o aprendizado deixa o mapa byte a byte idêntico | 🟢 |
| RF-13 | O comando de aprendizado deve pular os pares já decididos, propondo apenas o que é inédito | Should | Rodar duas vezes seguidas, sem projeto novo, produz proposta vazia na segunda | 🟢 |
| RF-14 | O comando de aprendizado deve falhar com mensagem nomeada quando o motor local não responder dentro do tempo-limite de 60 s por checkpoint, sem deixar proposta pela metade | Should | Com o motor desligado, o comando termina com a causa nomeada e nenhum arquivo escrito | 🟡 |
| RF-15 | O mapa vazio ou ausente deve deixar a leitura idêntica à da feature 011 | Must | Removido o mapa, a suíte da 011 passa sem reescrita | 🟢 |
| RF-16 | O checkpoint deve passar a ter quatro situações, com a falha reconhecida desenhada como tal, em texto próprio e distinto de conclusão não declarada | Must | Um checkpoint com par aprovado como `falhou` aparece como falho, e não como concluído nem como não declarado | 🟢 |
| RF-17 | O sistema deve reconhecer a entrada aprovada como registro que não é agente, deixando de cobrar conclusão dela e de contá-la entre os checkpoints de agente | Must | `plano_aprovado` aprovado como não-agente sai da contagem de checkpoints e não gera anomalia | 🟡 |
| RF-18 | O sistema deve oferecer um comando de promoção que lê as marcações da proposta e escreve no mapa apenas o que foi marcado, sem consultar modelo algum | Must | Promover uma proposta com dois de cinco pares marcados acrescenta exatamente dois registros ao mapa | 🟢 |
| RF-19 | A proposta deve ser escrita em Markdown legível, com uma caixa de marcação por par ou entrada, de modo que aprovar seja marcar | Must | O arquivo da proposta abre num editor de texto comum e cada item traz a sua caixa | 🟢 |
| RF-20 | O mapa deve viajar no pacote da extensão, versionado neste repositório | Must | Listar o conteúdo do `.vsix` mostra o mapa | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Desempenho | A leitura completa permanece abaixo de 200 ms, e a consulta ao mapa não introduz espera | RNF-01 de `_reversa_sdd/sdd/leitura-do-processo.md#7-requisitos-não-funcionais`. A referência media 52,9 ms na entrega da 011, e a consulta é busca em estrutura já carregada | 🟢 |
| Desempenho | A classificação por modelo custa cerca de 3,3 s por checkpoint e por isso mora fora do caminho da leitura, sem exceção | Medição desta sessão: 13 casos em 43 s. Dentro da leitura, um projeto de sete checkpoints estouraria o teto em mais de cem vezes | 🟢 |
| Segurança | O motor é local, e nenhuma carga sai da máquina. A promessa da seção 12 da spec da leitura permanece literalmente verdadeira para a extensão, que não ganha cliente de rede algum | `_reversa_sdd/sdd/leitura-do-processo.md#12-segurança-e-privacidade` | 🟢 |
| Privacidade | O conteúdo do checkpoint é elidido antes de chegar ao modelo, mesmo sendo o modelo local | RN-09. Os checkpoints medidos carregam caminhos de scratchpad, achados sobre sistema de terceiro e notas sobre omissão deliberada, nada disso necessário à classificação | 🟢 |
| Resiliência | Cada consulta ao motor local tem tempo-limite de 60 s, e o aprendizado não tenta de novo por conta própria: par não classificado fica de fora da proposta e é nomeado no fim da execução | Ferramenta de manutenção conduzida por humano, em que repetir a rodada é mais barato e mais legível que retentativa automática | 🟡 |
| Determinismo | A leitura permanece função pura da entrada mais o mapa, e a suíte roda sem modelo algum | RNF-05 de `#7-requisitos-não-funcionais` e o precedente de toda suíte do repositório | 🟢 |
| Observabilidade | Toda conclusão reconhecida por equivalência é rastreável até o par, a data e a evidência que a sustentam | RN-04 e o RF-08 de `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | 🟢 |
| Manutenibilidade | O mapa cresce por acréscimo, e registro antigo não é reescrito por rodada nova de aprendizado | Precedente do crescimento por acréscimo que toda feature desde a 008 segue | 🟢 |
| Tamanho | O pacote da tela permanece abaixo do teto de 409.600 B, com a guarda de 60 % respeitada | A 011 fechou em 214.288 B, 52,3 % do teto | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: checkpoint reconhecido por par aprovado
  Dado um checkpoint sem "completed_at", sem "modules_pending" e com status igual a "concluido"
  E um mapa em que o par status mais concluido está aprovado com a leitura concluido
  Quando o painel lê o projeto
  Então o checkpoint aparece como concluído
  E a linha declara que a origem foi o campo status com o valor concluido, fora do esquema
  E nenhuma anomalia é registrada para esse checkpoint
  E nenhum instante é exibido

Cenário: o campo canônico continua vencendo
  Dado um checkpoint com "completed_at" preenchido e também com status igual a "concluido"
  Quando o painel lê o projeto
  Então o checkpoint aparece como concluído pelo campo canônico
  E o instante exibido é o de "completed_at"

Cenário: trabalho parcial não é atropelado pelo mapa
  Dado um checkpoint sem "completed_at", com "modules_pending" não vazio e com status igual a "concluido"
  Quando o painel lê o projeto
  Então o checkpoint aparece como em andamento
  E o mapa não é consultado

Cenário: par não aprovado preserva o comportamento da feature 011
  Dado um checkpoint que traz apenas "at", "escopo", "adaptacao" e "fases"
  Quando o painel lê o projeto
  Então o checkpoint aparece em conclusão não declarada
  E a anomalia "checkpoint-sem-conclusao-declarada" nomeia o agente e o campo ausente

Cenário: falha declarada aparece como falha
  Dado um checkpoint com status igual a "failed"
  E um mapa em que o par status mais failed está aprovado com a leitura falhou
  Quando o painel lê o projeto
  Então o checkpoint aparece como falho, em texto próprio
  E não aparece como concluído nem como em conclusão não declarada
  E nenhuma anomalia é registrada para esse checkpoint

Cenário: entrada que não é agente
  Dado uma entrada chamada plano_aprovado, sem campo de estado algum
  E um mapa em que essa chave está aprovada como registro que não é agente
  Quando o painel lê o projeto
  Então a entrada não é contada entre os checkpoints de agente
  E nenhuma conclusão é cobrada dela

Cenário: o par vale em qualquer projeto
  Dado um par aprovado a partir de um projeto
  Quando o painel lê um projeto diferente que traz o mesmo par
  Então o reconhecimento acontece igualmente
  E a procedência nomeia o par, não o projeto onde ele foi visto pela primeira vez

Cenário: promover só o que foi marcado
  Dado uma proposta com cinco itens, dois deles marcados
  Quando o comando de promoção roda
  Então o mapa recebe exatamente os dois marcados
  E os três não marcados permanecem fora do mapa
  E nenhuma consulta a modelo é feita

Cenário: o aprendizado propõe e não dispõe
  Dado um projeto com um par campo mais valor que o mapa não conhece
  Quando o comando de aprendizado roda contra o motor local
  Então uma proposta é escrita com o par, a leitura sugerida, a justificativa e os projetos de origem
  E o mapa permanece idêntico byte a byte

Cenário: o conteúdo não chega ao modelo
  Dado um checkpoint com listas de achados, caminho de scratchpad e nota longa
  Quando o aprendizado monta a carga da consulta
  Então a carga preserva as chaves e os valores escalares curtos
  E substitui listas, textos longos e caminhos por marcador de forma

Cenário: motor local indisponível
  Dado que o servidor do modelo não responde em localhost
  Quando o comando de aprendizado roda
  Então ele termina com a causa nomeada
  E nenhuma proposta é escrita pela metade

Cenário: o registro do mapa carrega a sua própria justificação
  Dado um par aprovado no mapa
  Quando o registro é lido
  Então ele nomeia o campo, o valor, a leitura decidida, a data da aprovação e os projetos onde o par foi visto

Cenário: o aprendizado não repergunta o que já foi decidido
  Dado um mapa em que todos os pares do projeto já estão decididos
  Quando o comando de aprendizado roda uma segunda vez, sem projeto novo
  Então a proposta sai vazia
  E nenhuma consulta ao motor local é feita

Cenário: mapa ausente
  Dado um projeto sem mapa de equivalências
  Quando o painel lê o projeto
  Então o resultado é idêntico ao da feature 011
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01 a RF-06 | Must | São o reconhecimento em si, e sem eles a feature não existe |
| RF-07 | Must | É a garantia que sustenta RNF-04 da spec da leitura, e a única perda irreversível se for negligenciada |
| RF-08 | Must | Sem procedência, reconhecer vira adivinhar em silêncio, que é o que a 011 recusou |
| RF-09 a RF-12 | Must | São o aprendizado com aprovação, e o RF-12 é o que separa propor de dispor |
| RF-13 | Should | Conforto de operação: sem ele o aprendizado repergunta o que já foi decidido, e custa tempo, não correção |
| RF-14 | Should | Falha nomeada é higiene de ferramenta de manutenção, não requisito do painel |
| RF-15 | Must | É a rede de segurança da compatibilidade com a 011 |
| RF-16 | Must | Decidido na sessão de esclarecimentos: a falha reconhecida informa mais do que o silêncio, e o custo em protocolo e tela foi aceito |
| RF-17 | Must | Sem ele a resposta sobre as entradas que não são agentes não tem efeito algum |
| RF-18, RF-19 | Must | São o rito da aprovação, que é o que separa esta feature de um palpite automatizado |
| RF-20 | Should | Decorre do lugar escolhido para o mapa, e é conferível na listagem do pacote |
| RNF de privacidade | Must | A elisão é barata agora e cara de retroceder depois que propostas existirem |
| RNF de desempenho da leitura | Must | Teto já declarado e já medido |

### Nota sobre princípios

O arquivo `.reversa/principles.md` não existe neste projeto, de modo que não há princípios ativos a
confrontar. As regras acima foram conferidas contra os não-objetivos e os requisitos não funcionais
das specs de `_reversa_sdd/sdd/`, que cumprem aqui o papel que os princípios cumpririam.

## 9. Esclarecimentos

### Sessão 2026-09-20

- **Q:** Um par aprovado como `falhou` deve aparecer na tela, e como?
  **R:** Sim, como quarta situação do checkpoint, com desenho próprio. O custo em protocolo, tela e
  suíte foi aceito em troca da informação: um agente que terminou mal é fato acionável, e dizer
  apenas "conclusão não declarada" sobre ele seria verdadeiro e inútil. Gerou RF-16, alterou RF-03 e
  RF-04 e emendou a RN-08, cujo texto anterior dizia que só `concluido` reconhecia situação.

- **Q:** O que fazer com as entradas que não nomeiam agente, como `plano_aprovado`,
  `redator_progress` e `decisoes_autor`?
  **R:** Cada uma é decidida individualmente, pelo mesmo rito de proposta e aprovação dos demais.
  Daí decorre uma distinção que a resposta não enuncia mas exige: nessas entradas o que se aprova é
  a **chave**, e não um par campo mais valor, porque elas não trazem campo de estado nenhum a
  traduzir. Aprovada como registro que não é agente, a entrada deixa de ser cobrada por conclusão e
  não gera anomalia. Gerou RN-10 e RF-17, ambos marcados 🟡 por conterem essa dedução.

- **Q:** Onde o mapa de equivalências mora?
  **R:** Versionado neste repositório e embarcado no pacote da extensão. Viaja com ela, é auditável
  pelo histórico do git e não depende do estado da máquina em que o painel roda. Gerou RF-20 e
  fechou a formulação do RF-01.

- **Q:** Como o par sai da proposta e entra no mapa?
  **R:** A proposta nasce em Markdown legível, com uma caixa de marcação por item; você marca o que
  aprova e um segundo comando promove apenas o marcado, sem consultar modelo algum. Aprovar e ler
  passam a ser o mesmo gesto. Gerou RN-12, RF-18 e RF-19.

- **Q:** O par aprovado vale para todos os projetos ou só para aquele onde foi visto?
  **R:** Vale para todos. O vocabulário pertence ao Reversa, e não ao repositório observado; a
  evidência guardada no registro diz onde o par apareceu, sem limitar onde ele vale. Gerou RN-11.

### Decisões tomadas por padrão, sem pergunta

- A varredura do aprendizado tem como padrão o workspace aberto, e aceita uma raiz por argumento
  para o uso em lote sobre `~/dev`. É o comportamento que o preview e os auxiliares `estragar:*`
  já praticam neste repositório, e não pareceu merecer pergunta.

## 10. Lacunas

Nenhuma lacuna em aberto. As três marcadas na versão inicial foram resolvidas na sessão de
esclarecimentos de 2026-09-20, e as decisões correspondentes estão nas regras de negócio e nos
requisitos funcionais, não apenas no registro da conversa.

Fica anotado, sem peso de lacuna, o único ponto em que o documento deduz além do que foi
perguntado: a RN-10 conclui que a unidade aprovável de uma entrada sem campo de estado é a chave, e
não um par campo mais valor. A dedução é necessária para que a resposta sobre `plano_aprovado` tenha
efeito, e está marcada 🟡 nos dois lugares onde aparece.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-20 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-09-20 | Cinco dúvidas respondidas por `/reversa-clarify`; RN-08 emendada, RN-10 a RN-12 e RF-16 a RF-20 acrescentados, quatro cenários novos | reversa |
