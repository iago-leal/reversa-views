# Onboarding: vínculo entre spec e entrega, e conferências do onboarding

> Identificador: `010-vinculo-spec-e-conferencias`
> Data: `2026-09-19`
> Roadmap: `_reversa_forward/010-vinculo-spec-e-conferencias/roadmap.md`

Roteiro para quem vai ver a feature funcionar pela primeira vez. Cada passo diz o que rodar e o
que deve aparecer. Nada aqui escreve no projeto observado: o script de degradação escreve só em
pasta temporária do sistema.

## 1. Preparar

```sh
cd ~/dev/reversa-views
npm ci
npm test
npm run typecheck
```

A suíte inteira precisa estar verde. Se `tests/host-protocol.spec.ts` falhar dizendo que o topo da
carga tem onze campos, algum campo novo foi posto no lugar errado: todos entram dentro de
estruturas existentes.

## 2. Este repositório não muda de panorama

```sh
node scripts/preview.js
```

No Panorama do produto, confira:

- "5 de 5 componentes planejados convergidos", como na 009;
- cada componente com a sua pasta e a origem "pelo nome", em texto;
- o bloco "Entregues sem spec" com a frase de que não há componente sem spec;
- "Fora do plano" com 006, 007, 008, 009 e 010, esta com a marca de ativa.

No histórico, cada pasta de 001 a 009 diz "sem registro de conferências". A 010 mostra a contagem
da seção 7 deste documento.

## 3. O `financas-ali`, projeto em que os nomes não coincidem

```sh
node scripts/preview.js --workspace=$HOME/dev/financas-ali
```

No Panorama:

- `ajustes`, `fundacao-persistencia` e `telas-e-navegacao` ligados à 002 com a origem "declarada";
  clicar na ligação abre o `legacy-impact.md` da 002;
- as specs que a 001 entregou ligadas à 001, também "declarada";
- cinco specs ainda "planejada", entre elas `boletos-faturas` e `categorizacao-regras`;
- o bloco "Entregues sem spec" com `acesso-e-identidade`, `assistente` e `operacao-de-producao`, e
  a frase "3 componentes entregues sem spec" separada da contagem de planejados;
- "Fora do plano" vazio.

No histórico:

- a 002 continua `convergida`, com "N de 20 conferências registradas" ao lado; anote o N do dia (em
  2026-09-19, às 15h47, eram 3);
- clicar na contagem abre o `onboarding.md` da 002;
- a 001 continua `entregue-sem-adendo` e diz "sem registro de conferências".

A faixa de bloqueio **não** nomeia a 002 por causa das conferências pendentes.

## 4. Os estados que nenhum projeto saudável produz

Cada caso cria uma cópia adoecida e imprime o caminho:

```sh
node scripts/preview.js --workspace=$(node scripts/estragar-vinculo.js --caso=declarada)
node scripts/preview.js --workspace=$(node scripts/estragar-vinculo.js --caso=sem-spec)
node scripts/preview.js --workspace=$(node scripts/estragar-vinculo.js --caso=conferencias)
node scripts/preview.js --workspace=$(node scripts/estragar-vinculo.js --caso=conferencias-sem-tabela)
node scripts/preview.js --workspace=$(node scripts/estragar-vinculo.js --caso=impacto-grande)
```

| Caso | O que deve aparecer |
|------|---------------------|
| `declarada` | specs renomeadas ligadas às pastas pela origem "declarada", sem pasta homônima |
| `sem-spec` | uma linha em "Entregues sem spec" com a pasta que a declara |
| `conferencias` | "2 de 20 conferências registradas" numa pasta convergida, que continua convergida; faixa sem razão nova |
| `conferencias-sem-tabela` | anomalia `tabela-nao-reconhecida` com a seção e o cabeçalho no detalhe |
| `impacto-grande` | vínculo da pasta declarado parcial; anomalia `artefato-da-entrega-nao-lido`; o relatório da sonda não muda, porque o arquivo é da sonda local |

Em nenhum caso o workspace observado muda: `git status` em `~/dev/reversa-views` deve ficar igual
antes e depois.

## 5. Tela nova contra host antigo

`tests/webview-panorama-section.spec.tsx` e `tests/webview-render.spec.tsx` desenham a tela com a
carga sem os campos novos. O panorama diz "vínculo declarado não lido" e o histórico diz
"conferências não lidas", sem bloco vazio.

## 6. Resumo consultável

No painel, peça o resumo em documento e depois em cópia. Os dois textos são idênticos e trazem, no
`financas-ali`, as três linhas dos componentes sem spec e a contagem de conferências da 002.

## 7. Registro de conferências

| Data | Marco | Item | Resultado | Observação |
|------|-------|------|-----------|------------|
| | Preparar | seção 1 | | |
| | Este repositório | seção 2 | | |
| | financas-ali | seção 3 | | |
| | Degradação | seção 4, cinco casos | | |
| | Tela contra host antigo | seção 5 | | |
| | Resumo | seção 6 | | |
