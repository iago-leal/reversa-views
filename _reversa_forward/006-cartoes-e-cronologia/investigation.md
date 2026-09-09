# Investigação: cartões e cronologia

> Identificador: `006-cartoes-e-cronologia`
> Data: `2026-09-09`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. A causa do defeito de exibição, medida no código

🟢 O painel guarda a preferência como lista de seções recolhidas, e `src/webview/domain/sections.ts`
decide o recolhimento inicial assim: se a lista está vazia, devolve o padrão, que são as três seções
de diagnóstico. A consequência é que a lista vazia significa ao mesmo tempo "nunca houve preferência"
e "o usuário abriu tudo", e a segunda leitura nunca prevalece.

🟢 O efeito é imediato, e não apenas na abertura seguinte. `src/webview/main.tsx` recalcula a
preferência a cada alternância, e `src/webview/ui/App.tsx` chama a decisão a cada desenho. Expandir a
última das três seções de diagnóstico zera a lista, o padrão volta, e as outras duas se fecham na
mesma ação.

🟢 A suíte fixa esse comportamento. Em `tests/webview-sections.spec.ts` há o caso
`initialCollapsed({ collapsedSections: [] }, INTEGRA)` esperando o padrão, o que significa que
corrigir o código exige reescrever o teste. Isso é esperado e não é afrouxamento: o caso descreve a
regra antiga, e a regra muda por decisão registrada no `requirements.md`.

### Alternativas avaliadas para desfazer a ambiguidade

| Alternativa | Por que foi descartada |
|---|---|
| Guardar as seções expandidas em vez das recolhidas | Inverte o problema sem resolvê-lo: a lista vazia passaria a significar "tudo recolhido" e "sem preferência" |
| Guardar um mapa completo, uma entrada por seção | Cresce a cada cartão novo e obriga a decidir o que fazer com nome que não existe mais, problema que a leitura total já resolve hoje descartando em silêncio |
| Usar valor sentinela, como lista nula | Indistinguível de estado ausente na interface que o editor oferece, que devolve `undefined` para estado nunca gravado |
| **Campo `declared` ao lado da lista** | **Escolhida.** Uma linha a mais no estado, leitura total preservada, e compatibilidade com o que já está gravado, conforme D-01 e D-02 do roadmap |

## 2. O precedente da origem, e o que dele se aproveita

🟢 A View do Reversa no `scrum-harness`, em
`~/HARNESS/scrum-harness/packages/ui-scrum/src/client/Reversa.tsx`, já desenha a trilha de execução:
a seção do ciclo forward lista `progress.byAction`, cada ação com o próprio status e os arquivos que
tocou. É o mesmo dado que aqui já chega ao painel e não é desenhado, porque o PRD adiou o eixo.

🟢 O que a origem não tem é a decomposição com descrição e fase: ela mostra o que a trilha registrou,
e não o que o plano previu. A lista completa das ações, com a descrição de cada uma, exige ler a
tabela de `actions.md`, coisa que nenhum dos dois projetos fazia até aqui.

🟢 O `docs/HANDOFF.md` do `scrum-harness` é o precedente do resumo consultável, e é instrutivo por
ser escrito à mão: ele reúne o estado das frentes, o que está pronto, o que falta e como verificar.
O que esta feature automatiza é a parte derivável dos artefatos, ou seja, o que cada feature entregou
e onde a atual parou. O julgamento em prosa que aquele documento carrega continua sendo trabalho
humano, e o resumo gerado não tenta imitá-lo.

## 3. Formato dos artefatos que serão lidos

🟢 As cinco features entregues usam o mesmo cabeçalho de tabela, que vem do template
`.reversa/templates/actions-template.md`:

```
| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
```

🟢 As tabelas aparecem sob títulos de segundo nível no padrão `## Fase N, Nome`, mais `## Emendas`
quando `/reversa-add` acrescentou alguma. O utilitário herdado `splitSections` já separa por título
de segundo nível, e `findTable` já casa cabeçalho por forma normalizada e lê células por posição.

🟢 O aviso que o próprio `table.ts` traz vale aqui: esses arquivos são escritos por agente a partir
de instrução de estrutura, e não emitidos por código, de modo que acento, caixa ou coluna a mais são
divergências plausíveis. Daí a queda para varredura linha a linha, que reaproveita o mesmo marcador
de fim de linha que `scanActions` usa.

### Volume medido no próprio repositório

| Feature | Ações | Eventos na trilha | Bytes de `actions.md` |
|---|---|---|---|
| 001-leitura-do-processo | 21 | 21 | 17.606 |
| 002-ponte-e-host | 32 | 33 | 30.345 |
| 003-painel-do-processo | 61 | 63 | 61.884 |
| 004-heranca-e-sincronia | 44 | 45 | 13.760 |
| 005-empacotamento-e-verificacao | 34 | 44 | 14.285 |

