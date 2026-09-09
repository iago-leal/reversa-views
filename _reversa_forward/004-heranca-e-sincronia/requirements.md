# Requirements: herança e sincronia

> Identificador: `004-heranca-e-sincronia`
> Data: `2026-09-09`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

A feature fecha o regime pelo qual código de fora vive dentro deste repositório. As features 001 a
003 já deixaram o registro em prosa: cada arquivo copiado tem carimbo, e as três adaptações estão
descritas. Falta o que torna esse registro verificável e reaplicável, que é um manifesto com resumo
criptográfico de cada arquivo herdado, um verificador que mede a defasagem contra as duas origens,
um arquivo de adaptações que o ressincronizador saiba reaplicar, e o ritual escrito que diz quando
rodar cada coisa. Ela serve ao mantenedor que volta depois de meses e precisa saber, sem comparar
código à mão, se a cópia ainda corresponde à origem. Fecha também a última dívida da feature 003,
que é mostrar no painel a revisão do modelo herdado ao lado da versão do Reversa lida.

## 2. Contexto a partir do legado

Não houve extração `/reversa` sobre este repositório: ele nasceu pelo caminho greenfield, e o lugar
do `architecture.md`, do `domain.md` e do `code-analysis.md` é ocupado pelo PRD, pelas specs SDD e
pelos três adendos vigentes de `_reversa_sdd/addenda/`. As citações abaixo respeitam essa origem.

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/sdd/heranca-e-sincronia.md#6-requisitos-funcionais` | Os dez requisitos do componente: carimbo, manifesto, verificador, adaptações declaradas, ressincronizador, suítes herdadas, ritual no README, revisão exposta ao painel, origens separadas e caminho configurável | 🟡 |
| `_reversa_sdd/sdd/heranca-e-sincronia.md#9-modelo-de-dados` | As duas estruturas persistidas, manifesto e adaptações, ambas legíveis por pessoa | 🟡 |
| `_reversa_sdd/sdd/heranca-e-sincronia.md#11-edge-cases-e-tratamento-de-erros` | Os oito casos de borda, de origem movida a ressincronização interrompida no meio | 🟡 |
| `_reversa_sdd/sdd/heranca-e-sincronia.md#13-plano-de-rollout` | O ressincronizador pode entrar depois do verificador, porque a primeira ressincronização só ocorre quando um sinal disparar | 🟡 |
| `_reversa_sdd/prd.md#6-restricoes` | Duas origens com ritmos distintos, e a exigência de cabeçalho com origem, versão e data em todo arquivo herdado | 🟡 |
| `_reversa_sdd/prd.md#8-riscos` | O risco de maior impacto do produto é o modelo vendorizado divergir do Reversa e o painel mentir sem avisar | 🟡 |
| `_reversa_sdd/addenda/001-leitura-do-processo.md#impacto-por-artefato-da-extracao` | RF-01, RF-04 e RF-06 já foram atendidos na cópia inicial: 34 arquivos carimbados, adaptações declaradas e suítes herdadas rodando pelo comando de teste do repositório | 🟢 |
| `_reversa_sdd/addenda/002-ponte-e-host.md#impacto-por-artefato-da-extracao` | Do `vscode-kanban` veio desenho, não binário, de modo que carimbo e manifesto não se aplicam àquela origem | 🟢 |
| `_reversa_sdd/addenda/003-painel-do-processo.md#impacto-por-artefato-da-extracao` | RF-08 continua não atendido: o cabeçalho mostra a versão do Reversa lida, mas não a revisão da origem do modelo herdado | 🟢 |
| `src/heranca/PROCEDENCIA.md#3-contrato-do-carimbo` | O carimbo ocupa as linhas 1 a 7, a primeira começa por `/* HERDADO`, e essa marca é o que o verificador desta feature deve reconhecer | 🟢 |
| `src/heranca/PROCEDENCIA.md#5-adaptacoes` | As três adaptações A1, A2 e A3, todas de resolução de importação ou exportação, com trecho original e trecho adaptado escritos | 🟢 |
| `src/heranca/PROCEDENCIA.md#6-os-tres-fixtures-sem-carimbo` | Três arquivos copiados byte a byte e deliberadamente sem carimbo, um deles preso por comparação byte a byte com o gancho instalado | 🟢 |
| `src/heranca/PROCEDENCIA.md#8-o-que-fica-para-a-feature-004` | O escopo herdado por esta feature, escrito pela feature 001: manifesto com resumo, verificador e ressincronizador | 🟢 |
| `_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md` | A regra do canal entre host e painel: acrescentar campo sem renomear nem remover | 🟢 |

