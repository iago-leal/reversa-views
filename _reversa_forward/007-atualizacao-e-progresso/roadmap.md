# Roadmap: verificação de atualização e progresso visível

> Identificador: `007-atualizacao-e-progresso`
> Data: `2026-09-09`
> Requirements: `_reversa_forward/007-atualizacao-e-progresso/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

A feature entra por quatro costuras já existentes, e nenhuma delas exige arquitetura nova. A
primeira é o protocolo entre host e painel, que cresce por acréscimo: ganha um quarto comando de
host, `setUpdate`, que viaja depois do processo e por isso não atrasa a leitura. A segunda é o
regime das constantes de construção, hoje representado por `INHERITED_MODEL_REVISION`: um script
irmão do que a gera passa a escrever versão e commit no mesmo molde, de modo que o painel os declare
sem abrir arquivo. A terceira é a família de comandos de terminal, onde entra `scripts/atualizar.js`
ao lado de `verificar-heranca.js`, com os mesmos três códigos de saída e o mesmo hábito de falhar
alto. A quarta é o cartão recolhível, que ganha uma peça de desenho reusada por três seções.

O que é genuinamente novo é uma capacidade, não um componente: a extensão passa a falar com a rede.
Ela fala num único módulo, `src/host/net.ts`, atrás de uma porta, com um interpretador puro ao lado.
A camada de leitura continua sem rede, sem escrita e sem execução, e a tela continua sem permissão
de conexão de saída. O resto da feature é correção de ordem e forma.

## 2. Princípios aplicados

Este projeto não tem `.reversa/principles.md`. O que funciona como princípio aqui são os invariantes
declarados no PRD e verificados por suíte, e é contra eles que a feature se mede.

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| A extensão nunca escreve arquivo, em camada alguma | Nada da feature escreve dentro da extensão. O atualizador é script de terminal e escreve apenas no clone; a versão derivada é escrita pelo empacotamento, fora do processo do editor | respeita |
| A camada de leitura é pura: sem escrita, sem execução de processo | A consulta nasce fora dela, em módulo próprio do host, e a suíte de fronteiras passa a recusar também os módulos de rede dentro da camada de leitura | respeita |
| Sem tráfego de rede em tempo de execução | **Conflita, por emenda explícita do usuário em 2026-09-09.** A proibição se estreita: telemetria segue vedada sem exceção, e abre-se uma exceção nomeada para a consulta de leitura à origem do próprio repositório. A emenda está registrada na seção 2 do `requirements.md` e precisa ser absorvida pelo PRD na próxima `/reversa-sync` | conflita, com decisão registrada |
| Leitura e despacho em camadas distintas | A feature não ocupa o lugar reservado do despacho. O painel anuncia e nomeia o comando; quem o roda é o mantenedor, no terminal | respeita |
| Ressincronização é ritual humano, nunca automática | O desenho em dois atos, conferir e aplicar, é o mesmo de NG-01 da spec de herança | respeita |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | A consulta vive no processo do host, em `src/host/net.ts`, único módulo a importar o cliente de requisição do Node | Concentrar a capacidade num módulo é o que torna a fronteira verificável por busca de texto, como já ocorre com `node:fs` na camada de leitura | consultar da tela; espalhar a chamada pelo provedor | 🟢 |
| D-02 | O resultado desce como comando novo `setUpdate`, e não como campo de `setProcess` | A consulta é assíncrona e pode falhar; embutida no payload da leitura, ou atrasaria o painel ou viajaria vazia e obrigaria a um segundo envio de qualquer modo | campo em `SetProcessData`; segundo `setProcess` completo | 🟢 |
| D-03 | A rota consultada é a comparação de dois commits da API do GitHub, com base no commit de construção e cabeça no ramo padrão | É a única rota que responde "quantos commits", e não apenas "qual é a ponta"; a distância é o que a mensagem do painel precisa dizer | ler a ponta do ramo e comparar cadeias; ler a lista de tags; ler o feed do repositório | 🟡 |
| D-04 | A requisição é anônima, sem token, e o limite de taxa por endereço é tratado como consulta impossível com causa própria | Token guardado é segredo a gerir, e a única leitura necessária é pública. Um mantenedor único não gera volume perto do limite | autenticar com token pessoal; usar credencial do editor | 🟢 |
| D-05 | A requisição usa o módulo nativo de HTTPS do Node, e não o cliente global moderno | A versão mínima de editor declarada em `scripts/limites.js` embarca um Node anterior ao que traz o cliente global habilitado por padrão | cliente global; biblioteca de terceiros | 🟡 |
| D-06 | Uma consulta por leitura, disparada pelo provedor depois de enviar o processo, com tempo limite de cinco segundos e sem retentativa | Amarrar a consulta à leitura dá ao usuário o controle que ele já tem: reler é o gesto que repete tudo. Sem relógio próprio não há tarefa de fundo a gerir nem a desligar | intervalo periódico; consulta na ativação da extensão; consulta a cada mudança de visibilidade | 🟢 |
| D-07 | Versão e commit entram como constantes de construção em `src/host/build.ts`, geradas por script irmão de `gerar-revisao-heranca.js` e encadeadas no mesmo passo do build | O regime já existe e é o que permite ao painel declarar procedência sem abrir arquivo. Repetir o molde custa menos que inventar um segundo | ler `package.json` em tempo de execução; embutir por substituição no empacotador | 🟢 |
| D-08 | A versão derivada é escrita no manifesto apenas em torno do empacotamento, e restaurada em bloco `finally` | O empacotador oficial lê a versão do manifesto, e manter o número escrito deixaria a árvore suja em regime, o que colide com a recusa de árvore suja do próprio atualizador | manter escrito e commitar; commit automático de versão; manifesto com valor de espera | 🟡 |
| D-09 | A derivação usa o MAIOR número de feature com adendo, e conta os commits desde o commit que introduziu aquele adendo | Contar quantidade de adendos faria a versão recuar se um fosse apagado ou superado. O maior número é monótono enquanto a numeração de features crescer | contar adendos; contar pastas em `_reversa_forward/`; ler a numeração do `active-requirements.json` | 🟢 |
| D-10 | Sem clone git ou sem adendo algum, a derivação devolve `0.0.0` e o empacotamento imprime a causa | Número inventado em silêncio é pior que número obviamente vazio, e o projeto prefere erro barulhento | falhar o empacotamento; manter o último número conhecido | 🟢 |
| D-11 | A chave de configuração é `reversaViews.conferirAtualizacao`, booleana, verdadeira por padrão | O manifesto já contribui comandos sob o mesmo prefixo, e a interface do painel é em português. Padrão verdadeiro porque a consulta foi pedida como comportamento, não como recurso escondido | padrão falso; chave por workspace apenas; sem chave alguma | 🟡 |
| D-12 | O atualizador é `scripts/atualizar.js`, com três códigos de saída no mesmo esquema de `verificar-heranca.js`: zero em dia, um reprovado ou recusado, dois impossível conferir | Repetir o vocabulário de saída que o projeto já usa evita que cada script invente o seu | um só código de saída; sinalizar por texto na saída padrão | 🟢 |
| D-13 | A chamada ao git sai de `scripts/heranca/leitura.js` para um auxiliar próprio, `scripts/git.js`, consumido pelos dois | Dois scripts chamando o git de dois jeitos divergem no tratamento de erro. É extração pequena, e a suíte de herança já cobre o comportamento atual | duplicar a chamada; importar de dentro do módulo de herança | 🟢 |
| D-14 | A ordenação nova vive em `decomposition-view.ts`, na mesma função que já recorta, que passa a devolver as linhas já ordenadas | Selecionar por recência e exibir por posição é exatamente o defeito relatado; uma função que faz as duas coisas não deixa as duas ordens divergirem de novo | ordenar no componente; ordenar na camada de leitura | 🟢 |
| D-15 | A barra é um componente próprio, `src/webview/ui/ProgressBar.tsx`, chamado pelos três cartões | O pedido é de três cartões, e três trechos parecidos divergem na primeira correção | trecho repetido em cada cartão; barra desenhada por CSS sobre o texto existente | 🟢 |
| D-16 | O trilho e o preenchimento usam tokens do Primer já disponíveis no conjunto importado, nomeados em `theme.css` para que o podador os preserve | O projeto depende de tokens, não de componentes, e o podador só mantém o que a folha nomeia | importar componente do Primer; cores literais | 🟢 |
| D-17 | O preview ganha um argumento que força cada desfecho da consulta, ao lado dos estados de entrada que ele já força | O portão visual exige que cada estado da tela tenha comando que o alcance, e três dos desfechos novos não acontecem por acaso | conferir só com rede real; alcançar os estados por edição temporária de código | 🟢 |
| D-18 | O commit de construção aparece na mesma forma curta que o painel já usa para a revisão do modelo, e o comando de conferência imprime a mesma forma | Comparar duas cadeias truncadas de formas diferentes é trabalho manual desnecessário | forma longa no painel; forma curta só no terminal | 🟢 |
| D-19 | O carimbo da construção NÃO é versionado, ao contrário da revisão do modelo: entra no `.gitignore` e é gerado por toda construção | A revisão do modelo muda só quando a herança é ressincronizada, mas o commit de construção muda a cada commit. Versionado, ele deixaria a árvore suja depois de todo build, o que colide com D-08 e com a recusa de árvore suja do próprio atualizador | versionar e conviver com a sujeira; gerar só no empacotamento, o que deixaria o preview e a execução por tecla sem carimbo | 🟢 |

## 4. Premissas

Nenhuma premissa herdada de `[DÚVIDA]`: as três dúvidas da versão inicial do `requirements.md` foram
resolvidas na sessão de esclarecimentos de 2026-09-09.

| Premissa | Origem (`requirements.md` seção) | Risco se errada |
|----------|----------------------------------|-----------------|
| n/a | n/a | n/a |

Duas verificações precisam acontecer nas primeiras ações do `actions.md`, e não são premissas de
requisito, mas de implementação: a semântica exata dos campos de distância da rota de comparação
(D-03) e qual cliente de requisição o Node embarcado oferece (D-05). Ambas se confirmam com um
comando, e ambas mudam apenas o interior de um módulo.

## 5. Delta arquitetural

A extração deste projeto é greenfield e não tem `architecture.md`. Os componentes abaixo são os das
cinco especificações de `_reversa_sdd/sdd/` e dos seis adendos vigentes.

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| Canal entre host e painel | `_reversa_sdd/sdd/ponte-e-host.md#9-modelo-de-dados` | contrato-alterado | Ganha o quarto comando de host `setUpdate`, por acréscimo; nada é renomeado nem removido |
| Host, fronteira com o editor | `_reversa_sdd/sdd/ponte-e-host.md#6-requisitos-funcionais` | componente-novo | Duas portas novas, uma de configuração e uma de consulta à origem, com adaptadores em `adapters.ts` e `net.ts` |
| Host, decisão pura | `_reversa_sdd/sdd/ponte-e-host.md#6-requisitos-funcionais` | componente-novo | `src/host/update.ts` interpreta resposta crua em desfecho nomeado, sem tocar em rede |
| Constantes de construção | `_reversa_sdd/addenda/004-heranca-e-sincronia.md` | componente-novo | `src/host/build.ts`, gerado, com versão derivada e commit de construção |
| Cabeçalho do painel | `_reversa_sdd/sdd/painel-do-processo.md#8-design-e-interface` | regra-alterada | Ganha dois itens de procedência e uma linha de desfecho da consulta |
| Cartão da decomposição | `_reversa_sdd/addenda/006-cartoes-e-cronologia.md` | regra-alterada | Ordem passa a ser recência decrescente com abertas à frente; ganha barra |
| Cartão do ciclo forward | `_reversa_sdd/sdd/painel-do-processo.md#8-design-e-interface` | regra-alterada | Ganha barra sobre os números que já imprime |
| Cartão do histórico | `_reversa_sdd/addenda/006-cartoes-e-cronologia.md` | regra-alterada | Ganha barra de features convergidas sobre o total declarado |
| Empacotamento | `_reversa_sdd/sdd/empacotamento-e-verificacao.md#6-requisitos-funcionais` | regra-alterada | Passa a derivar a versão, escrevê-la no manifesto em torno da chamada e restaurá-la |
| Preview fora do editor | `_reversa_sdd/sdd/empacotamento-e-verificacao.md#8-design-e-interface` | regra-alterada | Ganha argumento que força cada desfecho da consulta |
| Comandos de manutenção | `_reversa_sdd/addenda/005-empacotamento-e-verificacao.md` | componente-novo | `scripts/atualizar.js`, com conferência e aplicação separadas |
| Manifesto da extensão | `_reversa_sdd/addenda/005-empacotamento-e-verificacao.md` | contrato-alterado | Declara a chave de configuração da conferência |

