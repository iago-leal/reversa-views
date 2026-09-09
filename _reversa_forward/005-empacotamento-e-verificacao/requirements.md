# Requirements: empacotamento e verificação

> Identificador: `005-empacotamento-e-verificacao`
> Data: `2026-09-09`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

A feature fecha o ciclo do produto pelas duas pontas que faltam: como o código vira extensão
instalada e como se confere que a tela está certa antes disso. As features 001 a 004 já deixaram as
duas unidades de compilação, o comando de build, a verificação de tipos da webview e a suíte única;
falta o empacotamento em VSIX com lista de conteúdo explícita, o preview que serve a webview num
navegador comum com host fingido, a guarda que interrompe o build quando o bundle passa do teto e a
configuração de depuração que abre a janela de desenvolvimento. Ela serve ao mantenedor no papel de
quem constrói, e resolve o problema que o `vscode-kanban` registrou três vezes: defeito visual passa
por suíte verde e só aparece na tela. Fecha também o portão de saída que o adendo da feature 003
deixou devido, porque nenhuma versão deve ser empacotada antes de os sete estados serem vistos.

## 2. Contexto a partir do legado

Não houve extração `/reversa` sobre este repositório: ele nasceu pelo caminho greenfield, e o lugar
do `architecture.md`, do `domain.md` e do `code-analysis.md` é ocupado pelo PRD, pelas specs SDD e
pelos quatro adendos vigentes de `_reversa_sdd/addenda/`. As citações abaixo respeitam essa origem.

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md#6-requisitos-funcionais` | Os treze requisitos do componente: duas unidades de compilação, alvo do empacotador, build único, VSIX com lista de exclusão, preview com host fingido, tema e estado por argumento, faixa de limites, comando único de teste, verificação de tipos separada, configuração de depuração, teto de bundle e modo de observação | 🟡 |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md#7-requisitos-nao-funcionais` | Os cinco tetos: 30 s de build, 400 KB de bundle, 2 MB de VSIX, nenhuma instalação global e arquivo de trava versionado | 🟡 |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md#8-design-e-interface` | Os quatro estados do preview: servindo, estado forçado, bundle ausente e workspace sem Reversa | 🟡 |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md#11-edge-cases-e-tratamento-de-erros` | Os nove casos de borda, da ferramenta de VSIX ausente ao arquivo de trava ignorado | 🟡 |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md#12-seguranca-e-privacidade` | O preview serve apenas na interface local, recusa outra origem, lê o workspace informado e não escreve nada | 🟡 |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md#14-open-questions` | As três questões abertas: verificação automática do conteúdo do VSIX, recarregamento do navegador e corte de tokens de tema | 🟡 |
| `_reversa_sdd/sdd/painel-do-processo.md#8-design-e-interface` | Os sete estados da tela que o preview precisa alcançar, de sem diretório a relendo | 🟡 |
| `_reversa_sdd/sdd/painel-do-processo.md#13-plano-de-rollout` | O portão de saída condiciona o empacotamento à captura dos sete estados no preview | 🟡 |
| `_reversa_sdd/prd.md#5-nao-objetivos-out` | Distribuição por VSIX local, sem publisher, changelog público nem compromisso de suporte a terceiros | 🟡 |
| `_reversa_sdd/prd.md#8-riscos` | Defeito visual que passa por suíte verde e só aparece na tela, com probabilidade alta, mitigado por herdar o preview desde a primeira versão | 🟡 |
| `_reversa_sdd/addenda/003-painel-do-processo.md#impacto-por-artefato-da-extracao` | Cinco requisitos desta spec já foram atendidos pela feature 003, e o portão de saída do rollout continua devido porque o preview é desta feature | 🟢 |
| `_reversa_sdd/addenda/004-heranca-e-sincronia.md#impacto-por-artefato-da-extracao` | RF-03 mudou de forma: o build agora confere a herança localmente e regenera a constante da revisão antes de compilar, e o tempo do build ainda não foi medido contra o teto | 🟢 |
| `_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md` | A regra do canal entre host e painel, que o host fingido do preview precisa cumprir sem inventar comando | 🟢 |

**Estado observado no repositório em 2026-09-09**, que a leitura acima não registra e o desenho
precisa considerar:

- O manifesto do pacote declara dez scripts, e `tests/host-manifest.spec.ts` fixa essa lista exata,
  de modo que todo comando novo desta feature obriga a suíte a mudar junto, por desenho e não por
  acidente. 🟢