**Estado observado no repositório em 2026-09-09**, que a leitura acima não registra e o desenho
precisa considerar:

- A pasta de herança tem 38 arquivos, dos quais 34 são `.ts` carimbados, 3 são fixtures sem carimbo
  e 1 é o próprio `PROCEDENCIA.md`. 🟢
- A origem do modelo continua na revisão `420305daa6cdd10858b720a34cb8db67d8e5c5e9`, a mesma da
  cópia, de modo que a defasagem hoje é zero e o verificador nascerá relatando alinhamento. 🟢
- As duas origens não estão sob `~`, e sim em `/workspaces/iagoleal/HARNESS/scrum-harness` e
  `/workspaces/iagoleal/dev/vscode-kanban`, o que confirma na prática a exigência de caminho
  configurável em vez de caminho fixo no código. 🟢
- O cabeçalho do painel é composto por cinco itens em `src/webview/ui/Header.tsx`, e acrescentar um
  sexto é acréscimo de item, não reforma da tela. 🟢

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| O Retomador | Saber, ao abrir um arquivo que não escreveu, de onde ele veio e se ainda corresponde à origem | Volta ao projeto depois de meses, roda o verificador e recebe em uma tela o estado das duas origens |
| O Operador | Decidir se é hora de ressincronizar quando o painel acusa anomalia de campo desconhecido | Acabou de rodar um agente numa versão nova do Reversa, vê a anomalia no painel e confere a defasagem antes de continuar |

O Retomador é a persona primária, e a decisão que dela decorre é que o relatório do verificador se
lê de cima para baixo sem conhecimento prévio: nomeia a origem, o estado, o arquivo e o que fazer.

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** Arquivo herdado é todo arquivo listado no manifesto. A marca `/* HERDADO` na primeira
   linha é o sinal legível para quem abre o arquivo, e não o critério de pertencimento, porque os
   três fixtures são herdados e não podem carregá-la. 🟢
   - Origem no legado: `src/heranca/PROCEDENCIA.md#6-os-tres-fixtures-sem-carimbo`
   - Tipo: nova
2. **RN-02:** Todo arquivo sob a pasta de herança, com a exceção do próprio `PROCEDENCIA.md` e dos
   artefatos do manifesto, precisa constar do manifesto. Arquivo presente na pasta e ausente do
   manifesto é falha do verificador, não omissão tolerada. 🟡
   - Tipo: nova
3. **RN-03:** O resumo criptográfico registrado no manifesto cobre o conteúdo herdado, isto é, o
   arquivo sem as sete linhas de carimbo, para arquivos carimbados, e o arquivo inteiro para os
   isentos. A razão é que atualizar um carimbo depois de uma ressincronização não pode ser
   indistinguível de editar o código copiado. 🟡
   - Tipo: nova
4. **RN-04:** Os campos do carimbo são conferidos contra a entrada correspondente do manifesto.
   Carimbo que diz uma revisão e manifesto que diz outra é inconsistência relatada, e não empate
   resolvido por precedência silenciosa. 🟡
   - Tipo: nova
5. **RN-05:** Origem ausente da máquina é estado relatado, nunca erro que interrompa. O verificador
   segue conferindo carimbo, manifesto e edição local, que não dependem da origem. 🟡
   - Origem no legado: `_reversa_sdd/sdd/heranca-e-sincronia.md#63-fluxos-alternativos`, fluxo B
   - Tipo: nova