Arquivos que a mudança toca, em rascunho para o `legacy-impact.md`:

- Novos: `src/host/net.ts`, `src/host/update.ts`, `src/host/build.ts` (gerado), `src/webview/ui/ProgressBar.tsx`, `scripts/atualizar.js`, `scripts/gerar-carimbo-da-construcao.js`, `scripts/versao.js`, `scripts/git.js`
- Alterados no host: `protocol.ts`, `ports.ts`, `adapters.ts`, `provider.ts`, `bridge.ts`, `panel.ts` ou `extension.ts` conforme a montagem das portas
- Alterados na tela: `bridge/messaging.ts`, `main.tsx`, `domain/entry.ts`, `domain/types.ts`, `ui/Header.tsx`, `ui/DecompositionSection.tsx`, `ui/ForwardSection.tsx`, `ui/HistorySection.tsx`, `domain/decomposition-view.ts`, `theme/theme.css`
- Alterados na construção: `package.json`, `scripts/empacotar.js`, `scripts/preview/config.js`, `scripts/preview/leitura.js`, `scripts/heranca/leitura.js`, `README.md`

## 6. Delta no modelo de dados

- Resumo das mudanças: entram três formas novas, o desfecho da consulta, o carimbo da construção e a
  contagem que a barra desenha. Nenhuma delas é persistida pela extensão. A única coisa que passa a
  ser guardada fora do processo é a chave de configuração, guardada pelo editor, e o único campo de
  arquivo que muda de regime é a versão do manifesto, que deixa de ser escrita à mão e passa a ser
  derivada.