- O build completo, com dependências instaladas, leva 1,7 s contra o teto de 30 s, e já inclui os
  dois passos de herança que a feature 004 acrescentou. 🟢
- O bundle soma 168.849 bytes, sendo 160.441 de `main.js` e 8.408 de `main.css`, contra o teto de
  409.600 bytes. A poda de tokens do tema derruba os quatro conjuntos de cor de 485.898 para 12.466
  bytes, e sem ela o teto seria estourado. 🟢
- Não existe `.vscodeignore`, não existe pasta `.vscode` com configuração de depuração, e o
  empacotador de extensão não está entre as dependências de desenvolvimento. 🟢
- O manifesto traz `private: true` e não traz `publisher`, `license`, `repository` nem `icon`;
  quais desses campos o empacotador exige para gerar VSIX local é questão do plano, não deste
  documento. 🟢
- `src/host/reading.ts` não importa a API do editor: `readWorkspace` recebe a raiz e as portas por
  parâmetro, de modo que o preview pode chamá-lo a partir da saída compilada sem simular o editor. 🟢
- A webview toca o host em um único ponto, `hostApi()` em `src/webview/bridge/messaging.ts`, que
  chama `acquireVsCodeApi` uma vez por painel, e lê o tema pela classe do corpo do documento em
  `src/webview/theme/contrast.ts`. São essas duas superfícies que o host fingido precisa satisfazer,
  e nenhuma outra. 🟢
- `panelBody` em `src/host/panel.ts` monta a página com folha, ponto de montagem e script por nonce,
  e é função pura: o preview pode servi-la em vez de declarar uma segunda montagem. 🟢
- Sem lista de conteúdo, o empacotador leva 787 arquivos deste repositório, dos quais 486 são das
  pastas de agentes, 41 do ciclo forward e 24 da configuração do Reversa. Entram também a cobertura
  e o arquivo de origens da herança, que guarda caminhos da máquina do mantenedor e está no
  `.gitignore`, o que confirma que o empacotador não lê esse arquivo. 🟢
- O empacotador na versão corrente gera VSIX com a marca de pacote privado e sem publicador
  declarado, exigindo apenas que exista `README.md` e que a resolução de dependências de produção
  seja dispensada, o que cabe aqui porque tudo é dependência de desenvolvimento. Sem publicador, o
  editor instala a extensão sob identificador anônimo. 🟢
- O ambiente em que os agentes rodam não tem interface gráfica, e a verificação visual dentro do
  editor segue pendente desde a feature 002. 🟢

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| O Construtor, que é o mantenedor no papel de quem constrói | Ver a tela antes de instalar, e instalar sem passo esquecido | Roda o preview contra um workspace real, confere os sete estados, gera o VSIX e instala |
| O Retomador | Clonar depois de meses e ter o build funcionando de primeira | Clona, instala as dependências pelo arquivo de trava, roda um comando e obtém host e webview compilados |
| O Operador | Alterar a webview e ver o efeito sem reinstalar a extensão | Roda o modo de observação e o preview ao mesmo tempo, altera um componente e recarrega o navegador |

O Construtor é a persona primária desta feature, e a decisão que dela decorre é que toda falha para
com a causa e o que fazer, nunca com pilha de exceção crua, porque quem constrói está a um passo de
distribuir e não pode adivinhar o que quebrou.

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** O alvo do empacotador e a versão mínima declarada no manifesto apontam para o mesmo
   Electron. Divergência entre os dois é falha de suíte, não conferência de revisão, porque sintaxe
   mais nova que o Chromium embarcado não quebra o build e sim a máquina do usuário. 🟢
   - Origem no legado: `_reversa_sdd/sdd/empacotamento-e-verificacao.md#15-decisoes-tomadas-decision-log`
   - Tipo: nova
2. **RN-02:** O preview não escreve. Nenhum caminho de execução dele cria, altera ou remove arquivo
   dentro ou fora do repositório, e a única pasta que o build escreve continua sendo a de saída. É a
   mesma regra que a extensão cumpre, aplicada à ferramenta que a verifica. O auxiliar que monta o
   workspace estragado do estado degradado é a única exceção, e escreve apenas em pasta temporária
   do sistema, nunca no repositório nem no workspace apontado ao preview. 🟡
   - Origem no legado: `_reversa_sdd/prd.md#6-restricoes`
   - Tipo: nova
