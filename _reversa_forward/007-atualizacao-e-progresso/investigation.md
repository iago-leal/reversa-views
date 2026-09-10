# Investigation: verificação de atualização e progresso visível

> Identificador: `007-atualizacao-e-progresso`
> Data: `2026-09-09`
> Roadmap: `_reversa_forward/007-atualizacao-e-progresso/roadmap.md`

Este documento registra o que foi pesquisado antes de decidir, o que foi confirmado nesta sessão e o
que ficou para confirmar com um comando na primeira ação do `actions.md`. O critério de registro é
utilidade futura: interessa o que um mantenedor de daqui a doze meses precisaria reencontrar.

## 1. Como uma extensão distribuída fora do Marketplace se atualiza

O editor atualiza sozinho apenas o que veio da galeria. Extensão instalada por pacote local, que é o
regime deste projeto desde a feature 005, não tem canal de atualização: o editor não sabe de onde ela
veio e não tem a quem perguntar. As saídas conhecidas são quatro.

| Saída | O que exige | Por que não foi escolhida |
|-------|-------------|---------------------------|
| Publicar no Marketplace | Conta de publicador, changelog público, compromisso implícito com terceiros | Não-objetivo declarado no PRD, e a decisão foi adiada, não revogada |
| Publicar num registro aberto alternativo | Conta e publicação, com menos formalidade | Mesma objeção, e acrescenta um segundo lugar a manter |
| Galeria privada própria | Servidor a hospedar e manter | Custo desproporcional para um usuário |
| Mecanismo próprio, no clone | Nada além do que já existe | **Escolhida.** O clone já está na máquina, o git já sabe comparar, e o ritual se encaixa no de empacotamento |

A consequência de desenho é que "atualizar" não é uma operação da extensão, e sim do repositório. A
extensão participa apenas do primeiro ato, o de perceber que está velha, e é por isso que ela pode
continuar sem escrever arquivo algum.

## 2. Qual rota da origem responde "quantos commits atrás"

Quatro rotas foram consideradas na API do GitHub, e a comparação de dois commits é a única que
responde à pergunta que a mensagem do painel precisa fazer.

| Rota | O que devolve | Serve? |
|------|---------------|--------|
| Comparação de dois commits, `GET /repos/{dono}/{repo}/compare/{base}...{cabeca}` | A relação entre os dois e a distância em commits | **Sim** |
| Ponta do ramo, `GET /repos/{dono}/{repo}/commits/{ramo}` | O commit da ponta | Diz "é diferente", não diz o quanto |
| Última publicação, `GET /repos/{dono}/{repo}/releases/latest` | A publicação mais recente | Este repositório não publica versões |
| Lista de tags | As tags existentes | Este repositório não tem tag alguma |

**Confirmado nesta sessão**, na documentação oficial: o campo `status` da comparação assume quatro
valores, `identical`, `ahead`, `behind` e `diverged`, e as distâncias `ahead_by` e `behind_by` são
medidas **em relação à base**. Com base no commit de construção e cabeça no ramo padrão, portanto,
uma extensão desatualizada produz `status: "ahead"` e `ahead_by` igual ao número de commits novos.
Commit ou referência inexistente responde 404, que é exatamente o caso do pacote construído de um
commit local nunca enviado, previsto em RF-15.

A leitura desses três campos é o que o interpretador puro de `src/host/update.ts` faz, e é por isso
que ele pode ser exercido por respostas gravadas, sem rede na suíte.

Dois pontos operacionais valem registro. O primeiro é o limite de taxa: requisição anônima é contada
por endereço de rede, com teto por hora, o que é folgado para uma consulta por leitura mas não é
infinito em rede compartilhada; a recusa por limite tem código próprio e vira desfecho nomeado. O
segundo é a requisição condicional: guardando a etiqueta da resposta anterior em memória e
reenviando-a, uma resposta sem novidade volta como 304 e não consome cota. É otimização barata, mas
depende de estado vivo do processo do host, e por isso entra como possibilidade a avaliar na
implementação, não como requisito.

## 3. Qual cliente de requisição usar dentro do editor

A pergunta importa porque `scripts/limites.js` fixa a versão mínima de editor em 1.78, e a versão
mínima determina o Electron embarcado, que determina o Node do processo de extensões. A busca feita
nesta sessão **não foi conclusiva** sobre qual Node exatamente aquele Electron embarca, e as fontes
encontradas falavam de versões muito posteriores do editor.