🟢 O maior arquivo tem 61.884 bytes, contra o teto de 262.144 por arquivo que a sonda herdada aplica.
A soma das cinco tabelas é de 137.880 bytes, e os cinco adendos somam 58.170. O volume total da
leitura ampliada, portanto, fica na casa de 200 KB, o que é uma leitura só de disco local.

## 4. Fuso de Brasília: o que o ambiente oferece

🟢 Medido neste repositório, com o Node que a máquina executa hoje, versão 24.13.0:

```
new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', ... }).format(...)
→ 09/09/2026, 17:43     (para 2026-09-09T20:43:22Z)
→ GMT-3                 (deslocamento em 15 de janeiro, sem horário de verão)
```

🟢 A conversão pelo nome do fuso funciona, e o deslocamento é o mesmo em janeiro e em setembro, o que
confirma a ausência de horário de verão desde 2019. Formatar pelo nome, e não subtraindo três horas
na mão, é o que mantém o painel correto se a lei voltar a mudar.

🟢 Um detalhe de formato: a localidade insere vírgula entre data e hora, o que não corresponde ao
formato decidido no `requirements.md`. A montagem deve usar as partes do formatador, e não remover a
vírgula por expressão regular, porque a vírgula é decisão da localidade e pode mudar de posição.

🟡 O ambiente de execução da tela é o Chromium que o editor embarca, na versão 108 conforme
`scripts/limites.js`, que traz base de fuso completa. O ambiente de teste é o Node do executor de
testes, que traz o mesmo. Fica declarado, ainda assim, que a função deve devolver o valor original
quando a conversão não for possível, para que um ambiente sem base de fuso mostre o instante cru em
vez de nada.

## 5. Como abrir um documento sem escrever no disco

🟢 O editor distingue abrir um arquivo de criar um documento novo. Abrir um arquivo existente é o que
`EditorPort` já faz hoje, em `src/host/adapters.ts`. Criar um documento novo aceita conteúdo e
linguagem e devolve um documento sem caminho, que existe apenas na memória do editor até que alguém
o salve, e salvar é gesto do usuário.

🟢 A área de transferência é oferecida pelo editor como escrita de texto, sem caminho e sem arquivo.

🟢 Nenhuma das duas atravessa a guarda atual da suíte de fronteiras, que procura por nomes de escrita
de sistema de arquivos. O ponto que a investigação encontrou aberto é outro: a via de escrita do
próprio editor, que hoje ninguém usa e nada impede. Fechá-la por teste na mesma entrega é o que
impede a capacidade nova de virar porta de entrada, e está registrado como D-13.

## 6. Onde a leitura nova cabe sem tocar no que é vendorizado

🟢 A sonda herdada exporta, no próprio índice, as três funções que tocam disco:
`listNames`, `readText` e `resolveInside`. Um módulo local pode importá-las e percorrer as pastas de
feature sem que `node:fs` apareça em lugar novo e sem que nenhum arquivo de `src/heranca/` mude.

🟢 Isso importa mais do que parece. A suíte herdada `src/heranca/reversa-probe/tests/readonly.spec.ts`
verifica que `node:fs` só aparece em `files.ts` e que nenhuma interface exportada tem nome que sugira
escrita. Alterar o pacote significaria carimbo novo, adaptação declarada e conflito na próxima
ressincronização. Reutilizar as funções exportadas não custa nada disso.

🟡 O módulo local precisa da sua própria suíte análoga, porque a herdada só varre o pacote herdado.
Sem ela, a garantia de somente leitura teria um vão do tamanho do código novo.

## 7. Fontes

- `src/webview/domain/sections.ts`, `src/webview/domain/preferences.ts`, `src/webview/main.tsx`,
  `src/webview/ui/App.tsx`: o defeito e o caminho da correção
- `tests/webview-sections.spec.ts`, `tests/host-boundaries.spec.ts`, `tests/webview-boundaries.spec.ts`:
  as regras que a entrega precisa manter verdes, e a que precisa reescrever
- `src/heranca/reversa-domain/src/{actions,progress,table,forward}.ts`: contagem, trilha, leitura de
  tabela e vigência de adendo
- `src/heranca/reversa-probe/src/{files,snapshot,index}.ts`: o que a sonda lê hoje e o que ela exporta
- `~/HARNESS/scrum-harness/packages/ui-scrum/src/client/Reversa.tsx` e `~/HARNESS/scrum-harness/docs/HANDOFF.md`:
  o precedente da trilha desenhada e o do resumo escrito à mão
- `_reversa_sdd/prd.md`, `_reversa_sdd/sdd/painel-do-processo.md`, `_reversa_sdd/sdd/ponte-e-host.md`,
  `_reversa_sdd/sdd/leitura-do-processo.md` e os adendos 003, 004 e 005
