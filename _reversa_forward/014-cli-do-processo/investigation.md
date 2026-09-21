# Investigação: painel do processo na linha de comando

> Identificador: `014-cli-do-processo`
> Data: `2026-09-20`

## 1. O que já existia, e que poupa a maior parte do trabalho

A pergunta que abre a investigação é quanto desta feature já está escrito. A resposta é: quase toda
a parte difícil.

| Peça | Onde vive | O que ela resolve aqui |
|------|-----------|------------------------|
| Leitura completa do processo | `src/host/reading.ts`, sobre `src/heranca/` e `src/domain/` | Entrega o processo tipado a partir de uma raiz, sem nunca lançar |
| Escolha da raiz e ordem das mensagens | `src/host/session.ts`, `src/host/root.ts` | Decide qual raiz observar e em que ordem os estados chegam |
| Máquina dos estados de entrada | `src/webview/domain/entry.ts` | Decide o que sobrevive a uma releitura e o que é substituído |
| Vocabulário legível | `src/webview/domain/labels.ts`, 629 linhas | Todo rótulo de fase, estágio, situação, marca e desfecho de consulta |
| Razões de bloqueio humano | `src/webview/domain/blocking.ts` | O que aguarda decisão de gente, com razão nomeada e comando sugerido |
| Recortes e ordenações de cada seção | `anomalies-view.ts`, `bugs-view.ts`, `decomposition-view.ts`, `panorama-view.ts`, `origin-view.ts`, `sections.ts` | O que cada cartão mostra, em que ordem e com que corte |
| Instantes em português | `src/webview/domain/instants.ts` | Data e hora legíveis, com fuso fixo |
| Conferência de atualização | `src/host/net.ts`, `src/host/update.ts`, porta em `ports.ts` | A única conexão do produto, com sete desfechos nomeados |
| Precedente de consumidor fora do editor | `scripts/preview.js` e `scripts/preview/` | Prova que chamar o host de um processo Node puro funciona |

A verificação que importava era se a pasta `src/webview/domain/` é de fato pura. É: nenhum dos
quinze módulos importa componente, biblioteca de interface, objeto de documento ou a interface da
webview. Todos os imports são de tipo, do protocolo do host, do domínio local ou da herança. Nada
impede um programa de terminal de usá-los.

## 2. Alternativas avaliadas

### 2.1 Como obter o processo

| Alternativa | Avaliação |
|---|---|
| Consumir `sessionMessages`, como o preview | **Escolhida.** A ordem das mensagens e a escolha da raiz ficam num lugar só, e os estados degradados vêm de graça |
| Chamar `readWorkspace` direto e montar a carga | Descartada. Duplicaria a escolha de raiz e a nomeação do estado de entrada, que são regra e não formalidade |
| Servir o processo por um servidor local, como o preview faz para o navegador | Descartada. Aqui não há navegador a alimentar, e um servidor seria uma peça a mais entre dois módulos do mesmo processo |

### 2.2 Onde a ferramenta compila

| Alternativa | Avaliação |
|---|---|
| Unidade própria, saída fora de `out/` | **Escolhida.** `out/` inteiro entra no pacote por `!out/**`, e a ferramenta não deve estar nele |
| Compilar junto ao host e excluir no `.vscodeignore` | Descartada. Emendaria a doutrina de exclusão universal que a feature 005 fixou, e deixaria em `out/` código que o editor nunca executa |
| Escrever em JavaScript puro sob `scripts/`, como o preview | Descartada, embora tentadora pelo precedente. A ferramenta precisa das funções tipadas da apresentação, que hoje não existem compiladas fora do pacote da tela; em JavaScript puro elas viriam sem tipo, e o quadro é onde um erro de tipo se manifesta como tela errada |

### 2.3 Como desenhar

| Alternativa | Avaliação |
|---|---|
| Quadro puro devolvendo linhas com ênfase abstrata, e escape aplicado na borda | **Escolhida.** É o único desenho que uma suíte confere inteiro sem terminal |
| Escrever escape direto no desenho | Descartada. Toda conferência viraria visual, e a feature já traz dívida visual suficiente |
| Reaproveitar os componentes da tela por um renderizador de terminal | Descartada pelo usuário na sessão de esclarecimento, e pela dependência que arrastaria |

