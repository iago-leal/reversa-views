# Vigilância de regressão: 013-botao-do-prompt

**Data:** 2026-09-20
**Feature:** `013-botao-do-prompt`
**Cenário:** greenfield.

Este projeto não tem extração de `/reversa`: o contexto vem de `_reversa_sdd/prd.md` e das cinco specs
de `_reversa_sdd/sdd/`. Não há regra 🟢 confirmada sobre código existente, e por isso o watch principal
nasce vazio. O que esta entrega deixou de verdades a manter está em "Observações", sem peso de
regressão. Elas ganham peso quando uma `/reversa` futura, rodando sobre o código novo, confirmar cada
uma como 🟢.

A ressalva da 012 vale aqui com força maior, e convém repeti-la em vez de remeter a ela. A maior parte
do que esta feature promete é **ausência**: o texto não carrega o conteúdo dos campos, não afirma que o
guia de checkpoint existe naquela raiz, não menciona quem já foi decidido por gente, não promove um
instante qualquer a prova de conclusão, e o comando não fala com motor nem escreve em `state.json`
algum. Ausência é mais difícil de extrair do que presença: uma extração futura que não achasse estas
verdades estaria diante de lacuna de leitura, e não necessariamente de regressão. Nesses itens, o sinal
de violação é a **presença do que deveria faltar**.

## Watch principal

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|---|---|---|---|---|
| | | | | |

Vazio nesta rodada. Nenhuma regra extraída de código existente foi alterada ou removida, porque nenhuma
foi extraída ainda.

## Histórico de re-extrações

Vazio. Será preenchido pelo agente reverso quando `/reversa` rodar de novo sobre este código.

## Arquivadas

Vazio.

## Observações

