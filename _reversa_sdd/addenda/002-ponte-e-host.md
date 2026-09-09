# Adendo: ponte e host da extensão

> Identificador da feature: `002-ponte-e-host`
> Data: `2026-09-09`
> Cenário: `greenfield`
> Gerado por: `/reversa-sync`

Este adendo é uma ponte. A extração em `_reversa_sdd/` descreve o produto como ele foi
especificado, e a entrega da feature 002 já mudou o repositório: onde a spec do componente fala em
futuro, há código, e em três pontos o código foi além do que ela previa. O que segue diz como ler
cada artefato da extração enquanto a re-extração não vem.

## Vigência

Vigente desde 2026-09-09.

## Resumo da entrega

A feature entrega o lado da extensão que roda em Node: registra o painel na barra de atividades,
resolve qual raiz do workspace observar, chama a camada de leitura da feature 001 e conversa com a
webview por um canal de mão dupla. O problema que ela resolve é de fronteira, porque a webview não
toca o disco: tudo o que a tela mostra chega por mensagem, e tudo o que ela pede sai por mensagem.
Sem um lugar único para essa travessia, o protocolo se espalharia e deixaria de ser verificável.

A decisão que ordena o desenho é que apenas dois arquivos conhecem o editor, `src/extension.ts` e
`src/host/adapters.ts`. Nos outros dez módulos a interface do editor entra por parâmetro, e é isso
que torna todo o host exercitável em Node puro, sem apelido de módulo na configuração do executor.
As dez suítes foram escritas antes dos módulos que as satisfazem.

**31 ações concluídas de 32 previstas**, conforme `actions.md` e as 33 linhas de `progress.jsonl`.
A suíte fecha com 29 arquivos, 308 casos, nenhuma falha e nenhum pulo, dos quais 93 casos são
desta feature. Uma ação continua aberta, e por isso **esta é uma sincronização parcial**: T031
pede percorrer os passos 6 a 11 do `onboarding.md` na janela de desenvolvimento do editor, e o
ambiente da execução não tem interface gráfica. Quando ela fechar, uma reexecução do
`/reversa-sync` acrescenta a seção de atualização correspondente a este arquivo.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/prd.md` | `#4-escopo-in` | componente-novo | O painel deixou de ser promessa de tela: existe contêiner na barra de atividades, visão de webview dentro dele e canal preenchendo essa visão. Falta o desenho do painel, que é a feature 003. |
| `_reversa_sdd/prd.md` | `#6-restricoes` | componente-novo | As três restrições ganharam guarda executável no host. Nenhuma escrita de arquivo, nenhuma requisição de rede e política de documento sem avaliação dinâmica são hoje asserções da suíte de fronteiras e da suíte do documento, e não mais intenções. |
| `_reversa_sdd/prd.md` | `#10-evolucao-prevista-disparar-agentes-pelo-painel` | componente-novo | O lugar do despacho já está reservado no protocolo. O comando existe declarado, recebê-lo produz rejeição registrada que o nomeia reservado, e implementá-lo será escrever um tratador, não reformar o canal. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#6-requisitos-funcionais` | componente-novo | Os treze requisitos da seção estão implementados em `src/host/` e `src/extension.ts`. Leia-os como contrato cumprido, não como plano. O `requirements.md` da feature acrescentou três, RF-18 a RF-20, que fixam o mínimo de manifesto, o documento provisório e a injeção por parâmetro. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#7-requisitos-nao-funcionais` | componente-novo | RNF-04 ganhou prova executável: a suíte de fronteiras conta as chamadas no próprio fonte e falha se houver mais de uma de cada. RNF-01, o teto de um segundo entre o pronto e os dados, ainda não foi medido de ponta a ponta, e depende da verificação manual pendente. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#9-modelo-de-dados` | delta-de-dados | **Leia esta seção com o `data-delta.md` da feature ao lado.** Três acréscimos, nenhuma remoção: a carga de dados passou de três campos para seis, ganhando estado de entrada, raiz observada e raízes ignoradas; existe um terceiro comando do host, o de aviso, para o arquivo que sumiu; e os cinco estados de entrada, que a seção citava em comentário e só em três, viraram um tipo união do arquivo de protocolo. |
| `_reversa_sdd/sdd/ponte-e-host.md` | arquivo inteiro, como contrato entre a 002 e a 003 | delta-de-contrato-externo | O canal deixou de viver só na spec. A descrição normativa dele, com carga, resposta, erro, idempotência e ordem obrigatória, está em `_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md`, e é essa a fonte que a feature 003 deve consumir. O protocolo ainda não está congelado, e a razão está registrada ali: o único consumidor dele ainda não existe. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#10-integracoes-e-dependencias` | componente-novo | A dependência do componente `leitura-do-processo` está exercida por chamada de função sobre a saída compilada. A dependência do `painel-do-processo`, que a tabela marca como obrigatória, deixou de bloquear esta entrega: um documento provisório sinaliza pronto e imprime o que chega, e a feature 003 o substitui trocando uma chamada. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#11-edge-cases-e-tratamento-de-erros` | componente-novo | Os nove casos de EC-01 a EC-09 têm código e teste. A entrega acrescentou um décimo que a seção não previa: o editor descarta em silêncio toda mensagem enviada a webview oculta, ainda que o contexto seja retido, e o desenho responde marcando releitura pendente e executando-a no retorno da visibilidade. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#12-seguranca-e-privacidade` | componente-novo | As duas superfícies estão fechadas por reúso, e não por código novo. A contenção de caminho é `resolveInside`, herdada da sonda, e a suíte confere no fonte que o host não escreveu comparação própria. A política do documento é mais restrita que a da origem do kit, sem a cláusula de avaliação dinâmica. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#14-open-questions` | componente-novo | Duas das três questões foram fechadas pela entrega. OQ-02 resolveu-se por contêiner próprio na barra de atividades, e OQ-03 pelo comando de paleta, que existe e é a mesma função do botão. OQ-01, o seletor de raiz havendo várias com instalação, continua aberta e adiada até o caso ocorrer. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#15-decisoes-tomadas-decision-log` | componente-novo | As cinco decisões da seção foram exercidas e não apenas registradas. A elas somam-se quinze decisões técnicas do `roadmap.md` da feature, das quais duas merecem leitura conjunta com a spec: a mensagem de dados unifica processo e estado de entrada, e a porta de mensagens tem de propósito a forma estrutural do objeto de webview do editor. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#6-requisitos-funcionais` | componente-novo | Os cinco estados de entrada que o painel precisa desenhar já chegam nomeados, e o caminho de erro já entrega mensagem em vez de tela em branco. Ao escrever a feature 003, leia o contrato do canal antes desta seção. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#9-modelo-de-dados` | delta-de-dados | O que o painel receberá tem forma fixada em `src/host/protocol.ts`, e ela é mais rica que a descrita aqui: seis campos na carga de dados, três comandos vindo do host e cinco indo para ele. O tipo do processo em si continua sendo o da camada herdada, repassado sem transformação. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#6-requisitos-funcionais` | componente-novo | O manifesto ganhou seis chaves de extensão e nada além. Empacotador, script de empacotamento, lista de exclusão de VSIX, preview fora do editor e configuração de depuração continuam sem código, e a suíte do manifesto verifica tanto o que entrou quanto o que deliberadamente não entrou, para que essa fronteira não se apague por descuido. |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#6-requisitos-funcionais` | componente-novo | Nenhum arquivo foi acrescentado a `src/heranca/`, e `PROCEDENCIA.md` segue intocado. O que se herdou do `vscode-kanban` foi desenho, e não binário, de modo que o carimbo de origem e o registro de adaptação não se aplicam, conforme RN-08 do `requirements.md`. As dezenove suítes da feature 001 seguem verdes. |

