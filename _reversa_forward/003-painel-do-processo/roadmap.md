# Roadmap: painel do processo

> Identificador: `003-painel-do-processo`
> Data: `2026-09-09`
> Requirements: `_reversa_forward/003-painel-do-processo/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

A webview nasce como segunda unidade de compilação, com o mesmo corte de camadas que o
`vscode-kanban` pratica e que a feature 002 já aplicou no host: um diretório de decisões puras, um
módulo único de mensagens, um diretório de componentes e um de tema. As decisões que a spec exige em
função pura ficam no primeiro, e são exatamente elas que a suíte cobre, sem navegador e sem simulador
de documento.

O caminho de menor risco para o portão de saída escolhido é renderizar em servidor. Os componentes
produzem marcação por `react-dom/server` dentro do executor de testes que o projeto já usa, e é
sobre essa marcação que os cenários de ordem, de texto e de estado são verificados. Isso dá prova
executável ao que, de outro modo, dependeria de captura de tela numa máquina com interface gráfica,
que é justamente o que travou a ação T031 da feature anterior.

As cores vêm dos tokens do sistema de design, como a seção 10 da spec do componente exige, e cabem
no orçamento pela poda que RF-24 pede. A poda foi medida neste repositório antes de virar decisão:
os quatro conjuntos de cor custam 486 KB inteiros e 21 KB depois do fecho transitivo sobre uma folha
de painel plausível, o que resolve a tensão entre a dependência obrigatória e o teto de tamanho sem
sacrificar nenhum dos dois.

O acoplamento com o host se resume a duas trocas. O corpo provisório sai e entra o corpo real, que
carrega o script e a folha de estilo emitidos pelo empacotador, e a ativação passa a declarar a
pasta de saída da webview entre as origens de recurso permitidas. Nada mais do host muda, e o
protocolo não ganha comando algum.

## 2. Princípios aplicados

O projeto não tem `.reversa/principles.md`, de modo que não há princípio formal a confrontar. Ficam
registrados os invariantes herdados do PRD, que operam como princípio de fato nesta feature.

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| A extensão nunca escreve arquivo | A webview não tem acesso a disco por construção, e o único pedido de efeito que ela emite é o de abrir documento | respeita |
| Nenhum tráfego de rede em tempo de execução | A política do documento declara `connect-src 'none'`, e o bundle não carrega recurso remoto | respeita |
| Leitura e despacho em camadas separadas | O lugar do despacho é reservado no cabeçalho, sem tratador e sem caminho de código até ele | respeita |
| Estágio como valor de domínio, nunca texto renderizado | O rótulo legível é derivado por função pura a partir do valor, que trafega inalterado | respeita |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Quatro camadas em `src/webview/`: `domain/` sem interface nem componente, `bridge/` com o módulo único de mensagens, `ui/` com os componentes e `theme/` com a leitura do tema do editor | Espelha o corte que o kit de origem provou e que o host da feature 002 já segue; é o que torna RN-01, RF-13 e RF-17 verificáveis por varredura de fonte | Componentes com lógica embutida; camada única de apresentação | 🟢 |
| D-02 | Os tokens do sistema de design entram como dependência, na forma de `@primer/primitives` apenas, sem os componentes de `@primer/react`. A folha do painel nomeia tokens do sistema, e o tema do editor escolhe o conjunto pelos atributos do elemento raiz | É o que a seção 10 da spec do componente lista como obrigatório, e a seção 10 do `requirements.md` reafirmou na revisão de 2026-09-09. Os componentes prontos ficam de fora porque a spec não os lista e o painel não os usa: ele tem cabeçalho, faixa, seções recolhíveis, listas e texto | Dispensar o sistema de design e tirar as cores só das variáveis do editor, que foi a decisão anterior e a divergência A001 do cross-check; trazer `@primer/react` junto | 🟢 |
| D-03 | Biblioteca de interface na mesma versão do kit de origem, com a renderização de teste feita pelo renderizador de servidor dela | Uma versão só entre os dois repositórios simplifica a ressincronização; o renderizador de servidor produz marcação verificável em Node puro, sem navegador e sem simulador de documento | Simulador de documento no executor de testes; biblioteca de teste de componentes | 🟢 |
| D-04 | Empacotador na mesma versão e com o mesmo alvo do kit, `chrome108`, formato de execução imediata, entrada única e saída em `out/res/webview/` | O alvo é o Chromium que o Electron da versão mínima declarada no manifesto embarca; divergir disso produz erro apenas na máquina do usuário | Empacotador diferente; alvo mais recente; emissão por compilador só | 🟢 |
| D-05 | Segunda configuração de compilador para a webview, com lista de tipos ambientais vazia e sem emissão | É essa lista vazia que faz a importação de módulo de plataforma dentro da webview falhar na verificação, cumprindo RF-23 em tempo de compilação e não em tempo de execução | Configuração única para os dois alvos | 🟢 |
| D-06 | A webview importa de `src/host/` apenas tipos, jamais valor, e o protocolo continua sendo a única fonte dessas formas | Importação de tipo desaparece na emissão, de modo que nada do host entra no bundle; redeclarar o protocolo do lado da tela criaria duas verdades | Copiar os tipos para a webview; publicar um pacote comum | 🟢 |
| D-07 | A preferência de exibição vive no estado que a webview mantém no host, lida por função total que devolve valor usável diante de conteúdo corrompido | O kit de origem já resolve assim, e é o que atende EC-09 sem transformar preferência inválida em painel que não abre | Guardar no armazenamento do navegador; guardar no disco pelo host | 🟢 |
| D-08 | Um limite de erro por seção, implementado como componente de classe, que reporta a falha pelo comando de log do canal | A biblioteca de interface não oferece captura de erro por função; a granularidade por seção é decisão fechada da spec, para que um eixo defeituoso não apague os outros cinco | Um limite único para o painel; nenhuma captura | 🟡 |
| D-09 | O corpo do painel passa a ser montado por `src/host/panel.ts`, e `src/host/provisional.ts` é removido; `src/host/document.ts` permanece intacto, com a política e o nonce que já tem | A política atual já serve script por nonce e folha de estilo pela origem da webview, que é exatamente o que o bundle precisa; refazer o gerador seria descartar o que a feature 002 provou | Manter o provisório ao lado; gerar o documento na webview | 🟢 |
| D-10 | Seis funções puras nomeadas concentram a decisão de apresentação: estado de entrada, razões de bloqueio, rótulo de estágio, rótulo de fase, ordem das seções e recolhimento inicial | RF-13 exige cinco delas e admite mais, ao dizer "ao menos"; a sexta é o recolhimento inicial, que RF-22 tornou normativo depois. A cobertura total exigida incide sobre as seis, e é essa a lista que o critério de pronto e o cenário de auditoria da forma do código passam a nomear | Uma função única de apresentação; decisão espalhada por componente; deixar o recolhimento inicial dentro do componente de seção | 🟢 |
| D-11 | Nenhum estilo declarado dentro de atributo de elemento; toda regra vive na folha emitida pelo empacotador | A política do documento não admite estilo em linha, e descobrir isso em tempo de execução custaria uma sessão de depuração dentro do editor | Afrouxar a política para admitir estilo em linha | 🟢 |
| D-12 | O executor de testes recebe a transformação automática de sintaxe de componente, sem passar a compilar a webview com a configuração do host | Sem isso, um teste que importe componente falha por sintaxe, e não por defeito | Testes apenas sobre as funções puras, sem tocar componente | 🟢 |
| D-13 | A ativação passa a declarar a pasta de saída da webview entre as origens de recurso permitidas, e o corpo aponta script e folha por caminho resolvido pelo editor | Recurso local carregado por caminho de disco é bloqueado pela política; o editor precisa reescrever o endereço | Embutir o bundle no próprio documento como texto | 🟢 |
| D-14 | O ícone da barra de atividades e o restante de `media/` continuam onde estão, fora da pasta de saída, e nenhuma ação desta feature copia recurso estático | O manifesto já os referencia da raiz do pacote, e movê-los quebraria a suíte de manifesto sem ganho. A revisão de 2026-09-09 estreitou RF-23 justamente para que a cópia de recursos estáticos ficasse inteira com a feature 005 | Copiar `media/` para a saída junto do bundle | 🟢 |
| D-15 | O podador de tokens é escrito aqui na forma reduzida: sonda com os conjuntos esvaziados, colheita dos tokens que a folha nomeia, fecho transitivo entre eles e descarte do resto. A metade do podador do kit que trata das folhas de componentes do sistema de design não é portada | Sem componentes do sistema de design não há folha de componente a descartar, e portar essa metade traria a expressão regular gulosa que já produziu, no kit, uma construção que se dizia econômica enquanto servia a interface sem estilo | Copiar o podador inteiro do kit; adotar os conjuntos sem poda e elevar o teto; oferecer menos conjuntos, o que custaria o par de alto contraste que RF-11 existe para dar | 🟢 |
| D-16 | O podador para a construção quando o fecho transitivo não retém token algum, em vez de reportar economia máxima | É a mesma guarda que o kit aprendeu por defeito real: poda que descarta tudo não é economia, é tela sem cor, e ela se anuncia com números tanto melhores quanto mais quebrada estiver | Confiar na medida do relatório; verificar só no preview da feature 005 | 🟢 |
| D-17 | O aviso de RF-16 vive em estado próprio do painel, ao lado do conteúdo e nunca no lugar dele, e é dispensável pelo usuário sem releitura | O terceiro comando do canal chega fora do fluxo de carga, e tratá-lo como carga apagaria a tela por causa de um arquivo que sumiu, que é o oposto do que EC-05 pede | Guardar o aviso dentro do último estado de carga recebido; mostrar o aviso como notificação do editor, que RN-07 proíbe | 🟢 |
| D-18 | O tratamento de mensagem do host é exaustivo sobre os três comandos do protocolo, e o caso restante registra uma linha de log com o comando recebido, sem tocar a tela | Exaustividade verificada pelo compilador é o que faz um comando novo do protocolo virar erro de tipo aqui, e não silêncio em tempo de execução; a linha de log é o que RF-19 exige do caso desconhecido | Encadear condicionais sem caso final; ignorar em silêncio | 🟢 |
| D-19 | O corte de RF-21 fica em dez anomalias, com o restante atrás de um controle local à seção, que não guarda preferência e não fala com o host | Dez é o número que a spec do componente fixou, e mantê-lo em constante nomeada no domínio deixa a revisão futura encontrar a escolha onde ela se procura. O controle é local porque expandir uma lista longa não é preferência de exibição, e sim gesto de uma leitura | Cortar por altura de pixel; guardar a expansão junto do recolhimento de seções; mostrar tudo sempre | 🟢 |
| D-20 | O recolhimento inicial recebe, além da preferência guardada, o sinal de degradação da leitura, e é ele que abre a seção de anomalias quando houver anomalia, recusa ou truncamento | É a exceção que a revisão de 2026-09-09 acrescentou a RF-22 e que o sexto dos sete estados da tela sempre pediu; deixá-la no componente esconderia dentro da interface uma regra que RN-06 torna normativa | Abrir a seção sempre; manter a regra dentro do componente de seção | 🟢 |
| D-21 | A configuração de compilação da webview alcança `src/host/protocol.ts` pela raiz `src` e aceita importação com extensão explícita, mantendo a lista de tipos ambientais vazia | Sem isso a importação de tipo de D-06 não passa na verificação, porque o host escreve os caminhos com extensão e o protocolo vive fora do diretório da webview. A lista vazia continua sendo o que recusa módulo de plataforma | Duplicar os tipos do protocolo na webview; relaxar a lista de tipos | 🟡 |
| D-22 | O podador nasce com cabeçalho que nomeia o kit de origem e a ideia tomada dele, e uma linha em `src/heranca/PROCEDENCIA.md` registra o kit como segunda origem de padrão adotado, sem cópia de arquivo e portanto sem carimbo de sete linhas | A reversão de D-02 aproxima este arquivo da origem mais do que qualquer outro desta feature, e a forma reduzida de D-15 é reescrita, não cópia. Declarar a origem sem invocar o contrato de carimbo mantém a herança honesta e não infla o manifesto que a feature 004 vai verificar | Copiar o arquivo com carimbo e entrada no manifesto; não declarar origem alguma | 🟡 |
| D-23 | A repintura por troca de tema é provada em duas metades: a função que mapeia o tema do editor nos atributos do elemento raiz tem teste próprio, e a suíte varre a folha do painel em busca de medida fixa que impeça o empilhamento abaixo de 300 px. A confirmação visual das duas fica com o preview da feature 005 | A renderização em servidor não repinta nem mede, e deixar os dois cenários sem ação alguma foi o achado A008 do cross-check. Provar a função e a folha é o que existe de verificável aqui, e o que resta é dívida nomeada, não esquecimento | Nenhuma verificação até a feature 005; simulador de documento só por estes dois cenários | 🟡 |

## 4. Premissas

Nenhuma premissa por dúvida não resolvida. As três do documento inicial e as cinco perguntas de plano
foram fechadas nas duas sessões de esclarecimento de 2026-09-09.

| Premissa | Origem (`requirements.md` seção) | Risco se errada |
|----------|----------------------------------|-----------------|
| n/a | n/a | n/a |

A divergência que a versão anterior deste roadmap declarava nesta seção deixou de existir. A decisão
D-02 dispensava o sistema de design externo contra a seção 10 da spec do componente, o cross-check a
apontou como achado A001, e a revisão de 2026-09-09 a reverteu. O sistema de design volta como
dependência, na forma dos tokens, e o que era divergência a reconciliar virou requisito verificável
em RF-24. Nada resta pendente de reconciliação por adendo neste ponto.

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| `painel-do-processo` | `_reversa_sdd/sdd/painel-do-processo.md` | componente-novo | Passa a existir em código, em quatro camadas sob `src/webview/` |
| `ponte-e-host` | `_reversa_sdd/sdd/ponte-e-host.md#10-integracoes-e-dependencias` | regra-alterada | A dependência do painel deixa de ser suprida por corpo provisório; `provider.ts` monta o corpo real e `provisional.ts` deixa de existir |
| `empacotamento-e-verificacao` | `_reversa_sdd/sdd/empacotamento-e-verificacao.md#6-requisitos-funcionais` | componente-novo | RF-01 e RF-02 são antecipadas aqui, na medida mínima, junto do podador de tokens; teto verificado, cópia de recursos estáticos, exclusões, pacote instalável e preview permanecem com a feature 005 |
| `heranca-e-sincronia` | `_reversa_sdd/sdd/heranca-e-sincronia.md#6-requisitos-funcionais` | regra-alterada | O kit de extensão passa a ser segunda origem de padrão em uso corrente, declarada em `PROCEDENCIA.md` pela ação de D-22, sem cópia literal de arquivo e portanto sem carimbo nem entrada de manifesto |

