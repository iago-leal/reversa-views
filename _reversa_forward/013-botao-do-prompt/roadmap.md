# Roadmap: botão do prompt de correção na fonte

> Identificador: `013-botao-do-prompt`
> Data: `2026-09-20`
> Requirements: `_reversa_forward/013-botao-do-prompt/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

A feature é um terceiro texto derivado da leitura, ao lado do resumo que a 006 entregou, e quase todo
o caminho já está aberto: o canal tem `copyText` e `openDraft`, o roteador já mede o teto em bytes, o
cabeçalho já tem o auxiliar que desabilita e a confirmação em linha, e `summary.ts` já demonstra a
composição por função pura na tela. O que falta, e é o coração do plano, é o insumo. O eixo do estado
da descoberta hoje descreve o checkpoint desviante sem nomear o campo que o desviou, e por isso ganha
um campo novo, no fim de `CheckpointState`, com a forma elidida do que está em disco, preenchido
apenas na situação que produz prompt. A elisão é a da 012, transcrita para `src/domain/` e presa à
original por suíte de paridade, e roda na leitura, de modo que a webview nunca veja o bruto. Do lado
da tela entram duas funções puras num módulo só: uma decide se há prompt a compor e por que não, e a
outra compõe o texto. O caso de vários projetos numa passada não entra no painel: ele vira um comando
de manutenção que reusa a varredura já escrita pela 012 e escreve o texto em `propostas/`, no mesmo
regime dos auxiliares que o `build` não invoca.

## 2. Princípios aplicados

`.reversa/principles.md` não existe neste projeto, e `/reversa-principles` nunca rodou sobre ele: não
há princípio ativo a respeitar ou a contrariar. O que faz o seu papel, e é verificável abrindo
arquivo, são as separações que as features anteriores deixaram, e esta acrescenta a quarta.

| Princípio de fato | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| Ler não escreve (NG-01 e RNF-04 da spec da leitura) | A camada de leitura continua sem função capaz de escrever; a área de transferência é porta do host desde a 006 e não pertence a ela | respeita |
| Reconhecer não é sanear (NG-05 da spec da leitura) | O prompt nomeia o campo desviante e não o corrige; o valor mostrado é o do disco, elidido na forma e nunca reescrito no conteúdo | respeita |
| Propor não é dispor (feature 012) | O comando agregado formata o que está no disco e não fala com modelo algum; a correção é pedida a um harness que uma pessoa aciona | respeita |
| Pedir não conserta (esta feature) | O painel compõe texto e entrega a quem o leve. Nenhum arquivo do projeto observado é tocado, e NG-04 do painel segue de pé, com o lugar do despacho vazio | respeita |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | `CheckpointState` ganha `formaElidida`, último campo e opcional, com o checkpoint elidido | A medição de 2026-09-20 mostrou que dois dos três casos reais chegam ao painel sem campo algum nomeado, porque `camposComLista` só reporta lista de textos e só quando `files` falta. Sem este campo o prompt não serve a quem conserta | Carregar apenas os campos fora do esquema, que exigiria regra e suíte novas para o mesmo terreno; mandar o harness abrir o arquivo, que deixa o prompt cego | 🟢 |
| D-02 | O campo é preenchido **apenas** em `conclusao-nao-declarada`, e é nulo nas outras três situações | Quem concluiu, quem trabalha e quem foi reconhecido não têm prompt a compor. É também a forma de não publicar sem propósito, e a invariante é da mesma natureza das três que já prendem `reconhecidoPor` | Preencher sempre, que engordaria o payload e exporia o que ninguém vai ler | 🟢 |
| D-03 | A elisão é transcrita para `src/domain/elisao.ts` e presa a `scripts/equivalencias/elidir.js` por suíte de paridade | O script é CommonJS carregado sem construir, e o módulo é compilado no pacote: nenhum dos dois importa o outro sem arrastar um mundo, exatamente como `scripts/limites.js` e `src/domain/limits.ts` já documentam. `tests/limites.spec.ts` prova que a suíte consegue importar os dois lados | Mover a elisão para `src/` e fazer o script ler `out/`, que obrigaria a construir antes de rodar manutenção; reescrever a regra por conta própria, que duplicaria sem paridade | 🟢 |
| D-04 | A elisão roda na camada de leitura, dentro de `readDiscoveryState`, e não na tela | A webview nunca vê o bruto, e a promessa de privacidade passa a ser verificável na fronteira em vez de nos componentes. Elidir na tela obrigaria o bruto a atravessar o canal, que é o oposto do que a feature quer | Elidir na webview, que atravessaria o conteúdo; elidir no componente, que espalharia a regra | 🟢 |
| D-05 | Uma função decide a disponibilidade e outra compõe o texto, ambas em `src/webview/domain/prompt.ts` | A razão do botão desabilitado e o conteúdo do texto têm de sair da mesma apuração. Duas contas do mesmo fato concordando por coincidência é o defeito que a 011 corrigiu em `anomalies-view.ts`, e repeti-lo aqui seria ignorar a lição | Decidir o desabilitado no `Header` por contagem própria, que é a coincidência de novo | 🟢 |
| D-06 | A confirmação de cópia do cabeçalho deixa de ser booleana e passa a nomear o que foi copiado | Com dois botões de cópia, um booleano diria "resumo copiado" depois do clique no prompt. É defeito pequeno e certo, e o tipo é o que o evita | Um segundo booleano ao lado do primeiro, que admite os dois verdadeiros ao mesmo tempo | 🟢 |
| D-07 | O comando agregado é `scripts/prompt-harness.js`, exposto como `npm run prompt:harness`, e escreve em `propostas/prompt-harness.md` | Segue o regime dos dois comandos da 012 e dos quatro `estragar:*`: fora do `build`, fora do pacote, sem rede e sem motor. O destino em `propostas/` é o que a 012 já usa para o que uma pessoa vai ler e decidir | Imprimir no terminal, que perde o texto na rolagem; escrever dentro de `_reversa_forward/`, que é pasta de artefato de feature | 🟢 |
| D-08 | `lerEstados` sai de `scripts/aprender-equivalencias.js` para `scripts/equivalencias/estados.js`, e os dois comandos passam a importá-lo | A varredura já existe, resolve o til e nomeia o projeto. Copiá-la seria criar a terceira implementação de uma coisa que a suíte de paridade não cobre | Exportar a função do arquivo do comando, que faria um comando importar o outro; duplicar a varredura | 🟡 |
| D-09 | O texto fixo do prompt é escrito duas vezes, em TypeScript e em CommonJS, e a paridade é o que o mantém um só | Consequência inevitável de D-03 e D-07. O que se pode fazer é tornar a divergência impossível de passar calada, e isso a suíte faz | Um `.md` de gabarito lido pelos dois, impossível porque a webview não lê disco; a webview importando de `scripts/`, que quebraria a fronteira e o empacotamento | 🟢 |
| D-10 | Nenhum comando novo no protocolo, e `dispatch` segue reservado sem tratador | O par de destinos da 006 serve inteiro, e o roteador já valida tipo e teto. Crescer o canal sem necessidade custaria contrato e suíte | Um comando `copyPrompt` próprio, que não faria nada que `copyText` não faz | 🟢 |
| D-11 | Uma fixtura nova reúne os três casos remanescentes como foram medidos | As fixturas da 012 cobrem os vocabulários e as entradas que não são agentes, e nenhuma reúne exatamente o que sobrou depois da promoção, que é o insumo desta feature | Reusar `vocabularios-de-conclusao.json` e `entradas-nao-agentes.json`, que provariam outra coisa | 🟢 |

## 4. Premissas

Nenhuma. As três lacunas da versão inicial do requirements foram resolvidas na sessão de 2026-09-20,
e o documento chega ao plano sem marcador `[DÚVIDA]`.

| Premissa | Origem (`requirements.md` seção) | Risco se errada |
|----------|----------------------------------|-----------------|
| n/a | n/a | n/a |

## 5. Delta arquitetural

A extração `/reversa` nunca rodou sobre este repositório, de modo que não há `architecture.md` a
citar: o projeto nasceu por `/reversa-new` e o que faz o papel de arquitetura são as cinco specs de
`_reversa_sdd/sdd/` e os doze adendos vigentes. A coluna de origem aponta para elas.

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| Julgamento do estado da descoberta | `_reversa_sdd/addenda/011-estado-terminal-e-checkpoints.md` | regra-alterada | `lerCheckpoint` passa a anexar a forma elidida ao checkpoint em `conclusao-nao-declarada`, sem tocar a precedência das três leituras que já decidem |
| Elisão | `_reversa_sdd/addenda/012-equivalencias-de-checkpoint.md` | componente-novo | `src/domain/elisao.ts`, transcrição declarada de `scripts/equivalencias/elidir.js`, com paridade em suíte |
| Montagem do eixo no host | `_reversa_sdd/sdd/ponte-e-host.md#6-requisitos-funcionais` | inalterado | `src/host/reading.ts` não muda: a forma elidida nasce dentro do domínio puro que ele já chama, e é essa a razão de a promessa de privacidade se verificar sem abrir componente algum |
| Contrato do canal | `_reversa_sdd/sdd/ponte-e-host.md#9-modelo-de-dados` | contrato-alterado | `CheckpointState` ganha um campo, último e opcional; nenhum comando entra e nenhum campo do topo da carga muda |
| Composição de texto da tela | `_reversa_sdd/addenda/006-cartoes-e-cronologia.md` | componente-novo | `src/webview/domain/prompt.ts`, com a disponibilidade e o texto, irmão de `summary.ts` |
| Cabeçalho | `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | regra-alterada | Uma ação nova ao lado das duas do resumo, a razão do desabilitado em texto e a confirmação que nomeia o que foi copiado |
| Ferramentas de manutenção | `_reversa_sdd/sdd/empacotamento-e-verificacao.md#6-requisitos-funcionais` | componente-novo | `scripts/prompt-harness.js` e a extração de `scripts/equivalencias/estados.js`, ambos fora do `build` e fora do pacote |

