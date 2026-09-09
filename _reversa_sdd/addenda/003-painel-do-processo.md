# Adendo: painel do processo

> Identificador da feature: `003-painel-do-processo`
> Data: `2026-09-09`
> Cenário: `greenfield`
> Gerado por: `/reversa-sync`

Este adendo é uma ponte. A extração em `_reversa_sdd/` descreve o produto como ele foi especificado,
e a entrega da feature 003 fechou o último trecho em que a spec falava no futuro: o painel existe,
desenhado, e o corpo provisório que a feature 002 servia foi apagado. Em nove pontos o código foi
além do que a spec do componente previa, e em três ele deixou dívida nomeada. O que segue diz como
ler cada artefato da extração enquanto a re-extração não vem.

## Vigência

Vigente desde 2026-09-09.

## Resumo da entrega

A feature entrega a tela. Ela recebe o processo tipado que a ponte da feature 002 envia e o desenha
na barra lateral do editor, com seis eixos, sete estados visíveis e uma ordem de leitura ditada pela
persona primária, que precisa saber o que aguarda decisão dela antes de qualquer histórico. O
problema que ela resolve é de seleção e de confiança: o processo chega com oito eixos e dezenas de
campos, e despejá-los produziria painel denso que ninguém lê, de modo que a ordem, a ênfase e a
omissão são o produto; ao mesmo tempo, painel que mostra estado errado é pior que painel nenhum, e
por isso o diagnóstico entra desde a primeira versão, declarando quando a leitura degradou.

Duas decisões de forma ordenam o resto. A primeira é que toda decisão de apresentação vive em função
pura, em sete módulos que não importam React, e os onze componentes apenas as chamam. A segunda é
que a fronteira da webview deixou de ser disciplina e virou compilação: uma segunda configuração
desliga os tipos de plataforma e torna o módulo do editor inalcançável, de modo que RN-02 falha na
verificação de tipos em vez de falhar na revisão. O preço é redeclarar o protocolo e o formato da
linha de log do lado da webview, e ele está pago por escrito, com a divergência prendida por teste.

