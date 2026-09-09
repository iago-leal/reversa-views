# Legacy impact: painel do processo

> Identificador da feature: `003-painel-do-processo`
> Data da execução: `2026-09-09`
> Gerado por: `/reversa-coding`

**Feature greenfield, sem legado pré-existente. Âncora: `prd.md` + specs SDD.**

Continua não havendo extração `/reversa` sobre este repositório: não existem `architecture.md` nem
`domain.md` em `_reversa_sdd/`, e o impacto abaixo mede-se contra as specs em `_reversa_sdd/sdd/` e
contra os dois adendos já vigentes, das features 001 e 002, que são a fonte sobre o que existia em
código antes desta entrega.

A esmagadora maioria das entradas é componente novo, e a coluna de tipo reflete isso. Fogem à regra
dez arquivos: nove que as features 001 e 002 criaram e esta alterou, classificados como
`regra-alterada`, e um que esta entrega apagou, `src/host/provisional.ts`, classificado como
`componente-extinto`, exatamente o desfecho que RF-18 pedia e que o cabeçalho daquele arquivo já
anunciava desde a feature 002.

## Política de edição do legado no momento da execução

| Campo | Valor lido em `.reversa/reversa-config.json` |
|---|---|
| `allowLegacyEdits` | `true` |
| `allowedPaths` | vazio |
| Efeito | Liberação irrestrita: todo caminho do projeto estava gravável |

A liberação foi avisada uma vez na sessão, como a política manda. Nenhum caminho foi recusado nesta
rodada. A única deleção de arquivo pré-existente, a de `src/host/provisional.ts`, estava prevista
por escrito em RF-18, no `roadmap.md` e na ação T045 do `actions.md`, e o arquivo removido é o único
do host que a feature 002 declarou descartável por contrato.