**16 impactos registrados:** treze de tipo `componente-novo`, dois de `delta-de-dados` e um de
`delta-de-contrato-externo`. Não há regra alterada nem removida, porque não houve extração `/reversa`
sobre este repositório e portanto não havia regra a alterar.

## Regras sob vigilância

O watch principal de `regression-watch.md` continua **vazio**, pelo mesmo motivo da feature 001:
sem extração não há regras 🟢, e sem regras 🟢 não há o que vigiar.

Os identificadores **W019 a W041** existem, reservados e estáveis, na seção "Observações" daquele
arquivo, e seguem a numeração da feature 001, que usou W001 a W018. Nenhum identificador antigo foi
reciclado nem reescrito.

Conteúdo integral em `_reversa_forward/002-ponte-e-host/regression-watch.md`. Três observações
registradas ali merecem atenção de quem rodar a próxima extração: a forma estrutural da porta de
mensagens é consequência de RF-17 e não acoplamento por descuido; `src/host/provisional.ts` é
descartável por contrato e é o único módulo do host que contém caminho de arquivo do Reversa; e
W037, mais a metade visual de W019 e W020, ainda não têm prova, por causa da ação pendente.

## Fontes

- `_reversa_forward/002-ponte-e-host/legacy-impact.md`
- `_reversa_forward/002-ponte-e-host/regression-watch.md`
- `_reversa_forward/002-ponte-e-host/requirements.md`
- `_reversa_forward/002-ponte-e-host/roadmap.md`
- `_reversa_forward/002-ponte-e-host/data-delta.md`
- `_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md`
- `_reversa_forward/002-ponte-e-host/actions.md`
- `_reversa_forward/002-ponte-e-host/progress.jsonl`