6. **RN-06:** O verificador não escreve. Nenhum caminho de execução dele cria, altera ou remove
   arquivo, dentro ou fora do repositório. 🟡
   - Tipo: nova
7. **RN-07:** O ressincronizador escreve apenas dentro da pasta de herança, no manifesto e no
   arquivo de adaptações. Não escreve nas origens, não escreve fora do repositório e não cria
   commit, porque a revisão do diff é ato humano. 🟡
   - Origem no legado: `_reversa_sdd/sdd/heranca-e-sincronia.md#12-seguranca-e-privacidade`
   - Tipo: nova
8. **RN-08:** Arquivo herdado com edição local não declarada bloqueia a ressincronização daquele
   arquivo. A escolha entre declarar a edição como adaptação e descartá-la é humana. 🟡
   - Origem no legado: `_reversa_sdd/sdd/heranca-e-sincronia.md#11-edge-cases-e-tratamento-de-erros`, EC-04
   - Tipo: nova
9. **RN-09:** Adaptação declarada que não casa com a origem nova interrompe a ressincronização
   inteira, e não apenas o arquivo em conflito. Nenhum outro arquivo é tocado até a decisão do
   usuário, para que o repositório nunca fique com metade de uma revisão aplicada. 🟡
   - Origem no legado: `_reversa_sdd/sdd/heranca-e-sincronia.md#11-edge-cases-e-tratamento-de-erros`, EC-03
   - Tipo: nova
10. **RN-10:** As duas origens são entradas separadas do manifesto, com revisão, data e sinais de
    disparo próprios. O kit de extensão é origem de padrão e não de arquivo, e por isso sua entrada
    tem lista de arquivos vazia por definição, e não por pendência. 🟢
    - Origem no legado: `_reversa_sdd/addenda/002-ponte-e-host.md#impacto-por-artefato-da-extracao`
    - Tipo: nova
11. **RN-11:** O caminho local de cada origem vive num arquivo de configuração ignorado pelo git.
    Nenhum caminho de origem aparece no código nem no manifesto versionado, porque a mesma cópia
    precisa verificar-se em máquinas que organizam o disco de formas diferentes. 🟢
    - Tipo: nova
12. **RN-12:** Arquivo presente na origem e ausente do manifesto é relatado como novo na origem, e
    nunca copiado por decisão da ferramenta. Herdar mais código é escolha humana. 🟡
    - Origem no legado: `_reversa_sdd/sdd/heranca-e-sincronia.md#11-edge-cases-e-tratamento-de-erros`, EC-06
    - Tipo: nova
13. **RN-13:** Manifesto inválido ou ilegível interrompe o verificador com a indicação do problema.
    Relatório parcial que pareça íntegro é pior que ausência de relatório. 🟡
    - Origem no legado: `_reversa_sdd/sdd/heranca-e-sincronia.md#11-edge-cases-e-tratamento-de-erros`, EC-07
    - Tipo: nova
14. **RN-14:** A revisão da origem exibida no painel é a que consta do manifesto, e não uma leitura
    da origem em tempo de execução. A extensão não sabe onde a origem está, e não deveria saber. 🟡
    - Origem no legado: `_reversa_sdd/prd.md#6-restricoes`, invariante de não tocar disco fora do workspace
    - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | Manter um manifesto único em YAML que liste as duas origens e todo arquivo herdado, com origem, caminho na origem, revisão, data da cópia e resumo criptográfico do conteúdo | Must | O manifesto existe, é legível por pessoa e por programa, e tem uma entrada para cada um dos 37 arquivos herdados hoje presentes | 🟢 |