## Arquivos afetados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/webview/domain/entry.ts` | Decisões puras (`_reversa_sdd/sdd/painel-do-processo.md#6`, RF-01, RF-13) | componente-novo | HIGH | Escolhe qual das cinco telas o painel desenha; um engano aqui apaga o conteúdo inteiro, e é ele que sustenta RN-08 ao não descartar o processo anterior durante a releitura |
| `src/webview/domain/blocking.ts` | Decisões puras (`#6`, RF-03, RF-03a) | componente-novo | HIGH | É a resposta à pergunta que motivou a feature; razão omitida aqui é bloqueio que o usuário não vê, e a ordem das quatro origens é contrato de leitura |
| `src/webview/domain/labels.ts` | Decisões puras (`#6`, RF-04, RF-06) | componente-novo | MEDIUM | Traduz estágio, fase e checkpoint sem quebrar diante de valor desconhecido, que é o que RN-05 exige |
| `src/webview/domain/sections.ts` | Decisões puras (`#6`, RF-14, RF-22) | componente-novo | MEDIUM | Única fonte da ordem das seis seções e do padrão inicial de recolhimento; a preferência guardada vence o padrão, e não o contrário |
| `src/webview/domain/preferences.ts` | Preferência de exibição (`#9-modelo-de-dados`, RF-12) | componente-novo | MEDIUM | Leitor total do único dado que o painel guarda; entrada malformada volta como preferência vazia em vez de derrubar a tela |
| `src/webview/domain/integrity.ts` | Decisões puras (`#6`, RF-08, RF-22) | componente-novo | MEDIUM | Não estava previsto no plano: nasceu para contar anomalia, recusa e truncamento num lugar só, depois que a mesma contagem apareceu no cabeçalho, na abertura padrão da seção e no aviso de degradação |
| `src/webview/domain/types.ts` | Contrato do fio (`#9-modelo-de-dados`) | componente-novo | LOW | Redeclara o protocolo da feature 002 do lado da webview, que é o preço de a fronteira de compilação impedir o import; divergir daqui quebra o canal em silêncio |
| `src/webview/bridge/messaging.ts` | Ponte da webview (`#6`, RF-17, RF-19) | componente-novo | HIGH | Único módulo que toma a interface do host e o único que escuta; comando desconhecido morre aqui, registrado, sem tocar a tela |
| `src/webview/bridge/log.ts` | Formato da linha de log (`#6`, RF-19) | componente-novo | LOW | Redeclara o formato de origem, ato e motivo em vez de importá-lo do host, pela mesma fronteira que obrigou a redeclarar o protocolo |
| `src/webview/main.tsx` | Casca do painel (`#8`, RF-11, RF-12, RF-22) | componente-novo | HIGH | Detém as três portas do navegador, monta a árvore e é onde a preferência descartada vira linha de log, porque só ele conhece a porta de escrita de estado |
| `src/webview/ui/App.tsx` | Composição (`#8`, RF-14, RF-20) | componente-novo | HIGH | Desestrutura a ordem declarada em vez de repeti-la, e envolve cada seção no seu próprio limite; é onde o isolamento de falha acontece ou deixa de acontecer |
| `src/webview/ui/ErrorBoundary.tsx` | Isolamento de falha (`#11`, RF-20) | componente-novo | HIGH | Converte defeito de uma seção em aviso local e linha técnica no log; sem ele um erro apaga as outras cinco |
| `src/webview/ui/BlockingBanner.tsx` | Faixa de bloqueio (`#8`, RF-03, RF-03a) | componente-novo | HIGH | Desenha cada razão com texto, alvo clicável e comando copiável, sem executar comando algum |
| `src/webview/ui/Header.tsx` | Cabeçalho (`#8`, RF-02, RF-15) | componente-novo | MEDIUM | Carrega a identidade, a marca de integridade e o lugar nomeado e vazio da ação de despacho |
| `src/webview/ui/EntryScreens.tsx` | Telas de estado (`#8`, RF-01) | componente-novo | MEDIUM | Nenhuma das cinco é tela vazia, e as de sem Reversa e de erro trazem bloco copiável e ação de repetir |
| `src/webview/ui/CollapsibleSection.tsx` | Seção recolhível (`#8`, RF-12, RF-22) | componente-novo | MEDIUM | Casca única das seis seções, com título, contagem e o atributo que expõe o estado recolhido à verificação |
| `src/webview/ui/ForwardSection.tsx` | Ciclo forward (`#8`, RF-06) | componente-novo | MEDIUM | Oito itens, cada um preenchido ou declarado ausente por nome, nunca em branco |
| `src/webview/ui/DiscoverySection.tsx` | Descoberta (`#8`, RF-04, RF-05) | componente-novo | MEDIUM | As cinco fases sempre presentes, com marca textual além da cor, e os checkpoints separados por conclusão |
| `src/webview/ui/PolicySection.tsx` | Política (`#8`, RF-07) | componente-novo | MEDIUM | Diz o veredito vigente e lista as seis pastas próprias do Reversa mesmo com a edição desligada |
| `src/webview/ui/AnomaliesSection.tsx` | Anomalias (`#8`, RF-08, RF-21) | componente-novo | MEDIUM | Mostra as dez primeiras, o total e o controle do resto; é a seção que impede o painel de mentir em silêncio |
| `src/webview/ui/ProbeSection.tsx` | Relatório da sonda (`#8`, RF-09) | componente-novo | LOW | Expõe raiz lida, pasta da feature, recusas e truncamentos, dado de diagnóstico sem efeito sobre o resto |
| `src/webview/theme/theme.css` | Tema (`#8`, RF-11, RF-24) | componente-novo | HIGH | Folha única sobre tokens nomeados, sem cor literal; ela é a entrada do fecho transitivo, e cor literal aqui escapa da poda e do tema |
| `src/webview/theme/primer-themes.ts` | Tema (`#10`, RF-11, RF-24) | componente-novo | MEDIUM | Importa os quatro conjuntos de cor e devolve sempre os dois atributos que o sistema de design espera |
| `src/webview/theme/contrast.ts` | Tema (`#8`, RF-11) | componente-novo | MEDIUM | Lê o tema do editor pela classe do corpo do documento, por token e não por substring, e observa a troca por uma porta |
| `scripts/theme-tokens.js` | Poda de tokens (`_reversa_sdd/sdd/empacotamento-e-verificacao.md#6`, RF-24) | componente-novo | HIGH | Decide o que sobra dos quatro conjuntos de cor; fecho vazio serviria o painel sem cor, e por isso a guarda é explícita e nomeada |
| `scripts/build-webview.js` | Empacotamento (`empacotamento-e-verificacao.md#6`, RF-23) | componente-novo | HIGH | Segunda unidade de compilação; sem ela não há bundle e o painel não roda no editor |
| `tsconfig.webview.json` | Fronteira de compilação (`empacotamento-e-verificacao.md#6`, RF-23, RN-02) | componente-novo | HIGH | Torna a interface do editor inalcançável de dentro da webview na verificação de tipos, que é a forma verificável de RN-02 |
| `types/inherited-platform.d.ts`, `types/editor-api-is-out-of-reach.d.ts` | Fronteira de compilação (`empacotamento-e-verificacao.md#6`, RF-23) | componente-novo | MEDIUM | Declaram o que a webview pode e o que não pode enxergar; apagá-los devolve o acesso ao editor sem que nada mais reclame |
| `src/host/panel.ts` | Documento do webview (`ponte-e-host.md#6`, RF-18) | componente-novo | MEDIUM | Corpo definitivo do painel, com folha, raiz e script por nonce; substitui o provisório sem tocar na política de segurança |
| `src/host/provisional.ts` | Corpo provisório (feature 002, RF-19) | componente-extinto | MEDIUM | Apagado por RF-18; era o único módulo do host que continha caminho de arquivo do Reversa, e a exceção escrita na suíte de fronteiras saiu junto |
| `src/host/provider.ts` | Provedor de visão (`ponte-e-host.md#6`, RF-09, RF-18) | regra-alterada | MEDIUM | Passou a receber os dois endereços de recurso e a convertê-los pela interface do editor; a ordem que RN-03 exige não mudou |
| `src/extension.ts` | Ativação (`ponte-e-host.md#6`, RF-02) | regra-alterada | MEDIUM | Declara a pasta do bundle como raiz de recurso permitida e monta os dois endereços; continua sem ler disco na ativação |
| `package.json` | Manifesto e dependências (`empacotamento-e-verificacao.md#6`, RF-23, RF-24) | regra-alterada | MEDIUM | Ganhou React, o empacotador, os tokens do sistema de design, a medida de cobertura e os scripts das duas unidades de compilação, todos em igualdade exata |
| `tsconfig.json` | Configuração do compilador (`empacotamento-e-verificacao.md#6`, RF-23) | regra-alterada | LOW | Passou a excluir a webview e a apontar para a configuração dela, de modo que as duas unidades não se contaminem |
| `vitest.config.ts` | Executor de testes (`empacotamento-e-verificacao.md#6`) | regra-alterada | LOW | Padrão de inclusão ampliado para as suítes de componente e cobertura por instrumentação do motor |
| `tests/host-boundaries.spec.ts`, `tests/host-provider.spec.ts`, `tests/host-manifest.spec.ts` | Verificação local (`empacotamento-e-verificacao.md#6`) | regra-alterada | LOW | Acompanharam a saída do provisório, a entrada dos endereços de recurso e as novas dependências |
| `tests/webview-*.spec.ts`, `tests/webview-*.spec.tsx` | Verificação local (`empacotamento-e-verificacao.md#6`) | componente-novo | MEDIUM | Doze suítes que cobrem os trinta cenários de aceitação e prendem por escrito as fronteiras da webview |
| `tests/helpers/reversa-fixtures.ts` | Verificação local (`empacotamento-e-verificacao.md#6`) | componente-novo | MEDIUM | Cargas de teste fiéis ao modelo herdado; foi onde a divergência entre memória e leitor real apareceu e foi corrigida |
| `tests/host-panel.spec.ts` | Verificação local (`empacotamento-e-verificacao.md#6`, RF-18) | componente-novo | MEDIUM | Prende o corpo definitivo: nonce único, endereço com esquema e nenhum caminho de disco no documento |
| `package-lock.json` | Reprodutibilidade da instalação | regra-alterada | LOW | Consequência das instalações desta feature, todas em igualdade exata |
| `src/heranca/PROCEDENCIA.md` | Procedência da herança (`heranca-e-sincronia.md#6`) | regra-alterada | LOW | Seção nova sobre o kit externo cujo padrão foi adotado sem copiar arquivo algum |

