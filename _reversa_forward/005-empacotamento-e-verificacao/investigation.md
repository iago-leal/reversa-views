# Investigation: empacotamento e verificação

> Identificador: `005-empacotamento-e-verificacao`
> Data: `2026-09-09`
> Roadmap: `_reversa_forward/005-empacotamento-e-verificacao/roadmap.md`

## 1. O que foi verificado nesta máquina, e não presumido

Três perguntas do plano dependiam de comportamento de ferramenta, e ferramenta muda. Foram
respondidas por execução, num diretório temporário fora do repositório, com um manifesto mínimo
montado para o teste. Nada do repositório foi alterado por esses ensaios.

| Pergunta | Resposta observada | Consequência no plano |
|---|---|---|
| O empacotador exige publicador declarado? | Não. A versão 3.9.2 gerou o pacote sem publicador algum | D-15 deixa de ser obrigação técnica e passa a ser escolha de identidade |
| Ele recusa manifesto marcado como privado? | Não. Gerou o pacote com a marca de privado presente | A marca fica como está, e o não-objetivo de publicação segue registrado no manifesto |
| O que ele exige, então? | Um `README.md` presente, `activationEvents` declarado quando há ponto de entrada, e ou dependências resolvíveis ou a resolução dispensada | O comando desta feature dispensa a resolução, porque o projeto não tem dependência de produção |
| O que entra no pacote hoje, sem lista de conteúdo? | 787 arquivos, dos quais 486 das pastas de agentes, 41 do ciclo forward, 37 de testes, 24 da configuração do Reversa e 17 de cobertura | D-12 escolhe reinclusão explícita, e RF-21 vira obrigatório |
| O empacotador lê o arquivo de ignorados do git? | Não. `heranca.origens.yml`, que está ignorado e guarda caminhos desta máquina, aparece na listagem | A defesa não pode se apoiar no que o git já ignora |
| Quanto pesa o empacotador instalado? | 135 MB em dependências de desenvolvimento | Registrado como risco no roadmap; nada disso entra no pacote entregue |

## 2. A origem do kit, consultada de novo

`~/dev/vscode-kanban` é a segunda origem de herança declarada em `src/heranca/PROCEDENCIA.md`, e
dela vêm padrão e decisão, nunca arquivo. Três leituras informaram este plano.

**O preview da origem tem a forma que este plano adota.** Ele é `scripts/preview.js`, casca de
argumentos sobre `scripts/preview/`, dividido em o que a página é, como ela chega ao navegador e
como o comando falha. O cabeçalho dele registra por escrito os três defeitos que o justificaram, e
registra também que o que se verifica ali vale como evidência de teste e nunca como conclusão. Este
plano herda a divisão, acrescenta o host fingido como módulo próprio e traduz os nomes para
português, seguindo a convenção que a feature 004 fixou para `scripts/`.

**O host fingido da origem é definido antes do pacote carregar.** É a única forma que funciona: a
interface do painel chama a função do editor durante a montagem, e ela precisa existir antes disso.
Aqui a mesma ordem se aplica, com uma diferença de fidelidade: como o documento é servido sob a
política do editor, o script do host fingido carrega com o mesmo nonce que o pacote, em vez de
carregar solto.

**A lista de conteúdo da origem é por exclusão, e ela envelheceu mal.** O arquivo traz um comentário
que registra o defeito: até a versão 1.34.5 a extensão distribuía a pasta de specs inteira para
dentro do editor de quem instalasse, e a correção foi acrescentar as pastas à lista. Uma lista que
cresce a cada pasta nova é uma lista que um dia estará atrasada. Daí a inversão adotada aqui.

## 3. Alternativas avaliadas para o empacotamento

| Caminho | A favor | Contra | Veredito |
|---|---|---|---|
| Ferramenta oficial de extensões | Mantida por quem define o formato; conhece as exigências do editor; falha com mensagem nomeada | 135 MB de dependência de desenvolvimento | Adotado |
| Escrever o formato à mão | Zero dependência; o formato é um arquivo compactado com dois descritores | Passa a ser peça própria a manter, num projeto que se retoma a cada meses, e que envelhece quando o editor mudar exigência | Descartado |
| Empacotador de terceiro | Menor que o oficial | Camada a mais entre o projeto e o formato, e uma dependência a mais para envelhecer | Descartado |

