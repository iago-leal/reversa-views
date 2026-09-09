# Regression watch: painel do processo

> Identificador da feature: `003-painel-do-processo`
> Data da criação: `2026-09-09`
> Gerado por: `/reversa-coding`

**Feature greenfield.** Segue não havendo extração `/reversa` sobre este repositório, e sem extração
não há regras 🟢 a vigiar: o watch principal nasce vazio por definição, e não por omissão. É o mesmo
estado em que as features 001 e 002 deixaram os seus.

O que esta entrega implementa ganha peso de regressão quando uma extração futura sobre este código o
confirmar como 🟢. Até lá, os requisitos ficam na seção "Observações", como registro do que essa
extração precisará reencontrar.

Os identificadores continuam a numeração: a feature 001 usou `W001` a `W018`, a 002 usou `W019` a
`W041`, e esta usa `W042` em diante. Nenhum identificador antigo foi reciclado nem reescrito.

## Watch

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|-------------------------|-----------------------------|---------------------|-------------------|
| | | | | |

Vazio. Nenhuma regra 🟢 foi alterada ou removida, porque nenhuma existia.

## Histórico de re-extrações

| Data | Extração | Itens conferidos | Itens violados |
|------|----------|------------------|----------------|
| | | | |

Vazio. Será preenchido pelo agente reverso quando `/reversa` rodar sobre este repositório.

## Arquivadas

| ID | Motivo do arquivamento | Data |
|----|------------------------|------|
| | | |

Vazio.

## Observações

Sem peso de regressão. São os requisitos que esta entrega implementa e o que uma extração futura
precisaria reencontrar para confirmá-los. Os identificadores são estáveis e serão reciclados quando
algum destes virar item de watch.

