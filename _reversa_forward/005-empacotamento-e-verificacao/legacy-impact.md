# Legacy impact: empacotamento e verificação

> Identificador: `005-empacotamento-e-verificacao`
> Data: `2026-09-09`
> Âncora: **greenfield**. Não há extração de legado neste projeto: `_reversa_sdd/`
> traz `prd.md` e as cinco specs SDD do `/reversa-new`, e é contra elas que o
> impacto é medido.
> Política de edição no momento da execução: `allowLegacyEdits: true`,
> `allowedPaths: []`, isto é, liberação irrestrita do projeto inteiro.

## 1. Nota sobre a classificação

Feature greenfield, sem legado pré-existente extraído. O que existe, porém, não é
folha em branco: quatro features já foram entregues neste repositório, e sete dos
arquivos tocados aqui são delas. Classificá-los todos como `componente-novo`
esconderia justamente o que interessa a quem reler isto depois, de modo que a
tabela usa o tipo que descreve o que de fato aconteceu com cada arquivo. As
seções "Preservadas" e "Modificadas" seguem vazias de regras 🟢, porque nenhuma
regra foi extraída de código existente: elas ganham conteúdo quando uma futura
`/reversa` rodar sobre este código.

## 2. Arquivos afetados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `scripts/limites.js` | Limites do projeto (`sdd/empacotamento-e-verificacao.md#7`) | componente-novo | MEDIUM | Passa a ser a única fonte do teto do pacote da tela, do teto do pacote da extensão, da versão mínima do editor e do alvo do navegador |
| `scripts/conteudo-esperado.js` | Empacotamento em VSIX (`#6`, RF-04) | componente-novo | LOW | Lista literal do que pode estar dentro do pacote, lida pela suíte de conteúdo |
| `scripts/vsix.js` | Empacotamento em VSIX (`#6`, RF-04) | componente-novo | LOW | Leitor do índice do pacote, sem dependência e sem descompactar |
| `scripts/empacotar.js` | Empacotamento em VSIX (`#6`, RF-04) | componente-novo | HIGH | Casca sobre o empacotador oficial; é o que converte quatro features em produto instalável |
| `scripts/preview.js` | Preview fora do editor (`#8`) | componente-novo | HIGH | Casca de linha de comando do portão de saída devido desde a feature 003 |
| `scripts/preview/config.js` | Preview fora do editor (`#9`) | componente-novo | MEDIUM | Tradução e validação dos argumentos, com as duas recusas anteriores à abertura de porta |
| `scripts/preview/pagina.js` | Preview fora do editor (`#8`) | componente-novo | HIGH | Monta a página pelo documento e pelo corpo do host, com a faixa e a classe de tema |
| `scripts/preview/leitura.js` | Preview fora do editor (`#8`) | componente-novo | MEDIUM | Responde a leitura pela sequência do host, com estado forçado e atraso |
| `scripts/preview/servidor.js` | Canal do preview (`interfaces/canal-do-preview.md`) | delta-de-contrato-externo | HIGH | Cinco rotas em HTTP local; contrato novo, que não toca o do canal do painel |
| `scripts/preview/cliente.js` | Preview fora do editor (`#8`) | componente-novo | MEDIUM | Host fingido no navegador; vive fora do pacote da webview, que segue intacto |
| `scripts/estragar-workspace.js` | Preview fora do editor (`#6`, RF-09b) | componente-novo | LOW | Único escritor da feature, e escreve apenas em pasta temporária do sistema |
| `.vscodeignore` | Empacotamento em VSIX (`#7`, RN-07) | componente-novo | HIGH | Declara o conteúdo do pacote por exclusão universal e reinclusão explícita |
| `.vscode/launch.json`, `.vscode/tasks.json` | Depuração (`#6`, RF-19) | componente-novo | LOW | Janela de desenvolvimento com a construção como pré-tarefa |
| `src/host/session.ts` | Host da extensão (`sdd/ponte-e-host.md#6`) | componente-novo | HIGH | Extração: a sequência de mensagens sai do provedor e passa a ter dois consumidores |
| `src/host/provider.ts` | Host da extensão (`sdd/ponte-e-host.md#6`) | regra-alterada | HIGH | A releitura delega a ordem das mensagens; envio, visibilidade e abertura seguem aqui |
| `src/host/document.ts` | Host da extensão (`sdd/ponte-e-host.md#6`) | regra-alterada | MEDIUM | Dois campos opcionais: origem de conexão e classe do corpo; a política do provedor não muda |
| `scripts/build-webview.js` | Empacotamento da webview (`addenda/003-painel-do-processo.md`) | regra-alterada | HIGH | Lê o alvo do módulo, ganha a guarda de tamanho ao fim e o modo de observação |
| `package.json` | Manifesto do pacote (`addenda/004-heranca-e-sincronia.md`) | regra-alterada | MEDIUM | Publicador local, empacotador em igualdade exata e quatro comandos novos |
| `README.md` | Documentação (`004-heranca-e-sincronia/roadmap.md`, D-12) | regra-alterada | LOW | Três seções novas: percurso do clone à instalação, sete estados e portão visual |
| `tests/host-manifest.spec.ts` | Suíte do manifesto | regra-alterada | MEDIUM | Passa de dez para catorze comandos; o bloco do que "não entra" virou o do que "tem de estar" |
| `tests/webview-build.spec.ts` | Suíte da construção | regra-alterada | MEDIUM | Confere a guarda de tamanho e o alvo lido do módulo, em vez do literal |
| `tests/host-session.spec.ts`, `tests/limites.spec.ts`, `tests/vsix-leitor.spec.ts`, `tests/vsix-conteudo.spec.ts`, `tests/preview-config.spec.ts`, `tests/preview-servidor.spec.ts` | Suítes novas | componente-novo | MEDIUM | Seis suítes, 63 testes, escritas antes do código que cobrem |

