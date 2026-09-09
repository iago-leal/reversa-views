# Adendo: empacotamento e verificação

> Identificador da feature: `005-empacotamento-e-verificacao`
> Data: `2026-09-09`
> Cenário: `greenfield`
> Gerado por: `/reversa-sync`

Este adendo é uma ponte. A extração em `_reversa_sdd/` descreve o produto como ele foi
especificado, e a entrega da feature 005 fechou o ciclo pelas duas pontas que faltavam: como o
código vira extensão instalada, e como se confere a tela antes disso. Em quatro pontos o código foi
além do que a spec do componente previa, e num ponto ele deixou dívida declarada, a do portão
visual. O que segue diz como ler cada artefato da extração enquanto a re-extração não vem.

## Vigência

Vigente desde 2026-09-09.

## Resumo da entrega

A feature acrescenta três ferramentas de linha de comando e nenhuma capacidade nova ao produto
instalado. O preview é um servidor local em Node puro que serve o mesmo pacote da tela que o editor
serviria, sob o mesmo documento e a mesma política de segurança, com um host de mentira no lugar da
extensão. O empacotamento é uma casca fina sobre a ferramenta oficial de extensões, guardada por
uma lista de conteúdo por reinclusão explícita e por uma suíte que abre o pacote gerado e recusa o
que não estava previsto. A guarda de tamanho entra ao fim do empacotamento da webview, lendo o teto
de um módulo novo que passa a ser a única fonte dos limites do projeto.

Duas decisões de forma ordenam o resto. A primeira é que o preview não monta quase nada: documento,
corpo e sequência de mensagens vêm da saída compilada do host, e o que é dele são o servidor de
cinco rotas, o host fingido e a faixa que declara as diferenças. A segunda é a extração de
`src/host/session.ts`, único acréscimo dentro de `src/`: a sequência de mensagens saiu do provedor
para que o provedor e o preview leiam a mesma regra, em vez de duas que concordam hoje.

**34 ações concluídas de 34 previstas**, conforme `actions.md` e as 36 linhas de `progress.jsonl`,
das quais duas registram correções sobre ações já fechadas. Nenhuma ação ficou aberta, e por isso
**esta é uma sincronização total**. A suíte passou de 597 casos em 52 arquivos para 662 casos em 58
arquivos, sem falha e sem pulo.

