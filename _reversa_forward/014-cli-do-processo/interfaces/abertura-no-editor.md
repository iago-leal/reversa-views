# Contrato: abertura no editor do ambiente

> Feature `014-cli-do-processo`. Este é o contrato da única capacidade da ferramenta que cria um
> processo, e por isso o mais vigiado dos três.

## 1. Por que ele existe em separado

Dentro do editor, abrir um arquivo é uma chamada da interface do próprio editor. No terminal, é
criação de processo, capacidade que a spec da camada de leitura proíbe no NG-01 e no RNF-04. A
proibição continua valendo onde foi escrita, e a capacidade nova nasce fora dela, num módulo que a
camada de leitura não alcança e do qual não recebe nada. É a mesma doutrina de camadas apartadas
que o PRD escreveu para o botão futuro de disparar agentes.

## 2. Quem é chamado

1. O valor de `VISUAL`, se declarado e não vazio
2. Senão, o valor de `EDITOR`, pelo mesmo critério
3. Senão, nenhum. A interface informa qual variável definir e segue viva

O valor é dividido em palavras: a primeira é o executável, as demais são argumentos fixos que
precedem o caminho. É o que faz `code -w` e `subl -w` funcionarem.

## 3. Como é chamado

| Propriedade | Valor | Razão |
|---|---|---|
| Interpretação por shell | **Nunca** | Caminho de artefato pode conter espaço, e o shell interpretaria metacaractere de nome de arquivo |
| Argumento de caminho | Um só, o do artefato | Nada mais é concatenado |
| Origem do caminho | Sempre a leitura | Jamais texto digitado pelo usuário, e sempre resolvido sob a raiz observada |
| Canais | Herdados do terminal | O editor precisa da tela inteira, e não de um cano |
| Espera | Síncrona | A interface fica suspensa enquanto o editor estiver aberto |

## 4. A dança da suspensão

A ordem é contrato, porque é onde o terminal se quebra quando alguém erra:

1. Sair da tela alternativa, repor o cursor, desligar o modo bruto
2. Criar o processo do editor e esperar
3. Religar o modo bruto, esconder o cursor, entrar na tela alternativa
4. Redesenhar o quadro inteiro, preservando seleção e seções fechadas

O passo 4 é integral e não incremental: o editor pode ter escrito qualquer coisa na tela, e
presumir o contrário produz resíduo visual.

## 5. Falhas

| Situação | Comportamento |
|---|---|
| Nenhuma variável declarada | A interface diz qual definir e segue viva. Não é erro |
| Executável inexistente | A interface nomeia o que tentou executar e segue viva |
| O editor termina com código diferente de zero | A interface volta normalmente; o código do editor não vira código da ferramenta |
| A linha selecionada não aponta artefato algum | A tecla não faz nada, e a barra de estado diz por quê |

Em todas elas o terminal é restaurado antes da mensagem, para que a mensagem seja legível.

## 6. O que este contrato proíbe

- Executar qualquer coisa que não seja o editor declarado no ambiente
- Passar pelo shell, em qualquer circunstância
- Abrir caminho que não tenha vindo da leitura
- Escrever no arquivo aberto. Quem escreve é o editor, sob o comando de quem o abriu