| ID | RF | O que a entrega implementou | Onde vive |
|----|----|-----------------------------|-----------|
| W042 | RF-01 | Cinco telas de estado de entrada, cada uma com título próprio, nenhuma em branco | `src/webview/domain/entry.ts`, `src/webview/ui/EntryScreens.tsx` |
| W043 | RF-02 | Cabeçalho com nome do projeto, versão do Reversa, raiz observada, momento da leitura e ação de reler | `src/webview/ui/Header.tsx` |
| W044 | RF-03 | Faixa de bloqueio acima de tudo, derivada de entrega sem adendo, migração aguardando, cada decisão pendente e dúvidas | `src/webview/domain/blocking.ts`, `src/webview/ui/BlockingBanner.tsx` |
| W045 | RF-03a | Cada razão com texto, artefato clicável e comando em bloco copiável, sem que o painel o execute | `src/webview/ui/BlockingBanner.tsx` |
| W046 | RF-04 | As cinco fases da descoberta na ordem canônica, com marca textual que dispensa cor | `src/webview/domain/labels.ts`, `src/webview/ui/DiscoverySection.tsx` |
| W047 | RF-05 | Checkpoints por agente, separando concluído de em andamento, com data quando houver | `src/webview/ui/DiscoverySection.tsx` |
| W048 | RF-06 | Ciclo forward com oito itens, cada um preenchido ou declarado ausente por nome | `src/webview/ui/ForwardSection.tsx`, `src/webview/domain/labels.ts` |
| W049 | RF-07 | Política de escrita no legado com o veredito vigente e as seis pastas próprias do Reversa | `src/webview/ui/PolicySection.tsx` |
| W050 | RF-08 | Toda anomalia com arquivo, código e detalhe, e a declaração de leitura íntegra ou degradada no cabeçalho | `src/webview/domain/integrity.ts`, `src/webview/ui/AnomaliesSection.tsx` |
| W051 | RF-09 | Relatório da sonda com raiz lida, pasta da feature, caminhos recusados e arquivos truncados | `src/webview/ui/ProbeSection.tsx` |
| W052 | RF-10 | Abertura de artefato por mensagem à ponte, com caminho relativo à raiz observada, sem componente falando com o host | `src/webview/bridge/messaging.ts`, `src/webview/ui/` |
| W053 | RF-11 | Tema do editor lido por token da classe do corpo, inclusive os dois de alto contraste, repintando sem releitura | `src/webview/theme/contrast.ts`, `src/webview/theme/primer-themes.ts` |
| W054 | RF-12 | Seções recolhíveis, com a preferência guardada no estado da webview | `src/webview/domain/preferences.ts`, `src/webview/ui/CollapsibleSection.tsx` |
| W055 | RF-13 | Estado de entrada, razões de bloqueio, rótulos e ordem das seções em funções puras fora dos componentes | `src/webview/domain/` |
| W056 | RF-14 | Ordem das seis seções declarada uma vez e desestruturada pela composição, nunca repetida | `src/webview/domain/sections.ts`, `src/webview/ui/App.tsx` |
| W057 | RF-15 | Lugar da ação de despacho nomeado e vazio no cabeçalho, sem botão desenhado | `src/webview/ui/Header.tsx` |
| W058 | RF-16 | Aviso do terceiro comando do canal exibido sem substituir o conteúdo da tela | `src/webview/bridge/messaging.ts`, `src/webview/ui/App.tsx` |
| W059 | RF-17 | Um envio e um registro de ouvinte, ambos no módulo de ponte, com a interface do host tomada uma vez | `src/webview/bridge/messaging.ts` |
| W060 | RF-18 | Corpo provisório da feature 002 removido, gerador de documento preservado com política e nonce | `src/host/panel.ts`, `src/host/provider.ts` |
| W061 | RF-19 | Mensagem desconhecida do host ignorada, registrada pelo comando de log, sem mudança de tela | `src/webview/bridge/messaging.ts`, `src/webview/bridge/log.ts` |
| W062 | RF-20 | Falha de renderização isolada por seção, com a linha técnica no log e as demais seções de pé | `src/webview/ui/ErrorBoundary.tsx`, `src/webview/ui/App.tsx` |
| W063 | RF-21 | Dez anomalias na exibição inicial, com o total e o controle para ver o resto | `src/webview/ui/AnomaliesSection.tsx` |
| W064 | RF-22 | Padrão inicial de exibição sem preferência guardada, com a de anomalias aberta quando a leitura degradou | `src/webview/domain/sections.ts` |
| W065 | RF-23 | Segunda unidade de compilação e empacotamento do bundle, com o módulo do editor inalcançável na webview | `tsconfig.webview.json`, `scripts/build-webview.js`, `types/` |
| W066 | RF-24 | Poda dos tokens por fecho transitivo sobre a folha, com guarda contra fecho vazio | `scripts/theme-tokens.js`, `src/webview/theme/theme.css` |
| W067 | RN-01 | Toda decisão de apresentação em função pura, e nenhum módulo de domínio importando React | `src/webview/domain/`, `tests/webview-boundaries.spec.ts` |
| W068 | RN-02 | A webview não lê disco, não faz requisição e não conhece caminho de arquivo do Reversa | `tsconfig.webview.json`, `tests/webview-boundaries.spec.ts` |
| W069 | RN-03 | Exatamente um módulo da webview toca a interface do host, tomada uma única vez por painel | `src/webview/bridge/messaging.ts` |
| W070 | RN-04 | Estágio, fase e estado de entrada como valores de vocabulário fechado, em tipo união | `src/webview/domain/types.ts`, `src/webview/domain/labels.ts` |
| W071 | RN-05 | Valor fora do vocabulário volta bruto e marcado como desconhecido, sem quebrar a renderização | `src/webview/domain/labels.ts` |
| W072 | RN-06 | Havendo anomalia, recusa ou truncamento, o cabeçalho anuncia a degradação e a seção abre | `src/webview/domain/integrity.ts`, `src/webview/ui/Header.tsx` |
| W073 | RN-07 | Nenhuma notificação, nenhum diálogo e nenhuma mudança de foco partem do painel | `src/webview/ui/ErrorBoundary.tsx`, `tests/webview-boundaries.spec.ts` |
| W074 | RN-08 | A releitura preserva o conteúdo anterior e o cabeçalho apenas marca que relê | `src/webview/domain/entry.ts` |
| W075 | RN-09 | O painel não guarda o processo, só a preferência de exibição | `src/webview/domain/preferences.ts`, `src/webview/main.tsx` |

Quatro observações sobre o que uma extração futura vai encontrar e precisa ler com cuidado.

A primeira é que o protocolo do canal e o formato da linha de log aparecem declarados duas vezes, uma
de cada lado da fronteira. Isso não é duplicação por descuido: a fronteira de compilação que sustenta
RN-02 impede a webview de importar qualquer coisa do host, e o preço dela é essa redeclaração, cuja
divergência está prendida por teste. Uma extração que proponha unificar os dois lados estará
propondo derrubar a fronteira.

A segunda é que `src/webview/domain/integrity.ts` não estava no plano. Ele nasceu durante a execução,
quando a mesma contagem de anomalia, recusa e truncamento apareceu em três lugares, e existe para que
o cabeçalho, a abertura padrão da seção e o aviso de degradação leiam do mesmo cálculo.

A terceira é que a preferência de exibição, quando chega malformada, é descartada em silêncio na
tela e registrada no log, e a linha de log vive em `main.tsx`, não no leitor. A razão é que só a
casca detém a porta de escrita de estado, e o leitor precisa continuar puro para ser exercitável sem
navegador.

A quarta é que a verificação visual segue pendente, como já estava na feature 002: o contêiner não
tem interface gráfica, e a renderização em servidor substitui a captura de tela. Os trinta cenários
de aceitação estão cobertos por 487 casos em 42 arquivos, mas o painel ainda não foi visto aberto
dentro do editor, e os passos manuais do `onboarding.md` continuam por fazer.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-coding` | reversa |