Quatro grandezas foram medidas nesta máquina, um contêiner Linux de desenvolvimento: o build
completo com a pasta de saída apagada antes levou 1,6 s contra o teto de 30 s; o pacote da tela mede
168849 B contra 409600 B; o pacote da extensão mede 133194 B contra 2097152 B; o método de cada
medida está na última linha de `progress.jsonl`. A guarda foi exercida nos dois sentidos: baixado o
teto para 100000 B, o build termina com código 1 e a medida na mensagem; restaurado, volta a zero.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/prd.md` | `#4-escopo-in` | componente-novo | O empacotamento local e a conferência da tela fora do editor deixaram de ser escopo previsto e passaram a ser comando de terminal. Leia a seção como entregue: `npm run empacotar` gera o pacote instalável, e `npm run preview` serve o painel num navegador comum. |
| `_reversa_sdd/prd.md` | `#6-restricoes` | componente-novo | A restrição de a extensão nunca escrever sobrevive intacta a uma feature que acrescentou três ferramentas. Nenhuma delas roda dentro da extensão, o preview não escreve byte algum, e o único escritor da feature é o auxiliar do estado degradado, que escreve apenas em pasta temporária do sistema. Ambas as regras são hoje RN-02 e verificadas por suíte. |
| `_reversa_sdd/prd.md` | `#8-riscos` | regra-alterada | O risco de maior probabilidade do produto, defeito visual que passa por suíte verde, ganhou instrumento e não ganhou fechamento. O preview alcança os sete estados por comando, e o README nomeia o comando de cada um; o portão continua **devido**, porque o ambiente em que a feature foi escrita não tem navegador. Leia o risco como mitigado no meio, não no fim. |
| `_reversa_sdd/prd.md` | `#9-criterios-de-aceite-alto-nivel` | componente-novo | O percurso do clone à extensão instalada passou a estar escrito e a ser reprodutível em sete comandos, com o preview obrigatoriamente antes do empacotamento. É a seção do README chamada "Do clone à extensão instalada". |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#6-requisitos-funcionais` | componente-novo | Os treze requisitos da seção estão implementados; cinco já vinham das features 003 e 004. O `requirements.md` da feature acrescentou nove ao recorte: o atraso por argumento e o auxiliar do estado degradado, que a spec não previa e sem os quais dois dos sete estados eram inalcançáveis; a suíte que abre o pacote gerado; a fonte única dos limites; a lista exata de comandos do manifesto; a proibição de reescrever regra de leitura dentro do preview; e o ritual no README. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#7-requisitos-nao-funcionais` | regra-alterada | Os cinco requisitos estão atendidos, e três deles agora com número. RNF-01: 1,6 s contra 30 s. RNF-02: 168849 B contra 400 KB. RNF-03: 133194 B contra 2 MB. RNF-04 e RNF-05 ganharam a dependência do empacotador oficial, que custa 135 MB de dependência de desenvolvimento, entra em igualdade exata, fica no arquivo de trava e não chega ao pacote entregue. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#8-design-e-interface` | componente-novo | Os quatro estados previstos para o preview continuam válidos e ganharam forma que a seção não fixava: cinco rotas em HTTP local, descritas em `_reversa_forward/005-empacotamento-e-verificacao/interfaces/canal-do-preview.md`, e uma faixa que nomeia preview, workspace, tema e estado forçado, e enumera três limites. A faixa é irmã do ponto de montagem e se estiliza por script, para não alterar o que se está conferindo nem afrouxar a política de estilo. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#9-modelo-de-dados` | delta-de-dados | **Leia esta seção com o `data-delta.md` da feature ao lado.** A configuração do preview ganhou um sexto campo, o atraso, sem o qual os estados de carregamento e releitura duram milissegundos e não se deixam ver. Três formas novas entraram, todas em módulo versionado e nenhuma persistida: os limites do projeto, o conteúdo previsto do pacote e a entrada do índice do pacote. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#10-integracoes-e-dependencias` | regra-alterada | A ferramenta de empacotamento de extensão saiu de dependência prevista e virou dependência declarada, invocada sem resolução de dependências de produção e sem exigência de repositório declarado. O comportamento previsto para navegador ausente é o estado normal desta máquina: o preview serve na porta e imprime o endereço, sem abrir nada. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#11-edge-cases-e-tratamento-de-erros` | regra-alterada | Os nove casos têm tratamento. EC-02 mudou de natureza e é a mudança que mais importa aqui: o conteúdo indevido no pacote deixou de depender de conferência humana da listagem impressa e passou a ter suíte que abre o pacote e nomeia cada caminho fora da lista prevista. Ao lado dele entraram três casos que a seção não previa: origem estranha recusada com 403, corpo grande no canal recusado com 413, e pacote da tela apagado com o preview aberto. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#12-seguranca-e-privacidade` | componente-novo | A seção continua verdadeira e deixou de depender de revisão humana. Que o preview escute apenas na interface local, recuse outra origem e não escreva nada são hoje RN-02 e RN-03, verificadas por suíte. **Um ponto exige leitura atenta:** a política de segurança do preview permite conexão com a própria origem, o que a do editor proíbe. É uma diretiva de largura, é o que torna o canal possível fora do editor, e está declarada na faixa da própria tela. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#13-plano-de-rollout` | componente-novo | A estratégia foi cumprida na ordem prevista, com o empacotamento por último. O que reverter ganhou precisão: o preview não deixa nada fora do repositório, e o auxiliar do estado degradado deixa uma cópia em pasta temporária do sistema, que o sistema limpa. O monitoramento pós-entrega existe: o tamanho da tela é impresso a cada construção e o do pacote a cada empacotamento, ambos ao lado do teto. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#14-open-questions` | componente-novo | As três questões estão fechadas. OQ-01 resolveu-se pelo sim, na sessão de esclarecimentos de 2026-09-09: a suíte de conteúdo passou a Must, porque a listagem impressa é a primeira camada e não impede que documento interno saia dentro da extensão. OQ-02 resolveu-se pelo recarregamento manual, com o modo de observação subindo de Could para Should. OQ-03 já fora resolvida pela feature 003, com o podador de tokens. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#15-decisoes-tomadas-decision-log` | componente-novo | As seis decisões foram exercidas. A elas somam-se as vinte decisões técnicas do `roadmap.md` da feature, das quais quatro mudam como a spec deve ser lida: o preview reusa documento, corpo e sequência de mensagens do host em vez de montá-los; o host fingido vive fora do pacote da webview; os limites do projeto passam a ter fonte única; e o conteúdo do pacote é declarado por exclusão universal seguida de reinclusão, e não por lista de exclusão que envelhece a cada pasta nova. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#6-requisitos-funcionais` | regra-alterada | O host ganhou um módulo que a seção não previa, `src/host/session.ts`, e o provedor encolheu na mesma medida. A regra de qual mensagem sai em que ordem saiu de dentro do provedor, onde só era exercível com o editor por perto, e virou função pura com dois consumidores: o provedor e o preview. O provedor continua dono do envio, da visibilidade e da abertura de arquivo, que dependem do editor. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#9-modelo-de-dados` | delta-de-dados | `DocumentOptions` ganhou dois campos opcionais, a origem de conexão e a classe do corpo, e opcional é a palavra: ausentes, produzem exatamente a política e o documento de hoje, o que a suíte do documento continua garantindo. **O contrato do canal entre host e painel permanece intacto:** nenhum comando, campo ou ordem entrou, saiu ou mudou de nome, e o preview o cumpre do lado do host. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#8-design-e-interface` | regra-alterada | Os sete estados da tela deixaram de ser alcançáveis apenas por instalação no editor e passaram a ter, cada um, um comando escrito no README. Três saem por estado forçado, dois por atraso declarado, um pelo workspace real e um por uma cópia estragada em pasta temporária. A tela em si não mudou: nenhum estado foi acrescentado nem removido, e nada no pacote da webview sabe que está em preview. |

