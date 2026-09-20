# Vigilância de regressão: 012-equivalencias-de-checkpoint

**Data:** 2026-09-20
**Feature:** `012-equivalencias-de-checkpoint`
**Cenário:** greenfield.

Este projeto não tem extração de `/reversa`: o contexto vem de `_reversa_sdd/prd.md` e das cinco
specs de `_reversa_sdd/sdd/`. Não há regra 🟢 confirmada sobre código existente, e por isso o watch
principal nasce vazio. O que esta entrega deixou de verdades a manter está em "Observações", sem
peso de regressão. Elas ganham peso quando uma `/reversa` futura, rodando sobre o código novo,
confirmar cada uma como 🟢.

Uma ressalva própria desta feature. Várias das verdades abaixo são sobre o que o código **não**
faz: não escreve no mapa durante o aprendizado, não fala com serviço algum na leitura, não reescreve
`state.json` em passo nenhum. Ausência é mais difícil de extrair do que presença, e uma extração
futura que não as encontrasse estaria diante de uma lacuna de leitura, não necessariamente de uma
regressão. O sinal de violação, nesses casos, é a presença do que deveria faltar.

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

Sem peso de regressão. São os requisitos que esta entrega implementou, com o lugar onde cada um
vive e o sinal pelo qual uma extração futura perceberia que deixou de ser verdade. Todos nasceram
🟢 em `requirements.md`, exceto RF-14 e RF-17, que nasceram 🟡; RF-13 e RF-14 são `Should` e os
demais `Must`.

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|---|---|---|---|---|
| W001 | `requirements.md` RF-01 e RN-01, `src/domain/equivalencias.ts` | O mapa é por par campo **mais** valor, nunca por campo solto, e cada registro nomeia campo, valor, leitura, data de aprovação e evidência | presença | Mapa indexado por campo; registro sem data ou sem evidência; `status: "failed"` e `status: "success"` caindo na mesma decisão |
| W002 | `requirements.md` RF-02 e RN-02, `src/domain/discovery-state.ts` | A consulta ao mapa vem **depois** de `completed_at` e de `modules_pending`, nessa ordem, e só decide o que os dois não decidiram | presença | Mapa consultado primeiro; `completed_at` perdendo precedência; procedência aparecendo em checkpoint decidido pelo campo canônico |
| W003 | `requirements.md` RF-03 e RF-16, `src/domain/types.ts`, `src/webview/domain/labels.ts` | Quatro situações do checkpoint, e `falhou` **jamais** vem do esquema: só de par aprovado | presença | Volta às três situações; `falhou` derivado de campo do esquema; falha desenhada como conclusão |
| W004 | `requirements.md` RF-04 e RN-11, `src/domain/discovery-state.ts` | O par reconhecido cala `checkpoint-sem-conclusao-declarada`, qualquer que seja a situação reconhecida, inclusive a falha | ausência | Anomalia sobrevivendo ao reconhecimento; falha reconhecida contada como conclusão não declarada |
| W005 | `requirements.md` RF-05, `src/domain/discovery-state.ts` | Sem `completed_at`, sem `modules_pending` e sem par aprovado, a anomalia da 011 fica intacta | presença | Anomalia desaparecendo com mapa vazio; `at` promovido a declaração de conclusão |
| W006 | `requirements.md` RF-06, `src/domain/discovery-state.ts` | O instante permanece nulo quando a conclusão veio de par aprovado, ainda que o checkpoint traga `at` | ausência | Instante exibido em checkpoint reconhecido por equivalência |
| W007 | `requirements.md` RF-07 e RNF-04 da spec da leitura, `src/domain/*`, `src/host/reading.ts` | A camada de leitura não ganhou escrita, processo filho nem cliente de rede, e isso é verificável por inspeção dos `import` | ausência | `node:fs` de escrita, `child_process` ou `fetch` dentro de `src/domain/` ou do caminho de leitura do host |
| W008 | `requirements.md` RF-08 e RN-06, `src/webview/ui/DiscoverySection.tsx` | A procedência viaja em texto, nomeando campo e valor **brutos**, e nunca só em cor | presença | Procedência só por cor ou ícone; valor normalizado na tela, que é reescrever o disco na leitura (NG-05) |
| W009 | `requirements.md` RF-09, `package.json`, `scripts/aprender-equivalencias.js` | O aprendizado mora fora do `npm run build` e do pacote, no regime dos `estragar:*` | ausência | `build` invocando o aprendizado; script do aprendizado dentro do `.vsix` |
| W010 | `requirements.md` RF-10, `scripts/equivalencias/motor.js` | O motor é local, por HTTP no próprio computador, com modelo configurável e padrão declarado (`qwen2.5:7b`), temperatura zero e semente fixa | presença | Endereço remoto; modelo fixo no código; temperatura acima de zero |
| W011 | `requirements.md` RF-11 e RN-08, `scripts/equivalencias/elidir.js` | O conteúdo é elidido antes de sair: listas, textos longos e caminhos viram marca, e só chaves e escalares curtos sobrevivem | presença | Carga com caminho de sistema, lista ou texto acima do limite; elisão contornada por um caminho novo |
| W012 | `requirements.md` RF-12 e RN-09, `scripts/aprender-equivalencias.js` | O aprendizado **nunca** escreve no mapa: rodar deixa `src/domain/equivalencias.ts` byte a byte idêntico | ausência | `writeFileSync` sobre o destino do mapa dentro do aprendizado; mapa alterado por rodada de proposta |
| W013 | `requirements.md` RF-13, `scripts/equivalencias/coletar.js` | O já decidido é pulado, e a segunda rodada sem projeto novo propõe nada | ausência | Proposta repetindo par que já está no mapa |
| W014 | `requirements.md` RF-14, `scripts/equivalencias/motor.js`, `scripts/aprender-equivalencias.js` | Motor fora do ar termina com causa nomeada e **nenhum** arquivo escrito, sem proposta pela metade | ausência | Proposta parcial gravada após falha do motor; erro silencioso |
| W015 | `requirements.md` RF-15, `tests/domain-discovery-state.spec.ts` | Mapa vazio ou ausente deixa a leitura idêntica à da 011, sem uma linha da suíte anterior reescrita | presença | Suíte da 011 precisando de ajuste para passar com mapa vazio |
| W016 | `requirements.md` RF-17, `src/domain/discovery-state.ts`, `src/webview/ui/DiscoverySection.tsx` | A entrada aprovada como não-agente sai da contagem de checkpoints, não gera anomalia e é desenhada à parte, sem situação | presença | `plano_aprovado` cobrado por conclusão; entrada não-agente somada aos checkpoints de agente |
| W017 | `requirements.md` RF-18 e RN-10, `scripts/promover-equivalencias.js` | A promoção não conhece o motor: nada importa `motor.js`, e só o marcado entra no mapa | ausência | `require` do motor na promoção; item não marcado promovido; classificação acontecendo na promoção |
| W018 | `requirements.md` RF-19, `scripts/equivalencias/proposta.js` | A proposta é Markdown legível, com uma caixa por item, de modo que aprovar seja marcar num editor comum | presença | Proposta em formato que só a ferramenta lê; aprovação por comando em vez de marcação |
| W019 | `requirements.md` RF-20, `tests/vsix-conteudo.spec.ts`, `.vscodeignore` | `out/domain/equivalencias.js` viaja no pacote, e é por isso que o mapa é módulo e não arquivo de dados | presença | Mapa virando `.json` sob `src/`, que o `.vscodeignore` não readmite; pacote sem o mapa |
| W020 | `roadmap.md` D-07, `src/domain/discovery-state.ts` | O casamento é sobre o valor normalizado, mas o que se **exibe** é o bruto lido do disco | presença | Valor normalizado na procedência; casamento sensível a caixa ou a espaço |
| W021 | `requirements.md` RNF de desempenho e de tamanho, `tests/desempenho-referencia.spec.ts`, `medidas.md` | Consulta ao mapa e julgamento abaixo de 200 ms no pior caso, e pacote da tela abaixo da guarda de 60 % do teto (0,14 ms e 215.258 B em 2026-09-20) | presença | Busca no mapa lendo disco; guarda afrouxada sem decisão registrada |
| W022 | `requirements.md` NG-05 da spec da leitura, todo o caminho | Nenhum `state.json` é reescrito, nem pelo aprendizado, nem pela promoção, nem pela leitura: a tradução é em memória e sobre o mapa | ausência | Ferramenta gravando sobre `.reversa/state.json` de qualquer projeto |
| W023 | `interfaces/motor-local.md` seção 2, `scripts/aprender-equivalencias.js` | A pergunta ao motor tem duas passagens: primeiro sem campo em foco, para eleger os campos de estado, e só depois com foco, restrito aos campos eleitos | presença | Foco aplicado a campo não eleito, que faz `verde: 569` virar conclusão; foco abandonado, que perde o segundo valor de um mesmo campo |
