# Impacto sobre o legado: `013-botao-do-prompt`

> Data: `2026-09-20`
> Feature: `013-botao-do-prompt`
> Cenário: **greenfield**. Feature greenfield, sem legado pré-existente. Âncora: `prd.md` + specs SDD.
> Política de edição no momento da execução: `allowLegacyEdits: true` com `allowedPaths` **vazio**,
> isto é, liberação **irrestrita** de toda a raiz do projeto. Nenhuma escrita foi recusada, e nenhum
> arquivo pré-existente foi apagado.

Este projeto nasceu por `/reversa-new` e nunca passou por extração reversa: não há `architecture.md`
nem `domain.md`, e por isso não há regra 🟢 extraída de código a preservar ou a modificar. O mapeamento
abaixo aponta para as specs de `_reversa_sdd/sdd/`, que são a âncora real, e todo impacto é do tipo
`componente-novo` no sentido que a skill dá ao termo: acréscimo sobre componente já especificado, sem
regra anterior derrubada.

## Arquivos afetados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/domain/types.ts` | `leitura-do-processo` | `delta-de-dados` | MEDIUM | `CheckpointState` cresce por acréscimo no fim, com `formaElidida` opcional; host antigo continua válido |
| `src/domain/elisao.ts` | `leitura-do-processo` | `componente-novo` | MEDIUM | Transcrição de `scripts/equivalencias/elidir.js` para dentro do domínio, presa por suíte de paridade |
| `src/domain/discovery-state.ts` | `leitura-do-processo` | `regra-nova` | HIGH | A forma elidida passa a ser anexada no quarto ramo de `lerCheckpoint`; os três anteriores escrevem a nulidade |
| `src/webview/domain/prompt.ts` | `painel-do-processo` | `componente-novo` | HIGH | A apuração da disponibilidade e a composição do texto, em função pura da carga |
| `src/webview/ui/Header.tsx` | `painel-do-processo` | `regra-alterada` | MEDIUM | Duas ações novas; a confirmação de cópia deixa de ser booleana e passa a nomear o que foi copiado |
| `src/webview/ui/App.tsx` | `painel-do-processo` | `componente-novo` | LOW | Três portas opcionais atravessadas até o cabeçalho, sem decisão própria |
| `src/webview/main.tsx` | `painel-do-processo` | `regra-nova` | MEDIUM | A composição e o despacho, no molde de `summarise`, mais a linha de canal com a contagem |
| `scripts/equivalencias/estados.js` | `empacotamento-e-verificacao` | `componente-novo` | LOW | A varredura sai de `aprender-equivalencias.js` para módulo próprio, com a pasta acrescentada a cada estado |
| `scripts/aprender-equivalencias.js` | `empacotamento-e-verificacao` | `regra-alterada` | LOW | Passa a importar a varredura extraída; comportamento idêntico, verificado pela suíte da 012 |
| `scripts/prompt-harness.js` | `empacotamento-e-verificacao` | `componente-novo` | MEDIUM | Comando de manutenção fora do build e fora do pacote, com o mesmo texto do painel |
| `package.json` | `empacotamento-e-verificacao` | `delta-de-contrato-externo` | LOW | `prompt:harness` declarado ao lado dos auxiliares; `build` não o invoca |
| `README.md` | `empacotamento-e-verificacao` | `componente-novo` | LOW | Seção do botão e do comando, com a promessa negativa e o cuidado da varredura |
| `tests/*` (13 arquivos) | todos os três | `componente-novo` | LOW | Treze suítes escritas antes do núcleo, mais duas vizinhas atualizadas por consequência |

## Diff conceitual por componente

**`leitura-do-processo`.** O eixo da descoberta passa a carregar, no checkpoint, a forma elidida do que
está em disco. A medição que decidiu isso está no `investigation.md`: `camposComLista` só reporta campo
cujo valor é lista de textos, e só quando `files` falta, de modo que dois dos três casos reais chegavam
ao painel sem campo algum nomeado. A elisão roda **dentro** de `readDiscoveryState`, no domínio puro, e
não no host: a webview nunca vê o checkpoint cru, e a promessa de privacidade fica verificável na
fronteira em vez de espalhada pelos componentes. A nulidade da forma está **escrita** nos três ramos que
decidem antes, e não herdada de um objeto comum, porque a leitura do código é parte da promessa.

**`painel-do-processo`.** O cabeçalho ganha o terceiro texto derivado da leitura, ao lado do resumo da
006. A disponibilidade é apurada **uma vez**, por função única, e a mesma apuração alimenta o botão e o
texto: a lição de `anomalies-view.ts` é que uma tela que decide isso duas vezes acaba oferecendo botão
aceso ao lado de recusa. A razão do desabilitado viaja em elemento próprio, porque botão cinzento não
informa quem não vê cor nem diz por quê a quem vê. A confirmação de cópia deixou de ser booleana: com
dois botões de cópia no mesmo cabeçalho, um booleano diria "resumo copiado" depois do clique no prompt.

**`empacotamento-e-verificacao`.** O comando de manutenção existe porque o painel observa uma raiz por
leitura e os três casos moram em três projetos. Ele não antecipa decisão alguma sobre a tela: enxergar
além da raiz observada segue sendo a OQ-01 da spec da ponte. Três promessas negativas: não fala com
motor, não classifica e não escreve em `state.json` de ninguém. A duplicação do texto entre painel e
comando é declarada e presa por `tests/prompt-paridade.spec.ts`, que compara o texto inteiro.

## Preservadas

Vazio, com a nota do cabeçalho: não há regra 🟢 extraída de código neste projeto, porque nunca houve
extração reversa. O que foi preservado por decisão, e não por extração, fica registrado aqui para o dia
em que a extração vier:

- Os sete comandos da webview no protocolo: a feature não acrescentou comando algum, e `dispatch`
  continua reservado e sem tratador.
- O teto de bytes do canal (`SUMMARY_TEXT_CAP`), que já recusa nomeando o tamanho recebido.
- Os rótulos da tela em `labels.ts`, intocados: a frase da situação no prompt é constante presa pela
  paridade, e não rótulo novo.
- O mapa aprovado da 012, que nenhum passo desta feature reescreve.

## Modificadas

Vazio, com a mesma nota. Nenhuma regra extraída foi alterada ou removida, porque não há regra extraída.
As duas expectativas vizinhas que mudaram são de suíte, não de regra, e estão declaradas no
`progress.jsonl`: `tests/host-manifest.spec.ts` passou a enumerar vinte e três scripts, e
`tests/preview-descoberta.spec.ts` passou a exigir a forma nula no checkpoint reconhecido por par
aprovado, que é a invariante desta feature lida de fora.
