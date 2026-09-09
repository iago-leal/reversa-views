# Vigilância de regressão: 006-cartoes-e-cronologia

**Data:** 2026-09-09
**Feature:** `006-cartoes-e-cronologia`
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
| W001 | `requirements.md` RF-01, `src/webview/domain/sections.ts` | Todos os cartões podem estar expandidos ao mesmo tempo, e o estado sobrevive a ocultar e reabrir o painel | presença | Expandir tudo, ocultar e reabrir devolve cartão recolhido |
| W002 | `requirements.md` RF-02, `src/webview/ui/Header.tsx` | Uma ação do cabeçalho expande todos os cartões | presença | A ação some do cabeçalho, ou deixa cartão recolhido |
| W003 | `requirements.md` RF-03, `src/webview/ui/Header.tsx` | Uma ação do cabeçalho recolhe todos os cartões, e só os títulos ficam à vista | presença | A ação some, ou deixa corpo de cartão visível |
| W004 | `requirements.md` RF-04, `src/webview/ui/Header.tsx` | Ação global sem efeito aparece indisponível, pelo atributo do botão e não só pela cor | redação | Botão habilitado quando não teria efeito, ou indisponibilidade marcada apenas por cor |
| W005 | `requirements.md` RF-05, `src/webview/domain/preferences.ts` | A preferência distingue ausência de declaração de declaração de que nada está recolhido, e tolera estado escrito por versão anterior | redação | Lista vazia declarada volta a ser lida como ausência, ou leitura de estado antigo lança |
| W006 | `requirements.md` RF-06, `src/webview/ui/DecompositionSection.tsx` | A decomposição da feature ativa mostra uma linha por ação, com identificador, descrição, fase e situação | presença | Cartão ausente, ou linha sem um dos quatro campos |
| W007 | `requirements.md` RF-07, `src/webview/domain/decomposition-view.ts` | A primeira ação aberta aparece destacada como próxima a executar, com a contagem de fechadas sobre o total | presença | Nenhuma linha marcada, ou contagem divergente da herdada sem declaração |
| W008 | `requirements.md` RF-08, `src/webview/ui/DecompositionSection.tsx` | Cada ação mostra o momento registrado e os arquivos tocados, e declara quando não há registro | presença | Campo vazio no lugar da declaração de ausência |
| W009 | `requirements.md` RF-09, `src/domain/history.ts` | O histórico cobre toda pasta de feature, da mais recente para a mais antiga, com identificador, situação, data e resumo | presença | Pasta omitida por não ter adendo, ou ordem invertida |
| W010 | `requirements.md` RF-10, `src/webview/ui/HistorySection.tsx` | Artefato nomeado na cronologia abre no editor pela mesma mensagem que o painel já usa | ausência | Componente chamando o editor diretamente, sem passar pela ponte |
| W011 | `requirements.md` RF-11, `src/webview/domain/decomposition-view.ts` | A decomposição mostra por padrão as abertas mais as cinco fechadas mais recentes, com o total à vista e um controle que revela o resto | presença | Lista inteira sempre desenhada, ou total escondido |
| W012 | `requirements.md` RF-12, `src/host/adapters.ts` | O resumo é entregue em documento não salvo aberto no editor, e nenhuma escrita em disco parte da extensão | ausência | Qualquer escrita de arquivo na extensão, em qualquer camada |
| W013 | `requirements.md` RF-13, `src/webview/ui/HistorySection.tsx` | Todo estado vazio da cronologia é nomeado, em vez de deixar espaço em branco | presença | Seção vazia sem texto que a explique |
| W014 | `requirements.md` RF-14, `src/webview/ui/DecompositionSection.tsx` | A cronologia declara quando está incompleta por degradação da leitura, nomeando o arquivo que faltou | presença | Leitura truncada desenhada como se fosse completa |
| W015 | `requirements.md` RF-15, `src/webview/domain/instants.ts` | Todo instante aparece no horário de Brasília, com o fuso declarado, e nenhum texto em tempo universal cru resta na tela | ausência | `tests/webview-instants-render.spec.tsx` achando instante cru no documento |
| W016 | `requirements.md` RF-16, `src/webview/ui/Header.tsx` | O instante absoluto continua disponível em atributo, ao lado do texto convertido | presença | Elemento de horário sem `data-instant` |
| W017 | `requirements.md` RF-17, `src/host/adapters.ts` | O mesmo resumo pode ser copiado para a área de transferência, com confirmação na tela e sem abrir documento | presença | Cópia sem confirmação, ou confirmação por diálogo |
| W018 | `requirements.md` RF-18, `src/webview/domain/types.ts` | Os sete cartões recolhíveis são desenhados na ordem declarada, sempre abaixo da faixa de bloqueio humano, que não é cartão | redação | Ordem diferente entre releituras, ou faixa de bloqueio virando cartão recolhível |

### Limitações e escolhas conhecidas

Não são requisitos, e sim decisões que uma extração futura leria como estranheza se não
estivessem escritas.

| ID | Origem (arquivo, seção) | Escolha registrada | Tipo de verificação | Sinal de que precisa mudar |
|---|---|---|---|---|
| W019 | `src/probe/features.ts`, `src/domain/limits.ts` | O teto de cinquenta pastas corta as cinquenta PRIMEIRAS em ordem crescente de nome, enquanto a tela mostra em ordem decrescente. Num projeto com mais de cinquenta features, as que caem fora são as MAIS NOVAS | presença | Projeto passando de cinquenta pastas e o histórico deixando de mostrar a feature ativa |
| W020 | `src/host/adapters.ts` | O título do documento não salvo viaja no contrato e é registrado no log, mas não é aplicado: nomear documento sem arquivo exigiria edição de espaço de trabalho, que a suíte de fronteira do host passou a proibir | ausência | Aparecer no host qualquer edição de espaço de trabalho para nomear o documento |
| W021 | `src/webview/ui/Header.tsx`, `src/host/ports.ts` | A numeração `RN-NN` é local a cada feature, e o mesmo número nomeia regras diferentes em features diferentes. Citação de regra em comentário só é legível junto da feature que a escreveu | redação | Comentário citando `RN-NN` sem dizer de qual feature, em arquivo tocado por mais de uma |
| W022 | `src/domain/history.ts` | O resumo de uma entrega é a primeira FRASE do primeiro parágrafo, com a quebra dura desfeita antes do corte. O Reversa quebra a prosa na coluna, e ler só a primeira linha física devolvia frase pela metade | redação | Resumo terminando no meio da frase na tela |

### O que a próxima extração deve confirmar

As dezoito observações acima descrevem comportamento que já está coberto por suíte, mas cobertura
não é extração: nenhuma delas foi lida de volta a partir do código por um agente reverso. A
primeira `/reversa` sobre este repositório é o que as promove a 🟢 e lhes dá peso de regressão.
Até lá, o que existe é o par de rastros desta entrega e a suíte que a acompanha.