## 6. Delta no modelo de dados

- Resumo das mudanças: um campo novo em `CheckpointState`, opcional e último, carregando um mapa de
  chaves para escalares e marcadores de forma, preenchido apenas numa das quatro situações. Nenhum
  campo removido, nenhum renomeado, nenhum campo novo no topo da carga, e nenhuma migração de dado em
  disco, porque nada é escrito em disco por esta feature.
- Detalhe completo em: `_reversa_forward/013-botao-do-prompt/data-delta.md`

## 7. Delta de contratos externos

Não há contrato de rede, fila ou serviço: a extensão continua sem conhecer nenhum. Há, porém, dois
contratos internos que a feature toca ou cria, e o segundo é a razão de existir a suíte de paridade.

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| Texto do prompt, que duas implementações precisam produzir igual | arquivo | `_reversa_forward/013-botao-do-prompt/interfaces/texto-do-prompt.md` |
| Canal webview ↔ host, no campo que cresce | arquivo | `_reversa_forward/013-botao-do-prompt/data-delta.md`, seção 2 |

## 8. Plano de migração

Não há dado persistido a migrar. O que existe é compatibilidade entre versões do host e da tela, e
ela se resolve pela regra que toda feature desde a 008 segue.

1. O campo entra opcional e no fim de `CheckpointState`, de modo que um host anterior simplesmente
   não o envia.
