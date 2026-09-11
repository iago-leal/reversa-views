# Adendo: greenfield e features do PRD

> Identificador da feature: `009-greenfield-e-features-do-prd`
> Data: `2026-09-11`
> Cenário: `greenfield`
> Gerado por: `/reversa-sync`

Este adendo é uma ponte. A extração em `_reversa_sdd/` descreve um painel que lê o processo do
Reversa a partir de `.reversa/`, `_reversa_sdd/` e `_reversa_forward/`, e os adendos 006 e 008
ampliaram a leitura para nove cartões e um quarto território, `_reversa_bugs/`. A entrega da feature
009 não abre território novo: volta ao `_reversa_sdd/`, que a extração visitava só pelos adendos, e
lê dele o que o `/reversa-new` deixou, o brief, a ideação, as personas, o PRD e as specs. Disso saem
dois cartões e duas respostas que o painel não dava: de onde este projeto veio, e quanto do produto
planejado já existe. O painel passa a onze cartões. Nada do que a extração afirma deixou de valer, e
o invariante mais duro, a extensão nunca escreve arquivo, atravessou intacto mais uma feature que
precisou de um auxiliar de terminal justamente para escrever. O que segue diz como ler cada artefato
da extração enquanto a re-extração não vem.

## Vigência

Vigente desde 2026-09-11.

## Resumo da entrega

O painel desenhava a descoberta `/reversa` com cinco fases pendentes, como se um projeto nascido por
`/reversa-new` não tivesse nascido de nada, e o histórico só listava as pastas que já existem em
`_reversa_forward/`, de modo que o que faltava construir era invisível. A feature entrega ao
Retomador as duas respostas: o cartão **Origem do projeto** diz como o projeto nasceu, em que
estágio o pipeline greenfield está e qual agente vem em seguida; o cartão **Panorama do produto**
cruza cada spec de `sdd/` com as pastas de feature, conta quantos componentes planejados convergiram,
lista as pastas que nenhuma spec previu e guarda, recolhido, o escopo que o PRD declarou. Tudo é
derivado dos artefatos em disco, e o disco manda: o metadado que o pipeline escreve em `state.json`
é lido, mostrado e comparado, nunca obedecido, e onde discorda do disco a discordância vira anomalia
com os dois valores.

Quarenta e seis ações executadas, todas marcadas `[X]` em `actions.md` e registradas em
`progress.jsonl`, com uma segunda passagem sobre T045. Vinte e nove arquivos criados, sete deles
fixturas de um mesmo diretório e doze suítes, e vinte e seis modificados. A suíte terminou a entrega
com 1510 casos verdes em 95 arquivos, e o portão visual ganhou seis estados doentes do eixo, cada um
conferido pela suíte contra a leitura real.

