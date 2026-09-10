# Adendo: cronologia do ciclo de bugs

> Identificador da feature: `008-cronologia-do-ciclo-bugs`
> Data: `2026-09-10`
> Cenário: `greenfield`
> Gerado por: `/reversa-sync`

Este adendo é uma ponte. A extração em `_reversa_sdd/` descreve um painel que lê três territórios do
disco, `.reversa/`, `_reversa_sdd/` e `_reversa_forward/`, e enumera seis eixos repartidos entre
núcleo e diagnóstico. A entrega da feature 008 acrescentou um quarto território, `_reversa_bugs/`, e
com ele um eixo que o escopo não previa: o registro de defeitos, desenhado como nona seção do painel,
com a mesma anatomia cronológica que o ciclo forward já tinha. Nada do que a extração afirma deixou
de valer, e o invariante mais duro dela, a extensão nunca escreve arquivo, atravessou intacto uma
feature que precisou de um script auxiliar justamente para escrever. O que segue diz como ler cada
artefato da extração enquanto a re-extração não vem.

## Vigência

Vigente desde 2026-09-10.

## Resumo da entrega

O painel já sabia contar o tempo do ciclo forward. A decomposição mostra ação a ação com o instante
do último evento, a próxima aberta destacada e o resto dobrado atrás de um controle; o histórico
mostra feature a feature com situação, marca e último evento. O ciclo de bugs produzia registros da
mesma natureza cronológica e não tinha nada disso. A feature fechou essa assimetria, para que o
Retomador saiba, sem abrir arquivo, quantos defeitos existem, quais aguardam decisão dele, qual
tratar em seguida e quando cada um se moveu pela última vez.

Trinta e oito ações executadas, todas marcadas `[X]` em `actions.md` e registradas nas trinta e oito
linhas de `progress.jsonl`. Vinte e cinco arquivos criados, treze deles fixturas de um mesmo
diretório, e vinte e sete modificados. A suíte terminou a entrega com 1307 casos verdes em 83
arquivos, e o portão visual ganhou quatro estados doentes do registro, cada um conferido pela suíte
contra a leitura real, para que quem confere a tela esteja conferindo o estado que pediu.

Três separações organizam a entrega e valem para a leitura de tudo o que segue. A primeira é entre
**fonte de verdade e projeção**: o painel lê `<contexto>/bugs/<ID>/bug.md` e nunca desce em
`generated/`, porque quem lesse a projeção mostraria o passado sem dizer que é o passado. A segunda é
entre **valor reconhecido e valor bruto**: cada campo de vocabulário fechado viaja nas duas formas, e
o que o painel não sabe ler é desenhado como está escrito e marcado como não reconhecido, em vez de
sumir. A terceira é entre **o que existe e o que foi lido**: acima do teto de cinquenta bugs por
passagem os dois números divergem por construção, e a divergência é dita em vez de alisada.