Arquivos previstos, em rascunho para o `legacy-impact.md` que o `/reversa-coding` produzirá.

Criação, quatro camadas da webview mais o corpo do painel no host:

- `src/webview/domain/`: tipos da tela, estado de entrada, razões de bloqueio, rótulos, ordem das seções, recolhimento inicial e preferências
- `src/webview/bridge/`: o módulo único de mensagens, que toma a interface do host uma vez
- `src/webview/ui/`: aplicação, cabeçalho, faixa de bloqueio, seção genérica recolhível, as seis seções, telas de estado de entrada, aviso e o limite de erro
- `src/webview/theme/`: os quatro conjuntos de cor importados num só lugar, o mapeamento do tema do editor nos atributos do elemento raiz e a folha do painel
- `src/webview/main.tsx`: a entrada do bundle
- `src/host/panel.ts`: o corpo real, com as etiquetas de script e de folha
- `tsconfig.webview.json`, `scripts/build-webview.js` e `scripts/theme-tokens.js`
- Suítes novas em `tests/`

Modificação:

- `src/host/provider.ts`: troca do corpo provisório pelo real e recepção dos endereços de recurso
- `src/extension.ts`: origem de recurso apontando a saída da webview
- `package.json`: dependências da interface, dos tokens e do empacotador, e os comandos de construção e de verificação de tipos da webview
- `vitest.config.ts`: transformação de sintaxe de componente
- `src/heranca/PROCEDENCIA.md`: o kit como segunda origem de padrão adotado, conforme D-22
- `tests/host-boundaries.spec.ts`, `tests/host-provider.spec.ts` e `tests/host-manifest.spec.ts`: asserções que hoje citam o arquivo provisório ou a ausência de empacotador

