# Roadmap: painel do processo na linha de comando

> Identificador: `014-cli-do-processo`
> Data: `2026-09-20`
> Requirements: `_reversa_forward/014-cli-do-processo/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

A ferramenta não é um leitor novo: é um terceiro consumidor da leitura que a feature 001 entregou,
ao lado do painel e do preview. Ela pede ao host a mesma sequência de mensagens que a tela recebe,
por `sessionMessages`, e alimenta com ela a mesma máquina de estados de entrada que a tela usa, em
`entry.ts`. Disso decorre a propriedade que mais importa: leitura degradada, raiz ausente, feature
recém-criada e releitura comportam-se no terminal exatamente como no editor, porque são o mesmo
código decidindo.

Sobre essa base entram quatro camadas novas, e o corte entre elas é o mesmo que o repositório já
pratica. Uma máquina pura de navegação converte tecla e estado em estado novo mais efeito nomeado,
sem executar coisa alguma, no molde do `router.ts` do host. Uma função pura de quadro converte a
carga lida, o estado de navegação e as dimensões da janela numa lista de linhas com ênfase
abstrata, sem um único código de escape, o que a torna conferível por suíte sem terminal. Três
módulos de borda concentram, um a um, as capacidades que tocam o mundo: o terminal, o editor e a
observação do disco. E um modo de uma passada, escolhido quando a saída não é terminal, imprime o
mesmo quadro sem jamais tomar a tela.

A ferramenta compila em unidade própria, fora da saída que vira pacote, e é invocada por uma casca
fina em `scripts/`, como o preview e o auxiliar de prompt já são.

## 2. Princípios aplicados

Não existe `.reversa/principles.md` neste projeto, de modo que não há princípios formais a
confrontar. O que faz as vezes deles são os invariantes declarados no PRD e nas specs, e é contra
eles que a tabela abaixo se escreve.

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| A extensão nunca escreve arquivo (`_reversa_sdd/prd.md#6-restricoes`) | Nenhum módulo da ferramenta abre arquivo para escrever, cria, remove ou renomeia; a suíte de fronteiras nova o verifica lendo os fontes | respeita |
| A camada de leitura não escreve, não cria e não executa (`_reversa_sdd/sdd/leitura-do-processo.md#4-non-goals`, NG-01) | A ferramenta cria um processo, o editor do ambiente, e isso vive em módulo apartado que não é alcançável a partir da leitura. A proibição continua valendo onde foi escrita | conflita, e o conflito está declarado na RN-03 do requirements |
| Leitura e despacho em camadas que não se alcançam (`_reversa_sdd/prd.md#10-evolucao-prevista`) | É exatamente a doutrina que resolve o conflito acima, aplicada antes do botão de disparar agentes existir | respeita |
| Decisão em função pura, desenho burro (`_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais`, RF-13) | Quadro e navegação são funções puras; o que sobra na borda é escrita de bytes no terminal | respeita |
| Nenhuma dependência de tempo de execução (`scripts/preview.js`, doutrina declarada) | Controle de terminal, teclado, desenho e observação saem do interpretador | respeita |
| A única conexão é a da conferência de atualização (`_reversa_sdd/addenda/007-atualizacao-e-progresso.md`) | A ferramenta usa o módulo existente e não abre conexão nova | respeita |
| Ninguém observa o disco por conta própria (`_reversa_sdd/sdd/leitura-do-processo.md#4-non-goals`, NG-04, e `_reversa_sdd/sdd/painel-do-processo.md#4-non-goals`, NG-03) | A ferramenta observa, e o faz no lugar que o próprio NG-04 reserva: quem decide quando ler é o host, e no terminal a ferramenta **é** o host. A camada de leitura continua sem observar nada, e o módulo que assina o disco não é alcançável a partir dela. O NG-03 do painel continua valendo para o painel, que segue relendo por botão. O que a feature reabre é a pendência 1 do PRD, que adiara a observação até o uso real doer, e é a RN-09 que paga o preço da reabertura, obrigando a tela a declarar toda mudança que vier sozinha | respeita, com a fronteira deslocada e declarada |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Consumir `sessionMessages` do host, e não `readWorkspace` direto | A ordem das mensagens e a escolha da raiz ficam decididas num lugar só, como o preview já faz; a ferramenta herda de graça os estados degradados | Chamar a leitura direto e montar a carga à mão, o que duplicaria a escolha de raiz e divergiria na primeira mudança | 🟢 |
| D-02 | Alimentar `nextEntry` de `src/webview/domain/entry.ts` com essas mensagens | É a máquina de estados que já decide o que sobrevive a uma releitura; reescrevê-la no terminal produziria duas verdades sobre o mesmo estado | Estado próprio de entrada na ferramenta | 🟢 |
| D-03 | Unidade de compilação própria, `tsconfig.cli.json`, com saída em `out-cli/`, fora de `out/`, e `src/cli/**` acrescentado ao `exclude` do manifesto do host | `out/` inteiro entra no pacote instalável por `!out/**` do `.vscodeignore`; compilar junto levaria a ferramenta para dentro da extensão que o usuário instala, contra o que o requirements assume. A simetria com `src/webview/**`, já excluído pela mesma razão, é o precedente | Compilar junto e excluir depois no `.vscodeignore`, o que emendaria a doutrina de exclusão universal da feature 005 e poria em `out/` código que o editor nunca executa | 🟢 |
| D-04 | Casca fina em `scripts/painel.js`, com a lógica em `src/cli/`, e o comando declarado no manifesto de scripts | É o molde exato de `scripts/preview.js` e de `scripts/prompt-harness.js`, e mantém a ferramenta fora da construção do pacote | Binário global, publicação, ou executável dentro de `out/` | 🟢 |
| D-05 | O quadro é função pura de carga, estado de navegação e dimensões, devolvendo linhas com ênfase abstrata | É o que permite conferir a tela inteira por suíte sem terminal, que é a dívida de teste que a interface viva traz | Escrever escape direto no desenho, o que tornaria toda conferência visual e manual | 🟢 |
| D-06 | A navegação é máquina pura de tecla e estado para estado novo mais efeito nomeado | Molde do `router.ts`, que já é a fronteira de confiança do host; efeito nomeado é testável, chamada direta não é | Tratar a tecla executando a ação no mesmo lugar | 🟢 |
| D-07 | Três módulos de borda, um por capacidade: terminal, editor e observação do disco | A fronteira fica verificável por busca nos fontes, como `node:fs` na leitura e o cliente de requisição no host já são | Espalhar as três pelo laço principal | 🟢 |
| D-08 | O editor é criado sem passar pelo shell, com o caminho vindo sempre da leitura e resolvido sob a raiz observada | Caminho de artefato do Reversa pode conter espaço, e o shell interpretaria metacaractere de nome de arquivo; sem shell, nada disso existe | Montar linha de comando e entregar ao shell | 🟢 |
| D-09 | O valor de `VISUAL` ou `EDITOR` é dividido em palavras, a primeira sendo o executável e as demais argumentos fixos | É a convenção que os editores de terminal esperam, e cobre o caso comum de editor com opção de espera | Tratar o valor inteiro como nome de executável, que quebra em `code -w` | 🟡 |
| D-10 | A observação agrupa eventos numa janela de oitocentos milissegundos antes de reler, e a degradação relê a cada dois segundos | O ciclo de codificação grava muitas vezes em sequência; sem agrupamento a tela redesenha a cada byte. Entre a notícia imediata e a tela estável, o usuário escolheu a segunda no formulário de 2026-09-20 | Trezentos milissegundos, que ainda piscam durante o trabalho de um agente; reler a cada evento; observar por intervalo fixo apenas | 🟢 |
| D-11 | Quando o observador não instalar, a ferramenta degrada para releitura por intervalo e declara na tela que degradou | A assinatura de mudança no disco é irregular entre sistemas, e falhar em silêncio seria a pior das saídas | Abortar; fingir que observa | 🟡 |
| D-12 | O modo é escolhido pela presença de terminal na saída, com bandeiras para forçar cada um | É o comportamento que uma ferramenta de terminal madura tem, e faz o uso em script funcionar sem que ninguém precise lembrar de uma bandeira | Bandeira obrigatória; dois comandos distintos | 🟢 |
| D-13 | A conferência de atualização entra pela porta e pelo módulo que já existem, com dois controles de desligamento, bandeira e variável de ambiente | Preserva a fronteira de que só um módulo abre conexão, e repõe no terminal o controle que no editor é uma chave de configuração | Consulta própria na ferramenta; nenhum controle | 🟢 |
| D-14 | `src/webview/domain/` passa a ser apresentação compartilhada sem mudar de lugar, com o novo estatuto declarado em cabeçalho e preso por suíte | Mover a pasta tocaria todos os componentes, as suítes e os adendos entregues, sem mudar uma linha de comportamento, e o risco desta feature já está inteiro gasto na borda do terminal | Mover para `src/apresentacao/`, que fica registrado como dívida nomeada | 🟢 |
| D-15 | O `Esc` é reconhecido por bloco de bytes, e não por byte, sem temporizador algum | Um relógio dentro do reconhecimento tiraria a pureza da única função que o contrato do teclado exige pura, e o atraso apareceria em toda tecla de seta. Um bloco que seja exatamente `Esc` é inequívoco na prática | Espera curta de uns cinquenta milissegundos; dois toques de `Esc`; retirar a tecla | 🟡 |
| D-16 | A suspensão por `Ctrl+Z` usa a mesma dança da abertura do editor: restaura ao suspender, redesenha por inteiro ao voltar | Suspender não é sair, mas deixa o terminal em modo bruto do mesmo jeito, e a RN-08 não distingue os dois casos. O mecanismo já existe para o editor, de modo que o custo é uma ação, e não um subsistema | Desligar o `Ctrl+Z`, que tira um hábito do shell; adiar como dívida, deixando um jeito conhecido de quebrar o terminal | 🟢 |