## 3. Diff conceitual por componente

**Host da extensão.** A mudança que mais merece atenção é uma extração, não um
acréscimo. A regra de qual mensagem sai em que ordem, que existia dentro do
provedor e só era exercível com o editor por perto, virou função pura em
`src/host/session.ts`. O provedor continua dono do que depende do editor: o
envio pela ponte, a visibilidade da visão e a abertura de arquivo. A prova de
que a extração não mexeu em comportamento é que as suítes do provedor e das
fronteiras passaram antes e depois sem uma linha alterada. O documento ganhou
dois campos opcionais, e opcional é a palavra: ausentes, produzem exatamente a
política de hoje, o que a suíte do documento continua garantindo.

**Empacotamento da webview.** Ele deixou de guardar o alvo do navegador como
literal e passou a lê-lo do módulo de limites, e ganhou ao final uma guarda que
soma os dois arquivos emitidos e interrompe o processo quando o teto é
excedido. Verificado nesta máquina: baixado o teto para 100000 bytes, o build
termina com código 1 e a medida na mensagem; restaurado, volta a terminar com
zero. O modo de observação entrou como opção do mesmo script, com mapa de fontes
e sem podar, para que não exista um segundo lugar onde a tela é empacotada.

**Empacotamento em VSIX.** É componente inteiramente novo, e a decisão que o
sustenta é a falha segura do conteúdo: o `.vscodeignore` exclui tudo e reinclui
quatro coisas, de modo que pasta nova nasce fora do pacote. Medido: 69 caminhos
no pacote gerado, todos previstos, 133194 bytes contra um teto de 2097152. A
única surpresa foi o README, que o empacotador grava em minúsculas; a lista
prevista foi corrigida para descrever o pacote, e não o repositório.

**Preview.** É o maior componente da feature, e o mais delicado, porque ele é um
segundo lugar onde a tela é montada. O que evita a divergência é que ele não
monta quase nada: documento, corpo e sequência de mensagens vêm da saída
compilada do host. O que é dele são o servidor de cinco rotas, o host fingido no
navegador e a faixa que declara as três diferenças. A divergência de política
tem uma diretiva de largura, a de conexão, e está escrita na faixa.

**Contrato do canal do painel.** Intacto. Nenhum comando, campo ou ordem entrou,
saiu ou mudou de nome. O preview cumpre o contrato do lado do host, que é
exatamente o que ele foi feito para fazer.

## 4. Preservadas

Vazia, e por âncora, não por descuido: não há regras 🟢 extraídas de código
existente neste projeto, porque nunca houve extração. As garantias que esta
feature preservou estão registradas como suítes, não como regras de domínio.

## 5. Modificadas

Vazia, pela mesma razão. A mudança de comportamento mais próxima de uma regra
alterada é a extração da sequência de mensagens, que está na tabela acima como
`regra-alterada` sobre `src/host/provider.ts` e vigiada em
`regression-watch.md`.
