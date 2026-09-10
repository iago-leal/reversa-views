---
schema_version: 1
id: BUG-20260910-SVZU
display_number: 4
title: Ritual de atualização não alcança a construção instalada quando o clone já está em dia
status: active
phase: delivering
severity: high
priority: P1
created: 2026-09-10
updated: 2026-09-10

change_risk:
  classification: baixa
  reasons:
    - "Blast radius pequeno: um script de manutenção, fora do que o pacote instalado executa"
    - "Sem contrato externo: nenhum consumidor além do mantenedor e da própria suíte"
    - "Sem dados: o script não lê nem escreve estado histórico"
    - "Reversível por git: a mudança é de código versionado, sem migração nem efeito persistente"

origin:
  type: manual-report
  external_ref: null

area: empacotamento
module: empacotamento-e-verificacao
feature: atualizador
labels: [spec-gap]

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "2/2"
  suspected_triggers: []

blocking: []

relationships:
  - bug: BUG-20260909-VHII
    type: related-to
    state: proposed
    evidence: []

traceability:
  specs:
    - _reversa_sdd/addenda/007-atualizacao-e-progresso.md#resumo-da-entrega
    - _reversa_sdd/sdd/empacotamento-e-verificacao.md#6-requisitos-funcionais
    - _reversa_forward/007-atualizacao-e-progresso/requirements.md#a-o-comando-de-atualizacao-no-clone
  affected_code:
    - scripts/atualizar.js
    - README.md
  root_cause:
    state: confirmed
    hypothesis: "O ritual mede clone x origem e trata o percurso de construção, empacotamento e instalação como consequência da incorporação, não como ato próprio. Sem commits a trazer, `aplicar()` devolve o código da conferência antes de qualquer passo, e a construção instalada, que é o eixo que o painel mede, fica fora do alcance de todo comando."
    causal_path:
      - "A spec da feature 007 descreveu o percurso completo apenas dentro do ramo em que há commits a trazer (RF-06 e RF-07 do requirements)"
      - "`aplicar()` implementou essa leitura com a guarda `if (resultado.desfecho !== 'atrasada') return codigoDaConferencia(resultado)`"
      - "A suíte fixou o comportamento como desejado no caso `em dia, --aplicar não tem o que aplicar e sai em zero`, exigindo `feito` igual a `['buscar']`"
      - "O painel, por RF-17, mede a construção instalada contra a origem, e não o clone: os dois eixos divergem sempre que se constrói ou se incorpora sem instalar"
      - "Divergindo os eixos com o clone à frente, o aviso é verdadeiro e nenhum comando o alcança"
    evidence:
      - { ref: evidence/reproduction.md, observation: "clone em 3cec373 em dia com a origem, extensão instalada 0.7.5 carimbada em 9bd7648, conferência devolvendo em dia com código zero" }
      - { ref: evidence/construcao-instalada.txt, observation: "carimbo compilado da instalada e carimbo da árvore lado a lado, dois commits de distância" }
    code_refs:
      - { file: scripts/atualizar.js, symbol: aplicar, commit: 3cec3734014ca10188308f343250501e055bac7e }
      - { file: tests/atualizador.spec.ts, symbol: "em dia, --aplicar não tem o que aplicar e sai em zero", commit: 3cec3734014ca10188308f343250501e055bac7e }
  reproduction_tests:
    - "tests/atualizador.spec.ts :: o segundo eixo: a construção instalada (BUG-20260910-SVZU) > em dia, --aplicar refaz a construção deste clone e a instala"
  regression_tests:
    - "tests/atualizador.spec.ts :: em dia, o percurso roda sem incorporar nada: a incorporação segue condicionada (W004)"
    - "tests/atualizador.spec.ts :: sem --aplicar, o clone em dia continua sem efeito colateral algum (W001)"
    - "tests/atualizador.spec.ts :: em dia com árvore suja: recusa antes de construir, para não empacotar procedência falsa"
    - "tests/atualizador.spec.ts :: impossível conferir não constrói às cegas, e continua saindo em dois (W002, W003)"
    - "tests/atualizador.spec.ts :: em dia com commit próprio: constrói, porque a recusa de RF-05 é da incorporação"
    - "tests/atualizador.spec.ts :: em dia, --aplicar não incorpora coisa alguma e sai em zero"

spec_verdict: spec-desatualizada

change_set:
  - id: CHG-001
    kind: test
    artifact: tests/atualizador.spec.ts
    purpose: "Seis casos que fixam o segundo eixo do ritual; quatro deles vermelhos antes da correção"
    diff: fix/CHG-001.diff
  - id: CHG-002
    kind: code
    artifact: scripts/atualizar.js
    purpose: "A guarda passa a cortar apenas o desfecho impossível, e as duas recusas ganham alcances distintos"
    diff: fix/CHG-002.diff
  - id: CHG-003
    kind: documentation
    artifact: README.md
    purpose: "A seção do ritual passa a descrever os dois eixos e o novo significado de --aplicar"
    diff: fix/CHG-003.diff
  - id: CHG-004
    kind: specification
    artifact: _reversa_sdd/addenda/bug-BUG-20260910-SVZU-v001.md
    purpose: "Adendo do veredito spec-desatualizada, com as emendas de leitura e as regras W040 e W041"
    diff: null