Para a conferência do conteúdo, a escolha foi entre perguntar à ferramenta o que ela empacotaria e
abrir o pacote produzido. O primeiro caminho é mais barato e confere a intenção; o segundo confere o
fato. Como o defeito que se quer evitar é justamente material interno chegando ao editor de alguém,
o plano abre o pacote. O índice do formato compactado guarda nome e tamanho de cada entrada em
estrutura fixa, lida com poucas dezenas de linhas e sem descompactar conteúdo algum, de modo que a
suíte não precisa de dependência nem de binário do sistema.

## 4. Alternativas avaliadas para o preview

**Como os dados chegam à tela.** Três caminhos foram considerados. Embutir o processo na própria
página é o mais simples, mas torna falsa a releitura, porque o painel passaria a receber de volta o
que já tinha. Abrir conexão persistente entre servidor e navegador resolveria também o
recarregamento automático, que a sessão de esclarecimentos descartou, e traria código de servidor
que ninguém pediu. Buscar o processo por requisição a cada pronto e a cada releitura é o que
preserva a releitura como leitura de disco de verdade, e é o adotado.

**O preço dessa escolha, e por que ele é aceitável.** A política de segurança que o editor aplica
proíbe conexão, e proíbe com razão, porque a webview instalada não fala com ninguém. O preview
precisa de uma diretiva diferente, e uma só: a origem de conexão passa a ser a própria página. Todas
as demais continuam idênticas, incluindo a que só aceita script com o nonce da sessão. A alternativa
de servir o preview sem política nenhuma foi descartada logo: ela deixaria passar exatamente a
classe de defeito que a política existe para causar cedo.

**Como os sete estados são alcançados.** Três não têm processo e saem por argumento, respondidos
pela rota de leitura sem tocar o disco. Dois dependem do tempo, e saem do atraso declarado que o
servidor observa antes de responder. Um é o workspace real apontado. O último, o degradado, precisa
de uma leitura que encontre anomalia, e por isso existe o auxiliar que copia um workspace para pasta
temporária e trunca um arquivo do Reversa. Construir processos falsos para os estados que têm
processo foi descartado, porque conferir a tela contra um processo que ninguém produziu verifica o
preview e não o painel.

## 5. A extração da sequência de mensagens

O provedor de `src/host/provider.ts` faz hoje quatro coisas: resolve a visão e serve o documento,
cria a ponte, roteia o que chega e monta a sequência de mensagens da leitura. As três primeiras
dependem do editor; a quarta não depende de nada além das raízes do workspace, do leitor e da
constante da revisão herdada. O preview precisa exatamente da quarta.

Duplicá-la custaria pouco hoje e caro depois: seriam dois lugares decidindo em que ordem sair
carregando, sem diretório, erro e processo, e a divergência entre eles apareceria como preview que
mostra o que o editor não mostra. A extração é pequena, é para função pura, e a suíte que a cobre
pode exercer os quatro caminhos sem editor algum, o que hoje só se consegue com dublê de visão.

O risco é mexer em código estável desde a feature 002. A mitigação é a ordem: a suíte da sessão
nasce antes da extração, e as suítes do provedor rodam antes e depois sem alteração. Se elas
precisarem mudar, a extração mudou comportamento e está errada.

## 6. Fontes

- `_reversa_sdd/sdd/empacotamento-e-verificacao.md`, seções 6 a 15
- `_reversa_sdd/sdd/painel-do-processo.md`, seções 8 e 13, para os sete estados e o portão de saída
- `_reversa_sdd/prd.md`, seções 5, 6, 7 e 8
- `_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md`, para o contrato do canal
- `src/host/document.ts`, `src/host/panel.ts`, `src/host/provider.ts`, `src/host/reading.ts`
- `src/webview/bridge/messaging.ts` e `src/webview/theme/contrast.ts`, para as duas superfícies que o
  host fingido precisa satisfazer
- `scripts/build-webview.js` e `scripts/theme-tokens.js`, para o empacotamento e o teto
- `~/dev/vscode-kanban`: `scripts/preview.js`, `scripts/preview/`, `.vscodeignore`
- Ensaios com o empacotador oficial 3.9.2, rodados nesta máquina em 2026-09-09