Remoção:

- `src/host/provisional.ts`

## 6. Delta no modelo de dados

- Resumo das mudanças: o processo não muda de forma, e nenhum campo é acrescentado ao que trafega
  pelo canal. Aparece uma estrutura nova, pequena e local, que é a preferência de exibição guardada
  no estado da webview, mais os tipos derivados que as funções puras devolvem, como a lista de razões
  de bloqueio e o rótulo de estágio. Nada disso é persistido em disco nem atravessa o canal.
- Detalhe completo em: `_reversa_forward/003-painel-do-processo/data-delta.md`

## 7. Delta de contratos externos

Nenhum. O canal entre host e webview é o contrato desta fronteira, já descrito em
`_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md`, e esta feature o consome sem
acrescentar comando, campo ou ordem. Por isso o diretório `interfaces/` não é criado aqui.

Duas consequências pedem registro. A primeira é que a seção 9 daquele contrato deixa de valer no
ponto em que diz que o protocolo ainda não tem consumidor: a partir desta entrega ele tem, e a regra
de acrescentar sem renomear nem remover passa a valer. A segunda é que toda mudança que o painel
viesse a exigir no protocolo teria de acontecer agora, antes da primeira versão instalada, e o plano
não encontrou nenhuma.

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| Canal entre host e webview | mensagem entre processos | `_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md`, sem delta |