**Nota sobre a derivação da versão.** RN-06 da feature 007 fixa a versão do pacote em
`0.<maior número de feature com adendo>.<commits desde o commit que acrescentou aquele adendo>`. Este
adendo é, portanto, parte do número que o próximo pacote vai carregar: enquanto ele não existia, a
derivação produzia `0.7.x`; com ele no histórico, a série passa a `0.8.x`.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/prd.md` | `#4-escopo-in` | componente-novo | **A ampliação central desta feature.** O escopo enumera seis eixos e os agrupa em núcleo e diagnóstico, todos derivados de três territórios de disco. Passou a haver um sétimo eixo e um quarto território: o registro de bugs em `_reversa_bugs/`, lido pela mesma divisão que os demais já praticavam, uma sonda que olha e um julgamento que decide. Leia a lista de eixos como sete, e o comportamento de "leitura automática na ativação" como abrangendo também o registro. A navegação declarada no mesmo bloco, abrir no editor o arquivo que o painel aponta, ganhou um ponto de partida novo, e apenas um: o identificador do bug. |
| `_reversa_sdd/prd.md` | `#5-nao-objetivos-out` | regra-nova | Nenhum não-objetivo foi reaberto, e dois merecem leitura explícita. O primeiro, a proibição de escrita de arquivo por conta própria, sobreviveu intacto a uma entrega que precisou fabricar estados doentes: quem escreve é `scripts/estragar-registro.js`, script de terminal que copia o workspace para pasta temporária e adoece a cópia, e a extensão continua sem abrir arquivo para escrever em camada alguma. O segundo é o adiamento dos cinco eixos por custo de tela; o registro de bugs não estava entre eles, de modo que este acréscimo não é reabertura, e o critério que sustentava o adiamento foi honrado pelo recolhimento padrão do bloco novo. |
| `_reversa_sdd/prd.md` | `#3-metricas-de-sucesso` | regra-nova | A métrica única, retomar projeto parado há trinta dias sem reler documentação nem inspecionar arquivos, passou a cobrir defeitos além de features. Antes desta entrega, um bug aberto era invisível ao painel e só existia para quem lembrasse de olhar a pasta; agora ele aparece no bloco, com a data em que se moveu pela última vez e a marca de qual tratar em seguida. Leia a métrica como instrumentada em mais um eixo, não ainda como aferida. |
| `_reversa_sdd/prd.md` | `#9-criterios-de-aceite-alto-nivel` | regra-nova | Dois critérios ganharam superfície nova a cumprir. O do Retomador, que identifica o próximo passo sem abrir arquivo algum, passa a valer também para o próximo defeito a tratar. O da auditoria, que exige nenhuma abertura de arquivo para escrita em camada alguma, ganhou três módulos novos a auditar, e a suíte de fronteiras foi estendida para varrê-los: `src/domain/front-matter.ts`, `src/domain/bugs.ts` e `src/probe/bugs.ts` recusam módulo de plataforma, escrita e execução de processo. |
| `_reversa_sdd/prd.md` | `#pendencias-de-cobertura` | regra-alterada | O item 2 dizia que os cinco eixos fora do escopo estavam adiados por custo de tela e seriam reabertos quando um deles fosse necessário numa retomada concreta. O que aconteceu foi um caso vizinho e distinto, e vale registrar a diferença: o eixo que entrou não estava na lista dos cinco. Os outros três itens seguem intocados. |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#8-design-e-interface` | componente-novo | Três módulos novos, na divisão que a seção já fixava. `src/probe/bugs.ts` é a sonda, gêmea de `probe/features.ts`: desce só em `<contexto>/bugs/<ID>/`, lista uma vez por pasta para responder às duas perguntas, o `bug.md` e a trava, e não importa módulo de plataforma, de modo que `node:fs` continua num arquivo só do repositório. `src/domain/bugs.ts` é o julgamento. `src/domain/front-matter.ts` é o leitor restrito, escrito em vez de embarcar o pacote `yaml`, que custaria 796 KB de distribuição para dez campos escalares. |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#9-modelo-de-dados` | delta-de-dados | O modelo ganhou o registro inteiro: cinco vocabulários fechados, estado, fase, severidade, prioridade e inconsistência; `BugEntry` com valor reconhecido e valor bruto lado a lado em cada campo de vocabulário; as contagens por grupo e do projeto; e a forma estrutural comum de anomalia, que substituiu o tipo herdado sem tocar na união fechada do pacote vendorizado. **A distinção que mais pesa na leitura:** a contagem do projeto soma a repartição dos grupos e toma o total do disco, e é `lidos` mais `truncado` que declaram a diferença entre os dois. |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#11-edge-cases-e-tratamento-de-erros` | regra-nova | A regra da seção, degradar em vez de falhar e transformar toda perda em anomalia com arquivo, código e detalhe, passou a valer sobre um alfabeto novo de perdas: bloco de front matter ausente, bloco não fechado, estado fora do vocabulário, data malformada, `blocking` presente e vazio contra `blocking` com item. **Achado da fase de preparação, registrado como W017 e a linha mais importante desta tabela para quem reler o código:** chave de topo é chave que começa na COLUNA ZERO. Dois dos três `bug.md` reais trazem um `- id:` recuado dentro de `change_set:`, e um leitor que aparasse a linha antes de cortar a chave teria trocado o identificador do bug pelo do conjunto de mudanças, sem anomalia e sem sintoma. Bloco não fechado não é lido pela metade: vira falha nomeada. |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#7-requisitos-nao-funcionais` | regra-nova | O teto de cinquenta pastas de feature por leitura ganhou um irmão de forma idêntica e objeto diferente, cinquenta bugs por passagem, com o literal declarado em `src/domain/limits.ts` ao lado da prosa que explica a duplicação em relação ao `policy.ts` herdado e por que ela é aceita. A leitura do registro no teto levou 24 ms contra o teto de 200. A fronteira que mantém a camada pura foi estendida aos três módulos novos. |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#12-seguranca-e-privacidade` | regra-nova | Duas garantias novas, ambas verificadas por suíte própria. A primeira é a recusa de `generated/`: nenhum caminho sob projeção é aberto, e apagar a projeção não altera o que a leitura devolve, o que uma suíte prova espionando as três funções de leitura que a sonda usa. A segunda é o bug `restricted`, filtrado ANTES de qualquer montagem, porque a exigência é que o conteúdo não atravesse o canal, e não que a tela deixe de desenhá-lo. Ele é contado e não tem campo algum montado. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#9-modelo-de-dados` | delta-de-contrato-externo | `SetProcessData` ganhou `bugs`, por acréscimo e ao fim dos campos existentes, que é a única forma de crescimento que a seção admite. Nenhum campo foi renomeado ou reordenado. **A distinção que o contrato passa a carregar, registrada como W024:** o campo AUSENTE significa host anterior ao campo, e é caso real deste projeto, distinto de registro vazio. A tela nomeia os dois por extenso em vez de desenhar um bloco vazio que mentiria por omissão. Bug restrito não atravessa o canal. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#6-requisitos-funcionais` | regra-nova | A sessão passou a montar o registro na carga do processo, ao lado da decomposição e do histórico, sem tocar no que já viajava. A sonda e o julgamento entraram no mesmo bloco protegido que já cobria a varredura das pastas de feature, de modo que uma caminhada que lance vira o estado de erro nomeado, e não exceção no editor. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#6-requisitos-funcionais` | regra-alterada | Três requisitos da seção ganharam objeto novo sem mudar de natureza. RF-14, a ordem das seções, passou de oito nomes para nove, com o bloco de bugs logo depois do histórico. RF-03, que manda a faixa de bloqueio nomear toda decisão pendente, passou a receber o registro ao lado do processo e a produzir três condições, fase de espera por decisão, bloqueio declarado e severidade alta em bug não encerrado, com uma linha por bug e as razões fundidas quando um bug reúne mais de uma. RF-10, a abertura de arquivo por mensagem à ponte, ganhou um ponto de partida e apenas um: o identificador do bug é o único elemento do bloco que pede a abertura. **Duas leituras registradas, W020 e W021:** severidade alta cobre `critical` e `high`, e as condições leem o valor reconhecido, nunca o bruto, porque o painel não pode afirmar o que significa uma fase que não sabe ler. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#8-design-e-interface` | componente-novo | Duas peças, e a divisão entre elas é o cumprimento de RF-13. `src/webview/domain/bugs-view.ts` decide ordem, recorte e destaque numa passagem só, e `src/webview/ui/BugsSection.tsx` apenas desenha o que chega pronto. **Escolha registrada como W019:** a marca do próximo a tratar é o primeiro não encerrado do BLOCO, e não do primeiro grupo, porque um grupo pode liderar por movimento de um bug já encerrado e a leitura literal deixaria o painel sem marca enquanto alguém espera. O comparador devolve zero no empate de propósito, para que a ordem de leitura sobreviva a duas leituras idênticas. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#9-modelo-de-dados` | delta-de-dados | A lista única de seções passou de oito para nove nomes, e quem conta seções conta a partir dela, que continua sendo a única fonte. **Distinção registrada como W025, e é a que separa esta feature das anteriores:** a revelação por contexto é estado do painel, e não preferência guardada, porque lembrar a expansão de um grupo que já não existe seria lembrar a coisa errada. O recolhimento do bloco, esse sim, continua preferência, e preferência gravada por versão anterior segue válida. O modelo ganhou ainda `readableDate`, função irmã da conversão de instante que reformata a data sem construir `Date` e sem tocar em fuso. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#11-edge-cases-e-tratamento-de-erros` | regra-nova | Três vazios nomeados à parte, contra a tentação de desenhar um só: campo ausente na carga, registro ausente no projeto e contexto sem bug. Projeto sem pasta de registro devolve registro ausente sem anomalia e sem exceção, porque não ter bugs não é defeito de leitura. Os zeros da repartição são escritos por nome, para que "nenhum aberto" não se confunda com "sem contagem". Valor fora do vocabulário sai desenhado cru e marcado como não reconhecido, e código de anomalia desconhecido não quebra o desenho. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#7-requisitos-nao-funcionais` | regra-nova | As quatro exigências da seção foram medidas de novo com o cartão dentro. O pacote da tela somou 194018 B contra o teto de 409600, e o custo do bloco foi de cerca de 13 KiB sobre a medida da feature 006. A pintura do bloco depois da chegada do processo levou 3 ms contra o teto de 100. O estado é distinguível sem cor: a marca do próximo a tratar repete a forma que a decomposição já usa e vem acompanhada da palavra na linha. A 300 px não há rolagem horizontal. **Registrado como W028:** a guarda de orçamento da suíte mede METADE do teto, e não o teto, porque repetir a constante violaria a fonte única de limites que a feature 005 fixou. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#12-seguranca-e-privacidade` | regra-nova | A tela continua sem abrir conexão e sem falar com o editor por outra via que não a mensagem já existente. O que a seção ganha é uma garantia de conteúdo: bug `restricted` não chega à tela, porque foi filtrado na camada de leitura, de modo que nem título nem identificador dele existem no lado do painel para serem desenhados por engano. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#6-requisitos-funcionais` | componente-novo | `scripts/estragar-registro.js` é o componente novo da seção, no molde que `estragar-workspace.js` abriu na feature 005: copia o workspace para pasta temporária, adoece a cópia e imprime o caminho. Quatro estados que nenhum projeto saudável produz, registro ausente, bug restrito, registro inconsistente e leitura parada no teto. **Registrado como W027:** os estados chegam por cópia adoecida, e não por argumento do preview, que continua sem escrever coisa alguma. `estragar:registro` entra na lista de scripts, que passa a dezoito. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#8-design-e-interface` | regra-nova | A superfície de comandos ganhou o script novo, o cabeçalho de uso do preview passou a nomear os dois auxiliares e a razão de os estados doentes chegarem por cópia, e o README ganhou quatro linhas na tabela do portão visual, uma por estado doente do registro. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#7-requisitos-nao-funcionais` | regra-nova | Uma suíte nova que o plano não previa, `tests/preview-registro.spec.ts`, porque o auxiliar que adoece o registro precisava provar que cada caso produz de fato o estado que promete. As duas medidas de orçamento ficaram escritas ao lado dos tetos, e não apenas conferidas contra eles, para que perda de folga apareça como perda, e não como teste que passou raspando. |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#6-requisitos-funcionais` | regra-nova | Nenhum arquivo vendorizado foi tocado, e um ponto de atrito foi resolvido por declaração em vez de edição: o teto de bugs e o nome da pasta do registro vivem em `src/domain/limits.ts`, duplicando literais que o `policy.ts` herdado também carrega, com a prosa que assume a duplicação e explica por que ela é preferível a editar a herança. **Registrado como W018:** o leitor restrito de front matter é aposta na estabilidade do formato que o registrador escreve; campo escrito em forma que ele não alcança vira falha nomeada, e não valor inventado. |

