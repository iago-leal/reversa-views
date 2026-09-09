# Data delta: empacotamento e verificação

> Identificador: `005-empacotamento-e-verificacao`
> Data: `2026-09-09`
> Roadmap: `_reversa_forward/005-empacotamento-e-verificacao/roadmap.md`

## 1. Resumo

Nenhuma estrutura persistida nasce, muda ou desaparece nesta feature. O que ela acrescenta são
quatro formas que vivem em memória ou em arquivo de configuração do repositório, e um campo opcional
num tipo já existente do host. O contrato do canal entre host e painel, que a feature 002 fixou e a
004 estendeu por acréscimo, permanece intacto: nenhum comando, campo ou ordem entra, sai ou muda de
nome.

## 2. Formas novas

### 2.1 Configuração do preview, lida da linha de comando

Vive apenas enquanto o comando roda, e é a tradução dos argumentos que a spec do componente descreve
na seção 9. Um argumento desconhecido interrompe o comando, em vez de ser ignorado em silêncio.

```
ConfiguracaoDoPreview {
  workspace: caminho absoluto, por padrão o repositório onde o comando roda
  tema: claro | escuro | claro-alto-contraste | escuro-alto-contraste, por padrão escuro
  estado: nenhum | sem-diretorio | sem-reversa | erro, por padrão nenhum
  porta: número, por padrão uma porta fixa declarada no módulo
  atraso: milissegundos antes de responder a leitura, por padrão zero
  semBuild: booleano, por padrão falso
}
```

Duas regras de validação valem antes de qualquer porta ser aberta: o workspace precisa existir como
diretório, e o pacote da webview precisa estar construído, a menos que o argumento de dispensa tenha
sido passado. As duas falhas dizem o que fazer, conforme o requisito de erro barulhento.

### 2.2 Limites do projeto, em módulo versionado

Passa a ser a única fonte dos quatro números que hoje vivem espalhados entre prosa, literal de
script e literal de suíte.

```
Limites {
  tetoDoPacoteDaTela: bytes, hoje 409600
  tetoDoPacoteDaExtensao: bytes, hoje 2097152
  versaoMinimaDoEditor: texto, hoje 1.78
  alvoDoNavegador: texto, hoje chrome108
}
```

O par entre a versão mínima do editor e o alvo do navegador é o que RN-01 exige: o Electron que
aquela versão embarca traz aquele Chromium, e sintaxe mais nova quebra apenas na máquina de quem
instalou. A suíte confere que o manifesto declara a mesma versão mínima que o módulo, e que o
empacotamento da webview usa o mesmo alvo.

### 2.3 Conteúdo esperado do pacote

Lista literal, escrita uma vez e lida pela suíte que abre o pacote gerado. Não descreve o que fica de
fora, e sim o que pode estar dentro:

```
ConteudoEsperado {
  prefixos: extension/out/, extension/media/
  arquivos: extension/package.json, extension/README.md, extension.vsixmanifest, [Content_Types].xml
}
```

Caminho no pacote que não case com nenhum prefixo nem com nenhum arquivo faz a suíte falhar,
nomeando-o. É a forma executável de RN-07.

### 2.4 Entrada do índice do pacote, lida pelo leitor mínimo

Estrutura de leitura, não de escrita. O leitor percorre o índice do arquivo compactado e devolve
apenas o que a conferência precisa, sem descompactar conteúdo:

```
EntradaDoPacote {
  caminho: texto, tal como gravado no índice
  tamanhoComprimido: bytes
  tamanhoOriginal: bytes
}
```

## 3. Campo novo em tipo existente

| Tipo | Arquivo | Campo | Regime |
|---|---|---|---|
| `DocumentOptions` | `src/host/document.ts` | origem de conexão, opcional | Ausente significa proibir conexão, que é o comportamento de hoje e o que o host continua pedindo. O preview é o único chamador que o informa, e informa a própria origem |

O acréscimo é por opcionalidade, e não por mudança de assinatura: o provedor não passa o campo e a
política que ele produz continua idêntica byte a byte, o que a suíte do documento já garante e
continuará garantindo.

## 4. Formas alteradas

Nenhuma. O tipo do processo, o relatório da sonda, a carga do canal e a preferência de exibição
guardada pela webview seguem exatamente como a feature 004 os deixou.

## 5. O que é escrito em disco, e onde

| Escritor | Onde escreve | Regime |
|---|---|---|
| Empacotamento da webview | `out/res/webview/` | Como hoje, mais o mapa de fontes quando em modo de observação |
| Comando de empacotamento | Um arquivo de pacote na raiz do repositório, já ignorado pelo git | Substitui o anterior de mesmo nome; nada mais é tocado |
| Auxiliar do estado degradado | Pasta temporária do sistema | Cópia do workspace com um arquivo do Reversa truncado; imprime o caminho e nada mais |
| Preview | Nada | RN-02; o servidor lê e serve, e nem sequer escreve registro em arquivo |

## 6. Migrações necessárias

Não. Nada persistido muda de forma, e nada guardado por versão anterior precisa ser lido de modo
diferente. Quem tiver a extensão instalada de uma construção anterior continua com ela funcionando,
porque o pacote entregue não muda de conteúdo nesta feature, apenas de embalagem.