3. **RN-03:** O preview escuta apenas na interface local da máquina e recusa requisição de outra
   origem. O que ele serve é o processo do workspace do usuário, e servi-lo à rede seria expor
   conteúdo de repositório privado por descuido de ferramenta de desenvolvimento. 🟡
   - Origem no legado: `_reversa_sdd/sdd/empacotamento-e-verificacao.md#12-seguranca-e-privacidade`
   - Tipo: nova
4. **RN-04:** O preview usa o bundle real e a leitura real. Não há segunda implementação da tela,
   não há dado sintético em estado que tenha processo, e o que ele finge é apenas o host: a interface
   do editor, o canal de mensagens e a classe de tema no corpo do documento. Preview que desenha por
   conta própria verifica a si mesmo. 🟡
   - Tipo: nova
5. **RN-05:** A webview não sabe que está em preview. Nenhum sinal de ambiente entra no bundle, e a
   faixa que declara o preview é servida pela página, fora do ponto de montagem do painel. Bundle que
   se comporta diferente sob verificação não é o bundle que se instala. 🟡
   - Tipo: nova
6. **RN-06:** O teto do bundle é declarado num lugar só, e tanto a guarda do build quanto a suíte o
   leem de lá. Dois números que precisam concordar acabam discordando. 🟡
   - Tipo: nova
7. **RN-07:** O conteúdo do VSIX é definido por exclusão universal seguida de reinclusão explícita,
   e não por lista de pastas indesejadas. A diferença importa por falha segura: pasta nova nasce fora
   do pacote por padrão, e entrar exige ato deliberado. É acréscimo à spec, que descreve a lista pelo
   que ela exclui. 🟡
   - Origem no legado: `_reversa_sdd/sdd/empacotamento-e-verificacao.md#6-requisitos-funcionais`, RF-04
   - Tipo: alterada
8. **RN-08:** Nenhuma versão é empacotada antes de os sete estados da tela terem sido vistos no
   preview. O portão vem do rollout da feature 003 e ficou devido por falta do preview. Esta feature
   entrega o instrumento e a lista dos sete estados com o argumento de cada um; a execução do portão
   é do mantenedor, em sessão com navegador, porque o ambiente dos agentes não tem interface
   gráfica. Enquanto ela não ocorrer, o portão continua declarado como devido. 🟢
   - Origem no legado: `_reversa_sdd/sdd/painel-do-processo.md#13-plano-de-rollout`
   - Tipo: nova
9. **RN-09:** O empacotamento não publica. Nenhum comando desta feature fala com o Marketplace, e a
   ausência de publisher registrado é estado declarado, não pendência a resolver. 🟡
   - Origem no legado: `_reversa_sdd/prd.md#5-nao-objetivos-out`
   - Tipo: nova
10. **RN-10:** Toda ferramenta nova entra como dependência de desenvolvimento em igualdade exata de
    versão, sem instalação global, como as quatro features anteriores fizeram. 🟢
    - Origem no legado: `_reversa_sdd/sdd/empacotamento-e-verificacao.md#7-requisitos-nao-funcionais`, RNF-04 e RNF-05
    - Tipo: nova

## 5. Requisitos Funcionais

