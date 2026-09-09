# Actions: painel do processo

> Identificador: `003-painel-do-processo`
> Data: `2026-09-09`
> Roadmap: `_reversa_forward/003-painel-do-processo/roadmap.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA (herdada da decisão do roadmap entre parênteses)

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 61 |
| Paralelizáveis (`[//]`) | 42 |
| Maior cadeia de dependência | 13 ações (T001 → T006 → T014 → T015 → T016 → T017 → T036 → T039 → T041 → T049 → T050 → T053 → T054) |

Convenções desta decomposição:

- **Identificadores fixos**, que o `onboarding.md` já usa e que não se alteram sem alterá-lo junto:
  scripts `build`, `build:webview` e `check:webview`; configuração `tsconfig.webview.json`; saída do
  bundle em `out/res/webview/`; suíte de marcação em `tests/webview-render.spec.ts`; pasta de
  cobertura `src/webview/domain/**`. Quem mudar um deles muda o onboarding no mesmo passo.
- **Idioma:** identificadores e comentários de código em inglês, documentação em português, como a
  feature 002 fixou. Vale para nome de arquivo, de tipo, de função e de campo.
- **A fronteira de compilação** é a razão de ser de metade da fase 1. Nenhum componente se escreve
  antes de T008 provar que `src/webview/` recusa módulo de plataforma, porque descobrir isso depois
  custa reescrever o que já foi escrito.
- **Renderização em servidor, jamais navegador.** Toda suíte de marcação usa o renderizador de
  servidor da biblioteca de interface dentro do executor de testes que o projeto já tem. Nenhuma
  ação abre navegador, sobe simulador de documento ou tira captura de tela: o portão de saída desta
  feature é a suíte verde, e a verificação visual dos sete estados pertence à feature 005.
- **As seis seções** têm nomes fixos, na ordem de RF-14: faixa de bloqueio, ciclo forward,
  descoberta, política, anomalias e relatório da sonda. As três de diagnóstico nascem recolhidas,
  com uma exceção: em leitura degradada a de anomalias nasce expandida.
- **As seis funções puras de decisão** vivem em `src/webview/domain/` e são as únicas sujeitas à
  exigência de 100% de linhas: estado de entrada, razões de bloqueio, rótulo de estágio, rótulo de
  fase, ordem das seções e recolhimento inicial. Componente não entra nessa conta.
- **O sistema de design entra pelos tokens, não pelos componentes.** A decisão D-02 foi revertida na
  revisão de 2026-09-09: `@primer/primitives` volta como dependência, `@primer/react` fica de fora, e
  a poda de RF-24 é o que faz os quatro conjuntos de cor caberem no orçamento. Não há mais
  divergência a reconciliar por adendo neste ponto.
- **O kit de origem está montado neste ambiente**, em `dev/vscode-kanban`, e as versões das
  dependências desta feature foram lidas dele. Quem executar num ambiente sem o kit encontra as
  versões declaradas nas próprias ações.
- **Como ler o paralelismo:** `[//]` diz que a ação pode correr ao lado das demais `[//]` da
  mesma fase **assim que as dependências dela estiverem fechadas**, e a coluna de dependências é
  quem manda na ordem. É a leitura que o próprio template adota, e que a feature 002 seguiu. Duas
  ações `[//]` nunca compartilham arquivo alvo, e é essa a garantia que o marcador oferece.
- **Identificadores acima de T055** são as ações que a revisão do `audit/cross-check.md` acrescentou.
  Nenhum identificador foi reciclado, e nenhuma ação da versão anterior foi removida.
- Nada aqui comita, instala extensão de IDE, roda lint nem abre PR. O commit fica com o usuário.
- A política de escrita no legado está liberada sem restrição de caminho (`allowLegacyEdits`
  verdadeiro, `allowedPaths` vazio), o que cobre as ações que tocam `package.json`,
  `package-lock.json`, `tsconfig.json`, `vitest.config.ts`, `src/heranca/PROCEDENCIA.md`,
  `src/host/` e `src/extension.ts`. Se a política mudar antes da execução, essas ações se concluem
  registrando o trecho pronto em "Notas de execução", sem escrever.

## Fase 1, Preparação

<!-- Dependências, as duas unidades de compilação, o empacotador com o podador e o vocabulário da tela. A fase fecha provando a fronteira antes de existir um só componente. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Acrescentar as dependências de interface a `devDependencies`, com igualdade exata e sem acento circunflexo, na mesma forma das quatro já presentes: `react` e `react-dom` em `18.3.1`, `@types/react` em `18.3.12` e `@types/react-dom` em `18.3.1`. São as versões que o kit de origem usa, lidas do manifesto dele, e uma só entre os dois repositórios para que a ressincronização não vire comparação de versões. Ficam em `devDependencies` porque tudo o que a tela usa é empacotado no bundle, e nada é resolvido em tempo de execução. Rodar a instalação uma vez e conferir com `npm ls react react-dom` que o resolvido bate com o declarado | - | - | `package.json`, `package-lock.json` | 🟢 (D-03) | `[X]` |
| T002 | Acrescentar `esbuild` em `0.25.12` a `devDependencies`, com igualdade exata, que é a versão do kit de origem. Nenhum outro empacotador entra, e nenhuma ferramenta de empacotamento de extensão entra: VSIX e lista de exclusão são da feature 005 | T001 | - | `package.json`, `package-lock.json` | 🟢 (D-04) | `[X]` |
| T056 | Acrescentar `@primer/primitives` em `11.10.0` a `devDependencies`, com igualdade exata, e **apenas** ele: `@primer/react` e `@primer/octicons-react` ficam de fora, porque a seção 10 da spec do componente lista os tokens de tema e não os componentes prontos, e porque as folhas dos componentes sobrevivem à eliminação de código morto e custariam o orçamento inteiro. Conferir que o pacote instalado traz `dist/css/functional/themes/` com os quatro conjuntos que T060 vai importar | T001 | - | `package.json`, `package-lock.json` | 🟢 (D-02) | `[X]` |
| T003 | Criar `tsconfig.webview.json`, a segunda unidade de compilação: `types` como arranjo **vazio**, que é o campo do qual depende RF-23; `lib` com as bibliotecas de navegador e sem as de plataforma; sintaxe de componente na forma automática; `noEmit` verdadeiro, porque quem emite é o empacotador; resolução por empacotador; `rootDir` em `src` e importação com extensão explícita permitida, sem o que a importação de tipo vinda de `src/host/protocol.ts` não passa na verificação, conforme D-21; `include` com `src/webview/**` e o protocolo. No mesmo passo, acrescentar `src/webview` ao `exclude` de `tsconfig.json`, para que a unidade do host não compile a tela nem herde as tipagens de navegador. Nenhum outro campo do arquivo do host muda | - | `[//]` | `tsconfig.webview.json`, `tsconfig.json` | 🟡 (D-05, D-21) | `[X]` |
| T057 | Escrever `scripts/theme-tokens.js`, o podador na forma reduzida de D-15: uma construção de sondagem com os quatro conjuntos de cor esvaziados, para que o que restar nomeando token seja a folha do painel e não o próprio conjunto; a colheita dos nomes assim referenciados; o fecho transitivo sobre as declarações do conjunto, porque um token vivo pode ser escrito em termos de outro; e o descarte de toda declaração fora do fecho, linha a linha, preservando seletor e estrutura. O script imprime quantos bytes entraram e quantos saíram por conjunto. **Não** portar a metade do podador do kit que trata das folhas dos componentes do sistema de design: sem `@primer/react` não há folha de componente a descartar, e é nessa metade que mora a expressão regular gulosa que já serviu uma interface inteira sem estilo. Cabeçalho do arquivo nomeia o kit como origem da ideia, conforme D-22 | T002, T056 | `[//]` | `scripts/theme-tokens.js` | 🟢 (D-15, D-22) | `[X]` |
| T004 | Escrever `scripts/build-webview.js`, o empacotamento em Node puro sobre a interface de código do esbuild: entrada única `src/webview/main.tsx`, empacotamento ligado, formato de execução imediata, alvo `chrome108`, minificação ligada, mapa de fonte desligado, carregador de folha de estilo declarado para que os conjuntos de cor importados pelo tema entrem na emissão, saída em `out/res/webview/main.js` com a folha emitida ao lado como `main.css`, e o podador de T057 declarado como extensão da construção, recebendo as opções **sem si mesmo** dentro, porque ele roda uma sondagem própria. O alvo não é escolha de gosto: é o Chromium que o Electron da versão mínima do manifesto embarca, e divergir dele produz erro só na máquina do usuário. O script termina imprimindo os dois caminhos emitidos e sai com código diferente de zero se o empacotador falhar | T057 | `[//]` | `scripts/build-webview.js` | 🟢 (D-04, D-15) | `[X]` |
| T005 | Acrescentar ao manifesto exatamente três scripts, mantendo os três atuais intactos: `build:webview` chamando `node scripts/build-webview.js`; `build` encadeando `npm run compile` e `npm run build:webview`, nessa ordem, para que o host esteja compilado antes de o bundle sair; `check:webview` chamando `tsc -p tsconfig.webview.json --noEmit`. Não acrescentar script de empacotamento de extensão, de preview nem de verificação de teto, que são da feature 005 | T002, T004 | - | `package.json` | 🟢 (D-04) | `[X]` |
| T006 | Ajustar `vitest.config.ts` para transformar sintaxe de componente nos arquivos de teste e nos fontes da webview, sem passar a compilar a tela com a configuração do host: basta declarar a forma automática de sintaxe de componente na seção de esbuild do executor. Sem isso, um teste que importe componente falha por sintaxe, e a falha se lê como defeito onde não há. Manter a lista de inclusão como está, que já apanha `tests/**` | T001 | `[//]` | `vitest.config.ts` | 🟢 (D-12) | `[X]` |
| T007 | Escrever `src/webview/domain/types.ts`, o vocabulário da tela, só com tipos e constantes, sem lógica e sem componente: a lista fixa dos seis nomes de seção na ordem de RF-14 e o tipo união derivado dela; o estado de entrada efetivo, que é um dos cinco valores do protocolo mais a marca de releitura em curso de RN-08; a razão de bloqueio em três partes, texto, artefato relacionado e comando sugerido, conforme RF-03a; o rótulo com marca de vocabulário desconhecido, que RN-05 exige; a forma da preferência de exibição, com o único campo `collapsedSections`; o sinal de leitura degradada, que é a conjunção de anomalias, recusas e truncamento, declarado uma vez para que o cabeçalho de RN-06 e o recolhimento inicial de RF-22 leiam o mesmo fato; a forma dos atributos de tema do elemento raiz, com modo em vigor e os dois nomes de conjunto. Os tipos do processo, do relatório da sonda e das cargas vêm de `src/host/protocol.ts` por `import type`, e jamais por importação de valor, sob pena de o host entrar no bundle | - | `[//]` | `src/webview/domain/types.ts` | 🟡 (D-06, D-10, D-20) | `[X]` |
| T008 | Provar a fronteira de compilação antes de escrever componente, que é o passo 1 do plano de migração: rodar `npm run check:webview` sobre o que existe e exigir saída limpa, o que também prova que a importação de tipo vinda do protocolo atravessa, conforme D-21; acrescentar temporariamente `import { readFileSync } from 'node:fs'` a `src/webview/domain/types.ts` e exigir que o mesmo comando falhe por módulo não encontrado; desfazer a alteração e rodar uma terceira vez, exigindo verde. Registrar as três saídas em "Notas de execução". Passando o segundo caso, a separação não está de pé e nenhuma ação adiante tem valor | T003, T007 | - | `tsconfig.webview.json` | 🟢 (D-05, D-21) | `[X]` |

## Fase 2, Testes

<!-- As treze suítes são escritas contra o vocabulário de T007, antes dos módulos que as satisfazem. Cada ação das fases 3 e 4 só se conclui com a suíte correspondente verde. Os quatro blocos de T014 a T017 são o mesmo arquivo, e por isso correm em série. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T009 | Suíte do estado de entrada: cada um dos cinco valores nomeados no protocolo produz um estado efetivo distinto; carga de dados com entrada `installed` e com `no-reversa` produzem estados diferentes, e ambas trazem processo; o comando de carregando marca releitura em curso **sem** apagar o processo anterior, que é a metade verificável de RN-08; duas cargas em sequência rápida deixam a última vencer, e o momento da leitura exibido é o mais recente, conforme EC-07. Cobre os cenários de painel preenchido, de releitura pelo Operador e de duas cargas em sequência | T007 | `[//]` | `tests/webview-entry.spec.ts` | 🟡 (D-10) | `[X]` |
| T010 | Suíte das razões de bloqueio, a de maior superfície: entrega com todas as ações fechadas e sem adendo produz uma razão; migração aguardando decisão humana produz uma razão; migração com duas decisões pendentes produz **duas** linhas, uma por decisão nomeada, e não uma agregada; feature ativa com dúvidas remanescentes produz uma razão; processo sem nenhum dos quatro sinais produz lista vazia, e lista vazia é ausência de faixa, não faixa vazia; os quatro sinais simultâneos produzem as razões na ordem declarada. Cada razão devolvida tem as três partes de RF-03a preenchidas, e o comando sugerido é texto, nunca algo que o painel execute | T007 | `[//]` | `tests/webview-blocking.spec.ts` | 🟡 (D-10) | `[X]` |
| T011 | Suíte dos rótulos: as sete formas conhecidas de estágio devolvem texto legível distinto; estágio fora do vocabulário devolve o valor bruto com a marca de rótulo desconhecido, e nunca lança, conforme EC-05 e RN-05; as cinco fases da descoberta devolvem rótulo e marca de status concluída, corrente ou pendente; a marca de status é texto, e não cor, o que é a forma verificável do requisito de acessibilidade; checkpoint sem data de conclusão devolve status em andamento. Nenhum caso desta suíte renderiza componente | T007 | `[//]` | `tests/webview-labels.spec.ts` | 🟡 (D-10) | `[X]` |
| T012 | Suíte da preferência de exibição, toda ela sobre função total: estado ausente, nulo, de tipo errado, com campo faltando ou com campo de tipo errado devolvem preferência vazia, e em nenhum dos cinco casos há exceção; nome de seção desconhecido é descartado em silêncio na leitura, sem anomalia e sem aviso, conforme EC-09; a escrita substitui a lista inteira, sem mesclar com o que estava lá; o resultado da leitura é sempre a forma declarada em T007, jamais o objeto recebido. A porta de estado da webview entra por dublê | T007 | `[//]` | `tests/webview-preferences.spec.ts` | 🟢 (D-07) | `[X]` |
| T013 | Suíte da ordem e do recolhimento inicial: a ordem devolvida é exatamente a de RF-14, com os seis nomes, e não depende do processo recebido; sem preferência guardada e em leitura íntegra, o recolhimento inicial devolve as três seções de diagnóstico e apenas elas, conforme RF-22; sem preferência guardada e em leitura degradada, devolve só a política e o relatório da sonda, porque a de anomalias nasce expandida, conforme D-20; os três sinais de degradação valem cada um por si, isto é, anomalia sozinha, recusa sozinha e truncamento sozinho produzem o mesmo resultado; com preferência guardada, ela vence o padrão em ambos os casos; preferência que nomeia seção inexistente devolve o mesmo que preferência vazia; preferência que recolhe uma seção de núcleo é respeitada, porque a preferência do usuário não é validada contra o padrão | T007 | `[//]` | `tests/webview-sections.spec.ts` | 🟢 (D-10, D-20) | `[X]` |
| T058 | Suíte do podador de tokens, que exercita as funções de T057 sem rodar construção: a leitura de um conjunto sintético separa declarações de estrutura, e a estrutura é preservada verbatim; o fecho transitivo partindo de um nome retém o token nomeado e todos os que ele referencia, em cadeia, e para quando nada novo aparece; nome semeado que não existe no conjunto é ignorado sem lançar; a poda descarta toda declaração fora do fecho e nenhuma dentro dele; um fecho vazio interrompe a construção com mensagem que nomeia o arquivo do podador, que é a guarda de D-16 e a diferença entre economia e tela sem cor. Um caso mede um conjunto real do pacote instalado e exige redução acima de noventa por cento, que é a ordem de grandeza medida no `investigation.md` | T057 | `[//]` | `tests/webview-theme-tokens.spec.ts` | 🟢 (D-15, D-16) | `[X]` |
| T059 | Suíte do tema, que é a metade verificável de D-23 e cobre os dois cenários que a renderização em servidor não alcança: a função de mapeamento devolve, para cada uma das quatro combinações de modo e alto contraste, o modo em vigor e os **dois** nomes de conjunto, claro e escuro, sempre ambos preenchidos, porque o modo pode mudar por baixo; nome devolvido fora dos quatro importados é falha, não tolerância, já que conjunto sem folha deixa o painel sem cor; a leitura da classe do corpo do documento reconhece os quatro temas do editor e, diante de classe desconhecida, devolve o modo claro sem lançar. No mesmo arquivo, a varredura da folha de T027: nenhuma cor literal, nenhuma largura mínima em pixel que force rolagem horizontal e nenhuma unidade absoluta em medida de coluna, que é o que EC-04 pede e o que a marcação não prova | T007 | `[//]` | `tests/webview-theme.spec.ts` | 🟡 (D-23) | `[X]` |
| T014 | Suíte de marcação, primeiro bloco, as cinco telas de estado de entrada: cada uma renderiza por `react-dom/server` e produz título próprio; nenhuma produz documento vazio; a tela sem Reversa explica em duas frases o que o Reversa é, traz o comando de instalação em bloco copiável e oferece a ação de verificar de novo; a tela sem pasta explica que o painel precisa de uma pasta aberta e **não** oferece ação alguma, o que é exigência e não omissão; a tela de erro traz a mensagem recebida em bloco, sem interpretá-la como marcação, e oferece a ação de tentar de novo; a tela de carregando não substitui o conteúdo anterior quando há um. Escrever aqui o utilitário de renderização que os três blocos seguintes reaproveitam, uma função que recebe um elemento e devolve a marcação em texto | T006, T007 | - | `tests/webview-render.spec.ts` | 🟢 (D-03) | `[X]` |
| T015 | Suíte de marcação, segundo bloco, cabeçalho e faixa de bloqueio: o cabeçalho traz os cinco itens de RF-02, todos preenchidos, com processo instalado; o lugar da ação de despacho existe, é nomeado e está vazio, sem botão, conforme RF-15; havendo anomalia, recusa ou truncamento, o cabeçalho declara a degradação, e não havendo nenhum dos três, declara leitura íntegra, que são as duas metades de RN-06; a faixa aparece **acima** de todo o resto na marcação, e cada razão traz as três partes de RF-03a, com o artefato como alvo clicável e o comando em bloco copiável | T014 | - | `tests/webview-render.spec.ts` | 🟡 (D-10) | `[X]` |
| T016 | Suíte de marcação, terceiro bloco, as duas seções de núcleo: o ciclo forward traz os **oito** itens de RF-06, estágio, feature ativa, ações fechadas, ações abertas, emendas, dúvidas, features pausadas e adendo, cada um preenchido ou declarado ausente por nome, nunca em branco; as cinco fases da descoberta aparecem na ordem canônica mesmo com processo vazio, conforme EC-01, e a corrente se distingue por marca textual; os checkpoints aparecem separados entre concluídos e em curso, com data quando houver; as duas seções nascem expandidas na marcação, sem preferência guardada | T015 | - | `tests/webview-render.spec.ts` | 🟡 (D-10) | `[X]` |
| T017 | Suíte de marcação, quarto bloco, as três seções de diagnóstico: a política mostra o veredito vigente e as seis pastas em que o Reversa pode escrever, e com a política desligada diz que a edição do legado está desligada; a lista de anomalias traz arquivo, código e detalhe de cada uma, e com quinze anomalias mostra dez, o total e o controle de expansão, conforme RF-21 e EC-02; **zero anomalia** produz a declaração de que não houve nenhuma, e não seção vazia, que é o que o cenário de leitura íntegra pede; o relatório da sonda traz raiz lida, pasta da feature, caminhos recusados com o motivo e arquivos truncados; em leitura íntegra as três nascem recolhidas, com a contagem visível no título; em leitura degradada a de anomalias nasce expandida e as outras duas seguem recolhidas, o que fecha RF-22 do lado da marcação | T016 | - | `tests/webview-render.spec.ts` | 🟡 (D-10, D-20) | `[X]` |
| T018 | Suíte do limite de erro: um componente que lança dentro de uma seção deixa as outras cinco desenhadas na marcação; a seção defeituosa declara a falha no lugar dela própria; a linha técnica sai pelo comando de log do canal, uma vez, e não vira notificação, diálogo nem mudança de foco, conforme RN-07; o limite é por seção, e um segundo erro em outra seção não apaga a primeira. A porta de log entra por dublê contador | T006, T007 | `[//]` | `tests/webview-error-boundary.spec.ts` | 🟡 (D-08) | `[X]` |
| T019 | Suíte do módulo de mensagens da webview: a interface do host é tomada exatamente uma vez por painel, e uma segunda montagem reaproveita a mesma; envelope com comando conhecido chega ao tratador correspondente, e o tratamento é exaustivo sobre os três comandos do protocolo, de modo que um comando novo vire erro de tipo e não silêncio, conforme D-18; envelope com comando que a webview não entende produz **uma** linha de log nomeando o comando recebido e nenhuma mudança de tela, conforme RF-19; o aviso do terceiro comando do host entra em estado próprio, aparece nomeando o arquivo, **não** substitui o conteúdo da tela e é dispensável sem releitura, conforme RF-16 e D-17; o pedido de abertura sai com caminho relativo à raiz observada, e nunca absoluto, conforme RF-10; o pedido de releitura sai sem carga. A interface do host entra por dublê | T007 | `[//]` | `tests/webview-messaging.spec.ts` | 🟢 (D-06, D-17, D-18) | `[X]` |
| T020 | Suíte das fronteiras da webview, que lê os próprios fontes de `src/webview/`: nenhuma importação de **valor** vinda de `src/host/`, e `import type` não conta, por não sobreviver à emissão; nenhuma importação de módulo de plataforma nem de `node:fs`; a interface do host é tomada uma única vez, e a ocorrência está em `bridge/messaging.ts`; o registro de ouvinte de mensagem aparece uma única vez, no mesmo arquivo; nenhum arquivo de `ui/` contém atributo de estilo em linha, que a política do documento recusa, conforme D-11; nenhum componente de `ui/` decide, isto é, nenhum deles contém a lista de estágios, de fases ou de seções, que vive só em `domain/`; os nomes dos quatro conjuntos de cor aparecem em `theme/primer-themes.ts` e em nenhum outro arquivo, conforme D-02. Divergência aqui é defeito de desenho, e não de teste: corrige-se o código, jamais se afrouxa a suíte | T007 | `[//]` | `tests/webview-boundaries.spec.ts` | 🟢 (D-01, D-06) | `[X]` |
| T021 | Suíte do corpo do painel, do lado do host: o corpo traz uma etiqueta de script e uma de folha de estilo, e nenhuma outra; ambas apontam endereço resolvido pelo editor, e não caminho de disco, o que é a metade verificável de D-13; a etiqueta de script carrega o nonce da sessão, de modo que a suíte do documento continue verde; o corpo não contém script em linha, nem estilo em linha, nem marcação de conteúdo, porque quem desenha é o bundle; o ponto de montagem existe e é único. Os dois endereços e o nonce entram por parâmetro | T007 | `[//]` | `tests/host-panel.spec.ts` | 🟢 (D-09, D-13) | `[X]` |

## Fase 3, Núcleo

<!-- As seis funções puras primeiro, porque não dependem de componente algum, depois o tema, e os componentes por último, cada um contra a suíte que já existe. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T022 | Escrever `src/webview/domain/entry.ts`: a função pura que deriva o estado de entrada efetivo do comando recebido e do conteúdo da carga, devolvendo um dos cinco valores nomeados mais a marca de releitura em curso. Recebe o estado anterior como parâmetro, porque é assim que ela preserva o conteúdo durante a releitura sem guardar nada, cumprindo RN-08. Não importa componente, não importa o editor e não lê nada | T009 | `[//]` | `src/webview/domain/entry.ts` | 🟡 (D-10) | `[X]` |
| T023 | Escrever `src/webview/domain/blocking.ts`: a função pura que percorre os quatro sinais do processo e devolve a lista de razões, cada uma com texto, artefato relacionado e comando sugerido. As decisões de migração pendentes entram uma a uma, nomeadas, e não agregadas. A ordem da lista é declarada no próprio módulo, e não emerge da ordem dos campos do processo. Nenhuma razão executa coisa alguma: o comando é texto para copiar | T010 | `[//]` | `src/webview/domain/blocking.ts` | 🟡 (D-10) | `[X]` |
| T024 | Escrever `src/webview/domain/labels.ts`: as duas funções puras de rótulo, a de estágio sobre as sete formas conhecidas e a de fase sobre as cinco da descoberta, cada uma devolvendo texto legível ou, diante de valor fora do vocabulário, o valor bruto com a marca de rótulo desconhecido. O status de fase e de checkpoint sai como marca textual, e a decisão de cor não pertence a este módulo. Nenhuma das duas lança, em nenhuma entrada | T011 | `[//]` | `src/webview/domain/labels.ts` | 🟡 (D-10) | `[X]` |
| T025 | Escrever `src/webview/domain/preferences.ts`: a leitura total do estado guardado, que devolve preferência utilizável diante de ausência, nulo, tipo errado ou nome desconhecido, e a escrita, que substitui a lista inteira. A porta de estado entra por parâmetro, e o módulo não conhece a interface do host: quem a possui é `bridge/messaging.ts`, e este módulo recebe um par de funções. É o que torna a suíte de T012 possível sem dublar o editor | T012 | `[//]` | `src/webview/domain/preferences.ts` | 🟢 (D-07) | `[X]` |
| T026 | Escrever `src/webview/domain/sections.ts`: a função pura de ordem, que devolve os seis nomes de RF-14 sem depender de entrada alguma, e a de recolhimento inicial, que combina a preferência lida, o padrão de RF-22 e o sinal de degradação de T007, devolvendo o conjunto de nomes recolhidos. Preferência ausente em leitura íntegra devolve as três de diagnóstico; preferência ausente em leitura degradada devolve as duas que não são as anomalias, conforme D-20; preferência presente vence o padrão nos dois casos; nome que não corresponde a seção atual é descartado antes de entrar no conjunto. O corte de dez anomalias de RF-21 **não** vive aqui: ele é constante nomeada da seção, e a expansão dele não é preferência, conforme D-19 | T013, T025 | - | `src/webview/domain/sections.ts` | 🟢 (D-10, D-20) | `[X]` |
| T060 | Escrever `src/webview/theme/primer-themes.ts`, o único arquivo que conhece os nomes dos conjuntos de cor: importa `@primer/primitives` uma vez, os quatro conjuntos que RF-11 exige, claro, escuro e os dois de alto contraste, mais o arquivo de medidas que os quatro pressupõem, sem o qual as regras resolvem medida para nada; declara a lista dos quatro nomes oferecidos; e expõe a função que mapeia o modo em vigor e o sinal de alto contraste nos atributos do elemento raiz, escrevendo sempre os dois nomes, claro e escuro. Nenhum outro arquivo da webview nomeia conjunto de cor, e é isso que a suíte de fronteiras de T020 verifica | T056, T059 | `[//]` | `src/webview/theme/primer-themes.ts` | 🟢 (D-02) | `[X]` |
| T027 | Escrever `src/webview/theme/theme.css`, a folha única da tela, inteiramente sobre os tokens do sistema de design que T060 importa: cor de fundo, de texto, de borda, de destaque e dos quatro pares de ênfase vêm de token nomeado, e nenhuma cor é literal. É esta folha que semeia a poda de T057: token que ela não nomeia não sobrevive ao fecho, e por isso cada regra escrita aqui é também uma decisão de tamanho. As medidas fixam a coluna estreita: nada de largura mínima em pixel que force rolagem horizontal, empilhamento abaixo de 300 px, quebra de linha dentro de célula, conforme EC-03 e EC-04. O alto contraste não pede regra própria: ele chega pelo conjunto que os atributos de T060 selecionam | T059, T060 | - | `src/webview/theme/theme.css` | 🟢 (D-02) | `[X]` |
| T028 | Escrever `src/webview/theme/contrast.ts`: a leitura da classe que o editor escreve no corpo do documento, devolvendo qual dos quatro temas está ativo e o sinal de alto contraste, e a assinatura da troca, para que o painel repinte sem releitura e sem perder seção recolhida, conforme RF-11 e EC-06. O módulo não decide cor e não conhece nome de conjunto: ele informa o que o editor está pedindo, e T060 traduz | T059 | `[//]` | `src/webview/theme/contrast.ts` | 🟢 (D-02, D-23) | `[X]` |
| T029 | Escrever `src/webview/ui/ErrorBoundary.tsx`: o limite de erro como componente de classe, que é a única forma que a biblioteca de interface oferece para capturar falha de renderização. Recebe o nome da seção e a função de log por propriedade, desenha a declaração de falha no lugar da seção e envia a linha técnica pelo comando de log, uma única vez por falha. Não abre diálogo, não notifica e não muda foco, conforme RN-07 | T018 | `[//]` | `src/webview/ui/ErrorBoundary.tsx` | 🟡 (D-08) | `[X]` |
| T030 | Escrever `src/webview/ui/CollapsibleSection.tsx`: a seção genérica recolhível, que recebe nome, título, contagem opcional, estado de recolhimento e o que fazer ao alternar. O título é acionável por teclado, com papel e estado declarados para leitor de tela, que é a segunda metade do requisito de acessibilidade. A contagem aparece no título quando informada, que é o que RF-22 pede das três de diagnóstico. O componente não decide se nasce recolhida: recebe isso pronto de T026 | T026, T027 | - | `src/webview/ui/CollapsibleSection.tsx` | 🟡 (D-01) | `[X]` |
| T031 | Escrever `src/webview/ui/Header.tsx`: nome do projeto, versão do Reversa lida, raiz observada, momento da leitura e ação de reler, mais a declaração de leitura degradada ou íntegra e o lugar nomeado e vazio da ação de despacho. Todo texto vem pronto das funções de T024; o cabeçalho não formata estágio nem fase por conta própria. A ação de reler emite pelo módulo de mensagens, e não chama a interface do host | T015, T024 | `[//]` | `src/webview/ui/Header.tsx` | 🟡 (D-01) | `[X]` |
| T032 | Escrever `src/webview/ui/BlockingBanner.tsx`: a faixa que desenha, acima de todo o resto, a lista de razões que T023 devolveu. Cada razão vira três coisas na tela: o texto que a nomeia, o artefato como alvo clicável que emite o pedido de abertura, e o comando em bloco copiável, que o painel não executa. Lista vazia não desenha faixa, e nem faixa vazia: o componente devolve nada | T015, T023 | `[//]` | `src/webview/ui/BlockingBanner.tsx` | 🟡 (D-01) | `[X]` |
| T033 | Escrever `src/webview/ui/EntryScreens.tsx`: as cinco telas de estado de entrada, cada uma com título próprio. A sem Reversa explica em duas frases o que o Reversa é, mostra o comando de instalação em bloco copiável e oferece a ação de verificar de novo. A sem pasta explica que o painel precisa de uma pasta aberta e não oferece ação alguma, deliberadamente. A de erro declara que não foi possível ler, traz a mensagem recebida em bloco sem interpretá-la como marcação e oferece a ação de tentar de novo. A de carregando desenha a marca de releitura sem apagar o que já estava na tela. Nenhuma delas produz área em branco, que é o critério de aceite de RF-01 | T014, T022 | `[//]` | `src/webview/ui/EntryScreens.tsx` | 🟡 (D-01) | `[X]` |
| T034 | Escrever `src/webview/ui/ForwardSection.tsx`: o ciclo forward com os **oito** itens de RF-06, estágio em rótulo legível vindo de T024, feature ativa, ações fechadas, ações abertas, emendas, dúvidas, features pausadas e adendo. Item sem valor é declarado ausente por nome, e nunca deixado em branco. A seção vive dentro do recolhível de T030 e nasce expandida | T016, T024, T030 | `[//]` | `src/webview/ui/ForwardSection.tsx` | 🟡 (D-01) | `[X]` |
| T035 | Escrever `src/webview/ui/DiscoverySection.tsx`: as cinco fases na ordem canônica, com status concluída, corrente ou pendente distinguível sem depender de cor, e a lista de checkpoints por agente, separando o que concluiu do que ainda corre, com data quando houver. Processo vazio desenha as cinco como pendentes, conforme EC-01. A seção vive dentro do recolhível de T030 e nasce expandida | T016, T024, T030 | `[//]` | `src/webview/ui/DiscoverySection.tsx` | 🟡 (D-01) | `[X]` |
| T036 | Escrever `src/webview/ui/PolicySection.tsx`: o veredito vigente da política de escrita no legado e as pastas em que o Reversa pode escrever. Com a política desligada, a seção diz que a edição do legado está desligada e lista as seis pastas próprias. Nasce recolhida, com a contagem no título | T017, T030 | `[//]` | `src/webview/ui/PolicySection.tsx` | 🟡 (D-01) | `[X]` |
| T037 | Escrever `src/webview/ui/AnomaliesSection.tsx`: cada anomalia com arquivo, código e detalhe, exibindo as dez primeiras, a contagem total e o controle para ver o resto, com o corte em constante nomeada no próprio módulo e a expansão em estado local, que não é guardada e não fala com o host, conforme D-19. Código de anomalia fora do vocabulário aparece em forma bruta, e não quebra a lista, conforme RN-05. Zero anomalia declara que não houve nenhuma. Nasce recolhida em leitura íntegra e expandida em leitura degradada, recebendo isso pronto de T026 | T017, T030 | `[//]` | `src/webview/ui/AnomaliesSection.tsx` | 🟡 (D-01, D-19, D-20) | `[X]` |
| T038 | Escrever `src/webview/ui/ProbeSection.tsx`: raiz lida, pasta da feature, caminhos recusados com o motivo de cada recusa e arquivos truncados. Nasce recolhida, com a contagem no título. Não desenha o caminho do estado de migração nem a pasta da sessão de ideação, que o data-delta declara fora desta versão | T017, T030 | `[//]` | `src/webview/ui/ProbeSection.tsx` | 🟡 (D-01) | `[X]` |
| T039 | Escrever `src/webview/ui/App.tsx`: a montagem do painel, e só ela. Chama a ordem de T026, desenha a faixa e as cinco seções restantes nessa ordem, envolve **cada uma** no limite de erro de T029 com o nome dela, desenha o cabeçalho acima de tudo e escreve no elemento raiz os atributos de tema que T060 devolve. Estado de entrada diferente de instalado desenha a tela correspondente de T033 no lugar das seções, preservando o cabeçalho quando há raiz. O aviso de RF-16, quando houver, aparece ao lado do conteúdo e nunca no lugar dele, conforme D-17. Nenhuma decisão nasce aqui: tudo o que o componente faz é chamar função pura e distribuir o resultado, que é a forma verificável de RN-01 | T029, T030, T031, T032, T033, T034, T035, T036, T037, T038, T060 | - | `src/webview/ui/App.tsx` | 🟡 (D-01) | `[X]` |

## Fase 4, Integração

<!-- O módulo de mensagens, a entrada do bundle, a troca do corpo no host e as três suítes do host que citam o arquivo removido. A ordem é a do passo 5 do plano de migração: o provisório só sai depois que o real está montado. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T040 | Escrever `src/webview/bridge/messaging.ts`, o único módulo da webview que toca a interface do host: toma-a uma vez por painel, expõe o envio dos comandos de ida, registra o ouvinte único de volta e oferece o par de funções de estado que T025 consome. O tratamento dos comandos de chegada é exaustivo sobre os três do protocolo, com o caso restante produzindo uma linha pelo comando de log e nada mais, conforme RF-19 e D-18. O aviso do terceiro comando entra em estado próprio, ao lado do conteúdo, conforme D-17. As formas das mensagens vêm de `src/host/protocol.ts` por `import type`, e o protocolo não ganha comando, campo nem ordem nesta feature | T019 | `[//]` | `src/webview/bridge/messaging.ts` | 🟢 (D-06, D-17, D-18) | `[X]` |
| T041 | Escrever `src/webview/main.tsx`, a entrada única do bundle: importa a folha de T027, monta o painel no ponto que o corpo do host oferece, assina a mudança de tema por T028, registra o ouvinte único por T040, envia o comando de pronto e passa a desenhar o que chegar. Nenhuma lógica de apresentação vive aqui, e nenhuma chamada à interface do host acontece fora do módulo de mensagens | T027, T028, T039, T040 | - | `src/webview/main.tsx` | 🟢 (D-06) | `[X]` |
| T042 | Escrever `src/host/panel.ts`, o corpo real do painel: recebe nonce e os dois endereços já resolvidos pelo editor e devolve a marcação com o ponto de montagem, a etiqueta de folha de estilo e a etiqueta de script com o nonce. Nada mais. `src/host/document.ts` não muda: a política que ele já declara serve script por nonce e folha pela origem da webview, que é exatamente o que o bundle precisa | T004, T021 | `[//]` | `src/host/panel.ts` | 🟢 (D-09) | `[X]` |
| T043 | Alterar `src/host/provider.ts`: trocar a chamada do corpo provisório pela de T042, resolvendo os dois endereços de recurso pela interface do webview a partir da pasta de saída da extensão, e passá-los junto do nonce. A ordem das operações não muda, o ouvinte continua registrado uma vez, e o provedor continua sem escrever no estado da webview. Remover a importação do módulo provisório no mesmo passo | T042 | - | `src/host/provider.ts` | 🟢 (D-13) | `[X]` |
| T044 | Alterar `src/extension.ts`: acrescentar a pasta de saída da webview à lista de origens de recurso permitidas, ao lado da que já existe. Recurso local carregado por caminho de disco é bloqueado pela política, e sem esta declaração o editor recusa reescrever o endereço. Nenhuma outra linha da ativação muda, e ela continua sem ler disco | T043 | - | `src/extension.ts` | 🟢 (D-13) | `[X]` |
| T045 | Remover `src/host/provisional.ts`, que é o passo final do plano de migração e só acontece agora, com o corpo real montado e a ativação ajustada. Conferir por busca que nenhuma menção ao arquivo sobrou em `src/`, o que é a metade estática de RF-18. As menções que restarem em `tests/` são as de T046 e T047 | T043, T044 | - | `src/host/provisional.ts` | 🟢 (D-09) | `[X]` |
| T046 | Atualizar `tests/host-boundaries.spec.ts`, retirando as duas exceções declaradas para o arquivo removido: os filtros que o excluíam da contagem de travessia e da proibição de caminho literal deixam de existir, e a contagem passa a valer para todos os módulos do host sem ressalva. O caso que verificava a interface do host tomada uma única vez passa a olhar `src/webview/bridge/messaging.ts`, que é onde ela agora vive, ou sai daqui por já estar coberto em T020, e a escolha entre as duas fica registrada em "Notas de execução" | T040, T045 | `[//]` | `tests/host-boundaries.spec.ts` | 🟢 (D-06) | `[X]` |
| T047 | Atualizar `tests/host-provider.spec.ts`: o caso do documento passa a exigir a etiqueta de script e a de folha apontando endereço resolvido, em vez do conteúdo provisório; acrescentar caso que verifica que os dois endereços foram resolvidos pela interface do webview, e não montados como caminho de disco. Os demais casos da suíte permanecem como estão, porque a ordem das mensagens e a ausência de leitura antes do pronto não mudaram | T043 | `[//]` | `tests/host-provider.spec.ts` | 🟢 (D-13) | `[X]` |
| T048 | Atualizar `tests/host-manifest.spec.ts`: a lista exata de scripts passa a incluir `build`, `build:webview` e `check:webview`; a proibição de empacotador deixa de citar `esbuild`, que agora é dependência legítima, e continua proibindo a ferramenta de empacotamento de extensão, que é da feature 005; a ausência de lista de exclusão de VSIX continua exigida. Acrescentar caso que verifica que as dependências de interface e a dos tokens estão declaradas com igualdade exata, sem faixa de versão, e que `@primer/react` **não** está declarado, que é a forma verificável do recorte de D-02 | T005, T056 | `[//]` | `tests/host-manifest.spec.ts` | 🟡 (D-02, D-11) | `[X]` |
| T049 | Escrever a suíte de construção: um único comando produz as duas unidades, e a saída traz `out/extension.js` e os dois arquivos de `out/res/webview/`; a configuração da webview declara lista de tipos ambientais vazia, que é a prova estática de RF-23; o alvo do empacotador é `chrome108` e o formato é o de execução imediata; a entrada declarada é única; o podador está declarado na construção e recebe as opções sem si mesmo dentro. A suíte lê os arquivos de configuração e a saída existente, e não roda o empacotador dentro do teste | T005, T041 | `[//]` | `tests/webview-build.spec.ts` | 🟢 (D-04) | `[X]` |
| T061 | Acrescentar a `src/heranca/PROCEDENCIA.md` uma seção curta declarando o kit de extensão, `vscode-kanban`, como segunda origem de **padrão adotado**, não de código copiado: nomear os cinco padrões que vieram de lá, a ponte como caminho único, a preferência como função total, o tema pela classe do corpo, a ausência de falha silenciosa e a poda por fecho transitivo com guarda; dizer explicitamente que nenhum arquivo foi copiado e que, por isso, o carimbo de sete linhas e a entrada de manifesto não se aplicam; apontar `scripts/theme-tokens.js` como o arquivo mais próximo da origem e o cabeçalho dele como o lugar onde a dívida está declarada. É o que fecha o delta sobre `heranca-e-sincronia` e o que o ritual da feature 004 vai procurar | T057 | `[//]` | `src/heranca/PROCEDENCIA.md` | 🟡 (D-22) | `[X]` |
| T050 | Verificar a construção inteira, na ordem do onboarding: `npm run typecheck`, `npm run check:webview`, `npm test` e `npm run build`, exigindo os quatro sem erro e a suíte sem pulos; conferir que `out/extension.js` e `out/res/webview/` existem; ler o relatório da poda impresso pela construção e exigir que ele nomeie os quatro conjuntos com redução declarada. Registrar em "Notas de execução" a contagem final de arquivos de teste, casos, falhas e pulos, separando as suítes herdadas, as do host e as desta feature | T041, T045, T046, T047, T048, T049, T061 | - | `out/` | 🟢 (roadmap §10) | `[X]` |

## Fase 5, Polimento

<!-- Medida, cobertura, prosa dos cabeçalhos e o mapa dos cenários. Nada aqui altera comportamento. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T051 | Medir o tamanho dos dois arquivos emitidos em `out/res/webview/`, comparar com o orçamento de 400 KB e registrar o número em `progress.jsonl`, junto da data, da versão das dependências de interface e do que a poda descartou. A medida de partida do plano é de 21 KB de tokens sobre 486 KB brutos, e é contra ela que o número da folha se lê. A medida não interrompe a construção nem falha ação alguma: a verificação automática que interrompe é da feature 005, e o que se quer aqui é o número de partida contra o qual ela será calibrada | T050 | `[//]` | `progress.jsonl` | 🟡 (roadmap §9) | `[X]` |
| T052 | Conferir a cobertura das seis funções de decisão com `npx vitest run --coverage --coverage.include='src/webview/domain/**'`, exigindo 100% de linhas. Linha descoberta é caso de teste que falta, e não meta a relaxar: acrescentar o caso à suíte correspondente das ações T009 a T013 e medir de novo. Componente não entra nesta conta, e a pasta de inclusão garante isso. Registrar a saída final em "Notas de execução" | T050 | `[//]` | `src/webview/domain/` | 🟡 (RNF de testabilidade) | `[X]` |
| T053 | Uniformizar as linhas de log que a webview produz no mesmo formato de origem, ato e motivo que a feature 002 fixou no host, e conferir que os quatro casos previstos produzem linha legível: comando do host desconhecido, falha isolada de seção, preferência guardada descartada por nome desconhecido e pedido de abertura sem raiz observada. Nenhum deles pode produzir linha vazia, mensagem genérica ou notificação na tela | T050 | `[//]` | `src/webview/bridge/messaging.ts`, `src/webview/ui/ErrorBoundary.tsx` | 🟢 (RN-07) | `[X]` |
| T054 | Escrever o cabeçalho de cada módulo novo da webview, de `scripts/theme-tokens.js` e de `src/host/panel.ts`, dizendo em algumas linhas de prosa o que ele resolve, o que deliberadamente não faz e a qual requisito responde. É a documentação para quem retornar em doze meses. O cabeçalho do podador é caso à parte: nele a prosa nomeia o kit de origem e diz o que ficou de fora e por quê, que é a metade em código da declaração de D-22 | T053 | - | `src/webview/`, `scripts/theme-tokens.js`, `src/host/panel.ts` | 🟢 (D-22, roadmap §2) | `[X]` |
| T055 | Montar o mapa dos **vinte e nove** cenários de aceitação do `requirements.md` para as suítes que os cobrem, um por linha, e registrá-lo em "Notas de execução". Cenário sem teste correspondente é lacuna a reportar ali, não a esconder. Os cenários de troca de tema e de painel abaixo de 300 px são caso declarado: a metade verificável deles está em T059, e a confirmação visual pertence à feature 005, o que deve ser dito com essa palavra, junto dos demais que só a verificação visual fecha, para que o `/reversa-sync` os encontre | T050, T059 | `[//]` | `_reversa_forward/003-painel-do-processo/actions.md` | 🟢 (D-23, roadmap §10) | `[X]` |

## Notas de execução

### Fase 1, Preparação

**T001, T002 e T056, versões.** O kit de origem está montado em `dev/vscode-kanban` e as versões
saíram dele: `react` e `react-dom` em 18.3.1, `@types/react` em 18.3.12, `@types/react-dom` em
18.3.1, `esbuild` em 0.25.12 e `@primer/primitives` em 11.10.0. Todas com igualdade exata, todas em
`devDependencies`, porque o bundle carrega o que a tela usa e nada é resolvido em tempo de execução.
O executor de testes traz um segundo `esbuild`, 0.28.2, aninhado sob o Vite; os dois convivem, e o
declarado é o que a construção usa.

**T003 e T008, o que a lista de tipos vazia recusa e o que não recusa.** A verificação da webview com
`types` vazio recusa todo módulo ambiente de plataforma, isto é, todo `node:*`, porque essas
declarações vivem em `@types/node` e a lista vazia as mantém fora do programa. Ela **não** recusa
`vscode`: esse nome é resolvido como pacote, por `@types/vscode`, esteja ou não na lista. Foram
precisos, então, dois acréscimos que o plano não previa em detalhe, ambos sob D-21:

- `types/inherited-platform.d.ts`, com exatamente os seis símbolos que a camada herdada nomeia,
  `readFileSync`, `readdirSync` e `statSync` de `node:fs`, e `isAbsolute`, `resolve`, `join` e `sep`
  de `node:path`. Existe porque a importação de tipo do protocolo alcança a sonda, que lê disco, e
  sem isso a verificação falha na herança por razões que nada têm a ver com o painel. É deliberadamente
  estreito: qualquer outro símbolo, e qualquer outro módulo, continuam irresolvíveis.
- `types/editor-api-is-out-of-reach.d.ts`, que declara `vscode` como módulo vazio e é apontado por um
  mapeamento de caminho na configuração da webview. O módulo passa a existir sem nada dentro, e todo
  uso dele falha na verificação.

As três passagens de T008 ficaram assim: verificação limpa; `import { execSync } from
'node:child_process'` recusado com módulo não encontrado; `vscode.window` recusado por propriedade
inexistente; e verificação limpa de novo depois de desfeito. O exemplo do `onboarding.md`, que usa
`node:fs`, deixou de servir como prova por causa do shim, e a suíte de fronteiras de T020 é o que
proíbe qualquer `node:` nos fontes da webview, lendo o código em vez dos tipos.

**T005 e T006, suíte vermelha por desenho até T048.** Com os três scripts novos no manifesto e o
`esbuild` declarado, dois casos de `tests/host-manifest.spec.ts` passaram a falhar, exatamente os
dois que T048 existe para atualizar. A suíte fica vermelha nesses dois casos até a fase 4, e nenhum
outro caso foi afetado: 306 de 308 verdes.

### Fase 2, Testes

**Toda a fase é vermelha por desenho.** As suítes desta fase fixam o contrato dos módulos da fase 3,
e por isso falham na importação enquanto esses módulos não existirem. O que se verificou aqui foi
outra coisa: que cada arquivo é sintaticamente válido, que o executor o coleta e que a falha
declarada é a ausência do módulo, e não um erro de escrita da suíte. As únicas exceções são
`tests/webview-theme-tokens.spec.ts`, verde inteira porque o podador de T057 já existe, e
`tests/webview-boundaries.spec.ts`, verde nos nove casos que não dependem de arquivo por escrever.

**T014 a T018, extensão de arquivo.** As duas suítes que montam componente carregam sintaxe de
marcação e não podiam ficar em `.ts`, onde o transformador do executor não a reconhece. Ficaram em
`tests/webview-render.spec.tsx` e `tests/webview-error-boundary.spec.tsx`, com o restante do nome
como o `actions.md` o previa. Foi preciso corrigir `vitest.config.ts` no mesmo passo, ampliando o
padrão de inclusão de `tests/**/*.spec.ts` para `tests/**/*.spec.{ts,tsx}`; a correção está
registrada em `progress.jsonl` como uma linha `corrected` sobre T006.

**T018, o limite de erro não se exercita por lançamento.** `react-dom/server` não roda limite de
erro: no servidor, o lançamento se propaga em vez de ser capturado, e `getDerivedStateFromError` não
é chamada. A suíte, então, dirige as duas metades que a classe de fato possui, o estado que um
lançamento produz e a linha que a captura escreve, e afirma o isolamento como o que ele é na
marcação: um limite por seção, cada um com o nome dela. O invólucro do limite recebeu atributo
próprio, `data-boundary`, distinto do `data-section` das seções, para que as duas afirmações não se
confundam.

**T014 a T017, o contrato de marcação ficou explícito.** As quatro suítes fixam nomes de atributo,
e não texto de tela: `data-section`, `data-collapsed`, `data-item`, `data-part`, `data-phase`,
`data-checkpoint`, `data-anomaly`, `data-folder`, `data-action` e `data-path`. Foi decisão de
verificabilidade: texto muda de redação sem mudar de comportamento, atributo não. O corte de dez
anomalias, o total e o controle de expansão de RF-21 saem por `data-anomaly`, `data-part="anomaly-total"`
e `data-action="expand-anomalies"`.

**T019, o que a ponte recusa.** A suíte fixa que o pedido de abertura com caminho absoluto não é
despachado: vira uma linha de log e nada mais. RF-10 pede caminho relativo à raiz observada, e a
recusa no lado de cá evita que o host precise validar de novo o que já podia ter sido barrado.

**T020, uma exceção declarada.** `src/webview/domain/types.ts` fica de fora da checagem que confina
os nomes dos conjuntos de cor, porque é lá que `OFFERED_THEMES` vive, como vocabulário. O que D-02
proíbe é outro arquivo **escolher** conjunto, e é isso que a suíte mede.

### Fase 3, Núcleo

**Uma função auxiliar que o plano não previa.** `src/webview/domain/integrity.ts` nasceu ao escrever
a suíte de T013: o cabeçalho e o recolhimento inicial dependem do mesmo fato, se a leitura degradou,
e duas leituras dele acabariam discordando. A contagem dos três sinais de RN-06 passou a viver num
módulo só, e T026 a consome. É a sétima função pura, além das seis que D-10 nomeia.

**Duas suítes precisaram de conserto ao encontrar o legado.** A de T010 montava o estado de migração
com nomes de campo em caixa serpente, e o leitor herdado lê caixa camelo; além disso, `awaitingHuman`
não é campo do arquivo, e sim conclusão tirada do status do agente corrente. A de T017 fabricava
anomalias por adendo quebrado, que não produz nenhuma, e passou a fabricá-las por nome de fase que o
leitor não conhece. Os dois casos são a diferença entre escrever a suíte contra o modelo lembrado e
contra o modelo que existe.

**A faixa de bloqueio exigiu um processo bloqueado na fixture de composição.** Faixa sem razão não é
desenhada, e a ordem de RF-14 só é verificável com as seis seções no documento. A carga usada pelos
casos de composição passou a carregar **uma** dúvida: bloqueia sem degradar, de modo que o
recolhimento inicial de RF-22 continue sendo o padrão íntegro.

**As decisões de migração não são agregadas, e a espera é razão à parte.** O leitor herdado deriva
`awaitingHuman` de duas fontes, o status do agente corrente **ou** a existência de decisões
pendentes. Se a faixa lesse esse campo, uma decisão pendente produziria duas razões dizendo a mesma
coisa. `blocking.ts` lê o status diretamente para a razão da espera, e as decisões uma a uma, que é
o que o cenário de duas decisões pede.

**O painel não escreve nome de seção.** `App.tsx` desestrutura os seis nomes do que `sectionOrder()`
devolve, e por isso não contém literal algum do vocabulário: é o que a suíte de fronteiras de T020
mede, e o que mantém `types.ts` como a única declaração da ordem.

### Fase 4, Integração

**Os dois endereços entram pelo editor.** `src/host/panel.ts` recebe as duas URLs já reescritas, e
quem as reescreve é o provedor, pela interface do webview, a partir das URIs que a ativação montou.
A pasta `out/res/webview` entrou como raiz de recurso própria em `src/extension.ts`: sem ela o
editor não reescreve o endereço, e a política recusa o caminho de disco.

**T046, a escolha registrada.** O caso que verificava a tomada da interface do host **saiu** de
`tests/host-boundaries.spec.ts` e foi substituído por outro, mais forte: nenhum módulo do host pode
sequer mencionar `acquireVsCodeApi`. A verificação da tomada única passou a viver em
`tests/webview-boundaries.spec.ts`, que é onde a interface agora é tomada. As duas exceções que o
arquivo provisório carregava desapareceram com ele.

**T048, o que a contagem de ocorrências mede.** A suíte de fronteiras conta a **chamada**, e não a
menção: o nome da interface do host aparece três vezes em `bridge/messaging.ts`, no tipo, no
comentário e na chamada, e só a última importa. Foi o que o primeiro vermelho dessa suíte revelou.

**T050, o estado da construção.** `npm run typecheck`, `npm run check:webview`, `npm test` e
`npm run build` passam limpos, sem pulos. A saída traz `out/extension.js`, `out/res/webview/main.js`
e `out/res/webview/main.css`. O relatório da poda passou a nomear cada conjunto com a redução dele,
além do total, que é o que T050 pedia ler; a alteração está em `progress.jsonl` como linha
`corrected` sobre T057.

Contagem final: 42 arquivos de teste, 487 casos, zero falhas, zero pulos. Deles, 213 são das suítes
herdadas, 164 desta feature na webview e 110 do host e das demais. A contagem foi tirada depois de
T053, que acrescentou cinco casos de formato de linha de log.

### Fase 5, Polimento

**T051, a medida contra o orçamento.** O bundle emitido soma 168.359 B, sendo 159.951 B de script e
8.408 B de folha, contra o teto de 409.600 B: 41% do orçamento, com 241.241 B de folga. Os quatro
conjuntos de cor entraram com 485.898 B e saíram com 12.466 B, 97% descartados, contra os 21 KB que
o `investigation.md` estimara. O número está em `progress.jsonl`, com a data e as versões das
dependências de interface. Nada disso interrompe a construção: o corte automático é da feature 005,
e o que existe aqui é a linha de base contra a qual ela será calibrada.

**T052, cobertura das funções de decisão.** 100% de linhas e de funções nos sete módulos de
`src/webview/domain/`, com ramos em 96,77%. Faltava um caso, o comando que `nextEntry` não conhece,
e ele foi acrescentado à suíte de T009 em vez de a meta ser relaxada. Os dois ramos descobertos são
defesas que nenhuma entrada válida alcança: o `null` do artefato em `blocking.ts` e o status de fase
fora do vocabulário em `labels.ts`.

A medição exigiu `@vitest/coverage-v8`, que o plano não declarava e sem o qual T052 não roda. Foi
declarado em `devDependencies`, com igualdade exata na versão do executor, 3.2.7. É delta sobre o
roadmap, e está aqui para o `/reversa-sync` encontrar.

**T053, as quatro linhas de log.** O formato de origem, ato e motivo que a feature 002 fixou no host
foi redeclarado em `src/webview/bridge/log.ts`, e não importado: importação de **valor** do host
sobreviveria à emissão e arrastaria o host para dentro do bundle. Quatro linhas duplicadas é o preço
da fronteira. Os quatro casos escrevem linha própria: comando do host desconhecido e envelope sem
comando, em `bridge/messaging.ts`; falha isolada de seção, em `ui/ErrorBoundary.tsx`; abertura
recusada por caminho absoluto, em `bridge/messaging.ts`.

O quarto caso, a preferência descartada por nome desconhecido, **não** ficou onde T053 o previa.
EC-09 exige que o descarte seja silencioso na leitura, e `domain/preferences.ts` não recebe porta de
log por desenho. A linha passou a ser escrita em `src/webview/main.tsx`, que é quem tem a porta e
quem compara o que estava guardado com o que sobreviveu à leitura. O silêncio continua sendo na
tela; o canal do mantenedor é outra coisa.

**T055, mapa dos cenários de aceitação.** São **trinta**, e não vinte e nove como a ação previa: a
contagem do plano ficou uma abaixo. Todos os trinta têm suíte correspondente. Quatro deles têm
metade verificável aqui e metade que só a verificação visual fecha, e essa metade pertence à feature
005; estão marcados com essa palavra.

| # | Cenário | Suíte que o cobre |
|---|---------|-------------------|
| 1 | Retomador abre o painel num projeto com Reversa instalado | `tests/webview-render.spec.tsx` |
| 2 | Entrega concluída que ainda não convergiu | `tests/webview-blocking.spec.ts`, `tests/webview-render.spec.tsx` |
| 3 | Dúvidas em aberto contam como bloqueio | `tests/webview-blocking.spec.ts` |
| 4 | Migração com decisões pendentes nomeadas | `tests/webview-blocking.spec.ts` |
| 5 | Migração aguardando decisão humana | `tests/webview-blocking.spec.ts` |
| 6 | Operador relê depois de rodar um agente | `tests/webview-entry.spec.ts`, `tests/webview-render.spec.tsx` |
| 7 | Leitura degradada | `tests/webview-sections.spec.ts`, `tests/webview-render.spec.tsx` |
| 8 | Leitura íntegra | `tests/webview-sections.spec.ts`, `tests/webview-render.spec.tsx` |
| 9 | Workspace sem Reversa instalado | `tests/webview-render.spec.tsx` |
| 10 | Nenhuma pasta aberta no editor | `tests/webview-render.spec.tsx` |
| 11 | Falha capturada na leitura | `tests/webview-render.spec.tsx` |
| 12 | Estado vazio, Reversa recém-instalado | `tests/webview-render.spec.tsx` |
| 13 | Navegação até o artefato | `tests/webview-render.spec.tsx`, `tests/webview-messaging.spec.ts` |
| 14 | Arquivo apontado não existe mais | `tests/webview-messaging.spec.ts`, `tests/host-open-file.spec.ts` |
| 15 | Troca de tema com o painel aberto | `tests/webview-theme.spec.ts`; **verificação visual** na feature 005 |
| 16 | Estágio fora do vocabulário conhecido | `tests/webview-labels.spec.ts` |
| 17 | Preferência guardada com seção que não existe mais | `tests/webview-preferences.spec.ts` |
| 18 | Falha de renderização de uma seção | `tests/webview-error-boundary.spec.tsx` |
| 19 | Muitas anomalias | `tests/webview-render.spec.tsx` |
| 20 | Mensagem do host que a webview não entende | `tests/webview-messaging.spec.ts` |
| 21 | Painel mais estreito que o mínimo | `tests/webview-theme.spec.ts`; **verificação visual** na feature 005 |
| 22 | Duas cargas de dados em sequência rápida | `tests/webview-entry.spec.ts` |
| 23 | Checkpoint ainda em curso | `tests/webview-labels.spec.ts`, `tests/webview-render.spec.tsx` |
| 24 | Política de escrita no legado desligada | `tests/webview-render.spec.tsx` |
| 25 | Caminho recusado pela sonda | `tests/webview-render.spec.tsx` |
| 26 | Preferência de recolhimento sobrevive ao ciclo de visibilidade | `tests/webview-preferences.spec.ts`, `tests/host-bridge.spec.ts`; **verificação visual** na feature 005 |
| 27 | Primeira abertura, sem preferência guardada | `tests/webview-sections.spec.ts`, `tests/webview-render.spec.tsx` |
| 28 | Primeira abertura com leitura degradada | `tests/webview-sections.spec.ts`, `tests/webview-render.spec.tsx` |
| 29 | Build produz as duas unidades | `tests/webview-build.spec.ts` |
| 30 | Auditoria da forma do código da webview | `tests/webview-boundaries.spec.ts`, `tests/host-boundaries.spec.ts` |

O quarto cenário que só a verificação visual fecha é o de número 1, na parte em que afirma que o
painel abre sem comando algum executado antes: a marcação prova a ordem e o conteúdo, e que a
ativação não lê disco está provado em `tests/host-provider.spec.ts`, mas abrir a visão pela primeira
vez num editor de verdade é ato da feature 005.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-to-do` | reversa |
| 2026-09-09 | Regeneração após a revisão do `audit/cross-check.md` e do roadmap: seis ações novas, de T056 a T061, dez ações revistas e nenhum identificador reciclado | reversa |
