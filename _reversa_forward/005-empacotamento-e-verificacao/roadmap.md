# Roadmap: empacotamento e verificação

> Identificador: `005-empacotamento-e-verificacao`
> Data: `2026-09-09`
> Requirements: `_reversa_forward/005-empacotamento-e-verificacao/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

A feature acrescenta três ferramentas de linha de comando e nenhuma capacidade nova ao produto. O
preview é um servidor local em Node puro que serve o mesmo pacote da tela que o editor serviria, sob
o mesmo documento e a mesma política de segurança, com um host de mentira no lugar da extensão: ele
lê o workspace apontado pela mesma camada de leitura que o host usa, e responde às mensagens do
painel pelo mesmo contrato do canal. O empacotamento é uma casca fina sobre a ferramenta oficial de
extensões, guardada por uma lista de conteúdo por reinclusão explícita e por uma suíte que abre o
pacote gerado e recusa o que não estava previsto. A guarda de tamanho entra no fim do empacotamento
da webview, lendo o teto de um módulo novo que passa a ser a única fonte dos limites do projeto,
inclusive do par entre versão mínima do editor e alvo do navegador. O único acréscimo dentro de
`src/` é uma extração: a sequência de mensagens que hoje vive dentro de `src/host/provider.ts` sai
para um módulo próprio, para que o provedor e o preview leiam a mesma regra em vez de duas que
concordam hoje.

## 2. Princípios aplicados

O projeto não tem `.reversa/principles.md`, de modo que não há princípio formal a confrontar. Ficam
registrados os invariantes herdados do PRD e das quatro features anteriores, que operam como
princípio de fato nesta.

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| A extensão nunca escreve arquivo | Nenhuma das três ferramentas roda dentro da extensão, e nada do que elas fazem entra no pacote instalado | respeita |
| A extensão não toca disco fora do workspace observado | O preview lê apenas o workspace que recebe por argumento, e o auxiliar do estado degradado escreve somente em pasta temporária do sistema | respeita |
| Nenhum tráfego de rede em tempo de execução | O preview serve em `127.0.0.1` e recusa outra origem; a instalação de dependências é o único momento em que a rede é tocada | respeita |
| Erros barulhentos antes de desempenho | Bundle acima do teto, pacote com arquivo não previsto, empacotador ausente, porta ocupada e bundle inexistente param o comando com causa e remédio na mensagem | respeita |
| O que se verifica tem de ser o que se entrega | O preview usa o pacote real, a leitura real e o documento real; a webview não sabe que está em preview, e a única divergência de política está declarada na tela | respeita |
| Uma verdade só para cada dado | O teto, o alvo do navegador e a versão mínima do editor passam a viver num módulo só, e a sequência de mensagens do canal deixa de existir em dois lugares | respeita |
| Documentação para quem esqueceu tudo | O README ganha a seção que leva do clone à extensão instalada, com os sete estados nomeados e o comando de cada um | respeita |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | O preview é um servidor de `node:http` em `scripts/preview.js`, com a lógica em `scripts/preview/`, e sem dependência nova | O repositório já provou o formato em `scripts/heranca/`: casca fina de linha de comando, lógica em módulos que a suíte importa direto. Um servidor de arquivos estáticos com quatro rotas não justifica dependência, e cada dependência é dívida futura num projeto de atenção intermitente | Servidor de desenvolvimento de terceiro; empacotador com servidor embutido; abrir o arquivo pelo protocolo local, que quebraria a política de segurança | 🟢 |
| D-02 | O preview serve o documento por `buildDocument` e o corpo por `panelBody`, os mesmos que o host usa, com nonce por sessão | É o que faz a verificação valer: defeito que a política do editor causaria aparece no preview em vez de aparecer na instalação. Reusar também evita que a montagem da página exista em dois lugares, que é a metade de RF-17 | Página própria do preview com folha e script soltos; copiar o documento do host e deixá-lo divergir | 🟢 |
| D-03 | `buildDocument` ganha um campo opcional para a origem de conexão, que continua sendo `'none'` para o host e passa a ser a própria origem no preview | O host fingido precisa buscar o processo e mandar as linhas do painel de volta, e a política do editor proíbe conexão por ser correta lá. Um campo opcional com o padrão de hoje mantém o host intacto e concentra a divergência num ponto declarado, que a faixa do preview nomeia | Política solta no preview, que deixaria de exercer a do editor; dados embutidos na página, que tornaria a releitura falsa; canal por evento do navegador sem conexão, que não sobrevive à releitura | 🟡 |
| D-04 | A sequência de mensagens do host sai de `src/host/provider.ts` para `src/host/session.ts`, função pura que recebe as raízes e o leitor e devolve as mensagens em ordem, mais a raiz observada | O provedor continua dono do envio, da visibilidade e da abertura de arquivo, que dependem do editor; a regra de qual mensagem sai em que ordem passa a ser exercível sem editor e a ser a mesma que o preview usa. É a outra metade de RF-17 | Duplicar a sequência dentro do preview; expor o provedor inteiro ao preview, que arrastaria a interface do editor para dentro de uma ferramenta de terminal | 🟡 |
| D-05 | O host fingido vive em `scripts/preview/cliente.js`, servido como script próprio da página, fora do pacote da webview | RN-05 exige que a webview não saiba que está em preview. Como script irmão, ele define a interface do editor antes de o pacote carregar, guarda o estado no armazenamento local do navegador e traduz as mensagens do canal em requisições ao servidor. O pacote continua byte a byte o que o editor recebe | Sinal de ambiente dentro do pacote; segunda entrada de empacotamento para o preview, que produziria pacote diferente do instalado | 🟢 |
| D-06 | O canal do preview tem quatro rotas: a página, os dois arquivos do pacote, a leitura do processo e o retorno das mensagens do painel | O contrato inteiro cabe em quatro rotas porque o canal do editor tem cinco comandos e três deles não precisam de servidor. O detalhe está em `interfaces/canal-do-preview.md` | Uma rota só com verbo no corpo; canal por conexão persistente, que traria o recarregamento automático descartado na sessão de esclarecimentos | 🟡 |
| D-07 | O atraso declarado é observado pelo servidor antes de responder a leitura, e não pelo cliente | A regra de qual mensagem sai em que ordem é do host, e é ela que o atraso exercita. No cliente, o atraso mediria o cliente | Atraso no host fingido do navegador; atraso na camada de leitura, que contaminaria o produto | 🟢 |
| D-08 | O tema entra como classe no corpo do documento servido, com os mesmos nomes que o editor escreve, e o estado forçado como resposta pronta da rota de leitura | São os dois pontos por onde o painel lê o mundo: a classe do corpo em `src/webview/theme/contrast.ts` e o envelope do canal. Cobrir os dois cobre os quatro temas e os três estados sem processo | Trocar folha de estilo por argumento; construir processos falsos para os estados sem processo | 🟢 |
| D-09 | A faixa do preview é elemento irmão do ponto de montagem, com estilo próprio na página e nenhum estilo herdado da folha do painel | A faixa precisa existir sem alterar o que se está conferindo. Como irmã, ela não entra na árvore que o painel desenha e não desloca nada dentro dele | Faixa dentro do ponto de montagem; barra do navegador; título da aba, que ninguém lê ao conferir a tela | 🟢 |
| D-10 | Os limites do projeto passam a viver em `scripts/limites.js`: teto do pacote da tela, teto do pacote da extensão, versão mínima do editor e alvo do navegador correspondente | RF-15 e RN-01 e RN-06 pedem fonte única. Hoje o teto está só na prosa de `scripts/theme-tokens.js` e o alvo está literal em `scripts/build-webview.js`, e a suíte confere o literal. Com o módulo, build, empacotamento e suíte leem o mesmo número | Teto no manifesto de pacote; teto repetido na suíte; teto por variável de ambiente, que sumiria do repositório | 🟢 |
| D-11 | A guarda de tamanho roda ao fim de `scripts/build-webview.js`, medindo os dois arquivos emitidos e somando-os | O empacotamento da webview é quem sabe o que emitiu, e falhar ali é falhar antes de o build seguir. A soma é o que o teto sempre mediu, porque folha e script viajam juntos | Guarda como passo separado do build; guarda dentro da suíte apenas, que só acusaria depois do fato | 🟢 |
| D-12 | O conteúdo do pacote é declarado em `.vscodeignore` por exclusão universal seguida de reinclusão explícita da pasta de saída, do ícone, do manifesto e do README | Falha segura: pasta nova nasce fora do pacote, e entrar exige ato deliberado. Medido no estado atual, o modo contrário levaria 787 arquivos, incluindo as pastas de agentes, o ciclo forward, a cobertura e o arquivo com os caminhos das origens da máquina | Lista de exclusão por pasta conhecida, que envelhece a cada pasta nova; confiar no arquivo de ignorados do git, que o empacotador não lê | 🟢 |
| D-13 | A suíte de conteúdo abre o pacote gerado com um leitor mínimo do diretório central do formato, escrito em `scripts/vsix.js`, sem dependência e sem descompactar nada | O que interessa são os nomes e os tamanhos, e eles estão no índice do arquivo, que é lido com poucas dezenas de linhas. Conferir o pacote de fato é mais forte que conferir o que a ferramenta diz que faria | Listar pelo comando da ferramenta e comparar a saída; descompactar com binário do sistema, que passaria a exigir ferramenta fora do arquivo de trava | 🟡 |
| D-14 | O empacotador oficial entra como dependência de desenvolvimento em igualdade exata, invocado sem resolução de dependências de produção e sem exigência de repositório declarado | Verificado nesta máquina: nessa forma ele gera o pacote com a marca de privado e sem publicador, e a resolução dispensada cabe porque o projeto não tem dependência de produção. É a ferramenta oficial do formato, mantida por quem define o formato | Escrever o formato à mão, que economizaria 135 MB de dependência de desenvolvimento ao custo de manter um empacotador próprio; empacotador de terceiro | 🟢 |
| D-15 | O manifesto ganha publicador local e mantém a marca de pacote privado; licença, repositório e ícone de loja ficam fora | Decisão do usuário na sessão de esclarecimentos. Sem publicador, o editor instala sob identificador anônimo; com ele, a extensão aparece nomeada, e nada disso cria conta nem compromisso de publicação | Publicar de fato; manifesto completo de publicação desde já; nenhum publicador, aceitando o identificador anônimo | 🟢 |
| D-16 | O modo de observação é uma opção de `scripts/build-webview.js`, que liga o mapa de fontes e mantém o empacotador vivo, sem tocar no caminho do build | Reusa a configuração já existente, inclusive o podador de tokens, e evita um segundo lugar onde a webview é empacotada. O mapa de fontes só existe nesse modo, para que o pacote instalado siga sem ele | Script separado de observação; mapa de fontes sempre ligado, que engordaria o pacote entregue | 🟢 |
| D-17 | O auxiliar do estado degradado é `scripts/estragar-workspace.js`, que copia o workspace para pasta temporária do sistema, trunca um arquivo do Reversa e imprime o caminho da cópia | Mantém RN-02 intacta: quem escreve é o auxiliar, não o preview, e o que ele escreve fica fora do repositório e fora do workspace de origem. Imprimir o caminho é o que liga o auxiliar ao preview sem acoplar um ao outro | Estragar por argumento do próprio preview; workspace de fixtura versionado, que colocaria arquivo corrompido dentro do repositório | 🟡 |
| D-18 | A configuração de depuração nasce em `.vscode/`, com a tarefa de build como pré-tarefa | É o que RF-19 pede, e é o que evita a janela de desenvolvimento abrir sobre saída velha. A pasta ainda não existe e não está ignorada pelo git | Depuração por documentação no README; abrir a janela sem pré-tarefa | 🟢 |
| D-19 | Os quatro scripts novos do manifesto são `preview`, `empacotar`, `observar:webview` e `estragar:workspace`, e a suíte passa a esperar catorze | A suíte fixa a lista exata de propósito, e mexer nela é declarar a mudança em vez de sofrê-la, como a feature 004 já fez ao passar de seis para dez | Subcomandos dentro de um script só; comandos não declarados, chamados por caminho | 🟢 |
| D-20 | Os módulos novos de `scripts/` são escritos em português, como os da herança, e os dois arquivos de build existentes seguem em inglês sem serem renomeados | A convenção declarada na feature 004 é que `scripts/` é lido pelo mantenedor e usa português. Renomear e reescrever `build-webview.js` e `theme-tokens.js` seria custo sem ganho, e a inconsistência fica declarada aqui em vez de descoberta depois | Reescrever os dois arquivos existentes em português; escrever os novos em inglês por proximidade com o build | 🟡 |

## 4. Premissas

Nenhuma. As cinco dúvidas do `requirements.md` foram resolvidas na sessão de esclarecimentos de
2026-09-09, e com elas as duas questões abertas da spec do componente, de modo que esta feature
entra no plano sem premissa pendente.

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| Preview fora do editor | `_reversa_sdd/sdd/empacotamento-e-verificacao.md#8-design-e-interface` | componente-novo | Servidor local com host fingido, que serve o pacote real sob o documento real e alcança os sete estados da tela |
| Empacotamento em VSIX | `_reversa_sdd/sdd/empacotamento-e-verificacao.md#6-requisitos-funcionais`, RF-04 | componente-novo | Casca sobre o empacotador oficial, com lista de conteúdo por reinclusão e suíte que abre o pacote gerado |
| Limites do projeto | `_reversa_sdd/sdd/empacotamento-e-verificacao.md#7-requisitos-nao-funcionais` | componente-novo | Módulo único com teto do pacote da tela, teto do pacote da extensão, versão mínima do editor e alvo do navegador |
| Empacotamento da webview | `_reversa_sdd/addenda/003-painel-do-processo.md#impacto-por-artefato-da-extracao` | regra-alterada | Ganha guarda de tamanho que interrompe o build e modo de observação com mapa de fontes |
| Host da extensão | `_reversa_sdd/sdd/ponte-e-host.md#6-requisitos-funcionais` | regra-alterada | A sequência de mensagens sai do provedor para `src/host/session.ts`, e o documento ganha campo opcional de origem de conexão |
| Manifesto do pacote | `_reversa_sdd/addenda/004-heranca-e-sincronia.md#impacto-por-artefato-da-extracao` | regra-alterada | Quatro scripts novos, publicador local e marca de privado mantida; a suíte passa a esperar catorze scripts |
| README | `_reversa_forward/004-heranca-e-sincronia/roadmap.md`, D-12 | regra-alterada | Ganha o percurso do clone à extensão instalada, os sete estados com o comando de cada um e o portão de saída |