A decisão foi tomada de modo a não depender da resposta. O módulo nativo de HTTPS existe em toda
versão de Node, e o cliente global só existe a partir de certa versão. Usar o nativo torna a
pergunta irrelevante, ao custo de algumas linhas a mais em torno da requisição. Há ainda um efeito
colateral favorável: o editor instrumenta o módulo nativo para respeitar a configuração de proxy do
usuário, de modo que quem trabalha atrás de proxy corporativo é atendido sem código nosso. Este
último ponto é 🟡 e vale conferir na implementação, porque muda apenas o texto de uma mensagem de
falha, não a arquitetura.

O tempo limite é responsabilidade de quem chama: o módulo nativo não impõe nenhum. Cinco segundos,
com destruição explícita da requisição ao estourar, é o que RF-11 pede.

## 4. Como fazer a versão crescer sozinha

Três famílias de solução foram consideradas.

| Família | Como funciona | Por que não |
|---------|---------------|-------------|
| Descrição por tags do git | O número sai da tag mais recente e da distância até ela | Exige criar tags, que é o ato deliberado que o usuário recusou |
| Publicação semântica automatizada | Uma ferramenta lê as mensagens de commit e decide o incremento | Depende de disciplina de prefixo e traz dependência que envelhece; para um mantenedor único é maquinaria demais |
| Derivação de artefato do próprio processo | O número sai de algo que o fluxo de trabalho já produz | **Escolhida** |

A escolha final derivou-a dos adendos de `_reversa_sdd/addenda/`, que existem porque o
`/reversa-sync` os escreve ao fim de cada feature entregue. O segundo número é o maior número de
feature com adendo; o terceiro conta os commits desde o commit que introduziu aquele adendo. A
derivação foi exercida nesta sessão sobre o repositório real e produziu `0.6.1`, com seis adendos e
um commit posterior ao último.

Duas armadilhas foram consideradas no desenho. A primeira é a monotonicidade: contar a QUANTIDADE de
adendos faria a versão recuar se um fosse apagado ou superado, e por isso a conta usa o maior número,
não a quantidade. A segunda é a data de referência do terceiro número: o adendo pode ser emendado
depois de criado, como aconteceu com o da feature 005, e por isso o commit de referência é o que
ACRESCENTOU o arquivo, e não o que o tocou por último.

Sobre a forma do número, o manifesto do editor exige três inteiros separados por ponto. Isso exclui
sufixos de identificação de construção, e é a razão de o commit viajar como constante à parte, e não
grudado na versão.

## 5. Barra de progresso sem componente pronto

O projeto depende do conjunto de primitivas do Primer, que entrega tokens de cor, de espaço e de
tipografia. Os componentes do Primer vivem em outro pacote, que traria uma árvore de dependência
grande para desenhar dois retângulos, e é dependência de produção onde hoje não há nenhuma.

O desenho a copiar é simples e está descrito na documentação do design system: um trilho de canto
arredondado com um preenchimento de largura proporcional, tipicamente de oito pixels de altura,
usando cor de ênfase sobre cor neutra suave. Reconstruí-lo sobre os mesmos tokens dá o mesmo
resultado visual, adapta-se aos quatro conjuntos de cores já importados e não acrescenta byte de
dependência.

Duas exigências de acessibilidade orientam a forma, e ambas viraram requisito. A primeira é o papel
declarado: o elemento precisa anunciar-se como barra de progresso, com mínimo, máximo, valor corrente
e um texto equivalente, porque a informação não pode existir apenas como comprimento. A segunda é o
contraste de elemento não textual: o preenchimento precisa de ao menos 3:1 contra o trilho, exigência
que vale também nos dois conjuntos de alto contraste.

O elemento nativo de progresso do HTML foi considerado e descartado: ele traz aparência própria de
cada plataforma, resiste a estilização consistente e obrigaria a lutar contra o navegador embarcado
em vez de escrever duas divisões.

## 6. Ordenação estável, que é o que impede a segunda regressão

A regra de RN-07 tem duas partes: ordenar por recência decrescente e, entre iguais, preservar a
ordem do arquivo. A segunda parte depende de a ordenação ser estável, isto é, de elementos
considerados equivalentes manterem a ordem relativa de entrada. A especificação da linguagem exige
essa estabilidade desde 2019, o que significa que a preservação da ordem do arquivo entre empates
não precisa de índice auxiliar nem de desempate artificial.

Isso importa mais do que parece aqui: as ações de uma mesma feature costumam ser fechadas em lote e
carimbadas no mesmo minuto, como se vê na trilha da feature 006, em que dezenas de ações trazem o
mesmo instante. Sem estabilidade garantida, a lista mudaria de ordem entre duas leituras idênticas, e
o defeito seria intermitente, que é a pior espécie.

## 7. O que ficou para confirmar com um comando

1. Que o cliente nativo de requisição responde como esperado dentro do processo de extensões do
   editor instalado nesta máquina, e que o proxy do usuário é respeitado sem código nosso.