**61 ações concluídas de 61 previstas**, conforme `actions.md` e as 63 linhas de `progress.jsonl`,
das quais duas são correções registradas sobre ações anteriores. Nenhuma ação ficou aberta, e por
isso **esta é uma sincronização total**. A suíte fecha com 42 arquivos e 487 casos, nenhuma falha e
nenhum pulo, dos quais 164 são desta feature. O bundle soma 168.359 bytes contra o teto de 409.600,
com os quatro conjuntos de cor caindo de 485.898 para 12.466 bytes pela poda por fecho transitivo.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/prd.md` | `#4-escopo-in` | componente-novo | Os seis eixos deixaram de ser lista de escopo e são tela: identidade no cabeçalho, descoberta, ciclo forward, bloqueio humano em faixa própria, anomalias, relatório da sonda e política de escrita. O comportamento previsto também está inteiro: leitura na ativação, releitura por ação explícita, navegação para o arquivo e estado vazio informativo. |
| `_reversa_sdd/prd.md` | `#6-restricoes` | componente-novo | A restrição de a webview não tocar disco nem rede deixou de depender de disciplina. A configuração de compilação da webview declara lista de tipos ambientais vazia e mapeia o módulo do editor para uma declaração que só existe para falhar, de modo que a violação não compila. |
| `_reversa_sdd/prd.md` | `#9-criterios-de-aceite-alto-nivel` | componente-novo | Os sete critérios têm código e cobertura por teste de renderização, incluindo o do projeto parado há trinta dias e o do `state.json` corrompido. Nenhum deles, porém, foi observado com o painel aberto dentro do editor: a prova é textual, pela topologia da marcação, e a visual continua devida. |
| `_reversa_sdd/prd.md` | `#10-evolucao-prevista-disparar-agentes-pelo-painel` | componente-novo | As três garantias de desenho estão cumpridas. O canal é de mão dupla desde a feature 002, o estágio é valor de vocabulário fechado traduzido por função pura, e o lugar da ação de despacho está reservado no cabeçalho, nomeado e vazio, de modo que acrescentar o botão não desloca os demais itens. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#6-requisitos-funcionais` | componente-novo | Os quinze requisitos da seção estão implementados. Leia-os como contrato cumprido, não como plano. O `requirements.md` da feature acrescentou nove: RF-03a fixa a composição de cada razão da faixa, RF-16 a RF-21 vieram do protocolo e do isolamento de falha, RF-22 fixa o padrão inicial de exibição, e RF-23 e RF-24 trouxeram para cá o empacotamento mínimo e a poda de tokens. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#7-requisitos-nao-funcionais` | componente-novo | Três dos cinco têm prova. RNF-01 pela consulta de mídia em 300 px, sem medida em pixel na folha; RNF-04 com 168.359 bytes contra 400 KB; RNF-05 com 100% de linhas nas funções de decisão. RNF-03 está atendido por marca textual de fase e de checkpoint, mas o percurso por teclado não foi exercitado. RNF-02, o tempo de pintura, não foi medido, porque medi-lo exige o painel aberto. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#8-design-e-interface` | componente-novo | Os sete estados visíveis existem, e a coluna única, a ausência de animação e a estabilidade de posição entre releituras foram respeitadas. A entrega acrescentou o que a seção não previa: um contrato de marcação por atributos de dados, que é o que torna cada exigência visual verificável sem navegador. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#9-modelo-de-dados` | delta-de-dados | **Leia esta seção com o `data-delta.md` da feature ao lado.** A estrutura guardada continua sendo só a preferência de exibição, com a lista de seções recolhidas, mas o leitor dela é total: entrada malformada vira preferência vazia, e nome de seção desconhecido é descartado em silêncio na tela e registrado no log. A entrega acrescentou um valor derivado que a seção não previa, a integridade da leitura, calculada uma vez e lida por três lugares. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#11-edge-cases-e-tratamento-de-erros` | componente-novo | Os nove casos de EC-01 a EC-09 têm código e teste. Dois merecem leitura atenta: EC-08 é verificado dirigindo o ciclo de vida do limite de erro, porque a renderização em servidor não o executa, e a prova do isolamento é a topologia da marcação; EC-09 descarta o nome desconhecido sem avisar na tela, e a linha de log que o registra vive na casca, não no leitor, porque só a casca detém a porta de escrita de estado. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#12-seguranca-e-privacidade` | componente-novo | A seção continua verdadeira e ficou mais estreita. A webview não tem entrada de texto livre, envia apenas os comandos do protocolo e só por um módulo, e a falha capturada por limite de erro vai ao log da extensão com o nome da seção. A faixa de bloqueio oferece o comando do Reversa para copiar e não o executa. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#13-plano-de-rollout` | componente-novo | **O portão de saída declarado não pôde ser cumprido e continua devido.** A seção condiciona o empacotamento à captura de tela dos sete estados no preview fora do editor, e o preview é da feature 005; o ambiente de execução também não tem interface gráfica. A renderização em servidor substituiu a captura como prova de conteúdo, mas não prova aparência, e nenhuma versão deve ser empacotada antes de o portão original rodar. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#14-open-questions` | componente-novo | As três questões foram fechadas pela entrega. OQ-01 resolveu-se pelo comando em bloco copiável, que virou RF-03a; OQ-02 pelos checkpoints expandidos, por herdarem a seção de descoberta, que é de núcleo; OQ-03 pelo relatório da sonda recolhido por padrão com a contagem visível no título, ambas dentro de RF-22. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#15-decisoes-tomadas-decision-log` | componente-novo | As seis decisões foram exercidas, e não apenas registradas. A elas somam-se as decisões técnicas do `roadmap.md` da feature, das quais três mudam como a spec deve ser lida: a ordem das seções é declarada uma vez e desestruturada pela composição, o padrão inicial de exibição cede à preferência guardada, e a integridade da leitura virou cálculo único em vez de três contagens paralelas. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#10-integracoes-e-dependencias` | componente-novo | A dependência do componente `painel-do-processo`, que a tabela marca como obrigatória, deixou de ser servida por substituto. O corpo definitivo entrega folha, raiz e script por nonce dentro da mesma política de segurança de antes, e `src/host/provisional.ts` foi apagado, conforme RF-18. Com ele saiu a última linha do host que citava caminho de arquivo do Reversa, e a exceção correspondente na suíte de fronteiras. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#9-modelo-de-dados` | delta-de-contrato-externo | O protocolo ganhou seu consumidor, e com isso a regra de `_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md` passa a valer na prática: acrescentar sem renomear nem remover. Há agora duas declarações do mesmo contrato, uma de cada lado da fronteira de compilação, e mantê-las em sincronia é obrigação prendida por teste, não recomendação. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#6-requisitos-funcionais` | componente-novo | Cinco requisitos foram atendidos aqui, por serem o mínimo que torna o painel executável: RF-01 pelas duas unidades de compilação, RF-03 em parte, com um comando que compila o host e empacota a webview, RF-09 pelo comando único de teste, RF-10 pela verificação de tipos da webview e RF-13 pelo empacotamento com mapa de fontes. Os demais seguem na feature 005: VSIX, lista de exclusão, preview, temas por argumento, estado forçado, faixa de preview e configuração de depuração. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#7-requisitos-nao-funcionais` | componente-novo | RNF-02 foi alcançado pela poda de tokens por fecho transitivo sobre as declarações da folha, com guarda explícita contra fecho vazio, porque a falha silenciosa dessa poda serviria um painel sem cor. RNF-01 e RNF-04 seguem folgados, e RNF-05 vale para as instalações desta feature, todas em igualdade exata. **RF-12, falhar o build acima do teto, ainda não existe:** o teto foi medido por ação registrada em `progress.jsonl`, não por guarda automática. |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#6-requisitos-funcionais` | componente-novo | Nenhum arquivo foi acrescentado a `src/heranca/`, e nenhum arquivo herdado foi tocado; as 213 verificações da feature 001 seguem verdes. `PROCEDENCIA.md` ganhou uma seção sobre o kit externo cujo padrão de tema e de empacotamento foi adotado sem copiar arquivo algum, de modo que carimbo e manifesto não se aplicam. **RF-08 continua não atendido:** o cabeçalho do painel mostra a versão do Reversa lida, mas não a revisão da origem do modelo herdado. |