Resumo: 17 impactos registrados. Nove de tipo `componente-novo`, seis de `regra-alterada` e dois de
`delta-de-dados`. Nenhum `componente-extinto`, `regra-nova`, `regra-removida` ou
`delta-de-contrato-externo`, e a ausência do último é deliberada: o canal do preview é contrato
novo entre duas peças de desenvolvimento, e o contrato externo do produto, o do painel com o host,
não foi tocado.

## Regras sob vigilância

O watch principal de `regression-watch.md` continua **vazio**, pelo mesmo motivo das features 001 a
004: sem extração `/reversa` sobre este repositório não há regras 🟢, e sem regras 🟢 não há o que
vigiar.

Os identificadores **W095 a W115** existem, reservados e estáveis, na seção "Observações" daquele
arquivo, cobrindo os vinte e dois requisitos funcionais e as regras de negócio desta feature. Eles
seguem a numeração da feature 004, que foi até W094. Nenhum identificador antigo foi reciclado nem
reescrito.

Conteúdo integral em `_reversa_forward/005-empacotamento-e-verificacao/regression-watch.md`. Três
pontos registrados ali merecem atenção de quem rodar a próxima extração. O primeiro é a extração da
sequência de mensagens: se a ordem reaparecer duplicada dentro do provedor ou dentro do preview, ela
se desfez. O segundo é a fonte única dos limites: quatro números que voltarem a existir em dois
lugares desfazem RN-06, e o par entre alvo do navegador e versão mínima do editor é o que quebra
apenas na máquina de quem instalou. O terceiro é o portão visual, que segue devido e está declarado
como tal no README.

## Fontes

- `_reversa_forward/005-empacotamento-e-verificacao/legacy-impact.md`
- `_reversa_forward/005-empacotamento-e-verificacao/regression-watch.md`
- `_reversa_forward/005-empacotamento-e-verificacao/requirements.md`
- `_reversa_forward/005-empacotamento-e-verificacao/roadmap.md`
- `_reversa_forward/005-empacotamento-e-verificacao/data-delta.md`
- `_reversa_forward/005-empacotamento-e-verificacao/interfaces/canal-do-preview.md`
- `_reversa_forward/005-empacotamento-e-verificacao/actions.md`
- `_reversa_forward/005-empacotamento-e-verificacao/progress.jsonl`

## Atualização 2026-09-09

Depois de fechado o adendo, a entrega ganhou uma emenda de uso: o painel passou
a ter um comando próprio de abertura na paleta, e o README foi reordenado para
que o uso diário seja um passo, não um percurso.

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/prd.md` | `#9-criterios-de-aceite-alto-nivel` | componente-novo | O manifesto declara dois comandos, `reversaViews.abrir` e `reversaViews.reload`, ambos sob a categoria `Reversa`. Abrir o painel deixou de depender do comando de foco que o editor gera sozinho, cujo nome ninguém adivinha na paleta. |
| `_reversa_sdd/prd.md` | `#9-criterios-de-aceite-alto-nivel` | regra-alterada | A seção do README chamada "Do clone à extensão instalada", citada acima, deixou de existir com esse nome. O percurso continua escrito, repartido em "Instalar, uma vez só" e "Reconstruir o pacote", e a abertura do painel passou a abrir o documento. |
| Ativação | `src/extension.ts` | componente-novo | O comando de abertura delega ao comando de foco da visão contribuída, em vez de reimplementar a revelação do contêiner. A ativação segue com um único evento declarado: a ativação por comando é a implícita que o editor dá a todo comando do manifesto. |

Nada disso muda o contrato de canal, a política de conteúdo nem os tetos. O
portão visual continua devido.