Três separações organizam a entrega. A primeira é entre **disco e metadado**: o estágio físico é o
maior contíguo presente entre brief, ideação, personas, PRD e specs, e o `stage` do metadado só é
aceito quando nomeia o agente que produziu o último artefato ou o próximo. A segunda é entre **lido
e não lido**: o campo `greenfield` ausente na carga significa leitura não realizada, e a tela o
distingue por extenso de "projeto que não nasceu por `/reversa-new`" e de "PRD sem decomposição",
porque os três são vazios diferentes. A terceira é entre **planejado e entregue**: o casamento entre
spec e pasta é por nome exato normalizado, sem prefixo nem sufixo, e uma pasta que nenhuma spec nomeia
é declarada fora do plano em vez de forçada para dentro dele.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/prd.md` | `#4-escopo-in` | componente-novo | **A ampliação central desta feature, e ela recai sobre a própria seção.** O escopo enumera os eixos do painel, e passou a haver dois a mais: a origem do projeto e o panorama do produto, ambos derivados do `_reversa_sdd/`. Além disso, a seção virou FONTE DE LEITURA: o painel lê os onze itens dela, agrupados pelos três rótulos em negrito, com nome, detalhe e selo, e os desenha recolhidos dentro do panorama. Leia a lista de eixos como onze cartões, e leia esta seção sabendo que sua forma, título de nível dois com "Escopo", rótulos em negrito e itens de topo, é agora contrato tácito com o leitor de `src/domain/prd-scope.ts`. |
| `_reversa_sdd/prd.md` | `#5-nao-objetivos-out` | regra-nova | Nenhum não-objetivo foi reaberto. O eixo herdado chamado ideação, entre os cinco adiados, lê o brainstorm de `.reversa/active-ideation.json`, e não o pipeline `/reversa-new`; o que entrou é outro eixo, nunca previsto e nunca adiado. A proibição de escrita sobreviveu: quem fabrica estados doentes é `scripts/estragar-greenfield.js`, que copia o workspace e adoece a cópia, e a extensão continua sem abrir arquivo para escrever. O cartão de origem reserva, vazio, o lugar do brainstorm adiado, para que reabri-lo seja acréscimo. |
| `_reversa_sdd/prd.md` | `#3-metricas-de-sucesso` | regra-nova | A métrica única, retomar projeto parado há trinta dias sem reler documentação, passou a cobrir o produto inteiro e não só a feature ativa: "o próximo passo" agora inclui o próximo componente planejado sem pasta e o próximo agente do pipeline greenfield quando ele parou no meio. Leia a métrica como instrumentada em mais dois eixos, não ainda como aferida. |
| `_reversa_sdd/prd.md` | `#9-criterios-de-aceite-alto-nivel` | regra-nova | O critério do Retomador, identificar o próximo passo sem abrir arquivo, ganhou duas superfícies: o grupo "em andamento" encabeça o panorama com a feature ativa à frente, e a faixa de bloqueio nomeia o agente que falta com o comando `/reversa-<agente>` para copiar. O critério da auditoria ganhou três módulos novos a varrer, `src/probe/greenfield.ts`, `src/domain/greenfield.ts` e `src/domain/prd-scope.ts`, e a suíte de fronteiras do host ganhou dois guardas: nenhum nome de artefato do pipeline nem token de agente pode aparecer no host. |
| `_reversa_sdd/prd.md` | `#pendencias-de-cobertura` | regra-alterada | O item 2 dizia que os eixos adiados seriam reabertos quando necessários numa retomada concreta. Como na 008, o que entrou não estava entre os adiados: é caso vizinho e distinto, e a diferença vale registro. Os demais itens seguem intocados. |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#8-design-e-interface` | componente-novo | Três módulos novos, na divisão que a seção já fixava. `src/probe/greenfield.ts` é a sonda: UMA listagem da pasta de saída decide a presença dos seis nomes, uma de `sdd/` lista as specs, e só DOIS corpos são abertos, o brief e o PRD; ideação, personas e specs são listados e nunca lidos. `src/domain/greenfield.ts` é o julgamento. `src/domain/prd-scope.ts` é o leitor restrito de uma seção do PRD, apartado para ser dirigido por fixtures, entre elas o PRD real deste projeto transcrito. `node:fs` continua num arquivo só do repositório. |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#9-modelo-de-dados` | delta-de-dados | O modelo ganhou o eixo inteiro: seis estágios físicos, quatro cenários pela regra da âncora do `/reversa-coding`, o metadado do pipeline com seis campos crus, o componente planejado com TODAS as pastas casadas e a mais avançada representando-o, a feature fora do plano, o item de escopo com grupo, nome, detalhe e selo, o panorama com a contagem de convergidos e a marca de escopo encontrado, e seis códigos de anomalia próprios na forma estrutural comum. **A distinção que mais pesa na leitura:** `convergidos` conta as specs lidas, nunca as pastas fora do plano, e `totalDeSpecs` é o do disco mesmo quando o teto de cinquenta parou a leitura. |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#6-requisitos-funcionais` | regra-nova | RF-03 e RF-04 da seção, estágio e fases derivados do disco e nunca do campo autodeclarado, ganharam um segundo objeto com a mesma regra e uma consequência a mais: o campo autodeclarado é lido e COMPARADO. Cada estágio físico aceita o token do agente que o produziu e o do próximo, porque em modo guiado o metadado anda um passo atrás ou à frente do disco enquanto o usuário não dá o CONTINUAR; fora do conjunto, `estagio-greenfield-divergente` nomeia os dois valores e o disco manda. **Registrado como W004.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#11-edge-cases-e-tratamento-de-erros` | regra-nova | A regra da seção, degradar em vez de falhar, passou a valer sobre um alfabeto novo: buraco na sequência de artefatos, que não avança o estágio e nomeia o primeiro ausente; `newproject_progress` presente e que não é objeto; brief ou PRD acima do teto de 256 KiB, declarado e não lido pela metade; duas specs que colidem após normalização, só a primeira entrando; PRD lido sem seção de escopo reconhecível. O que NÃO é anomalia, por decisão: PRD ausente, `sdd/` vazia e metadado ausente, porque projeto legado não os tem. **Registrado como W002, W003 e W022.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#7-requisitos-nao-funcionais` | regra-nova | Dois tetos novos, `SPEC_CAP` e `SCOPE_ITEM_CAP`, ambos cinquenta, em `src/domain/limits.ts` ao lado dos sete nomes de arquivo e pasta do pipeline. A referência de desempenho ganhou o eixo no teto, cinquenta specs e cinquenta itens de escopo com o brief e o PRD perto de 64 KiB, e leitura e julgamento ficaram dentro dos 200 ms. A fronteira que mantém a camada pura foi estendida aos três módulos novos. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#9-modelo-de-dados` | delta-de-contrato-externo | `SetProcessData` ganhou `greenfield`, décimo campo, por acréscimo e ao fim, que é a única forma de crescimento que a seção admite. **A distinção que o contrato passa a carregar, registrada como W008:** o campo AUSENTE significa host anterior ao campo e é lido pela tela por `=== undefined`, nunca por cenário; um painel que lesse a ausência como "projeto legado" afirmaria o que ninguém leu. Os corpos do brief, do PRD e das specs nunca atravessam o canal; viaja o derivado. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#6-requisitos-funcionais` | regra-nova | A sessão passou a montar o eixo na carga, e a sonda entrou no mesmo bloco protegido que já cobria as pastas de feature e o registro de bugs, DEPOIS do histórico, porque o julgamento cruza as entradas já julgadas. A pasta de saída vem do processo herdado e o `state.json` cru vem do retrato; nenhum caminho do Reversa é escrito no host, e dois guardas novos na suíte de fronteiras recusam os nomes de arquivo do pipeline e os tokens de agente e estágio. **Registrado como W009.** |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#6-requisitos-funcionais` | regra-alterada | Quatro requisitos da seção ganharam objeto novo sem mudar de natureza. RF-14, a ordem das seções, passou de nove nomes para onze: `panorama` logo depois da decomposição, `origem` logo depois da descoberta, e a ordem relativa dos nove anteriores intacta. RF-03, a faixa de bloqueio, passou a receber o eixo como terceiro argumento e a produzir uma razão quando o pipeline começou, o projeto não tem âncora de legado e o estágio está antes das specs, com o comando do agente que falta; para PRD sem spec o comando é `/reversa-spec-sdd`. RF-04, as cinco fases sempre desenhadas, ganhou uma frase quando o projeto nasceu por `/reversa-new` e nenhuma fase terminou. RF-10, abrir artefato por mensagem, ganhou a spec, o adendo, o brief e os artefatos do pipeline como pontos de partida; a pasta não, porque é diretório. **Registrado como W013, W015 e W016.** |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#8-design-e-interface` | componente-novo | Dois cartões e duas funções puras, e a divisão entre eles é o cumprimento de RF-13. `src/webview/domain/panorama-view.ts` decide ordem, agrupamento e contagem conferida numa passagem só, e `src/webview/domain/origin-view.ts` decide o estado das quatro etapas, o próximo agente e se o pipeline começou; `PanoramaSection.tsx` e `OriginSection.tsx` apenas desenham. **Escolha registrada como W012:** a divergência entre a contagem da leitura e a lista é DECLARADA ao lado do número, e nenhum dos dois é escolhido. O botão de abrir arquivo dos dois cartões vive em `OpenFile.tsx`, escrito uma vez. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#9-modelo-de-dados` | delta-de-dados | A lista única de seções passou de nove para onze nomes, e quem conta seções conta a partir dela. A origem entra no recolhimento padrão, com o estágio escrito no título para que nada se perca fechada; o panorama nasce aberto, por ser a resposta à segunda pergunta do Retomador. **Registrado como W011 e W013:** a revelação do escopo do PRD dentro do panorama é estado do painel, não preferência guardada, pelo mesmo motivo da revelação por contexto da 008. Seis rótulos novos pela mesma função total: valor fora do vocabulário sai cru e marcado como não reconhecido. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#11-edge-cases-e-tratamento-de-erros` | regra-nova | Três vazios nomeados à parte em cada cartão, e nunca um bloco vazio: campo ausente na carga ("não foi lido por esta leitura"), projeto que não nasceu por `/reversa-new`, e PRD sem decomposição em specs. As quatro etapas da origem são desenhadas SEMPRE, todas pendentes num projeto legado, para que o cartão mostre onde o pipeline estaria. O lugar do brainstorm fica reservado e vazio depois delas, com atributo próprio. **Registrado como W014 e W023.** |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#7-requisitos-nao-funcionais` | regra-alterada | As exigências da seção foram medidas de novo com os dois cartões dentro, e uma delas exigiu decisão. O pacote da tela somou 206.403 B contra o teto de 409.600, e os dois cartões custaram cerca de 12 KiB depois de uma rodada de compactação; a guarda da suíte, que desde a 008 exigia METADE do teto, falhou por 1.603 B. **Decisão do usuário em 2026-09-11, registrada como W027:** a guarda passou a exigir 60 % do teto, com a medida e a razão escritas no próprio caso, em vez de subir o teto ou cortar o bloco do escopo. A pintura dos dois cartões, com cinquenta componentes e cinquenta itens de escopo, ficou dentro dos 100 ms. Estado de etapa e situação de componente são palavras, nunca só cor. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#12-seguranca-e-privacidade` | regra-nova | A tela continua sem abrir conexão e sem falar com o editor por outra via que não a mensagem já existente. O que a seção ganha é uma garantia de conteúdo: nenhum corpo de spec, de brief ou de PRD chega à tela; chega o que foi derivado, e a única prosa do PRD que atravessa o canal são os itens do escopo, já cortados em nome, detalhe e selo. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#6-requisitos-funcionais` | componente-novo | `scripts/estragar-greenfield.js` é o componente novo da seção, no molde de `estragar-registro.js`: copia o workspace, adoece a cópia e imprime o caminho. Seis estados que este projeto, saudável, não produz: sem âncora alguma, pipeline parado nas personas, metadado divergente, PRD sem decomposição, PRD sem seção de escopo e leitura de specs no teto. **Registrado como W020:** é o único que escreve no `state.json`, e só no da CÓPIA, porque metade dos estados é sobre o metadado. `estragar:greenfield` entra na lista de scripts, que passa a dezenove. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#8-design-e-interface` | regra-nova | O README ganhou seis linhas na tabela do portão visual, uma por estado doente do eixo, cada uma um comando de terminal que encadeia o auxiliar ao preview. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#7-requisitos-nao-funcionais` | regra-alterada | A guarda de orçamento do pacote da tela mudou de fração: de metade para 60 % do teto, por decisão do usuário, com a medida escrita ao lado (ver a linha de `painel-do-processo.md#7` acima). O teto em si, `TETO_DO_PACOTE_DA_TELA` em `scripts/limites.js`, não mudou e continua a fonte única. `tests/preview-greenfield.spec.ts` prova que cada caso do auxiliar produz o estado que promete. |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#6-requisitos-funcionais` | regra-nova | Nenhum arquivo vendorizado foi tocado. A sonda nova reutiliza `listNames`, `readText` e `resolveInside` do pacote herdado, e o julgamento reutiliza `parseJsonSafe`, `asRecord`, `asString`, `asStringList`, `splitSections` e a normalização de chave do herdado; a leitura de `newproject_progress` sai do texto cru do `state.json` que o retrato já carrega, sem estender `StateContract`. Os nomes dos artefatos do pipeline duplicam literais que o herdado conhece, e a duplicação está declarada em `src/domain/limits.ts` pelo mesmo motivo da 008. **Registrado como W001 e W021.** |