Resumo: 41 entradas. Trinta e duas de tipo `componente-novo`, oito de `regra-alterada` e uma de
`componente-extinto`. Onze em HIGH, vinte e duas em MEDIUM, oito em LOW. Nenhuma em CRITICAL, o que
segue esperado numa feature sem legado a quebrar.

## Diff conceitual por componente

**O painel deixa de ser promessa.** Até aqui a extensão tinha canal, leitura e um corpo provisório
que imprimia o que chegava. Agora tem tela: seis seções ordenadas, cinco estados de entrada, um
cabeçalho com identidade e uma faixa que anuncia quando o processo espera decisão humana. O
provisório saiu inteiro, e com ele a última linha do host que citava caminho de arquivo do Reversa.

**A separação entre decidir e desenhar.** Sete módulos de domínio concentram toda decisão de
apresentação, e nenhum deles importa React. Os onze componentes chamam essas funções e não decidem
nada além de marcação. O efeito prático é que os trinta cenários de aceitação se verificam sem
navegador, por renderização em servidor, e a suíte de fronteiras confere a disciplina lendo os
próprios fontes em vez de confiar na intenção.

**A fronteira da webview.** RN-02 pede que a webview não conheça disco nem interface do editor, e a
forma escolhida foi tornar isso impossível na compilação, e não apenas improvável na revisão: a
segunda configuração desliga os tipos de plataforma e mapeia o módulo do editor para uma declaração
que só existe para falhar. O preço é redeclarar o protocolo e o formato da linha de log do lado de
cá, e ele foi pago por escrito, com a divergência prendida por teste.