## 8. Plano de migração

Não há dado a migrar, e sim uma substituição a executar em ordem, para que o painel nunca fique sem
corpo entre um passo e outro.

1. Acrescentar as dependências, a segunda configuração de compilador, o empacotador e o podador, e
   provar a fronteira de compilação e a poda antes de escrever componente
2. Escrever as funções puras e suas suítes, que não dependem de componente algum
3. Escrever os componentes e a folha de estilo, verificando por renderização em servidor
4. Escrever o módulo único de mensagens e a entrada do bundle
5. Trocar o corpo em `src/host/panel.ts`, ajustar a ativação e só então remover
   `src/host/provisional.ts`
6. Atualizar as três suítes do host que citam o arquivo removido ou a ausência de empacotador, e
   declarar o kit como segunda origem de padrão em `PROCEDENCIA.md`

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| A poda descartar token que a folha alcança apenas por caminho indireto, e a tela perder cor sem erro | alto | baixo | O fecho transitivo é o que existe contra isso, e D-16 interrompe a construção quando o fecho vem vazio; a medida deste repositório reteve 26 tokens de 959 sobre uma semente de 26, o que confirma que o fecho fecha |
| O bundle crescer além do orçamento sem que ninguém perceba, porque o teto verificado é da feature 005 | baixo | médio | Uma ação de fechamento mede o tamanho e registra o número em `progress.jsonl`, sem interromper a construção; a medida de partida é 21 KB de tokens sobre 486 KB brutos |
| Defeito visual atravessar a suíte verde, como ocorreu três vezes no kit de origem | médio | alto | A renderização em servidor prova ordem, texto e estado; a repintura e a medida ficam nas duas metades de D-23; a captura dos sete estados é dívida nomeada, herdada pela feature 005 |
| A política do documento bloquear estilo ou recurso em tempo de execução, dentro do editor | médio | médio | A decisão D-11 proíbe estilo em linha desde a primeira linha de código, e uma suíte verifica que o corpo aponta script e folha por endereço resolvido pelo editor |
| A importação de tipo entre webview e host não passar na verificação, por causa da extensão explícita e da raiz do projeto | baixo | médio | D-21 fixa a forma da configuração, e o passo 1 do plano de migração prova a fronteira antes de existir componente |
| O protocolo revelar falta só quando a tela existir, e ele congelar logo depois | alto | baixo | A ordem do plano escreve as funções puras contra a forma do protocolo antes dos componentes, o que expõe falta de campo cedo |
| A troca do corpo deixar o painel sem tela numa etapa intermediária | baixo | médio | O passo 5 do plano de migração remove o arquivo provisório somente depois que o corpo real está montado e a suíte do provedor está verde |
| O podador divergir do kit sem que ninguém note, na próxima ressincronização | baixo | médio | D-22 nomeia a origem no cabeçalho do arquivo e em `PROCEDENCIA.md`, que é onde o ritual da feature 004 procura |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)
- [ ] Cobertura de 100% de linhas nas seis funções puras de decisão de D-10
- [ ] A suíte de fronteiras da webview verde: nenhuma importação de valor vinda do host, uma única
      chamada de envio e um único registro de ouvinte, ambos no módulo de mensagens
- [ ] `src/host/provisional.ts` removido e as três suítes do host que o citavam atualizadas
- [ ] Um comando único produz host e bundle, e a verificação de tipos da webview recusa importação
      de módulo de plataforma
- [ ] Os quatro conjuntos de cor saem podados, o relatório da poda nomeia o que descartou, e o fecho
      vazio interrompe a construção
- [ ] Tamanho do bundle medido e registrado em `progress.jsonl`
- [ ] O kit declarado como segunda origem de padrão em `src/heranca/PROCEDENCIA.md`

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-plan` | reversa |
| 2026-09-09 | Regeneração após a revisão do `audit/cross-check.md`: D-02 revertida, D-10 e D-14 reescritas, D-15 a D-23 acrescentadas, divergência da seção 4 encerrada, delta arquitetural e critério de pronto ajustados | reversa |