| RF-02 | Migrar para o arquivo de adaptações, também em YAML, as três adaptações hoje descritas em prosa, com arquivo, motivo, trecho original literal e trecho adaptado literal | Must | A1, A2 e A3 constam do arquivo de adaptações com os mesmos trechos que `PROCEDENCIA.md` registra, e o trecho original é aproveitável byte a byte na busca exata do ressincronizador | 🟢 |
| RF-03 | Oferecer um verificador que confira, para cada arquivo do manifesto, presença, carimbo, coerência entre carimbo e manifesto e resumo do conteúdo | Must | Alterar uma linha de um arquivo herdado faz o verificador apontá-lo como editado localmente, nomeando o arquivo | 🟡 |
| RF-04 | O verificador compara cada arquivo com a origem quando esta estiver na máquina, e relata origem que avançou | Must | Com a origem presente e igual, o relatório diz alinhado; com a origem presente e diferente, diz que a origem avançou e nomeia os arquivos | 🟡 |
| RF-05 | O verificador relata origem ausente como indisponível, conclui as conferências que não dependem dela e termina com sucesso | Must | Com o caminho da origem apontando para pasta inexistente, o relatório traz o bloco da origem marcado indisponível e as demais conferências completas | 🟡 |
| RF-06 | O verificador relata arquivo sob a pasta de herança que não conste do manifesto, e arquivo do manifesto ausente do disco | Must | Acrescentar um arquivo qualquer à pasta de herança produz relato de arquivo não manifestado | 🟡 |
| RF-07 | O verificador relata arquivo presente na origem e ausente do manifesto como novo na origem, sem copiá-lo | Must | Um arquivo criado na origem aparece no relatório como novo, e a pasta de herança continua intocada | 🟡 |
| RF-08 | O verificador organiza a saída por origem, em blocos próprios, e termina com um veredito por origem e um veredito geral | Should | O relatório tem dois blocos nomeados, e a defasagem do kit não aparece misturada à do modelo | 🟡 |
| RF-09 | Localizar as origens por caminho declarado em arquivo de configuração local ignorado pelo git, com exemplo versionado ao lado | Must | Mover a origem de pasta exige editar uma linha, e o verificador nomeia o arquivo e a chave quando a origem não é encontrada | 🟢 |
| RF-10 | Entregar nesta feature um ressincronizador que copie da origem, reaplique cada adaptação declarada por busca exata do trecho original no arquivo novo, atualize carimbos e manifesto, e pare com relatório quando uma adaptação não puder ser reaplicada | Must | Uma adaptação em conflito com a origem nova interrompe a execução nomeando arquivo e trecho, nenhum arquivo fica alterado, e os cenários de recusa são exercidos por fixtures sintéticos, sem depender de a origem ter avançado de verdade | 🟢 |
| RF-11 | O ressincronizador recusa sobrescrever arquivo com edição local não declarada, e diz o que fazer | Must | Com um arquivo herdado editado à mão, a execução para e o texto oferece as duas saídas: declarar a adaptação ou descartar a edição | 🟡 |
| RF-12 | O verificador e o ressincronizador falham de modo explícito quando o manifesto for inválido, seja por YAML malformado, seja por campo obrigatório ausente, indicando o problema, sem emitir relatório parcial | Must | Um manifesto corrompido produz mensagem que nomeia o defeito e a linha do arquivo, e nenhuma linha de relatório de conferência | 🟢 |
| RF-13 | Manter as suítes herdadas rodando pelo mesmo comando de teste do repositório, e conferir que a ressincronização não as removeu | Must | O comando único de teste executa as suítes herdadas, e o verificador acusa suíte herdada que sumiu do manifesto | 🟢 |
| RF-14 | Expor a revisão da origem do modelo à camada de leitura do host por um módulo gerado no build a partir do manifesto, sem leitura de arquivo em tempo de execução | Must | O host importa a revisão como constante, nenhum módulo do host ganha caminho de origem nem leitura de disco nova, e um teste falha quando a constante e o manifesto discordarem | 🟢 |
| RF-15 | O painel mostra a revisão do modelo herdado ao lado da versão do Reversa lida, em forma abreviada e legível | Must | O cabeçalho tem um sexto item nomeado, com a revisão da origem, e diz não declarado quando ela faltar | 🟡 |
| RF-16 | Documentar no README o ritual, nomeando os três sinais de disparo, o comando do verificador, o comando do ressincronizador e o que fazer quando ele para | Must | A seção existe e nomeia os três sinais: anomalia de campo desconhecido no painel, versão nova do Reversa instalada e release nova da origem do kit | 🟡 |
| RF-17 | Registrar no `PROCEDENCIA.md` que o registro em prosa deixou de ser a fonte única, apontando o manifesto e o arquivo de adaptações como fonte de dado | Should | A seção 8 do arquivo, que descreve o que fica para esta feature, é substituída pelo estado entregue | 🟢 |
| RF-18 | Declarar no README o limite conhecido do regime: resumo que confere não garante comportamento igual, e as suítes herdadas são a rede que resta | Should | O texto do limite existe e cita a dependência transitiva como o caso que o resumo não pega | 🟡 |
| RF-19 | Rodar as conferências locais do verificador como passo do build, falhando-o quando houver arquivo herdado sem carimbo, não manifestado ou editado localmente | Must | Editar à mão um arquivo herdado faz o comando de build falhar nomeando o arquivo, e a comparação contra as origens permanece fora do build | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Desempenho | O verificador completa em menos de 10 s com as duas origens presentes | `_reversa_sdd/sdd/heranca-e-sincronia.md#7-requisitos-nao-funcionais`, RNF-01; são poucas dezenas de arquivos pequenos | 🟡 |
| Dependências | Verificador e ressincronizador rodam sem serviço externo e sem ferramenta instalada à mão, admitida uma única dependência de desenvolvimento, o interpretador de YAML que o formato do manifesto exige | RNF-02 da mesma seção, emendado pela escolha do YAML; a dependência é de desenvolvimento e não entra no pacote da extensão, porque o host lê a revisão de um módulo gerado, e não do manifesto | 🟢 |
| Legibilidade | O carimbo continua cabendo nas dez primeiras linhas do arquivo | RNF-03 da mesma seção; o formato de sete linhas já em uso satisfaz o teto | 🟢 |
| Reversibilidade | Toda ressincronização é desfeita por um comando do git, porque nenhuma delas cria commit | RNF-04 da mesma seção | 🟡 |
| Segurança | Nenhum dos dois comandos toca a rede, e o ressincronizador não escreve fora da pasta de herança, do manifesto e das adaptações | `_reversa_sdd/prd.md#6-restricoes`, invariante de a extensão nunca escrever, estendido às ferramentas do repositório | 🟡 |
| Observabilidade | A saída dos dois comandos é texto legível, nomeia arquivo e estado, e distingue o que impede de prosseguir do que apenas informa | Erros barulhentos são o critério de operação do projeto, e o relatório é a única interface do ritual | 🟡 |
| Portabilidade | O manifesto versionado não contém caminho absoluto de máquina alguma | RN-11; a mesma cópia se verifica em máquinas com organizações de disco diferentes | 🟢 |
| Determinismo | Duas execuções seguidas do verificador sobre a mesma árvore produzem o mesmo relatório | Relatório que varia sem que nada mude destrói a confiança que ele existe para criar | 🟡 |