**A cor.** O sistema de design entra por quatro conjuntos que somam quase meio megabyte, o que
estouraria o orçamento inteiro do bundle. A poda por fecho transitivo sobre as declarações da folha
reduz isso a doze quilobytes, e a guarda contra fecho vazio existe porque a falha silenciosa dessa
poda seria um painel sem cor alguma. O tema do editor entra por token da classe do corpo, o que
inclui os dois de alto contraste, e a troca repinta sem releitura.

**O isolamento de falha.** Cada seção tem limite próprio. Como a renderização em servidor não
executa limite de erro, a verificação dirige o ciclo de vida diretamente e afirma o isolamento pela
topologia da marcação, que é o que de fato importa: uma seção defeituosa declara a falha e as outras
cinco continuam desenhadas.

**A verificação.** A suíte passou de 213 casos herdados mais o host para 487 casos em 42 arquivos,
sem falha e sem pulo. O bundle final soma 168.359 bytes contra o teto de 409.600, e as quatro
unidades de verificação, tipos do host, tipos da webview, testes e construção, rodam limpas.

## Preservadas

Vazia, e por definição: sem extração `/reversa` sobre este repositório não há regras 🟢 a preservar.
O que esta entrega respeita são os dois adendos vigentes. Nenhum arquivo em `src/heranca/` foi
tocado, e as 213 verificações da feature 001 seguem verdes. Do host da feature 002, a ponte, o
roteador, a leitura, a contenção de caminho e a política de segurança do documento continuam como
estavam: o que mudou foi o corpo servido dentro daquela política, que era a mudança prevista.

## Modificadas

Vazia, pelo mesmo motivo: não havia regra 🟢 a alterar ou remover. As oito alterações e a única
deleção incidem sobre configuração, fiação e um arquivo que a própria feature 002 declarou
descartável, não sobre regra de domínio extraída, e estão todas na tabela acima.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-coding` | reversa |