## Regras sob vigilância

O watch principal de `regression-watch.md` continua **vazio**, pelo mesmo motivo das features 001 a
007: sem extração `/reversa` sobre este repositório não há regras 🟢, e sem regras 🟢 não há o que
vigiar. O que esta entrega deixou de verdades a manter está sem peso de regressão, e ganha peso
quando a primeira `/reversa` sobre este código confirmar cada uma.

Na seção "Observações", os identificadores **W001 a W016** cobrem os requisitos funcionais desta
feature, em correspondência de um para um com `RF-01` a `RF-16`, cada um com origem, regra esperada,
tipo de verificação e sinal de violação. Os identificadores **W017 a W029** estão na subseção
"Escolhas registradas nesta entrega" e guardam as treze decisões tomadas diante de ambiguidade, que
uma leitura futura estranharia sem entender por quê. Seis delas pesam o bastante sobre a leitura da
entrega para aparecerem nomeadas na tabela acima: a chave de topo na coluna zero (W017), a marca do
próximo a tratar como primeiro não encerrado do bloco (W019), a leitura de "severidade alta" e a
assimetria preservada de RF-10 (W020 e W021), o campo `bugs` ausente distinto de registro vazio
(W024), a revelação por contexto como estado e não preferência (W025) e a guarda de orçamento medindo
metade do teto (W028).