Sem peso de regressão. São os requisitos que esta entrega implementou, com o lugar onde cada um vive e
o sinal pelo qual uma extração futura perceberia que deixou de ser verdade. Todos nasceram 🟢 em
`requirements.md`, exceto RF-14, que nasceu 🟡; RF-02, RF-14 e RF-20 são `Should` e os demais `Must`.

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|---|---|---|---|---|
| W001 | `requirements.md` RF-01 e RF-02, `src/webview/ui/Header.tsx` | Duas ações do prompt no cabeçalho, ao lado das duas do resumo, cada uma com `data-action` próprio, e os dois destinos recebendo texto idêntico | presença | Uma ação só; destino compondo texto por conta própria; rótulo do resumo renomeado para acomodar o prompt |
| W002 | `requirements.md` RF-03, `src/webview/domain/prompt.ts` | O texto é função pura da carga, em módulo do domínio da webview, exercitável sem navegador e sem decisão de layout dentro | presença | Composição migrando para o componente; módulo lendo disco, relógio ou ambiente |
| W003 | `requirements.md` RF-04, `src/webview/domain/prompt.ts` | Um bloco por checkpoint em `conclusao-nao-declarada`, na ordem em que o eixo os entrega | presença | Ordenação por conveniência de leitura; bloco por checkpoint de outra situação |
| W004 | `requirements.md` RF-05, `src/webview/domain/prompt.ts` | Cada bloco nomeia agente, situação em palavras e a forma elidida, com os campos com lista nomeados e **nunca** chamados de saídas | presença | A palavra "saídas" aplicada a `achados` ou `lacunas`; bloco sem o campo que resolve o caso |
| W005 | `requirements.md` RF-06 e RN-17, `src/webview/domain/prompt.ts` | A norma declarada é `completed_at` com `files`, atribuída ao guia de checkpoint, dizendo onde ele **costuma** morar sem afirmar que existe naquela raiz | presença | Caminho do guia afirmado como fato; norma sem um dos dois campos |
| W006 | `requirements.md` RF-07, `src/webview/domain/prompt.ts` | A raiz observada aparece no texto sem abreviação, dizendo em que sessão colar | presença | Raiz encurtada, com til ou com reticências; texto sem raiz alguma |
| W007 | `requirements.md` RF-08, `src/webview/domain/prompt.ts` | Os quatro pedidos, numerados e na ordem: confirmar a conclusão, gravar os canônicos preservando o que existe, nomear o `SKILL.md` culpado, propor a correção sem aplicar | presença | Pedido fora de ordem; o quarto sem a ressalva de não aplicar; pedido de conserto direto no `state.json` |
| W008 | `requirements.md` RF-09, `src/webview/domain/prompt.ts` | As quatro proibições fecham o texto: não renomear, não normalizar, não reescrever o arquivo inteiro, não mexer em outro agente | presença | Proibição faltando; proibição virando sugestão |
| W009 | `requirements.md` RF-10 e RF-19, `src/webview/domain/prompt.ts`, `src/webview/ui/Header.tsx` | A disponibilidade é apurada por função única, e as três razões são três fatos distintos, escritos em elemento próprio | presença | Disponibilidade decidida duas vezes; razão só no aspecto do botão; razão da leitura ausente lida como "projeto sem defeito" |
| W010 | `requirements.md` RF-11, `src/webview/ui/Header.tsx` | A cópia é confirmada por linha, sem diálogo e sem notificação, **nomeando** o que foi copiado | presença | Diálogo ou notificação; confirmação booleana dizendo "resumo copiado" após o clique no prompt |
| W011 | `requirements.md` RF-12, `src/host/router.ts` | O teto de bytes do canal segue em vigor e recusa nomeando o tamanho recebido, em vez de truncar calado | presença | Truncamento silencioso; teto contornado por comando novo |
| W012 | `requirements.md` RF-13, `src/host/protocol.ts` | Nenhum comando novo no protocolo: o prompt viaja pelos comandos do resumo, e `dispatch` continua reservado e sem tratador | ausência | Oitavo comando da webview; tratador em `dispatch` |
| W013 | `requirements.md` RF-14, `src/webview/main.tsx` | O canal registra que o prompt foi composto e para quantos casos, **sem** o texto | ausência | Conteúdo do prompt no log; contagem ausente |
| W014 | `requirements.md` RF-15 e RF-16, `src/webview/domain/prompt.ts` | Quem foi reconhecido por par aprovado e quem foi aprovado como registro não-agente ficam fora do prompt, sem menção | ausência | Bloco sobre checkpoint reconhecido; menção a `plano_aprovado`; pedido de revisão de aprovação já feita |
| W015 | `requirements.md` RF-17, `src/domain/types.ts`, `src/domain/discovery-state.ts` | `formaElidida` cresce por acréscimo no fim e é opcional: host anterior ao campo não o manda, e o painel compõe o prompt sem ele | presença | Campo obrigatório; painel quebrando diante de host antigo; campo inserido no meio da estrutura |
| W016 | `requirements.md` RF-18 e RN-08 da 012, `src/domain/elisao.ts`, `scripts/equivalencias/elidir.js` | A elisão preserva chaves e escalares de até quarenta caracteres e troca lista, texto longo, caminho e objeto por marcador; as duas implementações concordam | presença | Conteúdo de lista ou caminho de sistema no texto; limite alterado num lado só; `tests/elisao-paridade.spec.ts` afrouxada |
| W017 | `requirements.md` RF-19, `src/domain/discovery-state.ts` | A forma acompanha **uma** situação só, e a nulidade das outras três está escrita ramo a ramo, não herdada de objeto comum | presença | Forma em checkpoint concluído, em andamento ou reconhecido; nulidade por omissão |
| W018 | `requirements.md` RF-20, `scripts/prompt-harness.js`, `scripts/equivalencias/estados.js` | O comando varre a raiz declarada, monta um texto com todos os casos e nomeia projeto e agente em cada bloco, pela varredura compartilhada com o aprendizado | presença | Terceira implementação da varredura; bloco sem projeto; ordem instável entre duas rodadas |
| W019 | `requirements.md` RF-21, `package.json`, `scripts/prompt-harness.js` | O comando não é invocado por `build`, não importa cliente de motor e não escreve em `state.json` algum; sem caso, não deixa arquivo pela metade | ausência | `build` chamando o comando; `require` de motor ou chamada de rede no arquivo; arquivo escrito numa rodada sem caso |
| W020 | `requirements.md` RF-22 e `interfaces/texto-do-prompt.md` seção 5, `tests/prompt-paridade.spec.ts` | Painel e comando escrevem o mesmo texto, comparado **inteiro** sobre os cinco casos da fixtura | presença | Comparação por tamanho ou por primeiras linhas; um lado alterado sem o outro; suíte ignorada |
| W021 | `roadmap.md` D-04, `src/domain/discovery-state.ts` | A elisão roda dentro de `readDiscoveryState`, no domínio puro, e a webview nunca vê o checkpoint cru | presença | Checkpoint cru atravessando a ponte; elisão migrada para o host ou para a tela |
| W022 | `interfaces/texto-do-prompt.md` seção 4, `src/webview/domain/prompt.ts`, `scripts/prompt-harness.js` | Determinismo nos dois lados: nada de relógio, ambiente ou aleatoriedade, e a mesma entrada dá o mesmo texto byte a byte | ausência | Data de hoje no texto; cópia e documento divergindo na mesma sessão |
| W023 | `onboarding.md` passos das promessas negativas, `README.md` | A varredura nomeia projeto e caminho absoluto, e por isso o seu destino não entra por reflexo no que se versiona; a elisão protege o conteúdo, não o nome do projeto | presença | Saída da varredura versionada sem decisão explícita; cuidado apagado do README |