- Detalhe completo em: `_reversa_forward/007-atualizacao-e-progresso/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| Consulta à origem do repositório | HTTP | `_reversa_forward/007-atualizacao-e-progresso/interfaces/consulta-a-origem.md` |
| Canal entre host e painel, acréscimo do comando `setUpdate` | mensagem | `_reversa_forward/007-atualizacao-e-progresso/interfaces/delta-do-canal.md` |

O primeiro é o primeiro contrato externo do produto: até aqui a extensão não falava com serviço
algum. O segundo é interno ao produto, mas é contrato entre duas peças que viajam separadas no
pacote, e por isso segue a mesma disciplina de escrita.

## 8. Plano de migração

Não há dado a migrar. Há, porém, ordem de execução que evita retrabalho, e é ela que o `actions.md`
vai herdar:

1. Confirmar por comando as duas incógnitas de implementação: a semântica dos campos de distância da
   rota de comparação e o cliente de requisição disponível no Node embarcado.
2. Derivar a versão em `scripts/versao.js` e gerar `src/host/build.ts`, encadeando a geração no build
   antes da compilação, como já ocorre com a revisão do modelo.
3. Acrescentar `setUpdate` ao protocolo e às duas pontes, sem consumidor ainda: o canal cresce antes
   de haver quem o use.
4. Escrever o interpretador puro e a porta de consulta, com suíte sobre respostas gravadas.
5. Ligar o provedor: enviar o processo, depois consultar, depois enviar o desfecho.
6. Desenhar o cabeçalho e a chave de configuração.
7. Corrigir a ordem da decomposição e sua suíte, que hoje fixa o comportamento defeituoso.
8. Escrever a barra e ligá-la aos três cartões.
9. Escrever `scripts/atualizar.js` e o ritual no README.
10. Passar o portão visual pelo preview, com os desfechos forçados, e só então empacotar.

O passo 7 é independente dos seis primeiros e pode ser executado em paralelo por quem tocar apenas a
tela. O passo 10 é o último por construção.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| O manifesto fica com a versão derivada escrita se o empacotamento morrer no meio | médio | baixa | Restauração em `finally`; a derivação é determinística, de modo que a próxima execução reescreve o mesmo número; o atualizador reconhece esse estado e o nomeia em vez de recusar em silêncio |
| A semântica dos campos de distância da rota de comparação não é a assumida em D-03 | médio | média | Confirmar na primeira ação, com resposta gravada como fixture da suíte; o erro fica contido no interpretador puro |
| O Node embarcado não oferece o cliente de requisição assumido | médio | baixa | D-05 já escolhe o módulo nativo; a confirmação é a primeira ação, e o portão visual roda no editor real |
| A consulta anônima esbarra no limite de taxa numa rede compartilhada | baixo | baixa | Uma consulta por leitura; o limite é desfecho nomeado, distinto de ausência de rede |
| O painel vira fonte de ruído, anunciando novidade a cada commit enviado | médio | média | A mensagem fica no cabeçalho, sem diálogo nem notificação; a chave de configuração desliga a consulta e o painel declara que está desligada |
| O contraste da barra reprova em alto contraste | baixo | média | Tokens de ênfase do próprio conjunto, e conferência nos quatro conjuntos pelo preview antes do empacotamento |
| A barra e o módulo de rede empurram o pacote da tela contra o teto | baixo | baixa | A barra é a única peça nova da tela e o módulo de rede vive no host, que tem teto próprio e folga de uma ordem de grandeza |
| O portão visual não é refeito para os estados novos | médio | média | O README fixa que ele vale por versão, e não uma vez só: quem mexe na tela roda os comandos de novo. Esta feature acrescenta desfechos de consulta e três barras, e por isso a tabela de estados do README cresce junto, com a data atualizada |
| A emenda ao PRD não chega ao `_reversa_sdd/` e a próxima leitura contradiz o código | alto | média | A emenda está escrita na seção 2 do `requirements.md` e entra no adendo da `/reversa-sync`, que é o mecanismo do projeto para exatamente isso |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] A suíte inteira verde, com casos novos para: ordenação da decomposição, interpretação dos cinco desfechos da consulta, derivação da versão e sua monotonicidade, e ausência de barra nos três estados de borda
- [ ] A suíte de fronteiras recusa módulos de rede dentro da camada de leitura e dentro do pacote da tela
- [ ] A política de conteúdo do painel continua sem permissão de conexão de saída, verificada por suíte
- [ ] `npm run build` e `npm run empacotar` verdes, com o pacote nomeado pela versão derivada
- [ ] Os desfechos novos da consulta alcançáveis por comando no preview, cada um com sua linha no README
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-plan` | reversa |
| 2026-09-09 | D-19 acrescentada durante a decomposição do `/reversa-to-do`: o carimbo da construção não pode ser versionado | reversa |
