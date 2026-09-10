# Vigilância de regressão: 007-atualizacao-e-progresso

**Data:** 2026-09-09
**Feature:** `007-atualizacao-e-progresso`
**Cenário:** greenfield.

Este projeto não tem extração de `/reversa`: o contexto vem de `_reversa_sdd/prd.md` e das cinco
specs de `_reversa_sdd/sdd/`. Não há regra 🟢 confirmada sobre código existente, e por isso o
watch principal nasce vazio. O que esta entrega deixou de verdades a manter está em
"Observações", sem peso de regressão. Elas ganham peso quando uma `/reversa` futura, rodando
sobre o código novo, confirmar cada uma como 🟢.

## Watch principal

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|---|---|---|---|---|
| | | | | |

Vazio nesta rodada. Nenhuma regra extraída de código existente foi alterada ou removida, porque
nenhuma foi extraída ainda.

## Histórico de re-extrações

Vazio. Será preenchido pelo agente reverso quando `/reversa` rodar de novo sobre este código.

## Arquivadas

Vazio.

## Observações

Sem peso de regressão. São os requisitos funcionais que esta entrega implementou, com o lugar
onde cada um vive e o sinal pelo qual uma extração futura perceberia que deixou de ser verdade.

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|---|---|---|---|---|
| W001 | `requirements.md` RF-01, `scripts/atualizar.js` | A conferência busca as referências sem alterar a árvore de trabalho | ausência | `git status` diferente antes e depois de `npm run atualizar` |
| W002 | `requirements.md` RF-02, `scripts/atualizar.js` | Três desfechos nomeados com três códigos de saída: zero em dia, um atrasada, dois impossível | redação | Dois desfechos com o mesmo código, ou mensagem sem o que fazer a seguir |
| W003 | `requirements.md` RF-03, `scripts/atualizar.js`, `scripts/git.js` | A impossibilidade nomeia a causa (sem clone, sem remoto, git ausente, sem rede) e termina em dez segundos sem rede | presença | Comando travado sem rede, ou causa genérica |
| W004 | `requirements.md` RF-04, `scripts/atualizar.js` | Sem `--aplicar` nada é incorporado; com ele, é | presença | Conferência que traz commit, ou argumento além de `--aplicar` aceito em silêncio |
| W005 | `requirements.md` RF-05, `scripts/atualizar.js` | Árvore suja ou commit local à frente recusam ANTES de qualquer escrita, nomeando o que encontraram | ausência | Incorporação sobre arquivo modificado ou sobre commit próprio |
| W006 | `requirements.md` RF-06, `scripts/atualizar.js` | Incorporação, `npm ci` só se o lock mudou, construção, suíte e empacotamento, nessa ordem, parando na primeira falha | redação | Empacotamento após suíte vermelha, ou ordem trocada |
| W007 | `requirements.md` RF-07, `scripts/atualizar.js` | A linha `code --install-extension <pacote>` é impressa com o nome gerado; sem editor no caminho, termina em sucesso | presença | Falha por ausência do executável do editor |
| W008 | `requirements.md` RF-08, `scripts/atualizar.js`, `src/webview/domain/labels.ts` | O commit curto do terminal e o do painel têm sete caracteres e a mesma regra | redação | Comprimentos diferentes entre `encurtar` e `revisionLabel` |
| W009 | `requirements.md` RF-09, `src/host/net.ts`, `src/host/provider.ts` | A consulta parte do host, pelo canal existente, por acréscimo ao protocolo; a tela não abre conexão e sua política continua sem `connect-src` | ausência | Endereço de rede ou cliente de requisição dentro do pacote da webview |
| W010 | `requirements.md` RF-10, `src/webview/ui/Header.tsx` | O cabeçalho declara o desfecho em texto distinto por estado, com `data-update` que o nomeia | presença | Linha vazia ao lado do rótulo, ou dois estados com o mesmo texto |
| W011 | `requirements.md` RF-11, `src/host/provider.ts` | Uma consulta por leitura, cinco segundos de limite, sem retentativa automática | ausência | Segunda requisição sem gesto de reler |
| W012 | `requirements.md` RF-12, `src/host/provider.ts`, `src/webview/domain/entry.ts` | O processo é desenhado antes; o desfecho chega depois, e o anterior fica na tela até então | presença | Painel esperando a origem para desenhar, ou linha do desfecho piscando na releitura |
| W013 | `requirements.md` RF-13, `src/host/net.ts` | A requisição leva só `Accept` e `User-Agent`, sem corpo, sem credencial, sem identificador de máquina ou workspace | ausência | Qualquer cabeçalho ou corpo além dos dois |
| W014 | `requirements.md` RF-14, `src/host/adapters.ts`, `src/host/update.ts` | A chave `reversaViews.conferirAtualizacao` em falso impede a requisição, e o cabeçalho diz "desligada", nunca "em dia" | redação | Requisição com a chave em falso, ou frase de desligada que sugira estar em dia |
| W015 | `requirements.md` RF-15, `src/host/update.ts` | 404 da comparação é `commit-desconhecido`, distinto de atrasada e de em dia; o código HTTP é lido antes do corpo | redação | 404 caindo em `resposta-inesperada` por causa do campo `status` textual do corpo |
| W016 | `requirements.md` RF-16, `src/host/update.ts` | 403 e 429 são `impossivel` com causa `limite-de-taxa`, distinta de `sem-rede` | redação | Limite de taxa com a mesma frase de ausência de rede |
| W017 | `requirements.md` RF-17, `src/host/protocol.ts`, `src/webview/ui/Header.tsx` | Versão e commit curto no cabeçalho, com o commit inteiro em `data-full`; os dois viajam em `SetProcessData` | presença | Item de procedência em branco, ou commit encurtado na origem |
| W018 | `requirements.md` RF-18, `scripts/versao.js` | Versão `0.<maior adendo>.<commits desde o commit que acrescentou esse adendo>` | redação | Segundo número igual à quantidade de adendos, ou terceiro contado do último toque no arquivo |
| W019 | `requirements.md` RF-19, `scripts/versao.js`, `scripts/git.js` | Adendo intermediário apagado não faz a versão recuar; o commit de acréscimo é o mais ANTIGO do histórico do arquivo | redação | Versão menor entre duas construções do mesmo clone |
| W020 | `requirements.md` RF-20, `scripts/empacotar.js` | A versão derivada é escrita no manifesto em torno do empacotador e o pacote sai nomeado por ela | presença | Pacote nomeado pelo valor de espera do manifesto |
| W021 | `requirements.md` RF-21, `scripts/versao.js`, `scripts/empacotar.js` | Fora de clone ou sem adendo, recua para `0.0.0` e imprime a causa | presença | Número inventado, ou recuo silencioso |
| W022 | `requirements.md` RF-22, `README.md` | Seção própria do ritual com os dois atos, os desfechos, a recusa da árvore suja e a regra da versão | presença | README sem a seção, ou seção sem um dos quatro itens |
| W023 | `requirements.md` RF-23 a RF-25, `src/webview/domain/decomposition-view.ts` | Abertas na ordem do plano encabeçam; fechadas por recência decrescente, estável em empate; sem instante ao fim do bloco, na ordem do arquivo | redação | Fechada recente abaixo de fechada antiga, ou empate reordenado entre releituras |
| W024 | `requirements.md` RF-27, `src/webview/ui/DecompositionSection.tsx` | A barra da decomposição usa a contagem herdada, e não o comprimento da lista recortada | redação | Barra encolhendo quando o recorte esconde fechadas |
| W025 | `requirements.md` RF-28, `src/webview/ui/ForwardSection.tsx` | A barra do ciclo forward concorda com os pares de fechadas e abertas do cartão | redação | Barra e pares com números diferentes |
| W026 | `requirements.md` RF-29, `src/webview/ui/HistorySection.tsx` | A barra do histórico mede convergidas sobre o total DECLARADO, com a frase que conta ao lado | redação | Denominador igual às entradas listadas sob truncamento, ou frase ausente |
| W027 | `requirements.md` RF-30, `src/webview/ui/ProgressBar.tsx` | Um componente só, chamado pelos três cartões | ausência | Segundo trecho de barra em cartão |
| W028 | `requirements.md` RF-31, `src/webview/ui/ProgressBar.tsx` | `role="progressbar"` com mínimo, máximo (o total, não cem), valor corrente e texto equivalente que repete a contagem escrita | presença | Atributo faltando, ou máximo em cem |
| W029 | `requirements.md` RF-32, `src/webview/theme/theme.css` | Trilho e preenchimento só com tokens do Primer nomeados na folha; nenhuma dependência nova | ausência | Cor literal na barra, ou pacote novo no lock |
| W030 | `requirements.md` RF-33, `src/webview/ui/ProgressBar.tsx`, `tests/webview-progress-cards.spec.tsx` | Denominador zero e cartão sem leitura não desenham barra; divergência mantém o aviso e a barra segue a contagem | presença | Barra cheia sobre total zero, ou aviso de divergência sumindo |
| W031 | `requirements.md` RN-09, `src/webview/main.tsx` | O desfecho não é escrito no estado que o editor guarda nem em preferência: descreve este instante | ausência | `writeState` carregando `update` |