## 7. Critérios de Aceitação

```gherkin
Cenário: árvore alinhada com as duas origens presentes
  Dado que os 37 arquivos herdados constam do manifesto com resumo correspondente
  E que as duas origens estão nos caminhos declarados na configuração local
  Quando o mantenedor roda o verificador
  Então o relatório traz um bloco por origem, ambos com veredito alinhado
  E o comando termina indicando sucesso

Cenário: arquivo herdado editado à mão sem declaração
  Dado que uma linha de um módulo herdado foi alterada depois da cópia
  Quando o mantenedor roda o verificador
  Então o relatório aponta aquele arquivo como editado localmente
  E nomeia o caminho do arquivo e a origem a que ele pertence

Cenário: origem ausente da máquina
  Dado que o caminho declarado para a origem do modelo aponta para pasta inexistente
  Quando o mantenedor roda o verificador
  Então o bloco daquela origem é relatado como indisponível
  E o relatório nomeia o arquivo de configuração e a chave a corrigir
  E as conferências de carimbo, manifesto e resumo são concluídas assim mesmo

Cenário: a origem avançou
  Dado que a origem do modelo está numa revisão posterior à registrada no manifesto
  Quando o mantenedor roda o verificador
  Então o relatório declara que a origem avançou
  E lista os arquivos cujo conteúdo difere entre a cópia e a origem

Cenário: arquivo novo na origem
  Dado que a origem ganhou um módulo que o manifesto não lista
  Quando o mantenedor roda o verificador
  Então o relatório lista o arquivo como novo na origem
  E a pasta de herança permanece sem alteração

Cenário: arquivo na pasta de herança fora do manifesto
  Dado que um arquivo foi acrescentado à pasta de herança sem entrada no manifesto
  Quando o mantenedor roda o verificador
  Então o relatório aponta o arquivo como não manifestado

Cenário: manifesto corrompido
  Dado que o manifesto ficou inválido por conflito de merge mal resolvido
  Quando o mantenedor roda o verificador
  Então o comando falha nomeando o defeito e o ponto do arquivo
  E nenhum relatório de conferência é impresso

Cenário: ressincronização bem-sucedida
  Dado que a origem do modelo avançou e nenhum arquivo herdado tem edição não declarada
  Quando o mantenedor roda o ressincronizador
  Então os arquivos são copiados da origem
  E as três adaptações declaradas são reaplicadas
  E os carimbos e o manifesto passam a registrar a revisão nova
  E nenhum commit é criado

Cenário: adaptação declarada em conflito com a origem nova
  Dado que a origem alterou o trecho que uma adaptação declarada substitui
  Quando o mantenedor roda o ressincronizador
  Então a execução para naquele arquivo
  E o relatório mostra o trecho esperado e o trecho encontrado
  E nenhum outro arquivo herdado é alterado

Cenário: ressincronização recusada por edição local
  Dado que um arquivo herdado tem alteração local não declarada
  Quando o mantenedor roda o ressincronizador
  Então a execução para antes de copiar qualquer arquivo
  E o texto oferece as duas saídas, declarar a adaptação ou descartar a edição

Cenário: revisão da origem no cabeçalho do painel
  Dado que o manifesto registra a revisão da origem do modelo
  Quando o painel do Reversa é aberto e a leitura conclui
  Então o cabeçalho mostra a revisão abreviada ao lado da versão do Reversa

Cenário: revisão indisponível para o painel
  Dado que o dado da revisão não pôde ser obtido
  Quando o painel é aberto
  Então o item da revisão mostra não declarado
  E nenhum outro item do cabeçalho é afetado

Cenário: o ritual está escrito onde o retomador olha
  Dado o repositório entregue por esta feature
  Quando o mantenedor abre o README depois de meses de pausa
  Então a seção do ritual nomeia os três sinais de disparo
  E nomeia o comando do verificador e o do ressincronizador
  E declara o limite conhecido, que resumo igual não garante comportamento igual
  E o registro em prosa da procedência aponta o manifesto como fonte do dado

Cenário: as suítes herdadas continuam no comando único
  Dado o repositório após uma ressincronização
  Quando o mantenedor roda o comando de teste do repositório
  Então as suítes herdadas do modelo e da sonda são executadas junto com as locais
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01, RF-02 | Must | Sem manifesto e sem adaptações em forma de dado, não há o que verificar nem o que reaplicar |
| RF-03, RF-04, RF-05, RF-06 | Must | São o verificador, que é a peça de maior retorno: mede a defasagem que hoje só se descobre lendo código |
| RF-07 | Must | Barato, e é o que impede que a origem ganhe módulo sem ninguém notar |
| RF-09 | Must | Sem caminho configurável a ferramenta não roda nesta máquina, onde as origens não estão sob a pasta pessoal |
| RF-10, RF-11, RF-12 | Must | O ressincronizador é o que dá utilidade ao que o verificador mede, e sua recusa correta é mais importante que sua conclusão |
| RF-13 | Must | A suíte herdada é o contrato do que foi copiado, e já está verde: aqui só se protege o que existe |
| RF-14, RF-15 | Must | Fecham dívida nomeada da feature 003, e são o que leva o diagnóstico da defasagem a quem olha o painel |
| RF-16 | Must | Ritual não escrito é ritual que não acontece depois de meses de pausa |
| RF-19 | Must | Conferência que só roda quando alguém lembra não protege o empacotamento da feature 005 |
| RF-08, RF-17, RF-18 | Should | Melhoram a leitura do relatório e a honestidade do registro, mas nada depende deles para funcionar |
| RNF de desempenho | Should | O teto de 10 s é folgado para dezenas de arquivos, e dificilmente será o que limita |
| RNF de reversibilidade | Must | É o que permite rodar o ressincronizador sem medo, e portanto o que faz o ritual ser usado |

## 9. Esclarecimentos

### Sessão 2026-09-09

- **Q:** Forma das adaptações declaradas, deixada em aberto pela spec como OQ-02: trecho textual ou
  arquivo de diferença aplicável por ferramenta.
  **R:** Trecho textual. O arquivo de adaptações guarda o original e o adaptado por extenso, e o
  ressincronizador reaplica cada conserto por busca exata do trecho original no arquivo vindo da
  origem. Não há dependência de ferramenta de diferença, e a busca que não casa é justamente o
  sinal de parada que a RN-09 exige.
- **Q:** Momento de execução do verificador, deixado em aberto pela spec como OQ-03: apenas sob
  demanda ou também como passo do build.
  **R:** Os dois. Além do comando próprio, o build roda as conferências locais, isto é, carimbo,
  presença no manifesto e resumo do conteúdo, e falha quando alguma delas falhar. A comparação
  contra as origens fica fora do build, porque a máquina que empacota pode não ter as origens e o
  resultado do build precisa ser determinístico.
- **Q:** Escopo do ressincronizador nesta feature, que a seção 13 da spec admitia adiar para a
  feature seguinte.
  **R:** Entregue completo agora, com as recusas da RN-08 e da RN-09. Os cenários de recusa são
  exercidos por fixtures sintéticos, de modo que a ferramenta nasce testada mesmo com a origem
  ainda parada na revisão copiada.
- **Q:** Formato do manifesto, que precisa ser legível por pessoa e por programa e falhar de modo
  explícito quando inválido.
  **R:** YAML. A escolha privilegia a leitura humana e a resolução de conflito de merge, e aceita
  como contrapartida uma dependência de desenvolvimento nova, o interpretador de YAML, que o
  requisito não funcional de dependências passa a admitir nominalmente.
- **Q:** Como a revisão da origem do modelo chega ao painel sem que a extensão conheça o caminho da
  origem.
  **R:** Por constante gerada no build a partir do manifesto. O host importa o módulo gerado, não
  lê arquivo em tempo de execução e não obriga a emendar o invariante de não tocar disco fora do
  workspace. Um teste trava a coerência entre a constante e o manifesto.

## 10. Lacunas

Nenhuma lacuna aberta. As três dúvidas registradas na versão inicial, OQ-02, OQ-03 e o escopo do
ressincronizador, foram resolvidas na sessão de esclarecimentos de 2026-09-09, junto com as duas
decisões de desenho que ainda faltavam: o formato do manifesto e a via pela qual o host obtém a
revisão da origem.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-09-09 | Cinco decisões registradas por `/reversa-clarify`: trecho textual nas adaptações, verificador também no build, ressincronizador completo nesta feature, manifesto em YAML e revisão exposta por constante gerada | reversa |
