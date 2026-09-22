# Cápsula de reprodução

- **Commit base:** `a9d29b3` (master), árvore limpa
- **Ambiente:** macOS 27.0, Node v24.13.0, pacote `yaml` do projeto; a origem `scrum-harness` não
  está nesta máquina, e por isso nada aqui depende dela
- **Classificação:** determinística; 1/1 por arquivo herdado, repetida duas vezes com o mesmo
  resultado (2026-09-19 e 2026-09-22)
- **Exit code:** 0 do medidor; 0 do `npm run check:heranca:local`, que não acusa nada

## Comando

`node _reversa_bugs/painel-do-processo/bugs/BUG-20260919-BQBJ-adaptacao-indentada-nao-e-literal/evidence/ida-e-volta.js`,
na raiz. Para cada arquivo do manifesto que declara adaptações, o medidor:

1. tira o carimbo do arquivo local, como o verificador faz;
2. desfaz as adaptações em ordem inversa (troca `adaptado` por `original`), reconstruindo a origem
   sem precisar dela, com o mesmo `aplicar()` de `scripts/heranca/adaptacoes.js`;
3. reaplica as adaptações em ordem sobre a origem reconstruída e compara com o arquivo local.

A ordem inversa é o que torna a conferência honesta com A12 e A14: A14 é desfeita antes de A12, e
o adaptado de A12 reaparece no ponto em que A12 o procura.

## Resultado

Saída em `ida-e-volta-2026-09-22.txt`: `impact.ts` para em A4 e `impact.spec.ts` para em A5, ambos
com motivo `ausente`; os outros seis reproduzem o arquivo exatamente, e `reversa-probe/src/index.ts`
não é simulado porque A3 é supressão pura (adaptado vazio), que não se pode desfazer sem saber onde
o trecho estava.

Com A4 e A5 declaradas com o indicador `|2`, numa cópia do `adaptacoes.yml`, os sete simulados
reproduzem o arquivo exatamente.
