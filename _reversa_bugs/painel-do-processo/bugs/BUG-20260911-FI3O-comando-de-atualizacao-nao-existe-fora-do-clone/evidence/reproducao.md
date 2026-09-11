# Cápsula de reprodução

Executada em 2026-09-11 pela sessão `/reversa-debugger-fix`, em máquina do próprio usuário.

| Item | Valor |
|---|---|
| Commit base | `fe6a5fffee50c281d200b450f8970031d9721bd4` |
| Ramo | `master` |
| Sistema | macOS 26.6.2 (darwin 25.6.0) |
| Node | v24.13.0 |
| npm | 11.6.2 |
| Classificação | determinística |
| Taxa | 3/3 nas três formas de chamada abaixo |

## O que se executou

Três formas de chamar o mesmo ritual, de diretórios fora do clone.

### Caso A — diretório com `package.json` e sem o script

Diretório temporário com um `package.json` mínimo, que é a situação do usuário em `erp-mineracao`.

```
$ npm run atualizar -- --aplicar
npm error Missing script: "atualizar"
código de saída: 1
```

### Caso B — diretório sem `package.json` algum

```
$ npm run atualizar -- --aplicar
npm error code ENOENT
npm error path /private/var/folders/.../package.json
código de saída: 254
```

### Caso C — o mesmo ritual chamado pelo caminho absoluto do script, do mesmo diretório neutro

```
$ node /Users/iagoleal/dev/reversa-views/scripts/atualizar.js
Clone em fe6a5ff, ramo master.
Em dia com a origem: não há commit a trazer.
código de saída: 0
```

## Leitura

Os casos A e B reproduzem o defeito e repetem o que as duas evidências anteriores já mostravam: a
falha é do npm, e o ritual não chega a começar.

O caso C é o achado desta cápsula, e é ele que fecha o caminho causal. **O ritual já é independente
do diretório corrente**: `scripts/atualizar.js` ancora a raiz em `path.resolve(__dirname, '..')`,
isto é, no clone onde o próprio arquivo mora, e não em `process.cwd()`. Chamado pelo caminho
absoluto, de um diretório temporário, ele conferiu o clone certo e saiu com o código certo.

O defeito, portanto, não está no ritual nem na raiz que ele escolhe: está **na forma de invocação
que a faixa anuncia**. `npm run` resolve o script pelo `package.json` do diretório corrente, e é essa
mediação, e só ela, que prende o comando ao clone. A correção é do endereço anunciado, não do
percurso executado, o que reduz o raio da mudança ao ponto em que o comando é soletrado.