Cinco dos treze requisitos da spec do componente já foram atendidos pelas features anteriores, e
não voltam como escopo: RF-01, as duas unidades de compilação, e RF-10, a verificação de tipos da
webview, vieram da feature 003; RF-02, o alvo fixado no Chromium 108, veio do mesmo lugar; RF-03, o
comando único de build, existe e foi alterado pela feature 004; RF-09, o comando único de teste,
existe desde a feature 001. Deles, apenas o que ainda não tem guarda executável reaparece abaixo.
O adendo da feature 003 registra RF-13 como atendido, e a leitura do repositório desmente: o script
de empacotamento declara `sourcemap: false` e diz por escrito que observação, mapa de fontes e teto
pertencem a esta feature. É assim que ele entra aqui.

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | Um comando de empacotamento que gera o VSIX a partir da pasta de saída | Must | O comando produz um arquivo `.vsix` instalável a partir de um clone limpo, depois do build | 🟡 |
| RF-02 | O conteúdo do pacote é definido por exclusão universal seguida de reinclusão explícita do que a extensão precisa em execução | Must | Listar o conteúdo do VSIX não mostra `_reversa_sdd`, `_reversa_forward`, `.reversa`, `src`, `tests`, `scripts`, `coverage` nem `node_modules`, e mostra a pasta de saída, o ícone, o manifesto e o README | 🟡 |
| RF-03 | O comando de empacotamento imprime, ao final, o conteúdo do pacote e o tamanho medido ao lado do teto | Must | A saída do comando nomeia cada arquivo empacotado e termina com tamanho e teto na mesma linha | 🟡 |
| RF-04 | O manifesto declara um publicador local e mantém a marca de pacote privado, sem licença, repositório nem ícone de loja | Must | O empacotamento gera o VSIX, o editor instala a extensão sob identificador que nomeia o publicador local, e nada no manifesto depende de conta no Marketplace | 🟢 |
| RF-05 | O comando de empacotamento falha com a instrução de instalação quando o empacotador não estiver presente, sem deixar arquivo parcial | Must | Removida a dependência, o comando termina com mensagem que nomeia o pacote a instalar, e nenhum `.vsix` fica em disco | 🟡 |
| RF-06 | Um preview que serve o bundle real da webview num navegador comum, com host fingido, lendo o processo de um workspace passado por argumento | Must | Apontar o preview para este repositório mostra o painel com o processo real dele, idêntico ao que o editor mostraria | 🟡 |
| RF-07 | O host fingido do preview cumpre o contrato do canal: responde ao pronto com o processo lido, atende a releitura com nova leitura, e registra no terminal a abertura de arquivo e as linhas de log | Must | Cada um dos cinco comandos da webview produz o efeito descrito em `_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md`, e nenhum comando fora dele é inventado | 🟢 |
| RF-08 | O preview aceita o tema por argumento, entre claro, escuro, claro de alto contraste e escuro de alto contraste, escrevendo no corpo do documento a classe que o editor escreveria | Must | Cada um dos quatro valores repinta o painel, e a classe escrita é a que `src/webview/theme/contrast.ts` reconhece | 🟢 |
| RF-09 | O preview aceita um estado de entrada forçado por argumento, para exibir sem diretório, sem Reversa e erro sem depender de workspace que os produza | Must | Os três estados aparecem sem leitura de disco, e o estado forçado é declarado na faixa do preview | 🟡 |
| RF-09a | O preview aceita um atraso por argumento, que o host fingido observa antes de responder ao pronto e a cada releitura | Must | Com o atraso declarado, os estados carregando e relendo ficam visíveis pelo tempo pedido, em vez de durarem milissegundos | 🟢 |
| RF-09b | Um auxiliar monta, em pasta temporária do sistema, uma cópia estragada de um workspace, para que o estado instalado e degradado seja alcançável | Must | O preview apontado para essa cópia mostra o painel com a seção de anomalias expandida, e nem o repositório nem o workspace de origem são tocados | 🟡 |
| RF-10 | Os sete estados da tela do painel são alcançáveis pelo preview, e o modo de alcançar cada um está escrito | Must | Uma seção do README nomeia os sete estados e, para cada um, o comando exato que o produz: três por estado forçado, dois por atraso, um pelo workspace real e um pela cópia estragada | 🟡 |
| RF-11 | O preview declara na própria página que é preview e não o editor, listando o que não simula | Must | Uma faixa fixa no topo nomeia o preview, o workspace lido, o tema e o estado forçado, e enumera os limites | 🟡 |
| RF-12 | O preview escuta apenas na interface local, aceita a porta por argumento e para com mensagem própria quando a porta estiver ocupada | Must | Requisição vinda de outra origem é recusada, e a porta ocupada produz mensagem que sugere o argumento de porta | 🟡 |
| RF-13 | O preview recusa iniciar quando o bundle não existir, dizendo para rodar o build antes | Must | Num clone sem build, o preview termina com essa mensagem e não abre porta | 🟡 |
| RF-14 | O build falha quando o bundle da webview exceder o teto de tamanho, antes de qualquer empacotamento | Must | Um bundle acima do teto interrompe o build com o tamanho medido e o teto, e o VSIX não chega a ser gerado | 🟡 |
| RF-15 | O teto do bundle é declarado num único módulo, lido pela guarda do build e pela suíte | Must | Alterar o teto num lugar muda o comportamento das duas, e não existe segundo número no repositório | 🟡 |
| RF-16 | A suíte do manifesto passa a fixar a lista exata de scripts desta feature, e a conferir que o alvo do empacotador e a versão mínima do editor apontam para o mesmo Electron | Must | A suíte falha quando um script novo entra sem ser declarado, e quando o alvo e a versão mínima divergem | 🟢 |
| RF-17 | O preview consome a leitura da feature 001 pela saída compilada e monta a página pela mesma função que o host usa | Must | Nenhuma regra de leitura e nenhuma montagem de página são reescritas no script do preview | 🟢 |
| RF-18 | O README ganha o ritual desta feature: como construir, como ver a tela, como empacotar e como instalar | Must | Um clone novo é levado do zero à extensão instalada seguindo apenas o README | 🟡 |
| RF-19 | A configuração de depuração que abre a janela de desenvolvimento com a extensão carregada a partir da pasta de saída | Should | A configuração existe, aponta para a pasta de saída e roda o build antes de abrir | 🟡 |
| RF-20 | Um modo de observação que reempacota a webview a cada alteração, com mapa de fontes embutido | Should | Alterar um arquivo da webview reempacota sem reiniciar o comando, e o mapa de fontes aparece na saída; recarregar a página é ato do usuário, e o preview não abre canal para o navegador | 🟢 |
| RF-21 | Uma suíte abre o pacote gerado e compara o conteúdo com o esperado, falhando e nomeando cada caminho não previsto | Must | Um arquivo que entre no pacote sem estar previsto faz a suíte falhar com o caminho dele na mensagem | 🟢 |
| RF-22 | O tempo do build completo e os três tamanhos são medidos e registrados contra os tetos | Should | Uma ação de progresso registra as quatro medidas, com o método de medição escrito | 🟡 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Desempenho | O build completo, com dependências instaladas, fica abaixo de 30 s | Hoje leva 1,7 s com os dois passos de herança incluídos; a folga é grande e o teto existe para detectar regressão, não para apertar | 🟢 |
| Desempenho | O bundle da webview fica abaixo de 400 KB | Hoje soma 168.849 bytes, e a folga depende inteiramente da poda de tokens do tema, que derruba 485.898 bytes para 12.466 | 🟢 |
| Desempenho | O VSIX fica abaixo de 2 MB | `_reversa_sdd/sdd/empacotamento-e-verificacao.md#7-requisitos-nao-funcionais`; a pasta de saída inteira ocupa 488 KB hoje | 🟡 |
| Segurança | O preview não escreve arquivo algum e serve apenas em loopback; só o auxiliar do estado degradado escreve, e apenas em pasta temporária do sistema | RN-02 e RN-03, herdadas da restrição de a extensão nunca escrever | 🟡 |
| Portabilidade | Nenhuma instalação global; toda ferramenta entra como dependência de desenvolvimento em igualdade exata | RNF-04 e RNF-05 da spec, e o regime que as features 001 a 004 já seguem | 🟢 |
| Reprodutibilidade | O arquivo de trava é versionado, e o README instrui a instalação limpa por ele | RNF-05 da spec; é o que faz o clone de daqui a um ano instalar as mesmas versões | 🟡 |
| Observabilidade | Toda falha de comando desta feature nomeia a causa e o que fazer, sem pilha de exceção crua | `_reversa_sdd/sdd/empacotamento-e-verificacao.md#8-design-e-interface`, e o princípio de erros barulhentos do mantenedor | 🟡 |
| Manutenibilidade | O script do preview é lido por quem voltar depois de meses sem conhecer o desenho da extensão | O preview é ferramenta do Retomador tanto quanto do Construtor | 🟡 |