closure:
  policy: package
  satisfied: false
resolution_kind: null
---

# Ritual de atualização não alcança a construção instalada quando o clone já está em dia

## Summary

O painel anuncia que a origem está dois commits à frente desta construção, e o anúncio é verdadeiro:
a extensão instalada é a `0.7.5`, carimbada em `9bd7648`, enquanto o clone já está em `3cec373`, em
dia com a origem. Nenhum dos dois atos do ritual desfaz esse estado. A conferência diz "em dia" e sai
com zero; a aplicação, atrás de `--aplicar`, retorna antes de qualquer passo porque o desfecho da
conferência não é `atrasada`. Não há, hoje, caminho documentado que reconstrua, empacote e reinstale
a extensão nessa situação, e o aviso reaparece a cada recarga da janela.

A causa aparente é a divergência entre dois eixos que a spec separa mas não reconcilia: o atualizador
mede **clone × origem**, e o painel mede **construção instalada × origem**. Os dois podem discordar, e
quando discordam o ritual mede o eixo que não é o do aviso.

## Expected Behavior

O adendo 007 fixa a separação em `#resumo-da-entrega`: "A primeira é entre clone e extensão instalada:
o painel apenas pergunta e anuncia, sem tocar em disco, e a atualização se aplica no clone, por
comando explícito". A mesma seção descreve o ritual como o percurso que termina em pacote gerado e
linha de instalação impressa, e o persona Mantenedor, na seção 5 do requirements da feature 007,
espera "ver o aviso no painel, rodar um comando no clone, aplicar a atualização e reinstalar o pacote".

O estado "clone em dia, construção instalada atrás" **nunca foi especificado**, e é por isso que este
bug carrega o label `spec-gap`. A spec previu o percurso completo apenas dentro do ramo em que há
commits a trazer: RF-06 e RF-07 do requirements da 007 descrevem construção, suíte, empacotamento e
instalação como passos posteriores à incorporação. Sem incorporação, nenhum deles roda.

Fica em aberto para o fix decidir, com o usuário, qual dos dois comportamentos é o correto: o ritual
reconhecer o eixo da construção instalada e refazê-la, ou nomear o desfecho e dizer o que fazer, sem
executar.

## Actual Behavior

Com o clone em `3cec373` e a extensão instalada em `0.7.5` (`9bd7648`):

```
$ npm run atualizar
Clone em 3cec373, ramo master.
Em dia com a origem: não há commit a trazer.
```

O painel, na mesma janela recarregada, segue exibindo "A origem está 2 commits à frente desta
construção". `npm run atualizar -- --aplicar` produziria a mesma saída e o mesmo código zero, porque
`aplicar()` em `scripts/atualizar.js` faz `if (resultado.desfecho !== 'atrasada') return
codigoDaConferencia(resultado)` antes de qualquer escrita.

A árvore, aliás, já foi construída: `src/host/build.ts` carimba `0.8.0` em `3cec3734…`. Falta apenas
empacotar e instalar, e é exatamente esse trecho do percurso que ficou inalcançável.

## Steps to Reproduce

1. Ter a extensão instalada de um commit anterior ao topo do clone (aqui, `0.7.5` de `9bd7648`)
2. Deixar o clone em dia com a origem, por `git pull` manual ou por uma aplicação anterior
3. Recarregar a janela do editor e abrir o painel: a faixa anuncia N commits à frente
4. Rodar `npm run atualizar`: responde "em dia", código zero
5. Rodar `npm run atualizar -- --aplicar`: responde o mesmo, sem construir nem instalar
6. Recarregar a janela de novo: a faixa continua igual

## Evidence

- `evidence/construcao-instalada.txt`: as duas construções lado a lado, a saída da conferência e o
  carimbo compilado da extensão instalada (`EXTENSION_VERSION = '0.7.5'`,
  `BUILT_FROM_COMMIT = '9bd764815b3d227e4fee794871221917084de38a'`)
- `../../intake/relato-20260910-1240.md`: o relato original, com as duas capturas transcritas

## Suspected Area

`aplicar()` em `scripts/atualizar.js`, na guarda que devolve cedo quando o desfecho não é `atrasada`,
e a seção "O ritual da atualização" do `README.md`, que descreve os dois atos sem prever este estado.
`conferir()` também é suspeita, por medir apenas o eixo do clone: ela não tem hoje como saber qual
construção está instalada.

## Acceptance Criteria

```gherkin
Cenário: o clone está em dia e a construção instalada não
  Dado um clone em dia com a origem
  E uma extensão instalada carimbada num commit anterior ao topo do clone
  Quando o mantenedor roda o ritual de atualização
  Então o desfecho nomeia que quem está atrás é a construção instalada, e não o clone
  E o percurso que termina em pacote instalado fica ao alcance de um comando

Cenário: os dois eixos em dia
  Dado um clone em dia e uma construção instalada do mesmo commit
  Quando o mantenedor roda o ritual duas vezes seguidas
  Então o desfecho é o mesmo nas duas, sem efeito colateral na segunda
```