### 2.4 Biblioteca de interface de terminal

Descartada por decisão explícita do usuário, e coerente com a doutrina declarada em
`scripts/preview.js`: dependência é dívida futura em projeto de atenção intermitente. O que isso
implica escrever à mão está na seção 3.

### 2.5 Como saber que o disco mudou

| Alternativa | Avaliação |
|---|---|
| Assinatura de mudança do sistema de arquivos, com agrupamento por janela | **Escolhida**, com degradação declarada quando não instalar |
| Consulta periódica ao estado das pastas | Reserva. É para onde a degradação cai, e é previsível em qualquer sistema |
| Só releitura manual | Descartada pelo usuário, que pediu a observação |

A assinatura de mudança é a parte menos previsível da feature. O comportamento varia entre
sistemas, a observação recursiva nem sempre está disponível, e há sistemas de arquivos de rede em
que ela simplesmente não chega. Daí a degradação ser requisito e não zelo.

### 2.6 Abrir o artefato

| Alternativa | Avaliação |
|---|---|
| Editor declarado no ambiente, com suspensão da interface | **Escolhida** pelo usuário |
| Leitor interno da própria interface | Descartada. Seria interpretar Markdown dentro da ferramenta, que o painel recusa fazer no NG-02 da sua spec |
| Copiar o caminho | Descartada como ação principal; segue disponível como efeito de outra tecla se o contrato de teclado quiser |

## 3. O que precisa ser escrito à mão, e o que se sabe sobre cada parte

Tudo abaixo sai do interpretador, sem dependência.

- **Modo bruto do teclado.** Sem ele, a entrada só chega ao programa quando o usuário aperta enter,
  e não há navegação. Ligá-lo é responsabilidade de quem o desliga depois.
- **Tela alternativa.** É o que faz a ferramenta abrir sem apagar o que estava no terminal e
  devolver a tela como estava ao sair. É a diferença entre uma ferramenta que respeita o histórico
  da sessão e uma que o atropela.
- **Cursor escondido e reposto.** Cursor piscando no meio de um quadro redesenhado é ruído.
- **Sequências de teclas.** Setas e teclas de função chegam como vários bytes, e o agrupamento
  depende do terminal. O reconhecimento é tabela, e tabela se testa: a máquina de navegação recebe
  a tecla já reconhecida, de modo que o reconhecimento é ele próprio função pura e conferível.
- **Redimensionamento.** O sistema avisa quando a janela muda de tamanho, e o quadro é recalculado
  com as novas dimensões. Como o quadro é puro, isso é uma chamada, não um caso especial.
- **Restauração em três portas.** Saída normal, falha não prevista e interrupção pelo usuário. As
  três convergem para a mesma função, e é ela que a conferência humana exercita.

## 4. Padrões aplicados, todos vindos deste repositório

- **Fronteira verificável por leitura dos fontes.** `tests/host-boundaries.spec.ts` e
  `tests/webview-boundaries.spec.ts` provam propriedades lendo o código, e não executando-o. A
  suíte nova faz o mesmo com as três capacidades de borda.
- **Efeito nomeado em vez de chamada direta.** `src/host/router.ts` é a fronteira de confiança do
  host: valida, nomeia e só então age. A navegação segue o mesmo corte.
- **Paridade entre duas implementações do mesmo texto.** `tests/prompt-paridade.spec.ts` e
  `tests/elisao-paridade.spec.ts` já prendem duplicações declaradas. Aqui não há duplicação de
  regra, mas há duas superfícies, e a paridade vigia a distância entre elas.
- **Auxiliar que adoece o workspace.** `scripts/estragar-workspace.js` e seus três irmãos produzem
  os estados que nenhum projeto saudável produz. A conferência humana desta feature os usa em vez
  de pedir fé.
- **Casca fina em `scripts/`, lógica em módulo.** `scripts/preview.js` declara a razão: um servidor
  de cinco rotas não justifica dependência, e cada dependência é dívida futura.

## 5. Fontes externas

Nenhuma consulta externa foi necessária. Tudo o que a feature precisa saber está no próprio
repositório, nas specs de `_reversa_sdd/` e nos adendos vigentes. As sequências de controle de
terminal usadas são as clássicas e estão documentadas no contrato de linha de comando, com o
comportamento esperado descrito em vez de citado.