**Ponto de atenção para quem rodar a próxima extração.** Esta feature reiniciou a numeração em W001,
como as features 006 e 007 fizeram. O mesmo identificador nomeia, portanto, regras diferentes em
features diferentes, e citação de identificador só é legível junto do nome da feature que o escreveu.
Vale o mesmo para os `RF-NN` e `RN-NN`, que são locais a cada `requirements.md`.

Conteúdo integral em `_reversa_forward/008-cronologia-do-ciclo-bugs/regression-watch.md`.

## Fontes

- `_reversa_forward/008-cronologia-do-ciclo-bugs/legacy-impact.md`
- `_reversa_forward/008-cronologia-do-ciclo-bugs/regression-watch.md`
- `_reversa_forward/008-cronologia-do-ciclo-bugs/requirements.md`
- `_reversa_forward/008-cronologia-do-ciclo-bugs/roadmap.md`
- `_reversa_forward/008-cronologia-do-ciclo-bugs/investigation.md`
- `_reversa_forward/008-cronologia-do-ciclo-bugs/data-delta.md`
- `_reversa_forward/008-cronologia-do-ciclo-bugs/onboarding.md`
- `_reversa_forward/008-cronologia-do-ciclo-bugs/actions.md`
- `_reversa_forward/008-cronologia-do-ciclo-bugs/progress.jsonl`
- `_reversa_forward/008-cronologia-do-ciclo-bugs/interfaces/registro-de-bugs.md`
- `_reversa_forward/008-cronologia-do-ciclo-bugs/interfaces/protocolo-webview.md`