**18 impactos registrados:** dezesseis de tipo `componente-novo`, um de `delta-de-dados` e um de
`delta-de-contrato-externo`. Não há regra alterada nem removida, porque não houve extração `/reversa`
sobre este repositório e portanto não havia regra a alterar. A única remoção da entrega,
`src/host/provisional.ts`, era descartável por contrato desde a feature 002.

Três dívidas ficam nomeadas acima e não devem se perder na próxima leitura: o portão de saída do
rollout, que exige o preview da feature 005; a guarda automática do teto do bundle, hoje substituída
por medida registrada; e RF-08 da spec de herança, que pede a revisão do modelo herdado no cabeçalho.

## Regras sob vigilância

O watch principal de `regression-watch.md` continua **vazio**, pelo mesmo motivo das features 001 e
002: sem extração não há regras 🟢, e sem regras 🟢 não há o que vigiar.

Os identificadores **W042 a W075** existem, reservados e estáveis, na seção "Observações" daquele
arquivo, cobrindo os 25 requisitos funcionais e as 9 regras de negócio desta feature. Eles seguem a
numeração da feature 002, que usou W019 a W041. Nenhum identificador antigo foi reciclado nem
reescrito.

Conteúdo integral em `_reversa_forward/003-painel-do-processo/regression-watch.md`. Quatro
observações registradas ali merecem atenção de quem rodar a próxima extração: o protocolo e o
formato da linha de log aparecem declarados dos dois lados da fronteira, e isso é o preço de RN-02,
não descuido; `src/webview/domain/integrity.ts` não estava no plano e nasceu para que três lugares
leiam a mesma contagem; a preferência malformada é descartada em silêncio na tela e registrada no
log pela casca; e a verificação visual dentro do editor segue pendente, herdada da feature 002.

## Fontes

- `_reversa_forward/003-painel-do-processo/legacy-impact.md`
- `_reversa_forward/003-painel-do-processo/regression-watch.md`
- `_reversa_forward/003-painel-do-processo/requirements.md`
- `_reversa_forward/003-painel-do-processo/progress.jsonl`
- `_reversa_forward/003-painel-do-processo/actions.md`