2. Que o empacotador aceita, sem reclamar, um manifesto cuja versão foi escrita segundos antes pela
   própria construção, e que o pacote sai nomeado por ela.

Ambas são verificações de dez minutos e estão previstas como primeiras ações do plano.

## 8. Fontes

- Documentação da API de comparação de commits do GitHub, consultada em 2026-09-09:
  <https://docs.github.com/en/rest/commits/commits>
- Limites de taxa da API de REST do GitHub:
  <https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api>
- Publicação de extensões do editor, para o regime de atualização pela galeria:
  <https://code.visualstudio.com/api/working-with-extensions/publishing-extension>
- Componente de barra de progresso do Primer, como referência de forma:
  <https://primer.style/components/progress-bar>
- Papel de barra de progresso e seus atributos:
  <https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/progressbar>
- Contraste de elemento não textual, critério 1.4.11:
  <https://www.w3.org/TR/WCAG21/#non-text-contrast>
- Módulo nativo de HTTPS do Node, para tempo limite e destruição da requisição:
  <https://nodejs.org/api/https.html>
- Discussão do projeto do editor sobre atualização de Electron e estabilidade do processo de
  extensões, encontrada na busca desta sessão e mantida como pista, não como resposta:
  <https://github.com/microsoft/vscode/issues/177338>

As três primeiras e as três últimas foram consultadas de memória e por busca; apenas a primeira foi
aberta e lida nesta sessão, e é a única cujo conteúdo está afirmado no corpo deste documento com
confidência 🟢.

## 9. Confirmações da execução, 2026-09-09

Os dois itens da seção 7 foram confirmados por chamada real antes de escrever código, e são as ações
`T001` e `T002` do `actions.md`. O que segue substitui a suposição pelo medido.

### 9.1 A semântica dos campos de distância, confirmada (`T001`)

Três chamadas anônimas à rota de comparação do repositório real, com os cabeçalhos que o contrato
fixa e nenhum outro. O repositório responde 200 sem credencial, de modo que a consulta anônima de
D-04 é viável.

| Chamada | `status` | `ahead_by` | `behind_by` | Código |
|---|---|---|---|---|
| `bad021b...master`, quatro commits de distância | `ahead` | 4 | 0 | 200 |
| `master...master` | `identical` | 0 | 0 | 200 |
| `0000000…...master` | não há corpo de comparação | — | — | 404 |

A distância é medida em relação à base, como a documentação afirmava: com a base no commit de
construção, uma extensão quatro commits atrás produz `ahead_by: 4`. D-03 está confirmada e a tabela
de tradução do contrato vale como escrita.

**Uma armadilha apareceu, e não estava prevista.** O corpo do 404 traz um campo chamado `status`, de
valor `"404"`, que é cadeia e não um dos quatro valores da comparação:

```json
{"message":"Not Found","documentation_url":"https://docs.github.com/rest/…","status":"404"}
```

Ler `status` do corpo sem olhar antes o código da resposta faria o intérprete receber `"404"` onde
espera `identical`, `ahead`, `behind` ou `diverged`. A consequência de desenho é que o intérprete
decide **primeiro pelo código da resposta** e só depois olha o corpo, e que valor de `status` fora
dos quatro conhecidos vira `resposta-inesperada` em vez de exceção. Ambas as regras entraram na
suíte do intérprete como caso próprio.

### 9.2 O cliente de requisição, confirmado por versão mínima (`T002`)

O editor instalado nesta máquina é o 1.136.1, muito acima do mínimo. Mas o que decide a escolha do
cliente não é o editor instalado: é o **mínimo declarado** em `scripts/limites.js`, hoje 1.78, que
embarca o Electron 22 e com ele um Node da linha 16. O cliente global de requisição só passa a vir
habilitado por padrão na linha 18, e portanto não existe no piso que o manifesto promete suportar.

D-05 fica confirmada pelo piso, e não pelo teto: o módulo nativo de HTTPS é o único que existe em
toda a faixa declarada. Um editor recente ofereceria o cliente global, mas usá-lo tornaria a
extensão quebrada exatamente na versão mínima que ela declara aceitar.

Quanto ao respeito à configuração de proxy do usuário, a confirmação **não** foi feita por medição:
exigiria uma máquina atrás de proxy corporativo, que não é esta. O ponto continua 🟡, sustentado
apenas pelo comportamento documentado do editor, que instrumenta o módulo nativo para observar a
própria configuração de proxy. A consequência de errar é uma mensagem de falha imprecisa, e não uma
falha de arquitetura: quem estiver atrás de proxy verá `sem-rede` onde a causa exata seria outra.
