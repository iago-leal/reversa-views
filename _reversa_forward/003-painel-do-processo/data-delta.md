# Data Delta: painel do processo

> Identificador: `003-painel-do-processo`
> Data: `2026-09-09`
> Roadmap: `_reversa_forward/003-painel-do-processo/roadmap.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo

Nenhuma mudança no que atravessa o canal e nenhuma mudança no processo lido do disco. O delta desta
feature é inteiramente local à tela: aparece uma estrutura de preferência, guardada no estado que a
webview mantém no host, e aparecem os tipos que as funções puras devolvem a partir do processo que já
chega pronto. Nada disso é persistido em disco, nada disso atravessa o canal e nada disso sobrevive à
desinstalação da extensão. 🟢

Vale afirmar pelo negativo, porque é o que a revisão futura vai querer confirmar: a carga de dados
continua com os seis campos que a feature 002 fixou, o comando de aviso continua com dois campos, e
os cinco estados de entrada continuam sendo cinco.

## 2. Estrutura nova, preferência de exibição

Vive no estado da webview, que o editor devolve depois de o painel ser ocultado e reexibido, e que
some quando a webview é descartada de vez. 🟡

| Campo | Tipo | Origem | Regra |
|---|---|---|---|
| `collapsedSections` | lista de nomes de seção | Ação do usuário ao recolher | Nome que não corresponda a seção atual é ignorado na leitura, conforme EC-09 |

Três regras de leitura, todas exigindo função total, isto é, que devolve valor usável em vez de
lançar. 🟢

1. Estado ausente, nulo ou de forma inesperada equivale a preferência vazia, e a preferência vazia
   aplica o padrão inicial de RF-22.
2. Nome desconhecido é descartado em silêncio, sem anomalia e sem aviso, porque a causa esperada é
   uma versão anterior da extensão, e não corrupção.
3. A escrita substitui a lista inteira, sem mesclar com o que estava lá.

O padrão inicial, quando não há preferência guardada, é decisão fechada nos esclarecimentos: as
seções de núcleo abertas, e as três de diagnóstico recolhidas com a contagem no título. A revisão de
2026-09-09 acrescentou a exceção, e ela é a razão de o cálculo depender de mais que a preferência: em
leitura degradada, isto é, havendo anomalia, recusa ou truncamento, a seção de anomalias nasce
expandida. 🟢

A expansão pontual da lista longa de anomalias, que RF-21 corta em dez, não entra aqui. Ela é gesto
de uma leitura, vive no estado local da seção e não é guardada, conforme D-19. 🟢

## 3. Tipos derivados pelas funções puras

Nenhum deles é armazenado. Todos são calculados a cada renderização, a partir do processo recebido.

| Tipo | Do que deriva | Forma | Confidência |
|---|---|---|---|
| Estado de entrada efetivo | Do comando recebido e do conteúdo da carga | Um dos cinco valores nomeados no protocolo, mais a marca de releitura em curso | 🟢 |
| Razão de bloqueio | Do estágio da feature, do sinal de espera da migração, da lista de decisões pendentes e da contagem de dúvidas | Texto que nomeia a razão, artefato relacionado e comando sugerido | 🟡 |
| Rótulo de estágio | Do valor de estágio, que tem sete formas conhecidas | Texto legível, ou o valor bruto com marca de rótulo desconhecido | 🟢 |
| Rótulo de fase | Do nome da fase e do status derivado | Texto legível mais marca de status que não depende de cor | 🟢 |
| Ordem das seções | De nada além da própria declaração | Lista fixa de seis nomes, na ordem de RF-14 | 🟢 |
| Recolhimento inicial | Da preferência guardada, do conteúdo de cada seção de diagnóstico e do sinal de degradação da leitura | Conjunto de nomes de seção recolhidos | 🟢 |

São essas seis, e não outras, que D-10 nomeia e sobre as quais incide a cobertura total exigida.
RF-13 pede cinco delas e admite mais, ao dizer "ao menos"; a sexta, o recolhimento inicial, virou
normativa com RF-22.

A razão de bloqueio é a única com forma composta, e a única que ganhou campo por causa dos
esclarecimentos. O comando sugerido e o artefato relacionado entraram por decisão do mantenedor, e
por isso a estrutura tem três partes onde a spec previa uma. 🟡

O sinal de degradação não é campo novo do processo: ele é a conjunção de três coisas que já chegam,
a lista de anomalias, as recusas do relatório da sonda e os arquivos truncados. É a mesma conjunção
que o cabeçalho usa para declarar leitura íntegra ou degradada, por RN-06, e calculá-la duas vezes
seria criar duas verdades sobre o mesmo fato. 🟢

## 4. Estrutura nova, atributos de tema no elemento raiz

A reversão de D-02 traz uma segunda estrutura pequena, que nasce da leitura do tema e morre na
marcação. Não é dado do processo, não é preferência e não é guardada. 🟢

| Campo | Tipo | Origem | Regra |
|---|---|---|---|
| Modo em vigor | claro ou escuro | Classe que o editor escreve no corpo do documento | Deriva da classe; nunca é escolhido pelo painel |
| Conjunto claro | nome de conjunto de cor | Modo mais o sinal de alto contraste | Um dos quatro nomes que o arquivo de tema importa |
| Conjunto escuro | nome de conjunto de cor | Modo mais o sinal de alto contraste | Idem, e sempre escrito junto do claro, para que a troca de tema encontre o outro já correto |

Os dois nomes são escritos ao mesmo tempo de propósito. O modo pode mudar por baixo, quando o usuário
troca o tema do editor com o painel aberto, e o atributo do outro modo precisa já estar certo quando
isso acontece.

## 5. O que o modelo já entrega e a tela não usa nesta versão

Registrado para que a ausência não seja lida como esquecimento. O processo traz oito eixos, e a
primeira versão desenha seis. 🟢

| Campo disponível | Onde vive | Por que fica de fora |
|---|---|---|
| Eixo de impacto no legado | `process.impact` | Fora do escopo por decisão do PRD, seção 5 |
| Eixo de regressão vigiada | `process.watch` | Mesma decisão |
| Eixo de ideação | `process.ideation` | Mesma decisão |
| Trilha de execução | `process.progress` | Mesma decisão; a contagem de ações vem do eixo forward, e não daqui |
| Pasta da sessão de ideação | `probe.sessionDir` | Pertence ao eixo de ideação, que fica de fora |
| Caminho do estado de migração | `process.migrationStatePath` | Só interessa a quem lê o disco, e a tela não lê |

O eixo de migração é caso à parte: ele não é desenhado como seção, mas dois dos seus campos
alimentam a faixa de bloqueio, o sinal de espera humana e a lista de decisões pendentes. 🟢

## 6. Migrações necessárias

Nenhuma. Não há banco, não há arquivo de configuração da extensão e não há formato anterior a
converter. A preferência de exibição nasce nesta feature, e o caso de a extensão ser atualizada com
seções renomeadas está coberto pela regra de ignorar nome desconhecido. 🟢

## 7. Impacto sobre a extração reversa

| Artefato | Seção | Natureza do impacto |
|---|---|---|
| `_reversa_sdd/sdd/painel-do-processo.md` | `#9-modelo-de-dados` | A estrutura de preferência ganha nome de campo e regras de leitura; a razão de bloqueio passa de uma parte para três; os atributos de tema aparecem como estrutura derivada |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#10-integracoes-e-dependencias` | A dependência dos tokens do sistema de design é confirmada, e o adendo precisa registrar o recorte: entram os tokens, não os componentes prontos, e a poda de RF-24 é o que os faz caber |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#6-requisitos-funcionais` | O kit de extensão passa a constar como segunda origem de padrão adotado, declarada em `PROCEDENCIA.md` sem cópia de arquivo |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#9-modelo-de-dados` | Sem delta: a carga permanece com os seis campos que a feature 002 fixou |