2. A tela lê a ausência como forma não lida, compõe o bloco sem ela e nunca inventa campo.
3. A ausência do eixo inteiro continua desabilitando a ação com a razão nomeada, como a 011 já
   estabeleceu, e jamais é lida como projeto sem defeito.
4. No `.vsix`, host e tela viajam juntos e o caso não ocorre; no preview, que serve a tela construída
   contra a leitura corrente, o caso ocorre e é exatamente o que os dois passos acima cobrem.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Os dois textos divergem, e o prompt do comando deixa de ser o do painel | alto | alto sem suíte | A suíte de paridade de D-09, no molde de `tests/limites.spec.ts`, compara as duas saídas sobre a mesma fixtura e falha nomeando a divergência |
| Um escalar curto e sensível atravessa a elisão e chega a um modelo | médio | baixa | O limite de quarenta caracteres foi aceito na 012 contra um motor **local**, e aqui o destino pode ser remoto, o que é diferente e fica declarado. Mitiga-se por desenho: o texto passa pela área de transferência ou por documento não salvo, e quem cola vê antes de colar. O `onboarding.md` manda ler o texto dos três casos reais antes de aprovar a entrega |
| O prompt afirmar o que o painel não leu, como a contagem dos projetos desviantes ou a existência do guia naquela raiz | médio | média | RN-03 e RN-17 do requirements, e a suíte que confere que o texto não contém número de medição externa nem afirmação de existência de arquivo não lido |
| A extração de `lerEstados` quebrar o comando de aprendizado da 012 | médio | baixa | As suítes `equivalencias-aprendizado.spec.ts` e `equivalencias-coletor.spec.ts` já cobrem o caminho; a extração é movimento de arquivo sem mudança de corpo, e roda-se o aprendizado uma vez contra `~/dev` antes de fechar |
| O campo novo engordar a leitura além do teto de 200 ms | baixo | baixa | Três checkpoints em 229 preenchem o campo, e cada forma pesa menos de duzentos bytes. `tests/desempenho-referencia.spec.ts` continua sendo a guarda |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] A suíte inteira verde, com a de paridade do texto entre as novas
- [ ] O prompt dos três casos reais lido por gente, pelo roteiro do `onboarding.md`, antes de declarar a entrega
- [ ] `git status` limpo de alteração em `state.json` de qualquer projeto, depois de rodar o comando agregado
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-20 | Versão inicial gerada por `/reversa-plan` | reversa |