O segundo cenário preserva a exigência de idempotência já registrada no adendo 007, seção
`#impacto-por-artefato-da-extracao`, linha de `#7-requisitos-nao-funcionais` do empacotamento.

## Traceability

| Eixo | Locator |
|---|---|
| Spec | `_reversa_sdd/addenda/007-atualizacao-e-progresso.md#resumo-da-entrega` |
| Spec | `_reversa_sdd/sdd/empacotamento-e-verificacao.md#6-requisitos-funcionais` |
| Spec | `_reversa_forward/007-atualizacao-e-progresso/requirements.md#a-o-comando-de-atualizacao-no-clone` |
| Código | `scripts/atualizar.js` |
| Código | `README.md` |

Relação `related-to` com `BUG-20260909-VHII`, em estado `proposed`: os dois tratam de extensão
instalada atrás do clone, mas por causas distintas. Aquele era instalação anterior à feature que
trouxe a consulta; este é o ritual que, com a consulta funcionando, não fecha o ciclo.

## Resolution

### Causa raiz (estado final: confirmed)

O ritual media clone contra origem e tratava construção, empacotamento e instalação como consequência
da incorporação, não como ato próprio. Sem commits a trazer, `aplicar()` devolvia o código da
conferência antes de qualquer passo. O painel mede outro eixo, construção instalada contra origem, e
os dois divergem sempre que se constrói ou se incorpora sem instalar. Divergindo com o clone à frente,
o aviso era verdadeiro e insanável.

O que fecha o caminho causal é a suíte: o caso `em dia, --aplicar não tem o que aplicar e sai em zero`
exigia que a lista de ações fosse exatamente `['buscar']`. O código não divergia da spec, cumpria-a à
risca. O defeito nasceu na especificação.

### Veredito de spec

`spec-desatualizada`, aprovado por iago em 2026-09-10. O adendo
`_reversa_sdd/addenda/bug-BUG-20260910-SVZU-v001.md` emenda a leitura de RF-04, RF-05, RF-06 e da linha
de Reprodutibilidade da feature 007, e especifica pela primeira vez o cenário dos dois eixos. Nenhuma
spec original foi editada.

O ponto emendado que mais importa: a linha de Reprodutibilidade dizia que rodar o atualizador duas
vezes com o clone em dia não tem efeito colateral na segunda. Passa a valer só para a conferência. A
aplicação tem efeito colateral deliberado, e tê-lo é o ponto.

### Change set

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | test | `tests/atualizador.spec.ts` | Seis casos que fixam o segundo eixo, quatro vermelhos antes |
| CHG-002 | code | `scripts/atualizar.js` | A guarda corta só o impossível; as recusas ganham alcances distintos |
| CHG-003 | documentation | `README.md` | A seção do ritual descreve os dois eixos e o novo significado de `--aplicar` |
| CHG-004 | specification | `_reversa_sdd/addenda/bug-BUG-20260910-SVZU-v001.md` | O adendo do veredito, com W040 e W041 |

Diffs em `fix/CHG-001.diff`, `fix/CHG-002.diff` e `fix/CHG-003.diff`. O plano aprovado antes de
qualquer escrita está em `fix/plan.html`.

### A mudança, em uma frase

`--aplicar` deixou de significar "traga os commits e, por causa disso, reconstrua" e passou a
significar "deixe a instalação em dia com este clone".

### Prova vermelho a verde

Antes da correção, com os testes aplicados:

```
 Test Files  1 failed (1)
      Tests  4 failed | 30 passed (34)
```

Os quatro vermelhos eram exatamente os que exigiam o comportamento novo: o percurso completo em dia, o
percurso sem incorporação, a recusa por árvore suja no caminho em dia e a construção com commit
próprio. Os dois casos de regressão pura já passavam, porque protegem o que não podia quebrar.

Depois da correção:

```
 Test Files  1 passed (1)
      Tests  34 passed (34)
```

E a suíte inteira do projeto:

```
 Test Files  83 passed (83)
      Tests  1313 passed (1313)
```

## Agent Notes

Restrições para quem for corrigir:

- O contorno manual existe e está descrito no README para o caso de bootstrap: `npm run build`,
  `npm test`, `npm run empacotar` e `code --install-extension <pacote>`. Ele resolve o sintoma sem
  resolver o defeito, e não deve ser confundido com correção.
- Severidade `high` e prioridade `P1` foram decididas pelo usuário na triagem de 2026-09-10.
- `closure.policy: package` também foi decidida nessa triagem, e passou a valer para todo o registro:
  resolvido exige a versão corrigida empacotada e instalada, não apenas a suíte verde.
- O label `spec-gap` obriga o fix a levar o veredito de spec ao usuário antes de escolher a forma da
  correção: a pergunta "o ritual deve reinstalar sozinho, ou apenas nomear?" é decisão de desenho, e
  o adendo 007 tem precedente forte para a segunda resposta, no NG-01 da spec de herança, que proíbe
  automatizar o que exige decisão humana.