## Regras sob vigilância

O watch principal de `regression-watch.md` continua **vazio**, pelo mesmo motivo das features 001 a
008: sem extração `/reversa` sobre este repositório não há regras 🟢, e sem regras 🟢 não há o que
vigiar. O que esta entrega deixou de verdades a manter está sem peso de regressão, e ganha peso
quando a primeira `/reversa` sobre este código confirmar cada uma.

Na seção "Observações", os identificadores **W001 a W023** cobrem os requisitos funcionais desta
feature, `RF-01` a `RF-24`, com origem, regra esperada, tipo de verificação e sinal de violação. Os
identificadores **W024 a W027** estão na subseção "Escolhas registradas nesta entrega": o metadado
lido mesmo sem pasta de saída (W024), a precedência da marca entre várias pastas casadas (W025), o
escopo parado no teto declarado como artefato truncado (W026) e a guarda de orçamento a 60 % do teto
(W027). Os que mais pesam sobre a leitura da entrega aparecem nomeados na tabela acima.

**Ponto de atenção para quem rodar a próxima extração.** Esta feature reiniciou a numeração em W001,
como as anteriores. O mesmo identificador nomeia regras diferentes em features diferentes, e citação
de identificador só é legível junto do nome da feature que o escreveu. Vale o mesmo para os `RF-NN` e
`RN-NN`, locais a cada `requirements.md`.

Conteúdo integral em `_reversa_forward/009-greenfield-e-features-do-prd/regression-watch.md`.

## Fontes

- `_reversa_forward/009-greenfield-e-features-do-prd/legacy-impact.md`
- `_reversa_forward/009-greenfield-e-features-do-prd/regression-watch.md`
- `_reversa_forward/009-greenfield-e-features-do-prd/requirements.md`
- `_reversa_forward/009-greenfield-e-features-do-prd/roadmap.md`
- `_reversa_forward/009-greenfield-e-features-do-prd/data-delta.md`
- `_reversa_forward/009-greenfield-e-features-do-prd/actions.md`
- `_reversa_forward/009-greenfield-e-features-do-prd/progress.jsonl`
