# Contrato: linha de comando

> Feature `014-cli-do-processo`. Este arquivo é o contrato da fronteira entre a ferramenta e quem a
> invoca, seja uma pessoa, seja um script. Alterá-lo é alterar comportamento observável.

## 1. Invocação

```
npm run painel
npm run painel -- --workspace=/caminho/do/projeto
node ./scripts/painel.js --passada
node ./scripts/painel.js --dados > processo.json
```

A casca em `scripts/painel.js` resolve os argumentos e chama a unidade compilada. Quando a saída
compilada não existir, ela recusa rodar e nomeia o comando que a produz, no molde do preview, que
já faz isso com o pacote da tela.

## 2. Argumentos

| Argumento | Valor | Padrão | Efeito |
|---|---|---|---|
| `--workspace=<caminho>` | caminho de pasta | diretório corrente | A raiz a observar. Caminho inexistente é recusado com código de uso incorreto |
| `--passada` | sem valor | conforme a saída | Força uma impressão única, mesmo com terminal disponível |
| `--vivo` | sem valor | conforme a saída | Força a interface viva, mesmo com a saída redirecionada. Existe para depuração, e não para uso corrente |
| `--dados` | sem valor | desligado | Imprime a carga da leitura em JSON e termina. Implica `--passada` |
| `--sem-conferir` | sem valor | desligado | Não consulta a origem. Nenhuma conexão é aberta |
| `--sem-cor` | sem valor | desligado | Desenha sem cor, mesmo em terminal que a suporte |
| `--ajuda` | sem valor | desligado | Descreve o uso e termina com código zero |

Argumento não reconhecido é recusado, nomeado na mensagem, e nada de leitura é impresso.

## 3. Variáveis de ambiente

| Variável | Efeito |
|---|---|
| `NO_COLOR` | Declarada com qualquer valor, desliga a cor, como `--sem-cor` |
| `REVERSA_VIEWS_SEM_CONFERIR` | Declarada com qualquer valor, desliga a consulta à origem, como `--sem-conferir` |
| `VISUAL`, `EDITOR` | Quem abre o artefato selecionado. Detalhe em `abertura-no-editor.md` |

A bandeira e a variável são equivalentes e não se contradizem: qualquer uma das duas basta para
desligar. No editor, a mesma decisão é uma chave de configuração; aqui são estas duas, porque não
há painel de configuração no terminal.

## 4. Escolha do modo

1. `--dados` vence tudo e implica uma passada
2. `--passada` ou `--vivo`, quando presentes, decidem
3. Sem bandeira, a interface viva só nasce se a saída padrão for um terminal; do contrário, uma
   passada

A regra existe para que o uso em script funcione sem que ninguém precise lembrar de uma bandeira:
redirecionar a saída basta.

## 5. Canais

| Canal | O que sai por ele |
|---|---|
| Saída padrão | O quadro, na interface viva; o texto ou o JSON, na passada |
| Erro padrão | Mensagem de recusa, falha de leitura e aviso de uso incorreto |

Nada de diagnóstico se mistura à saída padrão, para que redirecionar uma não contamine a outra.

## 6. Códigos de saída

| Código | Quando |
|---|---|
| `0` | A leitura ocorreu, inclusive degradada, inclusive quando o Reversa não está instalado na raiz |
| `1` | A leitura falhou, e a ferramenta imprimiu o estado de erro nomeado |
| `2` | Uso incorreto: argumento não reconhecido, ou raiz inexistente |

Reversa não instalado **não** é erro: é uma resposta legítima, com tela própria, e um script que
varre projetos precisa distinguir isso de falha.

## 7. Formato de `--dados`

Um documento JSON, uma só vez, sem nenhuma linha de apresentação. O conteúdo é a carga que a ponte
envia à tela, acrescida do que a ferramenta sabe do próprio contexto:

```
{
  "raiz": "<raiz observada>",
  "lidoEm": "<instante da leitura>",
  "entrada": "<o estado nomeado da entrada>",
  "processo": { ... },
  "sonda": { ... },
  "conferencia": { ... } | null
}
```

Os nomes internos de `processo` e `sonda` são os do protocolo, e não se traduzem aqui: quem lê
dados quer o mesmo vocabulário que a suíte do protocolo já prende.

## 8. O que este contrato proíbe

- Escrever qualquer arquivo, em qualquer modo, por qualquer argumento
- Receber por argumento o endereço da consulta à origem, que continua fixado em tempo de compilação
- Aceitar caminho de artefato digitado pelo usuário para abrir no editor: o que se abre vem sempre
  da leitura
