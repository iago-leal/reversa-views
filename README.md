# reversa-views

Extensão de VS Code que mostra, num painel lateral, em que ponto do processo do
Reversa um projeto está: a descoberta feita, a feature ativa, os artefatos
escritos e as ações executadas. A extensão apenas **lê**; nada do que ela mostra
é escrito por ela.

A leitura não é código próprio. Ela é herdada do `scrum-harness`, copiada para
`src/heranca/` e mantida sob um regime de procedência verificável, descrito
abaixo.

## Como construir

```bash
npm install
npm test          # as suítes, com Vitest
npm run build     # confere a herança, gera a revisão e compila as duas unidades
```

O `build` roda, nesta ordem, a conferência local da herança, a geração da
constante de revisão, a compilação do host e o empacotamento da webview. A
conferência local não depende de máquina configurada, e é por isso que ela pode
estar no build: ela só olha o que está versionado neste repositório.

## O ritual da herança

`src/heranca/` guarda 37 arquivos copiados de outros repositórios. Cada um traz
um carimbo de sete linhas dizendo de onde veio e em que revisão, e o manifesto
em `src/heranca/manifesto.yml` guarda o resumo criptográfico do conteúdo de cada
um. O registro em prosa, com o porquê de cada escolha, está em
`src/heranca/PROCEDENCIA.md`.

### Quando rodar o ritual

Três sinais disparam a conferência, e nenhum deles é o calendário:

1. **Anomalia de campo desconhecido no painel.** A camada de leitura encontrou
   no estado do Reversa um campo que não conhece. Ou o Reversa mudou, ou a cópia
   ficou para trás.
2. **Versão nova do Reversa instalada** no projeto observado. O que a leitura
   entende pode ter mudado com ela.
3. **Release nova da origem do kit de extensão.** O padrão de webview que esta
   extensão segue veio de lá, e vale reler o que mudou.

### Os dois comandos

```bash
npm run check:heranca         # confronta a cópia com as origens configuradas
npm run check:heranca:local   # confere só o que está versionado aqui
npm run sync:heranca          # planeja a ressincronização; escreve com --aplicar
```

O verificador precisa saber onde as origens estão clonadas **nesta máquina**.
Isso não entra no manifesto nem no código: copie `heranca.origens.exemplo.yml`
para `heranca.origens.yml`, que o git ignora, e aponte cada chave para a pasta
correspondente. Sem esse arquivo o verificador não falha: ele relata a origem
como indisponível e conclui as conferências que não dependem dela.

O relatório separa o que **impede** de prosseguir do que apenas **informa**.
Origem que avançou informa, e é o sinal para ressincronizar. Arquivo editado
localmente impede, porque ninguém além de quem editou sabe se aquilo era uma
adaptação ou um descuido.

### Quando o ressincronizador para

Ele para em três situações, e nenhuma delas é resolvível por script:

- **Edição local não declarada.** Um arquivo herdado difere do resumo do
  manifesto. Há duas saídas, e escolher é seu: **declarar a adaptação** em
  `src/heranca/adaptacoes.yml`, com o trecho original e o adaptado, ou
  **descartar a edição**, restaurando o arquivo pela cópia da origem.
- **Adaptação que deixou de casar.** O trecho original de uma adaptação não
  aparece mais, ou aparece mais de uma vez, no conteúdo atual da origem. A
  ferramenta mostra o esperado e o encontrado; atualize o trecho declarado ou
  remova a adaptação, se a origem já resolveu o que ela corrigia.
- **Arquivo preso por paridade externa.** Um dos fixtures herdados é conferido
  byte a byte contra um arquivo instalado fora da pasta da herança. Mexer só de
  um lado quebraria a paridade, e a ferramenta prefere parar a escolher por você.

Depois de aplicar uma ressincronização, rode `npm run gerar:revisao-heranca`
para que a revisão que o painel mostra volte a coincidir com o manifesto. O
`build` faz isso sozinho.

## O limite conhecido do regime

O resumo criptográfico prova que o **texto** de um arquivo herdado é o mesmo que
foi copiado. Ele não prova que o **comportamento** é o mesmo, e essa distinção
importa mais do que parece.

O caso claro é a **dependência transitiva**: um arquivo herdado que importa uma
biblioteca continua com o resumo intacto quando essa biblioteca muda de versão
por baixo dele. Nada no manifesto acusa isso, porque nada no arquivo mudou.

A rede que resta são as **suítes herdadas**, copiadas junto com o código que
elas testam e rodadas aqui a cada `npm test`. Elas exercitam o comportamento, e
não o texto, e é por isso que valeu copiá-las. Elas não cobrem tudo, mas são o
que separa o regime de uma promessa.
