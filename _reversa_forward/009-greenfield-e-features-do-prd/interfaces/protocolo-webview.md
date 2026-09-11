# Contrato: canal de mensagens entre a webview e o host

> Identificador: `009-greenfield-e-features-do-prd`
> Data: `2026-09-11`
> Roadmap: `_reversa_forward/009-greenfield-e-features-do-prd/roadmap.md`
> Tipo: arquivo, mensagens `postMessage` tipadas em `src/host/protocol.ts`

## 1. O que este documento é

O delta que a feature 009 impõe ao contrato do canal, escrito como as features 006, 007 e 008
escreveram os seus. Não há transporte externo: o canal é o `postMessage` entre o processo da
extensão e a webview, e o contrato é o tipo. A regra vigente desde a feature 002 é a de acréscimo:
campos entram, nunca são renomeados nem removidos, e as duas declarações do payload, a de
`protocol.ts` e a do retorno de `reading.ts`, são mantidas em sincronia por suíte.

## 2. Campo novo em `setProcess`

```ts
export interface SetProcessData {
  // ...os nove campos anteriores, intactos...
  /** The greenfield axis of the project (feature 009); absent when the reading was not made. */
  greenfield: GreenfieldAxis
}
```

O campo é obrigatório no tipo, como `bugs` e `history` são, e ausente apenas na prática, quando um
host anterior fala com uma tela nova. A tela trata a ausência como leitura não realizada, e o
distingue por `payload.greenfield === undefined`, jamais por cenário ou por lista vazia (RN-08).

A forma de `GreenfieldAxis` está no `data-delta.md`, seção 4. O que interessa ao canal:

| Campo | Viaja | Observação |
|-------|-------|------------|
| `cenario`, `estagio` | sim | vocabulários fechados do lado local |
| `artefatos`, `caminhos` | sim | presença e caminho relativo à raiz, para `openFile` |
| `metadado` | sim | crus, inclusive tokens desconhecidos; nulo quando ausente |
| `resumo` | sim | uma linha, já derivada |
| `panorama.componentes`, `foraDoPlano`, `escopo` | sim | sem ordem de exibição; a tela ordena |
| `panorama.totalDeSpecs`, `truncado`, `convergidos` | sim | a contagem contra a qual a tela se mede |
| `anomalias`, `truncados` | sim | forma comum `DisplayAnomaly`; caminhos truncados |
| corpo do brief, do PRD, das specs | não | só o que deles foi derivado atravessa |

## 3. O que não muda

- Nenhum comando novo em nenhuma direção. `openFile` já recebe caminho relativo, e é o que os
  cartões novos disparam para spec, adendo, `prd.md` e os quatro artefatos da origem.
- `requestSummaryText`, `copySummary` e o rascunho seguem com o mesmo texto, que apenas ganha o bloco
  "Panorama do produto" entre "Feature ativa" e "Entregas anteriores".
- `setNotice`, `setUpdate`, `setPreferences` e `setTheme` não são tocados.
- O teto `SUMMARY_TEXT_CAP` de 65.536 bytes segue valendo, e o bloco novo cabe com folga: são poucas
  dezenas de linhas para cinquenta componentes.

## 4. Idempotência, tempo e erro

- Idempotência: `setProcess` é a fotografia inteira, substituída a cada leitura, como antes. Duas
  mensagens iguais desenham o mesmo painel; nada acumula.
- Tempo: não há timeout novo. A leitura do eixo acontece dentro do mesmo `try` de `reading.ts`, e o
  teto de 200 ms de `tests/desempenho-referencia.spec.ts` passa a cobri-la.
- Erro: uma falha ao ler o eixo cai no `catch` já existente e vira leitura não realizada com aviso,
  como para o histórico e o registro; nunca derruba os outros nove campos.

## 5. Compatibilidade

| Host | Tela | O que acontece |
|------|------|----------------|
| anterior | anterior | nada muda |
| anterior | nova | dois cartões em "leitura não realizada"; sem faixa de bloqueio greenfield; seções em onze com dois vazios nomeados |
| nova | anterior | campo `greenfield` ignorado; tela igual à de antes |
| nova | nova | o comportamento desta feature |

O par host anterior e tela nova não ocorre na instalação por `.vsix`, que empacota os dois juntos;
está aqui porque a regra de acréscimo é o que torna a suíte de protocolo capaz de prová-lo, e é
prova que custa três linhas.

## 6. Suítes que fixam este contrato

- `tests/host-protocol.spec.ts`: dez campos por nome, e os nove anteriores intactos.
- `tests/host-reading.spec.ts`: o eixo montado no mesmo `try`, e a falha isolada.
- `tests/host-session.spec.ts`: o campo enviado.
- `tests/webview-sections.spec.ts`: onze nomes, e os dois vazios quando o campo falta.