## 6. Delta no modelo de dados

- Resumo das mudanças: nenhuma estrutura persistida nasce ou muda. O que entra é a configuração do
  preview lida da linha de comando, viva apenas em memória, e o campo opcional de origem de conexão
  do documento. O contrato do canal não ganha comando, campo nem ordem.
- Detalhe completo em: `_reversa_forward/005-empacotamento-e-verificacao/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| Canal do preview | HTTP local | `_reversa_forward/005-empacotamento-e-verificacao/interfaces/canal-do-preview.md` |

O contrato do canal entre host e painel, descrito em
`_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md`, permanece intacto: o preview o
cumpre do lado do host, e nada nele é acrescentado, renomeado ou removido.

## 8. Plano de migração

Não há migração de dado. A ordem de construção, porém, é obrigatória, porque cada peça é
pré-condição da seguinte.

1. Extrair `src/host/session.ts` do provedor, com a suíte escrita antes, e confirmar que as suítes do
   host seguem verdes.
2. Criar `scripts/limites.js` e fazer o empacotamento da webview e a suíte de build lerem dele o teto
   e o alvo.
3. Acrescentar a guarda de tamanho ao fim do empacotamento da webview, e o modo de observação.
4. Escrever o preview, do servidor ao host fingido, e alcançar os sete estados.
5. Escrever o auxiliar do workspace estragado.
6. Declarar a lista de conteúdo, acrescentar o empacotador e o comando de empacotamento, e escrever
   o leitor do pacote com a suíte de conteúdo.
7. Escrever a configuração de depuração e a seção nova do README.
8. Medir as quatro grandezas contra os tetos e registrá-las.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| A extração da sequência de mensagens quebra o provedor, que é código estável desde a feature 002 | alto | média | Suíte da sessão escrita antes da extração, e as suítes do provedor rodadas antes e depois sem alteração |
| A divergência de política de conexão esconde um defeito que só apareceria no editor | médio | baixa | A divergência é de uma diretiva só, está declarada na faixa da tela, e as demais diretivas seguem idênticas |
| O empacotador oficial pesa 135 MB de dependência de desenvolvimento e envelhece com o formato | médio | média | Fica preso em igualdade exata no arquivo de trava; não entra no pacote entregue; o formato é definido por quem mantém a ferramenta |
| A suíte de conteúdo exige empacotar a cada execução e fica lenta demais para ser rodada | médio | média | Ela lê o pacote que existir na raiz e é pulada com aviso quando não houver, do mesmo modo que a suíte de build lê a saída da última construção |
| O portão visual continua devido depois desta feature, porque o ambiente dos agentes não tem navegador | médio | alta | Registrado como tal no `requirements.md` e no README; a feature entrega o instrumento e a lista dos sete estados com o comando de cada um |
| O preview passa a ser um segundo lugar onde a tela é montada, e diverge do editor com o tempo | alto | baixa | Documento, corpo e sequência de mensagens vêm do host; o que o preview escreve é servidor, host fingido e faixa |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] A suíte inteira verde, incluindo as suítes novas da sessão, dos limites, da guarda de tamanho e
      do conteúdo do pacote
- [ ] O build falha quando o teto é baixado abaixo do tamanho medido, e volta a passar quando ele é
      restaurado
- [ ] O pacote gerado não contém nenhum caminho fora da lista prevista
- [ ] O README leva do clone à extensão instalada, com os sete estados e o comando de cada um
- [ ] As quatro grandezas medidas e registradas contra os tetos
- [ ] `legacy-impact.md` e `regression-watch.md` gerados pelo `/reversa-coding`
- [ ] O portão visual dos sete estados declarado como cumprido ou como devido, sem ambiguidade

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-plan` | reversa |