## 7. Critérios de Aceitação

```gherkin
Cenário: a tela conferida fora do editor
  Dado um clone com as dependências instaladas e o build rodado
  Quando o preview é apontado para um workspace com Reversa instalado
  Então o navegador mostra o painel com o processo real daquele workspace
  E a faixa do topo nomeia o preview, o workspace lido e o tema em vigor

Cenário: os quatro temas
  Dado o preview servindo
  Quando ele é iniciado com cada um dos quatro temas
  Então o painel repinta em cada um, e a classe escrita no corpo é a que o editor escreveria

Cenário: os estados que nenhum workspace produz
  Dado o preview iniciado com estado de entrada forçado
  Quando o estado pedido é sem diretório, sem Reversa ou erro
  Então a tela correspondente aparece sem leitura de disco
  E a faixa declara que o estado foi forçado

Cenário: o pacote que não leva o que não deve
  Dado o build rodado
  Quando o comando de empacotamento gera o VSIX
  Então o conteúdo listado não inclui as pastas do Reversa, o código-fonte, os testes, a cobertura nem os scripts
  E o tamanho medido aparece ao lado do teto

Cenário: bundle acima do teto
  Dado um bundle que excede o teto declarado
  Quando o build é rodado
  Então ele para com o tamanho medido e o teto na mensagem
  E nenhum VSIX é gerado

Cenário: preview sem bundle
  Dado um clone recém-feito, sem build
  Quando o preview é iniciado
  Então ele recusa iniciar, diz para rodar o build antes e não abre porta

Cenário: empacotador ausente
  Dado que a ferramenta de empacotamento não está instalada
  Quando o comando de empacotamento é rodado
  Então ele termina nomeando o pacote a instalar
  E nenhum arquivo parcial fica em disco

Cenário: porta ocupada
  Dado um preview já servindo na porta padrão
  Quando um segundo preview é iniciado sem argumento de porta
  Então ele para dizendo que a porta está ocupada e sugere o argumento de porta

Cenário: script novo sem declaração
  Dado um comando acrescentado ao manifesto do pacote
  Quando a suíte é rodada sem que a lista de scripts tenha sido atualizada
  Então ela falha nomeando o comando que entrou sem declaração

Cenário: alvo divergente da versão mínima
  Dado o alvo do empacotador apontando para um Chromium diferente do que o Electron da versão mínima embarca
  Quando a suíte é rodada
  Então ela falha nomeando os dois valores divergentes

Cenário: nenhuma regra reescrita no preview
  Dado o script do preview
  Quando ele é auditado
  Então nenhuma regra de leitura do processo e nenhuma montagem de página aparecem declaradas nele
  E o que ele usa vem da saída compilada do host

Cenário: o clone levado à extensão instalada
  Dado um clone recém-feito e o README aberto
  Quando o leitor segue apenas os passos escritos, sem conhecimento prévio do repositório
  Então ele chega à extensão instalada no editor, passando pelo preview antes de empacotar

Cenário: os estados que o tempo esconde
  Dado o preview iniciado com atraso declarado
  Quando o painel diz ao host fingido que está pronto
  Então o estado carregando fica visível pelo tempo pedido antes de o processo chegar
  E o mesmo vale para o estado relendo quando a releitura é acionada

Cenário: o estado degradado
  Dado um workspace copiado para pasta temporária com um arquivo do Reversa truncado
  Quando o preview é apontado para essa cópia
  Então o painel aparece com aviso de degradação e a seção de anomalias expandida
  E nem o repositório nem o workspace de origem foram tocados

Cenário: a extensão instalada sob identidade legível
  Dado o VSIX gerado
  Quando ele é instalado no editor
  Então a extensão aparece sob identificador que nomeia o publicador local
  E nada no manifesto depende de conta no Marketplace

Cenário: arquivo não previsto dentro do pacote
  Dado um pacote gerado depois de uma pasta nova ter surgido no repositório
  Quando a suíte de conteúdo é rodada
  Então ela falha nomeando cada caminho que entrou sem estar previsto

Cenário: os sete estados antes do pacote
  Dado que nem todos os sete estados da tela foram vistos no preview
  Quando o empacotamento é considerado
  Então ele não acontece, porque o portão de saída da feature 003 não foi cumprido

Cenário: desenvolvimento da webview com observação
  Dado o modo de observação e o preview rodando ao mesmo tempo
  Quando um arquivo da webview é alterado
  Então o bundle é reempacotado sem reiniciar o comando, com mapa de fontes na saída

Cenário: as quatro medidas contra os tetos
  Dado o build, o bundle e o VSIX produzidos
  Quando as medidas são tomadas
  Então tempo de build, tamanho do pacote da tela, tamanho do pacote da extensão e método de medição ficam registrados no progresso
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-06 a RF-13, o preview | Must | É o portão de saída devido desde a feature 003, e o risco de maior probabilidade do PRD é o defeito visual que passa por suíte verde |
| RF-01 a RF-05, o empacotamento | Must | Sem VSIX não há extensão instalada, e é o que converte quatro features em produto usável |
| RF-14 e RF-15, o teto do bundle | Must | A folga atual depende de uma poda que falha em silêncio; sem guarda, a regressão aparece no editor do usuário |
| RF-16 e RF-17, as guardas de coerência | Must | Custam pouco e prendem duas divergências que só apareceriam em execução: script não declarado e alvo divergente da versão mínima |
| RF-18, o ritual no README | Must | O Retomador é persona do produto e desta feature; ritual não escrito é ritual perdido |
| RF-19, a configuração de depuração | Should | Facilita a verificação dentro do editor, que segue pendente desde a feature 002, mas não a bloqueia |
| RF-22, as medições | Should | Confirma os quatro tetos com número, e fecha a medida que a feature 004 deixou por tomar |
| RF-21, a conferência automática do pacote | Must | Decidido na sessão de esclarecimentos: a listagem impressa é a primeira camada, e a suíte é a que impede o vazamento de documento interno |
| RF-20, o modo de observação | Should | Encurta o ciclo de quem mexe na tela, e custa pouco por reusar o empacotador já configurado; o recarregamento automático ficou de fora |
| RNF de desempenho | Should | Os três tetos têm folga larga hoje, e servem para detectar regressão, não para apertar o desenho |

## 9. Esclarecimentos

### Sessão 2026-09-09

- **Q:** O conteúdo do VSIX deve ser conferido automaticamente contra o esperado, falhando o
  empacotamento quando pasta indevida entrar, ou basta a listagem impressa e a conferência humana?
  **R:** Conferência automática, com lista do que é esperado e falha que nomeia o intruso. A decisão
  foi tomada diante da medida: sem lista de conteúdo, o empacotador leva 787 arquivos, incluindo as
  pastas de agentes, o ciclo forward, a cobertura e o arquivo de origens da herança, que guarda
  caminhos da máquina. A listagem impressa continua sendo a primeira camada, e a suíte é a que
  impede que documento interno saia dentro da extensão. Fecha OQ-01 da spec, e RF-21 passa a Must.

- **Q:** Quem executa a verificação visual dos sete estados, e o que conta como prova, dado que o
  ambiente dos agentes não tem interface gráfica?
  **R:** O mantenedor, em sessão própria com navegador. Esta feature entrega o preview e a lista dos
  sete estados com o comando exato de cada um, e o portão de saída da feature 003 permanece
  declarado como devido até essa sessão ocorrer. A captura automática por navegador sem interface
  foi recusada por custo de longevidade: seria dependência nova de porte grande, a manter num
  projeto de atenção intermitente.

- **Q:** Como o preview alcança os quatro estados que dependem de leitura?
  **R:** Instalado e íntegro pelo workspace real apontado no argumento; carregando e relendo por um
  atraso declarado que o host fingido observa antes de responder; instalado e degradado por uma
  cópia estragada montada em pasta temporária, com um arquivo do Reversa truncado. Dados sintéticos
  foram recusados, porque conferir a tela contra um processo que ninguém produziu verifica o
  preview, e não o painel. Entram RF-09a e RF-09b.

- **Q:** O manifesto precisa de publicador para gerar VSIX local, e o que fazer com a marca de
  pacote privado?
  **R:** A pergunta partia de premissa errada, desfeita por teste: o empacotador gera o pacote com a
  marca de privado e sem publicador nenhum. A escolha é de identidade, e não de obrigação técnica.
  Fica declarado um publicador local, para que a extensão instalada apareça sob identificador
  legível em vez de anônimo, mantendo a marca de privado. Licença, repositório e ícone de loja ficam
  para quando publicar deixar de ser não-objetivo.

- **Q:** O modo de observação e o recarregamento automático do navegador entram nesta feature?
  **R:** Observação sim, recarregamento não. O modo de observação reusa o empacotador já
  configurado e encurta o ciclo de quem mexe na tela; o recarregamento automático exigiria um canal
  do preview para o navegador, e o ganho sobre recarregar a página à mão não paga o código de
  servidor a manter. Fecha OQ-02 da spec, e RF-20 sobe de Could para Should.

## 10. Lacunas

> Nenhuma lacuna aberta. As três dúvidas iniciais foram resolvidas na sessão de 2026-09-09, e as
> duas questões abertas da spec do componente, OQ-01 e OQ-02, foram fechadas com elas. OQ-03, o
> corte de tokens de tema, já havia sido resolvida pela feature 003, que o implementou por fecho
> transitivo sobre as declarações da folha.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-09-09 | Cinco dúvidas resolvidas por `/reversa-clarify`: conferência automática do pacote, execução do portão visual, alcance dos quatro estados de leitura, identidade no manifesto e escopo do modo de observação | reversa |