### Limitações e escolhas conhecidas

Não são requisitos, e sim decisões que uma extração futura leria como estranheza se não
estivessem escritas.

| ID | Origem (arquivo, seção) | Escolha registrada | Tipo de verificação | Sinal de que precisa mudar |
|---|---|---|---|---|
| W032 | `src/host/protocol.ts`, `interfaces/delta-do-canal.md` | `SetProcessData` ganhou `extensionVersion` e `builtFromCommit`, contra o delta do canal, por causa de RF-17 e da fronteira que proíbe a tela de importar valor do host. `/reversa-sync` deve emendar o delta | redação | Delta do canal e protocolo dizendo coisas diferentes |
| W033 | `src/webview/domain/decomposition-view.ts` | O recorte é PREFIXO da ordem unificada: em trilha sem instante algum, as cinco fechadas exibidas são as PRIMEIRAS do arquivo, e não as últimas como antes | presença | Usuário de projeto sem trilha estranhando as fechadas mostradas |
| W034 | `src/host/build.ts`, `scripts/gerar-carimbo-da-construcao.js` | `DEFAULT_BRANCH` é a quarta constante do carimbo, recuando para `master`; ler o ramo em tempo de execução seria a leitura que RN-05 proíbe | presença | Origem cujo ramo padrão não é o do clone no momento da construção |
| W035 | `package.json` | `pretest` gera o carimbo porque `extension.ts` importa arquivo não versionado; sem isso um clone novo reprova em `npm test` antes do primeiro `build` | presença | Suíte reprovando num clone recém-feito por falta de `src/host/build.ts` |
| W036 | `src/webview/domain/entry.ts`, `src/webview/ui/Header.tsx` | `update` nulo não é oitavo estado: é ausência, e não desenha linha. Workspace sem pasta nunca recebe desfecho, e um cabeçalho dizendo "consultando" ali descreveria consulta que não acontece | ausência | Linha do desfecho em tela sem leitura por trás |
| W037 | `src/webview/ui/HistorySection.tsx` | O numerador da barra do histórico conta as convergidas ENTRE AS LIDAS; sob o teto de cinquenta pastas ele é limite inferior, e o aviso de truncamento explica a diferença | presença | Projeto acima do teto com barra menor do que a realidade sem aviso ao lado |
| W038 | `src/webview/ui/ProgressBar.tsx` | A barra é SVG, com a largura em atributo de apresentação, porque `style-src` do painel não concede estilo em linha e classes só dariam passos grosseiros | ausência | Largura voltando para atributo `style`, que a política descarta sem erro visível |
| W039 | `scripts/atualizar.js`, `scripts/git.js` | O atualizador reconhece `ErroDeGit` pelo NOME além de `instanceof`, porque a suíte carrega os módulos por ES e por CommonJS e as duas cópias da classe não se reconhecem | redação | Erro do git escapando como exceção crua no atualizador |
| W040 | `scripts/preview/leitura.js`, `scripts/preview/cliente.js` | O desfecho forçado viaja num bloco "depois" que o cliente segura por ao menos 800 ms; sem isso "consultando" nunca seria visto. O preview não consulta a origem de verdade | presença | Desfecho aparecendo antes do estado em curso, ou preview abrindo conexão |
| W041 | `src/webview/theme/theme.css`, `scripts/theme-tokens.js` | O podador de tokens alcança só os temas de cor do Primer; token de tipografia (`--fontStack-monospace`) não chega ao pacote e por isso não é usado | ausência | `var(--fontStack-*)` na folha, que ficaria sem valor no pacote |

### O que a próxima extração deve confirmar

As trinta e uma observações e as dez escolhas acima descrevem comportamento coberto por suíte
(1123 casos verdes em 75 arquivos ao fim desta entrega), mas cobertura não é extração: nenhuma
delas foi lida de volta a partir do código por um agente reverso. A primeira `/reversa` sobre este
repositório é o que as promove a 🟢 e lhes dá peso de regressão.