## 4. Premissas

Nenhuma premissa nasce de `[DÚVIDA]`: o documento de requisitos chegou ao plano sem marcadores, e
as oito respostas da sessão de esclarecimento estão integradas. As três premissas abaixo vêm da
seção 10 do requirements e seguem reabríveis.

| Premissa | Origem (`requirements.md` seção) | Risco se errada |
|----------|----------------------------------|-----------------|
| A ferramenta é comando do repositório, sem publicação nem binário global | 10, Lacunas | Baixo. Mudar a distribuição depois não toca o desenho, só o empacotamento |
| A ferramenta fica fora do pacote instalável e da construção dele | 10, Lacunas | Médio. Se tiver de entrar, a D-03 muda de forma, e o `.vscodeignore` volta à mesa |
| ~~As teclas exatas se decidem aqui~~. Resolvida em 2026-09-20: o usuário confirmou a tabela inteira e decidiu as duas arestas que ela não cobria | 10, Lacunas | Nenhum. A premissa deixou de ser premissa |

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| Leitura do processo | `_reversa_sdd/sdd/leitura-do-processo.md` | contrato-novo | Nenhuma alteração; ganha um terceiro consumidor, previsto pelo NG-03 |
| Ponte e host | `_reversa_sdd/sdd/ponte-e-host.md` | contrato-novo | `sessionMessages` e `readWorkspace` passam a ser chamados de fora do editor por um segundo cliente, como o preview já faz |
| Painel do processo | `_reversa_sdd/sdd/painel-do-processo.md` | regra-alterada | As funções puras de `src/webview/domain/` deixam de ser exclusivas da tela e passam a ser apresentação compartilhada; nenhum comportamento muda |
| Empacotamento e verificação | `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | componente-novo | Quarta ferramenta de terminal, e uma unidade de compilação nova cuja saída fica fora do pacote |
| Herança e sincronia | `_reversa_sdd/sdd/heranca-e-sincronia.md` | n/a | Nada vem de fora nesta feature; nenhum arquivo herdado é tocado |

Componentes novos, todos sob `src/cli/`:

| Módulo | Papel | Toca o mundo |
|--------|-------|--------------|
| `sessao.ts` | Pede a sequência de mensagens e mantém a entrada corrente por `nextEntry` | não |
| `navegacao.ts` | Máquina pura de tecla e estado para estado novo mais efeito nomeado | não |
| `quadro/*.ts` | Desenho de cada seção como linhas com ênfase abstrata, na ordem que o painel fixa | não |
| `passada.ts` | O modo de uma só impressão, sobre o mesmo quadro | não |
| `terminal.ts` | Modo bruto, tela alternativa, cursor, dimensões, escrita e restauração | sim, único |
| `editor.ts` | Criação do processo do editor e suspensão da interface | sim, único |
| `observacao.ts` | Assinatura das pastas que importam e agrupamento de eventos | sim, único |
| `argumentos.ts` | Leitura dos argumentos e escolha do modo | não |
| `tipos.ts` | O vocabulário das estruturas efêmeras, num lugar só | não |
| `quadro/entrada.ts` | As quatro situações de entrada, cada uma com título e corpo | não |
| `quadro/procedencia.ts` | De onde veio a leitura que está na tela, e quando | não |
| `conferencia.ts` | A consulta à origem, pelo módulo e pela porta que já existem | não |
| `laco.ts` | O laço vivo, que liga todos os outros e trata os sinais | sim, sinais |
| `dados.ts` | A serialização da carga para quem lê por máquina | não |
| `uso.ts` | O texto do `--ajuda` e a recusa nomeada | não |
| `index.ts` | O ponto de entrada, que escolhe o modo e devolve o código de saída | não |

## 6. Delta no modelo de dados

- Resumo das mudanças: nenhuma. A ferramenta não altera nem acrescenta campo à carga lida, não
  persiste estado e não migra nada. O que nasce são três estruturas efêmeras, o estado de
  navegação, o quadro e o resultado da observação, que vivem em memória e morrem com o processo.
- Detalhe completo em: `_reversa_forward/014-cli-do-processo/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| Linha de comando | arquivo | `_reversa_forward/014-cli-do-processo/interfaces/contrato-de-linha-de-comando.md` |
| Teclado da interface viva | arquivo | `_reversa_forward/014-cli-do-processo/interfaces/teclado.md` |
| Abertura no editor do ambiente | arquivo | `_reversa_forward/014-cli-do-processo/interfaces/abertura-no-editor.md` |

A consulta à origem já tem contrato escrito na feature 007, em `interfaces/consulta-a-origem.md`
daquela pasta, e esta feature não o altera: usa o mesmo módulo, a mesma porta e os mesmos sete
desfechos.

## 8. Plano de migração

Não há migração de dados. O que existe é ordem de construção, e ela importa porque a unidade de
compilação nova é pré-requisito de tudo o que vem depois.

1. Acrescentar `src/cli/**` ao `exclude` do manifesto do host e criar `tsconfig.cli.json` com saída
   fora de `out/`, conferindo que o pacote gerado continua idêntico
2. Declarar o comando no manifesto de scripts, com a compilação da unidade como passo anterior
3. Escrever a sessão, a navegação e o quadro, todos puros, com as suítes antes do desenho
4. Escrever os três módulos de borda e a suíte de fronteiras que os confina
5. Ligar o laço vivo, e só então o modo de uma passada, que é o mesmo quadro sem tela alternativa
6. Conferir à mão pelo `onboarding.md`, que é o portão visual desta feature

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| A assinatura de mudança no disco se comporta de modo diferente entre sistemas, e a observação falha ou dispara demais | médio | alto | Agrupamento por janela declarada, degradação para intervalo com aviso na tela, e a observação confinada num módulo substituível |
| A interface deixa o terminal quebrado ao falhar | alto | médio | Restauração ligada à saída normal, à falha não prevista e ao sinal de interrupção, mais conferência humana no `onboarding.md` |
| Uma sequência de escape partida em dois blocos, por ligação lenta, faz um `Esc` de seta parecer a tecla de saída | baixo | baixo | O reconhecimento é por bloco, e o caso raro tem saída pronta: a espera curta de cinquenta milissegundos, que se acrescenta sem mudar a forma da função |
| A ferramenta e o painel divergem quando um deles mudar | alto | médio | Apresentação compartilhada por importação, e não por cópia, mais suíte de paridade sobre a mesma carga |
| A saída compilada da ferramenta envelhece e passa a mentir sobre o próprio código | médio | médio | A compilação da unidade é passo anterior do comando, e a casca recusa rodar sobre saída ausente, nomeando o comando que a produz |
| A ferramenta entra sem querer no pacote instalável | médio | baixo | A saída fica fora de `out/`, e a suíte do conteúdo do pacote continua valendo sem alteração |
| O editor declarado no ambiente não devolve o terminal como o encontrou | médio | baixo | A restauração ocorre dos dois lados da suspensão, e o redesenho é integral ao voltar |
| O quadro puro cresce e vira um segundo painel, com regra própria | alto | médio | Nenhuma regra nova de apresentação pode nascer em `src/cli/quadro/`; a suíte de fronteiras proíbe rótulo literal de estágio, de fase e de situação ali |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] O pacote gerado antes e depois da feature tem o mesmo conteúdo, conferido pela suíte que o abre
- [ ] A suíte de fronteiras nova prende as três capacidades de borda num módulo cada
- [ ] A suíte de paridade mostra que painel e terminal afirmam os mesmos fatos sobre a mesma carga
- [ ] A conferência humana do `onboarding.md` passou num terminal de verdade, incluindo interrupção, suspensão por `Ctrl+Z`, redimensionamento e abertura do editor
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-20 | Versão inicial gerada por `/reversa-plan` | reversa |
| 2026-09-20 | Achados A002 e A004 do `audit/cross-check.md` aplicados: a observação do disco confrontada com o NG-04 da leitura e o NG-03 do painel na tabela de princípios, e a tabela de componentes completada com os oito módulos que a decomposição revelou | reversa |
| 2026-09-20 | Decisões do usuário aplicadas antes do `/reversa-to-do`: teclado confirmado, janela da observação para oitocentos milissegundos (D-10), `Esc` por bloco (D-15), `Ctrl+Z` pela dança da suspensão (D-16), `out-cli/` nomeada na D-03 e a premissa das teclas encerrada. Origem em `perguntas/respostas/respostas-teclado-e-escopo-2026-09-20.md` | reversa |
