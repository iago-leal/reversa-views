# Data delta: painel do processo na linha de comando

> Identificador: `014-cli-do-processo`
> Data: `2026-09-20`

## 1. Veredito

**Nenhuma mudança no modelo de dados lido, e nenhuma persistência nova.**

A feature não acrescenta, remove nem renomeia campo algum da carga que o host envia. Ela não grava
arquivo, não mantém banco, não guarda preferência entre execuções e não migra coisa alguma. O que
nasce são três estruturas efêmeras, descritas abaixo para que a decomposição em ações saiba o que
declarar, e nada delas atravessa o fim do processo.

Isso decorre de duas regras do requirements: a RN-02, que proíbe escrever, e a RN-05, segundo a
qual nenhum estado sobrevive entre execuções.

## 2. O que a ferramenta consome, sem alterar

| Estrutura | Origem | Uso |
|-----------|--------|-----|
| `HostMessage`, com `setEntry` e `setProcess` | `src/host/protocol.ts` | Chega por `sessionMessages`, exatamente como chega à tela |
| `SetProcessData` | `src/host/protocol.ts` | A carga inteira de uma leitura, com processo, sonda, decomposição, histórico, bugs, greenfield e estado da descoberta |
| `EffectiveEntry` | `src/webview/domain/types.ts` | O estado corrente da entrada, produzido por `nextEntry` |
| `UpdateStatus` | `src/host/protocol.ts` | O desfecho da conferência de atualização, com os sete valores já nomeados |

Campos novos: nenhum. Campos removidos: nenhum. Campos com significado alterado: nenhum.

## 3. Estruturas efêmeras novas

### 3.1 Estado de navegação

Vive em memória enquanto a interface está aberta, e é o único estado que a máquina de navegação
recebe e devolve.

```
EstadoDeNavegacao {
  secaoSelecionada: nome de seção          // uma das onze, na ordem fixa do painel
  itemSelecionado: inteiro ou nulo         // índice dentro da seção, nulo quando a seção não tem itens navegáveis
  secoesFechadas: conjunto de nomes        // começa no padrão que `effectiveCollapsed` já decide
  ajudaVisivel: booleano
  primeiraLinhaVisivel: inteiro            // o deslocamento vertical, para janela menor que o quadro
}
```

Três observações de desenho, todas com consequência na suíte:

1. O conjunto de seções fechadas **nasce** do que `effectiveCollapsed` decide para a tela, de modo
   que a primeira impressão no terminal coincide com a primeira impressão no painel.
2. O item selecionado é índice, e não referência ao objeto: uma releitura troca a carga inteira, e
   guardar referência produziria seleção apontando para um objeto que não existe mais.
3. Nada aqui é escrito em disco. Fechar a ferramenta e reabri-la devolve o padrão, e isso é a RN-05
   em vez de uma limitação.

### 3.2 Quadro

O produto da função pura de desenho, e o que a borda escreve no terminal.

```
Quadro {
  linhas: lista de LinhaDoQuadro
  alturaTotal: inteiro                     // para o deslocamento vertical saber o limite
}

LinhaDoQuadro {
  texto: texto já recortado à largura
  enfase: 'normal' | 'titulo' | 'selecionada' | 'atenuada' | 'alerta'
  artefato: caminho relativo ou nulo       // o que a confirmação abriria sobre esta linha
}
```

A ênfase é **abstrata**: nenhuma sequência de escape nasce aqui, e é isso que permite conferir o
quadro inteiro por comparação de texto. A tradução de ênfase em cor, negrito ou inversão pertence
ao módulo de terminal, e some quando a saída não é terminal ou quando a cor está desligada.

O campo `artefato` é o que liga o desenho à ação sem que o desenho aja: a máquina de navegação lê
o caminho da linha selecionada e emite o efeito, e quem cria o processo é o módulo do editor.

### 3.3 Resultado da observação

```
Observacao {
  ativa: booleano                          // falso quando a assinatura não instalou
  razaoDaDegradacao: texto ou nulo         // o que dizer na tela quando caiu para intervalo
  ultimaMudanca: instante ou nulo          // quando a última releitura automática ocorreu
}
```

A `razaoDaDegradacao` existe porque a RN-09 proíbe a tela de mudar sem dizer, e a degradação da
observação é um caso particular disso: uma interface que promete observar e caiu para intervalo
deve declarar o que está fazendo.

## 4. Migrações

Nenhuma. Não há esquema, arquivo de estado nem formato lido que mude. Uma instalação anterior desta
extensão continua funcionando sem qualquer ação, porque nada do que ela lê ou escreve é tocado.

## 5. Compatibilidade com o que já foi entregue

| Verificação | Resultado esperado |
|-------------|--------------------|
| Carga do `setProcess` | Idêntica, campo a campo e na mesma ordem; a suíte do protocolo continua valendo sem alteração |
| Pacote instalável | Idêntico, conferido pela suíte que abre o pacote gerado |
| Funções de `src/webview/domain/` | Comportamento intocado; ganham um segundo consumidor e uma declaração de estatuto no cabeçalho |
| Preview e auxiliar de prompt | Intocados; a ferramenta nova é a quarta do terreno e não disputa nada com eles |
